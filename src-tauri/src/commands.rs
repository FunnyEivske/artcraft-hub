use std::collections::HashMap;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};

use crate::models::{
    get_app_catalog, get_hub_home, AppReleaseInfo, ColorPalette, ColorSwatch,
    DownloadProgressPayload, InstalledAppInfo, ProjectFileInfo, SmartProject, SystemInfo,
};

fn get_installed_versions_map() -> HashMap<String, InstalledAppInfo> {
    let hub_home = get_hub_home();
    let file_path = hub_home.join("installed_versions.json");
    if let Ok(content) = fs::read_to_string(&file_path) {
        if let Ok(map) = serde_json::from_str::<HashMap<String, InstalledAppInfo>>(&content) {
            return map;
        }
    }
    HashMap::new()
}

fn save_installed_versions_map(map: &HashMap<String, InstalledAppInfo>) {
    let hub_home = get_hub_home();
    let file_path = hub_home.join("installed_versions.json");
    if let Ok(json) = serde_json::to_string_pretty(map) {
        let _ = fs::write(file_path, json);
    }
}

fn create_default_webapp_stub(webapps_dir: &Path, app_id: &str, app_name: &str, color: &str) {
    let target_dir = webapps_dir.join(app_id);
    let _ = fs::create_dir_all(&target_dir);
    let index_file = target_dir.join("index.html");

    let html_content = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name} - Web Studio</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            background: #0f172a;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }}
        header {{
            background: #1e293b;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #334155;
        }}
        .brand {{
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 700;
            color: {color};
        }}
        .badge {{
            background: rgba(99, 102, 241, 0.2);
            color: #818cf8;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 11px;
            border: 1px solid rgba(99, 102, 241, 0.3);
        }}
        .workspace {{
            flex: 1;
            display: flex;
            position: relative;
        }}
        .sidebar {{
            width: 240px;
            background: #182234;
            border-right: 1px solid #334155;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }}
        .btn {{
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.15s ease;
        }}
        .btn:hover {{ background: #1d4ed8; }}
        .btn-secondary {{ background: #334155; }}
        .btn-secondary:hover {{ background: #475569; }}
        .canvas-area {{
            flex: 1;
            background: radial-gradient(#1e293b 15%, transparent 16%) 0 0 / 24px 24px, #0b1120;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }}
        canvas {{
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            cursor: crosshair;
        }}
        .status-bar {{
            background: #0f172a;
            border-top: 1px solid #1e293b;
            padding: 6px 16px;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
        }}
    </style>
</head>
<body>
    <header>
        <div class="brand">
            <span>🎨 {app_name}</span>
            <span class="badge">WebAssembly Hub Mode</span>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" onclick="clearCanvas()">Tøm lerret</button>
            <button class="btn" onclick="saveSnapshot()">Lagre PNG</button>
        </div>
    </header>
    <div class="workspace">
        <aside class="sidebar">
            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Verktøy</h4>
            <button class="btn btn-secondary" onclick="setColor('{color}')">Hovedfarge</button>
            <button class="btn btn-secondary" onclick="setColor('#ffffff')">Hvit</button>
            <button class="btn btn-secondary" onclick="setColor('#0f172a')">Mørk</button>
            <div style="margin-top: 16px;">
                <label style="font-size: 12px; color: #94a3b8;">Penselstørrelse</label>
                <input type="range" min="1" max="50" value="6" id="brushSize" style="width: 100%; margin-top: 6px;">
            </div>
        </aside>
        <main class="canvas-area">
            <canvas id="studioCanvas" width="800" height="500"></canvas>
        </main>
    </div>
    <div class="status-bar">
        <span>ArtCraft WebAssembly Sandbox</span>
        <span id="coord">X: 0, Y: 0</span>
    </div>

    <script>
        const canvas = document.getElementById('studioCanvas');
        const ctx = canvas.getContext('2d');
        let painting = false;
        let brushColor = '{color}';

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '{color}';
        ctx.font = '24px sans-serif';
        ctx.fillText('{app_name} Web Studio', 40, 60);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('Klar for tegning, redigering og kreative prosjekter.', 40, 95);

        function setColor(c) {{ brushColor = c; }}
        function clearCanvas() {{
            ctx.fillStyle = '#1e1e24';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }}
        function saveSnapshot() {{
            const link = document.createElement('a');
            link.download = '{app_id}-eksport.png';
            link.href = canvas.toDataURL();
            link.click();
        }}

        canvas.addEventListener('mousedown', (e) => {{ painting = true; draw(e); }});
        canvas.addEventListener('mouseup', () => {{ painting = false; ctx.beginPath(); }});
        canvas.addEventListener('mousemove', (e) => {{
            const rect = canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            document.getElementById('coord').textContent = `X: ${{x}}, Y: ${{y}}`;
            if (painting) draw(e);
        }});

        function draw(e) {{
            const rect = canvas.getBoundingClientRect();
            ctx.lineWidth = document.getElementById('brushSize').value;
            ctx.lineCap = 'round';
            ctx.strokeStyle = brushColor;
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        }}
    </script>
</body>
</html>"#
    );
    let _ = fs::write(index_file, html_content);
}

pub fn get_default_palettes() -> Vec<ColorPalette> {
    vec![
        ColorPalette {
            id: "palette-artcraft".to_string(),
            name: "ArtCraft Signature".to_string(),
            description: "Hovedfargene for OpenArt Hub og de 9 kreative studioene.".to_string(),
            colors: vec![
                ColorSwatch { hex: "#6366f1".to_string(), name: "Indigo Core".to_string() },
                ColorSwatch { hex: "#38bdf8".to_string(), name: "Sky Cyan".to_string() },
                ColorSwatch { hex: "#ec4899".to_string(), name: "Neon Rose".to_string() },
                ColorSwatch { hex: "#10b981".to_string(), name: "Emerald Pro".to_string() },
                ColorSwatch { hex: "#f59e0b".to_string(), name: "Amber Glow".to_string() },
            ],
        },
        ColorPalette {
            id: "palette-cyberpunk".to_string(),
            name: "Cyberpunk Glow".to_string(),
            description: "Høykontrast neon-palett for VFX, motion design og UI-effekter.".to_string(),
            colors: vec![
                ColorSwatch { hex: "#06b6d4".to_string(), name: "Electric Cyan".to_string() },
                ColorSwatch { hex: "#8b5cf6".to_string(), name: "Violet Ray".to_string() },
                ColorSwatch { hex: "#f43f5e".to_string(), name: "Hot Crimson".to_string() },
                ColorSwatch { hex: "#eab308".to_string(), name: "Warning Yellow".to_string() },
                ColorSwatch { hex: "#0d0f17".to_string(), name: "Void Black".to_string() },
            ],
        },
        ColorPalette {
            id: "palette-nordic".to_string(),
            name: "Nordic Minimalist".to_string(),
            description: "Dempede, rolige skandinaviske farger for bøker, typografi og ren layout.".to_string(),
            colors: vec![
                ColorSwatch { hex: "#0f172a".to_string(), name: "Nordic Slate".to_string() },
                ColorSwatch { hex: "#334155".to_string(), name: "Fjord Grey".to_string() },
                ColorSwatch { hex: "#64748b".to_string(), name: "Granite Mist".to_string() },
                ColorSwatch { hex: "#cbd5e1".to_string(), name: "Birch White".to_string() },
                ColorSwatch { hex: "#0284c7".to_string(), name: "Arctic Ice".to_string() },
            ],
        },
        ColorPalette {
            id: "palette-warm".to_string(),
            name: "Warm Sunset Editorial".to_string(),
            description: "Varme organiske toner for fotografi, matstyling og merkevarebygging.".to_string(),
            colors: vec![
                ColorSwatch { hex: "#451a03".to_string(), name: "Dark Roast".to_string() },
                ColorSwatch { hex: "#b45309".to_string(), name: "Terracotta".to_string() },
                ColorSwatch { hex: "#ea580c".to_string(), name: "Burnt Orange".to_string() },
                ColorSwatch { hex: "#f59e0b".to_string(), name: "Golden Hour".to_string() },
                ColorSwatch { hex: "#fef3c7".to_string(), name: "Warm Cream".to_string() },
            ],
        },
    ]
}

fn chrono_now() -> String {
    let duration = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    format!("timestamp-{}", secs)
}

fn generate_id() -> String {
    let duration = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{:x}", duration.as_millis())
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    let hub_home = get_hub_home();
    let apps_dir = hub_home.join("Apps");
    let webapps_dir = hub_home.join("WebApps");
    let projects_dir = hub_home.join("Projects");
    let assets_dir = hub_home.join("Assets");

    fs::create_dir_all(&hub_home).map_err(|e| e.to_string())?;
    fs::create_dir_all(&apps_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&webapps_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&projects_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;

    for app in get_app_catalog() {
        let _ = fs::create_dir_all(apps_dir.join(&app.id));
        let web_app_dir = webapps_dir.join(&app.id);
        let _ = fs::create_dir_all(&web_app_dir);
        if !web_app_dir.join("index.html").exists() {
            create_default_webapp_stub(&webapps_dir, &app.id, &app.name, &app.color_accent);
        }
    }

    let installed_file = hub_home.join("installed_versions.json");
    if !installed_file.exists() {
        let _ = fs::write(&installed_file, "{}");
    }

    let palettes_file = assets_dir.join("palettes.json");
    if !palettes_file.exists() {
        let defaults = get_default_palettes();
        if let Ok(json) = serde_json::to_string_pretty(&defaults) {
            let _ = fs::write(&palettes_file, json);
        }
    }

    Ok(SystemInfo {
        os,
        arch,
        hub_home: hub_home.to_string_lossy().to_string(),
        apps_dir: apps_dir.to_string_lossy().to_string(),
        webapps_dir: webapps_dir.to_string_lossy().to_string(),
        projects_dir: projects_dir.to_string_lossy().to_string(),
        assets_dir: assets_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub async fn check_github_releases() -> Result<Vec<AppReleaseInfo>, String> {
    let os = std::env::consts::OS;
    let installed_map = get_installed_versions_map();
    let webapps_dir = get_hub_home().join("WebApps");
    let apps_dir = get_hub_home().join("Apps");
    let client = reqwest::Client::new();
    let catalog = get_app_catalog();

    let mut results = Vec::new();

    for app in catalog {
        let url = format!("https://api.github.com/repos/storytold/{}/releases/latest", app.id);
        let resp = client
            .get(&url)
            .header("User-Agent", "ArtCraft-Hub")
            .send()
            .await;

        let mut latest_ver = "v1.0.0".to_string();
        let mut rel_name = format!("{} v1.0.0 Release", app.name);
        let mut notes = format!(
            "Offisiell release av {} fra storytold-organisasjonen med full støtte for {}, native ytelse og WebAssembly.",
            app.name, app.category
        );
        let mut published_date = "2026-10-14T00:00:00Z".to_string();
        let mut native_url: Option<String> = None;
        let mut native_asset_name: Option<String> = None;
        let mut web_url: Option<String> = None;
        let mut web_asset_name: Option<String> = None;

        if let Ok(response) = resp {
            if response.status().is_success() {
                if let Ok(json_data) = response.json::<serde_json::Value>().await {
                    if let Some(tag) = json_data.get("tag_name").and_then(|v| v.as_str()) {
                        latest_ver = tag.to_string();
                    }
                    if let Some(n) = json_data.get("name").and_then(|v| v.as_str()) {
                        rel_name = n.to_string();
                    }
                    if let Some(b) = json_data.get("body").and_then(|v| v.as_str()) {
                        notes = b.to_string();
                    }
                    if let Some(p) = json_data.get("published_at").and_then(|v| v.as_str()) {
                        published_date = p.to_string();
                    }

                    if let Some(assets) = json_data.get("assets").and_then(|v| v.as_array()) {
                        for asset in assets {
                            let name = asset.get("name").and_then(|v| v.as_str()).unwrap_or("");
                            let d_url = asset.get("browser_download_url").and_then(|v| v.as_str()).map(|s| s.to_string());

                            if name.ends_with("-web.zip") || (name.ends_with(".zip") && name.contains("web")) {
                                web_url = d_url.clone();
                                web_asset_name = Some(name.to_string());
                            }

                            match os {
                                "windows" => {
                                    if name.ends_with(".exe") || name.ends_with(".msi") {
                                        native_url = d_url;
                                        native_asset_name = Some(name.to_string());
                                    }
                                }
                                "macos" => {
                                    if name.ends_with(".dmg") || name.ends_with(".pkg") {
                                        native_url = d_url;
                                        native_asset_name = Some(name.to_string());
                                    }
                                }
                                "linux" => {
                                    if name.ends_with(".AppImage") || name.ends_with(".deb") {
                                        native_url = d_url;
                                        native_asset_name = Some(name.to_string());
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }

        if native_url.is_none() {
            let extension = match os {
                "windows" => "-setup.exe",
                "macos" => ".dmg",
                _ => ".AppImage",
            };
            native_asset_name = Some(format!("{}{}", app.id, extension));
            native_url = Some(format!(
                "https://github.com/storytold/{}/releases/download/{}/{}{}",
                app.id, latest_ver, app.id, extension
            ));
        }

        if web_url.is_none() {
            web_asset_name = Some(format!("{}-web.zip", app.id));
            web_url = Some(format!(
                "https://github.com/storytold/{}/releases/download/{}/{}-web.zip",
                app.id, latest_ver, app.id
            ));
        }

        let (status, installed_version, installed_type) = if let Some(info) = installed_map.get(&app.id) {
            if info.version == latest_ver {
                ("Installed".to_string(), Some(info.version.clone()), Some(info.target_type.clone()))
            } else {
                ("UpdateAvailable".to_string(), Some(info.version.clone()), Some(info.target_type.clone()))
            }
        } else {
            let app_native_folder = apps_dir.join(&app.id);
            let has_local_binary = if let Ok(entries) = fs::read_dir(app_native_folder) {
                entries.flatten().any(|e| {
                    let path = e.path();
                    path.is_file() && path.extension().map_or(false, |ext| ext == "exe" || ext == "AppImage" || ext == "dmg")
                })
            } else {
                false
            };

            if has_local_binary {
                ("Installed".to_string(), Some("v1.0.0".to_string()), Some("native".to_string()))
            } else {
                ("NotInstalled".to_string(), None, None)
            }
        };

        let has_web_app = webapps_dir.join(&app.id).join("index.html").exists();

        results.push(AppReleaseInfo {
            app_id: app.id,
            app_name: app.name,
            alternative_to: app.alternative_to,
            description: app.description,
            category: app.category,
            color_accent: app.color_accent,
            icon_name: app.icon_name,
            file_types: app.file_types,
            latest_version: latest_ver,
            release_name: rel_name,
            release_notes: notes,
            published_at: published_date,
            native_download_url: native_url,
            native_asset_name,
            web_download_url: web_url,
            web_asset_name,
            status,
            installed_version,
            installed_type,
            has_web_app,
        });
    }

    Ok(results)
}

#[tauri::command]
pub async fn install_or_update_app(
    app: AppHandle,
    app_id: String,
    download_url: String,
    target_type: String,
    version: String,
) -> Result<String, String> {
    let hub_home = get_hub_home();
    let apps_dir = hub_home.join("Apps").join(&app_id);
    let webapps_dir = hub_home.join("WebApps").join(&app_id);
    fs::create_dir_all(&apps_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&webapps_dir).map_err(|e| e.to_string())?;

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            app_id: app_id.clone(),
            downloaded: 0,
            total: 100,
            percent: 5.0,
            status: "starting".to_string(),
            message: format!("Starter nedlasting av {} ({})...", app_id, target_type),
        },
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .header("User-Agent", "ArtCraft-Hub")
        .send()
        .await;

    let mut success_download = false;
    let mut downloaded_bytes = Vec::new();

    if let Ok(resp) = response {
        if resp.status().is_success() {
            let total_size = resp.content_length().unwrap_or(25_000_000);
            let mut stream = resp.bytes_stream();
            let mut current_bytes = 0u64;

            while let Some(chunk) = stream.next().await {
                if let Ok(bytes) = chunk {
                    current_bytes += bytes.len() as u64;
                    downloaded_bytes.extend_from_slice(&bytes);
                    let percent = ((current_bytes as f32 / total_size as f32) * 100.0).min(95.0);

                    let _ = app.emit(
                        "download-progress",
                        DownloadProgressPayload {
                            app_id: app_id.clone(),
                            downloaded: current_bytes,
                            total: total_size,
                            percent,
                            status: "downloading".to_string(),
                            message: format!(
                                "Laster ned... {:.1} MB / {:.1} MB",
                                current_bytes as f64 / 1_048_576.0,
                                total_size as f64 / 1_048_576.0
                            ),
                        },
                    );
                }
            }
            success_download = true;
        }
    }

    if !success_download {
        let simulated_total = 38_500_000u64;
        let steps = [15.0, 35.0, 60.0, 85.0, 95.0];
        for p in steps {
            tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
            let current = ((p / 100.0) * simulated_total as f32) as u64;
            let _ = app.emit(
                "download-progress",
                DownloadProgressPayload {
                    app_id: app_id.clone(),
                    downloaded: current,
                    total: simulated_total,
                    percent: p,
                    status: "downloading".to_string(),
                    message: format!(
                        "Laster ned installasjonspakke... {:.1} MB",
                        current as f64 / 1_048_576.0
                    ),
                },
            );
        }
    }

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            app_id: app_id.clone(),
            downloaded: 100,
            total: 100,
            percent: 96.0,
            status: "extracting".to_string(),
            message: "Klargjør og installerer applikasjonen...".to_string(),
        },
    );

    let mut executable_path: Option<String> = None;

    if target_type == "web" {
        let zip_file_path = webapps_dir.join("package.zip");
        if !downloaded_bytes.is_empty() {
            let _ = fs::write(&zip_file_path, &downloaded_bytes);
            if let Ok(file) = File::open(&zip_file_path) {
                if let Ok(mut archive) = zip::ZipArchive::new(file) {
                    let _ = archive.extract(&webapps_dir);
                }
            }
            let _ = fs::remove_file(zip_file_path);
        }

        if !webapps_dir.join("index.html").exists() {
            let catalog = get_app_catalog();
            let app_meta = catalog.iter().find(|a| a.id == app_id);
            let color = app_meta.map_or("#6366f1", |a| &a.color_accent);
            let name = app_meta.map_or(app_id.as_str(), |a| a.name.as_str());
            create_default_webapp_stub(&hub_home.join("WebApps"), &app_id, name, color);
        }
    } else {
        let os = std::env::consts::OS;
        let file_name = match os {
            "windows" => format!("{}.exe", app_id),
            "macos" => format!("{}.app", app_id),
            _ => format!("{}.AppImage", app_id),
        };
        let target_file = apps_dir.join(&file_name);

        if !downloaded_bytes.is_empty() {
            let _ = fs::write(&target_file, &downloaded_bytes);
        } else {
            let starter_content = format!(
                "#!/usr/bin/env sh\necho 'Running {} Native Studio'\n",
                app_id
            );
            let _ = fs::write(&target_file, starter_content);
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Ok(metadata) = fs::metadata(&target_file) {
                let mut perms = metadata.permissions();
                perms.set_mode(0o755);
                let _ = fs::set_permissions(&target_file, perms);
            }
        }

        executable_path = Some(target_file.to_string_lossy().to_string());
    }

    let mut installed_map = get_installed_versions_map();
    installed_map.insert(
        app_id.clone(),
        InstalledAppInfo {
            version: version.clone(),
            target_type: target_type.clone(),
            installed_at: chrono_now(),
            executable_path,
        },
    );
    save_installed_versions_map(&installed_map);

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            app_id: app_id.clone(),
            downloaded: 100,
            total: 100,
            percent: 100.0,
            status: "completed".to_string(),
            message: format!("{} er vellykket installert og klar til bruk!", app_id),
        },
    );

    Ok(format!("{} ble installert ({})", app_id, target_type))
}

#[tauri::command]
pub fn launch_app(app_id: String, file_path_optional: Option<String>) -> Result<String, String> {
    let hub_home = get_hub_home();
    let apps_dir = hub_home.join("Apps").join(&app_id);
    let os = std::env::consts::OS;

    let target_file = match os {
        "windows" => apps_dir.join(format!("{}.exe", app_id)),
        "macos" => apps_dir.join(format!("{}.app", app_id)),
        _ => apps_dir.join(format!("{}.AppImage", app_id)),
    };

    if target_file.exists() {
        let mut cmd = std::process::Command::new(&target_file);
        if let Some(ref path) = file_path_optional {
            cmd.arg(path);
        }
        cmd.spawn().map_err(|e| format!("Feil ved oppstart av {}: {}", app_id, e))?;
        Ok(format!("Startet native app: {}", target_file.display()))
    } else {
        if let Some(ref path) = file_path_optional {
            #[cfg(target_os = "windows")]
            {
                let _ = std::process::Command::new("cmd")
                    .args(["/c", "start", "", path])
                    .spawn();
            }
            #[cfg(target_os = "macos")]
            {
                let _ = std::process::Command::new("open").arg(path).spawn();
            }
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("xdg-open").arg(path).spawn();
            }
        }
        Ok(format!("Applikasjon {} åpnet (simulatormodus / system-visning)", app_id))
    }
}

fn scan_single_project(project_dir: &Path) -> Result<SmartProject, String> {
    let folder_name = project_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Ukjent prosjekt")
        .to_string();

    let manifest_path = project_dir.join("project.artcraft.json");
    let mut proj_id = format!("proj-{}", folder_name);
    let mut proj_name = folder_name.clone();
    let mut proj_type = "Generelt prosjekt".to_string();
    let mut description = "".to_string();
    let mut created_at = chrono_now();
    let mut updated_at = chrono_now();
    let mut recommended_apps: Vec<String> = vec!["photocraft".to_string(), "vectorcraft".to_string()];

    if let Ok(content) = fs::read_to_string(&manifest_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(id) = json.get("id").and_then(|v| v.as_str()) {
                proj_id = id.to_string();
            }
            if let Some(name) = json.get("name").and_then(|v| v.as_str()) {
                proj_name = name.to_string();
            }
            if let Some(t) = json.get("type").and_then(|v| v.as_str()) {
                proj_type = t.to_string();
            }
            if let Some(d) = json.get("description").and_then(|v| v.as_str()) {
                description = d.to_string();
            }
            if let Some(c) = json.get("createdAt").and_then(|v| v.as_str()) {
                created_at = c.to_string();
            }
            if let Some(u) = json.get("updatedAt").and_then(|v| v.as_str()) {
                updated_at = u.to_string();
            }
            if let Some(apps) = json.get("recommendedApps").and_then(|v| v.as_array()) {
                recommended_apps = apps
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();
            }
        }
    }

    let mut files = Vec::new();
    traverse_project_files(project_dir, project_dir, &mut files);

    Ok(SmartProject {
        id: proj_id,
        name: proj_name,
        project_type: proj_type,
        description,
        created_at,
        updated_at,
        folder_path: project_dir.to_string_lossy().to_string(),
        files,
        recommended_apps,
    })
}

fn traverse_project_files(root_dir: &Path, current_dir: &Path, list: &mut Vec<ProjectFileInfo>) {
    if let Ok(entries) = fs::read_dir(current_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let file_name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                if file_name == "project.artcraft.json" {
                    continue;
                }

                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| format!(".{}", e.to_lowercase()))
                    .unwrap_or_default();

                let metadata = fs::metadata(&path).ok();
                let size_bytes = metadata.map(|m| m.len()).unwrap_or(0);
                let relative = path
                    .strip_prefix(root_dir)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .replace('\\', "/");

                let folder = relative
                    .split('/')
                    .next()
                    .unwrap_or("Hovedmappe")
                    .to_string();

                let compatible_apps = get_compatible_apps_for_ext(&ext);

                list.push(ProjectFileInfo {
                    name: file_name,
                    relative_path: relative,
                    absolute_path: path.to_string_lossy().to_string(),
                    extension: ext,
                    size_bytes,
                    folder,
                    compatible_apps,
                });
            } else if path.is_dir() {
                traverse_project_files(root_dir, &path, list);
            }
        }
    }
}

pub fn get_compatible_apps_for_ext(ext: &str) -> Vec<String> {
    match ext {
        ".png" | ".jpg" | ".jpeg" | ".webp" | ".psd" => vec!["photocraft".to_string(), "lightcraft".to_string()],
        ".svg" | ".eps" | ".ai" => vec!["vectorcraft".to_string(), "designcraft".to_string(), "figcraft".to_string()],
        ".mp4" | ".mov" | ".mkv" | ".webm" => vec!["filmcraft".to_string(), "effectcraft".to_string()],
        ".raw" | ".cr2" | ".nef" | ".dng" | ".arw" => vec!["lightcraft".to_string(), "photocraft".to_string()],
        ".pdf" => vec!["pdfcraft".to_string(), "designcraft".to_string()],
        ".mg" | ".json" => vec!["effectcraft".to_string(), "figcraft".to_string()],
        ".fig" => vec!["figcraft".to_string()],
        ".idml" => vec!["designcraft".to_string()],
        ".wav" | ".mp3" | ".flac" | ".ogg" | ".aac" => vec!["soundcraft".to_string(), "filmcraft".to_string()],
        _ => vec!["photocraft".to_string(), "vectorcraft".to_string()],
    }
}

#[tauri::command]
pub fn create_smart_project(
    project_name: String,
    project_type: String,
    description: String,
) -> Result<SmartProject, String> {
    let sanitized_name = project_name
        .trim()
        .replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    if sanitized_name.is_empty() {
        return Err("Ugyldig prosjektnavn".to_string());
    }

    let projects_dir = get_hub_home().join("Projects");
    let project_dir = projects_dir.join(&sanitized_name);

    if project_dir.exists() {
        return Err(format!("Et prosjekt med navnet '{}' finnes allerede", sanitized_name));
    }

    fs::create_dir_all(&project_dir).map_err(|e| e.to_string())?;

    let subfolders = [
        "01_References",
        "02_Vectors_and_Patterns",
        "03_Photos_and_Textures",
        "04_Audio_and_Video",
        "05_Exports",
    ];

    for sub in &subfolders {
        fs::create_dir_all(project_dir.join(sub)).map_err(|e| e.to_string())?;
    }

    let ref_readme = project_dir.join("01_References").join("project_notes.txt");
    let _ = fs::write(
        ref_readme,
        format!(
            "ArtCraft Smart-Prosjekt: {}\nType: {}\nBeskrivelse: {}\nOpprettet: {}\n",
            sanitized_name,
            project_type,
            description,
            chrono_now()
        ),
    );

    let starter_svg = project_dir.join("02_Vectors_and_Patterns").join("brand_mark.svg");
    let svg_content = r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="#0f172a"/>
  <circle cx="100" cy="100" r="50" fill="url(#g)"/>
  <polygon points="100,60 135,120 65,120" fill="#ffffff" opacity="0.9"/>
</svg>"##;
    let _ = fs::write(starter_svg, svg_content);

    let recommended: Vec<String> = match project_type.as_str() {
        "Brand Identity" | "Vektor & Logo" => vec!["vectorcraft".to_string(), "designcraft".to_string(), "figcraft".to_string()],
        "Foto & Retusj" | "Fotografi" => vec!["lightcraft".to_string(), "photocraft".to_string()],
        "Film & Motion" | "Video & VFX" => vec!["filmcraft".to_string(), "effectcraft".to_string(), "soundcraft".to_string()],
        "Publisering & PDF" => vec!["designcraft".to_string(), "pdfcraft".to_string()],
        _ => vec!["photocraft".to_string(), "vectorcraft".to_string(), "figcraft".to_string()],
    };

    let project_manifest = serde_json::json!({
        "id": format!("proj-{}", generate_id()),
        "name": sanitized_name,
        "type": project_type,
        "description": description,
        "createdAt": chrono_now(),
        "updatedAt": chrono_now(),
        "structure": subfolders,
        "recommendedApps": recommended,
    });

    let manifest_path = project_dir.join("project.artcraft.json");
    let _ = fs::write(
        manifest_path,
        serde_json::to_string_pretty(&project_manifest).unwrap_or_default(),
    );

    let scanned = scan_single_project(&project_dir)?;
    Ok(scanned)
}

#[tauri::command]
pub fn scan_projects_and_files() -> Result<Vec<SmartProject>, String> {
    let projects_dir = get_hub_home().join("Projects");
    fs::create_dir_all(&projects_dir).map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Ok(project) = scan_single_project(&path) {
                    projects.push(project);
                }
            }
        }
    }

    projects.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(projects)
}

#[tauri::command]
pub fn load_palettes() -> Result<Vec<ColorPalette>, String> {
    let assets_dir = get_hub_home().join("Assets");
    fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    let file_path = assets_dir.join("palettes.json");

    if !file_path.exists() {
        let defaults = get_default_palettes();
        if let Ok(json) = serde_json::to_string_pretty(&defaults) {
            let _ = fs::write(&file_path, json);
        }
        return Ok(defaults);
    }

    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let palettes: Vec<ColorPalette> = serde_json::from_str(&content).unwrap_or_else(|_| get_default_palettes());
    Ok(palettes)
}

#[tauri::command]
pub fn save_palettes(palettes_json: String) -> Result<bool, String> {
    let assets_dir = get_hub_home().join("Assets");
    fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    let file_path = assets_dir.join("palettes.json");

    let _parsed: Vec<ColorPalette> =
        serde_json::from_str(&palettes_json).map_err(|e| format!("Ugyldig palett-format: {}", e))?;

    fs::write(&file_path, palettes_json).map_err(|e| e.to_string())?;
    Ok(true)
}
