import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Clapperboard,
  Gamepad2,
  Folder,
  Layers,
} from 'lucide-react';
import { SmartProject, RecentProjectFile, AppReleaseInfo } from '../types';
import { RecentFilesGrid } from './RecentFilesGrid';
import { openPathInExplorer } from '../services/tauri';

interface ProjectsViewProps {
  projects: SmartProject[];
  allApps: AppReleaseInfo[];
  recentFiles: RecentProjectFile[];
  onCreateProject: (name: string, type: string, description: string, launchAfterAppId?: string) => void;
  onOpenFileInApp: (appId: string, filePath: string) => void;
  onRefreshRecent?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  isCreating: boolean;
  isRefreshingRecent?: boolean;
  onNavigateToSettings?: () => void;
}

const BLENDER_PRESETS = [
  {
    id: 'Blender 3D Modellering & Sculpt',
    name: '3D Modellering & Sculpting',
    icon: Box,
    desc: '3D-karakterer, hard-surface props, sculpting og retopologi',
    structure: [
      '01_References',
      '02_Textures_and_Materials',
      '03_HighPoly_Sculpt',
      '04_LowPoly_Retopo',
      '05_Renders',
      '06_Exports_FBX_OBJ',
    ],
  },
  {
    id: 'Blender 3D Animasjon & Rigg',
    name: '3D Animasjon & Rigg',
    icon: Clapperboard,
    desc: 'Karakter-rigging, keyframe-animasjon, storyboard og video',
    structure: [
      '01_Storyboards_and_References',
      '02_Characters_and_Rigs',
      '03_Animation_Caches',
      '04_Frames_and_Renders',
      '05_Audio_and_Voice',
      '06_Final_Video',
    ],
  },
  {
    id: 'Blender VFX & Simulering',
    name: 'VFX & Fysikksimulering',
    icon: Sparkles,
    desc: 'Væsker, røyk, partikkelmotor, cloth physics og compositing',
    structure: [
      '01_Footage_and_Plates',
      '02_Simulation_Cache_Physics',
      '03_Textures_and_Shaders',
      '04_Compositing_Nodes',
      '05_Renders',
    ],
  },
  {
    id: 'Blender Game Assets & Props',
    name: 'Game Assets & Spillprops',
    icon: Gamepad2,
    desc: 'PBR-baking, LODs, og eksport til Unreal Engine / Unity / Godot',
    structure: [
      '01_Concept_Art',
      '02_HighPoly',
      '03_LowPoly',
      '04_Baked_PBR_Maps',
      '05_Engine_Exports_GLTF_FBX',
    ],
  },
];

const ARTCRAFT_PRESETS = [
  {
    id: 'Brand Identity',
    name: 'Brand Identity & Logo',
    desc: 'Vektorlogo, fargepaletter, merkevarehåndbøker og grafikk',
    structure: [
      '01_References',
      '02_Vectors_and_Patterns',
      '03_Photos_and_Textures',
      '04_Audio_and_Video',
      '05_Exports',
    ],
  },
  {
    id: 'Digital Maling',
    name: 'Digital Maling & Illustrasjon',
    desc: 'Krita-malerier, skisser, penseloppsett og konseptkunst',
    structure: [
      '01_Skisser_og_Referanser',
      '02_Kra_Prosjektfiler',
      '03_Paletter_og_Brushes',
      '04_Eksporter_og_Trykk',
    ],
  },
  {
    id: 'Foto & Retusj',
    name: 'Foto & RAW-behandling',
    desc: 'RAW-fotografier, fargegradering og fotoretusjering',
    structure: [
      '01_References',
      '02_RAW_and_Originals',
      '03_Edits_and_Layers',
      '04_Exports_Web',
      '05_Print_Ready',
    ],
  },
  {
    id: 'Film & Motion',
    name: 'Film & Videoproduksjon',
    desc: 'Videoklipp, tidslinje, lyddesign og ferdige eksportfiler',
    structure: [
      '01_Raw_Footage',
      '02_Audio_and_Music',
      '03_Graphics_and_Titles',
      '04_Timeline_Edits',
      '05_Rendered_Videos',
    ],
  },
];

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
  onNavigateToSettings,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('Alle');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'blender' | 'artcraft'>('blender');

  // New project modal form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Blender 3D Modellering & Sculpt');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [launchAfterCreate, setLaunchAfterCreate] = useState(true);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleOpenCreateModal = (mode: 'blender' | 'artcraft') => {
    setModalMode(mode);
    if (mode === 'blender') {
      setNewProjectType('Blender 3D Modellering & Sculpt');
      setLaunchAfterCreate(true);
    } else {
      setNewProjectType('Brand Identity');
      setLaunchAfterCreate(false);
    }
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const launchApp = launchAfterCreate ? (newProjectType.toLowerCase().includes('blender') ? 'blender' : undefined) : undefined;
    onCreateProject(newProjectName.trim(), newProjectType, newProjectDesc.trim(), launchApp);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateModal(false);
  };

  const currentPresetStructure = useMemo(() => {
    const bPreset = BLENDER_PRESETS.find((p) => p.id === newProjectType);
    if (bPreset) return bPreset.structure;
    const aPreset = ARTCRAFT_PRESETS.find((p) => p.id === newProjectType);
    if (aPreset) return aPreset.structure;
    return ['01_References', '02_Textures', '03_Renders', '04_Exports'];
  }, [newProjectType]);

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

  // Dynamic folders from project structure and scanned files
  const folders = useMemo(() => {
    if (!activeProject) return ['Alle'];
    const structureFolders = activeProject.structure || [];
    const fileFolders = Array.from(new Set(activeProject.files.map((f) => f.folder)));
    const allUnique = Array.from(new Set([...structureFolders, ...fileFolders])).filter(Boolean);
    return ['Alle', ...allUnique];
  }, [activeProject]);

  const filteredFiles = activeProject
    ? activeProject.files.filter((f) => {
        if (selectedFolderFilter === 'Alle') return true;
        return f.folder === selectedFolderFilter;
      })
    : [];

  const isBlenderProject = activeProject?.project_type?.toLowerCase().includes('blender') || activeProject?.folder_path?.toLowerCase().includes('blender');

  return (
    <div className="space-y-6 max-w-[1080px]">
      {/* Top Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">Prosjekter & Filer</h1>
          <p className="text-[13px] text-ui-muted mt-1">
            Automatisk synkronisering med Blender, Krita og dine kreative prosjektmapper i <strong>Dokumenter/OpenArt</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dedicated New Blender Project button */}
          <button
            onClick={() => handleOpenCreateModal('blender')}
            className="h-9 px-3.5 rounded-md text-[13px] font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center gap-2 transition-colors"
            title="Opprett et dedikert Blender-prosjekt med ferdige mapper for 3D eller animasjon"
          >
            <Box className="w-4 h-4" />
            <span>Nytt Blender-prosjekt</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal('artcraft')}
            className="btn-primary h-9 px-3.5 text-[13px] flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nytt prosjekt</span>
          </button>
        </div>
      </div>

      {/* Live Recent Files from all apps */}
      {recentFiles.length > 0 && (
        <RecentFilesGrid
          files={recentFiles}
          allApps={allApps}
          projects={projects}
          onOpenFileInApp={onOpenFileInApp}
          onRefresh={onRefreshRecent}
          onOpenSettings={onNavigateToSettings}
          onShowToast={onShowToast}
          isRefreshing={isRefreshingRecent}
          title="Sist jobbet med på tvers av apper"
        />
      )}

      {/* Projects List & Explorer */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold tracking-tight text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-ui-blue" />
            <span>Dine Kreative Prosjekter</span>
          </h2>
          <span className="text-[12px] text-ui-faint font-mono">
            {projects.length} prosjekter registrert
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-ui-border bg-ui-panel p-8">
            <FolderOpen className="w-12 h-12 text-ui-blue/60 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Ingen prosjekter opprettet ennå</h3>
            <p className="text-xs text-ui-muted max-w-md mx-auto mb-5 leading-relaxed">
              Opprett et prosjekt for å få ferdige, strukturerte mapper for 3D-modellering, animasjon, teksturer, referanser og eksport.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleOpenCreateModal('blender')}
                className="h-9 px-4 rounded-md text-[13px] font-medium bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              >
                <Box className="w-4 h-4" />
                <span>Opprett Blender-prosjekt</span>
              </button>
              <button
                onClick={() => handleOpenCreateModal('artcraft')}
                className="btn-secondary h-9 px-4 text-[13px]"
              >
                Annet prosjekt
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Project List Sidebar */}
            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-ui-muted uppercase tracking-wider mb-2">
                Prosjektliste ({projects.length})
              </h3>
              <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isSelected = activeProject && activeProject.id === proj.id;
                  const isBlender = proj.project_type.toLowerCase().includes('blender') || proj.folder_path.toLowerCase().includes('blender');
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setSelectedFolderFilter('Alle');
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-ui-panel border-ui-blue text-white shadow-sm'
                          : 'bg-ui-panel/40 border-ui-border text-ui-muted hover:border-ui-line hover:text-ui-text'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {isBlender ? (
                            <Box className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-ui-blue flex-shrink-0" />
                          )}
                          <span className="font-semibold text-[13px] truncate text-white">
                            {proj.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ui-faint flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ui-faint">
                        <span className="truncate">{proj.project_type}</span>
                        <span>•</span>
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
                <div className="p-4 rounded-xl border border-ui-border bg-ui-panel space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {isBlenderProject && <Box className="w-4 h-4 text-orange-400" />}
                        <h2 className="text-[17px] font-bold text-white tracking-tight">
                          {activeProject.name}
                        </h2>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mt-1 ${
                        isBlenderProject
                          ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                          : 'bg-ui-blue/15 text-ui-blue border border-ui-blue/30'
                      }`}>
                        {activeProject.project_type}
                      </span>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openPathInExplorer(activeProject.folder_path)}
                        className="btn-secondary h-8 px-2.5 text-[11px] flex items-center gap-1.5"
                        title="Åpne mappen i Windows Utforsker / Finder"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-ui-blue" />
                        <span>Åpne i Utforsker</span>
                      </button>

                      {isBlenderProject && (
                        <button
                          onClick={() => onOpenFileInApp('blender', activeProject.folder_path)}
                          className="h-8 px-3 rounded-md text-[11px] font-medium bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                          title="Start Blender for dette prosjektet"
                        >
                          <Box className="w-3.5 h-3.5" />
                          <span>Åpne i Blender</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[12px] text-ui-muted leading-relaxed">
                    {activeProject.description || 'Ingen prosjektbeskrivelse lagt til.'}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-ui-faint pt-2.5 border-t border-ui-border/60">
                    <FolderOpen className="w-3.5 h-3.5 text-ui-muted flex-shrink-0" />
                    <span className="font-mono text-[11px] text-ui-muted truncate" title={activeProject.folder_path}>
                      {activeProject.folder_path}
                    </span>
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
                    <div className="p-8 text-center text-xs text-ui-muted space-y-2">
                      <p>Ingen filer i mappen «{selectedFolderFilter}» ennå.</p>
                      <p className="text-[11px] text-ui-faint">
                        Lagre en fil her fra Blender eller dra en fil inn for å se den i listen.
                      </p>
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
                              <p className="text-[11px] text-ui-faint truncate font-mono">
                                {file.relative_path} • {formatFileSize(file.size_bytes)}
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
                                  title={`Åpne ${file.name} i ${appMeta?.app_name || appId}`}
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

      {/* Create Project Modal with Presets */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-ui-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden relative text-ui-text flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-ui-line flex items-center justify-between bg-gradient-to-r from-ui-surface to-[#222226]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                  modalMode === 'blender'
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-ui-blue/20 text-ui-blue border-ui-blue/30'
                }`}>
                  {modalMode === 'blender' ? <Box className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {modalMode === 'blender' ? 'Nytt Blender 3D-Prosjekt' : 'Opprett Smart-Prosjekt'}
                  </h3>
                  <p className="text-xs text-ui-muted">
                    {modalMode === 'blender'
                      ? 'Oppretter strukturert Blender-prosjektmappe med mapper for 3D og animasjon.'
                      : 'Genererer automatisk standard mapper for dine kreative filer.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-ui-faint hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Mode Switch Tabs */}
            <div className="flex items-center border-b border-ui-line px-6 bg-ui-surface/40">
              <button
                type="button"
                onClick={() => {
                  setModalMode('blender');
                  setNewProjectType('Blender 3D Modellering & Sculpt');
                  setLaunchAfterCreate(true);
                }}
                className={`py-2.5 px-3 text-[12px] font-semibold border-b-2 flex items-center gap-2 transition-all ${
                  modalMode === 'blender'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-ui-muted hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Blender 3D Presets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalMode('artcraft');
                  setNewProjectType('Brand Identity');
                  setLaunchAfterCreate(false);
                }}
                className={`py-2.5 px-3 text-[12px] font-semibold border-b-2 flex items-center gap-2 transition-all ${
                  modalMode === 'artcraft'
                    ? 'border-ui-blue text-ui-blue'
                    : 'border-transparent text-ui-muted hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ArtCraft & 2D Presets</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  Prosjektnavn:
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalMode === 'blender' ? 'f.eks. Mech_Warrior_Character eller Cyber_City_VFX' : 'f.eks. Nordic_Merkevare_2026'}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-9 bg-ui-base border border-ui-border rounded-md px-3 text-[13px] text-white focus:outline-none focus:border-ui-blue"
                />
              </div>

              {/* Presets Selection */}
              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-2">
                  Velg prosjekttype:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(modalMode === 'blender' ? BLENDER_PRESETS : ARTCRAFT_PRESETS).map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => setNewProjectType(preset.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        newProjectType === preset.id
                          ? modalMode === 'blender'
                            ? 'bg-orange-500/10 border-orange-500/60 shadow-sm'
                            : 'bg-ui-blue/10 border-ui-blue/60 shadow-sm'
                          : 'bg-ui-surface/60 border-ui-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="font-semibold text-white text-[12px] block">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-ui-muted block mt-0.5 leading-snug">
                        {preset.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Folder Structure Visualizer */}
              <div className="p-3.5 rounded-lg bg-ui-base border border-ui-border/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-ui-faint font-semibold uppercase tracking-wider">
                  <span>Mappestruktur som opprettes:</span>
                  <span className="font-mono text-ui-muted">
                    {modalMode === 'blender' ? 'Dokumenter/OpenArt/Blender/Projects/' : 'Dokumenter/OpenArt/Projects/'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {currentPresetStructure.map((subfolder) => (
                    <div
                      key={subfolder}
                      className="flex items-center gap-1.5 text-[11px] text-ui-text bg-ui-surface px-2 py-1 rounded border border-ui-border font-mono truncate"
                      title={subfolder}
                    >
                      <Folder className="w-3 h-3 text-ui-blue flex-shrink-0" />
                      <span className="truncate">{subfolder}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ui-muted mb-1.5">
                  Beskrivelse (valgfritt):
                </label>
                <textarea
                  rows={2}
                  placeholder="Kort notat om prosjektets mål og innhold..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-ui-base border border-ui-border rounded-md p-2.5 text-[12px] text-white focus:outline-none focus:border-ui-blue resize-none"
                />
              </div>

              {/* Auto launch toggle */}
              {modalMode === 'blender' && (
                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-ui-surface border border-ui-border cursor-pointer hover:bg-ui-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={launchAfterCreate}
                    onChange={(e) => setLaunchAfterCreate(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                  />
                  <Box className="w-4 h-4 text-orange-400" />
                  <span className="text-[12px] text-white">
                    Start Blender automatisk etter at prosjektet er opprettet
                  </span>
                </label>
              )}

              {/* Modal Footer Actions */}
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
                  disabled={isCreating || !newProjectName.trim()}
                  className={`text-xs h-8 px-4 rounded-md font-medium text-white transition-colors flex items-center gap-1.5 ${
                    modalMode === 'blender'
                      ? 'bg-orange-500 hover:bg-orange-600 disabled:opacity-40'
                      : 'bg-ui-blue hover:bg-blue-600 disabled:opacity-40'
                  }`}
                >
                  {isCreating ? (
                    'Oppretter...'
                  ) : (
                    <>
                      {modalMode === 'blender' && <Box className="w-3.5 h-3.5" />}
                      <span>{modalMode === 'blender' ? 'Opprett Blender-prosjekt' : 'Opprett prosjekt'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};