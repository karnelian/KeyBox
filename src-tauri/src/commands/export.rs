use serde::{Deserialize, Serialize};
use tauri::State;

use crate::crypto::aes_gcm_cipher;
use crate::db::queries;
use crate::error::AppError;
use crate::models::category::Category;
use crate::state::AppState;

/// export_data / import_data 에서 사용하는 직렬화 포맷
#[derive(Debug, Serialize, Deserialize)]
struct ExportSecret {
    id: String,
    name: String,
    secret_value: String,
    service: String,
    category_id: Option<String>,
    project_id: Option<String>,
    pinned: bool,
    tags: Vec<String>,
    notes: String,
    environment: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExportData {
    version: u32,
    categories: Vec<Category>,
    secrets: Vec<ExportSecret>,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub categories_imported: usize,
    pub secrets_imported: usize,
}

/// 모든 카테고리와 시크릿을 복호화하여 JSON 파일로 내보냅니다.
#[tauri::command]
pub fn export_data(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    let categories = queries::list_categories(&db)?;

    let filter = crate::models::secret::GetSecretsFilter::default();
    let list = queries::list_secrets(&db, &filter)?;

    let mut secrets = Vec::new();
    for item in list {
        let row = queries::get_secret_row(&db, &item.id)?;
        let plaintext = aes_gcm_cipher::decrypt(&row.encrypted_value, &enc_key, &row.nonce)?;
        let secret_value =
            String::from_utf8(plaintext).map_err(|e| AppError::CryptoError(e.to_string()))?;

        let tags: Vec<String> = serde_json::from_str(&row.tags).unwrap_or_default();
        secrets.push(ExportSecret {
            id: row.id,
            name: row.name,
            secret_value,
            service: row.service,
            category_id: row.category_id,
            project_id: row.project_id,
            pinned: row.pinned,
            tags,
            notes: row.notes,
            environment: row.environment,
            created_at: row.created_at,
            updated_at: row.updated_at,
        });
    }

    let export = ExportData {
        version: 1,
        categories,
        secrets,
    };

    let json = serde_json::to_string_pretty(&export)
        .map_err(|e| AppError::ExportError(e.to_string()))?;

    // JSON을 암호화하여 저장 (KBEX 헤더 + AES-256-GCM)
    let (ciphertext, nonce) = aes_gcm_cipher::encrypt(json.as_bytes(), &enc_key)?;

    let mut output = Vec::new();
    output.extend_from_slice(b"KBEX");        // 4-byte 매직 헤더
    output.extend_from_slice(&[1u8]);          // 버전
    output.extend_from_slice(&nonce);          // 12-byte nonce
    output.extend_from_slice(&ciphertext);     // 암호화된 데이터

    std::fs::write(&path, output).map_err(|e| AppError::ExportError(e.to_string()))?;

    Ok(())
}

/// JSON 파일을 가져와 카테고리와 시크릿을 현재 DB에 병합합니다.
/// 중복 ID는 건너뜁니다.
#[tauri::command]
pub fn import_data(
    path: String,
    state: State<'_, AppState>,
) -> Result<ImportResult, AppError> {
    let enc_key = state.get_encryption_key()?;
    let db = state.db.lock().unwrap();

    let file_bytes =
        std::fs::read(&path).map_err(|e| AppError::ExportError(e.to_string()))?;

    // KBEX 암호화 포맷 감지
    let json = if file_bytes.len() > 17 && &file_bytes[0..4] == b"KBEX" {
        // 암호화된 파일: KBEX(4) + version(1) + nonce(12) + ciphertext
        let nonce = &file_bytes[5..17];
        let ciphertext = &file_bytes[17..];
        let plaintext = aes_gcm_cipher::decrypt(ciphertext, &enc_key, nonce)
            .map_err(|_| AppError::ExportError("복호화 실패 — 같은 마스터 패스워드로 내보낸 파일인지 확인하세요".to_string()))?;
        String::from_utf8(plaintext).map_err(|e| AppError::ExportError(e.to_string()))?
    } else {
        // 레거시 평문 JSON (하위 호환)
        String::from_utf8(file_bytes).map_err(|e| AppError::ExportError(e.to_string()))?
    };

    let data: ExportData =
        serde_json::from_str(&json).map_err(|e| AppError::ExportError(e.to_string()))?;

    let mut categories_imported = 0usize;
    let mut secrets_imported = 0usize;

    // 카테고리 삽입 (이름 중복 시 건너뜀)
    for cat in &data.categories {
        match queries::insert_category(&db, &cat.id, &cat.name, &cat.icon) {
            Ok(_) => categories_imported += 1,
            Err(AppError::CategoryDuplicate(_)) => {} // 이미 존재 — 건너뜀
            Err(e) => return Err(e),
        }
    }

    // 시크릿 삽입 (ID 중복 시 건너뜀)
    for s in &data.secrets {
        // ID 중복 체크
        if queries::get_secret_row(&db, &s.id).is_ok() {
            continue;
        }

        let (encrypted, nonce) =
            aes_gcm_cipher::encrypt(s.secret_value.as_bytes(), &enc_key)?;
        let tags_json = serde_json::to_string(&s.tags).unwrap_or_default();

        match queries::insert_secret(
            &db,
            &s.id,
            &s.name,
            &encrypted,
            &nonce,
            &s.service,
            s.category_id.as_deref(),
            s.project_id.as_deref(),
            &tags_json,
            &s.notes,
            &s.environment,
        ) {
            Ok(_) => secrets_imported += 1,
            Err(e) => return Err(e),
        }
    }

    Ok(ImportResult {
        categories_imported,
        secrets_imported,
    })
}
