import React, { useState } from 'react';
import {
  Image,
  PenTool,
  Film,
  Sliders,
  FileText,
  Sparkles,
  LayoutTemplate,
  Layout,
  Volume2,
  Play,
  Globe,
  Download,
  CheckCircle2,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';

interface AppCardProps {
  app: AppReleaseInfo;
  onLaunchNative: (appId: string) => void;
  onLaunchWeb: (app: AppReleaseInfo) => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  progress?: DownloadProgressPayload;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onLaunchNative,
  onLaunchWeb,
  onInstall,
  progress,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  const renderIcon = () => {
    const props = { className: 'w-6 h-6', style: { color: app.color_accent } };
    switch (app.icon_name) {
      case 'Image':
        return <Image {...props} />;
      case 'PenTool':
        return <PenTool {...props} />;
      case 'Film':
        return <Film {...props} />;
      case 'Sliders':
        return <Sliders {...props} />;
      case 'FileText':
        return <FileText {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'LayoutTemplate':
        return <LayoutTemplate {...props} />;
      case 'Figma':
        return <Layout {...props} />;
      case 'Volume2':
        return <Volume2 {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  const isDownloading = progress && progress.percent < 100 && progress.status !== 'error';

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Ambient Glow using app's accent color */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: app.color_accent }}
      />

      <div>
        {/* Top Header: Icon + Category + Status */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center p-2 border border-white/10 shadow-inner"
              style={{ backgroundColor: `${app.color_accent}15` }}
            >
              {renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {app.app_name}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                  {app.installed_version || app.latest_version}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                {app.category} • <span className="text-slate-300">{app.alternative_to}</span>-alternativ
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {app.status === 'Installed' && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>Installert</span>
            </span>
          )}
          {app.status === 'UpdateAvailable' && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
              <ArrowUpCircle className="w-3 h-3" />
              <span>Ny versjon</span>
            </span>
          )}
          {app.status === 'NotInstalled' && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-800/60 border border-white/5 px-2 py-0.5 rounded-full">
              Ikke installert
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300/90 leading-relaxed mb-3">
          {app.description}
        </p>

        {/* Supported File Formats */}
        <div className="flex items-center flex-wrap gap-1 mb-4">
          <span className="text-[10px] font-semibold uppercase text-slate-500 mr-1">Filer:</span>
          {app.file_types.map((ext) => (
            <span
              key={ext}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#101622] text-slate-300 border border-white/5"
            >
              {ext}
            </span>
          ))}
        </div>

        {/* Download Progress Bar if active */}
        {isDownloading && (
          <div className="mb-4 bg-[#101724] border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-sky-400 font-medium">{progress.message}</span>
              <span className="font-mono text-slate-300 font-bold">{Math.round(progress.percent)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Release Notes Accordion */}
        <div className="mb-4">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Endringslogg & GitHub release ({app.latest_version})</span>
            {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showNotes && (
            <div className="mt-2 p-2.5 rounded-lg bg-[#0f1522] border border-white/5 text-[11px] text-slate-300 font-mono leading-relaxed">
              <p className="font-semibold text-slate-200 mb-1">{app.release_name}</p>
              <p className="text-slate-400 whitespace-pre-line">{app.release_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Åpne App (Native) */}
          <button
            onClick={() => onLaunchNative(app.app_id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-semibold text-white border border-white/10 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
            <span>Åpne Native</span>
          </button>

          {/* Kjør i Hub (WebAssembly) */}
          <button
            onClick={() => onLaunchWeb(app)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 text-xs font-semibold text-indigo-300 border border-indigo-500/20 transition-all shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kjør i Hub</span>
          </button>
        </div>

        {/* Primary Install/Update Button */}
        {app.status === 'NotInstalled' && (
          <button
            onClick={() => onInstall(app, 'native')}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 active:scale-98 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer App ({app.latest_version})</span>
          </button>
        )}

        {app.status === 'UpdateAvailable' && (
          <button
            onClick={() => onInstall(app, 'native')}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-98 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Oppdater til {app.latest_version}</span>
          </button>
        )}

        {app.status === 'Installed' && (
          <button
            onClick={() => onInstall(app, 'web')}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-all"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>Synkroniser WebAssembly-pakke</span>
          </button>
        )}
      </div>
    </div>
  );
};
