pub mod commands;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::check_github_releases,
            commands::install_or_update_app,
            commands::launch_app,
            commands::create_smart_project,
            commands::scan_projects_and_files,
            commands::load_palettes,
            commands::save_palettes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenArt Hub");
}
