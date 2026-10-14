import React, { useState } from 'react';
import {
  FolderPlus,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  X,
  Box,
  Palette,
} from 'lucide-react';
import { SmartProject, RecentProjectFile, AppReleaseInfo } from '../types';
import { RecentFilesGrid } from './RecentFilesGrid';

interface ProjectsViewProps {
  projects: SmartProject[];
  allApps: AppReleaseInfo[];
  recentFiles: RecentProjectFile[];
  onCreateProject: (name: string, type: string, description: string) => void;
  onOpenFileInApp: (appId: string, filePath: string) => void;
  onRefreshRecent?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  isCreating: boolean;
  isRefreshingRecent?: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  allApps,
  recentFiles,
  onCreateProject,
  onOpenFileInApp,
  onRefreshRecent,
  onShowToast,
  isCreating,
  isRefreshingRecent,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('Alle');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New project modal form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Brand Identity');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectType, newProjectDesc.trim());
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateModal(false);
  };

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    switch (e) {
      case '.blend':
      case '.fbx':
      case '.obj':
      case '.stl':
      case '.glb':
      case '.gltf':
        return <Box className="w-4 h-4 text-orange-400" />;
      case '.kra':
      case '.ora':
        return <Palette className="w-4 h-4 text-sky-400" />;
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
      case '.psd':
      case '.raw':
      case '.cr2':
        return <FileImage className="w-4 h-4 text-cyan-400" />;
      case '.svg':
      case '.eps':
      case '.ai':
        return <FileCode className="w-4 h-4 text-amber-400" />;
      case '.mp4':
      case '.mov':
      case '.mkv':
        return <FileVideo className="w-4 h-4 text-pink-400" />;
      case '.wav':
      case '.mp3':
      case '.flac':
      case '.ogg':
        return <FileAudio className="w-4 h-4 text-indigo-400" />;
      case '.pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const folders = [
    'Alle',
    '01_References',
    '02_Vectors_and_Patterns',
    '03_Photos_and_Textures',
    '04_Audio_and_Video',
    '05_Exports',
  ];

  const filteredFiles = activeProject
    ? activeProject.files.filter((f) => {
        if (selectedFolderFilter === 'Alle') return true;
        return f.folder === selectedFolderFilter;
      })
    : [];

  return (
    <div className="space-y-6 max-w-[1080px]">
      {/* Top Header with Action */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Prosjekter & Filer</h1>
          <p className="text-[13px] text-ui-muted mt-1">
            Automatisk synkronisering med Blender, Krita og alle dine kreative prosjektmapper.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nytt prosjekt</span>
        </button>
      </div>

      {/* Live Recent Files from all apps */}
      {recentFiles.length > 0 && (
        <RecentFilesGrid
          files={recentFiles}
          allApps={allApps}
          projects={projects}
          onOpenFileInApp={onOpenFileInApp}
          onRefresh={onRefreshRecent}
          onShowToast={onShowToast}
          isRefreshing={isRefreshingRecent}
          title="Sist jobbet med pÃ¥ tvers av apper"
        />
      )}

      {/* Projects List & Explorer */}
      <div>
        <h2 className="text-[14px] font-bold tracking-tight text-white mb-3">
          Dine Smart-Prosjekter
        </h2>

        {projects.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-ui-border bg-ui-panel p-8">
            <FolderOpen className="w-12 h-12 text-ui-blue/60 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Ingen prosjekter opprettet ennÃ¥</h3>
            <p className="text-xs text-ui-muted max-w-md mx-auto mb-5">
              Opprett et prosjekt for Ã¥ fÃ¥ ferdige mapper for referanser, vektorer, foto/3D, video og eksporter.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Opprett prosjekt
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Project List Sidebar */}
            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-ui-muted uppercase tracking-wider mb-2">
                Prosjektliste ({projects.length})
              </h3>
              <div className="space-y-1.5">
                {projects.map((proj) => {
                  const isSelected = activeProject && activeProject.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-ui-panel border-ui-blue text-white shadow-sm'
                          : 'bg-ui-panel/40 border-ui-border text-ui-muted hover:border-ui-line hover:text-ui-text'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[13px] truncate text-white">
                          {proj.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-ui-faint flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ui-faint">
                        <span>{proj.project_type}</span>
                        <span>â€¢</span>
                        <span>{proj.files.length} filer</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Project Details & File Explorer */}
            {activeProject && (
              <div className="lg:col-span-2 space-y-4">
                {/* Project Header Card */}
                <div className="p-4 rounded-xl border border-ui-border bg-ui-panel">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-[16px] font-bold text-white mb-0.5">
                        {activeProject.name}
                      </h2>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-ui-blue/15 text-ui-blue border border-ui-blue/30">
                        {activeProject.project_type}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-ui-muted mb-3">
                    {activeProject.description || 'Ingen prosjektbeskrivelse lagt til.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-ui-faint pt-2 border-t border-ui-border/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate" title={activeProject.folder_path}>
                        {activeProject.folder_path}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subfolder Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {folders.map((folder) => {
                    const count =
                      folder === 'Alle'
                        ? activeProject.files.length
                        : activeProject.files.filter((f) => f.folder === folder).length;
                    return (
                      <button
                        key={folder}
                        onClick={() => setSelectedFolderFilter(folder)}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                          selectedFolderFilter === folder
                            ? 'bg-ui-blue text-white shadow-sm'
                            : 'bg-ui-panel text-ui-muted hover:text-white border border-ui-border'
                        }`}
                      >
                        <span>{folder}</span>
                        <span className="opacity-70 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* File List */}
                <div className="rounded-xl border border-ui-border bg-ui-panel overflow-hidden">
                  {filteredFiles.length === 0 ? (
                    <div className="p-8 text-center text-xs text-ui-muted">
                      Ingen filer i mappen Â«{selectedFolderFilter}Â» ennÃ¥.
                    </div>
                  ) : (
                    <div className="divide-y divide-ui-line">
                      {filteredFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-ui-hover transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-md bg-ui-bg border border-ui-border flex-shrink-0">
                              {getFileIcon(file.extension)}
                            </div>
                            <div className="min-w-0">
                              <h4
                                className="text-[13px] font-semibold text-white truncate"
                                title={file.name}
                              >
                                {file.name}
                              </h4>
                              <p className="text-[11px] text-ui-faint truncate">
                                {file.relative_path} â€¢ {formatFileSize(file.size_bytes)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {file.compatible_apps.slice(0, 2).map((appId) => {
                              const appMeta = allApps.find((a) => a.app_id === appId);
                              return (
                                <button
                                  key={appId}
                                  onClick={() => onOpenFileInApp(appId, file.absolute_path)}
                                  className="h-7 px-2.5 rounded text-[11px] font-medium bg-ui-bg hover:bg-ui-hover border border-ui-border text-ui-text hover:text-white flex items-center gap-1 transition-colors"
                                  title={`Ã…pne ${file.name} i ${appMeta?.app_name || appId}`}
                                >
                                  <ExternalLink className="w-3 h-3 text-ui-blue" />
                                  <span>{appMeta?.app_name || appId}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ui-panel border border-ui-border rounded-xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-ui-faint hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-ui-blue/20 text-ui-blue border border-ui-blue/30 flex items-center justify-center flex-shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Opprett Smart-Prosjekt</h3>
                <p className="text-xs text-ui-muted">
                  Genererer automatisk standard mapper for alle dine kreative filer.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  Prosjektnavn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Nordic_Merkevare_2026"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-9 bg-[#1b1b1b] border border-ui-border rounded-md px-3 text-[13px] text-white focus:outline-none focus:border-ui-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  Prosjekttype:
                </label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full h-9 bg-[#1b1b1b] border border-ui-border rounded-md px-3 text-[13px] text-white focus:outline-none focus:border-ui-blue"
                >
                  <option value="Brand Identity">Brand Identity (Logo, fonter, farger)</option>
                  <option value="3D & Animasjon">3D & Animasjon (Blender, VFX, render)</option>
                  <option value="Digital Maling">Digital Maling (Krita, illustrasjon)</option>
                  <option value="Magasin & BÃ¸ker">Magasin & BÃ¸ker (DesignCraft, layout)</option>
                  <option value="Videoproduksjon">Videoproduksjon (FilmCraft, 4K video)</option>
                  <option value="UI/UX Prototyping">UI/UX Prototyping (FigCraft, web/app)</option>
                  <option value="Musikk & Podcast">Musikk & Podcast (SoundCraft, lyd)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  Beskrivelse (valgfritt):
                </label>
                <textarea
                  rows={3}
                  placeholder="Kort notat om prosjektets mÃ¥l og innhold..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#1b1b1b] border border-ui-border rounded-md p-3 text-[13px] text-white focus:outline-none focus:border-ui-blue resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ui-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs h-8 px-3"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary text-xs h-8 px-4"
                >
                  {isCreating ? 'Oppretter...' : 'Opprett prosjekt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};