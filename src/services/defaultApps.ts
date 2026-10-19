import { AppReleaseInfo, RecentProjectFile } from '../types';
import { getMediaTypeInfo } from '../components/RecentFilesGrid';

const STORAGE_KEY = 'artcraft_default_apps';

export interface DefaultAppsPreference {
  [category: string]: string; // e.g. "image": "krita", "threeD": "blender"
}

export function getDefaultAppsPreferences(): DefaultAppsPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

export function setDefaultAppPreference(category: string, appId: string): void {
  try {
    const current = getDefaultAppsPreferences();
    if (appId) {
      current[category] = appId;
    } else {
      delete current[category];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('artcraft_default_apps_changed'));
  } catch {
    // ignore
  }
}

export interface ResolvedFileApp {
  /** The primary app to display and launch on card click */
  primaryApp: AppReleaseInfo | null;
  /** True if primaryApp is currently installed and ready to open */
  isInstalled: boolean;
  /** All apps in the suite that are installed and support this file's extension */
  installedApps: AppReleaseInfo[];
  /** Other apps in the suite that support this file's extension but are not installed */
  availableApps: AppReleaseInfo[];
}

/**
 * Resolves which app should open a file based on:
 * 1. User default app preference in Settings for this media category
 * 2. Installed apps that support this file extension
 * 3. Suite apps that support this file extension (prompting to install)
 * 4. Fallback to system default
 */
export function resolveAppForFile(
  file: RecentProjectFile,
  allApps: AppReleaseInfo[]
): ResolvedFileApp {
  const ext = (file.extension || '').toLowerCase().trim();
  const media = getMediaTypeInfo(ext);
  const prefs = getDefaultAppsPreferences();
  const preferredAppId = prefs[media.key];

  // Find all apps supporting this extension (by file_types or compatible_apps list)
  const allCompatible = allApps.filter((app) => {
    const extMatch = app.file_types?.some((t) => t.toLowerCase() === ext);
    const idMatch = file.compatible_apps?.includes(app.app_id);
    const recMatch = file.recommended_app === app.app_id;
    return extMatch || idMatch || recMatch;
  });

  const installedApps = allCompatible.filter((a) => a.status !== 'NotInstalled');
  const availableApps = allCompatible.filter((a) => a.status === 'NotInstalled');

  // 1. Check user preferred app for this category
  if (preferredAppId) {
    const prefInstalled = installedApps.find((a) => a.app_id === preferredAppId);
    if (prefInstalled) {
      return {
        primaryApp: prefInstalled,
        isInstalled: true,
        installedApps,
        availableApps,
      };
    }
    const prefAvailable = availableApps.find((a) => a.app_id === preferredAppId);
    if (prefAvailable) {
      return {
        primaryApp: prefAvailable,
        isInstalled: false,
        installedApps,
        availableApps,
      };
    }
  }

  // 2. If recommended app from scanner is installed, prioritize it
  const recInstalled = installedApps.find((a) => a.app_id === file.recommended_app);
  if (recInstalled) {
    return {
      primaryApp: recInstalled,
      isInstalled: true,
      installedApps,
      availableApps,
    };
  }

  // 3. Any other installed app supporting this file (e.g. Krita for jpg if PhotoCraft is not installed)
  if (installedApps.length > 0) {
    return {
      primaryApp: installedApps[0],
      isInstalled: true,
      installedApps,
      availableApps,
    };
  }

  // 4. No installed app can open it. Best candidate from available suite apps:
  const recAvailable = availableApps.find((a) => a.app_id === file.recommended_app);
  if (recAvailable) {
    return {
      primaryApp: recAvailable,
      isInstalled: false,
      installedApps,
      availableApps,
    };
  }

  if (availableApps.length > 0) {
    return {
      primaryApp: availableApps[0],
      isInstalled: false,
      installedApps,
      availableApps,
    };
  }

  // 5. No suite app found
  return {
    primaryApp: null,
    isInstalled: false,
    installedApps: [],
    availableApps: [],
  };
}
