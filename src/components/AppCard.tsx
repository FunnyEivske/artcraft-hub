import React, { useEffect, useRef, useState } from 'react';
import { Ellipsis, ScrollText, ExternalLink, Download, Trash2 } from 'lucide-react';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppTile } from './AppTile';

interface AppItemProps {
  app: AppReleaseInfo;
  onLaunchNative: (appId: string) => void;
  onLaunchWeb?: (app: AppReleaseInfo) => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  onUninstall?: (app: AppReleaseInfo) => void;
  progress?: DownloadProgressPayload;
}

const isActive = (p?: DownloadProgressPayload) =>
  !!p && p.percent < 100 && p.status !== 'error' && p.status !== 'completed';

/* ---------- small pieces ---------- */

const ProgressLine: React.FC<{ progress: DownloadProgressPayload }> = ({ progress }) => (
  <div className="mt-2">
    <div className="flex items-center justify-between text-[12px] text-ui-muted mb-1">
      <span className="truncate">{progress.message || 'Installerer...'}</span>
      <span className="tabular-nums">{Math.round(progress.percent)} %</span>
    </div>
    <div className="h-1 w-full rounded-full bg-[#3a3a3a] overflow-hidden">
      <div
        className="h-full bg-ui-blue rounded-full transition-[width] duration-200"
        style={{ width: `${progress.percent}%` }}
      />
    </div>
  </div>
);

const ReleaseNotes: React.FC<{ app: AppReleaseInfo }> = ({ app }) => (
  <div className="mt-3 rounded-md bg-ui-bg border border-ui-line p-3 text-[12.5px] leading-relaxed">
    <div className="font-semibold text-ui-text mb-1">
      {app.release_name || `Versjon ${app.latest_version}`}
    </div>
    <p className="text-ui-muted whitespace-pre-line">{app.release_notes || 'Ingen merknader for denne versjonen.'}</p>
  </div>
);

const AppMenu: React.FC<{
  app: AppReleaseInfo;
  onToggleNotes: () => void;
  notesOpen: boolean;
  onUninstall?: (app: AppReleaseInfo) => void;
}> = ({ app, onToggleNotes, notesOpen, onUninstall }) => {
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

  const item =
    'w-full flex items-center gap-2.5 px-3 h-8 text-[13px] text-left text-ui-text hover:bg-ui-hover';

  const repoUrl =
    app.app_id === 'blender'
      ? 'https://www.blender.org/download/releases/'
      : app.app_id === 'krita'
      ? 'https://krita.org/en/download/'
      : `https://github.com/storytold/${app.app_id}/releases`;

  return (
    <div className="relative" ref={ref}>
      <button className="icon-btn" title="Flere valg" onClick={() => setOpen((o) => !o)}>
        <Ellipsis className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-56 py-1 rounded-md bg-[#2f2f2f] border border-ui-border shadow-menu">
          <button className={item} onClick={() => { setOpen(false); onToggleNotes(); }}>
            <ScrollText className="w-4 h-4 text-ui-muted" />
            {notesOpen ? 'Skjul nyheter' : 'Nyheter i denne versjonen'}
          </button>
          <div className="my-1 border-t border-ui-border" />
          <a
            className={item}
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="w-4 h-4 text-ui-muted" />
            Offisiell nettside / utgivelser
          </a>

          {app.status !== 'NotInstalled' && onUninstall && (
            <>
              <div className="my-1 border-t border-ui-border" />
              <button
                className={`${item} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
                onClick={() => {
                  setOpen(false);
                  onUninstall(app);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                Avinstaller / Slett program
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- installed / update rows ---------- */

export const AppRow: React.FC<AppItemProps> = ({
  app,
  onLaunchNative,
  onInstall,
  onUninstall,
  progress,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const busy = isActive(progress);

  return (
    <div className="px-4 py-3 hover:bg-[#2f2f2f] transition-colors">
      <div className="flex items-center gap-4">
        <AppTile app={app} size={40} />

        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-ui-text">{app.app_name}</div>
          <div className="text-[13px] text-ui-muted truncate">{app.description}</div>
        </div>

        <div className="hidden md:block w-28 text-right text-[12px] text-ui-faint tabular-nums">
          {app.status === 'UpdateAvailable' ? (
            <span className="text-ui-blueText">Ny versjon {app.latest_version}</span>
          ) : (
            app.installed_version || app.latest_version
          )}
        </div>

        <div className="flex items-center gap-1.5 justify-end">
          <button className="btn-secondary" disabled={busy} onClick={() => onLaunchNative(app.app_id)}>
            Åpne
          </button>
          {app.status === 'UpdateAvailable' && (
            <button className="btn-primary" disabled={busy} onClick={() => onInstall(app, 'native')}>
              Oppdater
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
        <div className="pl-14 pr-[184px]">
          {busy && progress && <ProgressLine progress={progress} />}
          {notesOpen && <ReleaseNotes app={app} />}
        </div>
      )}
    </div>
  );
};

/* ---------- available (not installed) cards ---------- */

export const AppCard: React.FC<AppItemProps> = ({ app, onInstall, onUninstall, progress }) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const busy = isActive(progress);

  return (
    <div className="glass-card rounded-lg p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <AppTile app={app} size={48} />
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-[15px] font-semibold text-ui-text leading-tight">{app.app_name}</div>
          <div className="text-[12px] text-ui-faint mt-0.5">{app.category}</div>
        </div>
        <AppMenu
          app={app}
          notesOpen={notesOpen}
          onToggleNotes={() => setNotesOpen((v) => !v)}
          onUninstall={onUninstall}
        />
      </div>

      <p className="mt-3 text-[13px] leading-snug text-ui-muted flex-1">{app.description}</p>

      {notesOpen && <ReleaseNotes app={app} />}

      {busy && progress ? (
        <ProgressLine progress={progress} />
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <button className="btn-primary w-full justify-center flex items-center gap-1.5" onClick={() => onInstall(app, 'native')}>
            <Download className="w-3.5 h-3.5" />
            <span>Installer</span>
          </button>
        </div>
      )}
    </div>
  );
};