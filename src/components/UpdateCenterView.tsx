import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppTile } from './AppTile';

interface UpdateCenterViewProps {
  apps: AppReleaseInfo[];
  onCheckUpdates: () => void;
  onUpdateAll: () => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  isChecking: boolean;
  progressMap: Record<string, DownloadProgressPayload>;
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const UpdateCenterView: React.FC<UpdateCenterViewProps> = ({
  apps,
  onCheckUpdates,
  onUpdateAll,
  onInstall,
  isChecking,
  progressMap,
}) => {
  const updates = apps.filter((a) => a.status === 'UpdateAvailable');
  const upToDate = apps.filter((a) => a.status === 'Installed');

  return (
    <div className="max-w-[880px]">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Oppdateringer</h1>
          <p className="text-[13px] text-ui-muted mt-1">
            {updates.length === 0
              ? 'Alle installerte apper er oppdatert.'
              : `${updates.length} ${updates.length === 1 ? 'oppdatering' : 'oppdateringer'} tilgjengelig.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {upToDate.length > 0 && (
        <section>
          <h2 className="text-[13px] font-semibold text-ui-muted mb-2">Oppdatert</h2>
          <div className="rounded-lg border border-ui-border bg-ui-panel divide-y divide-ui-line">
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
      )}

      {updates.length === 0 && upToDate.length === 0 && (
        <p className="text-[13px] text-ui-muted">Ingen apper er installert ennå.</p>
      )}
    </div>
  );
};