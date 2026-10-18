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
  ChevronDown,
  Clock,
  Folder,
  X,
  Sparkles,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { RecentProjectFile, SmartProject, AppReleaseInfo } from '../types';
import { getFileThumbnail, importFileToProject } from '../services/tauri';
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

export const RecentFilesGrid: React.FC<RecentFilesGridProps> = ({
  files,
  allApps,
  projects,
  onOpenFileInApp,
  onRefresh,
  onOpenSettings,
  onShowToast,
  maxItems,
  title = 'Sist jobbet med (Live fra alle apper)',
  isRefreshing = false,
}) => {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<string>('Alle');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [importTargetFile, setImportTargetFile] = useState<RecentProjectFile | null>(null);

  // Import modal state
  const [targetProjectName, setTargetProjectName] = useState<string>(
    projects.length > 0 ? projects[0].name : ''
  );
  const [targetSubfolder, setTargetSubfolder] = useState<string>('01_References');
  const [copyOnly, setCopyOnly] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Update target project if projects list changes
  useEffect(() => {
    if (projects.length > 0 && !targetProjectName) {
      setTargetProjectName(projects[0].name);
    }
  }, [projects, targetProjectName]);

  // Pre-fetch thumbnails for visible files with thumbnail support
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
            // Non-critical: file without thumbnail
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

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'blender':
        return { label: 'Blender', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'krita':
        return { label: 'Krita', bg: 'bg-sky-500/20 text-sky-400 border-sky-500/30' };
      case 'projects':
        return { label: 'Smart-Prosjekt', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'pictures':
        return { label: 'Bilder', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'documents':
        return { label: 'Dokumenter', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'desktop':
        return { label: 'Skrivebord', bg: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
      case 'downloads':
        return { label: 'Nedlastinger', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'custom':
        return { label: 'Overvåket mappe', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30' };
      default:
        return { label: 'Kreativ fil', bg: 'bg-slate-700/40 text-slate-300 border-slate-600/30' };
    }
  };

  const getDefaultSubfolderForExt = (ext: string): string => {
    const e = ext.toLowerCase();
    if (['.svg', '.eps', '.ai'].includes(e)) return '02_Vectors_and_Patterns';
    if (['.png', '.jpg', '.jpeg', '.webp', '.kra', '.ora', '.psd', '.raw', '.dng'].includes(e)) {
      return '03_Photos_and_Textures';
    }
    if (['.mp4', '.mov', '.mkv', '.webm', '.wav', '.mp3', '.flac'].includes(e)) {
      return '04_Audio_and_Video';
    }
    if (['.blend', '.fbx', '.obj', '.gltf', '.glb', '.stl'].includes(e)) {
      return '03_Photos_and_Textures';
    }
    if (['.pdf', '.epub'].includes(e)) return '05_Exports';
    return '01_References';
  };

  const handleOpenImportModal = (file: RecentProjectFile) => {
    setImportTargetFile(file);
    setTargetSubfolder(getDefaultSubfolderForExt(file.extension));
    if (projects.length > 0 && !targetProjectName) {
      setTargetProjectName(projects[0].name);
    }
    setOpenDropdownId(null);
  };

  const handleConfirmImport = async () => {
    if (!importTargetFile || !targetProjectName) return;
    setIsImporting(true);
    try {
      const msg = await importFileToProject(
        importTargetFile.file_path,
        targetProjectName,
        targetSubfolder,
        copyOnly
      );
      if (onShowToast) onShowToast(msg, 'success');
      setImportTargetFile(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (onShowToast) onShowToast('Kunne ikke importere: ' + err, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const getFallbackIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (['.blend', '.fbx', '.obj', '.gltf', '.glb', '.stl'].includes(e)) {
      return <Box className="w-10 h-10 text-orange-400" />;
    }
    if (['.kra', '.ora'].includes(e)) {
      return <Palette className="w-10 h-10 text-sky-400" />;
    }
    if (['.svg', '.eps', '.ai'].includes(e)) {
      return <FileCode className="w-10 h-10 text-amber-400" />;
    }
    if (['.png', '.jpg', '.jpeg', '.webp', '.psd'].includes(e)) {
      return <FileImage className="w-10 h-10 text-cyan-400" />;
    }
    if (['.mp4', '.mov', '.mkv', '.webm'].includes(e)) {
      return <FileVideo className="w-10 h-10 text-pink-400" />;
    }
    if (['.wav', '.mp3', '.flac', '.ogg'].includes(e)) {
      return <FileAudio className="w-10 h-10 text-indigo-400" />;
    }
    return <FileText className="w-10 h-10 text-slate-400" />;
  };

  // Filter files
  const filtered = files.filter((f) => {
    if (filterType === 'Alle') return true;
    if (filterType === '3D / Blender') return ['.blend', '.fbx', '.obj', '.gltf', '.glb', '.stl'].includes(f.extension.toLowerCase());
    if (filterType === 'Krita / Maling') return ['.kra', '.ora'].includes(f.extension.toLowerCase());
    if (filterType === 'Vektor') return ['.svg', '.eps', '.ai'].includes(f.extension.toLowerCase());
    if (filterType === 'Bilder') return ['.png', '.jpg', '.jpeg', '.webp', '.psd'].includes(f.extension.toLowerCase());
    if (filterType === 'Video/Lyd') return ['.mp4', '.mov', '.mkv', '.wav', '.mp3', '.flac'].includes(f.extension.toLowerCase());
    return true;
  });

  const displayList = maxItems ? filtered.slice(0, maxItems) : filtered;

  if (files.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ui-blue animate-pulse" />
            <h2 className="text-[14px] font-bold tracking-tight text-white">{title}</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ui-blue/15 text-ui-blue border border-ui-blue/30">
              {files.length} funnet
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 text-ui-faint hover:text-white rounded transition-colors"
                title="Søk etter kreative filer på nytt"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1 text-ui-faint hover:text-white rounded transition-colors"
                title="Mappe- og søkeinnstillinger"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[12px] text-ui-muted mt-0.5">
            Sist brukte kreative filer fra Blender, Krita, ArtCraft-prosjekter og overvåkede mapper – med forhåndsvisning.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['Alle', '3D / Blender', 'Krita / Maling', 'Vektor', 'Bilder'].map((pill) => (
            <button
              key={pill}
              onClick={() => setFilterType(pill)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                filterType === pill
                  ? 'bg-ui-blue text-white shadow-sm'
                  : 'bg-ui-panel text-ui-muted hover:text-ui-text hover:bg-ui-hover border border-ui-border'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of recent file cards */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {displayList.map((file) => {
          const thumb = thumbnails[file.file_path];
          const badge = getSourceBadge(file.source_app);
          const recApp = allApps.find((a) => a.app_id === file.recommended_app) || {
            app_id: file.recommended_app,
            app_name: file.recommended_app.charAt(0).toUpperCase() + file.recommended_app.slice(1),
            color_accent: '#38bdf8',
          };

          const isDropdownOpen = openDropdownId === file.file_path;

          return (
            <div
              key={file.file_path}
              className="group rounded-xl border border-ui-border bg-ui-panel hover:border-ui-blue/60 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col overflow-hidden relative"
            >
              {/* Thumbnail Container */}
              <div className="w-full h-32 bg-[#0c0f16] flex items-center justify-center relative overflow-hidden border-b border-ui-border/60">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={file.file_name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                    {getFallbackIcon(file.extension)}
                    <span className="text-[10px] font-bold tracking-wider uppercase text-ui-faint font-mono">
                      {file.extension}
                    </span>
                  </div>
                )}

                {/* Source Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md uppercase tracking-wider ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* File size badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono border border-white/10">
                  {formatFileSize(file.size_bytes)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* File Name & Path */}
                  <h3
                    className="text-[12px] font-semibold text-white truncate mb-1 group-hover:text-ui-blue transition-colors"
                    title={file.file_name}
                  >
                    {file.file_name}
                  </h3>

                  <div className="flex items-center gap-1 text-[11px] text-ui-faint mb-1.5 truncate">
                    <Folder className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate" title={file.file_path}>
                      {file.folder}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-ui-faint font-mono mb-2.5">
                    <Clock className="w-3 h-3 flex-shrink-0 text-slate-500" />
                    <span>{file.last_modified_str}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-ui-border/60 space-y-1.5">
                  {/* Primary Action Button: Fortsett i [App] */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenFileInApp(file.recommended_app, file.file_path)}
                      className="flex-1 h-7 px-2 rounded-md bg-ui-blue hover:bg-blue-600 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      title={`Ã…pne i ${recApp.app_name}`}
                    >
                      <AppTile app={recApp} size={16} />
                      <span className="truncate">Fortsett i {recApp.app_name}</span>
                    </button>

                    {/* Secondary menu: Send til... */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : file.file_path)}
                        className="h-7 w-7 rounded-md bg-ui-hover hover:bg-[#333] text-ui-muted hover:text-white border border-ui-border flex items-center justify-center transition-colors"
                        title="Send til annet program eller prosjekt"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Popover */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-52 rounded-lg bg-[#181a20] border border-ui-border shadow-2xl py-1.5 z-40">
                          <div className="px-3 py-1 text-[10px] font-bold text-ui-faint uppercase tracking-wider border-b border-ui-border/50 mb-1">
                            Ã…pne i annet program
                          </div>

                          {file.compatible_apps
                            .filter((appId) => appId !== file.recommended_app)
                            .map((appId) => {
                              const otherApp = allApps.find((a) => a.app_id === appId) || {
                                app_id: appId,
                                app_name: appId.charAt(0).toUpperCase() + appId.slice(1),
                                color_accent: '#a855f7',
                              };
                              return (
                                <button
                                  key={appId}
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onOpenFileInApp(appId, file.file_path);
                                  }}
                                  className="w-full h-8 px-3 flex items-center gap-2 text-[12px] text-ui-text hover:bg-ui-hover hover:text-white transition-colors text-left"
                                >
                                  <AppTile app={otherApp} size={16} />
                                  <span className="truncate">{otherApp.app_name}</span>
                                </button>
                              );
                            })}

                          <div className="border-t border-ui-border/50 my-1" />

                          {/* Move to project button */}
                          <button
                            onClick={() => handleOpenImportModal(file)}
                            className="w-full h-8 px-3 flex items-center gap-2 text-[12px] text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left font-medium"
                          >
                            <FolderInput className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">Flytt til ArtCraft-prosjekt...</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick file into project shortcut if outside projects */}
                  {file.source_app !== 'projects' && (
                    <button
                      onClick={() => handleOpenImportModal(file)}
                      className="w-full py-0.5 text-[10px] text-ui-faint hover:text-emerald-400 flex items-center justify-center gap-1 transition-colors"
                    >
                      <FolderInput className="w-3 h-3" />
                      <span>Legg inn i prosjekt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Import to Project Modal */}
      {importTargetFile && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ui-panel border border-ui-border rounded-xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setImportTargetFile(null)}
              className="absolute top-4 right-4 text-ui-faint hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <FolderInput className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Flytt eller kopier til prosjekt</h3>
                <p className="text-xs text-ui-muted truncate max-w-[280px]">
                  {importTargetFile.file_name}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {/* Target Project selection */}
              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  Velg ArtCraft Smart-Prosjekt:
                </label>
                {projects.length > 0 ? (
                  <select
                    value={targetProjectName}
                    onChange={(e) => setTargetProjectName(e.target.value)}
                    className="w-full h-9 bg-[#1b1b1b] border border-ui-border rounded-md px-3 text-[13px] text-white focus:outline-none focus:border-ui-blue"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.project_type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                    Du har ingen prosjekter ennÃ¥. Opprett et prosjekt under Â«ProsjekterÂ» fÃ¸rst.
                  </p>
                )}
              </div>

              {/* Target Subfolder selection */}
              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  MÃ¥lmappe i prosjektet:
                </label>
                <select
                  value={targetSubfolder}
                  onChange={(e) => setTargetSubfolder(e.target.value)}
                  className="w-full h-9 bg-[#1b1b1b] border border-ui-border rounded-md px-3 text-[13px] text-white focus:outline-none focus:border-ui-blue"
                >
                  <option value="01_References">01_References (notater og skisser)</option>
                  <option value="02_Vectors_and_Patterns">02_Vectors_and_Patterns (.svg, .ai, ikoner)</option>
                  <option value="03_Photos_and_Textures">03_Photos_and_Textures (.blend, .kra, .png, 3D, textures)</option>
                  <option value="04_Audio_and_Video">04_Audio_and_Video (.mp4, .wav, kilder)</option>
                  <option value="05_Exports">05_Exports (ferdigstilte eksportfiler)</option>
                </select>
              </div>

              {/* Copy vs Move Toggle */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-ui-text">
                  <input
                    type="radio"
                    name="moveType"
                    checked={!copyOnly}
                    onChange={() => setCopyOnly(false)}
                    className="accent-ui-blue"
                  />
                  <span>Flytt fil (anbefalt â€“ rydder opp)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-ui-text">
                  <input
                    type="radio"
                    name="moveType"
                    checked={copyOnly}
                    onChange={() => setCopyOnly(true)}
                    className="accent-ui-blue"
                  />
                  <span>Kopier (behold original)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ui-border">
                <button
                  type="button"
                  onClick={() => setImportTargetFile(null)}
                  className="btn-secondary text-xs h-8 px-3"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  disabled={!targetProjectName || isImporting || projects.length === 0}
                  onClick={handleConfirmImport}
                  className="btn-primary text-xs h-8 px-4 bg-emerald-600 hover:bg-emerald-500"
                >
                  {isImporting ? 'Behandler...' : copyOnly ? 'Kopier til prosjekt' : 'Flytt til prosjekt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};