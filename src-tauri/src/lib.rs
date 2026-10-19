pub mod commands;
pub mod models;

use std::time::Duration;
use notify::{Watcher, RecursiveMode, Config};
use tauri::Emitter;
use crate::models::get_hub_home;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            let handle = app.handle().clone();
            let projects_dir = get_hub_home().join("Projects");
            let _ = std::fs::create_dir_all(&projects_dir);

            std::thread::spawn(move || {
                let (tx, rx) = std::sync::mpsc::channel();
                let mut watcher = match notify::RecommendedWatcher::new(
                    move |res| {
                        let _ = tx.send(res);
                    },
                    Config::default(),
                ) {
                    Ok(w) => w,
                    Err(e) => {
                        eprintln!("[FileWatcher] Kunne ikke opprette watcher: {}", e);
                        return;
                    }
                };

                if let Err(e) = watcher.watch(&projects_dir, RecursiveMode::Recursive) {
                    eprintln!("[FileWatcher] Kunne ikke overvaake {:?}: {}", projects_dir, e);
                    return;
                }

                let mut last_emit = std::time::Instant::now() - Duration::from_secs(10);
                while let Ok(event_res) = rx.recv() {
                    if let Ok(_event) = event_res {
                        if last_emit.elapsed() > Duration::from_millis(300) {
                            last_emit = std::time::Instant::now();
                            let _ = handle.emit("projects-updated", ());
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::check_github_releases,
            commands::install_or_update_app,
            commands::launch_app,
            commands::create_smart_project,
            commands::scan_projects_and_files,
            commands::load_palettes,
            commands::save_palettes,
            commands::discover_all_recent_files,
            commands::get_file_thumbnail,
            commands::import_file_to_project,
            commands::get_scanner_settings,
            commands::save_scanner_settings,
            commands::pick_custom_folder,
            commands::pick_custom_file,
            commands::open_path_in_explorer,
            commands::init_or_update_workspace_folders,
            commands::check_hub_app_update,
            commands::download_and_install_hub_update,
            commands::uninstall_app,
            commands::get_diagnostic_logs,
            commands::clear_diagnostic_logs,
            commands::log_client_diagnostic,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenArt Hub");
}