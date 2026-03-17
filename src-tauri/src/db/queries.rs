use rusqlite::{params, Connection};

use crate::error::AppError;
use crate::models::category::Category;
use crate::models::secret::{GetSecretsFilter, SecretListItem};

// --- Config ---

pub fn get_config(conn: &Connection, key: &str) -> Result<Option<Vec<u8>>, AppError> {
    let mut stmt = conn.prepare("SELECT value FROM app_config WHERE key = ?1")?;
    let result = stmt
        .query_row(params![key], |row| row.get::<_, Vec<u8>>(0))
        .ok();
    Ok(result)
}

pub fn set_config(conn: &Connection, key: &str, value: &[u8]) -> Result<(), AppError> {
    conn.execute(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES (?1, ?2)",
        params![key, value],
    )?;
    Ok(())
}

// --- Secrets ---

pub struct SecretRow {
    pub id: String,
    pub name: String,
    pub encrypted_value: Vec<u8>,
    pub nonce: Vec<u8>,
    pub service: String,
    pub category_id: Option<String>,
    pub project_id: Option<String>,
    pub pinned: bool,
    pub tags: String,
    pub notes: String,
    pub environment: String,
    pub created_at: String,
    pub updated_at: String,
}

pub fn insert_secret(
    conn: &Connection,
    id: &str,
    name: &str,
    encrypted_value: &[u8],
    nonce: &[u8],
    service: &str,
    category_id: Option<&str>,
    project_id: Option<&str>,
    tags: &str,
    notes: &str,
    environment: &str,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO secrets (id, name, encrypted_value, nonce, service, category_id, project_id, tags, notes, environment)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![id, name, encrypted_value, nonce, service, category_id, project_id, tags, notes, environment],
    )?;
    Ok(())
}

pub fn get_secret_row(conn: &Connection, id: &str) -> Result<SecretRow, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, encrypted_value, nonce, service, category_id, project_id, pinned, tags, notes, environment, created_at, updated_at
         FROM secrets WHERE id = ?1",
    )?;

    stmt.query_row(params![id], |row| {
        let pinned_int: i32 = row.get(7)?;
        Ok(SecretRow {
            id: row.get(0)?,
            name: row.get(1)?,
            encrypted_value: row.get(2)?,
            nonce: row.get(3)?,
            service: row.get(4)?,
            category_id: row.get(5)?,
            project_id: row.get(6)?,
            pinned: pinned_int != 0,
            tags: row.get(8)?,
            notes: row.get(9)?,
            environment: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })
    .map_err(|_| AppError::SecretNotFound(id.to_string()))
}

pub fn list_secrets(
    conn: &Connection,
    filter: &GetSecretsFilter,
) -> Result<Vec<SecretListItem>, AppError> {
    let mut sql = String::from(
        "SELECT id, name, service, category_id, project_id, pinned, tags, environment, updated_at FROM secrets WHERE 1=1",
    );
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let mut param_idx = 1;

    if let Some(ref cat_id) = filter.category_id {
        sql.push_str(&format!(" AND category_id = ?{}", param_idx));
        param_values.push(Box::new(cat_id.clone()));
        param_idx += 1;
    }
    if let Some(ref proj_id) = filter.project_id {
        sql.push_str(&format!(" AND project_id = ?{}", param_idx));
        param_values.push(Box::new(proj_id.clone()));
        param_idx += 1;
    }
    if let Some(ref env) = filter.environment {
        sql.push_str(&format!(" AND environment = ?{}", param_idx));
        param_values.push(Box::new(env.clone()));
        param_idx += 1;
    }
    if let Some(ref query) = filter.query {
        let like = format!("%{}%", query.to_lowercase());
        sql.push_str(&format!(
            " AND (LOWER(name) LIKE ?{p} OR LOWER(service) LIKE ?{p} OR LOWER(tags) LIKE ?{p})",
            p = param_idx
        ));
        param_values.push(Box::new(like));
        // param_idx += 1;
    }
    if filter.pinned_only == Some(true) {
        sql.push_str(" AND pinned = 1");
    }

    sql.push_str(" ORDER BY pinned DESC, updated_at DESC");

    let mut stmt = conn.prepare(&sql)?;
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(params_refs.as_slice(), |row| {
        let pinned_int: i32 = row.get(5)?;
        let tags_str: String = row.get(6)?;
        let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();

        Ok(SecretListItem {
            id: row.get(0)?,
            name: row.get(1)?,
            service: row.get(2)?,
            category_id: row.get(3)?,
            project_id: row.get(4)?,
            pinned: pinned_int != 0,
            tags,
            environment: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
        let item = row?;
        // tag 필터 적용
        if let Some(ref tag) = filter.tag {
            if !item.tags.iter().any(|t| t == tag) {
                continue;
            }
        }
        items.push(item);
    }
    Ok(items)
}

pub fn update_secret_fields(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    encrypted_value: Option<&[u8]>,
    nonce: Option<&[u8]>,
    service: Option<&str>,
    category_id: Option<Option<&str>>,
    project_id: Option<Option<&str>>,
    tags: Option<&str>,
    notes: Option<&str>,
    environment: Option<&str>,
) -> Result<(), AppError> {
    let mut sets = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let mut idx = 1;

    macro_rules! add_field {
        ($field:expr, $val:expr) => {
            if let Some(v) = $val {
                sets.push(format!("{} = ?{}", $field, idx));
                param_values.push(Box::new(v.to_owned()));
                idx += 1;
            }
        };
    }

    add_field!("name", name);
    add_field!("service", service);
    add_field!("notes", notes);
    add_field!("environment", environment);
    add_field!("tags", tags);

    if let Some(ev) = encrypted_value {
        sets.push(format!("encrypted_value = ?{}", idx));
        param_values.push(Box::new(ev.to_owned()));
        idx += 1;
        if let Some(n) = nonce {
            sets.push(format!("nonce = ?{}", idx));
            param_values.push(Box::new(n.to_owned()));
            idx += 1;
        }
    }

    if let Some(cat) = category_id {
        sets.push(format!("category_id = ?{}", idx));
        match cat {
            Some(c) => param_values.push(Box::new(c.to_owned())),
            None => param_values.push(Box::new(None::<String>)),
        }
        idx += 1;
    }

    if let Some(proj) = project_id {
        sets.push(format!("project_id = ?{}", idx));
        match proj {
            Some(p) => param_values.push(Box::new(p.to_owned())),
            None => param_values.push(Box::new(None::<String>)),
        }
        idx += 1;
    }

    sets.push(format!("updated_at = datetime('now')"));

    let sql = format!("UPDATE secrets SET {} WHERE id = ?{}", sets.join(", "), idx);
    param_values.push(Box::new(id.to_owned()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, params_refs.as_slice())?;
    Ok(())
}

pub fn delete_secret(conn: &Connection, id: &str) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM secrets WHERE id = ?1", params![id])?;
    if affected == 0 {
        return Err(AppError::SecretNotFound(id.to_string()));
    }
    Ok(())
}

// --- Categories ---

pub fn list_categories(conn: &Connection) -> Result<Vec<Category>, AppError> {
    let mut stmt =
        conn.prepare("SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order")?;
    let rows = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            order: row.get(3)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }
    Ok(items)
}

pub fn insert_category(conn: &Connection, id: &str, name: &str, icon: &str) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO categories (id, name, icon, sort_order) VALUES (?1, ?2, ?3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))",
        params![id, name, icon],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            AppError::CategoryDuplicate(name.to_string())
        } else {
            AppError::DatabaseError(e.to_string())
        }
    })?;
    Ok(())
}

pub fn update_category(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    icon: Option<&str>,
) -> Result<Category, AppError> {
    let mut sets = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let mut idx = 1;

    if let Some(n) = name {
        sets.push(format!("name = ?{}", idx));
        param_values.push(Box::new(n.to_owned()));
        idx += 1;
    }
    if let Some(ic) = icon {
        sets.push(format!("icon = ?{}", idx));
        param_values.push(Box::new(ic.to_owned()));
        idx += 1;
    }

    if sets.is_empty() {
        // 변경 사항 없음 — 현재 값 반환
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, sort_order FROM categories WHERE id = ?1",
        )?;
        return stmt
            .query_row(params![id], |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    icon: row.get(2)?,
                    order: row.get(3)?,
                })
            })
            .map_err(|_| AppError::CategoryNotFound(id.to_string()));
    }

    let sql = format!(
        "UPDATE categories SET {} WHERE id = ?{}",
        sets.join(", "),
        idx
    );
    param_values.push(Box::new(id.to_owned()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> =
        param_values.iter().map(|p| p.as_ref()).collect();
    let affected = conn.execute(&sql, params_refs.as_slice())?;
    if affected == 0 {
        return Err(AppError::CategoryNotFound(id.to_string()));
    }

    let mut stmt = conn
        .prepare("SELECT id, name, icon, sort_order FROM categories WHERE id = ?1")?;
    stmt.query_row(params![id], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            icon: row.get(2)?,
            order: row.get(3)?,
        })
    })
    .map_err(|_| AppError::CategoryNotFound(id.to_string()))
}

pub fn delete_category(conn: &Connection, id: &str) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM categories WHERE id = ?1", params![id])?;
    if affected == 0 {
        return Err(AppError::CategoryNotFound(id.to_string()));
    }
    Ok(())
}

// --- Projects ---

pub fn list_projects(conn: &Connection) -> Result<Vec<crate::models::project::Project>, AppError> {
    let mut stmt =
        conn.prepare("SELECT id, name, color, sort_order FROM projects ORDER BY sort_order")?;
    let rows = stmt.query_map([], |row| {
        Ok(crate::models::project::Project {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            order: row.get(3)?,
        })
    })?;
    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }
    Ok(items)
}

pub fn insert_project(conn: &Connection, id: &str, name: &str, color: &str) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO projects (id, name, color, sort_order) VALUES (?1, ?2, ?3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects))",
        params![id, name, color],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            AppError::CategoryDuplicate(name.to_string())
        } else {
            AppError::DatabaseError(e.to_string())
        }
    })?;
    Ok(())
}

pub fn delete_project(conn: &Connection, id: &str) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    if affected == 0 {
        return Err(AppError::SecretNotFound(id.to_string()));
    }
    Ok(())
}

// --- Pin ---

pub fn toggle_pin(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let current: i32 = conn
        .query_row("SELECT COALESCE(pinned, 0) FROM secrets WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|_| AppError::SecretNotFound(id.to_string()))?;
    let new_val = if current != 0 { 0 } else { 1 };
    conn.execute("UPDATE secrets SET pinned = ?1 WHERE id = ?2", params![new_val, id])?;
    Ok(new_val != 0)
}

// --- Counts ---

pub fn get_secret_counts(conn: &Connection) -> Result<crate::models::secret::SecretCounts, AppError> {
    use std::collections::HashMap;

    let total: usize = conn.query_row("SELECT COUNT(*) FROM secrets", [], |r| r.get(0))?;
    let pinned: usize = conn.query_row("SELECT COUNT(*) FROM secrets WHERE pinned = 1", [], |r| r.get(0))?;

    let mut by_category: HashMap<String, usize> = HashMap::new();
    {
        let mut stmt = conn.prepare("SELECT category_id, COUNT(*) FROM secrets WHERE category_id IS NOT NULL GROUP BY category_id")?;
        let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, usize>(1)?)))?;
        for row in rows {
            let (k, v) = row?;
            by_category.insert(k, v);
        }
    }

    let mut by_project: HashMap<String, usize> = HashMap::new();
    {
        let mut stmt = conn.prepare("SELECT project_id, COUNT(*) FROM secrets WHERE project_id IS NOT NULL GROUP BY project_id")?;
        let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, usize>(1)?)))?;
        for row in rows {
            let (k, v) = row?;
            by_project.insert(k, v);
        }
    }

    Ok(crate::models::secret::SecretCounts { total, by_category, by_project, pinned })
}
