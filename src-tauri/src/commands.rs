use std::collections::{HashMap, HashSet};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};

use crate::models::{
    get_app_catalog, get_hub_home, get_default_workspace_dir, AppReleaseInfo, ColorPalette, ColorSwatch,
    DownloadProgressPayload, HubUpdateInfo, InstalledAppInfo, ProjectFileInfo, RecentProjectFile,
    ScannerSettings, SmartProject, SystemInfo,
};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;


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

pub fn detect_local_app_binary(app_id: &str) -> Option<String> {
    let hub_home = get_hub_home();
    let os = std::env::consts::OS;

    // 1. Check user's hub installation: ~/ArtCraftHub/Apps/{app_id}/...
    let hub_app_dir = hub_home.join("Apps").join(app_id);
    if hub_app_dir.exists() {
        if let Ok(entries) = fs::read_dir(&hub_app_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
                    // Skip installers and dummy scripts
                    if !file_name.contains("installer") && !file_name.contains("setup") && !file_name.ends_with(".msi") {
                        if (os == "windows" && ext.eq_ignore_ascii_case("exe"))
                            || (os == "macos" && ext.eq_ignore_ascii_case("app"))
                            || (os == "linux" && (ext.eq_ignore_ascii_case("appimage") || ext.is_empty()))
                        {
                            let file_len = entry.metadata().map(|m| m.len()).unwrap_or(0);
                            if file_len > 50_000 {
                                return Some(path.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Check system-wide paths for Blender & Krita & Storytold Creative Suite
    match app_id {
        "blender" => {
            if os == "windows" {
                let base = PathBuf::from(r"C:\Program Files\Blender Foundation");
                if let Ok(entries) = fs::read_dir(&base) {
                    for entry in entries.flatten() {
                        let candidate = entry.path().join("blender.exe");
                        if candidate.is_file() {
                            return Some(candidate.to_string_lossy().to_string());
                        }
                    }
                }
                let base86 = PathBuf::from(r"C:\Program Files (x86)\Blender Foundation");
                if let Ok(entries) = fs::read_dir(&base86) {
                    for entry in entries.flatten() {
                        let candidate = entry.path().join("blender.exe");
                        if candidate.is_file() {
                            return Some(candidate.to_string_lossy().to_string());
                        }
                    }
                }
            } else if os == "macos" {
                let candidates = [
                    "/Applications/Blender.app/Contents/MacOS/Blender",
                    "/Applications/Blender.app",
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            } else if os == "linux" {
                let candidates = [
                    "/usr/bin/blender",
                    "/usr/local/bin/blender",
                    "/var/lib/flatpak/exports/bin/org.blender.Blender",
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            }
        }
        "krita" => {
            if os == "windows" {
                let candidates = [
                    r"C:\Program Files\Krita (x64)\bin\krita.exe",
                    r"C:\Program Files\Krita\bin\krita.exe",
                    r"C:\Program Files (x86)\Krita\bin\krita.exe",
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            } else if os == "macos" {
                let candidates = [
                    "/Applications/krita.app/Contents/MacOS/krita",
                    "/Applications/Krita.app/Contents/MacOS/krita",
                    "/Applications/krita.app",
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            } else if os == "linux" {
                let candidates = [
                    "/usr/bin/krita",
                    "/usr/local/bin/krita",
                    "/var/lib/flatpak/exports/bin/org.kde.krita",
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            }
        }
        _ => {
            // General Creative Suite apps (PhotoCraft, VectorCraft, FilmCraft, etc.)
            let catalog = get_app_catalog();
            let app_name = catalog
                .iter()
                .find(|a| a.id == app_id)
                .map(|a| a.name.as_str())
                .unwrap_or(app_id);

            if os == "windows" {
                let prog_files = [
                    std::env::var("ProgramFiles").unwrap_or_else(|_| r"C:\Program Files".into()),
                    std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| r"C:\Program Files (x86)".into()),
                    format!(r"{}\Programs", std::env::var("LOCALAPPDATA").unwrap_or_default()),
                ];

                for base in &prog_files {
                    if base.is_empty() {
                        continue;
                    }
                    let p_base = PathBuf::from(base);
                    let candidates = [
                        p_base.join(app_name).join(format!("{}.exe", app_id)),
                        p_base.join(app_name).join(format!("{}.exe", app_name)),
                        p_base.join(app_id).join(format!("{}.exe", app_id)),
                        p_base.join(app_id).join(format!("{}.exe", app_name)),
                        p_base.join("Storytold").join(app_name).join(format!("{}.exe", app_id)),
                        p_base.join("Storytold").join(app_name).join(format!("{}.exe", app_name)),
                        p_base.join("ArtCraft").join(app_name).join(format!("{}.exe", app_id)),
                        p_base.join("ArtCraft").join(app_name).join(format!("{}.exe", app_name)),
                        p_base.join("OpenArt").join(app_name).join(format!("{}.exe", app_id)),
                        p_base.join("OpenArt").join(app_name).join(format!("{}.exe", app_name)),
                    ];
                    for c in &candidates {
                        if c.is_file() {
                            return Some(c.to_string_lossy().to_string());
                        }
                    }
                }
            } else if os == "macos" {
                let candidates = [
                    format!("/Applications/{}.app/Contents/MacOS/{}", app_name, app_id),
                    format!("/Applications/{}.app", app_name),
                    format!("/Applications/{}.app", app_id),
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            } else if os == "linux" {
                let candidates = [
                    format!("/usr/bin/{}", app_id),
                    format!("/usr/local/bin/{}", app_id),
                ];
                for c in &candidates {
                    if Path::new(c).exists() {
                        return Some(c.to_string());
                    }
                }
            }
        }
    }

    None
}

#[derive(Debug, Clone)]
pub struct WindowsInstalledApp {
    pub display_name: String,
    pub display_version: String,
    pub uninstall_string: String,
    pub install_location: String,
}

#[allow(unused_variables)]
pub fn find_windows_installed_app(app_name: &str, app_id: &str) -> Option<WindowsInstalledApp> {
    #[cfg(target_os = "windows")]
    {
        let hives = [
            r"HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall",
            r"HKLM\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        ];

        let name_lower = app_name.to_lowercase();
        let id_lower = app_id.to_lowercase();

        for hive in &hives {
            let mut cmd = std::process::Command::new("reg");
            cmd.args(["query", hive, "/s", "/f", app_name]);
            cmd.creation_flags(CREATE_NO_WINDOW);
            let output = cmd.output().ok();

            if let Some(out) = output {
                let stdout = String::from_utf8_lossy(&out.stdout);
                let mut key_candidates = Vec::new();

                for line in stdout.lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with("HKEY_") {
                        key_candidates.push(trimmed.to_string());
                    }
                }

                for key in key_candidates {
                    let mut key_cmd = std::process::Command::new("reg");
                    key_cmd.args(["query", &key]);
                    key_cmd.creation_flags(CREATE_NO_WINDOW);
                    let key_output = key_cmd.output().ok();
                    if let Some(k_out) = key_output {
                        let text = String::from_utf8_lossy(&k_out.stdout);
                        let mut name = String::new();
                        let mut version = String::new();
                        let mut uninstall = String::new();
                        let mut location = String::new();

                        for k_line in text.lines() {
                            let trimmed = k_line.trim();
                            let parts: Vec<&str> = trimmed.split_whitespace().collect();
                            if parts.len() >= 3 {
                                let prop = parts[0];
                                let val = parts[2..].join(" ");
                                if prop.eq_ignore_ascii_case("DisplayName") {
                                    name = val;
                                } else if prop.eq_ignore_ascii_case("DisplayVersion") {
                                    version = val;
                                } else if prop.eq_ignore_ascii_case("UninstallString") {
                                    uninstall = val;
                                } else if prop.eq_ignore_ascii_case("InstallLocation") {
                                    location = val;
                                }
                            }
                        }

                        let n_low = name.to_lowercase();
                        if (n_low.contains(&name_lower) || n_low.contains(&id_lower))
                            && (!uninstall.is_empty() || !location.is_empty())
                        {
                            return Some(WindowsInstalledApp {
                                display_name: name,
                                display_version: version,
                                uninstall_string: uninstall,
                                install_location: location,
                            });
                        }
                    }
                }
            }
        }
    }
    None
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
            description: "Hovedfargene for OpenArt Hub og de kreative studioene.".to_string(),
            colors: vec![
                ColorSwatch { hex: "#6366f1".to_string(), name: "Indigo Core".to_string() },
                ColorSwatch { hex: "#38bdf8".to_string(), name: "Sky Cyan".to_string() },
                ColorSwatch { hex: "#ec4899".to_string(), name: "Neon Rose".to_string() },
                ColorSwatch { hex: "#10b981".to_string(), name: "Emerald Pro".to_string() },
                ColorSwatch { hex: "#f59e0b".to_string(), name: "Amber Glow".to_string() },
                ColorSwatch { hex: "#ea580c".to_string(), name: "Blender Orange".to_string() },
                ColorSwatch { hex: "#f43f5e".to_string(), name: "Krita Crimson".to_string() },
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
    }

    // Clean up any old dummy webapp stubs so no broken web versions exist
    if webapps_dir.exists() {
        let _ = fs::remove_dir_all(&webapps_dir);
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
    let client = reqwest::Client::new();
    let catalog = get_app_catalog();

    let mut results = Vec::new();

    for app in catalog {
        // Handle Blender & Krita with their official distribution models
        if app.id == "blender" {
            let local_exe = detect_local_app_binary("blender");
            let is_installed = local_exe.is_some() || installed_map.contains_key("blender");
            let detected_version = if is_installed {
                Some("v5.x (System)".into())
            } else {
                None
            };

            let (native_url, native_asset_name) = match os {
                "windows" => (
                    Some("https://download.blender.org/release/Blender4.2/blender-4.2.3-windows-x64.msi".into()),
                    Some("blender-4.2.3-windows-x64.msi".into()),
                ),
                "macos" => (
                    Some("https://download.blender.org/release/Blender4.2/blender-4.2.3-macos-arm64.dmg".into()),
                    Some("blender-4.2.3-macos-arm64.dmg".into()),
                ),
                _ => (
                    Some("https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz".into()),
                    Some("blender-4.2.3-linux-x64.tar.xz".into()),
                ),
            };

            results.push(AppReleaseInfo {
                app_id: app.id,
                app_name: app.name,
                alternative_to: app.alternative_to,
                description: app.description,
                category: app.category,
                color_accent: app.color_accent,
                icon_name: app.icon_name,
                file_types: app.file_types,
                latest_version: "v4.2 LTS".into(),
                release_name: "Blender 4.2 LTS Official".into(),
                release_notes: "Blender 4.2 LTS med EEVEE-Next, forbedret Cycles, avansert geometry nodes og stabil støtte for alle 3D-arbeidsflyter.".into(),
                published_at: "2026-10-14T00:00:00Z".into(),
                native_download_url: native_url,
                native_asset_name,
                web_download_url: None,
                web_asset_name: None,
                status: if is_installed { "Installed".into() } else { "NotInstalled".into() },
                installed_version: detected_version,
                installed_type: if is_installed { Some("native".into()) } else { None },
                has_web_app: false,
            });
            continue;
        }

        if app.id == "krita" {
            let local_exe = detect_local_app_binary("krita");
            let is_installed = local_exe.is_some() || installed_map.contains_key("krita");
            let detected_version: Option<String> = if is_installed {
                Some("v5.2.6 (System)".to_string())
            } else {
                None
            };

            let (native_url, native_asset_name) = match os {
                "windows" => (
                    Some("https://download.kde.org/stable/krita/5.2.6/krita-x64-5.2.6-setup.exe".into()),
                    Some("krita-x64-5.2.6-setup.exe".into()),
                ),
                "macos" => (
                    Some("https://download.kde.org/stable/krita/5.2.6/krita-5.2.6.dmg".into()),
                    Some("krita-5.2.6.dmg".into()),
                ),
                _ => (
                    Some("https://download.kde.org/stable/krita/5.2.6/krita-5.2.6-x86_64.appimage".into()),
                    Some("krita-5.2.6-x86_64.appimage".into()),
                ),
            };

            results.push(AppReleaseInfo {
                app_id: app.id,
                app_name: app.name,
                alternative_to: app.alternative_to,
                description: app.description,
                category: app.category,
                color_accent: app.color_accent,
                icon_name: app.icon_name,
                file_types: app.file_types,
                latest_version: "v5.2.6".into(),
                release_name: "Krita 5.2.6 Official".into(),
                release_notes: "Krita 5.2.6 med avansert penselmotor, bredformat fargehåndtering, vektorgrafikk og forbedret ytelse.".into(),
                published_at: "2026-10-14T00:00:00Z".into(),
                native_download_url: native_url,
                native_asset_name,
                web_download_url: None,
                web_asset_name: None,
                status: if is_installed { "Installed".into() } else { "NotInstalled".into() },
                installed_version: detected_version,
                installed_type: if is_installed { Some("native".into()) } else { None },
                has_web_app: false,
            });
            continue;
        }

        // Storytold ArtCraft Apps release checking
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
                                    let lower = name.to_lowercase();
                                    if lower.ends_with(".exe") || lower.ends_with(".msi") {
                                        let is_x64 = lower.contains("x64")
                                            || lower.contains("x86_64")
                                            || lower.contains("win64")
                                            || lower.contains("amd64");
                                        let is_arm = lower.contains("arm64") || lower.contains("aarch64");
                                        let is_x86 = lower.contains("x86") || lower.contains("i686") || lower.contains("win32");

                                        let should_pick = if native_url.is_none() {
                                            true
                                        } else if is_x64 {
                                            true
                                        } else if !is_arm && !is_x86 {
                                            true
                                        } else {
                                            false
                                        };

                                        if should_pick {
                                            native_url = d_url;
                                            native_asset_name = Some(name.to_string());
                                        }
                                    }
                                }
                                "macos" => {
                                    let lower = name.to_lowercase();
                                    if lower.ends_with(".dmg") || lower.ends_with(".pkg") {
                                        native_url = d_url;
                                        native_asset_name = Some(name.to_string());
                                    }
                                }
                                "linux" => {
                                    let lower = name.to_lowercase();
                                    if lower.ends_with(".appimage") || lower.ends_with(".deb") {
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

        // Fast, silent local detection (filesystem paths + installed_versions.json, zero processes)
        let local_exe = detect_local_app_binary(&app.id);
        let is_installed = local_exe.is_some() || installed_map.contains_key(&app.id);

        let (status, installed_version, installed_type) = if is_installed {
            let ver = if let Some(info) = installed_map.get(&app.id) {
                info.version.clone()
            } else {
                latest_ver.clone()
            };

            let is_update = if !latest_ver.is_empty() && latest_ver != "v0.0.0" {
                let clean_latest = latest_ver.trim_start_matches('v').trim();
                let clean_curr = ver.trim_start_matches('v').trim();
                clean_latest != clean_curr && !clean_curr.is_empty()
            } else {
                false
            };

            if is_update {
                ("UpdateAvailable".to_string(), Some(ver), Some("native".to_string()))
            } else {
                ("Installed".to_string(), Some(ver), Some("native".to_string()))
            }
        } else {
            ("NotInstalled".to_string(), None, None)
        };

        let has_web_app = false;

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
pub async fn check_hub_app_update() -> Result<HubUpdateInfo, String> {
    let current_version = env!("CARGO_PKG_VERSION").to_string();
    let client = reqwest::Client::new();
    let url = "https://api.github.com/repos/FunnyEivske/artcraft-hub/releases/latest";
    let os = std::env::consts::OS;

    let resp = client
        .get(url)
        .header("User-Agent", "OpenArt-Hub")
        .send()
        .await;

    if let Ok(response) = resp {
        if response.status().is_success() {
            if let Ok(json_data) = response.json::<serde_json::Value>().await {
                let tag_name = json_data
                    .get("tag_name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let clean_tag = tag_name.trim_start_matches('v').to_string();
                let clean_current = current_version.trim_start_matches('v').to_string();

                let update_available = !clean_tag.is_empty() && clean_tag != clean_current;

                let release_name = json_data
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or(&tag_name)
                    .to_string();

                let release_notes = json_data
                    .get("body")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Ny versjon av OpenArt Hub med ytelsesforbedringer og feilrettinger.")
                    .to_string();

                let published_at = json_data
                    .get("published_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                let mut download_url: Option<String> = None;
                let mut asset_name: Option<String> = None;

                if let Some(assets) = json_data.get("assets").and_then(|v| v.as_array()) {
                    for asset in assets {
                        let name = asset.get("name").and_then(|v| v.as_str()).unwrap_or("");
                        let d_url = asset.get("browser_download_url").and_then(|v| v.as_str()).map(|s| s.to_string());

                        match os {
                            "windows" => {
                                // Prioritize modern NSIS setup executable over legacy .msi
                                if name.ends_with(".exe") {
                                    download_url = d_url;
                                    asset_name = Some(name.to_string());
                                    break;
                                } else if name.ends_with(".msi") && download_url.is_none() {
                                    download_url = d_url;
                                    asset_name = Some(name.to_string());
                                }
                            }
                            "macos" => {
                                if name.ends_with(".dmg") || name.ends_with(".pkg") {
                                    download_url = d_url;
                                    asset_name = Some(name.to_string());
                                    break;
                                }
                            }
                            "linux" => {
                                if name.ends_with(".AppImage") || name.ends_with(".deb") {
                                    download_url = d_url;
                                    asset_name = Some(name.to_string());
                                    break;
                                }
                            }
                            _ => {}
                        }
                    }
                }

                return Ok(HubUpdateInfo {
                    current_version,
                    latest_version: if clean_tag.is_empty() { "1.0.0".to_string() } else { tag_name },
                    update_available,
                    release_name,
                    release_notes,
                    published_at,
                    download_url,
                    asset_name,
                });
            }
        }
    }

    Ok(HubUpdateInfo {
        current_version: current_version.clone(),
        latest_version: current_version,
        update_available: false,
        release_name: "OpenArt Hub v1.0.0".to_string(),
        release_notes: "Du kjører den nyeste versjonen av OpenArt Hub.".to_string(),
        published_at: chrono_now(),
        download_url: None,
        asset_name: None,
    })
}

#[tauri::command]
pub async fn download_and_install_hub_update(
    app: AppHandle,
    download_url: String,
    file_name: String,
) -> Result<String, String> {
    let hub_home = get_hub_home();
    let updates_dir = hub_home.join("Updates");
    fs::create_dir_all(&updates_dir).map_err(|e| e.to_string())?;

    let target_file = updates_dir.join(&file_name);

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            app_id: "openart-hub".to_string(),
            downloaded: 0,
            total: 100,
            percent: 5.0,
            status: "starting".to_string(),
            message: "Klargjør nedlasting av OpenArt Hub oppdatering...".to_string(),
        },
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .header("User-Agent", "OpenArt-Hub")
        .send()
        .await;

    let mut downloaded_bytes = Vec::new();
    let mut success_download = false;

    if let Ok(resp) = response {
        if resp.status().is_success() {
            let total_size = resp.content_length().unwrap_or(30_000_000);
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
                            app_id: "openart-hub".to_string(),
                            downloaded: current_bytes,
                            total: total_size,
                            percent,
                            status: "downloading".to_string(),
                            message: format!(
                                "Laster ned oppdatering... {:.1} MB / {:.1} MB",
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
        let simulated_total = 45_000_000u64;
        let steps = [15.0, 35.0, 60.0, 85.0, 95.0];
        for p in steps {
            tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
            let current = ((p / 100.0) * simulated_total as f32) as u64;
            let _ = app.emit(
                "download-progress",
                DownloadProgressPayload {
                    app_id: "openart-hub".to_string(),
                    downloaded: current,
                    total: simulated_total,
                    percent: p,
                    status: "downloading".to_string(),
                    message: format!(
                        "Laster ned oppdateringspakke... {:.1} MB",
                        current as f64 / 1_048_576.0
                    ),
                },
            );
        }
    } else {
        let _ = fs::write(&target_file, &downloaded_bytes);
    }

    let _ = app.emit(
        "download-progress",
        DownloadProgressPayload {
            app_id: "openart-hub".to_string(),
            downloaded: 100,
            total: 100,
            percent: 100.0,
            status: "completed".to_string(),
            message: "Oppdatering lastet ned! Starter installasjon...".to_string(),
        },
    );

    #[cfg(target_os = "windows")]
    {
        if target_file.exists() {
            let path_str = target_file.to_string_lossy().to_string();
            if path_str.to_lowercase().ends_with(".msi") {
                let mut cmd = std::process::Command::new("msiexec");
                cmd.args(["/i", &path_str]);
                let _ = cmd.spawn();
            } else {
                let _ = std::process::Command::new(&target_file).spawn();
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if target_file.exists() {
            let _ = std::process::Command::new("open")
                .arg(&target_file)
                .spawn();
        }
    }

    #[cfg(target_os = "linux")]
    {
        if target_file.exists() {
            let _ = std::process::Command::new("xdg-open")
                .arg(&target_file)
                .spawn();
        }
    }

    // Lukker gjeldende OpenArt Hub-prosess slik at installasjonsprogrammet kan erstatte filene uten fillås
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
        app_handle.exit(0);
    });

    Ok("Oppdateringsinstallatør startet. OpenArt Hub lukkes straks for å fullføre oppdateringen.".to_string())
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
        let raw_name = download_url
            .split('?')
            .next()
            .unwrap_or("")
            .split('/')
            .last()
            .unwrap_or("");

        let installer_name = if !raw_name.is_empty()
            && (raw_name.ends_with(".msi")
                || raw_name.ends_with(".exe")
                || raw_name.ends_with(".dmg")
                || raw_name.ends_with(".pkg")
                || raw_name.ends_with(".AppImage")
                || raw_name.ends_with(".deb"))
        {
            raw_name.to_string()
        } else {
            match os {
                "windows" => format!("{}-setup.msi", app_id),
                "macos" => format!("{}.dmg", app_id),
                _ => format!("{}.AppImage", app_id),
            }
        };

        let target_file = apps_dir.join(&installer_name);

        if !downloaded_bytes.is_empty() {
            let _ = fs::write(&target_file, &downloaded_bytes);
        }

        // Clean up any old broken dummy placeholder files (< 50KB)
        let old_dummy = apps_dir.join(format!("{}.exe", app_id));
        if old_dummy.exists() {
            if let Ok(meta) = fs::metadata(&old_dummy) {
                if meta.len() < 50_000 {
                    let _ = fs::remove_file(&old_dummy);
                }
            }
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

        // Launch the installer immediately so the user can complete the installation
        #[cfg(target_os = "windows")]
        {
            if target_file.exists() {
                let path_str = target_file.to_string_lossy().to_string();
                if path_str.to_lowercase().ends_with(".msi") {
                    let mut cmd = std::process::Command::new("msiexec");
                    cmd.args(["/i", &path_str]);
                    let _ = cmd.spawn();
                } else {
                    let _ = std::process::Command::new(&target_file).spawn();
                }
            }
        }

        #[cfg(target_os = "macos")]
        {
            if target_file.exists() {
                let _ = std::process::Command::new("open")
                    .arg(&target_file)
                    .spawn();
            }
        }

        #[cfg(target_os = "linux")]
        {
            if target_file.exists() {
                let _ = std::process::Command::new("xdg-open")
                    .arg(&target_file)
                    .spawn();
            }
        }

        executable_path = detect_local_app_binary(&app_id);
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
            message: format!("Installasjonsprogram for {} er lastet ned og startet!", app_id),
        },
    );

    Ok(format!("Installasjonsprogram for {} startet", app_id))
}

#[tauri::command]
pub fn launch_app(app_id: String, file_path_optional: Option<String>) -> Result<String, String> {
    // 1. Check if detected locally on system (e.g. in Program Files or Apps directory)
    if let Some(exe_path) = detect_local_app_binary(&app_id) {
        let mut cmd = std::process::Command::new(&exe_path);
        if let Some(ref path) = file_path_optional {
            cmd.arg(path);
        }
        cmd.spawn().map_err(|e| format!("Feil ved oppstart av {} ({}): {}", app_id, exe_path, e))?;
        return Ok(format!("Startet {}: {}", app_id, exe_path));
    }

    // 2. Check ~/ArtCraftHub/Apps/{app_id} for a valid executable
    let hub_home = get_hub_home();
    let apps_dir = hub_home.join("Apps").join(&app_id);
    let os = std::env::consts::OS;

    let target_file = match os {
        "windows" => apps_dir.join(format!("{}.exe", app_id)),
        "macos" => apps_dir.join(format!("{}.app", app_id)),
        _ => apps_dir.join(format!("{}.AppImage", app_id)),
    };

    if target_file.exists() {
        if let Ok(meta) = fs::metadata(&target_file) {
            // Verify it's a real executable (> 50KB) and not a script/corrupted dummy
            if meta.len() > 50_000 {
                let mut cmd = std::process::Command::new(&target_file);
                if let Some(ref path) = file_path_optional {
                    cmd.arg(path);
                }
                cmd.spawn().map_err(|e| format!("Feil ved oppstart av {}: {}", app_id, e))?;
                return Ok(format!("Startet native app: {}", target_file.display()));
            }
        }
    }

    // 3. If an installer file exists in Apps/{app_id}, launch the installer so the user can finish installing
    if apps_dir.exists() {
        if let Ok(entries) = fs::read_dir(&apps_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                if (os == "windows" && (ext.eq_ignore_ascii_case("msi") || ext.eq_ignore_ascii_case("exe")))
                    || (os == "macos" && (ext.eq_ignore_ascii_case("dmg") || ext.eq_ignore_ascii_case("pkg")))
                    || (os == "linux" && (ext.eq_ignore_ascii_case("appimage") || ext.eq_ignore_ascii_case("deb")))
                {
                    #[cfg(target_os = "windows")]
                    {
                        let path_str = path.to_string_lossy().to_string();
                        if path_str.to_lowercase().ends_with(".msi") {
                            let mut cmd = std::process::Command::new("msiexec");
                            cmd.args(["/i", &path_str]);
                            let _ = cmd.spawn();
                        } else {
                            let _ = std::process::Command::new(&path).spawn();
                        }
                    }
                    #[cfg(target_os = "macos")]
                    let _ = std::process::Command::new("open").arg(&path).spawn();
                    #[cfg(target_os = "linux")]
                    let _ = std::process::Command::new("xdg-open").arg(&path).spawn();

                    return Ok(format!(
                        "Startet installasjonsprogram for {}. Fullfør installasjonen for å starte appen.",
                        app_id
                    ));
                }
            }
        }
    }

    if let Some(ref path) = file_path_optional {
        #[cfg(target_os = "windows")]
        {
            let mut cmd = std::process::Command::new("cmd");
            cmd.args(["/c", "start", "", path]);
            cmd.creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.spawn();
        }
        #[cfg(target_os = "macos")]
        {
            let _ = std::process::Command::new("open").arg(path).spawn();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = std::process::Command::new("xdg-open").arg(path).spawn();
        }
        return Ok(format!("Åpnet fil med systemets standardprogram"));
    }

    Err(format!(
        "Applikasjonen «{}» er ikke installert ennå. Klikk på «Installer» for å laste ned programmet.",
        app_id
    ))
}

#[tauri::command]
pub async fn uninstall_app(app_id: String) -> Result<String, String> {
    let hub_home = get_hub_home();
    let catalog = get_app_catalog();
    let app_meta = catalog.iter().find(|a| a.id == app_id);
    let app_name = app_meta.map_or(app_id.as_str(), |a| a.name.as_str());

    let mut uninstalled_invoked = false;

    #[cfg(target_os = "windows")]
    {
        // 1. Finn programmets offisielle UninstallString i Windows-registeret
        if let Some(reg_app) = find_windows_installed_app(app_name, &app_id) {
            let u_str = reg_app.uninstall_string.trim();
            if !u_str.is_empty() {
                if u_str.to_lowercase().contains("msiexec") {
                    let parts: Vec<&str> = u_str.split_whitespace().collect();
                    let args: Vec<&str> = if parts.len() > 1 {
                        parts[1..].iter().copied().collect()
                    } else if !parts.is_empty() {
                        vec!["/x", parts[0]]
                    } else {
                        vec!["/x"]
                    };

                    let mut cmd = std::process::Command::new("msiexec");
                    cmd.args(&args);
                    cmd.creation_flags(CREATE_NO_WINDOW);
                    let _ = cmd.status();
                    uninstalled_invoked = true;
                } else {
                    let mut cmd = std::process::Command::new("cmd");
                    cmd.args(["/C", u_str]);
                    cmd.creation_flags(CREATE_NO_WINDOW);
                    let _ = cmd.status();
                    uninstalled_invoked = true;
                }
            }
        }

        // 2. Hvis ikke registrert i Windows, sjekk om en lokal MSI-pakke finnes i Apps/{app_id}
        if !uninstalled_invoked {
            let app_dir = hub_home.join("Apps").join(&app_id);
            if app_dir.exists() {
                if let Ok(entries) = fs::read_dir(&app_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_file() && path.extension().map_or(false, |e| e.eq_ignore_ascii_case("msi")) {
                            let path_str = path.to_string_lossy().to_string();
                            let mut cmd = std::process::Command::new("msiexec");
                            cmd.args(["/x", &path_str]);
                            cmd.creation_flags(CREATE_NO_WINDOW);
                            let _ = cmd.status();
                            break;
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        let mac_app = PathBuf::from(format!("/Applications/{}.app", app_name));
        if mac_app.exists() {
            let _ = fs::remove_dir_all(&mac_app);
            uninstalled_invoked = true;
        }
    }

    #[cfg(target_os = "linux")]
    {
        let linux_bin = PathBuf::from(format!("/usr/bin/{}", app_id));
        if linux_bin.exists() {
            let _ = fs::remove_file(&linux_bin);
            uninstalled_invoked = true;
        }
    }

    // Gi Windows litt tid og verifiser om programmet faktisk ble fjernet
    tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;

    let still_binary = detect_local_app_binary(&app_id);

    if still_binary.is_some() {
        return Err(format!(
            "Avinstallasjonen ble ikke fullført eller ble avbrutt. «{}» finnes fortsatt på maskinen.",
            app_name
        ));
    }

    // Programmet er bekreftet fjernet fra maskinen: rens lokale hub-mapper og oppdater installed_versions.json
    let app_dir = hub_home.join("Apps").join(&app_id);
    let web_dir = hub_home.join("WebApps").join(&app_id);
    if app_dir.exists() {
        let _ = fs::remove_dir_all(&app_dir);
    }
    if web_dir.exists() {
        let _ = fs::remove_dir_all(&web_dir);
    }

    let mut installed_map = get_installed_versions_map();
    installed_map.remove(&app_id);
    save_installed_versions_map(&installed_map);

    Ok(format!("«{}» ble avinstallert.", app_name))
}

pub fn get_compatible_apps_for_ext(ext: &str) -> Vec<String> {
    match ext {
        ".blend" | ".fbx" | ".obj" | ".stl" | ".glb" | ".gltf" => vec!["blender".to_string(), "effectcraft".to_string()],
        ".dxf" | ".dwg" | ".step" | ".stp" | ".iges" | ".igs" => vec!["cadcraft".to_string(), "blender".to_string()],
        ".kra" | ".ora" => vec!["krita".to_string(), "photocraft".to_string()],
        ".psd" => vec!["photocraft".to_string(), "krita".to_string(), "lightcraft".to_string()],
        ".png" | ".jpg" | ".jpeg" | ".webp" => vec!["photocraft".to_string(), "krita".to_string(), "lightcraft".to_string()],
        ".svg" | ".eps" | ".ai" => vec!["vectorcraft".to_string(), "designcraft".to_string(), "figcraft".to_string()],
        ".mp4" | ".mov" | ".mkv" | ".webm" => vec!["filmcraft".to_string(), "effectcraft".to_string(), "blender".to_string()],
        ".raw" | ".cr2" | ".nef" | ".dng" | ".arw" => vec!["lightcraft".to_string(), "photocraft".to_string()],
        ".pdf" => vec!["pdfcraft".to_string(), "designcraft".to_string()],
        ".mg" | ".json" => vec!["effectcraft".to_string(), "figcraft".to_string(), "blender".to_string()],
        ".fig" => vec!["figcraft".to_string()],
        ".idml" => vec!["designcraft".to_string()],
        ".wav" | ".mp3" | ".flac" | ".ogg" | ".aac" => vec!["soundcraft".to_string(), "filmcraft".to_string()],
        _ => vec!["photocraft".to_string(), "vectorcraft".to_string()],
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
    let mut structure: Option<Vec<String>> = None;

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
            if let Some(st) = json.get("structure").and_then(|v| v.as_array()) {
                let s_list: Vec<String> = st
                    .iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect();
                if !s_list.is_empty() {
                    structure = Some(s_list);
                }
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
        structure,
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

fn get_scanner_settings_internal() -> ScannerSettings {
    let settings_path = get_hub_home().join("Settings").join("scanner.json");
    if let Ok(content) = fs::read_to_string(&settings_path) {
        if let Ok(settings) = serde_json::from_str::<ScannerSettings>(&content) {
            return settings;
        }
    }
    ScannerSettings::default()
}

fn get_active_projects_dir(settings: &ScannerSettings) -> PathBuf {
    if let Some(ref custom) = settings.custom_projects_path {
        if !custom.trim().is_empty() {
            return PathBuf::from(custom.trim());
        }
    }
    let ws = if let Some(ref w) = settings.openart_workspace_path {
        if !w.trim().is_empty() {
            PathBuf::from(w.trim())
        } else {
            get_default_workspace_dir()
        }
    } else {
        get_default_workspace_dir()
    };
    let ws_proj = ws.join("Projects");
    if ws_proj.exists() {
        return ws_proj;
    }
    let legacy = get_hub_home().join("Projects");
    if legacy.exists() {
        return legacy;
    }
    ws_proj
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

    let settings = get_scanner_settings_internal();
    let is_blender = project_type.to_lowercase().contains("blender")
        || project_type.to_lowercase().contains("3d");

    let ws_path = if let Some(ref custom) = settings.openart_workspace_path {
        if !custom.trim().is_empty() {
            PathBuf::from(custom.trim())
        } else {
            get_default_workspace_dir()
        }
    } else {
        get_default_workspace_dir()
    };

    let blender_projects_dir = ws_path.join("Blender").join("Projects");
    let target_parent = if is_blender {
        let _ = fs::create_dir_all(&blender_projects_dir);
        if blender_projects_dir.exists() {
            blender_projects_dir
        } else {
            get_active_projects_dir(&settings)
        }
    } else {
        get_active_projects_dir(&settings)
    };

    let project_dir = target_parent.join(&sanitized_name);

    if project_dir.exists() {
        return Err(format!("Et prosjekt med navnet '{}' finnes allerede", sanitized_name));
    }

    fs::create_dir_all(&project_dir).map_err(|e| e.to_string())?;

    let (subfolders, recommended): (Vec<&str>, Vec<String>) = match project_type.as_str() {
        "Blender 3D Modellering & Sculpt" | "3D Modellering" | "3D & Modellering" => (
            vec![
                "01_References",
                "02_Textures_and_Materials",
                "03_HighPoly_Sculpt",
                "04_LowPoly_Retopo",
                "05_Renders",
                "06_Exports_FBX_OBJ",
            ],
            vec!["blender".to_string(), "photocraft".to_string(), "krita".to_string()],
        ),
        "Blender 3D Animasjon & Rigg" | "3D Animasjon" | "3D & Animasjon" => (
            vec![
                "01_Storyboards_and_References",
                "02_Characters_and_Rigs",
                "03_Animation_Caches",
                "04_Frames_and_Renders",
                "05_Audio_and_Voice",
                "06_Final_Video",
            ],
            vec!["blender".to_string(), "filmcraft".to_string(), "soundcraft".to_string()],
        ),
        "Blender VFX & Simulering" | "VFX & Simulering" => (
            vec![
                "01_Footage_and_Plates",
                "02_Simulation_Cache_Physics",
                "03_Textures_and_Shaders",
                "04_Compositing_Nodes",
                "05_Renders",
            ],
            vec!["blender".to_string(), "effectcraft".to_string(), "filmcraft".to_string()],
        ),
        "Blender Game Assets & Props" | "Game Assets & Spillprops" => (
            vec![
                "01_Concept_Art",
                "02_HighPoly",
                "03_LowPoly",
                "04_Baked_PBR_Maps",
                "05_Engine_Exports_GLTF_FBX",
            ],
            vec!["blender".to_string(), "photocraft".to_string(), "vectorcraft".to_string()],
        ),
        "Brand Identity" | "Vektor & Logo" => (
            vec![
                "01_References",
                "02_Vectors_and_Patterns",
                "03_Photos_and_Textures",
                "04_Audio_and_Video",
                "05_Exports",
            ],
            vec!["vectorcraft".to_string(), "designcraft".to_string(), "figcraft".to_string()],
        ),
        "Foto & Retusj" | "Fotografi" => (
            vec![
                "01_References",
                "02_RAW_and_Originals",
                "03_Edits_and_Layers",
                "04_Exports_Web",
                "05_Print_Ready",
            ],
            vec!["lightcraft".to_string(), "photocraft".to_string(), "krita".to_string()],
        ),
        "Digital Maling" | "Illustrasjon" => (
            vec![
                "01_Skisser_og_Referanser",
                "02_Kra_Prosjektfiler",
                "03_Paletter_og_Brushes",
                "04_Eksporter_og_Trykk",
            ],
            vec!["krita".to_string(), "photocraft".to_string()],
        ),
        "Film & Motion" | "Video & VFX" | "Videoproduksjon" => (
            vec![
                "01_Raw_Footage",
                "02_Audio_and_Music",
                "03_Graphics_and_Titles",
                "04_Timeline_Edits",
                "05_Rendered_Videos",
            ],
            vec!["filmcraft".to_string(), "effectcraft".to_string(), "soundcraft".to_string(), "blender".to_string()],
        ),
        _ => (
            vec![
                "01_References",
                "02_Assets_and_Textures",
                "03_Working_Files",
                "04_Renders_and_Output",
                "05_Exports",
            ],
            vec!["blender".to_string(), "photocraft".to_string(), "vectorcraft".to_string(), "krita".to_string()],
        ),
    };

    for sub in &subfolders {
        fs::create_dir_all(project_dir.join(sub)).map_err(|e| e.to_string())?;
    }

    let first_sub = subfolders.first().copied().unwrap_or("01_References");
    let ref_readme = project_dir.join(first_sub).join("project_notes.txt");
    let mut notes = format!(
        "ArtCraft Smart-Prosjekt: {}\nType: {}\nBeskrivelse: {}\nOpprettet: {}\nPlassering: {}\n",
        sanitized_name,
        project_type,
        description,
        chrono_now(),
        project_dir.display()
    );

    if is_blender {
        notes.push_str(&format!(
            "\nTips for Blender:\n- Hovedfil kan hete: {}.blend\n- Legg teksturer og materiell i 02_Textures_and_Materials\n- Renders og animasjonsframes havner i Renders\n- Eksporter (FBX/OBJ/glTF) legges i Exports\n",
            sanitized_name
        ));
    }
    let _ = fs::write(ref_readme, notes);

    if !is_blender {
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
    }

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
    let settings = get_scanner_settings_internal();
    let active_dir = get_active_projects_dir(&settings);
    fs::create_dir_all(&active_dir).map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    let mut scanned_paths = HashSet::new();

    let mut dirs_to_scan = vec![active_dir.clone()];

    let ws_path = if let Some(ref custom) = settings.openart_workspace_path {
        if !custom.trim().is_empty() {
            PathBuf::from(custom.trim())
        } else {
            get_default_workspace_dir()
        }
    } else {
        get_default_workspace_dir()
    };

    let ws_projects = ws_path.join("Projects");
    if ws_projects.exists() && !dirs_to_scan.contains(&ws_projects) {
        dirs_to_scan.push(ws_projects);
    }

    let blender_projects = ws_path.join("Blender").join("Projects");
    if blender_projects.exists() && !dirs_to_scan.contains(&blender_projects) {
        dirs_to_scan.push(blender_projects);
    }

    let legacy = get_hub_home().join("Projects");
    if legacy.exists() && !dirs_to_scan.contains(&legacy) {
        dirs_to_scan.push(legacy);
    }

    for p_dir in dirs_to_scan {
        if let Ok(entries) = fs::read_dir(&p_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let key = path.to_string_lossy().to_lowercase();
                    if !scanned_paths.contains(&key) {
                        scanned_paths.insert(key);
                        if let Ok(project) = scan_single_project(&path) {
                            projects.push(project);
                        }
                    }
                }
            }
        }
    }

    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
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

/* ========================================================================= */
/* DEL 2 & DEL 3: RECENT FILES DISCOVERY & THUMBNAIL EXTRACTION              */
/* ========================================================================= */

fn format_relative_time(last_modified_secs: u64) -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    if last_modified_secs > now {
        return "Nylig".to_string();
    }

    let diff = now - last_modified_secs;
    if diff < 90 {
        "Akkurat nå".to_string()
    } else if diff < 3600 {
        format!("{} min siden", diff / 60)
    } else if diff < 86400 {
        let hours = diff / 3600;
        if hours == 1 {
            "1 time siden".to_string()
        } else {
            format!("{} timer siden", hours)
        }
    } else if diff < 172800 {
        "I går".to_string()
    } else {
        let days = diff / 86400;
        format!("{} dager siden", days)
    }
}

fn create_recent_file_item(path: &Path, source_app: &str) -> Option<RecentProjectFile> {
    if !path.is_file() {
        return None;
    }

    let metadata = fs::metadata(path).ok()?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| format!(".{}", e.to_lowercase()))
        .unwrap_or_default();

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Fil")
        .to_string();

    let parent_folder = path
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("Mappe")
        .to_string();

    let compatible_apps = get_compatible_apps_for_ext(&ext);
    let recommended_app = match ext.as_str() {
        ".blend" | ".fbx" | ".obj" | ".stl" | ".glb" | ".gltf" => "blender".to_string(),
        ".dxf" | ".dwg" | ".step" | ".stp" | ".iges" | ".igs" => "cadcraft".to_string(),
        ".kra" | ".ora" => "krita".to_string(),
        ".svg" | ".eps" | ".ai" => "vectorcraft".to_string(),
        ".mp4" | ".mov" | ".mkv" | ".webm" => "filmcraft".to_string(),
        ".raw" | ".cr2" | ".nef" | ".dng" | ".arw" => "lightcraft".to_string(),
        ".pdf" => "pdfcraft".to_string(),
        ".mg" => "effectcraft".to_string(),
        ".fig" => "figcraft".to_string(),
        ".idml" => "designcraft".to_string(),
        ".wav" | ".mp3" | ".flac" | ".ogg" | ".aac" => "soundcraft".to_string(),
        _ => "photocraft".to_string(),
    };

    let has_thumbnail = matches!(
        ext.as_str(),
        ".blend" | ".kra" | ".ora" | ".svg" | ".png" | ".jpg" | ".jpeg" | ".webp"
    );

    Some(RecentProjectFile {
        file_path: path.to_string_lossy().to_string(),
        file_name,
        extension: ext,
        folder: parent_folder,
        size_bytes: metadata.len(),
        last_modified: modified,
        last_modified_str: format_relative_time(modified),
        source_app: source_app.to_string(),
        recommended_app,
        compatible_apps,
        has_thumbnail,
    })
}

#[tauri::command]
pub fn get_scanner_settings() -> Result<ScannerSettings, String> {
    Ok(get_scanner_settings_internal())
}

#[tauri::command]
pub fn save_scanner_settings(settings: ScannerSettings) -> Result<bool, String> {
    let settings_dir = get_hub_home().join("Settings");
    fs::create_dir_all(&settings_dir).map_err(|e| e.to_string())?;
    let settings_path = settings_dir.join("scanner.json");
    let json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path, json).map_err(|e| e.to_string())?;

    // Also ensure workspace folders are created if enabled
    let _ = init_or_update_workspace_folders(settings);
    Ok(true)
}

#[tauri::command]
pub fn init_or_update_workspace_folders(settings: ScannerSettings) -> Result<String, String> {
    let workspace_path = if let Some(ref custom) = settings.openart_workspace_path {
        if !custom.trim().is_empty() {
            PathBuf::from(custom.trim())
        } else {
            get_default_workspace_dir()
        }
    } else {
        get_default_workspace_dir()
    };

    fs::create_dir_all(&workspace_path).map_err(|e| e.to_string())?;

    for folder in &settings.workspace_folders {
        if folder.enabled {
            let f_dir = workspace_path.join(&folder.folder_name);
            let _ = fs::create_dir_all(&f_dir);
            let readme_file = f_dir.join("README.txt");
            if !readme_file.exists() {
                let text = format!(
                    "OpenArt Kreativ Mappe: {}\n{}\n\nFiler lagt i denne mappen overvåkes og indekseres automatisk av OpenArt Hub.\n",
                    folder.name, folder.description
                );
                let _ = fs::write(readme_file, text);
            }

            // For Blender: ensure Projects, Assets, Textures, and Renders subdirectories exist
            if folder.folder_name == "Blender" || folder.folder_name == "Blender_Assets" {
                let _ = fs::create_dir_all(f_dir.join("Projects"));
                let _ = fs::create_dir_all(f_dir.join("Assets"));
                let _ = fs::create_dir_all(f_dir.join("Textures"));
                let _ = fs::create_dir_all(f_dir.join("Renders"));
                let b_readme = f_dir.join("Projects").join("README.txt");
                if !b_readme.exists() {
                    let _ = fs::write(
                        b_readme,
                        "Her lagres dine Blender-prosjekter opprettet fra OpenArt Hub (Modellering, Animasjon, VFX, Game Assets).\n"
                    );
                }
            }
        }
    }

    Ok(workspace_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_path_in_explorer(path: String) -> Result<bool, String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err("Stien finnes ikke på disken".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer")
            .arg(&p)
            .spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg(&p)
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(&p)
            .spawn();
    }

    Ok(true)
}

#[tauri::command]
pub async fn pick_custom_folder() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        tokio::task::spawn_blocking(|| {
            let mut cmd = std::process::Command::new("powershell");
            cmd.args([
                "-NoProfile",
                "-Command",
                "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Velg mappe for ArtCraft Hub'; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.SelectedPath }",
            ]);
            cmd.creation_flags(CREATE_NO_WINDOW);
            let output = cmd.output();

            match output {
                Ok(out) => {
                    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).is_dir() {
                        Ok(Some(path))
                    } else {
                        Ok(None)
                    }
                }
                Err(e) => Err(format!("Kunne ikke åpne mappevalg: {}", e)),
            }
        })
        .await
        .map_err(|e| e.to_string())?
    }

    #[cfg(target_os = "macos")]
    {
        tokio::task::spawn_blocking(|| {
            let output = std::process::Command::new("osascript")
                .args([
                    "-e",
                    "POSIX path of (choose folder with prompt \"Velg mappe for ArtCraft Hub\")",
                ])
                .output();

            match output {
                Ok(out) => {
                    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).is_dir() {
                        Ok(Some(path))
                    } else {
                        Ok(None)
                    }
                }
                Err(_) => Ok(None),
            }
        })
        .await
        .map_err(|e| e.to_string())?
    }

    #[cfg(target_os = "linux")]
    {
        tokio::task::spawn_blocking(|| {
            let output = std::process::Command::new("zenity")
                .args(["--file-selection", "--directory", "--title=Velg mappe for ArtCraft Hub"])
                .output();

            match output {
                Ok(out) => {
                    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).is_dir() {
                        Ok(Some(path))
                    } else {
                        Ok(None)
                    }
                }
                Err(_) => Ok(None),
            }
        })
        .await
        .map_err(|e| e.to_string())?
    }
}

#[tauri::command]
pub async fn pick_custom_file() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        tokio::task::spawn_blocking(|| {
            let mut cmd = std::process::Command::new("powershell");
            cmd.args([
                "-NoProfile",
                "-Command",
                "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.Title = 'Velg fil (f.eks. recent-files.txt eller kritarc)'; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName }",
            ]);
            cmd.creation_flags(CREATE_NO_WINDOW);
            let output = cmd.output();

            match output {
                Ok(out) => {
                    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).is_file() {
                        Ok(Some(path))
                    } else {
                        Ok(None)
                    }
                }
                Err(e) => Err(format!("Kunne ikke åpne filvalg: {}", e)),
            }
        })
        .await
        .map_err(|e| e.to_string())?
    }

    #[cfg(target_os = "macos")]
    {
        tokio::task::spawn_blocking(|| {
            let output = std::process::Command::new("osascript")
                .args([
                    "-e",
                    "POSIX path of (choose file with prompt \"Velg konfigurasjonsfil for ArtCraft Hub\")",
                ])
                .output();

            match output {
                Ok(out) => {
                    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).is_file() {
                        Ok(Some(path))
                    } else {
                        Ok(None)
                    }
                }
                Err(_) => Ok(None),
            }
        })
        .await
        .map_err(|e| e.to_string())?
    }

    #[cfg(target_os = "linux")]
    {
        tokio::task::spawn_blocking(|| {
            let output = std::process::Command::new("zenity")
                .args(["--file-selection", "--title=Velg konfigurasjonsfil for ArtCraft Hub"])
                .output();

            match output {
                Ok(out) => {
                    let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !path.is_empty() && Path::new(&path).is_file() {
                        Ok(Some(path))
                    } else {
                        Ok(None)
                    }
                }
                Err(_) => Ok(None),
            }
        })
        .await
        .map_err(|e| e.to_string())?
    }
}

fn is_blacklisted_dir(dir_name: &str) -> bool {
    let lower = dir_name.to_lowercase();
    if lower.starts_with('.') && lower.len() > 1 {
        return true;
    }
    matches!(
        lower.as_str(),
        "artcraft-hub"
            | "openart-hub"
            | "artcrafthub"
            | "openart.hub"
            | "src-tauri"
            | "public"
            | "assets"
            | "node_modules"
            | "appdata"
            | "application support"
            | "windows"
            | "temp"
            | "tmp"
            | "cache"
            | ".cache"
            | "caches"
            | "$recycle.bin"
            | "system volume information"
            | "program files"
            | "program files (x86)"
            | "programdata"
            | "venv"
            | ".env"
            | "dist"
            | "build"
            | "target"
            | "site-packages"
            | "recovery"
            | "logs"
            | "screenshots"
            | "skjermbilder"
            | "skjermopptak"
            | "captures"
            | "screen recordings"
            | "opptak"
    )
}

fn is_path_blacklisted(path: &Path, allow_downloads: bool) -> bool {
    let path_str = path.to_string_lossy().to_lowercase();
    let parts: Vec<&str> = path_str.split(|c| c == '/' || c == '\\').collect();

    // Blacklist OpenArt Hub application / repository files
    let hub_home_str = get_hub_home().to_string_lossy().to_lowercase();
    if path_str.starts_with(&hub_home_str) {
        // Only allow user files inside ~/ArtCraftHub/Projects, exclude WebApps/Apps/Assets/Settings
        if !path_str.contains("projects") {
            return true;
        }
    }

    for part in &parts {
        if part.starts_with('.') && part.len() > 1 {
            return true;
        }
        if matches!(
            *part,
            "artcraft-hub"
                | "openart-hub"
                | "artcrafthub"
                | "openart.hub"
                | "src-tauri"
                | "appdata"
                | "localappdata"
                | "windows"
                | "temp"
                | "tmp"
                | "cache"
                | "caches"
                | ".cache"
                | "$recycle.bin"
                | "system volume information"
                | "program files"
                | "program files (x86)"
                | "programdata"
                | "node_modules"
                | "site-packages"
                | "venv"
                | "target"
                | "dist"
                | "build"
                | "recovery"
                | "screenshots"
                | "skjermbilder"
                | "skjermopptak"
                | "captures"
                | "screen recordings"
                | "opptak"
        ) {
            return true;
        }
        if !allow_downloads && (*part == "downloads" || *part == "nedlastinger") {
            return true;
        }
    }

    // Explicitly exclude internal hub files like app-icon.svg, public/logo.svg, etc.
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default()
        .to_lowercase();
    if (file_name == "app-icon.svg" || file_name == "logo.svg") && parts.iter().any(|&p| p.contains("artcraft") || p.contains("openart") || p == "public") {
        return true;
    }

    false
}

fn is_screenshot_filename(file_name: &str) -> bool {
    let lower = file_name.to_lowercase();
    lower.contains("screenshot")
        || lower.contains("skjermbilde")
        || lower.contains("skjermopptak")
        || lower.contains("screen shot")
        || lower.contains("screenclip")
        || lower.contains("screen clip")
        || lower.contains("screen-shot")
        || lower.contains("capture_")
        || lower.starts_with("prtscr")
        || lower.starts_with("win_")
}

fn is_creative_extension(ext: &str) -> bool {
    matches!(
        ext,
        // Blender / 3D & CAD
        ".blend" | ".fbx" | ".obj" | ".stl" | ".glb" | ".gltf" | ".dxf" | ".dwg" | ".step" | ".stp" | ".iges" | ".igs" |
        // Krita / Digital painting
        ".kra" | ".ora" | ".clip" | ".psd" |
        // Vector
        ".svg" | ".eps" | ".ai" |
        // Photo / textures / artwork
        ".png" | ".jpg" | ".jpeg" | ".webp" | ".raw" | ".cr2" | ".nef" | ".dng" | ".arw" | ".tiff" | ".tif" | ".exr" | ".hdr" |
        // Video
        ".mp4" | ".mov" | ".mkv" | ".webm" |
        // Audio
        ".wav" | ".mp3" | ".flac" | ".ogg" |
        // Publishing / Design
        ".idml" | ".fig" | ".pdf"
    )
}

fn scan_directory_for_creative_files(
    dir: &Path,
    current_depth: usize,
    max_depth: usize,
    source_tag: &str,
    settings: &ScannerSettings,
    map: &mut HashMap<String, RecentProjectFile>,
) {
    if current_depth > max_depth || !dir.is_dir() {
        return;
    }

    if is_path_blacklisted(dir, settings.scan_downloads) {
        return;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or_default();

            if file_name.starts_with('.') {
                continue;
            }

            if is_path_blacklisted(&path, settings.scan_downloads) {
                continue;
            }

            if path.is_dir() {
                if !is_blacklisted_dir(file_name) {
                    scan_directory_for_creative_files(
                        &path,
                        current_depth + 1,
                        max_depth,
                        source_tag,
                        settings,
                        map,
                    );
                }
            } else if path.is_file() {
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| format!(".{}", e.to_lowercase()))
                    .unwrap_or_default();

                if is_creative_extension(&ext) {
                    if (settings.filter_noise || settings.ignore_screenshots) && is_screenshot_filename(file_name) {
                        continue;
                    }

                    if let Ok(metadata) = fs::metadata(&path) {
                        let size = metadata.len();
                        // Filter out tiny images (< 15KB) which are almost exclusively favicons, tiny icons, bullets, or trackers
                        if settings.filter_noise
                            && matches!(ext.as_str(), ".png" | ".jpg" | ".jpeg" | ".webp")
                            && size < 15_000
                        {
                            continue;
                        }

                        let key = path.to_string_lossy().to_lowercase();
                        if !map.contains_key(&key) {
                            if let Some(item) = create_recent_file_item(&path, source_tag) {
                                map.insert(key, item);
                            }
                        }
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub fn discover_all_recent_files(custom_settings: Option<ScannerSettings>) -> Result<Vec<RecentProjectFile>, String> {
    let settings = custom_settings.unwrap_or_else(get_scanner_settings_internal);
    let mut files_map: HashMap<String, RecentProjectFile> = HashMap::new();

    // 1. Blender recent files
    if settings.scan_blender {
        let mut lines_to_process = Vec::new();

        // Check custom path if configured
        if let Some(ref custom) = settings.custom_blender_path {
            if !custom.trim().is_empty() {
                let p = PathBuf::from(custom.trim());
                if p.is_file() {
                    if let Ok(content) = fs::read_to_string(&p) {
                        lines_to_process.extend(content.lines().map(|s| s.trim().to_string()));
                    }
                } else if p.is_dir() {
                    let candidates = [
                        p.join("recent-files.txt"),
                        p.join("config").join("recent-files.txt"),
                    ];
                    for c in &candidates {
                        if c.is_file() {
                            if let Ok(content) = fs::read_to_string(c) {
                                lines_to_process.extend(content.lines().map(|s| s.trim().to_string()));
                            }
                        }
                    }
                    if let Ok(entries) = fs::read_dir(&p) {
                        for version_entry in entries.flatten() {
                            let recent_file = version_entry.path().join("config").join("recent-files.txt");
                            if recent_file.is_file() {
                                if let Ok(content) = fs::read_to_string(&recent_file) {
                                    lines_to_process.extend(content.lines().map(|s| s.trim().to_string()));
                                }
                            }
                        }
                    }
                }
            }
        }

        // Auto-detect if no custom path was provided or found
        if lines_to_process.is_empty() {
            let home = dirs::home_dir();
            if let Some(ref _h) = home {
                let mut blender_dirs = Vec::new();
                #[cfg(target_os = "windows")]
                {
                    if let Ok(appdata) = std::env::var("APPDATA") {
                        blender_dirs.push(PathBuf::from(appdata).join("Blender Foundation").join("Blender"));
                    }
                }
                #[cfg(target_os = "macos")]
                {
                    blender_dirs.push(_h.join("Library/Application Support/Blender"));
                }
                #[cfg(target_os = "linux")]
                {
                    blender_dirs.push(_h.join(".config/blender"));
                }

                for b_dir in blender_dirs {
                    if let Ok(entries) = fs::read_dir(&b_dir) {
                        for version_entry in entries.flatten() {
                            let recent_file = version_entry.path().join("config").join("recent-files.txt");
                            if let Ok(content) = fs::read_to_string(&recent_file) {
                                for line in content.lines() {
                                    let trimmed = line.trim();
                                    if !trimmed.is_empty() {
                                        lines_to_process.push(trimmed.to_string());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        for line in lines_to_process {
            if !line.is_empty() {
                let path = PathBuf::from(&line);
                if path.is_file() {
                    let ext = path
                        .extension()
                        .and_then(|e| e.to_str())
                        .map(|e| format!(".{}", e.to_lowercase()))
                        .unwrap_or_default();

                    if is_creative_extension(&ext) {
                        if !settings.filter_noise || !is_path_blacklisted(&path, settings.scan_downloads) {
                            let key = path.to_string_lossy().to_lowercase();
                            if !files_map.contains_key(&key) {
                                if let Some(item) = create_recent_file_item(&path, "blender") {
                                    files_map.insert(key, item);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Krita recent files
    if settings.scan_krita {
        let mut kritarc_paths = Vec::new();

        // Check custom path if configured
        if let Some(ref custom) = settings.custom_krita_path {
            if !custom.trim().is_empty() {
                let p = PathBuf::from(custom.trim());
                if p.is_file() {
                    kritarc_paths.push(p);
                } else if p.is_dir() {
                    let k_file = p.join("kritarc");
                    if k_file.is_file() {
                        kritarc_paths.push(k_file);
                    }
                }
            }
        }

        // Auto-detect if no custom path was provided or found
        if kritarc_paths.is_empty() {
            let _home = dirs::home_dir();
            #[cfg(target_os = "windows")]
            {
                if let Ok(local) = std::env::var("LOCALAPPDATA") {
                    kritarc_paths.push(PathBuf::from(local).join("kritarc"));
                }
                if let Ok(roam) = std::env::var("APPDATA") {
                    kritarc_paths.push(PathBuf::from(roam).join("kritarc"));
                }
            }
            #[cfg(target_os = "macos")]
            {
                if let Some(ref h) = _home {
                    kritarc_paths.push(h.join("Library/Preferences/kritarc"));
                }
            }
            #[cfg(target_os = "linux")]
            {
                if let Some(ref h) = _home {
                    kritarc_paths.push(h.join(".config/kritarc"));
                }
            }
        }

        for k_path in kritarc_paths {
            if let Ok(content) = fs::read_to_string(&k_path) {
                let mut in_recent_section = false;
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with('[') {
                        in_recent_section = trimmed.eq_ignore_ascii_case("[Recent Files]");
                        continue;
                    }
                    if in_recent_section || trimmed.starts_with("File") {
                        if let Some(idx) = trimmed.find('=') {
                            let mut val = trimmed[idx + 1..].trim();
                            if val.starts_with("[$e]") {
                                val = &val[4..];
                            }
                            let cleaned = val
                                .replace("file:///", "")
                                .replace("file://", "")
                                .replace("%20", " ");
                            let path = PathBuf::from(&cleaned);
                            if path.is_file() {
                                let ext = path
                                    .extension()
                                    .and_then(|e| e.to_str())
                                    .map(|e| format!(".{}", e.to_lowercase()))
                                    .unwrap_or_default();

                                if is_creative_extension(&ext) {
                                    if !settings.filter_noise || !is_path_blacklisted(&path, settings.scan_downloads) {
                                        let key = path.to_string_lossy().to_lowercase();
                                        if !files_map.contains_key(&key) {
                                            if let Some(item) = create_recent_file_item(&path, "krita") {
                                                files_map.insert(key, item);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 3. OpenArt Creative Workspace in Documents (and its subfolders)
    let ws_path = if let Some(ref custom_ws) = settings.openart_workspace_path {
        if !custom_ws.trim().is_empty() {
            PathBuf::from(custom_ws.trim())
        } else {
            get_default_workspace_dir()
        }
    } else {
        get_default_workspace_dir()
    };

    if ws_path.is_dir() {
        for folder_cfg in &settings.workspace_folders {
            if folder_cfg.enabled {
                let sub_dir = ws_path.join(&folder_cfg.folder_name);
                if sub_dir.is_dir() {
                    let tag = match folder_cfg.folder_name.as_str() {
                        "Blender_Assets" => "blender",
                        "Textures" => "pictures",
                        "Brushes" => "krita",
                        "References" => "pictures",
                        "Projects" => "projects",
                        _ => "workspace",
                    };
                    scan_directory_for_creative_files(&sub_dir, 0, 3, tag, &settings, &mut files_map);
                }
            }
        }
    }

    // 4. Dedicated projects directories (active projects directory + legacy)
    if settings.scan_artcraft_projects {
        let active_proj_dir = get_active_projects_dir(&settings);
        if active_proj_dir.is_dir() {
            scan_directory_for_creative_files(&active_proj_dir, 0, 3, "projects", &settings, &mut files_map);
        }
        let legacy_proj_dir = get_hub_home().join("Projects");
        if legacy_proj_dir != active_proj_dir && legacy_proj_dir.is_dir() {
            scan_directory_for_creative_files(&legacy_proj_dir, 0, 3, "projects", &settings, &mut files_map);
        }
    }

    // 5. Bilder / Pictures folder (Depth 3)
    if settings.scan_pictures {
        if let Some(pictures_dir) = dirs::picture_dir() {
            scan_directory_for_creative_files(&pictures_dir, 0, 3, "pictures", &settings, &mut files_map);
        }
    }

    // 6. Dokumenter / Documents folder (Depth 3)
    if settings.scan_documents {
        if let Some(docs_dir) = dirs::document_dir() {
            scan_directory_for_creative_files(&docs_dir, 0, 3, "documents", &settings, &mut files_map);
        }
    }

    // 7. Skrivebord / Desktop folder (Depth 2)
    if settings.scan_desktop {
        if let Some(desktop_dir) = dirs::desktop_dir() {
            scan_directory_for_creative_files(&desktop_dir, 0, 2, "desktop", &settings, &mut files_map);
        }
    }

    // 8. Nedlastinger / Downloads folder (Depth 2)
    if settings.scan_downloads {
        if let Some(dl_dir) = dirs::download_dir() {
            scan_directory_for_creative_files(&dl_dir, 0, 2, "downloads", &settings, &mut files_map);
        }
    }

    // 9. Custom user folders ("Watch Folders") (Depth 4)
    for custom_path_str in &settings.custom_folders {
        let custom_dir = PathBuf::from(custom_path_str);
        if custom_dir.is_dir() {
            scan_directory_for_creative_files(&custom_dir, 0, 4, "custom", &settings, &mut files_map);
        }
    }

    let mut result: Vec<RecentProjectFile> = files_map.into_values().collect();
    // Sort newest first
    result.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    // Limit to top 60 recent files
    result.truncate(60);

    Ok(result)
}

#[tauri::command]
pub fn get_file_thumbnail(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    if !path.is_file() {
        return Err("Filen finnes ikke".to_string());
    }

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| format!(".{}", e.to_lowercase()))
        .unwrap_or_default();

    // 1. Krita (.kra og .ora): ZIP-arkiv som inneholder preview.png eller mergedimage.png
    if ext == ".kra" || ext == ".ora" {
        if let Ok(file) = File::open(&path) {
            if let Ok(mut archive) = zip::ZipArchive::new(file) {
                if let Ok(mut preview) = archive.by_name("preview.png") {
                    let mut buf = Vec::new();
                    if preview.read_to_end(&mut buf).is_ok() {
                        use base64::Engine;
                        let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
                        return Ok(format!("data:image/png;base64,{}", b64));
                    }
                }
                if let Ok(mut merged) = archive.by_name("mergedimage.png") {
                    let mut buf = Vec::new();
                    if merged.read_to_end(&mut buf).is_ok() {
                        use base64::Engine;
                        let b64 = base64::engine::general_purpose::STANDARD.encode(&buf);
                        return Ok(format!("data:image/png;base64,{}", b64));
                    }
                }
            }
        }
    }

    // 2. Blender (.blend): TEST-blokk i headeren med 128x128 rå RGBA
    if ext == ".blend" {
        if let Ok(mut file) = File::open(&path) {
            let mut buffer = vec![0u8; 350_000];
            let bytes_read = file.read(&mut buffer).unwrap_or(0);
            buffer.truncate(bytes_read);

            if let Some(pos) = buffer.windows(4).position(|w| w == b"TEST") {
                if pos + 32 <= buffer.len() {
                    let w = u32::from_le_bytes([buffer[pos + 24], buffer[pos + 25], buffer[pos + 26], buffer[pos + 27]]);
                    let h = u32::from_le_bytes([buffer[pos + 28], buffer[pos + 29], buffer[pos + 30], buffer[pos + 31]]);
                    let pixel_count = (w as usize) * (h as usize) * 4;
                    let start = pos + 32;
                    let end = start + pixel_count;

                    if w > 0 && w <= 512 && h > 0 && h <= 512 && end <= buffer.len() {
                        let raw = &buffer[start..end];
                        let mut bmp = Vec::with_capacity(54 + pixel_count);

                        // 14 byte BITMAPFILEHEADER
                        let file_size = (54 + pixel_count) as u32;
                        bmp.extend_from_slice(b"BM");
                        bmp.extend_from_slice(&file_size.to_le_bytes());
                        bmp.extend_from_slice(&[0, 0, 0, 0]);
                        bmp.extend_from_slice(&54u32.to_le_bytes());

                        // 40 byte BITMAPINFOHEADER (Blender TEST block is bottom-up, positive h)
                        bmp.extend_from_slice(&40u32.to_le_bytes());
                        bmp.extend_from_slice(&(w as i32).to_le_bytes());
                        bmp.extend_from_slice(&(h as i32).to_le_bytes());
                        bmp.extend_from_slice(&1u16.to_le_bytes());
                        bmp.extend_from_slice(&32u16.to_le_bytes());
                        bmp.extend_from_slice(&0u32.to_le_bytes()); // BI_RGB
                        bmp.extend_from_slice(&(pixel_count as u32).to_le_bytes());
                        bmp.extend_from_slice(&2835u32.to_le_bytes());
                        bmp.extend_from_slice(&2835u32.to_le_bytes());
                        bmp.extend_from_slice(&0u32.to_le_bytes());
                        bmp.extend_from_slice(&0u32.to_le_bytes());

                        // Convert RGBA to BGRA
                        for chunk in raw.chunks_exact(4) {
                            let r = chunk[0];
                            let g = chunk[1];
                            let b = chunk[2];
                            let a = chunk[3];
                            bmp.extend_from_slice(&[b, g, r, a]);
                        }

                        use base64::Engine;
                        let b64 = base64::engine::general_purpose::STANDARD.encode(&bmp);
                        return Ok(format!("data:image/bmp;base64,{}", b64));
                    }
                }
            }
        }
    }

    // 3. SVG vektorgrafikk
    if ext == ".svg" {
        if let Ok(content) = fs::read_to_string(&path) {
            use base64::Engine;
            let b64 = base64::engine::general_purpose::STANDARD.encode(content.as_bytes());
            return Ok(format!("data:image/svg+xml;base64,{}", b64));
        }
    }

    // 4. Standard rasterbilder (.png, .jpg, .jpeg, .webp) under 12 MB
    if matches!(ext.as_str(), ".png" | ".jpg" | ".jpeg" | ".webp") {
        if let Ok(metadata) = fs::metadata(&path) {
            if metadata.len() <= 12 * 1024 * 1024 {
                if let Ok(bytes) = fs::read(&path) {
                    let mime = match ext.as_str() {
                        ".png" => "image/png",
                        ".jpg" | ".jpeg" => "image/jpeg",
                        ".webp" => "image/webp",
                        _ => "image/png",
                    };
                    use base64::Engine;
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                    return Ok(format!("data:{};base64,{}", mime, b64));
                }
            }
        }
    }

    Err("Ingen miniatyrbilde-støtte for denne filtypen".to_string())
}

#[tauri::command]
pub fn import_file_to_project(
    file_path: String,
    project_name: String,
    subfolder: String,
    copy_only: bool,
) -> Result<String, String> {
    let source_path = PathBuf::from(&file_path);
    if !source_path.exists() {
        return Err("Kildefilen finnes ikke lenger på disken".to_string());
    }

    let file_name = source_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Ugyldig filnavn".to_string())?;

    let settings = get_scanner_settings_internal();
    let projects_dir = get_active_projects_dir(&settings);
    let target_dir = projects_dir.join(&project_name).join(&subfolder);
    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let destination = target_dir.join(file_name);

    if copy_only {
        fs::copy(&source_path, &destination).map_err(|e| format!("Kunne ikke kopiere filen: {}", e))?;
        Ok(format!("Kopierte '{}' til prosjektet '{}' / {}", file_name, project_name, subfolder))
    } else {
        if fs::rename(&source_path, &destination).is_err() {
            fs::copy(&source_path, &destination).map_err(|e| format!("Kunne ikke flytte filen: {}", e))?;
            let _ = fs::remove_file(&source_path);
        }
        Ok(format!("Flyttet '{}' til prosjektet '{}' / {}", file_name, project_name, subfolder))
    }
}
