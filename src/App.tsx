import { useState, useEffect } from 'react';
import { Header } from './components/Header';
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
  const [activeTab, setActiveTab] = useState<'apps' | 'projects' | 'palettes' | 'updates'>('apps');
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
      showToast('Koblet til OpenArt Hub i frakoblet/lokal modus', 'info');
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
        showToast(`${payload.app_id} ble installert og er klar!`, 'success');
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

      showToast(`Starter nedlasting av ${app.app_name}...`, 'info');
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
      showToast(`Smart-prosjekt '${name}' opprettet med standard 5-mappers struktur!`, 'success');
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
      showToast('Fargepaletter oppdatert og lagret!', 'success');
    } catch (err) {
      showToast(`Kunne ikke lagre paletter: ${err}`, 'error');
    }
  };

  const handleUpdateAll = async () => {
    const toUpdate = apps.filter((a) => a.status === 'UpdateAvailable' || a.status === 'NotInstalled');
    if (toUpdate.length === 0) {
      showToast('Alle apper er allerede oppdatert!', 'info');
      return;
    }

    showToast(`Køer oppdatering for ${toUpdate.length} apper...`, 'info');
    for (const app of toUpdate) {
      await handleInstall(app, 'native');
    }
  };

  const updatesCount = apps.filter((a) => a.status === 'UpdateAvailable').length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#141d2c] border border-white/10 shadow-2xl animate-fade-in text-xs font-semibold">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-white">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemInfo={systemInfo}
        updatesCount={updatesCount}
        onRefreshReleases={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'apps' && (
          <AppHubView
            apps={apps}
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
          <PalettesView
            palettes={palettes}
            onSavePalettes={handleSavePalettes}
          />
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

      {/* In-Hub WebAssembly Studio Modal */}
      {activeWebStudioApp && (
        <WebStudioModal
          app={activeWebStudioApp}
          onClose={() => setActiveWebStudioApp(null)}
        />
      )}
    </div>
  );
}

export default App;
