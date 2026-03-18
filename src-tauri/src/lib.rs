pub mod commands;
pub mod crypto;
pub mod db;
pub mod error;
pub mod models;
pub mod state;
pub mod tray;

use tauri::{Emitter, Manager, WindowEvent};

use db::connection;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let db_path = connection::get_db_path(&app.handle())?;
            let conn = connection::open_db(&db_path)?;
            let app_state = AppState::new(conn);
            app.manage(app_state);
            tray::setup_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // X 버튼 클릭 시 창을 숨기고 트레이로 최소화
                api.prevent_close();
                let _ = window.hide();
                let _ = window.emit("tray-lock", ());
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::check_setup,
            commands::auth::setup_master_password,
            commands::auth::unlock,
            commands::auth::lock,
            commands::auth::change_password,
            commands::auth::save_settings,
            commands::auth::load_settings,
            // Secrets
            commands::secret::create_secret,
            commands::secret::get_secrets,
            commands::secret::get_secret,
            commands::secret::update_secret,
            commands::secret::delete_secret,
            commands::secret::copy_to_clipboard,
            commands::secret::search_secrets,
            commands::secret::import_env_file,
            commands::secret::toggle_pin,
            commands::secret::get_secret_counts,
            // Categories
            commands::category::get_categories,
            commands::category::create_category,
            commands::category::update_category,
            commands::category::delete_category,
            // Projects
            commands::project::get_projects,
            commands::project::create_project,
            commands::project::update_project,
            commands::project::delete_project,
            // Export / Import
            commands::export::export_data,
            commands::export::import_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
