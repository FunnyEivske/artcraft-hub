import React, { useState } from 'react';
import {
  FolderKanban,
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
  Calendar,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { SmartProject, ProjectFileInfo } from '../types';

interface ProjectsViewProps {
  projects: SmartProject[];
  onCreateProject: (name: string, type: string, description: string) => void;
  onOpenFileInApp: (appId: string, filePath: string) => void;
  isCreating: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onCreateProject,
  onOpenFileInApp,
  isCreating,
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
    switch (ext) {
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
      case '.psd':
      case '.raw':
      case '.cr2':
        return <FileImage className="w-4 h-4 text-sky-400" />;
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
    <div className="space-y-6">
      {/* Top Header with Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <span>Smart-Prosjekter & Cross-App Pipeline</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automatisert filstruktur og direkte "Send til..."-ruting mellom alle 9 studioer
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nytt Smart-Prosjekt</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl p-8 border border-white/5">
          <FolderOpen className="w-12 h-12 text-indigo-400/60 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-1">Ingen prosjekter opprettet ennå</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Opprett ditt første Smart-Prosjekt for å få ferdigoppsatte mapper for referanser, vektorer, foto, video og eksporter.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30"
          >
            Opprett Prosjekt
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Projects List */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Dine Prosjekter ({projects.length})
            </h3>
            <div className="space-y-1.5">
              {projects.map((proj) => {
                const isSelected = activeProject && activeProject.id === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setSelectedFolderFilter('Alle');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-sm'
                        : 'bg-[#131b28]/60 hover:bg-[#1a2334] border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate max-w-[170px]">{proj.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{proj.project_type}</span>
                      <span className="font-mono">{proj.files.length} filer</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Project Details & Files Pipeline */}
          <div className="lg:col-span-3 space-y-5">
            {activeProject && (
              <>
                {/* Active Project Header Card */}
                <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-extrabold text-white">{activeProject.name}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {activeProject.project_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{activeProject.description || 'Ingen beskrivelse angitt'}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeProject.created_at.replace('timestamp-', 'ID: ')}</span>
                    </div>
                  </div>

                  {/* Recommended apps pipeline */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Anbefalt pipeline:</span>
                    </span>
                    {activeProject.recommended_apps.map((appId) => (
                      <span
                        key={appId}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 capitalize"
                      >
                        {appId}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subfolder Filter Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {folders.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFolderFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                        selectedFolderFilter === f
                          ? 'bg-slate-200 text-slate-900 font-bold'
                          : 'bg-[#141b27] text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {f === 'Alle' ? 'Alle mapper' : f.replace(/^\d+_/, '')}
                    </button>
                  ))}
                </div>

                {/* Files Table / Pipeline Router */}
                <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-3.5 bg-[#0f1420] border-b border-white/5 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Prosjektfil & Undermappe</span>
                    <span>Cross-App Pipeline ("Åpne i...")</span>
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Ingen filer funnet i denne mappen.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {filteredFiles.map((file: ProjectFileInfo) => (
                        <div
                          key={file.relative_path}
                          className="p-3.5 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          {/* File metadata */}
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                              {getFileIcon(file.extension)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white">{file.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {formatFileSize(file.size_bytes)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {file.relative_path}
                              </p>
                            </div>
                          </div>

                          {/* Compatible Apps "Åpne i..." Launch Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-500 font-medium mr-1">
                              Send til:
                            </span>
                            {file.compatible_apps.map((appId) => (
                              <button
                                key={appId}
                                onClick={() => onOpenFileInApp(appId, file.absolute_path)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 active:scale-95 border border-indigo-500/20 text-xs font-medium text-indigo-300 transition-all"
                                title={`Åpne ${file.name} direkte i ${appId}`}
                              >
                                <ExternalLink className="w-3 h-3 text-indigo-400" />
                                <span className="capitalize">{appId}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create Smart Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Opprett Nytt Smart-Prosjekt</h3>
                <p className="text-xs text-slate-400">Oppretter standardisert 5-mappers struktur automatisk</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prosjektnavn</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Sommerkampanje_2026"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111722] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prosjekttype</label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111722] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Brand Identity">Brand Identity (Logo, Vektor & Typografi)</option>
                  <option value="Foto & Retusj">Foto & Retusj (RAW, Maskering & Farge)</option>
                  <option value="Film & Motion">Film & Motion (Videoredigering & VFX)</option>
                  <option value="Publisering & PDF">Publisering & PDF (Magasin & Dokumenter)</option>
                  <option value="UI/UX & Web">UI/UX & Web (Prototyper & Grensesnitt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Beskrivelse</label>
                <textarea
                  rows={3}
                  placeholder="Kort beskrivelse av prosjektmål og ressurskrav..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111722] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Folder blueprint badge */}
              <div className="p-3 rounded-xl bg-[#0e141f] border border-white/5 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>Struktur som opprettes:</span>
                </span>
                <p className="font-mono text-[10px] text-slate-500">
                  01_References / 02_Vectors_and_Patterns / 03_Photos_and_Textures / 04_Audio_and_Video / 05_Exports
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Oppretter...' : 'Opprett Prosjekt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
