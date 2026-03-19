mod commands;
mod error;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::ping::ping,
            commands::layer::create_layer,
            commands::layer::rename_layer,
            commands::layer::toggle_layer_visibility,
            commands::layer::delete_layer,
            commands::project::new_project,
            commands::project::save_project,
            commands::project::save_project_as,
            commands::project::load_project,
            commands::project::validate_project_file,
            commands::project::get_recent_projects,
            commands::project::add_recent_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
