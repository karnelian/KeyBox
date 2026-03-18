use tauri::State;
use uuid::Uuid;

use crate::crypto::aes_gcm_cipher;
use crate::db::queries;
use crate::error::AppError;
use crate::models::secret::*;
use crate::state::AppState;

#[tauri::command]
pub fn create_secret(
    input: CreateSecretInput,
    state: State<'_, AppState>,
) -> Result<Secret, AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    let id = Uuid::new_v4().to_string();
    let tags_json = serde_json::to_string(&input.tags).unwrap_or_default();

    // 시크릿 값 암호화
    let (encrypted, nonce) = aes_gcm_cipher::encrypt(input.secret_value.as_bytes(), &enc_key)?;

    queries::insert_secret(
        &db,
        &id,
        &input.name,
        &encrypted,
        &nonce,
        &input.service,
        input.category_id.as_deref(),
        input.project_id.as_deref(),
        &tags_json,
        &input.notes,
        &input.environment,
    )?;

    // 삽입된 행 조회
    let row = queries::get_secret_row(&db, &id)?;
    Ok(row_to_secret(row, &input.secret_value))
}

#[tauri::command]
pub fn get_secrets(
    filter: Option<GetSecretsFilter>,
    state: State<'_, AppState>,
) -> Result<Vec<SecretListItem>, AppError> {
    let _enc_key = state.get_encryption_key()?; // 잠금 확인
    let db = state.db.lock().unwrap();
    let f = filter.unwrap_or_default();
    queries::list_secrets(&db, &f)
}

#[tauri::command]
pub fn get_secret(id: String, state: State<'_, AppState>) -> Result<Secret, AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    let row = queries::get_secret_row(&db, &id)?;

    // 복호화
    let plaintext = aes_gcm_cipher::decrypt(&row.encrypted_value, &enc_key, &row.nonce)?;
    let secret_value =
        String::from_utf8(plaintext).map_err(|e| AppError::CryptoError(e.to_string()))?;

    Ok(row_to_secret(row, &secret_value))
}

#[tauri::command]
pub fn update_secret(
    input: UpdateSecretInput,
    state: State<'_, AppState>,
) -> Result<Secret, AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    // 시크릿 값 변경 시 재암호화
    let (enc_val, enc_nonce) = if let Some(ref new_value) = input.secret_value {
        let (e, n) = aes_gcm_cipher::encrypt(new_value.as_bytes(), &enc_key)?;
        (Some(e), Some(n))
    } else {
        (None, None)
    };

    let tags_json = input.tags.as_ref().map(|t| serde_json::to_string(t).unwrap_or_default());

    let cat_id = input.category_id.as_ref().map(|c| c.as_deref());
    let proj_id = input.project_id.as_ref().map(|p| p.as_deref());

    queries::update_secret_fields(
        &db,
        &input.id,
        input.name.as_deref(),
        enc_val.as_deref(),
        enc_nonce.as_deref(),
        input.service.as_deref(),
        cat_id,
        proj_id,
        tags_json.as_deref(),
        input.notes.as_deref(),
        input.environment.as_deref(),
    )?;

    // 갱신된 행 반환
    let row = queries::get_secret_row(&db, &input.id)?;
    let plaintext = aes_gcm_cipher::decrypt(&row.encrypted_value, &enc_key, &row.nonce)?;
    let secret_value =
        String::from_utf8(plaintext).map_err(|e| AppError::CryptoError(e.to_string()))?;

    Ok(row_to_secret(row, &secret_value))
}

#[tauri::command]
pub fn delete_secret(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let _enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();
    queries::delete_secret(&db, &id)
}

#[tauri::command]
pub fn copy_to_clipboard(
    id: String,
    clear_seconds: Option<u64>,
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    let row = queries::get_secret_row(&db, &id)?;
    let plaintext = aes_gcm_cipher::decrypt(&row.encrypted_value, &enc_key, &row.nonce)?;
    let secret_value =
        String::from_utf8(plaintext).map_err(|e| AppError::CryptoError(e.to_string()))?;

    use tauri_plugin_clipboard_manager::ClipboardExt;
    app_handle
        .clipboard()
        .write_text(&secret_value)
        .map_err(|e| AppError::CryptoError(format!("Clipboard error: {}", e)))?;

    // 사용자 설정값으로 클립보드 클리어 (0이면 비활성)
    let secs = clear_seconds.unwrap_or(30);
    if secs > 0 {
        let handle = app_handle.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_secs(secs));
            let _ = handle.clipboard().write_text("");
        });
    }

    Ok(())
}

#[tauri::command]
pub fn search_secrets(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<SecretListItem>, AppError> {
    let _enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();
    let filter = GetSecretsFilter {
        query: Some(query),
        ..Default::default()
    };
    queries::list_secrets(&db, &filter)
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvImportResult {
    pub imported: usize,
    pub skipped: usize,
}

#[tauri::command]
pub fn import_env_file(
    path: String,
    project_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<EnvImportResult, AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    let content = std::fs::read_to_string(&path)
        .map_err(|e| AppError::ExportError(format!("파일을 읽을 수 없습니다: {}", e)))?;

    let mut imported = 0;
    let mut skipped = 0;

    for line in content.lines() {
        let line = line.trim();
        // 빈 줄, 주석 건너뛰기
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        // KEY=VALUE 파싱
        if let Some((key, value)) = line.split_once('=') {
            let key = key.trim();
            let value = value.trim().trim_matches('"').trim_matches('\'');

            if key.is_empty() || value.is_empty() {
                skipped += 1;
                continue;
            }

            let id = uuid::Uuid::new_v4().to_string();
            let (encrypted, nonce) = aes_gcm_cipher::encrypt(value.as_bytes(), &enc_key)?;

            match queries::insert_secret(
                &db,
                &id,
                key,
                &encrypted,
                &nonce,
                "",  // service - .env에서는 알 수 없음
                None,
                project_id.as_deref(),
                "[]",
                "",
                "",
            ) {
                Ok(_) => imported += 1,
                Err(_) => skipped += 1,
            }
        } else {
            skipped += 1;
        }
    }

    Ok(EnvImportResult { imported, skipped })
}

#[tauri::command]
pub fn toggle_pin(id: String, state: State<'_, AppState>) -> Result<bool, AppError> {
    let _enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();
    queries::toggle_pin(&db, &id)
}

#[tauri::command]
pub fn get_secret_counts(state: State<'_, AppState>) -> Result<SecretCounts, AppError> {
    let _enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();
    queries::get_secret_counts(&db)
}

// --- Helper ---

fn row_to_secret(row: queries::SecretRow, secret_value: &str) -> Secret {
    let tags: Vec<String> = serde_json::from_str(&row.tags).unwrap_or_default();
    Secret {
        id: row.id,
        name: row.name,
        secret_value: secret_value.to_string(),
        service: row.service,
        category_id: row.category_id,
        project_id: row.project_id,
        pinned: row.pinned,
        tags,
        notes: row.notes,
        environment: row.environment,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}
