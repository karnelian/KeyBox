use tauri::State;
use uuid::Uuid;

use crate::db::queries;
use crate::error::AppError;
use crate::models::project::Project;
use crate::state::AppState;

#[tauri::command]
pub fn get_projects(state: State<'_, AppState>) -> Result<Vec<Project>, AppError> {
    let db = state.db.lock().unwrap();
    queries::list_projects(&db)
}

#[tauri::command]
pub fn create_project(
    name: String,
    color: String,
    state: State<'_, AppState>,
) -> Result<Project, AppError> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    queries::insert_project(&db, &id, &name, &color)?;

    Ok(Project {
        id,
        name,
        color,
        order: 0,
    })
}

#[tauri::command]
pub fn delete_project(id: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let db = state.db.lock().unwrap();
    queries::delete_project(&db, &id)
}
