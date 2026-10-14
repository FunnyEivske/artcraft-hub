import React from 'react';
import {
  RefreshCw,
  Download,
  CheckCircle2,
  ArrowUpCircle,
  ExternalLink,
} from 'lucide-react';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';

interface UpdateCenterViewProps {
  apps: AppReleaseInfo[];
  onCheckUpdates: () => void;
  onUpdateAll: () => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  isChecking: boolean;
  progressMap: Record<string, DownloadProgressPayload>;
}

export const UpdateCenterView: React.FC<UpdateCenterViewProps> = ({
  apps,
  onCheckUpdates,
  onUpdateAll,
  onInstall,
  isChecking,
  progressMap,
}) => {
  const updatesAvailable = apps.filter((a) => a.status === 'UpdateAvailable');
  const installedApps = apps.filter((a) => a.status === 'Installed');
  const notInstalled = apps.filter((a) => a.status === 'NotInstalled');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 text-indigo-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Oppdateringssenter for ArtCraft-Studioene</span>
          </h2>
          <p className="text-xs text-slate-400">
            Henter offisielle versjoner direkte fra GitHub (storytold/{'<app_id>'})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCheckUpdates}
            disabled={isChecking}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#141b27] hover:bg-[#1a2333] active:scale-95 text-slate-200 text-xs font-semibold rounded-xl border border-white/5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Sjekker...' : 'Sjekk etter oppdateringer fra GitHub'}</span>
          </button>

          <button
            onClick={onUpdateAll}
            disabled={updatesAvailable.length === 0 && notInstalled.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all disabled:opacity-40"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Oppdater alle ({updatesAvailable.length > 0 ? updatesAvailable.length : apps.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Oppdateringer klare</span>
            <p className="text-lg font-bold text-white">{updatesAvailable.length} apper</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Oppdatert til siste versjon</span>
            <p className="text-lg font-bold text-white">{installedApps.length} apper</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-white/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Ikke installert</span>
            <p className="text-lg font-bold text-white">{notInstalled.length} apper</p>
          </div>
        </div>
      </div>

      {/* Apps Update Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 bg-[#0e1420] border-b border-white/5 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>ArtCraft App & Kategori</span>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline">Installert vs Siste</span>
            <span>Status & Handling</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {apps.map((app) => {
            const progress = progressMap[app.app_id];
            const isDownloading = progress && progress.percent < 100 && progress.status !== 'error';

            return (
              <div
                key={app.app_id}
                className="p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                {/* App Name & Category */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border border-white/10"
                    style={{ backgroundColor: `${app.color_accent}20`, color: app.color_accent }}
                  >
                    {app.app_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{app.app_name}</span>
                      <a
                        href={`https://github.com/storytold/${app.app_id}/releases`}
                        target="_blank"
                        rel="noreferrer"
                        title="Se på GitHub"
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {app.category} • <span className="font-mono text-slate-500">storytold/{app.app_id}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar or version comparison */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Versions */}
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                      {app.installed_version || 'Ingen'}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                      {app.latest_version}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isDownloading ? (
                      <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{Math.round(progress.percent)}%</span>
                      </div>
                    ) : app.status === 'UpdateAvailable' ? (
                      <button
                        onClick={() => onInstall(app, 'native')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>Oppdater</span>
                      </button>
                    ) : app.status === 'NotInstalled' ? (
                      <button
                        onClick={() => onInstall(app, 'native')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Installer</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold px-2 py-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Oppdatert</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
