import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Globe,
  X,
  Layers,
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
import { SUITE_DEFINITIONS, ALL_SUITE_IDS } from '../suites';

export interface OnboardingWizardProps {
  initialSettings: ScannerSettings;
  onComplete: (updatedSettings: ScannerSettings) => void;
  onClose?: () => void;
}

const STORED_SUITES_KEY = 'openart_selected_suites';
const V1_0_13_SETUP_KEY = 'openart_suites_setup_v1_0_13';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialSettings,
  onComplete,
  onClose,
}) => {
  const { t, i18n } = useTranslation();

  // Step 1: Language & Theme
  const [currentLang, setCurrentLang] = useState<string>(() => i18n.language || 'nb');
  const [currentTheme, setCurrentThemeState] = useState<ThemeMode>(() => getStoredTheme());

  // Step 2: Suites selection - strictly unselected by default so user must pick
  const [selectedSuites, setSelectedSuites] = useState<string[]>(() => {
    try {
      const alreadyV13 = localStorage.getItem(V1_0_13_SETUP_KEY);
      if (alreadyV13 === 'true') {
        const stored = localStorage.getItem(STORED_SUITES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default requirement: Nothing pre-selected so user chooses what they want or clicks 'Alle'
    return [];
  });

  // Step 3: Workspace Directory & Subfolders
  const [workspacePath, setWorkspacePath] = useState<string>(
    initialSettings.openartWorkspacePath || ''
  );
  const [defaultResolvedPath, setDefaultResolvedPath] = useState<string>('~/Documents/OpenArt');
  const [showAdvancedFolders, setShowAdvancedFolders] = useState(false);
  const [customFolderList, setCustomFolderList] = useState<CreativeFolderConfig[]>(() => {
    return initialSettings.workspaceFolders && initialSettings.workspaceFolders.length > 0
      ? initialSettings.workspaceFolders
      : [];
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

  const allSelected =
    selectedSuites.length === SUITE_DEFINITIONS.length && SUITE_DEFINITIONS.length > 0;

  // Toggle individual suite
  const toggleSuite = (id: string) => {
    setSelectedSuites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or toggle
  const handleSelectAllSuites = () => {
    if (allSelected) {
      setSelectedSuites([]);
    } else {
      setSelectedSuites(ALL_SUITE_IDS);
    }
  };

  // Choose custom root folder via native OS dialog
  const handleBrowseFolder = async () => {
    const picked = await pickCustomFolder();
    if (picked) {
      setWorkspacePath(picked);
    }
  };

  // Generate subfolders based on selected suites
  const getComputedFolders = (): CreativeFolderConfig[] => {
    const folders: CreativeFolderConfig[] = [
      {
        enabled: true,
        name: 'Projects',
        folderName: 'Projects',
        description: 'Kreative prosjektmapper og manifestfiler',
      },
    ];

    const added = new Set<string>(['Projects']);

    selectedSuites.forEach((suiteId) => {
      const def = SUITE_DEFINITIONS.find((s) => s.id === suiteId);
      if (def) {
        def.folders.forEach((f) => {
          if (!added.has(f.folderName)) {
            added.add(f.folderName);
            const existing = customFolderList.find((cf) => cf.folderName === f.folderName);
            folders.push({
              enabled: existing ? existing.enabled : true,
              name: f.name,
              folderName: f.folderName,
              description: f.description,
            });
          }
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

      // Store chosen suites and marks v1.0.13 setup completed
      localStorage.setItem(STORED_SUITES_KEY, JSON.stringify(selectedSuites));
      localStorage.setItem(V1_0_13_SETUP_KEY, 'true');
      localStorage.setItem('artcraft_onboarding_completed', 'true');

      // Initialize directories on disk
      await initOrUpdateWorkspaceFolders(finalSettings);

      // Save settings to Rust backend
      await saveScannerSettings(finalSettings);

      onComplete(finalSettings);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      localStorage.setItem(STORED_SUITES_KEY, JSON.stringify(selectedSuites));
      localStorage.setItem(V1_0_13_SETUP_KEY, 'true');
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
  const isNorwegian = currentLang === 'nb' || currentLang.startsWith('no');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[660px] bg-ui-surface border border-ui-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
                {isNorwegian
                  ? `Steg ${currentStep} av 4`
                  : `Step ${currentStep} of 4`}
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
                title={t('common.close') || 'Lukk'}
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
                  {isNorwegian
                    ? 'Velkommen til OpenArt Hub'
                    : 'Welcome to OpenArt Hub'}
                </h2>
                <p className="text-xs text-ui-muted mt-1">
                  {isNorwegian
                    ? 'Tilpass språk og utseende før du velger dine apper og verktøy.'
                    : 'Customize your language and appearance before choosing your suites.'}
                </p>
              </div>

              {/* Language selection */}
              <div>
                <label className="text-xs font-medium text-ui-text block mb-2">
                  {isNorwegian ? 'Velg språk' : 'Language'}
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                      <div className="text-[11px] text-ui-muted">Norsk grensesnitt</div>
                    </div>
                    {currentLang === 'nb' && (
                      <Check className="w-4 h-4 text-ui-accent flex-shrink-0" />
                    )}
                  </button>

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
                      <div className="text-[11px] text-ui-muted">English interface</div>
                    </div>
                    {currentLang === 'en' && (
                      <Check className="w-4 h-4 text-ui-accent flex-shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Theme selection */}
              <div>
                <label className="text-xs font-medium text-ui-text block mb-2">
                  {isNorwegian ? 'Tema' : 'Appearance'}
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                      {isNorwegian ? 'Mørkt tema' : 'Dark Theme'}
                    </span>
                    <span className="text-[10px] text-ui-muted mt-0.5">Sleek studio</span>
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
                      {isNorwegian ? 'Lyst tema' : 'Light Theme'}
                    </span>
                    <span className="text-[10px] text-ui-muted mt-0.5">Paper studio</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: WHAT WILL YOU USE OPENART FOR? (SUITE SELECTION) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ui-text tracking-tight">
                    {isNorwegian
                      ? 'Hva skal du bruke OpenArt til?'
                      : 'What will you use OpenArt for?'}
                  </h2>
                  <p className="text-xs text-ui-muted mt-1">
                    {isNorwegian
                      ? 'Velg pakkene du ønsker å bruke. Du kan velge én, flere eller alle. Uvalgte apper kan alltid nås i Alle apper-menyen.'
                      : 'Pick the suites you want to focus on. Unselected tools remain accessible at any time.'}
                  </p>
                </div>
              </div>

              {/* Master "Alle apper" card */}
              <button
                type="button"
                onClick={handleSelectAllSuites}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  allSelected
                    ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent shadow-sm'
                    : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    allSelected
                      ? 'bg-ui-accent text-white shadow-md'
                      : 'bg-ui-surface border border-ui-border text-ui-muted'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ui-text">
                      {isNorwegian ? 'Alle apper & pakker' : 'All Apps & Suites'}
                    </span>
                    <span className="text-[10px] text-ui-accent bg-ui-accent/10 px-2 py-0.5 rounded-full font-medium border border-ui-accent/20">
                      {isNorwegian ? 'Velg alt automatisk' : 'Select Everything'}
                    </span>
                  </div>
                  <p className="text-[11px] text-ui-muted mt-0.5">
                    {isNorwegian
                      ? 'Aktiverer alle 4 pakker (Kreativ, Office, VTuber & Video) med ett klikk.'
                      : 'Automatically selects all suites and tools in one click.'}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
                    allSelected
                      ? 'bg-ui-accent border-ui-accent text-white'
                      : 'border-ui-border bg-ui-surface'
                  }`}
                >
                  {allSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              <div className="text-[11px] font-medium text-ui-muted pt-1 flex items-center justify-between">
                <span>
                  {isNorwegian
                    ? `${selectedSuites.length} av ${SUITE_DEFINITIONS.length} pakker valgt`
                    : `${selectedSuites.length} of ${SUITE_DEFINITIONS.length} suites selected`}
                </span>
                {selectedSuites.length === 0 && (
                  <span className="text-amber-500 font-medium">
                    {isNorwegian
                      ? 'Velg minst én pakke eller klikk «Alle apper»'
                      : 'Please choose at least one suite or select All'}
                  </span>
                )}
              </div>

              {/* Suite List */}
              <div className="grid grid-cols-1 gap-2.5">
                {SUITE_DEFINITIONS.map((suite) => {
                  const isSelected = selectedSuites.includes(suite.id);
                  const Icon = suite.icon;
                  return (
                    <button
                      key={suite.id}
                      type="button"
                      onClick={() => toggleSuite(suite.id)}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-ui-accent bg-ui-surface-2 ring-1 ring-ui-accent'
                          : 'border-ui-border bg-ui-bg hover:border-ui-muted'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform mt-0.5"
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${suite.color} 0%, #1e1b4b 100%)`
                            : 'var(--color-ui-surface)',
                          border: `1.5px solid ${isSelected ? suite.color : 'var(--color-ui-border)'}`,
                          color: isSelected ? '#ffffff' : 'var(--color-ui-muted)',
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ui-text">
                            {isNorwegian ? suite.nameNo : suite.nameEn}
                          </span>
                          <span className="text-[10px] text-ui-muted bg-ui-surface px-1.5 py-0.5 rounded border border-ui-border">
                            {suite.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-ui-muted mt-0.5">
                          {isNorwegian ? suite.taglineNo : suite.taglineEn}
                        </p>
                        <div className="text-[10px] text-ui-accent/90 mt-1 truncate">
                          {suite.appNames.join(' • ')}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors mt-1 ${
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
                  {isNorwegian ? 'Hvor skal arbeidet ditt lagres?' : 'Where should your work live?'}
                </h2>
                <p className="text-xs text-ui-muted mt-1">
                  {isNorwegian
                    ? 'OpenArt organiserer prosjektene og ressursene dine automatisk etter pakkene du valgte.'
                    : 'OpenArt organizes your workspace folders based on your chosen suites.'}
                </p>
              </div>

              {/* Root Directory Card */}
              <div className="p-4 rounded-xl border border-ui-border bg-ui-bg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ui-text flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-ui-accent" />
                    <span>{isNorwegian ? 'Hovedmappe for prosjekter' : 'Workspace Location'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleBrowseFolder}
                    className="btn-secondary text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{isNorwegian ? 'Endre mappe' : 'Change Folder'}</span>
                  </button>
                </div>
                <div className="px-3 py-2 bg-ui-surface border border-ui-border rounded-lg text-xs font-mono text-ui-text truncate">
                  {effectivePath}
                </div>
              </div>

              {/* Subfolders preview */}
              <div>
                <div className="text-xs font-medium text-ui-text mb-2">
                  {isNorwegian ? 'Mapper som klargjøres automatisk' : 'Folders created for you'}
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
                  <span>{isNorwegian ? 'Tilpass individuelle mapper' : 'Customize folders'}</span>
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
                  {isNorwegian ? 'Du er klar til å skape!' : 'You are ready to create!'}
                </h2>
                <p className="text-xs text-ui-muted mt-1 max-w-md mx-auto">
                  {isNorwegian
                    ? 'Innstillingene dine er lagret. Du kan installere apper, importere prosjekter og endre pakker når som helst.'
                    : 'Your workspace is configured. You can install apps and jump right into work.'}
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-xl border border-ui-border bg-ui-bg divide-y divide-ui-border overflow-hidden">
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">{isNorwegian ? 'Språk' : 'Language'}</span>
                  <span className="font-medium text-ui-text">
                    {currentLang === 'nb' ? 'Norsk (Bokmål)' : 'English'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">{isNorwegian ? 'Tema' : 'Theme'}</span>
                  <span className="font-medium text-ui-text capitalize">{currentTheme}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">{isNorwegian ? 'Valgte pakker' : 'Chosen Suites'}</span>
                  <span className="font-medium text-ui-text">
                    {selectedSuites.length === 0
                      ? (isNorwegian ? 'Ingen valgt' : 'None')
                      : selectedSuites
                          .map((id) => SUITE_DEFINITIONS.find((s) => s.id === id)?.nameNo || id)
                          .join(', ')}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-ui-muted">
                    {isNorwegian ? 'Arbeidsområde' : 'Workspace Location'}
                  </span>
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
                {isNorwegian ? 'Tilbake' : 'Back'}
              </button>
            )}
            {currentStep === 1 && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-quiet text-xs px-3 py-1.5 rounded-lg text-ui-muted hover:text-ui-text transition-colors cursor-pointer"
              >
                {isNorwegian ? 'Lukk' : 'Close'}
              </button>
            )}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                type="button"
                disabled={currentStep === 2 && selectedSuites.length === 0}
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className={`btn-primary text-xs px-5 py-2 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer ${
                  currentStep === 2 && selectedSuites.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <span>
                  {currentStep === 2 && selectedSuites.length === 0
                    ? (isNorwegian ? 'Velg en pakke' : 'Select a suite')
                    : (isNorwegian ? 'Neste' : 'Next')}
                </span>
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
                  <span>{isNorwegian ? 'Klargjør...' : 'Loading...'}</span>
                ) : (
                  <>
                    <span>{isNorwegian ? 'Åpne OpenArt Hub' : 'Open OpenArt Hub'}</span>
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
