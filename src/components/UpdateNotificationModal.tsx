import React from 'react';
import { ArrowDownCircle, Clock, X, Sparkles, ShieldCheck, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppTile } from './AppTile';

interface UpdateNotificationModalProps {
  app: AppReleaseInfo;
  onUpdateNow: (app: AppReleaseInfo) => void;
  onLater: (app: AppReleaseInfo) => void;
  progress?: DownloadProgressPayload;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  app,
  onUpdateNow,
  onLater,
  progress,
}) => {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb' || i18n.language?.startsWith('no');
  const isDownloading = progress && progress.percent < 100 && progress.status !== 'error' && progress.status !== 'completed';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d26] border border-ui-border rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close / Later Button */}
        <button
          onClick={() => onLater(app)}
          className="absolute top-4 right-4 text-ui-faint hover:text-white p-1 rounded-md transition-colors"
          title={isNorwegian ? 'Lukk / spør senere' : 'Close / ask later'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Tile and Sparkle */}
        <div className="flex items-start gap-4 mb-5">
          <AppTile app={app} size={54} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ui-blue/20 text-ui-blue border border-ui-blue/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isNorwegian ? 'Ny versjon tilgjengelig' : 'New Version Available'}
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-white tracking-tight">
              {isNorwegian ? `Oppdatering for ${app.app_name}` : `Update for ${app.app_name}`}
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-ui-muted mt-0.5">
              <span>
                {isNorwegian ? 'Installert: ' : 'Installed: '}
                <strong className="text-slate-300 font-mono">
                  {app.installed_version || (isNorwegian ? 'Tidligere versjon' : 'Previous version')}
                </strong>
              </span>
              <span>→</span>
              <span className="text-emerald-400 font-semibold font-mono">
                {isNorwegian ? 'Ny: ' : 'New: '}
                {app.latest_version}
              </span>
            </div>
          </div>
        </div>

        {/* Release Notes / Update Log Box */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ui-faint uppercase tracking-wider mb-1.5">
            <span>{isNorwegian ? 'Hva er nytt i denne versjonen' : "What's new in this version"}</span>
            <span className="font-normal font-mono lowercase">{app.release_name}</span>
          </div>
          <div className="rounded-xl border border-ui-border bg-[#10131b] p-4 text-[12.5px] leading-relaxed text-slate-300 max-h-48 overflow-y-auto whitespace-pre-line font-sans">
            {app.release_notes ||
              (isNorwegian
                ? 'Feilrettinger, stabilitetsforbedringer og optimaliseringer for din plattform.'
                : 'Bug fixes, stability improvements, and optimizations for your platform.')}
          </div>
        </div>

        {/* Voluntary guarantee banner */}
        <div className="rounded-lg bg-ui-bg/70 border border-ui-border/60 p-3 mb-5 flex items-start gap-2.5 text-[11.5px] text-ui-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>{isNorwegian ? 'Helt valgfritt:' : 'Completely optional:'}</strong>{' '}
            {isNorwegian
              ? 'Du blir aldri tvunget til å oppdatere. Du kan fortsette å bruke din nåværende versjon så lenge du vil.'
              : 'You are never forced to update. You can continue using your current version for as long as you like.'}
          </span>
        </div>

        {/* Download Progress Bar if updating */}
        {isDownloading && (
          <div className="mb-5 p-3 rounded-lg bg-ui-panel border border-ui-blue/40">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-ui-blue font-medium flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 animate-bounce" />
                {isNorwegian ? 'Laster ned og installerer...' : 'Downloading and installing...'}
              </span>
              <span className="font-mono text-ui-muted">{progress.percent.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-ui-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-ui-blue transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-ui-line">
          <button
            onClick={() => onLater(app)}
            disabled={isDownloading}
            className="h-9 px-4 rounded-md text-[13px] font-medium text-ui-muted hover:text-white hover:bg-ui-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('common.later') || (isNorwegian ? 'Senere' : 'Later')}</span>
          </button>

          <button
            onClick={() => onUpdateNow(app)}
            disabled={isDownloading}
            className="btn-primary h-9 px-5 text-[13px] font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>
              {isDownloading
                ? (isNorwegian ? 'Laster ned...' : 'Downloading...')
                : (isNorwegian
                    ? `Oppdater ${app.app_name} nå`
                    : `Update ${app.app_name} Now`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
