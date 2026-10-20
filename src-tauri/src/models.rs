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
            id: "cadcraft".into(),
            name: "CADCraft".into(),
            alternative_to: "AutoCAD".into(),
            category: "CAD & Teknisk".into(),
            description: "Datastøttet konstruksjon (CAD), 2D/3D teknisk tegning, parametrisk geometri og DXF/DWG/STEP-støtte.".into(),
            file_types: vec![".dxf".into(), ".dwg".into(), ".step".into(), ".stp".into(), ".iges".into(), ".igs".into(), ".svg".into()],
            color_accent: "#f97316".into(),
            icon_name: "Compass".into(),
        },
        AppMetadata {
            id: "wordcraft".into(),
            name: "WordCraft".into(),
            alternative_to: "Word & Docs".into(),
            category: "Dokument & Tekst".into(),
            description: "Profesjonell tekstbehandling, rik tekst, Markdown-støtte, samarbeid og eksport til DOCX/PDF.".into(),
            file_types: vec![".docx".into(), ".doc".into(), ".odt".into(), ".rtf".into(), ".txt".into(), ".md".into()],
            color_accent: "#2563eb".into(),
            icon_name: "FileText".into(),
        },
        AppMetadata {
            id: "deckcraft".into(),
            name: "DeckCraft".into(),
            alternative_to: "PowerPoint & Keynote".into(),
            category: "Presentasjon & Pitch".into(),
            description: "Dynamiske presentasjoner, lysbildedesign, animerte overganger og eksport til PPTX/PDF.".into(),
            file_types: vec![".pptx".into(), ".ppt".into(), ".odp".into(), ".pdf".into()],
            color_accent: "#ea580c".into(),
            icon_name: "Presentation".into(),
        },
        AppMetadata {
            id: "gridcraft".into(),
            name: "GridCraft".into(),
            alternative_to: "Excel & Sheets".into(),
            category: "Regneark & Data".into(),
            description: "Kraftig regneark med formelmotor, datavisualisering, diagrammer og XLSX/CSV-støtte.".into(),
            file_types: vec![".xlsx".into(), ".xls".into(), ".csv".into(), ".ods".into(), ".tsv".into()],
            color_accent: "#16a34a".into(),
            icon_name: "Table".into(),
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
        AppMetadata {
            id: "audacity".into(),
            name: "Audacity".into(),
            alternative_to: "".into(),
            category: "Lyd & Tale".into(),
            description: "Verdens mest populære åpne lydredigerer for opptak, flersporslyd, podkast og musikkproduksjon.".into(),
            file_types: vec![".aup3".into(), ".wav".into(), ".mp3".into(), ".flac".into(), ".ogg".into(), ".aiff".into()],
            color_accent: "#2563eb".into(),
            icon_name: "Headphones".into(),
        },
        AppMetadata {
            id: "sysmocap".into(),
            name: "SysMocap".into(),
            alternative_to: "".into(),
            category: "VTuber & Mocap".into(),
            description: "Sanntids 3D-bevegelsesfangst (MoCap) med standard webkamera for 3D-avatarer og VTubing via VRM/VMC.".into(),
            file_types: vec![".vrm".into(), ".bvh".into()],
            color_accent: "#06b6d4".into(),
            icon_name: "Activity".into(),
        },
        AppMetadata {
            id: "openvtuber".into(),
            name: "OpenVTuber".into(),
            alternative_to: "".into(),
            category: "VTuber & Mocap".into(),
            description: "Åpen kildekode ansikts- og hodesporing for VRM-avatarer, skreddersydd for direktesending og VTubing.".into(),
            file_types: vec![".vrm".into()],
            color_accent: "#ec4899".into(),
            icon_name: "Smile".into(),
        },
        AppMetadata {
            id: "pyngtuber".into(),
            name: "PyNGTuber".into(),
            alternative_to: "".into(),
            category: "VTuber & Mocap".into(),
            description: "Lettbeint 2D-reaktiv PNGtuber-applikasjon som animerer avataren din automatisk til stemmelyd.".into(),
            file_types: vec![".png".into(), ".json".into()],
            color_accent: "#a855f7".into(),
            icon_name: "UserCheck".into(),
        },
        AppMetadata {
            id: "open-llm-vtuber".into(),
            name: "Open-LLM-VTuber".into(),
            alternative_to: "".into(),
            category: "VTuber & AI".into(),
            description: "Interaktiv samtalebasert AI-VTuber med talegjenkjenning, LLM-intelligens og leppesynkronisering for VRM/Live2D.".into(),
            file_types: vec![".vrm".into(), ".model3.json".into(), ".json".into()],
            color_accent: "#8b5cf6".into(),
            icon_name: "Bot".into(),
        },
        AppMetadata {
            id: "obs".into(),
            name: "OBS Studio".into(),
            alternative_to: "".into(),
            category: "Streaming & Video".into(),
            description: "Bransjestandarden for videoopptak, skjermopptak og profesjonell direktesending til alle plattformer.".into(),
            file_types: vec![".mp4".into(), ".mkv".into(), ".flv".into(), ".mov".into(), ".ts".into()],
            color_accent: "#3b82f6".into(),
            icon_name: "Radio".into(),
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
    #[serde(default)]
    pub structure: Option<Vec<String>>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreativeFolderConfig {
    pub enabled: bool,
    pub name: String,
    pub folder_name: String,
    pub description: String,
}

pub fn default_workspace_folders() -> Vec<CreativeFolderConfig> {
    vec![
        CreativeFolderConfig {
            enabled: true,
            name: "Smart-Prosjekter".to_string(),
            folder_name: "Projects".to_string(),
            description: "Dine aktive prosjektmapper og manifestfiler".to_string(),
        },
        CreativeFolderConfig {
            enabled: true,
            name: "Blender (Prosjekter & Assets)".to_string(),
            folder_name: "Blender".to_string(),
            description: "Hovedmappe for Blender med undermapper for prosjekter, 3D-assets, teksturer og renders".to_string(),
        },
        CreativeFolderConfig {
            enabled: true,
            name: "Teksturer & PBR".to_string(),
            folder_name: "Textures".to_string(),
            description: "PBR-teksturer, HDRIs, overflater og normal-maps".to_string(),
        },
        CreativeFolderConfig {
            enabled: true,
            name: "Børster & Pensler".to_string(),
            folder_name: "Brushes".to_string(),
            description: "Krita-børster (.bundle) og PhotoCraft-pensler (.abr)".to_string(),
        },
        CreativeFolderConfig {
            enabled: true,
            name: "Referanser & Moodboards".to_string(),
            folder_name: "References".to_string(),
            description: "Bilde- og konseptreferanser, inspirasjon og skisser".to_string(),
        },
        CreativeFolderConfig {
            enabled: true,
            name: "Lyd & Musikk (SFX)".to_string(),
            folder_name: "Audio_and_SFX".to_string(),
            description: "Lydeffekter, musikk og lydopptak".to_string(),
        },
        CreativeFolderConfig {
            enabled: true,
            name: "Vektor & Fonter".to_string(),
            folder_name: "Fonts_and_Vectors".to_string(),
            description: "SVG-ikoner, logoer, mønstre og fonter".to_string(),
        },
    ]
}

pub fn get_default_workspace_dir() -> PathBuf {
    dirs::document_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")))
        .join("OpenArt")
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerSettings {
    pub scan_blender: bool,
    pub scan_krita: bool,
    pub scan_artcraft_projects: bool,
    pub scan_pictures: bool,
    pub scan_documents: bool,
    pub scan_desktop: bool,
    pub scan_downloads: bool,
    pub custom_folders: Vec<String>,
    pub filter_noise: bool,
    #[serde(default = "default_true")]
    pub ignore_screenshots: bool,
    #[serde(default)]
    pub custom_blender_path: Option<String>,
    #[serde(default)]
    pub custom_krita_path: Option<String>,
    #[serde(default)]
    pub custom_projects_path: Option<String>,
    #[serde(default)]
    pub onboarding_completed: bool,
    #[serde(default)]
    pub openart_workspace_path: Option<String>,
    #[serde(default = "default_workspace_folders")]
    pub workspace_folders: Vec<CreativeFolderConfig>,
}

impl Default for ScannerSettings {
    fn default() -> Self {
        Self {
            scan_blender: true,
            scan_krita: true,
            scan_artcraft_projects: true,
            scan_pictures: true,
            scan_documents: true,
            scan_desktop: false,
            scan_downloads: false,
            custom_folders: Vec::new(),
            filter_noise: true,
            ignore_screenshots: true,
            custom_blender_path: None,
            custom_krita_path: None,
            custom_projects_path: None,
            onboarding_completed: false,
            openart_workspace_path: None,
            workspace_folders: default_workspace_folders(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HubUpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub release_name: String,
    pub release_notes: String,
    pub published_at: String,
    pub download_url: Option<String>,
    pub asset_name: Option<String>,
}#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticLogEntry {
    pub id: String,
    pub timestamp_ms: u64,
    pub timestamp_str: String,
    pub level: String,
    pub source: String,
    pub message: String,
    pub details: Option<String>,
}
