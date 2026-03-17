use rusqlite::Connection;
use std::path::PathBuf;
use tauri::Manager;

use crate::error::AppError;
use super::migrations;

/// 앱 데이터 디렉토리의 DB 경로 반환
pub fn get_db_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::DatabaseError(format!("Cannot resolve app data dir: {}", e)))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| AppError::DatabaseError(format!("Cannot create app dir: {}", e)))?;

    Ok(app_dir.join("keybox.db"))
}

/// SQLite 연결 생성 + WAL 모드 + 마이그레이션
pub fn open_db(db_path: &PathBuf) -> Result<Connection, AppError> {
    let conn = Connection::open(db_path)?;

    // WAL 모드 (성능 + 안정성)
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    // 마이그레이션 실행
    migrations::run(&conn)?;

    Ok(conn)
}
