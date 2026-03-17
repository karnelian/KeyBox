use hkdf::Hkdf;
use sha2::Sha256;

use crate::error::AppError;

const KEY_LEN: usize = 32;

/// 마스터 키에서 검증용 해시 파생
pub fn derive_verify_key(master_key: &[u8]) -> Result<Vec<u8>, AppError> {
    derive_key(master_key, b"keybox-verify")
}

/// 마스터 키에서 암호화용 키 파생
pub fn derive_encryption_key(master_key: &[u8]) -> Result<Vec<u8>, AppError> {
    derive_key(master_key, b"keybox-encrypt")
}

fn derive_key(master_key: &[u8], info: &[u8]) -> Result<Vec<u8>, AppError> {
    let hk = Hkdf::<Sha256>::new(None, master_key);
    let mut okm = vec![0u8; KEY_LEN];
    hk.expand(info, &mut okm)
        .map_err(|e| AppError::CryptoError(format!("HKDF error: {}", e)))?;
    Ok(okm)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_different_keys() {
        let master_key = vec![42u8; 32];
        let verify = derive_verify_key(&master_key).unwrap();
        let encrypt = derive_encryption_key(&master_key).unwrap();
        assert_ne!(verify, encrypt);
        assert_eq!(verify.len(), 32);
        assert_eq!(encrypt.len(), 32);
    }
}
