import React from 'react';
import { RefreshCw, CheckCircle2, ArrowDownCircle, Sparkles } from 'lucide-react';
import { AppReleaseInfo, DownloadProgressPayload, HubUpdateInfo } from '../types';
import { AppTile } from './AppTile';
import { BrandLogo } from './BrandLogo';

interface UpdateCenterViewProps {
  apps: AppReleaseInfo[];
  hubUpdate?: HubUpdateInfo | null;
  onCheckUpdates: () => void;
  onUpdateAll: () => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  onInstallHub?: () => void;
  isChecking: boolean;
  progressMap: Record<string, DownloadProgressPayload>;
  onSimulateUpdate?: () => void;
  onShowChangelog?: () => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const UpdateCenterView: React.FC<UpdateCenterViewProps> = ({
  apps,
  hubUpdate,
  onCheckUpdates,
  onUpdateAll,
  onInstall,
  onInstallHub,
  isChecking,
  progressMap,
  onSimulateUpdate,
  onShowChangelog,
}) => {
  const updates = apps.filter((a) => a.status === 'UpdateAvailable');
  const upToDate = apps.filter((a) => a.status === 'Installed');
  const hubUpdateAvailable = Boolean(hubUpdate?.updateAvailable);
  const totalCount = updates.length + (hubUpdateAvailable ? 1 : 0);

  return (
    <div className="max-w-[880px]">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Oppdateringer</h1>
          <p className="text-[13px] text-ui-muted mt-1">
            {totalCount === 0
              ? 'Alt er oppdatert. Ingen nye oppdateringer tilgjengelig.'
              : `${totalCount} ${totalCount === 1 ? 'oppdatering' : 'oppdateringer'} tilgjengelig.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onShowChangelog && (
            <button className="btn-secondary flex items-center gap-1.5 text-purple-300 hover:text-white border-purple-500/30" onClick={onShowChangelog}>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Hva er nytt</span>
            </button>
          )}
          <button className="btn-quiet" onClick={onCheckUpdates} disabled={isChecking}>
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Ser etter...' : 'Se etter oppdateringer'}
          </button>
          {updates.length > 0 && (
            <button className="btn-primary" onClick={onUpdateAll}>
              Oppdater alle
            </button>
          )}
        </div>
      </div>

      {hubUpdate?.updateAvailable && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between gap-4 animate-in fade-in shadow-[0_0_16px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-ui-rail border border-ui-border flex items-center justify-center flex-shrink-0">
              <BrandLogo size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-white">OpenArt Hub {hubUpdate.latestVersion} tilgjengelig</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Ny Hub-versjon
                </span>
              </div>
              <p className="text-[12px] text-ui-muted mt-0.5">
                Installert: <span className="font-mono text-slate-300">{hubUpdate.currentVersion}</span> → Nyeste: <span className="font-mono text-emerald-400">{hubUpdate.latestVersion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onInstallHub}
            className="btn-primary h-8 px-4 text-[12.5px] font-medium flex items-center gap-1.5 shadow-sm"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Oppdater Hub nå</span>
          </button>
        </div>
      )}

      {updates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-semibold text-ui-muted mb-2">Tilgjengelig for oppdatering</h2>
          <div className="rounded-lg border border-ui-border bg-ui-panel divide-y divide-ui-line">
            {updates.map((app) => {
              const p = progressMap[app.app_id];
              const busy = p && p.percent < 100 && p.status !== 'error';
              return (
                <div key={app.app_id} className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <AppTile app={app} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold">{app.app_name}</div>
                      <div className="text-[12.5px] text-ui-muted tabular-nums">
                        {app.installed_version} → {app.latest_version}
                        {formatDate(app.published_at) && ` • ${formatDate(app.published_at)}`}
                      </div>
                    </div>
                    {busy ? (
                      <div className="w-40">
                        <div className="text-[12px] text-ui-muted text-right mb-1 tabular-nums">
                          {Math.round(p.percent)} %
                        </div>
                        <div className="h-1 rounded-full bg-[#3a3a3a] overflow-hidden">
                          <div className="h-full bg-ui-blue" style={{ width: `${p.percent}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button className="btn-secondary" onClick={() => onInstall(app, 'native')}>
                        Oppdater
                      </button>
                    )}
                  </div>
                  {app.release_notes && (
                    <p className="pl-[52px] mt-2 text-[12.5px] text-ui-muted whitespace-pre-line line-clamp-3">
                      {app.release_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[13px] font-semibold text-ui-muted mb-2">Oppdatert og klart</h2>
        <div className="rounded-lg border border-ui-border bg-ui-panel divide-y divide-ui-line">
          {!hubUpdate?.updateAvailable && (
            <div className="px-4 py-2.5 flex items-center gap-4">
              <div className="w-7 h-7 rounded-md bg-ui-rail border border-ui-border flex items-center justify-center flex-shrink-0">
                <BrandLogo size={18} />
              </div>
              <span className="flex-1 text-[13.5px] font-medium text-slate-200">OpenArt Hub Desktop</span>
              <span className="text-[12px] text-ui-faint tabular-nums font-mono">v{hubUpdate?.currentVersion || '1.0.0'}</span>
              <CheckCircle2 className="w-4 h-4 text-[#2d9d78]" />
            </div>
          )}
          {upToDate.map((app) => (
            <div key={app.app_id} className="px-4 py-2.5 flex items-center gap-4">
              <AppTile app={app} size={28} />
              <span className="flex-1 text-[13.5px]">{app.app_name}</span>
              <span className="text-[12px] text-ui-faint tabular-nums">{app.installed_version}</span>
              <CheckCircle2 className="w-4 h-4 text-[#2d9d78]" />
            </div>
          ))}
        </div>
      </section>

      {onSimulateUpdate && (
        <div className="mt-8 pt-4 border-t border-ui-line/60 flex items-center justify-between text-[11.5px] text-ui-faint">
          <span>Vil du se hvordan oppdateringsikonet i topphjørnet og installasjonsvarselet fungerer?</span>
          <button
            onClick={onSimulateUpdate}
            className="px-2.5 py-1 rounded bg-ui-surface hover:bg-ui-hover text-ui-muted hover:text-white transition-colors border border-ui-border"
          >
            Simuler tilgjengelig oppdatering
          </button>
        </div>
      )}
    </div>
  );
};