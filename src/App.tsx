import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, HubTab } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { AppHubView } from './components/AppHubView';
import { ProjectsView } from './components/ProjectsView';
import { PalettesView } from './components/PalettesView';
import { UpdateCenterView } from './components/UpdateCenterView';
import { UpdateNotificationModal } from './components/UpdateNotificationModal';
import { SettingsView } from './components/SettingsView';
import { FirstTimeSetupModal } from './components/FirstTimeSetupModal';
import {
  AppReleaseInfo,
  ColorPalette,
  DownloadProgressPayload,
  RecentProjectFile,
  SmartProject,
  SystemInfo,
  ScannerSettings,
} from './types';
import {
  checkGithubReleases,
  createSmartProject,
  discoverAllRecentFiles,
  getSystemInfo,
  getScannerSettings,
  installOrUpdateApp,
  launchApp,
  loadPalettes,
  onDownloadProgress,
  onProjectsUpdated,
  savePalettes,
  scanProjectsAndFiles,
} from './services/tauri';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const RECENT_APPS_KEY = 'openart_recent_launched_apps';
const SNOOZE_PREFIX = 'openart_snoozed_update_';

export function App() {
  const [activeTab, setActiveTab] = useState<HubTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [apps, setApps] = useState<AppReleaseInfo[]>([]);
  const [projects, setProjects] = useState<SmartProject[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentProjectFile[]>([]);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingRecent, setIsRefreshingRecent] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, DownloadProgressPayload>>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Track recently launched app IDs for Quick Launch
  const [recentLaunchedAppIds, setRecentLaunchedAppIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_APPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // App pending update notification popup
  const [notifyingUpdateApp, setNotifyingUpdateApp] = useState<AppReleaseInfo | null>(null);

  // First-time onboarding popup (only on first install, NOT on updates)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingSettings, setOnboardingSettings] = useState<ScannerSettings | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const markAppLaunched = useCallback((appId: string) => {
    setRecentLaunchedAppIds((prev) => {
      const updated = [appId, ...prev.filter((id) => id !== appId)].slice(0, 10);
      try {
        localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(updated));
      } catch {
        // Non-critical
      }
      return updated;
    });
  }, []);

  const refreshRecent = useCallback(async () => {
    setIsRefreshingRecent(true);
    try {
      const recents = await discoverAllRecentFiles();
      setRecentFiles(recents);
    } catch {
      // Non-critical
    } finally {
      setIsRefreshingRecent(false);
    }
  }, []);

  const checkForUpdatePrompts = useCallback((appList: AppReleaseInfo[]) => {
    // Check if any installed app has an update available and hasn't been snoozed
    const updateCandidate = appList.find((a) => {
      if (a.status !== 'UpdateAvailable') return false;
      try {
        const snoozeKey = `${SNOOZE_PREFIX}${a.app_id}_${a.latest_version}`;
        return sessionStorage.getItem(snoozeKey) !== 'true';
      } catch {
        return false;
      }
    });

    if (updateCandidate) {
      setNotifyingUpdateApp(updateCandidate);
    }
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [sys, rels, projs, pals, recents] = await Promise.all([
        getSystemInfo(),
        checkGithubReleases(),
        scanProjectsAndFiles(),
        loadPalettes(),
        discoverAllRecentFiles().catch(() => [] as RecentProjectFile[]),
      ]);
      setSystemInfo(sys);
      setApps(rels);
      setProjects(projs);
      setPalettes(pals);
      setRecentFiles(recents);
      checkForUpdatePrompts(rels);

      // Check onboarding state: ONLY show for genuine first-time installation!
      try {
        const scannerSet = await getScannerSettings();
        const localCompleted = localStorage.getItem('artcraft_onboarding_completed') === 'true';
        const hasRecentLaunchedApps = recentLaunchedAppIds && recentLaunchedAppIds.length > 0;
        const hasInstalledApps = rels.some((a) => a.status === 'Installed' || Boolean(a.installed_version));
        const hasExistingProjects = projs.length > 0;
        const isExistingUser = hasRecentLaunchedApps || hasInstalledApps || hasExistingProjects;

        if (scannerSet.onboardingCompleted || localCompleted || isExistingUser) {
          // If this is an existing installation updating, ensure the flag is marked so we never pop up
          if (!localCompleted) {
            localStorage.setItem('artcraft_onboarding_completed', 'true');
          }
          setShowOnboardingModal(false);
        } else {
          // Brand new installation!
          setOnboardingSettings(scannerSet);
          setShowOnboardingModal(true);
        }
      } catch (err) {
        console.error('Kunne ikke sjekke onboarding-status:', err);
      }
    } catch {
      showToast('Kunne ikke hente versjoner — viser lokal oversikt', 'info');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to live download progress from Rust backend
    const unsubDownload = onDownloadProgress((payload) => {
      setProgressMap((prev) => ({
        ...prev,
        [payload.app_id]: payload,
      }));

      if (payload.status === 'completed') {
        showToast('Installasjonen er fullført', 'success');
        // Refresh app list after installation finishes
        checkGithubReleases().then((updated) => {
          setApps(updated);
          // If modal was for this app, close it
          setNotifyingUpdateApp((curr) => (curr?.app_id === payload.app_id ? null : curr));
        });
      }
    });

    // Real-time file watcher on ~/ArtCraftHub/Projects/
    const unsubWatcher = onProjectsUpdated(() => {
      scanProjectsAndFiles().then(setProjects);
      discoverAllRecentFiles().then(setRecentFiles);
    });

    return () => {
      unsubDownload();
      unsubWatcher();
    };
  }, [checkForUpdatePrompts]);

  const handleLaunchNative = async (appId: string) => {
    markAppLaunched(appId);
    try {
      const res = await launchApp(appId);
      showToast(res, 'success');
    } catch (err) {
      showToast(`Kunne ikke starte app: ${err}`, 'error');
    }
  };

  const handleInstall = async (app: AppReleaseInfo, targetType: 'native' | 'web') => {
    try {
      const downloadUrl =
        targetType === 'web'
          ? app.web_download_url || `https://github.com/storytold/${app.app_id}/releases/latest`
          : app.native_download_url || `https://github.com/storytold/${app.app_id}/releases/latest`;

      showToast(`Laster ned og oppdaterer ${app.app_name}...`, 'info');
      await installOrUpdateApp(app.app_id, downloadUrl, targetType, app.latest_version);
    } catch (err) {
      showToast(`Feil under installasjon: ${err}`, 'error');
    }
  };

  const handleCreateProject = async (
    name: string,
    type: string,
    description: string,
    launchAfterAppId?: string
  ) => {
    setIsCreatingProject(true);
    try {
      const newProj = await createSmartProject(name, type, description);
      setProjects((prev) => [newProj, ...prev]);
      showToast(`Prosjektet «${name}» er opprettet`, 'success');
      refreshRecent();
      if (launchAfterAppId) {
        handleOpenFileInApp(launchAfterAppId, newProj.folder_path);
      }
    } catch (err) {
      showToast(`Feil ved opprettelse: ${err}`, 'error');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleOpenFileInApp = async (appId: string, filePath: string) => {
    markAppLaunched(appId);
    try {
      const res = await launchApp(appId, filePath);
      showToast(res, 'success');
    } catch (err) {
      showToast(`Feil ved sending til ${appId}: ${err}`, 'error');
    }
  };

  const handleSavePalettes = async (updated: ColorPalette[]) => {
    setPalettes(updated);
    try {
      await savePalettes(updated);
      showToast('Palettene er lagret', 'success');
    } catch (err) {
      showToast(`Kunne ikke lagre paletter: ${err}`, 'error');
    }
  };

  const handleUpdateAll = async () => {
    const toUpdate = apps.filter((a) => a.status === 'UpdateAvailable');
    if (toUpdate.length === 0) {
      showToast('Alle installerte apper er oppdatert', 'info');
      return;
    }

    showToast(`Oppdaterer ${toUpdate.length} apper...`, 'info');
    for (const app of toUpdate) {
      await handleInstall(app, 'native');
    }
  };

  const handleLaterUpdate = (app: AppReleaseInfo) => {
    try {
      sessionStorage.setItem(`${SNOOZE_PREFIX}${app.app_id}_${app.latest_version}`, 'true');
    } catch {
      // Non-critical
    }
    setNotifyingUpdateApp(null);
    showToast(`Oppdatering for ${app.app_name} utsatt. Du kan oppdatere når du vil under Oppdateringer.`, 'info');
  };

  const updatesCount = apps.filter((a) => a.status === 'UpdateAvailable').length;

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q && activeTab !== 'apps') setActiveTab('apps');
  };

  return (
    <div className="h-screen flex flex-col bg-ui-bg text-ui-text">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onRefreshReleases={loadData}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          appCount={apps.length}
          updatesCount={updatesCount}
          systemInfo={systemInfo}
        />

        <main className="flex-1 min-w-0 overflow-y-auto px-8 py-7">
          {activeTab === 'home' && (
            <HomeView
              apps={apps}
              recentFiles={recentFiles}
              projects={projects}
              recentLaunchedAppIds={recentLaunchedAppIds}
              onLaunchNative={handleLaunchNative}
              onOpenFileInApp={handleOpenFileInApp}
              onRefreshRecent={refreshRecent}
              onShowToast={showToast}
              isRefreshingRecent={isRefreshingRecent}
              onNavigateToApps={() => {
                setSelectedCategory('Alle');
                setActiveTab('apps');
              }}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'apps' && (
            <AppHubView
              apps={apps}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onClearFilters={() => {
                setSelectedCategory('Alle');
                setSearchQuery('');
              }}
              onLaunchNative={handleLaunchNative}
              onInstall={handleInstall}
              progressMap={progressMap}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              allApps={apps}
              recentFiles={recentFiles}
              onCreateProject={handleCreateProject}
              onOpenFileInApp={handleOpenFileInApp}
              onRefreshRecent={refreshRecent}
              onShowToast={showToast}
              isCreating={isCreatingProject}
              isRefreshingRecent={isRefreshingRecent}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'palettes' && (
            <PalettesView palettes={palettes} onSavePalettes={handleSavePalettes} />
          )}

          {activeTab === 'updates' && (
            <UpdateCenterView
              apps={apps}
              onCheckUpdates={loadData}
              onUpdateAll={handleUpdateAll}
              onInstall={handleInstall}
              isChecking={isRefreshing}
              progressMap={progressMap}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onSettingsChanged={refreshRecent}
              onShowToast={showToast}
              isScanning={isRefreshingRecent}
            />
          )}
        </main>
      </div>

      {/* Non-intrusive Update Available Popup Modal */}
      {notifyingUpdateApp && (
        <UpdateNotificationModal
          app={notifyingUpdateApp}
          onUpdateNow={(app) => handleInstall(app, 'native')}
          onLater={handleLaterUpdate}
          progress={progressMap[notifyingUpdateApp.app_id]}
        />
      )}

      {/* First-time Onboarding Modal (Only on fresh installation, never on updates) */}
      {showOnboardingModal && onboardingSettings && (
        <FirstTimeSetupModal
          initialSettings={onboardingSettings}
          onClose={() => setShowOnboardingModal(false)}
          onComplete={(_updated) => {
            setShowOnboardingModal(false);
            showToast('Kreativt arbeidsområde opprettet i Dokumenter/OpenArt!', 'success');
            refreshRecent();
          }}
        />
      )}

      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 h-10 pl-3 pr-4 rounded-md shadow-menu text-[13px] text-white animate-in fade-in slide-in-from-bottom-2"
          style={{
            background:
              toastMessage.type === 'error'
                ? '#c9252d'
                : toastMessage.type === 'info'
                ? '#378ef0'
                : '#268e6c',
          }}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

export default App;