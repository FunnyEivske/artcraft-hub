import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  AppReleaseInfo,
  ColorPalette,
  DiagnosticLogEntry,
  DownloadProgressPayload,
  HubUpdateInfo,
  RecentProjectFile,
  ScannerSettings,
  SmartProject,
  SystemInfo,
} from '../types';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Application catalog info
const MOCK_RELEASES: AppReleaseInfo[] = [
  {
    app_id: 'photocraft',
    app_name: 'PhotoCraft',
    alternative_to: 'Photoshop',
    description: 'Avansert pikselgrafikk, lagstøtte, AI-maskering og fotoretusjering.',
    category: 'Foto & Piksel',
    color_accent: '#38bdf8',
    icon_name: 'Image',
    file_types: ['.png', '.jpg', '.jpeg', '.webp', '.psd'],
    latest_version: 'v1.0.0',
    release_name: 'PhotoCraft v1.0.0 Stable',
    release_notes: 'Første offisielle versjon med lagmasker, filtre og WebAssembly-støtte.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'vectorcraft',
    app_name: 'VectorCraft',
    alternative_to: 'Illustrator',
    description: 'Presisjons-vektorgrafikk, bezierkurver, SVG-optimalisering og mønsterdesign.',
    category: 'Vektor & Mønster',
    color_accent: '#f59e0b',
    icon_name: 'PenTool',
    file_types: ['.svg', '.eps', '.ai'],
    latest_version: 'v1.0.0',
    release_name: 'VectorCraft v1.0.0 Stable',
    release_notes: 'Komplett bezier-vektormotor med sanntids SVG-eksport.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'filmcraft',
    app_name: 'FilmCraft',
    alternative_to: 'Premiere Pro',
    description: 'Ikke-lineær videoredigering, flerspors tidslinje, fargegradering og 4K-støtte.',
    category: 'Video',
    color_accent: '#ec4899',
    icon_name: 'Film',
    file_types: ['.mp4', '.mov', '.mkv', '.webm'],
    latest_version: 'v1.0.0',
    release_name: 'FilmCraft v1.0.0 Stable',
    release_notes: 'Multi-spor tidslinje, fargehjul og maskinvareakselerert eksport.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'lightcraft',
    app_name: 'LightCraft',
    alternative_to: 'Lightroom',
    description: 'RAW-fremkalling for fotografer, tonekurver, kromatisk korrigering og batch-prosessering.',
    category: 'RAW & Farge',
    color_accent: '#06b6d4',
    icon_name: 'Sliders',
    file_types: ['.raw', '.cr2', '.nef', '.dng', '.jpg', '.jpeg'],
    latest_version: 'v1.0.0',
    release_name: 'LightCraft v1.0.0 Stable',
    release_notes: 'Full støtte for RAW-formater og ikke-destruktiv fargejustering.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'pdfcraft',
    app_name: 'PdfCraft',
    alternative_to: 'Acrobat Pro',
    description: 'PDF-redigering, sammenslåing, OCR-skanning, digital signering og skjemautfylling.',
    category: 'Dokument & PDF',
    color_accent: '#ef4444',
    icon_name: 'FileText',
    file_types: ['.pdf'],
    latest_version: 'v1.0.0',
    release_name: 'PdfCraft v1.0.0 Stable',
    release_notes: 'Komplett verktøykasse for trykklare PDF-filer og tekstredigering.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'effectcraft',
    app_name: 'EffectCraft',
    alternative_to: 'After Effects',
    description: 'Visuelle effekter (VFX), bevegelsesgrafikk, partikkelsystemer og node-basert compositing.',
    category: 'VFX & Motion',
    color_accent: '#8b5cf6',
    icon_name: 'Sparkles',
    file_types: ['.mp4', '.mov', '.png', '.exr', '.gif'],
    latest_version: 'v1.0.0',
    release_name: 'EffectCraft v1.0.0 Stable',
    release_notes: 'Node-basert komposisjon, keyframe-animasjon og partikkelmotor.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'designcraft',
    app_name: 'DesignCraft',
    alternative_to: 'InDesign',
    description: 'Desktop publishing for bøker, magasiner, brosjyrer og trykksaker med rutenett.',
    category: 'Publisering & Layout',
    color_accent: '#f97316',
    icon_name: 'Layout',
    file_types: ['.pdf', '.epub', '.idml', '.indd'],
    latest_version: 'v1.0.0',
    release_name: 'DesignCraft v1.0.0 Stable',
    release_notes: 'Typografisk kontroll, mastersider og avansert rutenett-oppsett.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'figcraft',
    app_name: 'FigCraft',
    alternative_to: 'Figma',
    description: 'Grensesnittdesign (UI/UX), interaktive prototyper og designsystemer for web og mobil.',
    category: 'UI/UX & Prototyping',
    color_accent: '#10b981',
    icon_name: 'Layers',
    file_types: ['.svg', '.png', '.json'],
    latest_version: 'v1.0.0',
    release_name: 'FigCraft v1.0.0 Stable',
    release_notes: 'Vektorbasert UI-design, auto-layout og komponentbibliotek.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'soundcraft',
    app_name: 'SoundCraft',
    alternative_to: 'Audition',
    description: 'Digital lydarbeidsstasjon (DAW), støyreduksjon, mastering og flerspors lydopptak.',
    category: 'Lyd & Miksing',
    color_accent: '#6366f1',
    icon_name: 'Volume2',
    file_types: ['.wav', '.mp3', '.flac', '.ogg', '.aac'],
    latest_version: 'v1.0.0',
    release_name: 'SoundCraft v1.0.0 Stable',
    release_notes: 'Lydredigering, spektralvisning og mastering i sanntid.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'cadcraft',
    app_name: 'CADCraft',
    alternative_to: 'AutoCAD',
    description: 'Datastøttet konstruksjon (CAD), 2D/3D teknisk tegning, parametrisk geometri og DXF/DWG/STEP-støtte.',
    category: 'CAD & Teknisk',
    color_accent: '#f97316',
    icon_name: 'Compass',
    file_types: ['.dxf', '.dwg', '.step', '.stp', '.iges', '.igs', '.svg'],
    latest_version: 'v0.8.0',
    release_name: 'CADCraft v0.8.0 Stable',
    release_notes: 'Computer-aided design and drafting i ren Rust med native ytelse og DXF/DWG-støtte.',
    published_at: '2026-10-18T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'wordcraft',
    app_name: 'WordCraft',
    alternative_to: 'Word & Docs',
    description: 'Profesjonell tekstbehandling, rik tekst, Markdown-støtte, samarbeid og eksport til DOCX/PDF.',
    category: 'Dokument & Tekst',
    color_accent: '#2563eb',
    icon_name: 'FileText',
    file_types: ['.docx', '.doc', '.odt', '.rtf', '.txt', '.md'],
    latest_version: 'v0.8.0',
    release_name: 'WordCraft v0.8.0 Stable',
    release_notes: 'Moderne tekstbehandling i Rust og WebAssembly med live Markdown og DOCX-eksport.',
    published_at: '2026-10-18T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'deckcraft',
    app_name: 'DeckCraft',
    alternative_to: 'PowerPoint & Keynote',
    description: 'Dynamiske presentasjoner, lysbildedesign, animerte overganger og eksport til PPTX/PDF.',
    category: 'Presentasjon & Pitch',
    color_accent: '#ea580c',
    icon_name: 'Presentation',
    file_types: ['.pptx', '.ppt', '.odp', '.pdf'],
    latest_version: 'v0.8.0',
    release_name: 'DeckCraft v0.8.0 Stable',
    release_notes: 'Rask lysbildemotor med maler, animasjoner og direkte PDF/PPTX-eksport.',
    published_at: '2026-10-18T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'gridcraft',
    app_name: 'GridCraft',
    alternative_to: 'Excel & Sheets',
    description: 'Kraftig regneark med formelmotor, datavisualisering, diagrammer og XLSX/CSV-støtte.',
    category: 'Regneark & Data',
    color_accent: '#16a34a',
    icon_name: 'Table',
    file_types: ['.xlsx', '.xls', '.csv', '.ods', '.tsv'],
    latest_version: 'v0.8.0',
    release_name: 'GridCraft v0.8.0 Stable',
    release_notes: 'Regneark-app med over 200 formler, tabeller, grafer og XLSX-kompatibilitet.',
    published_at: '2026-10-18T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'blender',
    app_name: 'Blender',
    alternative_to: 'Maya / 3ds Max',
    description: '3D-modellering, sculpting, rigg, animasjon, fysikk-simulering og fotorealistisk rendering.',
    category: '3D & Animasjon',
    color_accent: '#ea580c',
    icon_name: 'Box',
    file_types: ['.blend', '.fbx', '.obj', '.stl', '.glb', '.gltf'],
    latest_version: 'v4.5.0',
    release_name: 'Blender 4.5 LTS',
    release_notes: 'Offisiell Blender-støtte med automatisk deteksjon og rask åpning av .blend-filer.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: false,
  },
  {
    app_id: 'krita',
    app_name: 'Krita',
    alternative_to: 'Photoshop / Corel Painter',
    description: 'Digital maling, illustrasjon, konseptkunst, tegneserier og 2D håndtegnet animasjon.',
    category: 'Maling & Konseptkunst',
    color_accent: '#0284c7',
    icon_name: 'Palette',
    file_types: ['.kra', '.ora', '.psd', '.png', '.jpg'],
    latest_version: 'v5.2.2',
    release_name: 'Krita 5.2.2 Stable',
    release_notes: 'Offisiell Krita-støtte med lynrask visning av .kra-miniatyrbilder direkte fra fil.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: false,
  },
  {
    app_id: 'audacity',
    app_name: 'Audacity',
    alternative_to: '',
    description: 'Verdens mest populære åpne lydredigerer for opptak, flersporslyd, podkast og musikkproduksjon.',
    category: 'Lyd & Tale',
    color_accent: '#2563eb',
    icon_name: 'Headphones',
    file_types: ['.aup3', '.wav', '.mp3', '.flac', '.ogg', '.aiff'],
    latest_version: 'v4.0.1',
    release_name: 'Audacity 4.0.1 Official',
    release_notes: 'Audacity åpen kildekode flerspors lydopptaker og redigerer med profesjonell effektbehandling.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: false,
  },
];

// No hardcoded sample projects - purely real data created by user or scanned from disk
let localProjects: SmartProject[] = [];

export const getSystemInfo = async (): Promise<SystemInfo> => {
  if (isTauri()) {
    return await invoke<SystemInfo>('get_system_info');
  }
  return {
    os: 'windows',
    arch: 'x86_64',
    hub_home: '~/ArtCraftHub',
    apps_dir: '~/ArtCraftHub/Apps',
    webapps_dir: '~/ArtCraftHub/WebApps',
    projects_dir: '~/ArtCraftHub/Projects',
    assets_dir: '~/ArtCraftHub/Assets',
  };
};

export const checkGithubReleases = async (): Promise<AppReleaseInfo[]> => {
  if (isTauri()) {
    return await invoke<AppReleaseInfo[]>('check_github_releases');
  }
  return MOCK_RELEASES;
};

export const installOrUpdateApp = async (
  appId: string,
  downloadUrl: string,
  targetType: 'native' | 'web',
  version: string
): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('install_or_update_app', {
      appId,
      downloadUrl,
      targetType,
      version,
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const app = MOCK_RELEASES.find((a) => a.app_id === appId);
      if (app) {
        app.status = 'Installed';
        app.installed_version = version;
        app.installed_type = targetType;
      }
      resolve(`${appId} ble installert (${targetType})`);
    }, 1200);
  });
};

export const uninstallApp = async (appId: string): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('uninstall_app', { appId });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      const app = MOCK_RELEASES.find((a) => a.app_id === appId);
      if (app) {
        app.status = 'NotInstalled';
        app.installed_version = undefined;
        app.installed_type = undefined;
      }
      resolve(`${appId} ble avinstallert`);
    }, 600);
  });
};

export const launchApp = async (
  appId: string,
  filePathOptional?: string
): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('launch_app', {
      appId,
      filePathOptional: filePathOptional || null,
    });
  }
  return `Startet ${appId} ${filePathOptional ? 'med fil: ' + filePathOptional : ''}`;
};

export const createSmartProject = async (
  projectName: string,
  projectType: string,
  description: string
): Promise<SmartProject> => {
  if (isTauri()) {
    return await invoke<SmartProject>('create_smart_project', {
      projectName,
      projectType,
      description,
    });
  }
  const newProj: SmartProject = {
    id: `proj-${Date.now()}`,
    name: projectName,
    project_type: projectType,
    description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    folder_path: `~/ArtCraftHub/Projects/${projectName}`,
    recommended_apps: ['photocraft', 'vectorcraft'],
    files: [],
  };
  localProjects.push(newProj);
  return newProj;
};

export const scanProjectsAndFiles = async (): Promise<SmartProject[]> => {
  if (isTauri()) {
    return await invoke<SmartProject[]>('scan_projects_and_files');
  }
  return localProjects;
};

export const loadPalettes = async (): Promise<ColorPalette[]> => {
  if (isTauri()) {
    return await invoke<ColorPalette[]>('load_palettes');
  }
  const stored = localStorage.getItem('artcraft_palettes');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return [
    {
      id: 'palette-artcraft',
      name: 'ArtCraft Signature',
      description: 'Hovedfargene for OpenArt Hub og de 9 kreative studioene.',
      colors: [
        { hex: '#6366f1', name: 'Indigo Core' },
        { hex: '#38bdf8', name: 'Sky Cyan' },
        { hex: '#ec4899', name: 'Neon Rose' },
        { hex: '#10b981', name: 'Emerald Pro' },
        { hex: '#f59e0b', name: 'Amber Glow' },
      ],
    },
    {
      id: 'palette-cyberpunk',
      name: 'Cyberpunk Glow',
      description: 'Høykontrast neon-palett for VFX, motion design og UI-effekter.',
      colors: [
        { hex: '#06b6d4', name: 'Electric Cyan' },
        { hex: '#8b5cf6', name: 'Violet Ray' },
        { hex: '#f43f5e', name: 'Hot Crimson' },
        { hex: '#eab308', name: 'Warning Yellow' },
        { hex: '#0d0f17', name: 'Void Black' },
      ],
    },
    {
      id: 'palette-nordic',
      name: 'Nordic Minimalist',
      description: 'Dempede, rolige skandinaviske farger for bøker, typografi og ren layout.',
      colors: [
        { hex: '#0f172a', name: 'Nordic Slate' },
        { hex: '#334155', name: 'Fjord Grey' },
        { hex: '#64748b', name: 'Granite Mist' },
        { hex: '#cbd5e1', name: 'Birch White' },
        { hex: '#0284c7', name: 'Arctic Ice' },
      ],
    },
  ];
};

export const savePalettes = async (palettes: ColorPalette[]): Promise<boolean> => {
  const jsonStr = JSON.stringify(palettes, null, 2);
  if (isTauri()) {
    return await invoke<boolean>('save_palettes', { palettesJson: jsonStr });
  }
  localStorage.setItem('artcraft_palettes', jsonStr);
  return true;
};

// Returns only real files found on the user system; no hardcoded example files!
export const discoverAllRecentFiles = async (
  customSettings?: ScannerSettings
): Promise<RecentProjectFile[]> => {
  if (isTauri()) {
    return await invoke<RecentProjectFile[]>('discover_all_recent_files', {
      customSettings: customSettings || null,
    });
  }
  return [];
};

export const DEFAULT_WORKSPACE_FOLDERS = [
  {
    enabled: true,
    name: 'Smart-Prosjekter',
    folderName: 'Projects',
    description: 'Dine aktive prosjektmapper og manifestfiler',
  },
  {
    enabled: true,
    name: 'Blender (Prosjekter & Assets)',
    folderName: 'Blender',
    description: 'Hovedmappe for Blender med mapper for prosjekter, 3D-assets, teksturer og renders',
  },
  {
    enabled: true,
    name: 'Teksturer & PBR',
    folderName: 'Textures',
    description: 'PBR-teksturer, HDRIs, overflater og normal-maps',
  },
  {
    enabled: true,
    name: 'Børster & Pensler',
    folderName: 'Brushes',
    description: 'Krita-børster (.bundle) og PhotoCraft-pensler (.abr)',
  },
  {
    enabled: true,
    name: 'Referanser & Moodboards',
    folderName: 'References',
    description: 'Bilde- og konseptreferanser, inspirasjon og skisser',
  },
  {
    enabled: true,
    name: 'Lyd & Musikk (SFX)',
    folderName: 'Audio_and_SFX',
    description: 'Lydeffekter, musikk og lydopptak',
  },
  {
    enabled: true,
    name: 'Vektor & Fonter',
    folderName: 'Fonts_and_Vectors',
    description: 'SVG-ikoner, logoer, mønstre og fonter',
  },
];

export const getScannerSettings = async (): Promise<ScannerSettings> => {
  if (isTauri()) {
    return await invoke<ScannerSettings>('get_scanner_settings');
  }
  const fallback = localStorage.getItem('artcraft_scanner_settings');
  if (fallback) {
    try {
      const parsed = JSON.parse(fallback);
      if (!parsed.workspaceFolders) {
        parsed.workspaceFolders = DEFAULT_WORKSPACE_FOLDERS;
      }
      return parsed;
    } catch {
      // ignore
    }
  }
  return {
    scanBlender: true,
    scanKrita: true,
    scanArtcraftProjects: true,
    scanPictures: true,
    scanDocuments: true,
    scanDesktop: false,
    scanDownloads: false,
    customFolders: [],
    filterNoise: true,
    customBlenderPath: null,
    customKritaPath: null,
    customProjectsPath: null,
    onboardingCompleted: false,
    openartWorkspacePath: null,
    workspaceFolders: DEFAULT_WORKSPACE_FOLDERS,
  };
};

export const saveScannerSettings = async (settings: ScannerSettings): Promise<boolean> => {
  localStorage.setItem('artcraft_scanner_settings', JSON.stringify(settings));
  if (isTauri()) {
    return await invoke<boolean>('save_scanner_settings', { settings });
  }
  return true;
};

export const initOrUpdateWorkspaceFolders = async (
  settings: ScannerSettings
): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('init_or_update_workspace_folders', { settings });
  }
  return 'Documents/OpenArt';
};

export const getDefaultWorkspaceDirPath = async (): Promise<string> => {
  if (isTauri()) {
    try {
      return await invoke<string>('get_default_workspace_dir_path');
    } catch {
      // fallback
    }
  }
  return '~/Documents/OpenArt';
};

export const openPathInExplorer = async (path: string): Promise<boolean> => {
  if (isTauri()) {
    return await invoke<boolean>('open_path_in_explorer', { path });
  }
  return true;
};

export const pickCustomFolder = async (): Promise<string | null> => {
  if (isTauri()) {
    return await invoke<string | null>('pick_custom_folder');
  }
  return null;
};

export const pickCustomFile = async (): Promise<string | null> => {
  if (isTauri()) {
    return await invoke<string | null>('pick_custom_file');
  }
  return null;
};



export const getFileThumbnail = async (filePath: string): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('get_file_thumbnail', { filePath });
  }
  return '';
};

export const importFileToProject = async (
  filePath: string,
  projectName: string,
  subfolder: string,
  copyOnly: boolean
): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('import_file_to_project', {
      filePath,
      projectName,
      subfolder,
      copyOnly,
    });
  }
  return `Importerte ${filePath} til ${projectName}/${subfolder}`;
};

export const onProjectsUpdated = (callback: () => void): (() => void) => {
  if (isTauri()) {
    let unlistenFn: UnlistenFn | null = null;
    listen('projects-updated', () => {
      callback();
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }
  return () => {};
};

export const checkHubAppUpdate = async (): Promise<HubUpdateInfo> => {
  if (isTauri()) {
    return await invoke<HubUpdateInfo>('check_hub_app_update');
  }
  return {
    currentVersion: '1.0.0',
    latestVersion: '1.0.0',
    updateAvailable: false,
    releaseName: 'OpenArt Hub v1.0.0',
    releaseNotes: 'Du kjører den nyeste versjonen av OpenArt Hub.',
    publishedAt: new Date().toISOString(),
    downloadUrl: null,
    assetName: null,
  };
};

export const downloadAndInstallHubUpdate = async (
  downloadUrl: string,
  fileName: string
): Promise<string> => {
  if (isTauri()) {
    return await invoke<string>('download_and_install_hub_update', {
      downloadUrl,
      fileName,
    });
  }
  return 'Oppdateringsinstallatør startet';
};

export const onDownloadProgress = (
  callback: (payload: DownloadProgressPayload) => void
): (() => void) => {
  if (isTauri()) {
    let unlistenFn: UnlistenFn | null = null;
    listen<DownloadProgressPayload>('download-progress', (event) => {
      callback(event.payload);
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }
  return () => {};
};

export const getDiagnosticLogs = async (): Promise<DiagnosticLogEntry[]> => {
  if (isTauri()) {
    try {
      return await invoke<DiagnosticLogEntry[]>('get_diagnostic_logs');
    } catch {
      return [];
    }
  }
  return [];
};

export const clearDiagnosticLogs = async (): Promise<boolean> => {
  if (isTauri()) {
    try {
      return await invoke<boolean>('clear_diagnostic_logs');
    } catch {
      return false;
    }
  }
  return true;
};

export const logClientDiagnostic = async (
  level: string,
  source: string,
  message: string,
  details?: string | null
): Promise<boolean> => {
  if (isTauri()) {
    try {
      return await invoke<boolean>('log_client_diagnostic', {
        level,
        source,
        message,
        details: details || null,
      });
    } catch {
      return false;
    }
  }
  return true;
};