import React, { useState, useEffect } from 'react';
import {
  Camera,
  Paintbrush,
  PenTool,
  Box,
  Film,
  Music,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Monitor,
  Globe,
  Sparkles,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScannerSettings, CreativeFolderConfig } from '../types';
import {
  getDefaultWorkspaceDirPath,
  initOrUpdateWorkspaceFolders,
  pickCustomFolder,
  saveScannerSettings,
} from '../services/tauri';
import { getStoredTheme, setTheme, ThemeMode } from '../services/theme';

export interface OnboardingWizardProps {
  initialSettings: ScannerSettings;
  onComplete: (updatedSettings: ScannerSettings) => void;
  onClose?: () => void;
}

export interface ToolboxDefinition {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  appNames: string[];
  folders: { folderName: string; name: string; description: string }[];
}

export const TOOLBOXES: ToolboxDefinition[] = [
  {
    id: 'photo',
    titleKey: 'toolboxes.photo.title',
    descKey: 'toolboxes.photo.description',
    icon: Camera,
    appNames: ['PhotoCraft', 'LightCraft'],
    folders: [
      {
        folderName: 'Photos',
        name: 'Photos & RAW',
        description: 'Original photos, RAW captures and Lightroom/LightCraft libraries',
      },
    ],
  },
  {
    id: 'painting',
    titleKey: 'toolboxes.painting.title',
    descKey: 'toolboxes.painting.description',
    icon: Paintbrush,
    appNames: ['Krita', 'PhotoCraft'],
    folders: [
      {
        folderName: 'Brushes',
        name: 'Brushes & Bundles',
        description: 'Krita resource bundles (.bundle) and brush packs',
      },
      {
        folderName: 'References',
        name: 'References & Sketches',
        description: 'Concept art references, character sketches and moodboards',
      },
    ],
  },
  {
    id: 'vector',
    titleKey: 'toolboxes.vector.title',
    descKey: 'toolboxes.vector.description',
    icon: PenTool,
    appNames: ['VectorCraft', 'FigCraft'],
    folders: [
      {
        folderName: 'Fonts_and_Vectors',
        name: 'Vectors & Fonts',
        description: 'Vector illustrations, SVG graphics, logos and typography',
      },
    ],
  },
  {
    id: 'threeD',
    titleKey: 'toolboxes.threeD.title',
    descKey: 'toolboxes.threeD.description',
    icon: Box,
    appNames: ['Blender', 'CADCraft'],
    folders: [
      {
        folderName: 'Blender',
        name: '3D & Blender',
        description: '3D scenes, sculpts, CAD parts and renders',
      },
      {
        folderName: 'Textures',
        name: 'Textures & PBR',
        description: 'PBR materials, HDRIs, normal maps and surface textures',
      },
    ],
  },
  {
    id: 'video',
    titleKey: 'toolboxes.video.title',
    descKey: 'toolboxes.video.description',
    icon: Film,
    appNames: ['FilmCraft', 'EffectCraft'],
    folders: [
      {
        folderName: 'Video_Footage',
        name: 'Video & Footage',
        description: 'Video clips, timelines, motion assets and exports',
      },
    ],
  },
  {
    id: 'audio',
    titleKey: 'toolboxes.audio.title',
    descKey: 'toolboxes.audio.description',
    icon: Music,
    appNames: ['SoundCraft'],
    folders: [
      {
        folderName: 'Audio_and_SFX',
        name: 'Audio & Music',
        description: 'Sound effects, instruments, stems and recordings',
      },
    ],
  },
  {
    id: 'layout',
    titleKey: 'toolboxes.layout.title',
    descKey: 'toolboxes.layout.description',
    icon: FileText,
    appNames: ['DesignCraft', 'DeckCraft', 'WordCraft'],
    folders: [
      {
        folderName: 'Publications',
        name: 'Layout & Print',
        description: 'Editorial layouts, slide decks, documents and print proofs',
      },
    ],
  },
];

const STORED_TOOLBOXES_KEY = 'openart_selected_toolboxes';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialSettings,
  onComplete,
  onClose,
}) => {
  const { t, i18n } = useTranslation();

  // Step 1: Language & Theme
  const [currentLang, setCurrentLang] = useState<string>(() => i18n.language || 'en');
  const [currentTheme, setCurrentThemeState] = useState<ThemeMode>(() => getStoredTheme());

  // Step 2: Toolboxes
  const [selectedToolboxes, setSelectedToolboxes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORED_TOOLBOXES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Default: all toolboxes selected
    return TOOLBOXES.map((tb) => tb.id);
  });

  // Step 3: Workspace Directory & Subfolders
  const [workspacePath, setWorkspacePath] = useState<string>(
    initialSettings.openartWorkspacePath || ''
  );
  const [defaultResolvedPath, setDefaultResolvedPath] = useState<string>('~/Documents/OpenArt');
  const [showAdvancedFolders, setShowAdvancedFolders] = useState(false);
  const [customFolderList, setCustomFolderList] = useState<CreativeFolderConfig[]>(() => {
    return (
      initialSettings.workspaceFolders && initialSettings.workspaceFolders.length > 0
        ? initialSettings.workspaceFolders
        : []
    );
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isFinishing, setIsFinishing] = useState(false);

  // Load default OS workspace directory path on mount
  useEffect(() => {
    let isMounted = true;
    getDefaultWorkspaceDirPath().then((resolved) => {
      if (isMounted) {
        setDefaultResolvedPath(resolved);
        if (!workspacePath) {
          setWorkspacePath(resolved);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update language handler
  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('openart_language', lang);
  };

  // Update theme handler with live preview
  const handleThemeChange = (mode: ThemeMode) => {
    setCurrentThemeState(mode);
    setTheme(mode);
  };

  // Toggle toolbox
  const toggleToolbox = (id: string) => {
    setSelectedToolboxes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAllToolboxes = () => {
    setSelectedToolboxes(TOOLBOXES.map((t) => t.id));
  };

  const handleDeselectAllToolboxes = () => {
    // Keep at least photo
    setSelectedToolboxes(['photo']);
  };

  // Choose custom root folder via native OS dialog
  const handleBrowseFolder = async () => {
    const picked = await pickCustomFolder();
    if (picked) {
      setWorkspacePath(picked);
    }
  };

  // Generate subfolders based on selected toolboxes
  const getComputedFolders = (): CreativeFolderConfig[] => {
    const folders: CreativeFolderConfig[] = [
      {
        enabled: true,
        name: 'Projects',
        folderName: 'Projects',
        description: 'Creative project directories and manifest files',
      },
    ];

    selectedToolboxes.forEach((tbId) => {
      const def = TOOLBOXES.find((tb) => tb.id === tbId);
      if (def) {
        def.folders.forEach((f) => {
          // Check if already in custom folder list to preserve enabled toggle
          const existing = customFolderList.find((cf) => cf.folderName === f.folderName);
          folders.push({
            enabled: existing ? existing.enabled : true,
            name: f.name,
            folderName: f.folderName,
            description: f.description,
          });
        });
      }
    });

    return folders;
  };

  // Toggle individual folder
  const toggleFolderEnabled = (folderName: string) => {
    setCustomFolderList((prev) => {
      const existing = prev.find((f) => f.folderName === folderName);
      if (existing) {
        return prev.map((f) =>
          f.folderName === folderName ? { ...f, enabled: !f.enabled } : f
        );
      }
      const allComputed = getComputedFolders();
      return allComputed.map((f) =>
        f.folderName === folderName ? { ...f, enabled: !f.enabled } : f
      );
    });
  };

  // Finish onboarding
  const handleCompleteWizard = async () => {
    setIsFinishing(true);
    try {
      const finalFolders = getComputedFolders().map((f) => {
        const custom = customFolderList.find((c) => c.folderName === f.folderName);
        return custom ? custom : f;
      });

      const finalSettings: ScannerSettings = {
        ...initialSettings,
        openartWorkspacePath: workspacePath || defaultResolvedPath,
        workspaceFolders: finalFolders,
        onboardingCompleted: true,
      };

      // Store chosen toolboxes
      localStorage.setItem(STORED_TOOLBOXES_KEY, JSON.stringify(selectedToolboxes));
      localStorage.setItem('artcraft_onboarding_completed', 'true');

      // Initialize directories on disk
      await initOrUpdateWorkspaceFolders(finalSettings);

      // Save settings to Rust backend
      await saveScannerSettings(finalSettings);

      onComplete(finalSettings);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      // Ensure completion callback happens
      localStorage.setItem('artcraft_onboarding_completed', 'true');
      onComplete({
        ...initialSettings,
        openartWorkspacePath: workspacePath || defaultResolvedPath,
        onboardingCompleted: true,
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const computedFolders = getComputedFolders();
  const effectivePath = workspacePath || defaultResolvedPath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[640px] bg-ui-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Step Progress */}
        <div className="px-7 pt-6 pb-4 border-b border-ui-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ui-surface-2 border border-ui-border flex items-center justify-center text-ui-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-ui-muted tracking-wide uppercase">
                OpenArt Setup
              </span>
              <div className="text-[11px] text-ui-muted">
                {t('common.step', { current: currentStep, total: 4 }) || `Step ${currentStep} of 4`}
              </div>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  stepNum === currentStep
                    ? 'w-6 bg-ui-accent'
                    : stepNum < currentStep
                    ? 'w-2 bg-ui-muted'
                    : 'w-2 bg-ui-border'
                }`}
              />
            ))}
            {onClose && (
              <button
                onClick={onClose}
                className="ml-3 p-1 rounded-md text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer"
                title={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {/* STEP 1: LANGUAGE & THEME */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-ui-text tracking-tight">
                  {t('onboarding.step1Title')}
                </h2>
                <p className="text-xs text-ui-muted mt-1">
                  {t('onboarding.step1Subtitle')}
                </p>
              </div>

              {/* Language selection */}
              <div>
                <label className="text-xs font-medium text-ui-text block mb-2">
                  {t('onboarding.languageLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentLang === 'en'
                        ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                        : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-ui-surface flex items-center justify-center text-ui-text border border-ui-border">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ui-text">English</div>
                      <div className="text-[11px] text-ui-muted">Default</div>
                    </div>
                    {currentLang === 'en' && (
                      <Check className="w-4 h-4 text-ui-accent flex-shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLanguageChange('nb')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentLang === 'nb'
                        ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                        : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-ui-surface flex items-center justify-center text-ui-text border border-ui-border">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ui-text">Norsk (Bokmål)</div>
                      <div className="text-[11px] text-ui-muted">Norsk oversettelse</div>
                    </div>
                    {currentLang === 'nb' && (
                      <Check className="w-4 h-4 text-ui-accent flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Theme selection with live preview */}
              <div>
                <label className="text-xs font-medium text-ui-text block mb-2">
                  {t('onboarding.themeLabel')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`flex flex-col items-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      currentTheme === 'system'
                        ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                        : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-ui-surface flex items-center justify-center text-ui-text border border-ui-border mb-2">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-ui-text">
                      {t('onboarding.themeSystem')}
                    </span>
                    <span className="text-[10px] text-ui-muted mt-0.5">Auto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      currentTheme === 'light'
                        ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                        : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-ui-surface flex items-center justify-center text-ui-text border border-ui-border mb-2">
                      <Sun className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-ui-text">
                      {t('onboarding.themeLight')}
                    </span>
                    <span className="text-[10px] text-ui-muted mt-0.5">Paper</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      currentTheme === 'dark'
                        ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                        : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-ui-surface flex items-center justify-center text-ui-text border border-ui-border mb-2">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-ui-text">
                      {t('onboarding.themeDark')}
                    </span>
                    <span className="text-[10px] text-ui-muted mt-0.5">Matte</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: WHAT DO YOU MAKE? */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ui-text tracking-tight">
                    {t('onboarding.step2Title')}
                  </h2>
                  <p className="text-xs text-ui-muted mt-1">
                    {t('onboarding.step2Subtitle')}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllToolboxes}
                    className="text-[11px] text-ui-accent hover:underline cursor-pointer"
                  >
                    {t('onboarding.selectAll')}
                  </button>
                  <span className="text-ui-muted text-[11px]">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllToolboxes}
                    className="text-[11px] text-ui-muted hover:text-ui-text cursor-pointer"
                  >
                    {t('onboarding.deselectAll')}
                  </button>
                </div>
              </div>

              <div className="text-xs text-ui-muted font-medium">
                {t('onboarding.toolboxCount', {
                  count: selectedToolboxes.length,
                  total: TOOLBOXES.length,
                })}
              </div>

              {/* Toolboxes list */}
              <div className="grid grid-cols-1 gap-2.5">
                {TOOLBOXES.map((tb) => {
                  const isSelected = selectedToolboxes.includes(tb.id);
                  const Icon = tb.icon;
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => toggleToolbox(tb.id)}
                      className={`flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                          : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-ui-accent text-white'
                            : 'bg-ui-surface border border-ui-border text-ui-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ui-text">
                            {t(tb.titleKey)}
                          </span>
                          <span className="text-[10px] text-ui-muted bg-ui-surface px-1.5 py-0.5 rounded border border-ui-border">
                            {tb.appNames.join(', ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-ui-muted truncate mt-0.5">
                          {t(tb.descKey)}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-ui-accent border-ui-accent text-white'
                            : 'border-ui-border bg-ui-surface'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: WHERE SHOULD YOUR WORK LIVE? */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-ui-text tracking-tight">
                  {t('onboarding.step3Title')}
                </h2>
                <p className="text-xs text-ui-muted mt-1">
                  {t('onboarding.step3Subtitle')}
                </p>
              </div>

              {/* Root Directory Card */}
              <div className="p-4 rounded-xl border border-ui-border bg-ui-bg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ui-text flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-ui-accent" />
                    <span>{t('onboarding.folderLabel')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleBrowseFolder}
                    className="btn-secondary text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{t('onboarding.changeFolder')}</span>
                  </button>
                </div>
                <div className="px-3 py-2 bg-ui-surface border border-ui-border rounded-lg text-xs font-mono text-ui-text truncate">
                  {effectivePath}
                </div>
              </div>

              {/* Subfolders preview */}
              <div>
                <div className="text-xs font-medium text-ui-text mb-2">
                  {t('onboarding.subfoldersPreview')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {computedFolders
                    .filter((f) => {
                      const c = customFolderList.find((item) => item.folderName === f.folderName);
                      return c ? c.enabled : f.enabled;
                    })
                    .map((f) => (
                      <span
                        key={f.folderName}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ui-surface-2 border border-ui-border text-xs text-ui-text"
                      >
                        <Folder className="w-3 h-3 text-ui-muted" />
                        <span>{f.folderName}/</span>
                      </span>
                    ))}
                </div>
              </div>

              {/* Advanced Folders Toggle */}
              <div className="pt-2 border-t border-ui-border">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFolders(!showAdvancedFolders)}
                  className="flex items-center gap-1.5 text-xs text-ui-muted hover:text-ui-text transition-colors cursor-pointer"
                >
                  {showAdvancedFolders ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  <span>{t('onboarding.customizeFolders')}</span>
                </button>

                {showAdvancedFolders && (
                  <div className="mt-3 space-y-2 border border-ui-border rounded-xl p-3 bg-ui-bg animate-in fade-in duration-150">
                    {computedFolders.map((f) => {
                      const custom = customFolderList.find((c) => c.folderName === f.folderName);
                      const isEnabled = custom ? custom.enabled : f.enabled;
                      return (
                        <label
                          key={f.folderName}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-ui-surface-2 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleFolderEnabled(f.folderName)}
                              className="rounded border-ui-border text-ui-accent focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-medium text-ui-text">{f.folderName}/</div>
                              <div className="text-[10px] text-ui-muted">{f.description}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-ui-muted">{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & READY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-ui-surface-2 border border-ui-accent/40 text-ui-accent flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h2 className="text-lg font-semibold text-ui-text tracking-tight">
                  {t('onboarding.step4Title')}
                </h2>
                <p className="text-xs text-ui-muted mt-1 max-w-md mx-auto">
                  {t('onboarding.step4Subtitle')}
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-xl border border-ui-border bg-ui-bg divide-y divide-ui-border overflow-hidden">
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">{t('settings.language')}</span>
                  <span className="font-medium text-ui-text">
                    {currentLang === 'nb' ? 'Norsk (Bokmål)' : 'English'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">{t('settings.theme')}</span>
                  <span className="font-medium text-ui-text capitalize">{currentTheme}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">Toolboxes</span>
                  <span className="font-medium text-ui-text">
                    {selectedToolboxes.length} of {TOOLBOXES.length} active
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">Workspace Location</span>
                  <span className="font-mono text-ui-text text-[11px] max-w-[280px] truncate">
                    {effectivePath}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-7 py-4 border-t border-ui-border bg-ui-surface flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="btn-quiet text-xs px-3.5 py-1.5 rounded-lg text-ui-muted hover:text-ui-text transition-colors cursor-pointer"
              >
                {t('common.back')}
              </button>
            )}
            {currentStep === 1 && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-quiet text-xs px-3 py-1.5 rounded-lg text-ui-muted hover:text-ui-text transition-colors cursor-pointer"
              >
                {t('common.skip')}
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="btn-primary text-xs px-5 py-2 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t('common.next')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isFinishing}
                onClick={handleCompleteWizard}
                className="btn-primary text-xs px-6 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isFinishing ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  <>
                    <span>{t('onboarding.openHub')}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
