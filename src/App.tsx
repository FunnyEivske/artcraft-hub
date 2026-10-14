import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, HubTab } from './components/Sidebar';
import { AppHubView } from './components/AppHubView';
import { ProjectsView } from './components/ProjectsView';
import { PalettesView } from './components/PalettesView';
import { UpdateCenterView } from './components/UpdateCenterView';
import { WebStudioModal } from './components/WebStudioModal';
import {
  AppReleaseInfo,
  ColorPalette,
  DownloadProgressPayload,
  SmartProject,
  SystemInfo,
} from './types';
import {
  checkGithubReleases,
  createSmartProject,
  getSystemInfo,
  installOrUpdateApp,
  launchApp,
  loadPalettes,
  onDownloadProgress,
  savePalettes,
  scanProjectsAndFiles,
} from './services/tauri';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<HubTab>('apps');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [apps, setApps] = useState<AppReleaseInfo[]>([]);
  const [projects, setProjects] = useState<SmartProject[]>([]);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, DownloadProgressPayload>>({});
  const [activeWebStudioApp, setActiveWebStudioApp] = useState<AppReleaseInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [sys, rels, projs, pals] = await Promise.all([
        getSystemInfo(),
        checkGithubReleases(),
        scanProjectsAndFiles(),
        loadPalettes(),
      ]);
      setSystemInfo(sys);
      setApps(rels);
      setProjects(projs);
      setPalettes(pals);
    } catch {
      showToast('Kunne ikke hente versjoner – viser lokal oversikt', 'info');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to live download progress from Rust backend
    const unsubscribe = onDownloadProgress((payload) => {
      setProgressMap((prev) => ({
        ...prev,
        [payload.app_id]: payload,
      }));

      if (payload.status === 'completed') {
        showToast('Installasjonen er fullført', 'success');
        // Refresh app list after installation finishes
        checkGithubReleases().then((updated) => setApps(updated));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLaunchNative = async (appId: string) => {
    try {
      const res = await launchApp(appId);
      showToast(res, 'success');
    } catch (err) {
      showToast(`Kunne ikke starte native app: ${err}`, 'error');
    }
  };

  const handleLaunchWeb = (app: AppReleaseInfo) => {
    setActiveWebStudioApp(app);
  };

  const handleInstall = async (app: AppReleaseInfo, targetType: 'native' | 'web') => {
    try {
      const downloadUrl =
        targetType === 'web'
          ? app.web_download_url || `https://github.com/storytold/${app.app_id}/releases/latest`
          : app.native_download_url || `https://github.com/storytold/${app.app_id}/releases/latest`;

      showToast(`Laster ned ${app.app_name}`, 'info');
      await installOrUpdateApp(app.app_id, downloadUrl, targetType, app.latest_version);
    } catch (err) {
      showToast(`Feil under installasjon: ${err}`, 'error');
    }
  };

  const handleCreateProject = async (name: string, type: string, description: string) => {
    setIsCreatingProject(true);
    try {
      const newProj = await createSmartProject(name, type, description);
      setProjects((prev) => [...prev, newProj]);
      showToast(`Prosjektet «${name}» er opprettet`, 'success');
    } catch (err) {
      showToast(`Feil ved opprettelse: ${err}`, 'error');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleOpenFileInApp = async (appId: string, filePath: string) => {
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
    const toUpdate = apps.filter((a) => a.status === 'UpdateAvailable' || a.status === 'NotInstalled');
    if (toUpdate.length === 0) {
      showToast('Alle apper er oppdatert', 'info');
      return;
    }

    showToast(`Oppdaterer ${toUpdate.length} apper`, 'info');
    for (const app of toUpdate) {
      await handleInstall(app, 'native');
    }
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
              onLaunchWeb={handleLaunchWeb}
              onInstall={handleInstall}
              progressMap={progressMap}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onCreateProject={handleCreateProject}
              onOpenFileInApp={handleOpenFileInApp}
              isCreating={isCreatingProject}
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
        </main>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 h-10 pl-3 pr-4 rounded-md shadow-menu text-[13px] text-white"
          style={{ background: toastMessage.type === 'error' ? '#c9252d' : toastMessage.type === 'info' ? '#378ef0' : '#268e6c' }}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {activeWebStudioApp && (
        <WebStudioModal app={activeWebStudioApp} onClose={() => setActiveWebStudioApp(null)} />
      )}
    </div>
  );
}

export default App;
