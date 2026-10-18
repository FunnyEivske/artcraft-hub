import React, { useState, useEffect } from 'react';
import {
  Settings,
  Folder,
  FolderPlus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Image,
  FileText,
  Monitor,
  Download,
  Box,
  Palette,
  Layers,
  Info,
  ExternalLink,
  Music,
  Type,
  RotateCcw,
  Check,
  Camera,
} from 'lucide-react';
import { ScannerSettings, CreativeFolderConfig } from '../types';
import {
  getScannerSettings,
  saveScannerSettings,
  pickCustomFolder,
  pickCustomFile,
  openPathInExplorer,
  initOrUpdateWorkspaceFolders,
  DEFAULT_WORKSPACE_FOLDERS,
} from '../services/tauri';

interface SettingsViewProps {
  onSettingsChanged?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  isScanning?: boolean;
  onRerunOnboarding?: () => void;
  onShowChangelog?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSettingsChanged,
  onShowToast,
  isScanning = false,
  onRerunOnboarding,
  onShowChangelog,
}) => {
  const [settings, setSettings] = useState<ScannerSettings>({
    scanBlender: true,
    scanKrita: true,
    scanArtcraftProjects: true,
    scanPictures: true,
    scanDocuments: true,
    scanDesktop: false,
    scanDownloads: false,
    customFolders: [],
    filterNoise: true,
    ignoreScreenshots: true,
    customBlenderPath: null,
    customKritaPath: null,
    customProjectsPath: null,
    onboardingCompleted: true,
    openartWorkspacePath: null,
    workspaceFolders: DEFAULT_WORKSPACE_FOLDERS,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [customInputPath, setCustomInputPath] = useState('');

  // Load existing settings on mount
  useEffect(() => {
    getScannerSettings()
      .then((loaded) => {
        setSettings({
          ...loaded,
          workspaceFolders:
            loaded.workspaceFolders && loaded.workspaceFolders.length > 0
              ? loaded.workspaceFolders
              : DEFAULT_WORKSPACE_FOLDERS,
        });
      })
      .catch((err) => {
        console.error('Feil ved lasting av innstillinger:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleUpdateSetting = async <K extends keyof ScannerSettings>(
    key: K,
    val: ScannerSettings[K]
  ) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    setIsSaving(true);
    try {
      await saveScannerSettings(updated);
      if (onSettingsChanged) {
        onSettingsChanged();
      }
    } catch (e) {
      if (onShowToast) onShowToast('Kunne ikke lagre: ' + e, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWorkspaceFolder = async (folderName: string) => {
    const updatedList = (settings.workspaceFolders || DEFAULT_WORKSPACE_FOLDERS).map((item) =>
      item.folderName === folderName ? { ...item, enabled: !item.enabled } : item
    );
    await handleUpdateSetting('workspaceFolders', updatedList);
  };

  const handleCreateWorkspaceNow = async () => {
    setIsCreatingWorkspace(true);
    try {
      const createdPath = await initOrUpdateWorkspaceFolders(settings);
      if (onShowToast) {
        onShowToast(`Kreative mapper ble synkronisert i ${createdPath}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast('Feil under opprettelse av mapper: ' + e, 'error');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleOpenWorkspaceInExplorer = async () => {
    const target = settings.openartWorkspacePath || 'Documents/OpenArt';
    try {
      await openPathInExplorer(target);
    } catch (e) {
      if (onShowToast) onShowToast('Kunne ikke åpne filutforsker: ' + e, 'error');
    }
  };

  const handlePickFolder = async () => {
    try {
      const selected = await pickCustomFolder();
      if (selected) {
        if (settings.customFolders.includes(selected)) {
          if (onShowToast) onShowToast('Mappen er allerede lagt til', 'info');
          return;
        }
        const updatedFolders = [...settings.customFolders, selected];
        await handleUpdateSetting('customFolders', updatedFolders);
        if (onShowToast) onShowToast(`La til overvåket mappe: ${selected}`, 'success');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Kunne ikke velge mappe: ' + err, 'error');
    }
  };

  const handlePickCustomBlender = async () => {
    try {
      const selected = await pickCustomFile();
      if (selected) {
        await handleUpdateSetting('customBlenderPath', selected);
        if (onShowToast) onShowToast(`Blender-sti satt: ${selected}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast('Kunne ikke velge Blender-fil: ' + e, 'error');
    }
  };

  const handlePickCustomKrita = async () => {
    try {
      const selected = await pickCustomFile();
      if (selected) {
        await handleUpdateSetting('customKritaPath', selected);
        if (onShowToast) onShowToast(`Krita-sti satt: ${selected}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast('Kunne ikke velge Krita-fil: ' + e, 'error');
    }
  };

  const handlePickCustomProjects = async () => {
    try {
      const selected = await pickCustomFolder();
      if (selected) {
        await handleUpdateSetting('customProjectsPath', selected);
        if (onShowToast) onShowToast(`Prosjektmappe satt: ${selected}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast('Kunne ikke velge prosjektmappe: ' + e, 'error');
    }
  };

  const handleAddManualFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInputPath.trim();
    if (!trimmed) return;

    if (settings.customFolders.includes(trimmed)) {
      if (onShowToast) onShowToast('Mappen er allerede i listen', 'info');
      return;
    }

    const updatedFolders = [...settings.customFolders, trimmed];
    await handleUpdateSetting('customFolders', updatedFolders);
    setCustomInputPath('');
    if (onShowToast) onShowToast(`La til mappe: ${trimmed}`, 'success');
  };

  const handleRemoveFolder = async (folderPath: string) => {
    const updatedFolders = settings.customFolders.filter((f) => f !== folderPath);
    await handleUpdateSetting('customFolders', updatedFolders);
    if (onShowToast) onShowToast('Fjernet overvåket mappe', 'info');
  };

  const handleResetOnboarding = async () => {
    try {
      localStorage.removeItem('artcraft_onboarding_completed');
      const updated: ScannerSettings = {
        ...settings,
        onboardingCompleted: false,
      };
      await saveScannerSettings(updated);
      setSettings(updated);
      if (onShowToast) {
        onShowToast('Førstegangsoppsett er nullstilt! Åpner veiviseren...', 'info');
      }
      if (onRerunOnboarding) {
        onRerunOnboarding();
      }
    } catch (err) {
      console.error('Feil ved nullstilling av oppsett:', err);
    }
  };

  const getFolderIcon = (name: string) => {
    switch (name) {
      case 'Blender':
      case 'Blender_Assets':
        return <Box className="w-4 h-4 text-orange-400" />;
      case 'Textures':
        return <Image className="w-4 h-4 text-emerald-400" />;
      case 'Brushes':
        return <Palette className="w-4 h-4 text-sky-400" />;
      case 'References':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'Projects':
        return <Folder className="w-4 h-4 text-blue-400" />;
      case 'Audio_and_SFX':
        return <Music className="w-4 h-4 text-pink-400" />;
      case 'Fonts_and_Vectors':
        return <Type className="w-4 h-4 text-amber-400" />;
      default:
        return <FolderPlus className="w-4 h-4 text-ui-blue" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-ui-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-line">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ui-blue/15 text-ui-blue flex items-center justify-center border border-ui-blue/30">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Innstillinger & Filsøking</h1>
          </div>
          <p className="text-[13px] text-ui-muted mt-1">
            Styr mapper, Blender- og Krita-ressurser og automatisk støyfiltrering på tvers av Windows, macOS og Linux.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-[12px] text-ui-faint flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Lagrer...
            </span>
          )}
          <button
            onClick={() => onSettingsChanged && onSettingsChanged()}
            disabled={isScanning}
            className="btn-primary text-[12px] py-1.5 px-3 flex items-center gap-2"
            title="Kjør ny skanning med gjeldende innstillinger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Søker...' : 'Oppdater filsøk'}</span>
          </button>
        </div>
      </div>

      {/* 1. OpenArt Arbeidsområde & Kreative Asset-mapper (Blender, Teksturer, etc.) */}
      <section className="space-y-4 p-4 rounded-xl bg-ui-surface border border-ui-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-orange-400" />
              <h2 className="text-[15px] font-semibold text-white">
                Kreativt Arbeidsområde (Dokumenter / OpenArt)
              </h2>
            </div>
            <p className="text-[12px] text-ui-muted mt-0.5">
              Når du bruker Blender, Krita eller ArtCraft Hub, oppretter programmet standardmapper for Blender-assets, teksturer, børster og referanser.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetOnboarding}
              className="btn-primary py-1.5 px-3.5 text-[12px] flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-900/25 rounded-lg transition-all"
              title="Kjør førstegangsoppsett og velkomst-skjerm på nytt"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart / Redo Onboarding</span>
            </button>
            {onShowChangelog && (
              <button
                onClick={onShowChangelog}
                className="btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5 text-emerald-400 hover:text-white border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                title="Se alt som er nytt siden v1.0.0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hva er nytt (Logg)</span>
              </button>
            )}
            <button
              onClick={handleOpenWorkspaceInExplorer}
              className="btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5"
              title="Åpne mappen i systemets filutforsker"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Åpne i Filutforsker</span>
            </button>
            <button
              onClick={handleCreateWorkspaceNow}
              disabled={isCreatingWorkspace}
              className="btn-primary py-1.5 px-3 text-[12px] flex items-center gap-1.5"
              title="Opprett eller oppdater mappene på disken nå"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCreatingWorkspace ? 'animate-spin' : ''}`} />
              <span>{isCreatingWorkspace ? 'Oppretter...' : 'Synkroniser mapper'}</span>
            </button>
          </div>
        </div>

        {/* Workspace folder checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {(settings.workspaceFolders || DEFAULT_WORKSPACE_FOLDERS).map((folder: CreativeFolderConfig) => (
            <div
              key={folder.folderName}
              onClick={() => handleToggleWorkspaceFolder(folder.folderName)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                folder.enabled
                  ? 'bg-ui-base/80 border-ui-blue/40 shadow-sm'
                  : 'bg-ui-base/30 border-ui-border opacity-50 hover:opacity-80'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">{getFolderIcon(folder.folderName)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[12px] truncate">
                    {folder.name}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                      folder.enabled ? 'bg-ui-blue text-white' : 'border border-ui-faint'
                    }`}
                  >
                    {folder.enabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-[10px] text-ui-faint font-mono block mt-0.5">
                  OpenArt/{folder.folderName}
                </span>
                <p className="text-[11px] text-ui-muted mt-1 line-clamp-2 leading-tight">
                  {folder.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Egendefinerte app- og prosjektstier */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-ui-blue" />
            Konfigurerbare App- og Prosjektstier
          </h2>
          <p className="text-[12px] text-ui-muted">
            Som standard finner Hub-en Blender og Krita sine logger automatisk. Hvis du bruker portable versjoner eller egendefinerte mapper, kan du overstyre stiene her.
          </p>
        </div>

        <div className="space-y-3">
          {/* Blender custom path */}
          <div className="p-3.5 rounded-lg bg-ui-surface border border-ui-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-400" />
                <span className="text-[13px] font-medium text-white">Blender Sti / Historikk</span>
              </div>
              {settings.customBlenderPath && (
                <button
                  onClick={() => handleUpdateSetting('customBlenderPath', null)}
                  className="text-[11px] text-ui-faint hover:text-white flex items-center gap-1"
                  title="Gå tilbake til automatisk oppdagelse"
                >
                  <RotateCcw className="w-3 h-3" />
                  Bruk auto-oppdagelse
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.customBlenderPath || ''}
                placeholder="Automatisk oppdaget (f.eks. %APPDATA%\Blender Foundation\Blender\...\recent-files.txt)"
                onChange={(e) => handleUpdateSetting('customBlenderPath', e.target.value || null)}
                className="flex-1 h-8 bg-ui-base border border-ui-border rounded px-2.5 text-[12px] text-ui-text placeholder-ui-faint focus:outline-none focus:border-ui-blue font-mono"
              />
              <button
                onClick={handlePickCustomBlender}
                className="btn-secondary h-8 px-2.5 text-[11px] flex items-center gap-1.5 flex-shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5 text-orange-400" />
                <span>Velg fil...</span>
              </button>
            </div>
          </div>

          {/* Krita custom path */}
          <div className="p-3.5 rounded-lg bg-ui-surface border border-ui-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                <span className="text-[13px] font-medium text-white">Krita Sti / Historikk (kritarc)</span>
              </div>
              {settings.customKritaPath && (
                <button
                  onClick={() => handleUpdateSetting('customKritaPath', null)}
                  className="text-[11px] text-ui-faint hover:text-white flex items-center gap-1"
                  title="Gå tilbake til automatisk oppdagelse"
                >
                  <RotateCcw className="w-3 h-3" />
                  Bruk auto-oppdagelse
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.customKritaPath || ''}
                placeholder="Automatisk oppdaget (f.eks. %LOCALAPPDATA%\kritarc eller ~/.config/kritarc)"
                onChange={(e) => handleUpdateSetting('customKritaPath', e.target.value || null)}
                className="flex-1 h-8 bg-ui-base border border-ui-border rounded px-2.5 text-[12px] text-ui-text placeholder-ui-faint focus:outline-none focus:border-ui-blue font-mono"
              />
              <button
                onClick={handlePickCustomKrita}
                className="btn-secondary h-8 px-2.5 text-[11px] flex items-center gap-1.5 flex-shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                <span>Velg fil...</span>
              </button>
            </div>
          </div>

          {/* Projects custom path */}
          <div className="p-3.5 rounded-lg bg-ui-surface border border-ui-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-emerald-400" />
                <span className="text-[13px] font-medium text-white">Hovedmappe for Prosjekter</span>
              </div>
              {settings.customProjectsPath && (
                <button
                  onClick={() => handleUpdateSetting('customProjectsPath', null)}
                  className="text-[11px] text-ui-faint hover:text-white flex items-center gap-1"
                  title="Gå tilbake til standard ~/ArtCraftHub/Projects"
                >
                  <RotateCcw className="w-3 h-3" />
                  Bruk standard
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.customProjectsPath || ''}
                placeholder="Standard: ~/ArtCraftHub/Projects eller Dokumenter/OpenArt/Projects"
                onChange={(e) => handleUpdateSetting('customProjectsPath', e.target.value || null)}
                className="flex-1 h-8 bg-ui-base border border-ui-border rounded px-2.5 text-[12px] text-ui-text placeholder-ui-faint focus:outline-none focus:border-ui-blue font-mono"
              />
              <button
                onClick={handlePickCustomProjects}
                className="btn-secondary h-8 px-2.5 text-[11px] flex items-center gap-1.5 flex-shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Velg mappe...</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Standard mapper med enkle toggles */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-ui-blue" />
            Standardmapper (Toggles)
          </h2>
          <p className="text-[12px] text-ui-muted">
            Velg hvilke av datamaskinens standardmapper Hub-en skal gjennomsøke etter kreative formater.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Bilder */}
          <div
            onClick={() => handleUpdateSetting('scanPictures', !settings.scanPictures)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanPictures
                ? 'bg-ui-surface border-ui-blue/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanPictures ? 'bg-purple-500/20 text-purple-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <Image className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Bilder (Pictures)</span>
                <span className="text-[11px] text-ui-muted">
                  Illustrasjoner, teksturer, konsepter og foto
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanPictures ? 'bg-ui-blue' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanPictures ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Dokumenter */}
          <div
            onClick={() => handleUpdateSetting('scanDocuments', !settings.scanDocuments)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanDocuments
                ? 'bg-ui-surface border-ui-blue/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanDocuments ? 'bg-blue-500/20 text-blue-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Dokumenter (Documents)</span>
                <span className="text-[11px] text-ui-muted">
                  OpenArt, Blender- og Krita-mapper
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanDocuments ? 'bg-ui-blue' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanDocuments ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Skrivebord */}
          <div
            onClick={() => handleUpdateSetting('scanDesktop', !settings.scanDesktop)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanDesktop
                ? 'bg-ui-surface border-ui-blue/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanDesktop ? 'bg-teal-500/20 text-teal-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Skrivebord (Desktop)</span>
                <span className="text-[11px] text-ui-muted">
                  Kreative filer lagt midlertidig på skrivebordet
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanDesktop ? 'bg-ui-blue' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanDesktop ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Nedlastinger */}
          <div
            onClick={() => handleUpdateSetting('scanDownloads', !settings.scanDownloads)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanDownloads
                ? 'bg-ui-surface border-ui-blue/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanDownloads ? 'bg-amber-500/20 text-amber-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Nedlastinger (Downloads)</span>
                <span className="text-[11px] text-ui-muted">
                  Nylig nedlastede 3D-modeller, børster og vektorer
                </span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanDownloads ? 'bg-ui-blue' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanDownloads ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. App-historikk aktivering */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            Aktive App-sensorer
          </h2>
          <p className="text-[12px] text-ui-muted">
            Aktiver eller deaktiver automatisk lesing av nylige filer fra dine kreative apper.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Blender */}
          <div
            onClick={() => handleUpdateSetting('scanBlender', !settings.scanBlender)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanBlender
                ? 'bg-ui-surface border-orange-500/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanBlender ? 'bg-orange-500/20 text-orange-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <Box className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Blender Historikk</span>
                <span className="text-[11px] text-ui-muted">.blend fra recent-files.txt</span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanBlender ? 'bg-orange-500' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanBlender ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Krita */}
          <div
            onClick={() => handleUpdateSetting('scanKrita', !settings.scanKrita)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanKrita
                ? 'bg-ui-surface border-sky-500/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanKrita ? 'bg-sky-500/20 text-sky-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Krita Historikk</span>
                <span className="text-[11px] text-ui-muted">.kra fra kritarc</span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanKrita ? 'bg-sky-500' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanKrita ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* ArtCraft Smart-prosjekter */}
          <div
            onClick={() => handleUpdateSetting('scanArtcraftProjects', !settings.scanArtcraftProjects)}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              settings.scanArtcraftProjects
                ? 'bg-ui-surface border-emerald-500/40 shadow-sm'
                : 'bg-ui-surface/40 border-ui-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  settings.scanArtcraftProjects ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ui-base text-ui-faint'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">Smart-Prosjekter</span>
                <span className="text-[11px] text-ui-muted">OpenArt & Hub Projects</span>
              </div>
            </div>
            <div
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.scanArtcraftProjects ? 'bg-emerald-500' : 'bg-[#333]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.scanArtcraftProjects ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Egendefinerte overvåkede mapper ("Watch Folders") */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-pink-400" />
            Overvåkede mapper («Watch Folders»)
          </h2>
          <p className="text-[12px] text-ui-muted">
            Har du en egen disk eller ekstern mappe der du lagrer 3D-modeller, tegninger eller oppdrag? Legg den til her.
          </p>
        </div>

        {/* Add folder controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={handlePickFolder}
            className="btn-secondary py-2 px-3 text-[13px] flex items-center justify-center gap-2"
          >
            <FolderPlus className="w-4 h-4 text-pink-400" />
            <span>Bla gjennom og velg mappe...</span>
          </button>

          <form onSubmit={handleAddManualFolder} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={customInputPath}
              onChange={(e) => setCustomInputPath(e.target.value)}
              placeholder="Eller lim inn mappesti (f.eks. D:\3D_Prosjekter eller /home/bruker/Kunst)..."
              className="flex-1 h-9 bg-ui-base border border-ui-border rounded-md px-3 text-[13px] text-ui-text placeholder-ui-faint focus:outline-none focus:border-ui-blue"
            />
            <button
              type="submit"
              disabled={!customInputPath.trim()}
              className="btn-primary py-1.5 px-3 text-[12px] disabled:opacity-40"
            >
              Legg til
            </button>
          </form>
        </div>

        {/* Folders list */}
        {settings.customFolders.length === 0 ? (
          <div className="p-4 rounded-lg bg-ui-surface/30 border border-ui-border/60 text-center text-ui-faint text-[12px]">
            Ingen egendefinerte mapper lagt til ennå. Klikk på «Bla gjennom» for å legge til en mappe.
          </div>
        ) : (
          <div className="space-y-2">
            {settings.customFolders.map((fPath) => (
              <div
                key={fPath}
                className="flex items-center justify-between p-3 rounded-lg bg-ui-surface border border-ui-border/80 text-[13px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="font-mono text-[12px] text-ui-text truncate" title={fPath}>
                    {fPath}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFolder(fPath)}
                  className="p-1.5 text-ui-faint hover:text-red-400 rounded transition-colors ml-2"
                  title="Fjern mappe fra overvåking"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Støyfiltrering & Sikkerhet */}
      <section className="space-y-4 p-4 rounded-lg bg-ui-surface border border-ui-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-[14px] font-semibold text-white">Smart støyreduksjon & System-svartelisting</h3>
              <p className="text-[12px] text-ui-muted">
                Hindrer at cache, ikoner, utviklermapper og systemfiler forurenser oversikten.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleUpdateSetting('filterNoise', !settings.filterNoise)}
            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              settings.filterNoise ? 'bg-emerald-500' : 'bg-[#333]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.filterNoise ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {/* Dedicated Screenshots toggle */}
        <div className="p-3 rounded-lg bg-ui-panel/60 border border-ui-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-white">Filtrer bort skjermbilder (Screenshots & Skjermklipp)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  Anbefalt
                </span>
              </div>
              <p className="text-[11.5px] text-ui-muted mt-0.5">
                Utelater automatisk Windows-skjermbilder (Win+Shift+S, PrtScn) og mapper som Screenshots/Skjermbilder, slik at hjemskjermen bare viser reelle kunstverk og prosjekter.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleUpdateSetting('ignoreScreenshots', !settings.ignoreScreenshots)}
            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors flex-shrink-0 ${
              settings.ignoreScreenshots ? 'bg-ui-blue' : 'bg-[#333]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.ignoreScreenshots ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-ui-border/60 text-[11px] text-ui-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Ignorerer AppData, Temp og Windows</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Ignorerer Screenshots & Skjermklipp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Ignorerer ørsmå ikoner (&lt; 15 KB)</span>
          </div>
        </div>
      </section>

      {/* 7. Oversikt over støttede filtyper */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-ui-faint" />
          <h2 className="text-[14px] font-semibold text-white">Støttede kreative filformater</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
          <div className="p-3 rounded-lg bg-ui-surface/60 border border-ui-border space-y-1">
            <span className="font-semibold text-orange-400 block">Blender / 3D</span>
            <p className="text-ui-muted font-mono text-[11px]">.blend, .fbx, .obj, .gltf, .glb, .stl</p>
          </div>

          <div className="p-3 rounded-lg bg-ui-surface/60 border border-ui-border space-y-1">
            <span className="font-semibold text-sky-400 block">Krita / Digital maling</span>
            <p className="text-ui-muted font-mono text-[11px]">.kra, .ora, .clip, .psd</p>
          </div>

          <div className="p-3 rounded-lg bg-ui-surface/60 border border-ui-border space-y-1">
            <span className="font-semibold text-amber-400 block">VectorCraft / Vektor</span>
            <p className="text-ui-muted font-mono text-[11px]">.svg, .eps, .ai</p>
          </div>

          <div className="p-3 rounded-lg bg-ui-surface/60 border border-ui-border space-y-1">
            <span className="font-semibold text-cyan-400 block">Photocraft & Kunst</span>
            <p className="text-ui-muted font-mono text-[11px]">.png, .jpg, .jpeg, .webp, .raw, .exr, .tiff</p>
          </div>

          <div className="p-3 rounded-lg bg-ui-surface/60 border border-ui-border space-y-1">
            <span className="font-semibold text-pink-400 block">Film & Video</span>
            <p className="text-ui-muted font-mono text-[11px]">.mp4, .mov, .mkv, .webm</p>
          </div>

          <div className="p-3 rounded-lg bg-ui-surface/60 border border-ui-border space-y-1">
            <span className="font-semibold text-indigo-400 block">Sound & Publisering</span>
            <p className="text-ui-muted font-mono text-[11px]">.wav, .mp3, .flac, .pdf, .idml, .fig</p>
          </div>
        </div>
      </section>

      {/* 8. Om OpenArt Hub & Oppdateringslogg */}
      <section className="p-4 rounded-xl bg-ui-surface border border-ui-border shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-white">Om OpenArt Hub & Oppdateringslogg</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                  v1.0.1
                </span>
              </div>
              <p className="text-[12px] text-ui-muted mt-0.5">
                Se alle nye funksjoner og forbedringer siden v1.0.0, eller start velkomst-oppsettet på nytt når som helst.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onShowChangelog && (
              <button
                onClick={onShowChangelog}
                className="btn-primary py-2 px-4 text-[12px] flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-900/25 rounded-lg transition-all"
                title="Åpne oppdateringsloggen med alle nye funksjoner"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Se oppdateringslogg (Changelog)</span>
              </button>
            )}
            <button
              onClick={handleResetOnboarding}
              className="btn-secondary py-2 px-3 text-[12px] flex items-center gap-1.5 text-ui-text hover:text-white transition-colors"
              title="Kjør førstegangsoppsett og velkomst-skjerm på nytt"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart / Redo Onboarding</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
