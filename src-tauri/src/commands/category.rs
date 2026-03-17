use tauri::State;
use uuid::Uuid;

use crate::db::queries;
use crate::error::AppError;
use crate::models::category::{Category, UpdateCategoryInput};
use crate::state::AppState;

#[tauri::command]
pub fn get_categories(state: State<'_, AppState>) -> Result<Vec<Category>, AppError> {
    let db = state.db.lock().unwrap();
    queries::list_categories(&db)
}

#[tauri::command]
pub fn create_category(
    name: String,
    icon: String,
    state: State<'_, AppState>,
) -> Result<Category, AppError> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    queries::insert_category(&db, &id, &name, &icon)?;

    Ok(Category {
        id,
        name,
        icon,
        order: 0, // actual order set by DB
    })
}

#[tauri::command]
pub fn update_category(
    input: UpdateCategoryInput,
    state: State<'_, AppState>,
) -> Result<Category, AppError> {
    let db = state.db.lock().unwrap();
    queries::update_category(&db, &input.id, input.name.as_deref(), input.icon.as_deref())
}

#[tauri::command]
pub fn delete_category(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let db = state.db.lock().unwrap();
    queries::delete_category(&db, &id)
}
