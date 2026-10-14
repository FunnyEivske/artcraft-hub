import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  AppReleaseInfo,
  ColorPalette,
  DownloadProgressPayload,
  SmartProject,
  SystemInfo,
} from '../types';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Fallback mock catalog for browser preview mode
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
    release_notes: 'Flerspors tidslinje med GPU-akselerert video-render.',
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
    file_types: ['.raw', '.cr2', '.nef', '.dng', '.jpg'],
    latest_version: 'v1.0.0',
    release_name: 'LightCraft v1.0.0 Stable',
    release_notes: 'Støtte for CR2, NEF, DNG og RAW med kromatisk fargegradering.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'pdfcraft',
    app_name: 'PdfCraft',
    alternative_to: 'Acrobat Pro',
    description: 'Sammenslåing, OCR-skanning, redigering, utfylling og signering av PDF-dokumenter.',
    category: 'Dokument & Mønsterark',
    color_accent: '#ef4444',
    icon_name: 'FileText',
    file_types: ['.pdf'],
    latest_version: 'v1.0.0',
    release_name: 'PdfCraft v1.0.0 Stable',
    release_notes: 'Hurtig PDF-editor med dokumentsammenslåing og vektor-eksport.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'effectcraft',
    app_name: 'EffectCraft',
    alternative_to: 'After Effects',
    description: 'Bevegelsesgrafikk, partikkelsystemer, komposittering og visuelle effekter for film.',
    category: 'VFX & Motion',
    color_accent: '#a855f7',
    icon_name: 'Sparkles',
    file_types: ['.mp4', '.mov', '.json', '.mg'],
    latest_version: 'v1.0.0',
    release_name: 'EffectCraft v1.0.0 Stable',
    release_notes: 'Partikkeleffekter, 3D transformering og keyframe-animasjon.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'designcraft',
    app_name: 'DesignCraft',
    alternative_to: 'InDesign',
    description: 'Trykksaker, magasiner, hefter, e-bøker og profesjonell typografisk layout.',
    category: 'Layout & Trykk',
    color_accent: '#e11d48',
    icon_name: 'LayoutTemplate',
    file_types: ['.pdf', '.svg', '.idml'],
    latest_version: 'v1.0.0',
    release_name: 'DesignCraft v1.0.0 Stable',
    release_notes: 'Rutenett-typografi, flersiders layout og CMYK trykk-klar eksport.',
    published_at: '2026-10-14T00:00:00Z',
    status: 'NotInstalled',
    has_web_app: true,
  },
  {
    app_id: 'figcraft',
    app_name: 'FigCraft',
    alternative_to: 'Figma',
    description: 'Interaktivt grensesnittdesign, designsystemer, auto-layout og levende prototyper.',
    category: 'UI/UX & Prototyping',
    color_accent: '#10b981',
    icon_name: 'Figma',
    file_types: ['.svg', '.png', '.fig', '.json'],
    latest_version: 'v1.0.0',
    release_name: 'FigCraft v1.0.0 Stable',
    release_notes: 'UI-komponenter, interaktive prototyper og figma-filimport.',
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
];

let localProjects: SmartProject[] = [
  {
    id: 'proj-demo-1',
    name: 'Nordic_Merkevare_2026',
    project_type: 'Brand Identity',
    description: 'Komplett merkevarebygging med vektorer, typografi og fargepaletter.',
    created_at: '2026-10-14T12:00:00Z',
    updated_at: '2026-10-14T14:30:00Z',
    folder_path: '~/ArtCraftHub/Projects/Nordic_Merkevare_2026',
    recommended_apps: ['vectorcraft', 'designcraft', 'figcraft'],
    files: [
      {
        name: 'nordic_logo.svg',
        relative_path: '02_Vectors_and_Patterns/nordic_logo.svg',
        absolute_path: '~/ArtCraftHub/Projects/Nordic_Merkevare_2026/02_Vectors_and_Patterns/nordic_logo.svg',
        extension: '.svg',
        size_bytes: 14200,
        folder: '02_Vectors_and_Patterns',
        compatible_apps: ['vectorcraft', 'designcraft', 'figcraft'],
      },
      {
        name: 'brand_manual.pdf',
        relative_path: '05_Exports/brand_manual.pdf',
        absolute_path: '~/ArtCraftHub/Projects/Nordic_Merkevare_2026/05_Exports/brand_manual.pdf',
        extension: '.pdf',
        size_bytes: 421000,
        folder: '05_Exports',
        compatible_apps: ['pdfcraft', 'designcraft'],
      },
      {
        name: 'hero_texture.png',
        relative_path: '03_Photos_and_Textures/hero_texture.png',
        absolute_path: '~/ArtCraftHub/Projects/Nordic_Merkevare_2026/03_Photos_and_Textures/hero_texture.png',
        extension: '.png',
        size_bytes: 852000,
        folder: '03_Photos_and_Textures',
        compatible_apps: ['photocraft', 'lightcraft'],
      },
    ],
  },
];

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
  // Browser simulator fallback
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
  return `Startet ${appId} (demo-modus) ${filePathOptional ? 'med fil: ' + filePathOptional : ''}`;
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
    files: [
      {
        name: 'project_notes.txt',
        relative_path: '01_References/project_notes.txt',
        absolute_path: `~/ArtCraftHub/Projects/${projectName}/01_References/project_notes.txt`,
        extension: '.txt',
        size_bytes: 120,
        folder: '01_References',
        compatible_apps: ['photocraft'],
      },
      {
        name: 'brand_mark.svg',
        relative_path: '02_Vectors_and_Patterns/brand_mark.svg',
        absolute_path: `~/ArtCraftHub/Projects/${projectName}/02_Vectors_and_Patterns/brand_mark.svg`,
        extension: '.svg',
        size_bytes: 840,
        folder: '02_Vectors_and_Patterns',
        compatible_apps: ['vectorcraft', 'figcraft'],
      },
    ],
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
