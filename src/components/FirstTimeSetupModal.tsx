import React, { useState } from 'react';
import {
  Sparkles,
  Folder,
  Check,
  FolderPlus,
  Box,
  Palette,
  Layers,
  Image,
  FileText,
  Music,
  Type,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ScannerSettings, CreativeFolderConfig } from '../types';
import {
  DEFAULT_WORKSPACE_FOLDERS,
  initOrUpdateWorkspaceFolders,
  saveScannerSettings,
} from '../services/tauri';

interface FirstTimeSetupModalProps {
  initialSettings: ScannerSettings;
  onComplete: (updatedSettings: ScannerSettings) => void;
  onClose: () => void;
}

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({
  initialSettings,
  onComplete,
  onClose,
}) => {
  const [settings, setSettings] = useState<ScannerSettings>(() => {
    return {
      ...initialSettings,
      workspaceFolders:
        initialSettings.workspaceFolders && initialSettings.workspaceFolders.length > 0
          ? initialSettings.workspaceFolders
          : DEFAULT_WORKSPACE_FOLDERS,
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleWorkspaceFolder = (folderName: string) => {
    setSettings((prev) => ({
      ...prev,
      workspaceFolders: prev.workspaceFolders.map((item) =>
        item.folderName === folderName ? { ...item, enabled: !item.enabled } : item
      ),
    }));
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

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const finalSettings: ScannerSettings = {
        ...settings,
        onboardingCompleted: true,
      };

      // 1. Initialize and create folders on disk
      await initOrUpdateWorkspaceFolders(finalSettings);

      // 2. Persist settings in Rust backend + localStorage
      await saveScannerSettings(finalSettings);
      localStorage.setItem('artcraft_onboarding_completed', 'true');

      // 3. Callback to parent
      onComplete(finalSettings);
    } catch (err) {
      console.error('Feil under opprettelse av arbeidsområde:', err);
      // Still mark completed so user isn't stuck
      localStorage.setItem('artcraft_onboarding_completed', 'true');
      onComplete({ ...settings, onboardingCompleted: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-ui-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-ui-text">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-ui-line bg-gradient-to-r from-ui-surface to-[#222226] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ui-blue/15 text-ui-blue border border-ui-blue/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-ui-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Velkommen til ArtCraft Hub!
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ui-blue/20 text-ui-blue font-semibold uppercase tracking-wider">
                  Førstegangsoppsett
                </span>
              </h2>
              <p className="text-[12px] text-ui-muted mt-0.5">
                La oss organisere ditt kreative arbeidsområde for Blender, Krita og dine kunstprosjekter.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          {/* Information box */}
          <div className="p-3.5 rounded-lg bg-ui-blue/10 border border-ui-blue/25 text-ui-text flex items-start gap-3">
            <Folder className="w-5 h-5 text-ui-blue flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white block">
                Standardplassering: Dokumenter / OpenArt
              </span>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Når du har programmer som Blender eller Krita installert, oppretter Hub-en automatisk en ryddig mappestruktur i din <strong>Dokumenter/OpenArt</strong>-mappe. Du kan beholde alle mapper, eller fjerne haken for mapper du ikke trenger nå.
              </p>
            </div>
          </div>

          {/* Creative Folders Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-400" />
                Mappene som opprettes automatisk:
              </span>
              <span className="text-[11px] text-ui-muted">
                Fjern haken for å ekskludere en mappe
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {settings.workspaceFolders.map((folder: CreativeFolderConfig) => (
                <div
                  key={folder.folderName}
                  onClick={() => toggleWorkspaceFolder(folder.folderName)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    folder.enabled
                      ? 'bg-ui-surface border-ui-blue/40 shadow-sm'
                      : 'bg-ui-surface/30 border-ui-border opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="mt-0.5">{getFolderIcon(folder.folderName)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-[12px] truncate">
                        {folder.name}
                      </span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                          folder.enabled ? 'bg-ui-blue text-white' : 'border border-ui-faint'
                        }`}
                      >
                        {folder.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-[11px] text-ui-faint font-mono block mt-0.5">
                      OpenArt/{folder.folderName}
                    </span>
                    <p className="text-[11px] text-ui-muted mt-1 leading-snug">
                      {folder.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick toggles for discovery */}
          <div className="space-y-3 pt-4 border-t border-ui-line">
            <span className="text-[13px] font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Søkeinnstillinger & Støyreduksjon
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                onClick={() => setSettings((s) => ({ ...s, scanPictures: !s.scanPictures }))}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-ui-surface/60 border border-ui-border cursor-pointer hover:bg-ui-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.scanPictures}
                  readOnly
                  className="rounded text-ui-blue focus:ring-0 cursor-pointer"
                />
                <Image className="w-4 h-4 text-purple-400" />
                <span className="text-[12px] text-white">Søk i Bilder-mappen</span>
              </label>

              <label
                onClick={() => setSettings((s) => ({ ...s, scanDocuments: !s.scanDocuments }))}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-ui-surface/60 border border-ui-border cursor-pointer hover:bg-ui-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.scanDocuments}
                  readOnly
                  className="rounded text-ui-blue focus:ring-0 cursor-pointer"
                />
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-[12px] text-white">Søk i Dokumenter-mappen</span>
              </label>

              <label
                onClick={() => setSettings((s) => ({ ...s, scanBlender: !s.scanBlender }))}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-ui-surface/60 border border-ui-border cursor-pointer hover:bg-ui-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.scanBlender}
                  readOnly
                  className="rounded text-ui-blue focus:ring-0 cursor-pointer"
                />
                <Box className="w-4 h-4 text-orange-400" />
                <span className="text-[12px] text-white">Auto-oppdag Blender .blend-historikk</span>
              </label>

              <label
                onClick={() => setSettings((s) => ({ ...s, scanKrita: !s.scanKrita }))}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-ui-surface/60 border border-ui-border cursor-pointer hover:bg-ui-surface transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.scanKrita}
                  readOnly
                  className="rounded text-ui-blue focus:ring-0 cursor-pointer"
                />
                <Palette className="w-4 h-4 text-sky-400" />
                <span className="text-[12px] text-white">Auto-oppdag Krita .kra-historikk</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-ui-line bg-ui-surface/60 flex items-center justify-between">
          <button
            onClick={() => {
              localStorage.setItem('artcraft_onboarding_completed', 'true');
              onClose();
            }}
            className="text-[12px] text-ui-muted hover:text-white transition-colors"
          >
            Hopp over for nå
          </button>

          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="btn-primary py-2 px-5 text-[13px] flex items-center gap-2 font-medium"
          >
            {isSubmitting ? (
              <span>Oppretter mapper...</span>
            ) : (
              <>
                <span>Fullfør og opprett arbeidsområde</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
