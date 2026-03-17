use std::sync::Mutex;
use rusqlite::Connection;

/// 앱 전역 상태 (Tauri managed state)
pub struct AppState {
    pub db: Mutex<Connection>,
    /// 암호화 키 — 잠금 해제 시에만 Some
    pub encryption_key: Mutex<Option<Vec<u8>>>,
}

impl AppState {
    pub fn new(db: Connection) -> Self {
        Self {
            db: Mutex::new(db),
            encryption_key: Mutex::new(None),
        }
    }

    pub fn get_encryption_key(&self) -> Result<Vec<u8>, crate::error::AppError> {
        let guard = self.encryption_key.lock().unwrap();
        guard
            .clone()
            .ok_or(crate::error::AppError::AppLocked)
    }

    pub fn set_encryption_key(&self, key: Vec<u8>) {
        let mut guard = self.encryption_key.lock().unwrap();
        *guard = Some(key);
    }

    pub fn clear_encryption_key(&self) {
        let mut guard = self.encryption_key.lock().unwrap();
        // 메모리에서 키 제거
        if let Some(ref mut k) = *guard {
            k.fill(0);
        }
        *guard = None;
    }
}
