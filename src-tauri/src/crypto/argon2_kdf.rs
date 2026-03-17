use argon2::{Argon2, Algorithm, Params, Version};
use rand::RngCore;

use crate::error::AppError;

const SALT_LEN: usize = 32;
const KEY_LEN: usize = 32;

/// 랜덤 salt 생성 (32 bytes)
pub fn generate_salt() -> Vec<u8> {
    let mut salt = vec![0u8; SALT_LEN];
    rand::thread_rng().fill_bytes(&mut salt);
    salt
}

/// 패스워드 + salt → 32-byte 마스터 키 파생
/// Argon2id: t=3, m=64MB, p=4 (OWASP 권장)
pub fn derive_master_key(password: &str, salt: &[u8]) -> Result<Vec<u8>, AppError> {
    let params = Params::new(
        64 * 1024, // m = 64MB
        3,         // t = 3 iterations
        4,         // p = 4 parallelism
        Some(KEY_LEN),
    )
    .map_err(|e| AppError::CryptoError(format!("Argon2 params error: {}", e)))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut key = vec![0u8; KEY_LEN];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| AppError::CryptoError(format!("Argon2 hash error: {}", e)))?;

    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_master_key_deterministic() {
        let salt = generate_salt();
        let key1 = derive_master_key("test_password", &salt).unwrap();
        let key2 = derive_master_key("test_password", &salt).unwrap();
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32);
    }

    #[test]
    fn test_different_passwords_different_keys() {
        let salt = generate_salt();
        let key1 = derive_master_key("password1", &salt).unwrap();
        let key2 = derive_master_key("password2", &salt).unwrap();
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_different_salts_different_keys() {
        let salt1 = generate_salt();
        let salt2 = generate_salt();
        let key1 = derive_master_key("password", &salt1).unwrap();
        let key2 = derive_master_key("password", &salt2).unwrap();
        assert_ne!(key1, key2);
    }
}
