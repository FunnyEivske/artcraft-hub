import React, { useEffect, useRef, useState } from 'react';
import { Ellipsis, ScrollText, ExternalLink, Download, Trash2, Play, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppTile } from './AppTile';

export interface AppItemProps {
  app: AppReleaseInfo;
  onLaunchNative: (appId: string) => void;
  onLaunchWeb?: (app: AppReleaseInfo) => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  onUninstall?: (app: AppReleaseInfo) => void;
  progress?: DownloadProgressPayload;
}

const isActive = (p?: DownloadProgressPayload) =>
  !!p && p.percent < 100 && p.status !== 'error' && p.status !== 'completed';

/* ---------- Progress Line ---------- */

const ProgressLine: React.FC<{ progress: DownloadProgressPayload }> = ({ progress }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-2 w-full">
      <div className="flex items-center justify-between text-xs text-ui-muted mb-1">
        <span className="truncate">{progress.message || t('common.installing')}</span>
        <span className="tabular-nums font-mono text-[11px]">{Math.round(progress.percent)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-ui-surface-2 overflow-hidden border border-ui-border">
        <div
          className="h-full bg-ui-accent rounded-full transition-all duration-200"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
};

/* ---------- Release Notes ---------- */

const ReleaseNotes: React.FC<{ app: AppReleaseInfo }> = ({ app }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-3 rounded-xl bg-ui-bg border border-ui-border p-3.5 text-xs leading-relaxed animate-in fade-in duration-150">
      <div className="font-medium text-ui-text mb-1">
        {app.release_name || `v${app.latest_version}`}
      </div>
      <p className="text-ui-muted whitespace-pre-line text-[11.5px]">
        {app.release_notes || t('updates.noNotes')}
      </p>
    </div>
  );
};

/* ---------- Context Menu ---------- */

const AppMenu: React.FC<{
  app: AppReleaseInfo;
  onToggleNotes: () => void;
  notesOpen: boolean;
  onUninstall?: (app: AppReleaseInfo) => void;
}> = ({ app, onToggleNotes, notesOpen, onUninstall }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const itemClass =
    'w-full flex items-center gap-2.5 px-3 h-8 text-xs text-left text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer';

  const repoUrl =
    app.app_id === 'blender'
      ? 'https://www.blender.org/download/releases/'
      : app.app_id === 'krita'
      ? 'https://krita.org/en/download/'
      : `https://github.com/storytold/${app.app_id}/releases`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-7 h-7 rounded-md flex items-center justify-center text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer"
        title="More actions"
        onClick={() => setOpen((o) => !o)}
      >
        <Ellipsis className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-52 py-1 rounded-xl bg-ui-surface border border-ui-border shadow-xl animate-in fade-in duration-100">
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              onToggleNotes();
            }}
          >
            <ScrollText className="w-3.5 h-3.5 text-ui-muted" />
            <span>{notesOpen ? t('updates.hideNotes') : t('updates.viewNotes')}</span>
          </button>
          <div className="my-1 border-t border-ui-border" />
          <a
            className={itemClass}
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="w-3.5 h-3.5 text-ui-muted" />
            <span>{t('apps.officialReleases')}</span>
          </a>

          {app.status !== 'NotInstalled' && onUninstall && (
            <>
              <div className="my-1 border-t border-ui-border" />
              <button
                type="button"
                className={`${itemClass} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
                onClick={() => {
                  setOpen(false);
                  onUninstall(app);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>{t('apps.uninstall')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Slim Row Component (Adobe CC Style) ---------- */

export const AppRow: React.FC<AppItemProps> = ({
  app,
  onLaunchNative,
  onInstall,
  onUninstall,
  progress,
}) => {
  const { t } = useTranslation();
  const [notesOpen, setNotesOpen] = useState(false);
  const busy = isActive(progress);
  const isInstalled = app.status !== 'NotInstalled';
  const hasUpdate = app.status === 'UpdateAvailable';

  return (
    <div className="px-3.5 py-2 hover:bg-ui-surface-2/40 transition-colors">
      <div className="flex items-center gap-3">
        <AppTile app={app} size={30} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-ui-text truncate">
              {app.app_name}
            </span>
            {app.alternative_to && (
              <span className="text-[10px] text-ui-muted bg-ui-surface-2 px-1.5 py-0.5 rounded border border-ui-border hidden sm:inline truncate">
                {t('apps.alternativeTo', { name: app.alternative_to })}
              </span>
            )}
            {hasUpdate && (
              <span className="text-[10px] font-medium text-ui-accent bg-ui-surface-2 px-1.5 py-0.5 rounded border border-ui-accent/40">
                v{app.latest_version}
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-ui-muted truncate mt-0.5">{app.description}</div>
        </div>

        {/* Version column */}
        <div className="hidden lg:block w-24 text-right text-xs text-ui-muted tabular-nums">
          {isInstalled ? (
            <span className="font-mono text-[11px] text-ui-muted">
              {app.installed_version || app.latest_version}
            </span>
          ) : (
            <span className="text-[11px] text-ui-muted">v{app.latest_version}</span>
          )}
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 justify-end">
          {busy ? (
            <div className="w-28">
              <ProgressLine progress={progress!} />
            </div>
          ) : isInstalled ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn-secondary text-xs h-7 px-3 rounded-md flex items-center gap-1 cursor-pointer"
                onClick={() => onLaunchNative(app.app_id)}
              >
                <Play className="w-3 h-3 fill-current text-ui-muted" />
                <span>{t('common.open')}</span>
              </button>
              {hasUpdate && (
                <button
                  type="button"
                  className="btn-primary text-xs h-7 px-3 rounded-md flex items-center gap-1 cursor-pointer"
                  onClick={() => onInstall(app, 'native')}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('common.update')}</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary text-xs h-7 px-3.5 rounded-md flex items-center gap-1.5 cursor-pointer"
              onClick={() => onInstall(app, 'native')}
            >
              <Download className="w-3 h-3" />
              <span>{t('common.install')}</span>
            </button>
          )}

          <AppMenu
            app={app}
            notesOpen={notesOpen}
            onToggleNotes={() => setNotesOpen((v) => !v)}
            onUninstall={onUninstall}
          />
        </div>
      </div>

      {(busy || notesOpen) && (
        <div className="pl-12 pr-12">
          {notesOpen && <ReleaseNotes app={app} />}
        </div>
      )}
    </div>
  );
};

/* ---------- Compact Card Component ---------- */

export const AppCard: React.FC<AppItemProps> = ({
  app,
  onLaunchNative,
  onInstall,
  onUninstall,
  progress,
}) => {
  const { t } = useTranslation();
  const [notesOpen, setNotesOpen] = useState(false);
  const busy = isActive(progress);
  const isInstalled = app.status !== 'NotInstalled';
  const hasUpdate = app.status === 'UpdateAvailable';

  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface hover:border-ui-border-strong p-4 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 shadow-sm">
      <div>
        <div className="flex items-start gap-3">
          <AppTile app={app} size={42} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ui-text leading-tight truncate">
              {app.app_name}
            </div>
            <div className="text-[11px] text-ui-muted mt-0.5 truncate">{app.category}</div>
          </div>
          <AppMenu
            app={app}
            notesOpen={notesOpen}
            onToggleNotes={() => setNotesOpen((v) => !v)}
            onUninstall={onUninstall}
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ui-muted line-clamp-2">
          {app.description}
        </p>

        {notesOpen && <ReleaseNotes app={app} />}
      </div>

      <div className="mt-4 pt-3 border-t border-ui-border">
        {busy && progress ? (
          <ProgressLine progress={progress} />
        ) : isInstalled ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary w-full h-8 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => onLaunchNative(app.app_id)}
            >
              <Play className="w-3 h-3 fill-current text-ui-muted" />
              <span>{t('common.open')}</span>
            </button>
            {hasUpdate && (
              <button
                type="button"
                className="btn-primary w-full h-8 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => onInstall(app, 'native')}
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t('common.update')}</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary w-full h-8 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            onClick={() => onInstall(app, 'native')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('common.install')}</span>
          </button>
        )}
      </div>
    </div>
  );
};