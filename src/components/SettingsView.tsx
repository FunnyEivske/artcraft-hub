import React, { useState, useEffect } from 'react';
import {
  Folder,
  Trash2,
  Sparkles,
  RefreshCw,
  Box,
  Palette,
  Layers,
  ExternalLink,
  Music,
  Type,
  RotateCcw,
  Check,
  Copy,
  Sun,
  Moon,
  Monitor,
  Globe,
  Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScannerSettings, CreativeFolderConfig, DiagnosticLogEntry } from '../types';
import {
  getScannerSettings,
  saveScannerSettings,
  pickCustomFolder,
  pickCustomFile,
  openPathInExplorer,
  initOrUpdateWorkspaceFolders,
  getDefaultWorkspaceDirPath,
  DEFAULT_WORKSPACE_FOLDERS,
  getDiagnosticLogs,
  clearDiagnosticLogs,
} from '../services/tauri';
import { getStoredTheme, setTheme, ThemeMode } from '../services/theme';

interface SettingsViewProps {
  onSettingsChanged?: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
  isScanning?: boolean;
  onRerunOnboarding?: () => void;
  onShowChangelog?: () => void;
}

type SettingsTab = 'general' | 'folders' | 'apps' | 'advanced';

const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none flex-shrink-0 ${
      checked ? 'bg-ui-accent' : 'bg-ui-surface-2 border border-ui-border'
    }`}
  >
    <span
      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 ${
        checked ? 'translate-x-4.5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSettingsChanged,
  onShowToast,
  isScanning = false,
  onRerunOnboarding,
  onShowChangelog,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Theme & Language
  const [currentLang, setCurrentLang] = useState<string>(() => i18n.language || 'en');
  const [currentTheme, setCurrentThemeState] = useState<ThemeMode>(() => getStoredTheme());

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

  const [defaultResolvedPath, setDefaultResolvedPath] = useState<string>('~/Documents/OpenArt');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Diagnostic Logs state
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'ERROR' | 'WARN' | 'INFO'>('all');
  const [logCopiedAll, setLogCopiedAll] = useState(false);
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

  // Fetch initial settings & workspace dir
  useEffect(() => {
    let isMounted = true;
    Promise.all([getScannerSettings(), getDefaultWorkspaceDirPath()])
      .then(([loaded, defaultPath]) => {
        if (!isMounted) return;
        setDefaultResolvedPath(defaultPath);
        setSettings({
          ...loaded,
          workspaceFolders:
            loaded.workspaceFolders && loaded.workspaceFolders.length > 0
              ? loaded.workspaceFolders
              : DEFAULT_WORKSPACE_FOLDERS,
        });
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchDiagnosticLogs = async () => {
    try {
      const logs = await getDiagnosticLogs();
      setDiagnosticLogs(logs);
    } catch (e) {
      console.error('Failed to load diagnostic logs:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'advanced') {
      fetchDiagnosticLogs();
    }
  }, [activeTab]);

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('openart_language', lang);
    if (onShowToast) onShowToast(t('common.save'), 'success');
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setCurrentThemeState(mode);
    setTheme(mode);
  };

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
      if (onShowToast) onShowToast(`Error saving: ${e}`, 'error');
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
        onShowToast(`Workspace folders synchronized in ${createdPath}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast(`Error creating folders: ${e}`, 'error');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleOpenWorkspaceInExplorer = async () => {
    const target = settings.openartWorkspacePath || defaultResolvedPath;
    try {
      await openPathInExplorer(target);
    } catch (e) {
      if (onShowToast) onShowToast(`Error opening explorer: ${e}`, 'error');
    }
  };

  const handlePickWorkspaceRoot = async () => {
    try {
      const selected = await pickCustomFolder();
      if (selected) {
        await handleUpdateSetting('openartWorkspacePath', selected);
        if (onShowToast) onShowToast(`Workspace folder set: ${selected}`, 'success');
      }
    } catch (err) {
      if (onShowToast) onShowToast(`Error selecting folder: ${err}`, 'error');
    }
  };

  const handlePickFolder = async () => {
    try {
      const selected = await pickCustomFolder();
      if (selected) {
        if (settings.customFolders.includes(selected)) {
          if (onShowToast) onShowToast('Folder already in list', 'info');
          return;
        }
        const updatedFolders = [...settings.customFolders, selected];
        await handleUpdateSetting('customFolders', updatedFolders);
        if (onShowToast) onShowToast(`Added folder: ${selected}`, 'success');
      }
    } catch (err) {
      if (onShowToast) onShowToast(`Error picking folder: ${err}`, 'error');
    }
  };

  const handleRemoveFolder = async (folderPath: string) => {
    const updatedFolders = settings.customFolders.filter((f) => f !== folderPath);
    await handleUpdateSetting('customFolders', updatedFolders);
    if (onShowToast) onShowToast('Folder removed from monitoring', 'info');
  };

  const handlePickCustomBlender = async () => {
    try {
      const selected = await pickCustomFile();
      if (selected) {
        await handleUpdateSetting('customBlenderPath', selected);
        if (onShowToast) onShowToast(`Blender path set: ${selected}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast(`Error selecting file: ${e}`, 'error');
    }
  };

  const handlePickCustomKrita = async () => {
    try {
      const selected = await pickCustomFile();
      if (selected) {
        await handleUpdateSetting('customKritaPath', selected);
        if (onShowToast) onShowToast(`Krita path set: ${selected}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast(`Error selecting file: ${e}`, 'error');
    }
  };

  const handlePickCustomProjects = async () => {
    try {
      const selected = await pickCustomFolder();
      if (selected) {
        await handleUpdateSetting('customProjectsPath', selected);
        if (onShowToast) onShowToast(`Projects path set: ${selected}`, 'success');
      }
    } catch (e) {
      if (onShowToast) onShowToast(`Error selecting projects folder: ${e}`, 'error');
    }
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
        onShowToast('Opening setup wizard...', 'info');
      }
      if (onRerunOnboarding) {
        onRerunOnboarding();
      }
    } catch (err) {
      console.error('Failed to reset onboarding:', err);
    }
  };

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      if (onShowToast) {
        onShowToast('Thumbnail and temporary cache cleared', 'success');
      }
      if (onSettingsChanged) onSettingsChanged();
    } catch {
      // ignore
    }
  };

  const handleResetAllSettings = async () => {
    const confirmed = window.confirm('Reset all OpenArt Hub settings to default?');
    if (!confirmed) return;

    const defaults: ScannerSettings = {
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
    };

    setSettings(defaults);
    await saveScannerSettings(defaults);
    if (onShowToast) onShowToast('Settings reset to defaults', 'info');
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleCopyAllLogs = () => {
    if (diagnosticLogs.length === 0) {
      if (onShowToast) onShowToast('No logs to copy', 'info');
      return;
    }
    const formatted = diagnosticLogs
      .map(
        (l) =>
          `[${l.timestampStr}] [${l.level}] [${l.source}]: ${l.message}${
            l.details ? `\nDetails: ${l.details}` : ''
          }`
      )
      .join('\n---\n');

    navigator.clipboard.writeText(formatted);
    setLogCopiedAll(true);
    setTimeout(() => setLogCopiedAll(false), 2000);
    if (onShowToast) onShowToast('Logs copied to clipboard', 'success');
  };

  const handleClearAllLogs = async () => {
    try {
      await clearDiagnosticLogs();
      await fetchDiagnosticLogs();
      if (onShowToast) onShowToast('Diagnostic logs cleared', 'success');
    } catch (e) {
      if (onShowToast) onShowToast(`Error clearing logs: ${e}`, 'error');
    }
  };

  const handleCopyEntry = (entry: DiagnosticLogEntry) => {
    const text = `[${entry.timestampStr}] [${entry.level}] [${entry.source}]: ${entry.message}${
      entry.details ? `\nDetails: ${entry.details}` : ''
    }`;
    navigator.clipboard.writeText(text);
    setCopiedEntryId(entry.id);
    setTimeout(() => setCopiedEntryId(null), 2000);
    if (onShowToast) onShowToast('Log entry copied', 'success');
  };

  const getFolderIcon = (name: string) => {
    switch (name) {
      case 'Blender':
      case 'Blender_Assets':
        return <Box className="w-4 h-4 text-ui-muted" />;
      case 'Textures':
        return <Layers className="w-4 h-4 text-ui-muted" />;
      case 'Brushes':
        return <Palette className="w-4 h-4 text-ui-muted" />;
      case 'References':
        return <Folder className="w-4 h-4 text-ui-muted" />;
      case 'Projects':
        return <Folder className="w-4 h-4 text-ui-muted" />;
      case 'Audio_and_SFX':
        return <Music className="w-4 h-4 text-ui-muted" />;
      case 'Fonts_and_Vectors':
        return <Type className="w-4 h-4 text-ui-muted" />;
      default:
        return <Folder className="w-4 h-4 text-ui-muted" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-ui-accent animate-spin" />
      </div>
    );
  }

  const effectiveWorkspacePath = settings.openartWorkspacePath || defaultResolvedPath;

  const filteredLogs = diagnosticLogs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.level === logFilter;
  });

  return (
    <div className="max-w-[960px] pb-16 space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ui-text">
              {t('settings.title')}
            </h1>
            {isSaving && (
              <span className="text-xs text-ui-muted flex items-center gap-1 font-medium animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{t('common.saving')}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-ui-muted mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSettingsChanged && onSettingsChanged()}
          disabled={isScanning}
          className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-ui-accent' : 'text-ui-muted'}`} />
          <span>{isScanning ? t('common.loading') : 'Refresh Scanner'}</span>
        </button>
      </div>

      {/* 4 Tabs Navigation (Adobe CC Calm Restraint) */}
      <div className="flex items-center gap-1 border-b border-ui-border pb-px">
        {[
          { id: 'general' as const, label: t('settings.tabGeneral') },
          { id: 'folders' as const, label: t('settings.tabFolders') },
          { id: 'apps' as const, label: t('settings.tabApps') },
          { id: 'advanced' as const, label: t('settings.tabAdvanced') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-ui-accent text-ui-text font-medium'
                : 'border-transparent text-ui-muted hover:text-ui-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Appearance Section */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">
                {t('settings.appearanceSection')}
              </h2>
              <p className="text-xs text-ui-muted mt-0.5">
                {t('settings.themeDesc')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  currentTheme === 'system'
                    ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                    : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                }`}
              >
                <Monitor className="w-5 h-5 mx-auto text-ui-muted mb-1.5" />
                <div className="text-xs font-medium text-ui-text">{t('onboarding.themeSystem')}</div>
                <div className="text-[10px] text-ui-muted mt-0.5">Auto</div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  currentTheme === 'light'
                    ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                    : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto text-ui-muted mb-1.5" />
                <div className="text-xs font-medium text-ui-text">{t('onboarding.themeLight')}</div>
                <div className="text-[10px] text-ui-muted mt-0.5">Paper (#f6f5f3)</div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  currentTheme === 'dark'
                    ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                    : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto text-ui-muted mb-1.5" />
                <div className="text-xs font-medium text-ui-text">{t('onboarding.themeDark')}</div>
                <div className="text-[10px] text-ui-muted mt-0.5">Matte (#17171a)</div>
              </button>
            </div>
          </div>

          {/* Language Section */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">
                {t('settings.language')}
              </h2>
              <p className="text-xs text-ui-muted mt-0.5">
                {t('settings.languageDesc')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                    : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                }`}
              >
                <Globe className="w-4 h-4 text-ui-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ui-text">English</div>
                  <div className="text-[10px] text-ui-muted">Default</div>
                </div>
                {currentLang === 'en' && <Check className="w-4 h-4 text-ui-accent flex-shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('nb')}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  currentLang === 'nb'
                    ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                    : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                }`}
              >
                <Globe className="w-4 h-4 text-ui-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ui-text">Norsk (Bokmål)</div>
                  <div className="text-[10px] text-ui-muted">Norwegian translation</div>
                </div>
                {currentLang === 'nb' && <Check className="w-4 h-4 text-ui-accent flex-shrink-0" />}
              </button>
            </div>
          </div>

          {/* Setup Wizard & History */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">
                {t('settings.onboardingSection')}
              </h2>
              <p className="text-xs text-ui-muted mt-0.5">
                {t('settings.redoOnboardingDesc')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleResetOnboarding}
                className="btn-secondary text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ui-muted" />
                <span>{t('settings.redoOnboarding')}</span>
              </button>

              {onShowChangelog && (
                <button
                  type="button"
                  onClick={onShowChangelog}
                  className="btn-secondary text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-ui-muted" />
                  <span>{t('settings.viewChangelog')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FOLDERS */}
      {activeTab === 'folders' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Workspace Root */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-ui-text">
                  {t('settings.workspaceSection')}
                </h2>
                <p className="text-xs text-ui-muted mt-0.5">
                  {t('settings.workspaceDesc')}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOpenWorkspaceInExplorer}
                  className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-ui-muted" />
                  <span>{t('settings.openInExplorer')}</span>
                </button>
                <button
                  type="button"
                  disabled={isCreatingWorkspace}
                  onClick={handleCreateWorkspaceNow}
                  className="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCreatingWorkspace ? 'animate-spin' : ''}`} />
                  <span>{isCreatingWorkspace ? t('common.loading') : t('settings.syncFolders')}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-ui-bg border border-ui-border rounded-lg text-xs font-mono text-ui-text truncate">
                {effectiveWorkspacePath}
              </div>
              <button
                type="button"
                onClick={handlePickWorkspaceRoot}
                className="btn-secondary text-xs px-3 py-2 rounded-lg flex-shrink-0 cursor-pointer"
              >
                {t('settings.browseFile')}
              </button>
            </div>
          </div>

          {/* Active Workspace Subfolders List */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3 shadow-sm">
            <h2 className="text-sm font-semibold text-ui-text">
              {t('settings.foldersListTitle')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {(settings.workspaceFolders || DEFAULT_WORKSPACE_FOLDERS).map((folder: CreativeFolderConfig) => (
                <div
                  key={folder.folderName}
                  onClick={() => handleToggleWorkspaceFolder(folder.folderName)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    folder.enabled
                      ? 'bg-ui-surface-2 border-ui-border-strong shadow-xs'
                      : 'bg-ui-bg border-ui-border opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="mt-0.5">{getFolderIcon(folder.folderName)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-ui-text truncate">{folder.name}</div>
                    <div className="text-[10px] text-ui-muted truncate mt-0.5 font-mono">
                      {folder.folderName}/
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      folder.enabled
                        ? 'bg-ui-accent text-white'
                        : 'border border-ui-border bg-ui-surface'
                    }`}
                  >
                    {folder.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitored System & Custom Paths */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">Monitored Locations</h2>
              <p className="text-xs text-ui-muted mt-0.5">
                Control which folders OpenArt Hub scans for recent creative files and project assets.
              </p>
            </div>

            {/* Standard OS folders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { key: 'scanPictures' as const, label: 'Pictures' },
                { key: 'scanDocuments' as const, label: 'Documents' },
                { key: 'scanDesktop' as const, label: 'Desktop' },
                { key: 'scanDownloads' as const, label: 'Downloads' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-ui-border bg-ui-bg cursor-pointer hover:bg-ui-surface-2 transition-colors"
                >
                  <span className="text-xs font-medium text-ui-text">{item.label}</span>
                  <Switch
                    checked={Boolean(settings[item.key])}
                    onChange={(v) => handleUpdateSetting(item.key, v)}
                  />
                </label>
              ))}
            </div>

            {/* Custom Folders */}
            <div className="pt-2 border-t border-ui-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ui-text">Custom Monitored Paths</span>
                <button
                  type="button"
                  onClick={handlePickFolder}
                  className="btn-secondary text-xs px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Folder...</span>
                </button>
              </div>

              {settings.customFolders.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {settings.customFolders.map((path) => (
                    <div
                      key={path}
                      className="flex items-center justify-between p-2 rounded-lg bg-ui-bg border border-ui-border text-xs"
                    >
                      <span className="font-mono text-ui-text truncate flex-1 mr-2">{path}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFolder(path)}
                        className="text-ui-muted hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-ui-muted italic">
                  No custom folders added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPS */}
      {activeTab === 'apps' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* App Executable Overrides */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-5 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">
                {t('settings.appsSection')}
              </h2>
              <p className="text-xs text-ui-muted mt-0.5">
                {t('settings.appsDesc')}
              </p>
            </div>

            {/* Blender */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ui-text">Blender Executable</span>
                {settings.customBlenderPath && (
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('customBlenderPath', null)}
                    className="text-ui-muted hover:text-red-400 text-[11px] cursor-pointer"
                  >
                    {t('settings.clearOverride')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-ui-bg border border-ui-border rounded-lg text-xs font-mono text-ui-text truncate">
                  {settings.customBlenderPath || 'Auto-detected in Program Files / PATH'}
                </div>
                <button
                  type="button"
                  onClick={handlePickCustomBlender}
                  className="btn-secondary text-xs px-3 py-2 rounded-lg flex-shrink-0 cursor-pointer"
                >
                  {t('settings.browseFile')}
                </button>
              </div>
            </div>

            {/* Krita */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ui-text">Krita Executable</span>
                {settings.customKritaPath && (
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('customKritaPath', null)}
                    className="text-ui-muted hover:text-red-400 text-[11px] cursor-pointer"
                  >
                    {t('settings.clearOverride')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-ui-bg border border-ui-border rounded-lg text-xs font-mono text-ui-text truncate">
                  {settings.customKritaPath || 'Auto-detected in Program Files / PATH'}
                </div>
                <button
                  type="button"
                  onClick={handlePickCustomKrita}
                  className="btn-secondary text-xs px-3 py-2 rounded-lg flex-shrink-0 cursor-pointer"
                >
                  {t('settings.browseFile')}
                </button>
              </div>
            </div>

            {/* PhotoCraft & Studio Projects */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ui-text">PhotoCraft & Smart Projects Root</span>
                {settings.customProjectsPath && (
                  <button
                    type="button"
                    onClick={() => handleUpdateSetting('customProjectsPath', null)}
                    className="text-ui-muted hover:text-red-400 text-[11px] cursor-pointer"
                  >
                    {t('settings.clearOverride')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-ui-bg border border-ui-border rounded-lg text-xs font-mono text-ui-text truncate">
                  {settings.customProjectsPath || `${effectiveWorkspacePath}/Projects`}
                </div>
                <button
                  type="button"
                  onClick={handlePickCustomProjects}
                  className="btn-secondary text-xs px-3 py-2 rounded-lg flex-shrink-0 cursor-pointer"
                >
                  {t('settings.browseFile')}
                </button>
              </div>
            </div>
          </div>

          {/* Cache Management */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ui-text">Local Cache & Storage</h2>
                <p className="text-xs text-ui-muted mt-0.5">
                  Clear generated thumbnail previews and temporary cache data.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearCache}
                className="btn-secondary text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADVANCED */}
      {activeTab === 'advanced' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Noise & Screenshot Filters */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">
                {t('settings.filteringSection')}
              </h2>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-lg bg-ui-bg border border-ui-border">
                <div>
                  <div className="text-xs font-medium text-ui-text">
                    {t('settings.filterNoise')}
                  </div>
                  <div className="text-[11px] text-ui-muted mt-0.5">
                    {t('settings.filterNoiseDesc')}
                  </div>
                </div>
                <Switch
                  checked={settings.filterNoise}
                  onChange={(v) => handleUpdateSetting('filterNoise', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-ui-bg border border-ui-border">
                <div>
                  <div className="text-xs font-medium text-ui-text">
                    {t('settings.ignoreScreenshots')}
                  </div>
                  <div className="text-[11px] text-ui-muted mt-0.5">
                    {t('settings.ignoreScreenshotsDesc')}
                  </div>
                </div>
                <Switch
                  checked={Boolean(settings.ignoreScreenshots)}
                  onChange={(v) => handleUpdateSetting('ignoreScreenshots', v)}
                />
              </div>
            </div>
          </div>

          {/* Diagnostics Log Viewer */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ui-text">
                  {t('settings.diagnosticsTitle')} ({diagnosticLogs.length})
                </h2>
                <p className="text-xs text-ui-muted mt-0.5">
                  Internal runtime log for debugging launch, scan and network events.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllLogs}
                  className="btn-secondary text-xs px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                >
                  {logCopiedAll ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{logCopiedAll ? t('common.copied') : t('settings.copyLogs')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllLogs}
                  className="btn-secondary text-xs px-2.5 py-1 rounded-md flex items-center gap-1 text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t('settings.clearLogs')}</span>
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 pt-1">
              {(['all', 'ERROR', 'WARN', 'INFO'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    logFilter === lvl
                      ? 'bg-ui-surface-2 text-ui-text border border-ui-border-strong font-medium'
                      : 'text-ui-muted hover:text-ui-text'
                  }`}
                >
                  {lvl.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Log Terminal Window */}
            <div className="h-64 rounded-xl bg-ui-bg border border-ui-border overflow-y-auto p-3 font-mono text-[11px] space-y-2">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-lg bg-ui-surface border border-ui-border flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] text-ui-muted">
                        <span>{entry.timestampStr}</span>
                        <span
                          className={`font-semibold uppercase ${
                            entry.level === 'ERROR'
                              ? 'text-red-400'
                              : entry.level === 'WARN'
                              ? 'text-amber-400'
                              : 'text-ui-accent'
                          }`}
                        >
                          [{entry.level}]
                        </span>
                        <span className="text-ui-muted">[{entry.source}]</span>
                      </div>
                      <div className="text-ui-text mt-0.5 break-words">{entry.message}</div>
                      {entry.details && (
                        <pre className="mt-1 text-[10px] text-ui-muted overflow-x-auto whitespace-pre-wrap">
                          {entry.details}
                        </pre>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyEntry(entry)}
                      className="p-1 rounded text-ui-muted hover:text-ui-text flex-shrink-0 cursor-pointer"
                      title="Copy entry"
                    >
                      {copiedEntryId === entry.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-ui-muted">
                  No diagnostic events logged.
                </div>
              )}
            </div>
          </div>

          {/* Reset All Settings */}
          <div className="rounded-xl border border-ui-border bg-ui-surface p-5 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-ui-text">Reset Settings</h2>
              <p className="text-xs text-ui-muted mt-0.5">
                Restore default directories, theme, and scanning parameters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAllSettings}
              className="btn-secondary text-xs px-3.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
