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
import { ChangelogModal } from './components/ChangelogModal';
import {
  AppReleaseInfo,
  ColorPalette,
  DownloadProgressPayload,
  HubUpdateInfo,
  RecentProjectFile,
  SmartProject,
  SystemInfo,
  ScannerSettings,
} from './types';
import {
  checkGithubReleases,
  checkHubAppUpdate,
  createSmartProject,
  discoverAllRecentFiles,
  downloadAndInstallHubUpdate,
  getSystemInfo,
  getScannerSettings,
  installOrUpdateApp,
  launchApp,
  loadPalettes,
  onDownloadProgress,
  onProjectsUpdated,
  savePalettes,
  scanProjectsAndFiles,
  uninstallApp,
  logClientDiagnostic,
} from './services/tauri';
import { CheckCircle2, AlertCircle, Copy, Check, X } from 'lucide-react';

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
  const [hubUpdate, setHubUpdate] = useState<HubUpdateInfo | null>(null);

  // First-time onboarding popup (only on first install, NOT on updates)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingSettings, setOnboardingSettings] = useState<ScannerSettings | null>(null);

  // Changelog / What's New modal for updates
  const CURRENT_HUB_VERSION = '1.0.6';
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [toastCopied, setToastCopied] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastCopied(false);
    setToastMessage({ text, type });
    if (type === 'error') {
      logClientDiagnostic('ERROR', 'ui_toast', text);
      setTimeout(() => setToastMessage((curr) => (curr?.text === text ? null : curr)), 8000);
    } else {
      setTimeout(() => setToastMessage((curr) => (curr?.text === text ? null : curr)), 3500);
    }
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

  const createHubReleaseInfo = (hubInfo: HubUpdateInfo): AppReleaseInfo => ({
    app_id: 'openart-hub',
    app_name: 'OpenArt Hub',
    alternative_to: 'Creative Suite Desktop Hub',
    description: 'Hovedapplikasjon og launcher for ArtCraft-økosystemet med nylige filer og prosjektbehandling.',
    category: 'Kreativ Hub & Studio',
    color_accent: '#6366f1',
    icon_name: 'Sliders',
    file_types: [],
    latest_version: hubInfo.latestVersion,
    release_name: hubInfo.releaseName || `OpenArt Hub ${hubInfo.latestVersion}`,
    release_notes: hubInfo.releaseNotes || 'Optimaliseringer, forbedret filskanning og stabilitet.',
    published_at: hubInfo.publishedAt,
    native_download_url: hubInfo.downloadUrl || undefined,
    native_asset_name: hubInfo.assetName || undefined,
    status: 'UpdateAvailable',
    installed_version: hubInfo.currentVersion,
    installed_type: 'native',
    has_web_app: false,
  });

  const checkForUpdatePrompts = useCallback(
    (appList: AppReleaseInfo[], hubInfo?: HubUpdateInfo | null, isManual = false): AppReleaseInfo | null => {
      // 1. Prioritize Hub's own update if available
      if (hubInfo?.updateAvailable) {
        const snoozeKey = `${SNOOZE_PREFIX}openart_hub_${hubInfo.latestVersion}`;
        const isSnoozed = !isManual && sessionStorage.getItem(snoozeKey) === 'true';
        if (!isSnoozed) {
          const hubRel = createHubReleaseInfo(hubInfo);
          setNotifyingUpdateApp(hubRel);
          return hubRel;
        }
      }

      // 2. Check installed apps
      const updateCandidate = appList.find((a) => {
        if (a.status !== 'UpdateAvailable') return false;
        if (isManual) return true;
        try {
          const snoozeKey = `${SNOOZE_PREFIX}${a.app_id}_${a.latest_version}`;
          return sessionStorage.getItem(snoozeKey) !== 'true';
        } catch {
          return false;
        }
      });

      if (updateCandidate) {
        setNotifyingUpdateApp(updateCandidate);
        return updateCandidate;
      }

      return null;
    },
    []
  );

  const loadData = async (manualTrigger = false) => {
    setIsRefreshing(true);
    if (manualTrigger) {
      showToast('Søker etter oppdateringer...', 'info');
    }
    try {
      const [sys, rels, projs, pals, recents, hubUp] = await Promise.all([
        getSystemInfo(),
        checkGithubReleases(),
        scanProjectsAndFiles(),
        loadPalettes(),
        discoverAllRecentFiles().catch(() => [] as RecentProjectFile[]),
        checkHubAppUpdate().catch(() => null),
      ]);
      setSystemInfo(sys);
      setApps(rels);
      setProjects(projs);
      setPalettes(pals);
      setRecentFiles(recents);
      if (hubUp) {
        setHubUpdate(hubUp);
      }

      const candidate = checkForUpdatePrompts(rels, hubUp, manualTrigger);

      if (manualTrigger) {
        if (candidate || (hubUp && hubUp.updateAvailable)) {
          showToast('Ny oppdatering tilgjengelig!', 'success');
        } else {
          showToast('Alt er oppdatert! Ingen nye oppdateringer tilgjengelig.', 'info');
        }
      }

      // Check onboarding state: ONLY show for genuine first-time installation!
      try {
        const scannerSet = await getScannerSettings();
        const localCompleted = localStorage.getItem('artcraft_onboarding_completed') === 'true';

        if (scannerSet.onboardingCompleted || localCompleted) {
          setShowOnboardingModal(false);
        } else {
          // Brand new installation!
          setOnboardingSettings(scannerSet);
          setShowOnboardingModal(true);
        }

        // Check if user updated from previous version to show changelog
        const lastSeenVer = localStorage.getItem('artcraft_last_seen_version');
        if (lastSeenVer && lastSeenVer !== CURRENT_HUB_VERSION) {
          setShowChangelogModal(true);
        }
        localStorage.setItem('artcraft_last_seen_version', CURRENT_HUB_VERSION);
      } catch (err) {
        console.error('Kunne ikke sjekke onboarding-status:', err);
      }
    } catch {
      showToast('Kunne ikke hente versjoner — viser lokal oversikt', 'info');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenOnboarding = async () => {
    try {
      const scannerSet = await getScannerSettings();
      setOnboardingSettings(scannerSet);
      setShowOnboardingModal(true);
    } catch (err) {
      console.error('Kunne ikke hente innstillinger for veiviser:', err);
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
        if (payload.app_id === 'openart-hub') {
          setHubUpdate((prev) => (prev ? { ...prev, updateAvailable: false } : null));
          setNotifyingUpdateApp(null);
          setShowChangelogModal(true);
        } else {
          // Refresh app list after installation finishes
          checkGithubReleases().then((updated) => {
            setApps(updated);
            // If modal was for this app, close it
            setNotifyingUpdateApp((curr) => (curr?.app_id === payload.app_id ? null : curr));
          });
        }
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
      if (app.app_id === 'openart-hub' || app.app_id === 'artcraft-hub') {
        const downloadUrl = app.native_download_url || 'https://github.com/FunnyEivske/artcraft-hub/releases/latest';
        const osExt = systemInfo?.os === 'macos' ? 'OpenArtHub.dmg' : systemInfo?.os === 'linux' ? 'OpenArtHub.AppImage' : 'OpenArtHub-Setup.exe';
        const fileName = app.native_asset_name || osExt;
        showToast('Laster ned nyeste OpenArt Hub...', 'info');
        await downloadAndInstallHubUpdate(downloadUrl, fileName);
        return;
      }

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

  const handleUninstall = async (app: AppReleaseInfo) => {
    const confirmed = window.confirm(
      `Er du sikker på at du vil avinstallere ${app.app_name}? Alle installasjonsfiler for programmet vil bli fjernet.`
    );
    if (!confirmed) return;

    try {
      showToast(`Avinstallerer ${app.app_name}...`, 'info');
      await uninstallApp(app.app_id);
      showToast(`${app.app_name} er nå avinstallert.`, 'success');
      await loadData(true);
    } catch (err) {
      showToast(`Kunne ikke avinstallere ${app.app_name}: ${err}`, 'error');
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
    showToast(`Oppdatering for ${app.app_name} utsatt. Klikk oppdateringsikonet i topphjørnet når du er klar.`, 'info');
  };

  const hubHasUpdate = Boolean(hubUpdate?.updateAvailable);
  const appsUpdateCount = apps.filter((a) => a.status === 'UpdateAvailable').length;
  const totalUpdatesCount = appsUpdateCount + (hubHasUpdate ? 1 : 0);
  const hasUpdatesAvailable = totalUpdatesCount > 0;

  const handleOpenPendingUpdatePrompt = () => {
    if (hubUpdate?.updateAvailable) {
      setNotifyingUpdateApp(createHubReleaseInfo(hubUpdate));
      return;
    }
    const appCandidate = apps.find((a) => a.status === 'UpdateAvailable');
    if (appCandidate) {
      setNotifyingUpdateApp(appCandidate);
      return;
    }
    setActiveTab('updates');
  };

  const handleSimulateUpdate = () => {
    const simulatedHub: HubUpdateInfo = {
      currentVersion: '1.0.0',
      latestVersion: '1.0.1',
      updateAvailable: true,
      releaseName: 'OpenArt Hub v1.0.1 Nyhetsoppdatering',
      releaseNotes: '• Raskere oppstart og prosjektinnlasting\n• Ny oppdateringsknapp i topphjørnet som varsler automatisk\n• Forbedret prosjekt- og filutforsking for Blender og Krita',
      publishedAt: new Date().toISOString(),
      downloadUrl: 'https://github.com/FunnyEivske/artcraft-hub/releases/latest',
      assetName: 'OpenArtHub-Setup.exe',
    };
    setHubUpdate(simulatedHub);
    setNotifyingUpdateApp(createHubReleaseInfo(simulatedHub));
    showToast('Oppdatering tilgjengelig! Nytt ikon aktivert i topphjørnet.', 'success');
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q && activeTab !== 'apps') setActiveTab('apps');
  };

  return (
    <div className="h-screen flex flex-col bg-ui-bg text-ui-text">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onRefreshReleases={() => loadData(true)}
        isRefreshing={isRefreshing}
        hasUpdatesAvailable={hasUpdatesAvailable}
        updatesCount={totalUpdatesCount}
        onOpenUpdatePrompt={handleOpenPendingUpdatePrompt}
      />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          appCount={apps.length}
          updatesCount={totalUpdatesCount}
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
              onInstall={handleInstall}
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
              onUninstall={handleUninstall}
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
              hubUpdate={hubUpdate}
              onCheckUpdates={() => loadData(true)}
              onUpdateAll={handleUpdateAll}
              onInstall={handleInstall}
              onLaunchNative={handleLaunchNative}
              onInstallHub={() => hubUpdate && handleInstall(createHubReleaseInfo(hubUpdate), 'native')}
              isChecking={isRefreshing}
              progressMap={progressMap}
              onSimulateUpdate={handleSimulateUpdate}
              onShowChangelog={() => setShowChangelogModal(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onSettingsChanged={refreshRecent}
              onShowToast={showToast}
              isScanning={isRefreshingRecent}
              onRerunOnboarding={handleOpenOnboarding}
              onShowChangelog={() => setShowChangelogModal(true)}
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

      {/* Changelog / What's New Update Log Modal */}
      {showChangelogModal && (
        <ChangelogModal
          version={CURRENT_HUB_VERSION}
          onClose={() => setShowChangelogModal(false)}
          onOpenOnboarding={handleOpenOnboarding}
        />
      )}

      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 min-h-10 py-1.5 pl-3 pr-2.5 rounded-lg shadow-2xl text-[13px] text-white animate-in fade-in slide-in-from-bottom-2 max-w-[90vw] border border-white/10"
          style={{
            background:
              toastMessage.type === 'error'
                ? '#b91c1c'
                : toastMessage.type === 'info'
                ? '#1d4ed8'
                : '#047857',
          }}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="leading-snug break-words max-w-xl">{toastMessage.text}</span>

          {toastMessage.type === 'error' && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(toastMessage.text);
                setToastCopied(true);
                setTimeout(() => setToastCopied(false), 2000);
              }}
              className="ml-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-[11px] font-medium transition-colors border border-white/15 flex-shrink-0 cursor-pointer"
              title="Kopier feilmeldingen til utklippstavlen"
            >
              {toastCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white/90" />
                  <span>Kopier feil</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded hover:bg-black/20 text-white/70 hover:text-white transition-colors ml-1 flex-shrink-0 cursor-pointer"
            title="Lukk"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;