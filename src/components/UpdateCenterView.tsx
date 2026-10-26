import React from 'react';
import { RefreshCw, CheckCircle2, ArrowDownCircle, Sparkles, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppReleaseInfo, DownloadProgressPayload, HubUpdateInfo } from '../types';
import { AppTile } from './AppTile';
import { BrandLogo } from './BrandLogo';
import { formatDate } from '../services/date';
import { QueueItem } from '../services/installQueue';

interface UpdateCenterViewProps {
  apps: AppReleaseInfo[];
  hubUpdate?: HubUpdateInfo | null;
  onCheckUpdates: () => void;
  onUpdateAll: () => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  onLaunchNative?: (appId: string) => void;
  onInstallHub?: () => void;
  isChecking: boolean;
  progressMap: Record<string, DownloadProgressPayload>;
  onSimulateUpdate?: () => void;
  onShowChangelog?: () => void;
  getQueuePosition?: (appId: string) => number;
  onCancelQueued?: (appId: string) => void;
  activeItem?: QueueItem | null;
  waitingCount?: number;
}

export const UpdateCenterView: React.FC<UpdateCenterViewProps> = ({
  apps,
  hubUpdate,
  onCheckUpdates,
  onUpdateAll,
  onInstall,
  onLaunchNative,
  onInstallHub,
  isChecking,
  progressMap,
  onSimulateUpdate,
  onShowChangelog,
  getQueuePosition,
  onCancelQueued,
  activeItem,
  waitingCount = 0,
}) => {
  const { t } = useTranslation();
  const updates = apps.filter((a) => a.status === 'UpdateAvailable');
  const upToDate = apps.filter((a) => a.status === 'Installed');
  const hubUpdateAvailable = Boolean(hubUpdate?.updateAvailable);
  const totalCount = updates.length + (hubUpdateAvailable ? 1 : 0);

  return (
    <div className="max-w-[880px] pb-12 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ui-text">
              {t('updates.title')}
            </h1>
            {totalCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ui-accent text-white">
                {totalCount}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ui-surface-2 text-ui-muted border border-ui-border">
                {t('updates.upToDate')}
              </span>
            )}
          </div>
          <p className="text-xs text-ui-muted mt-1">
            {totalCount === 0
              ? t('updates.allUpToDate')
              : t('updates.availableCount', { count: totalCount })}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onShowChangelog && (
            <button
              type="button"
              className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              onClick={onShowChangelog}
            >
              <Sparkles className="w-3.5 h-3.5 text-ui-muted" />
              <span>{t('changelog.title')}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            onClick={onCheckUpdates}
            disabled={isChecking}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-ui-accent' : 'text-ui-muted'}`} />
            <span>{isChecking ? t('updates.checking') : t('updates.check')}</span>
          </button>

          {totalCount > 0 && (
            <button
              type="button"
              className="btn-primary text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
              onClick={onUpdateAll}
            >
              {t('updates.updateAll')}
            </button>
          )}
        </div>
      </div>

      {/* Active Install & Update Queue Banner */}
      {(activeItem || waitingCount > 0) && (
        <div className="p-3.5 rounded-xl border border-ui-accent/30 bg-ui-surface flex items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ui-accent/15 border border-ui-accent/30 flex items-center justify-center flex-shrink-0 text-ui-accent">
              <RefreshCw className="w-4 h-4 animate-spin text-ui-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ui-text">
                  {activeItem
                    ? t('updates.queueRunning', { app: activeItem.app.app_name })
                    : t('updates.queueFinalizing')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-ui-accent text-white">
                  {waitingCount > 0 ? t('updates.queueRemaining', { count: waitingCount }) : t('updates.queueLast')}
                </span>
              </div>
              <p className="text-[11px] text-ui-muted mt-0.5 font-mono">
                {waitingCount > 0
                  ? t('updates.queueRemaining', { count: waitingCount })
                  : t('updates.queueFinalizing')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hub Self Update Banner (Always given highest priority) */}
      {hubUpdate?.updateAvailable && (() => {
        const isHubBusy = activeItem?.appId === 'openart-hub' || activeItem?.appId === 'artcraft-hub';
        const hubQueuePos = getQueuePosition ? (getQueuePosition('openart-hub') || getQueuePosition('artcraft-hub')) : 0;

        return (
          <div className="p-4 rounded-xl border border-indigo-500/40 bg-ui-surface flex items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 text-indigo-400">
                <BrandLogo size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ui-text">
                    OpenArt Hub v{hubUpdate.latestVersion}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500 text-white shadow-xs">
                    {t('updates.newHubVersion')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {t('updates.hubPriorityBadge') || 'Høyeste prioritet'}
                  </span>
                </div>
                <p className="text-xs text-ui-muted mt-0.5 font-mono">
                  v{hubUpdate.currentVersion} → v{hubUpdate.latestVersion} • <span className="text-emerald-400/90 font-sans font-medium">{t('updates.hubPriorityHint') || 'Oppdateres alltid først'}</span>
                </p>
              </div>
            </div>

            {isHubBusy ? (
              <button
                type="button"
                disabled
                className="btn-secondary text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 opacity-80 cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-ui-accent" />
                <span>{t('updates.updatingHubNow') || 'Oppdaterer Hub...'}</span>
              </button>
            ) : hubQueuePos > 0 ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>{t('updates.queuedPriority', { pos: hubQueuePos }) || `I kø (Prioritet #${hubQueuePos})`}</span>
                </span>
                {onCancelQueued && (
                  <button
                    type="button"
                    onClick={() => {
                      onCancelQueued('openart-hub');
                      onCancelQueued('artcraft-hub');
                    }}
                    className="p-1 rounded text-ui-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={t('updates.removeFromQueue')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onInstallHub}
                className="btn-primary text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>{t('updates.updateHubNow')}</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Pending Updates Section */}
      {updates.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
            {t('updates.available')} ({updates.length})
          </h2>

          <div className="rounded-xl border border-ui-border bg-ui-surface divide-y divide-ui-border overflow-hidden">
            {updates.map((app) => {
              const p = progressMap[app.app_id];
              const busy = p && p.percent < 100 && p.status !== 'error';
              const queuePos = getQueuePosition ? getQueuePosition(app.app_id) : 0;

              return (
                <div key={app.app_id} className="p-4 hover:bg-ui-surface-2/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <AppTile app={app} size={38} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ui-text">
                          {app.app_name}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-ui-accent bg-ui-surface-2 px-1.5 py-0.5 rounded border border-ui-accent/30">
                          {app.installed_version} → {app.latest_version}
                        </span>
                      </div>
                      <div className="text-xs text-ui-muted mt-0.5">
                        {app.published_at && formatDate(app.published_at)}
                      </div>
                    </div>

                    {busy ? (
                      <div className="w-36">
                        <div className="flex justify-between text-xs text-ui-muted mb-1 font-mono">
                          <span>{p.message || t('common.updating')}</span>
                          <span>{Math.round(p.percent)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ui-surface-2 overflow-hidden border border-ui-border">
                          <div
                            className="h-full bg-ui-accent rounded-full transition-all duration-200"
                            style={{ width: `${p.percent}%` }}
                          />
                        </div>
                      </div>
                    ) : queuePos > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-ui-surface-2 text-amber-500 border border-amber-500/30 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                          <span>{t('updates.inQueue', { pos: queuePos })}</span>
                        </span>
                        {onCancelQueued && (
                          <button
                            type="button"
                            className="p-1 rounded text-ui-muted hover:text-red-400 hover:bg-ui-surface-2 transition-colors cursor-pointer"
                            title={t('updates.removeFromQueue')}
                            onClick={() => onCancelQueued(app.app_id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {onLaunchNative && (
                          <button
                            type="button"
                            className="btn-secondary text-xs h-7 px-3 rounded-lg cursor-pointer"
                            onClick={() => onLaunchNative(app.app_id)}
                          >
                            {t('common.open')}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-primary text-xs h-7 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                          onClick={() => onInstall(app, 'native')}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t('common.update')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Changelog snippet */}
                  {app.release_notes && (
                    <div className="mt-2.5 pl-13 text-xs text-ui-muted leading-relaxed whitespace-pre-line line-clamp-2 bg-ui-bg p-2.5 rounded-lg border border-ui-border">
                      {app.release_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Up To Date Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
          {t('updates.upToDate')} ({upToDate.length + (!hubUpdate?.updateAvailable ? 1 : 0)})
        </h2>

        <div className="rounded-xl border border-ui-border bg-ui-surface divide-y divide-ui-border overflow-hidden">
          {!hubUpdate?.updateAvailable && (
            <div className="px-4 py-2.5 flex items-center gap-3.5 text-xs">
              <div className="w-7 h-7 rounded-md bg-ui-surface-2 border border-ui-border flex items-center justify-center flex-shrink-0">
                <BrandLogo size={18} />
              </div>
              <span className="flex-1 font-medium text-ui-text">OpenArt Hub</span>
              <span className="text-ui-muted font-mono text-[11px]">
                v{hubUpdate?.currentVersion || '1.0.6'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>
          )}

          {upToDate.map((app) => (
            <div key={app.app_id} className="px-4 py-2.5 flex items-center gap-3.5 text-xs">
              <AppTile app={app} size={28} />
              <span className="flex-1 font-medium text-ui-text">{app.app_name}</span>
              <span className="text-ui-muted font-mono text-[11px]">
                {app.installed_version || app.latest_version}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Subtle Simulation / Debug Option */}
      {onSimulateUpdate && (
        <div className="pt-4 border-t border-ui-border flex items-center justify-between text-xs text-ui-muted">
          <span>{t('updates.simulateDesc')}</span>
          <button
            type="button"
            onClick={onSimulateUpdate}
            className="btn-quiet text-xs px-2.5 py-1 rounded-md text-ui-muted hover:text-ui-text border border-ui-border cursor-pointer"
          >
            {t('updates.simulateButton')}
          </button>
        </div>
      )}
    </div>
  );
};