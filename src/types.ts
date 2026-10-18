export interface AppMetadata {
  id: string;
  name: string;
  alternative_to: string;
  category: string;
  description: string;
  file_types: string[];
  color_accent: string;
  icon_name: string;
}

export interface AppReleaseInfo {
  app_id: string;
  app_name: string;
  alternative_to: string;
  description: string;
  category: string;
  color_accent: string;
  icon_name: string;
  file_types: string[];
  latest_version: string;
  release_name: string;
  release_notes: string;
  published_at: string;
  native_download_url?: string;
  native_asset_name?: string;
  web_download_url?: string;
  web_asset_name?: string;
  status: 'NotInstalled' | 'Installed' | 'UpdateAvailable';
  installed_version?: string;
  installed_type?: 'native' | 'web';
  has_web_app: boolean;
}

export interface SystemInfo {
  os: string;
  arch: string;
  hub_home: string;
  apps_dir: string;
  webapps_dir: string;
  projects_dir: string;
  assets_dir: string;
}

export interface DownloadProgressPayload {
  app_id: string;
  downloaded: number;
  total: number;
  percent: number;
  status: 'starting' | 'downloading' | 'extracting' | 'completed' | 'error';
  message: string;
}

export interface ProjectFileInfo {
  name: string;
  relative_path: string;
  absolute_path: string;
  extension: string;
  size_bytes: number;
  folder: string;
  compatible_apps: string[];
}

export interface SmartProject {
  id: string;
  name: string;
  project_type: string;
  description: string;
  created_at: string;
  updated_at: string;
  folder_path: string;
  files: ProjectFileInfo[];
  recommended_apps: string[];
  structure?: string[];
}

export interface ColorSwatch {
  hex: string;
  name: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: ColorSwatch[];
}

export interface RecentProjectFile {
  file_path: string;
  file_name: string;
  extension: string;
  folder: string;
  size_bytes: number;
  last_modified: number;
  last_modified_str: string;
  source_app: string;
  recommended_app: string;
  compatible_apps: string[];
  has_thumbnail: boolean;
}

export interface CreativeFolderConfig {
  enabled: boolean;
  name: string;
  folderName: string;
  description: string;
}

export interface ScannerSettings {
  scanBlender: boolean;
  scanKrita: boolean;
  scanArtcraftProjects: boolean;
  scanPictures: boolean;
  scanDocuments: boolean;
  scanDesktop: boolean;
  scanDownloads: boolean;
  customFolders: string[];
  filterNoise: boolean;
  customBlenderPath?: string | null;
  customKritaPath?: string | null;
  customProjectsPath?: string | null;
  onboardingCompleted?: boolean;
  openartWorkspacePath?: string | null;
  workspaceFolders: CreativeFolderConfig[];
}


