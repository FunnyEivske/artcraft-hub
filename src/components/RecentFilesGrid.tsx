import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileImage,
  FileCode,
  FileVideo,
  FileAudio,
  Box,
  Palette,
  FolderInput,
  MoreVertical,
  Clock,
  Folder,
  X,
  RefreshCw,
  Settings,
  FolderOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RecentProjectFile, SmartProject, AppReleaseInfo } from '../types';
import { getFileThumbnail, importFileToProject, openPathInExplorer } from '../services/tauri';
import { AppTile } from './AppTile';

interface RecentFilesGridProps {
  files: RecentProjectFile[];
  allApps: AppReleaseInfo[];
  projects: SmartProject[];
  onOpenFileInApp: (appId: string, filePath: string) => void;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  maxItems?: number;
  title?: string;
  isRefreshing?: boolean;
}

export function getMediaTypeInfo(ext: string): { key: string; label: string } {
  const e = ext.toLowerCase().trim();
  if (['.blend', '.fbx', '.obj', '.gltf', '.glb', '.stl', '.step', '.stp', '.dae', '.3ds', '.dxf', '.dwg'].includes(e)) {
    return { key: 'threeD', label: '3D' };
  }
  if (['.kra', '.ora', '.clip', '.krz'].includes(e)) {
    return { key: 'painting', label: 'Painting' };
  }
  if (['.svg', '.eps', '.ai', '.fig'].includes(e)) {
    return { key: 'vector', label: 'Vector' };
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.psd', '.raw', '.dng', '.cr2', '.cr3', '.nef', '.arw', '.tiff', '.tif', '.bmp', '.exr', '.hdr'].includes(e)) {
    return { key: 'image', label: 'Image' };
  }
  if (['.mp4', '.mov', '.mkv', '.webm', '.avi', '.flv'].includes(e)) {
    return { key: 'video', label: 'Video' };
  }
  if (['.wav', '.mp3', '.flac', '.ogg', '.aac', '.m4a', '.aiff'].includes(e)) {
    return { key: 'audio', label: 'Audio' };
  }
  if (['.pdf', '.epub', '.docx', '.doc', '.txt', '.md', '.rtf', '.pptx', '.xlsx', '.csv', '.odt'].includes(e)) {
    return { key: 'document', label: 'Document' };
  }
  return { key: 'unknown', label: ext.replace('.', '').toUpperCase() || 'File' };
}

export const RecentFilesGrid: React.FC<RecentFilesGridProps> = ({
  files,
  allApps,
  projects,
  onOpenFileInApp,
  onRefresh,
  onOpenSettings,
  onShowToast,
  maxItems,
  title,
  isRefreshing = false,
}) => {
  const { t } = useTranslation();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [activeMenuFile, setActiveMenuFile] = useState<string | null>(null);
  const [importTargetFile, setImportTargetFile] = useState<RecentProjectFile | null>(null);

  // Import modal state
  const [targetProjectName, setTargetProjectName] = useState<string>(
    projects.length > 0 ? projects[0].name : ''
  );
  const [targetSubfolder, setTargetSubfolder] = useState<string>('01_References');
  const [copyOnly, setCopyOnly] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  useEffect(() => {
    if (projects.length > 0 && !targetProjectName) {
      setTargetProjectName(projects[0].name);
    }
  }, [projects, targetProjectName]);

  // Load thumbnails
  useEffect(() => {
    let isCancelled = false;

    const loadThumbnails = async () => {
      for (const file of files) {
        if (file.has_thumbnail && !thumbnails[file.file_path]) {
          try {
            const dataUrl = await getFileThumbnail(file.file_path);
            if (!isCancelled && dataUrl) {
              setThumbnails((prev) => ({ ...prev, [file.file_path]: dataUrl }));
            }
          } catch {
            // ignore
          }
        }
      }
    };

    loadThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFallbackIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp', '.psd', '.kra', '.raw', '.dng'].includes(e)) {
      return <FileImage className="w-8 h-8 text-ui-muted opacity-70" />;
    }
    if (['.svg', '.eps', '.ai'].includes(e)) {
      return <Palette className="w-8 h-8 text-ui-muted opacity-70" />;
    }
    if (['.blend', '.fbx', '.obj', '.gltf', '.glb', '.stl', '.dxf', '.dwg'].includes(e)) {
      return <Box className="w-8 h-8 text-ui-muted opacity-70" />;
    }
    if (['.mp4', '.mov', '.mkv', '.webm'].includes(e)) {
      return <FileVideo className="w-8 h-8 text-ui-muted opacity-70" />;
    }
    if (['.wav', '.mp3', '.flac', '.ogg'].includes(e)) {
      return <FileAudio className="w-8 h-8 text-ui-muted opacity-70" />;
    }
    if (['.json', '.toml', '.xml', '.yaml'].includes(e)) {
      return <FileCode className="w-8 h-8 text-ui-muted opacity-70" />;
    }
    return <FileText className="w-8 h-8 text-ui-muted opacity-70" />;
  };

  // Filter out hub internal files and screenshots
  const isScreenshot = (f: RecentProjectFile): boolean => {
    const path = f.file_path.toLowerCase();
    const name = f.file_name.toLowerCase();
    const folder = f.folder.toLowerCase();
    return (
      folder.includes('screenshots') ||
      folder.includes('skjermbilder') ||
      folder.includes('captures') ||
      path.includes('screenshot') ||
      path.includes('skjermbilde') ||
      name.startsWith('screenshot') ||
      name.startsWith('skjermbilde') ||
      name.startsWith('prtscr')
    );
  };

  const isOpenArtHubInternalFile = (f: RecentProjectFile): boolean => {
    const path = f.file_path.toLowerCase();
    const folder = f.folder.toLowerCase();
    const name = f.file_name.toLowerCase();
    return (
      path.includes('artcraft-hub') ||
      path.includes('openart-hub') ||
      folder === 'public' ||
      name === 'app-icon.svg' ||
      name === 'logo.svg'
    );
  };

  const cleanFiles = files.filter((f) => !isScreenshot(f) && !isOpenArtHubInternalFile(f));

  // Category filter
  const filtered = cleanFiles.filter((f) => {
    if (filterType === 'all') return true;
    const media = getMediaTypeInfo(f.extension);
    return media.key === filterType;
  });

  const displayList = maxItems ? filtered.slice(0, maxItems) : filtered;

  if (cleanFiles.length === 0) {
    return null;
  }

  // Handle opening file: click anywhere on card
  const handleCardClick = (file: RecentProjectFile) => {
    // If recommended app is installed, open with it; otherwise check other installed compatible apps, or fallback to default
    const recApp = allApps.find((a) => a.app_id === file.recommended_app);
    if (recApp && recApp.status !== 'NotInstalled') {
      onOpenFileInApp(recApp.app_id, file.file_path);
      return;
    }

    const installedCompat = file.compatible_apps.find((id) => {
      const a = allApps.find((item) => item.app_id === id);
      return a && a.status !== 'NotInstalled';
    });

    if (installedCompat) {
      onOpenFileInApp(installedCompat, file.file_path);
    } else {
      // Open with default system app
      onOpenFileInApp(file.recommended_app || 'default', file.file_path);
    }
  };

  const handleOpenFolder = (e: React.MouseEvent, folderPath: string) => {
    e.stopPropagation();
    openPathInExplorer(folderPath);
  };

  const handleOpenImportModal = (e: React.MouseEvent, file: RecentProjectFile) => {
    e.stopPropagation();
    setActiveMenuFile(null);
    setImportTargetFile(file);
    if (projects.length > 0 && !targetProjectName) {
      setTargetProjectName(projects[0].name);
    }
  };

  const handleConfirmImport = async () => {
    if (!importTargetFile || !targetProjectName) return;
    setIsImporting(true);
    try {
      const res = await importFileToProject(
        importTargetFile.file_path,
        targetProjectName,
        targetSubfolder,
        copyOnly
      );
      if (onShowToast) {
        onShowToast(res, 'success');
      }
      setImportTargetFile(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Kunne ikke importere fil: ${err}`, 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="mb-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-ui-text">
              {title || t('home.recentFilesTitle')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ui-surface-2 text-ui-muted border border-ui-border">
              {cleanFiles.length}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 text-ui-muted hover:text-ui-text rounded-md transition-colors cursor-pointer"
                title={t('updates.check')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-ui-accent' : ''}`} />
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1 text-ui-muted hover:text-ui-text rounded-md transition-colors cursor-pointer"
                title={t('nav.settings')}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-ui-muted mt-0.5">
            {t('home.recentFilesSubtitle')}
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'all', labelKey: 'home.filterAll', fallback: 'All' },
            { id: 'threeD', labelKey: 'mediaTypes.threeD', fallback: '3D' },
            { id: 'painting', labelKey: 'mediaTypes.painting', fallback: 'Painting' },
            { id: 'image', labelKey: 'mediaTypes.image', fallback: 'Images' },
            { id: 'vector', labelKey: 'mediaTypes.vector', fallback: 'Vector' },
            { id: 'video', labelKey: 'mediaTypes.video', fallback: 'Video' },
            { id: 'audio', labelKey: 'mediaTypes.audio', fallback: 'Audio' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterType === pill.id
                  ? 'bg-ui-surface-2 text-ui-text border border-ui-border-strong font-medium shadow-none'
                  : 'bg-transparent text-ui-muted hover:text-ui-text hover:bg-ui-surface-2/60 border border-transparent'
              }`}
            >
              {t(pill.labelKey) || pill.fallback}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of recent file cards */}
      <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {displayList.map((file) => {
          const thumb = thumbnails[file.file_path];
          const media = getMediaTypeInfo(file.extension);
          const mediaLabel = t(`mediaTypes.${media.key}`) || media.label;

          const recApp = allApps.find((a) => a.app_id === file.recommended_app);
          const isRecAppInstalled = recApp && recApp.status !== 'NotInstalled';

          const isMenuOpen = activeMenuFile === file.file_path;

          return (
            <div
              key={file.file_path}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(file)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(file);
                }
              }}
              className="group rounded-xl border border-ui-border bg-ui-surface hover:border-ui-border-strong transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col overflow-hidden relative cursor-pointer text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-ui-accent"
            >
              {/* Thumbnail Container (16:9 fixed aspect ratio) */}
              <div className="w-full aspect-video bg-ui-bg flex items-center justify-center relative overflow-hidden border-b border-ui-border">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={file.file_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                    {getFallbackIcon(file.extension)}
                    <span className="text-[10px] font-mono uppercase text-ui-muted font-medium">
                      {file.extension}
                    </span>
                  </div>
                )}

                {/* Real Media Type Badge (NO hardcoded "DOKUMENTER"!) */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-ui-border bg-ui-surface/90 text-ui-text backdrop-blur-sm">
                    {mediaLabel}
                  </span>
                </div>

                {/* File size badge */}
                <div className="absolute top-2 right-2 bg-ui-surface/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] text-ui-muted font-mono border border-ui-border pointer-events-none">
                  {formatFileSize(file.size_bytes)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    className="text-xs font-semibold text-ui-text truncate mb-1 group-hover:text-ui-accent transition-colors"
                    title={file.file_name}
                  >
                    {file.file_name}
                  </h3>

                  <div className="flex items-center gap-1 text-[11px] text-ui-muted mb-1 truncate">
                    <Folder className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title={file.file_path}>
                      {file.folder}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-ui-muted font-mono mb-2">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{file.last_modified_str}</span>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-2 border-t border-ui-border flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {recApp && <AppTile app={recApp} size={16} />}
                    <span className="text-[11px] text-ui-muted truncate font-medium">
                      {isRecAppInstalled
                        ? t('home.openIn', { app: recApp.app_name })
                        : t('home.openDefault')}
                    </span>
                  </div>

                  {/* Context menu for extra actions */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuFile(isMenuOpen ? null : file.file_path);
                      }}
                      className="p-1 rounded-md text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer"
                      title="More actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Popover Dropdown */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-ui-surface border border-ui-border shadow-xl py-1 z-40 animate-in fade-in duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleOpenFolder(e, file.folder)}
                          className="w-full h-8 px-3 flex items-center gap-2 text-xs text-ui-text hover:bg-ui-surface-2 transition-colors text-left cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-ui-muted" />
                          <span>{t('home.openFolder')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenImportModal(e, file)}
                          className="w-full h-8 px-3 flex items-center gap-2 text-xs text-ui-text hover:bg-ui-surface-2 transition-colors text-left cursor-pointer"
                        >
                          <FolderInput className="w-3.5 h-3.5 text-ui-muted" />
                          <span>{t('home.addToProject')}</span>
                        </button>

                        {file.compatible_apps.length > 1 && (
                          <>
                            <div className="border-t border-ui-border my-1" />
                            <div className="px-3 py-1 text-[10px] font-medium text-ui-muted uppercase tracking-wider">
                              Open in
                            </div>
                            {file.compatible_apps.map((appId) => {
                              const otherApp = allApps.find((a) => a.app_id === appId);
                              return (
                                <button
                                  key={appId}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuFile(null);
                                    onOpenFileInApp(appId, file.file_path);
                                  }}
                                  className="w-full h-7 px-3 flex items-center gap-2 text-xs text-ui-text hover:bg-ui-surface-2 transition-colors text-left cursor-pointer"
                                >
                                  {otherApp && <AppTile app={otherApp} size={14} />}
                                  <span className="truncate">
                                    {otherApp ? otherApp.app_name : appId}
                                  </span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Import to Project Modal */}
      {importTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ui-surface border border-ui-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-ui-border mb-4">
              <h3 className="text-sm font-semibold text-ui-text">
                {t('home.addToProject')}
              </h3>
              <button
                type="button"
                onClick={() => setImportTargetFile(null)}
                className="p-1 rounded-md text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-ui-muted block mb-1">Target Project</label>
                <select
                  value={targetProjectName}
                  onChange={(e) => setTargetProjectName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-ui-border bg-ui-bg text-ui-text focus:outline-none focus:border-ui-accent"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-ui-muted block mb-1">Subfolder</label>
                <select
                  value={targetSubfolder}
                  onChange={(e) => setTargetSubfolder(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-ui-border bg-ui-bg text-ui-text focus:outline-none focus:border-ui-accent"
                >
                  <option value="01_References">01_References</option>
                  <option value="02_Vectors_and_Patterns">02_Vectors_and_Patterns</option>
                  <option value="03_Photos_and_Textures">03_Photos_and_Textures</option>
                  <option value="04_Audio_and_Video">04_Audio_and_Video</option>
                  <option value="05_Exports">05_Exports</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={copyOnly}
                  onChange={(e) => setCopyOnly(e.target.checked)}
                  className="rounded border-ui-border text-ui-accent focus:ring-0"
                />
                <span className="text-ui-text">Copy file (leave original in place)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-ui-border">
              <button
                type="button"
                onClick={() => setImportTargetFile(null)}
                className="btn-quiet text-xs px-3 py-1.5 rounded-lg cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isImporting || !targetProjectName}
                onClick={handleConfirmImport}
                className="btn-primary text-xs px-4 py-1.5 rounded-lg cursor-pointer"
              >
                {isImporting ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};