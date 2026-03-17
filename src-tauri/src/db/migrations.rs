use rusqlite::Connection;

use crate::error::AppError;

pub fn run(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY,
            value BLOB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            icon TEXT DEFAULT 'folder',
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#6366f1',
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS secrets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            encrypted_value BLOB NOT NULL,
            nonce BLOB NOT NULL,
            service TEXT DEFAULT '',
            category_id TEXT,
            project_id TEXT,
            tags TEXT DEFAULT '[]',
            notes TEXT DEFAULT '',
            environment TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_secrets_name ON secrets(name);
        CREATE INDEX IF NOT EXISTS idx_secrets_service ON secrets(service);
        CREATE INDEX IF NOT EXISTS idx_secrets_category ON secrets(category_id);
        CREATE INDEX IF NOT EXISTS idx_secrets_environment ON secrets(environment);
        ",
    )?;

    // v0.2 마이그레이션: secrets 테이블에 project_id 컬럼 추가 (기존 DB 호환)
    let has_project_id: bool = conn
        .prepare("SELECT project_id FROM secrets LIMIT 0")
        .is_ok();
    if !has_project_id {
        conn.execute_batch(
            "ALTER TABLE secrets ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;",
        )?;
    }

    // project_id 인덱스는 컬럼이 존재한 후에 생성
    conn.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_secrets_project ON secrets(project_id);",
    )?;

    // v0.3 마이그레이션: pinned 컬럼 추가
    let has_pinned: bool = conn.prepare("SELECT pinned FROM secrets LIMIT 0").is_ok();
    if !has_pinned {
        conn.execute_batch("ALTER TABLE secrets ADD COLUMN pinned INTEGER DEFAULT 0;")?;
    }

    // 기본 카테고리 삽입 (없으면)
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM categories", [], |r| r.get(0))?;
    if count == 0 {
        conn.execute_batch(
            "
            INSERT INTO categories (id, name, icon, sort_order) VALUES
                ('cat-ai', 'AI Services', 'bot', 0),
                ('cat-cloud', 'Cloud', 'cloud', 1),
                ('cat-dev', 'Dev Tools', 'wrench', 2),
                ('cat-db', 'Database', 'database', 3);
            ",
        )?;
    }

    Ok(())
}
