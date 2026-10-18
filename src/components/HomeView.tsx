import React from 'react';
import { Play, Download, FolderOpen, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { AppReleaseInfo, RecentProjectFile, SmartProject } from '../types';
import { AppTile } from './AppTile';
import { RecentFilesGrid } from './RecentFilesGrid';

interface HomeViewProps {
  apps: AppReleaseInfo[];
  recentFiles: RecentProjectFile[];
  projects: SmartProject[];
  recentLaunchedAppIds: string[];
  onLaunchNative: (appId: string) => void;
  onOpenFileInApp: (appId: string, filePath: string) => void;
  onRefreshRecent?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  isRefreshingRecent?: boolean;
  onNavigateToApps: () => void;
  onNavigateToSettings?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  apps,
  recentFiles,
  projects,
  recentLaunchedAppIds,
  onLaunchNative,
  onOpenFileInApp,
  onRefreshRecent,
  onShowToast,
  isRefreshingRecent,
  onNavigateToApps,
  onNavigateToSettings,
}) => {
  // Determine Quick Launch apps:
  // 1. First prioritize apps the user has launched recently through the Hub
  // 2. Supplement with other installed apps (e.g. Blender, Krita, PhotoCraft)
  // 3. Fallback to top featured apps
  const installedApps = apps.filter((a) => a.status !== 'NotInstalled');

  const quickLaunchApps: AppReleaseInfo[] = React.useMemo(() => {
    const list: AppReleaseInfo[] = [];
    const addedIds = new Set<string>();

    // Add recently launched apps first
    for (const id of recentLaunchedAppIds) {
      const found = apps.find((a) => a.app_id === id);
      if (found && !addedIds.has(found.app_id)) {
        list.push(found);
        addedIds.add(found.app_id);
      }
    }

    // Add remaining installed apps
    for (const app of installedApps) {
      if (!addedIds.has(app.app_id)) {
        list.push(app);
        addedIds.add(app.app_id);
      }
    }

    // If fewer than 4, add key default studio apps
    if (list.length < 4) {
      for (const app of apps) {
        if (!addedIds.has(app.app_id)) {
          list.push(app);
          addedIds.add(app.app_id);
          if (list.length >= 6) break;
        }
      }
    }

    return list.slice(0, 6);
  }, [apps, installedApps, recentLaunchedAppIds]);

  return (
    <div className="max-w-[1080px] space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-ui-line/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[24px] font-bold tracking-tight text-white">Hjem</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Klar
            </span>
          </div>
          <p className="text-[13px] text-ui-muted">
            Ditt kreative skrivebord. Rask tilgang til nylig brukte filer og hurtigstart av programmene dine.
          </p>
        </div>

        <button
          onClick={onNavigateToApps}
          className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 text-xs text-ui-text hover:text-white"
        >
          <span>Utforsk alle apper</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Launch (Hurtigstart) Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-[15px] font-bold tracking-tight text-white">
              Hurtigstart (Sist brukte programmer)
            </h2>
          </div>
          <span className="text-[12px] text-ui-faint">
            {installedApps.length} installert
          </span>
        </div>

        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {quickLaunchApps.map((app) => {
            const isInstalled = app.status !== 'NotInstalled';
            return (
              <div
                key={app.app_id}
                className="group rounded-xl border border-ui-border bg-ui-panel hover:border-ui-blue/50 p-3.5 transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AppTile app={app} size={42} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold text-white truncate group-hover:text-ui-blue transition-colors">
                      {app.app_name}
                    </h3>
                    <p className="text-[11px] text-ui-faint truncate">{app.category}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {isInstalled ? (
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Installert
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-ui-faint">
                          Tilgjengelig
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchNative(app.app_id)}
                  className={`w-full h-8 rounded-md font-medium text-[12px] flex items-center justify-center gap-1.5 transition-colors ${
                    isInstalled
                      ? 'bg-ui-blue hover:bg-blue-600 text-white shadow-sm'
                      : 'bg-ui-hover hover:bg-[#333] text-ui-text hover:text-white border border-ui-border'
                  }`}
                >
                  {isInstalled ? (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isInstalled ? `Start ${app.app_name}` : `Installer ${app.app_name}`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Recent Files Section */}
      {recentFiles.length > 0 ? (
        <RecentFilesGrid
          files={recentFiles}
          allApps={apps}
          projects={projects}
          onOpenFileInApp={onOpenFileInApp}
          onRefresh={onRefreshRecent}
          onOpenSettings={onNavigateToSettings}
          onShowToast={onShowToast}
          isRefreshing={isRefreshingRecent}
          title="Sist jobbet med (Live fra alle apper)"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-ui-border bg-ui-panel/40 p-8 text-center">
          <FolderOpen className="w-10 h-10 text-ui-muted mx-auto mb-2 opacity-60" />
          <h3 className="text-[14px] font-semibold text-white mb-1">
            Ingen nylige filer funnet ennå
          </h3>
          <p className="text-[12px] text-ui-muted max-w-md mx-auto mb-4">
            Når du jobber i Blender, Krita eller ArtCraft-programmene dine, vil prosjektene og filene dine automatisk dukke opp her med forhåndsvisning.
          </p>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="btn-secondary py-1.5 px-3 text-[12px] inline-flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-ui-blue" />
              <span>Tilpass overvåkede mapper & innstillinger</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
