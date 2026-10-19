import React from 'react';
import { ArrowRight, FolderOpen, LayoutGrid, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppReleaseInfo, RecentProjectFile, SmartProject } from '../types';
import { AppTile } from './AppTile';
import { RecentFilesGrid } from './RecentFilesGrid';

interface HomeViewProps {
  apps: AppReleaseInfo[];
  recentFiles: RecentProjectFile[];
  projects: SmartProject[];
  recentLaunchedAppIds: string[];
  onLaunchNative: (appId: string) => void;
  onInstall?: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
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
  onInstall,
  onOpenFileInApp,
  onRefreshRecent,
  onShowToast,
  isRefreshingRecent,
  onNavigateToApps,
  onNavigateToSettings,
}) => {
  const { t } = useTranslation();

  // Show only apps that are actually installed
  const installedApps = apps.filter((a) => a.status !== 'NotInstalled');

  // Order installed apps: recently launched first, then other installed apps
  const quickLaunchApps: AppReleaseInfo[] = React.useMemo(() => {
    const list: AppReleaseInfo[] = [];
    const addedIds = new Set<string>();

    for (const id of recentLaunchedAppIds) {
      const found = installedApps.find((a) => a.app_id === id);
      if (found && !addedIds.has(found.app_id)) {
        list.push(found);
        addedIds.add(found.app_id);
      }
    }

    for (const app of installedApps) {
      if (!addedIds.has(app.app_id)) {
        list.push(app);
        addedIds.add(app.app_id);
      }
    }

    return list;
  }, [installedApps, recentLaunchedAppIds]);

  return (
    <div className="max-w-[1120px] space-y-8 pb-12">
      {/* Header Banner - Calm, restrained Adobe CC aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-ui-text">
              {t('home.title')}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-ui-surface-2 text-ui-muted border border-ui-border">
              {t('home.readyStatus')}
            </span>
          </div>
          <p className="text-xs text-ui-muted">
            {t('home.subtitle')}
          </p>
        </div>

        <button
          onClick={onNavigateToApps}
          className="btn-secondary self-start sm:self-auto flex items-center gap-1.5 text-xs text-ui-text hover:text-ui-accent transition-colors cursor-pointer"
        >
          <span>{t('home.exploreApps')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Launch (Installed Apps Only) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-ui-text">
              {t('home.installedAppsTitle')}
            </h2>
            <span className="text-xs text-ui-muted">
              ({installedApps.length})
            </span>
          </div>
        </div>

        {quickLaunchApps.length > 0 ? (
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {quickLaunchApps.map((app) => (
              <div
                key={app.app_id}
                className="group rounded-xl border border-ui-border bg-ui-surface hover:border-ui-border-strong p-3.5 transition-all duration-200 shadow-sm hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-3">
                  <AppTile app={app} size={38} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-ui-text truncate group-hover:text-ui-accent transition-colors">
                      {app.app_name}
                    </h3>
                    <p className="text-[11px] text-ui-muted truncate mt-0.5">{app.category}</p>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchNative(app.app_id)}
                  className="w-full h-8 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 bg-ui-surface-2 hover:bg-ui-surface-2/80 text-ui-text border border-ui-border transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current text-ui-muted" />
                  <span>{t('common.open')}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-ui-border bg-ui-surface/50 p-7 text-center">
            <div className="w-10 h-10 rounded-xl bg-ui-surface-2 text-ui-muted flex items-center justify-center mx-auto mb-3">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-ui-text mb-1">
              {t('home.noInstalledApps')}
            </h3>
            <p className="text-xs text-ui-muted max-w-sm mx-auto mb-4">
              {t('home.installAppCta')}
            </p>
            <button
              onClick={onNavigateToApps}
              className="btn-secondary py-1.5 px-3.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('home.exploreApps')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Live Recent Files Section */}
      {recentFiles.length > 0 ? (
        <RecentFilesGrid
          files={recentFiles}
          allApps={apps}
          projects={projects}
          onOpenFileInApp={onOpenFileInApp}
          onInstall={onInstall}
          onRefresh={onRefreshRecent}
          onOpenSettings={onNavigateToSettings}
          onShowToast={onShowToast}
          isRefreshing={isRefreshingRecent}
          title={t('home.recentFilesTitle')}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-ui-border bg-ui-surface/50 p-8 text-center">
          <FolderOpen className="w-10 h-10 text-ui-muted mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-ui-text mb-1">
            {t('home.noRecentFiles')}
          </h3>
          <p className="text-xs text-ui-muted max-w-md mx-auto mb-4">
            {t('home.noRecentFilesCta')}
          </p>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-ui-muted" />
              <span>{t('nav.settings')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
