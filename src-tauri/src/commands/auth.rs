use tauri::State;

use crate::crypto::{argon2_kdf, hkdf_derive};
use crate::db::queries;
use crate::error::AppError;
use crate::state::AppState;

/// 최초 설정 여부 확인
#[tauri::command]
pub fn check_setup(state: State<'_, AppState>) -> Result<bool, AppError> {
    let db = state.db.lock().unwrap();
    let salt = queries::get_config(&db, "salt")?;
    Ok(salt.is_some())
}

/// 마스터 패스워드 설정 (최초 1회)
#[tauri::command]
pub fn setup_master_password(
    password: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    if password.len() < 8 {
        return Err(AppError::PasswordTooShort);
    }

    let db = state.db.lock().unwrap();

    // 이미 설정되어 있으면 에러
    if queries::get_config(&db, "salt")?.is_some() {
        return Err(AppError::AlreadySetup);
    }

    // salt 생성 및 키 파생
    let salt = argon2_kdf::generate_salt();
    let master_key = argon2_kdf::derive_master_key(&password, &salt)?;
    let verify_hash = hkdf_derive::derive_verify_key(&master_key)?;
    let encryption_key = hkdf_derive::derive_encryption_key(&master_key)?;

    // DB에 salt, verify_hash 저장
    queries::set_config(&db, "salt", &salt)?;
    queries::set_config(&db, "verify_hash", &verify_hash)?;

    // 암호화 키를 메모리에 보관 (잠금 해제 상태)
    drop(db);
    state.set_encryption_key(encryption_key);

    Ok(())
}

/// 잠금 해제
#[tauri::command]
pub fn unlock(password: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let db = state.db.lock().unwrap();

    let salt = queries::get_config(&db, "salt")?
        .ok_or(AppError::InvalidPassword)?;
    let stored_verify = queries::get_config(&db, "verify_hash")?
        .ok_or(AppError::InvalidPassword)?;

    // 패스워드로 키 파생
    let master_key = argon2_kdf::derive_master_key(&password, &salt)?;
    let verify_hash = hkdf_derive::derive_verify_key(&master_key)?;

    // 검증
    if verify_hash != stored_verify {
        return Err(AppError::InvalidPassword);
    }

    // 암호화 키 파생 및 메모리 저장
    let encryption_key = hkdf_derive::derive_encryption_key(&master_key)?;
    drop(db);
    state.set_encryption_key(encryption_key);

    Ok(())
}

/// 잠금
#[tauri::command]
pub fn lock(state: State<'_, AppState>) -> Result<(), AppError> {
    state.clear_encryption_key();
    Ok(())
}

/// 비밀번호 변경 (현재 비밀번호 검증 → 전체 시크릿 재암호화)
#[tauri::command]
pub fn change_password(
    current_password: String,
    new_password: String,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    if new_password.len() < 8 {
        return Err(AppError::PasswordTooShort);
    }

    let db = state.db.lock().unwrap();

    // 1. 현재 비밀번호 검증
    let salt = queries::get_config(&db, "salt")?
        .ok_or(AppError::InvalidPassword)?;
    let stored_verify = queries::get_config(&db, "verify_hash")?
        .ok_or(AppError::InvalidPassword)?;

    let old_master_key = argon2_kdf::derive_master_key(&current_password, &salt)?;
    let old_verify = hkdf_derive::derive_verify_key(&old_master_key)?;
    if old_verify != stored_verify {
        return Err(AppError::InvalidPassword);
    }

    let old_enc_key = hkdf_derive::derive_encryption_key(&old_master_key)?;

    // 2. 새 비밀번호로 키 파생
    let new_salt = argon2_kdf::generate_salt();
    let new_master_key = argon2_kdf::derive_master_key(&new_password, &new_salt)?;
    let new_verify_hash = hkdf_derive::derive_verify_key(&new_master_key)?;
    let new_enc_key = hkdf_derive::derive_encryption_key(&new_master_key)?;

    // 3. 트랜잭션으로 전체 시크릿 재암호화
    let tx = db.unchecked_transaction()
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    let rows = queries::get_all_secret_rows(&tx)?;
    for row in &rows {
        // 복호화 (old key)
        let plaintext = crate::crypto::aes_gcm_cipher::decrypt(
            &row.encrypted_value,
            &old_enc_key,
            &row.nonce,
        )?;
        // 재암호화 (new key)
        let (new_encrypted, new_nonce) =
            crate::crypto::aes_gcm_cipher::encrypt(&plaintext, &new_enc_key)?;
        queries::update_secret_encrypted_value(&tx, &row.id, &new_encrypted, &new_nonce)?;
    }

    // 4. salt, verify_hash 업데이트
    queries::set_config(&tx, "salt", &new_salt)?;
    queries::set_config(&tx, "verify_hash", &new_verify_hash)?;

    tx.commit().map_err(|e| AppError::DatabaseError(e.to_string()))?;

    // 5. 메모리에 새 암호화 키 설정
    drop(db);
    state.set_encryption_key(new_enc_key);

    Ok(())
}

/// 설정 저장
#[tauri::command]
pub fn save_settings(settings_json: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let db = state.db.lock().unwrap();
    queries::set_config(&db, "settings", settings_json.as_bytes())?;
    Ok(())
}

/// 설정 로드
#[tauri::command]
pub fn load_settings(state: State<'_, AppState>) -> Result<Option<String>, AppError> {
    let db = state.db.lock().unwrap();
    match queries::get_config(&db, "settings")? {
        Some(bytes) => Ok(Some(String::from_utf8(bytes).unwrap_or_default())),
        None => Ok(None),
    }
}
