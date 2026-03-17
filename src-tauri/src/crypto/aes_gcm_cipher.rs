use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;

use crate::error::AppError;

const NONCE_LEN: usize = 12;

/// AES-256-GCM 암호화
/// 반환: (ciphertext, nonce)
pub fn encrypt(plaintext: &[u8], key: &[u8]) -> Result<(Vec<u8>, Vec<u8>), AppError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::CryptoError(format!("AES key error: {}", e)))?;

    let mut nonce_bytes = [0u8; NONCE_LEN];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| AppError::CryptoError(format!("Encryption error: {}", e)))?;

    Ok((ciphertext, nonce_bytes.to_vec()))
}

/// AES-256-GCM 복호화
pub fn decrypt(ciphertext: &[u8], key: &[u8], nonce_bytes: &[u8]) -> Result<Vec<u8>, AppError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::CryptoError(format!("AES key error: {}", e)))?;

    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| AppError::CryptoError(format!("Decryption error: {}", e)))?;

    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = [0x42u8; 32];
        let plaintext = b"sk-1234567890abcdef";

        let (ciphertext, nonce) = encrypt(plaintext, &key).unwrap();
        let decrypted = decrypt(&ciphertext, &key, &nonce).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_wrong_key_fails() {
        let key1 = [0x42u8; 32];
        let key2 = [0x43u8; 32];
        let plaintext = b"secret-data";

        let (ciphertext, nonce) = encrypt(plaintext, &key1).unwrap();
        let result = decrypt(&ciphertext, &key2, &nonce);

        assert!(result.is_err());
    }

    #[test]
    fn test_unique_nonces() {
        let key = [0x42u8; 32];
        let plaintext = b"same-data";

        let (_, nonce1) = encrypt(plaintext, &key).unwrap();
        let (_, nonce2) = encrypt(plaintext, &key).unwrap();

        assert_ne!(nonce1, nonce2);
    }
}
