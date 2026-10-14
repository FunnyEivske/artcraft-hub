use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppMetadata {
    pub id: String,
    pub name: String,
    pub alternative_to: String,
    pub category: String,
    pub description: String,
    pub file_types: Vec<String>,
    pub color_accent: String,
    pub icon_name: String,
}

pub fn get_app_catalog() -> Vec<AppMetadata> {
    vec![
        AppMetadata {
            id: "photocraft".into(),
            name: "PhotoCraft".into(),
            alternative_to: "Photoshop".into(),
            category: "Foto & Piksel".into(),
            description: "Avansert pikselgrafikk, lagstøtte, AI-maskering og fotoretusjering.".into(),
            file_types: vec![".png".into(), ".jpg".into(), ".jpeg".into(), ".webp".into(), ".psd".into()],
            color_accent: "#38bdf8".into(),
            icon_name: "Image".into(),
        },
        AppMetadata {
            id: "vectorcraft".into(),
            name: "VectorCraft".into(),
            alternative_to: "Illustrator".into(),
            category: "Vektor & Mønster".into(),
            description: "Presisjons-vektorgrafikk, bezierkurver, SVG-optimalisering og mønsterdesign.".into(),
            file_types: vec![".svg".into(), ".eps".into(), ".ai".into()],
            color_accent: "#f59e0b".into(),
            icon_name: "PenTool".into(),
        },
        AppMetadata {
            id: "filmcraft".into(),
            name: "FilmCraft".into(),
            alternative_to: "Premiere Pro".into(),
            category: "Video".into(),
            description: "Ikke-lineær videoredigering, flerspors tidslinje, fargegradering og 4K-støtte.".into(),
            file_types: vec![".mp4".into(), ".mov".into(), ".mkv".into(), ".webm".into()],
            color_accent: "#ec4899".into(),
            icon_name: "Film".into(),
        },
        AppMetadata {
            id: "lightcraft".into(),
            name: "LightCraft".into(),
            alternative_to: "Lightroom".into(),
            category: "RAW & Farge".into(),
            description: "RAW-fremkalling for fotografer, tonekurver, kromatisk korrigering og batch-prosessering.".into(),
            file_types: vec![".raw".into(), ".cr2".into(), ".nef".into(), ".dng".into(), ".jpg".into(), ".jpeg".into()],
            color_accent: "#06b6d4".into(),
            icon_name: "Sliders".into(),
        },
        AppMetadata {
            id: "pdfcraft".into(),
            name: "PdfCraft".into(),
            alternative_to: "Acrobat Pro".into(),
            category: "Dokument & Mønsterark".into(),
            description: "Sammenslåing, OCR-skanning, redigering, utfylling og signering av PDF-dokumenter.".into(),
            file_types: vec![".pdf".into()],
            color_accent: "#ef4444".into(),
            icon_name: "FileText".into(),
        },
        AppMetadata {
            id: "effectcraft".into(),
            name: "EffectCraft".into(),
            alternative_to: "After Effects".into(),
            category: "VFX & Motion".into(),
            description: "Bevegelsesgrafikk, partikkelsystemer, komposittering og visuelle effekter for film.".into(),
            file_types: vec![".mp4".into(), ".mov".into(), ".json".into(), ".mg".into()],
            color_accent: "#a855f7".into(),
            icon_name: "Sparkles".into(),
        },
        AppMetadata {
            id: "designcraft".into(),
            name: "DesignCraft".into(),
            alternative_to: "InDesign".into(),
            category: "Layout & Trykk".into(),
            description: "Trykksaker, magasiner, hefter, e-bøker og profesjonell typografisk layout.".into(),
            file_types: vec![".pdf".into(), ".svg".into(), ".idml".into()],
            color_accent: "#e11d48".into(),
            icon_name: "LayoutTemplate".into(),
        },
        AppMetadata {
            id: "figcraft".into(),
            name: "FigCraft".into(),
            alternative_to: "Figma".into(),
            category: "UI/UX & Prototyping".into(),
            description: "Interaktivt grensesnittdesign, designsystemer, auto-layout og levende prototyper.".into(),
            file_types: vec![".svg".into(), ".png".into(), ".fig".into(), ".json".into()],
            color_accent: "#10b981".into(),
            icon_name: "Layout".into(),
        },
        AppMetadata {
            id: "soundcraft".into(),
            name: "SoundCraft".into(),
            alternative_to: "Audition".into(),
            category: "Lyd & Miksing".into(),
            description: "Digital lydarbeidsstasjon (DAW), støyreduksjon, mastering og flerspors lydopptak.".into(),
            file_types: vec![".wav".into(), ".mp3".into(), ".flac".into(), ".ogg".into(), ".aac".into()],
            color_accent: "#6366f1".into(),
            icon_name: "Volume2".into(),
        },
        AppMetadata {
            id: "blender".into(),
            name: "Blender".into(),
            alternative_to: "Maya, 3ds Max & Cinema 4D".into(),
            category: "3D & Animasjon".into(),
            description: "Ledende åpen kildekode-studio for 3D-modellering, sculpting, rigging, animasjon, VFX og rendering.".into(),
            file_types: vec![".blend".into(), ".fbx".into(), ".obj".into(), ".stl".into(), ".glb".into(), ".gltf".into()],
            color_accent: "#ea580c".into(),
            icon_name: "Box".into(),
        },
        AppMetadata {
            id: "krita".into(),
            name: "Krita".into(),
            alternative_to: "Corel Painter & Clip Studio".into(),
            category: "Digital Maling & 2D".into(),
            description: "Profesjonelt digitalt maleprogram for konseptkunstnere, illustratører, tegneserieskapere og 2D-animatører.".into(),
            file_types: vec![".kra".into(), ".ora".into(), ".psd".into(), ".png".into(), ".jpg".into()],
            color_accent: "#f43f5e".into(),
            icon_name: "Brush".into(),
        },
    ]
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub hub_home: String,
    pub apps_dir: String,
    pub webapps_dir: String,
    pub projects_dir: String,
    pub assets_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledAppInfo {
    pub version: String,
    pub target_type: String,
    pub installed_at: String,
    pub executable_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgressPayload {
    pub app_id: String,
    pub downloaded: u64,
    pub total: u64,
    pub percent: f32,
    pub status: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppReleaseInfo {
    pub app_id: String,
    pub app_name: String,
    pub alternative_to: String,
    pub description: String,
    pub category: String,
    pub color_accent: String,
    pub icon_name: String,
    pub file_types: Vec<String>,
    pub latest_version: String,
    pub release_name: String,
    pub release_notes: String,
    pub published_at: String,
    pub native_download_url: Option<String>,
    pub native_asset_name: Option<String>,
    pub web_download_url: Option<String>,
    pub web_asset_name: Option<String>,
    pub status: String,
    pub installed_version: Option<String>,
    pub installed_type: Option<String>,
    pub has_web_app: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectFileInfo {
    pub name: String,
    pub relative_path: String,
    pub absolute_path: String,
    pub extension: String,
    pub size_bytes: u64,
    pub folder: String,
    pub compatible_apps: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SmartProject {
    pub id: String,
    pub name: String,
    pub project_type: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub folder_path: String,
    pub files: Vec<ProjectFileInfo>,
    pub recommended_apps: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColorSwatch {
    pub hex: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColorPalette {
    pub id: String,
    pub name: String,
    pub description: String,
    pub colors: Vec<ColorSwatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProjectFile {
    pub file_path: String,
    pub file_name: String,
    pub extension: String,
    pub folder: String,
    pub size_bytes: u64,
    pub last_modified: u64,
    pub last_modified_str: String,
    pub source_app: String, // "blender", "krita", "projects", "windows-recent"
    pub recommended_app: String,
    pub compatible_apps: Vec<String>,
    pub has_thumbnail: bool,
}

pub fn get_hub_home() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("ArtCraftHub")
}
