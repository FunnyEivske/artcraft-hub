import React from 'react';
import {
  Sparkles,
  X,
  Palette,
  FolderPlus,
  Play,
  Sun,
  Globe,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChangelogModalProps {
  version?: string;
  onClose: () => void;
  onOpenOnboarding?: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  version = '1.0.7',
  onClose,
  onOpenOnboarding,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-ui-surface border border-ui-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-ui-text">
        {/* Header */}
        <div className="px-6 py-5 border-b border-ui-border bg-ui-surface flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-ui-surface-2 border border-ui-border text-ui-accent flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-ui-text tracking-tight">
                  {t('changelog.title')}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-ui-accent text-white font-medium">
                  v{version}
                </span>
              </div>
              <p className="text-xs text-ui-muted mt-0.5">
                Full UI/UX-overhaling: Mørkt & Lyst tema, flerspråklig og app-agnostisk design.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors flex items-center justify-center cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changelog Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Highlight Banner */}
          <div className="p-4 rounded-xl bg-ui-surface-2 border border-ui-border space-y-1.5">
            <span className="font-semibold text-ui-text flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-ui-accent" />
              Human-Crafted Creative Suite (Adobe CC Stil)
            </span>
            <p className="text-xs text-ui-muted leading-relaxed">
              OpenArt Hub er nå fullstendig redesignet fra bunnen av med fokus på ro, balanse og romslighet. Borte er kunstige neon-effekter og tilfeldige rammer – her er en stilren plattform bygget for kreative skapere.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {/* 1. Mørkt & Lyst tema */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sun className="w-4 h-4 text-ui-accent" />
                <span>Mørkt & Lyst tema med lynrask veksling</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Nyt ekte papirlys bakgrunn (#f6f5f3) eller dyp matt mørk (#17171a) med automatisk synkronisering mot operativsystemet ditt og umiddelbar forhåndsvisning.
              </p>
            </div>

            {/* 2. Flerspråklig */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Globe className="w-4 h-4 text-ui-accent" />
                <span>Flerspråklig støtte (English & Norsk)</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Appen støtter nå full oversettelse på både engelsk (standard) og norsk bokmål. Bytter automatisk eller etter dine ønsker i Innstillinger.
              </p>
            </div>

            {/* 3. 4-stegs Onboarding Wizard */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <FolderPlus className="w-4 h-4 text-ui-accent" />
                <span>4-stegs velkomstveiviser for verktøykasser & mapper</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Ny rolig velkomstskjerm lar deg velge hva du skaper (Foto, Maling, Vektor, 3D, Video, Lyd, Dokumenter) og setter opp tilpassede mapper automatisk i Dokumenter/OpenArt.
              </p>
            </div>

            {/* 4. App-agnostisk Hjem & Klikkbare Prosjektkort */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Play className="w-4 h-4 text-ui-accent" />
                <span>Hurtigstart & Klikkbare Filer (16:9 forhåndsvisning)</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Hjem-skjermen viser nå kun apper som faktisk er installert. Filer har fått korrekte mediatype-merker (Bilde, Vektor, 3D, Video, Audio) i stedet for den gamle mappelappen, og hele kortet kan klikkes for å åpne filen direkte.
              </p>
            </div>

            {/* 5. 4-faners Innstillinger */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sliders className="w-4 h-4 text-ui-accent" />
                <span>Organisert 4-faners Innstillinger</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Rent oppdelt i Generelt, Mapper, Apper og Avansert. Styr overvåkede mapper, overstyr kjørbare filer for Blender/Krita og inspiser lokale diagnostikklogger.
              </p>
            </div>

            {/* 6. Palett-eksport */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Palette className="w-4 h-4 text-ui-accent" />
                <span>Palett-eksport til installerte apper</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Eksporter delte fargepaletter direkte i Krita (.gpl), PhotoCraft, CSS-variabler eller JSON-format med ett klikk.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-ui-border bg-ui-surface flex items-center justify-between">
          {onOpenOnboarding ? (
            <button
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="text-xs text-ui-muted hover:text-ui-text flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-ui-accent" />
              <span>{t('settings.redoOnboarding')}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <span>{t('common.close')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
