import React from 'react';
import {
  Sparkles,
  X,
  Sun,
  Sliders,
  ArrowRight,
  Video,
  Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChangelogModalProps {
  version?: string;
  onClose: () => void;
  onOpenOnboarding?: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  version = '1.0.14',
  onClose,
  onOpenOnboarding,
}) => {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb' || i18n.language?.startsWith('no');

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
                  {t('changelog.title') || (isNorwegian ? 'Hva er nytt i OpenArt Hub' : 'What\'s New in OpenArt Hub')}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-ui-accent text-white font-medium">
                  v{version}
                </span>
              </div>
              <p className="text-xs text-ui-muted mt-0.5">
                {isNorwegian
                  ? 'Installasjonskø, prioritert Hub-oppdatering og PhotoCraft v0.16.0-støtte.'
                  : 'Install queue, prioritized Hub updates, and official PhotoCraft v0.16.0 support.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors flex items-center justify-center cursor-pointer"
            title={t('common.close') || (isNorwegian ? 'Lukk' : 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changelog Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Highlight Banner */}
          <div className="p-4 rounded-xl bg-ui-surface-2 border border-ui-accent/40 space-y-1.5">
            <span className="font-semibold text-ui-text flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-ui-accent" />
              {isNorwegian
                ? 'Nytt i v1.0.14: Installasjonskø, prioritert Hub-oppdatering og PhotoCraft'
                : 'New in v1.0.14: Sequential Install Queue, Prioritized Hub Updates, and PhotoCraft'}
            </span>
            <p className="text-xs text-ui-muted leading-relaxed">
              {isNorwegian
                ? 'Versjon 1.0.14 introduserer en komplett installasjons- og oppdateringskø slik at apper installeres én etter én uten kollisjoner. OpenArt Hub har alltid høyeste prioritet, og PhotoCraft henter nå offisielle v0.16.0-pakker direkte fra storytold!'
                : 'Version 1.0.14 introduces a robust install and update queue so apps download and install sequentially without conflicts. OpenArt Hub self-updates are always prioritized first, and PhotoCraft now pulls official v0.16.0 releases directly from storytold!'}
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {/* 1. 5 new apps */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-accent/40 space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Video className="w-4 h-4 text-ui-accent" />
                <span>
                  {isNorwegian
                    ? '5 nye apper med offisielle logoer'
                    : '5 New Apps with Official Brand Logos'}
                </span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                {isNorwegian
                  ? 'SysMocap (3D webkamera motion capture), OpenVTuber (ansikts- og hodesporing), PyNGTuber (mikrofonstyrt 2D-avatar), Open-LLM-VTuber (samtalebasert AI-avatar med stemme/leppesynk) og OBS Studio (kringkasting og videoopptak) er nå fullt integrert.'
                  : 'SysMocap (3D webcam motion capture), OpenVTuber (face and head tracking), PyNGTuber (reactive 2D PNGtuber), Open-LLM-VTuber (conversational AI avatar with speech & lip-sync), and OBS Studio (live broadcasting & recording) are now fully integrated.'}
              </p>
            </div>

            {/* 2. Modular suites */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Layers className="w-4 h-4 text-ui-accent" />
                <span>
                  {isNorwegian
                    ? 'Modulære verktøypakker i førstegangsoppsettet'
                    : 'Modular Tool Suites in First-Time Setup'}
                </span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                {isNorwegian
                  ? 'I oppsettet velger du mellom «Kreative apper» (hele pakken fra bilde til video og lyd), «Office-pakke» (WordCraft, GridCraft, DeckCraft, PdfCraft), «VTuber & Streaming» og «Videoredigering», eller klikk «Alle apper» for å velge alt automatisk.'
                  : 'In the setup wizard, choose between Creative Suite (full photo, 3D, video and audio stack), Office Suite (WordCraft, GridCraft, DeckCraft, PdfCraft), VTuber & Streaming, and Video Production, or click «All Apps» to select everything automatically.'}
              </p>
            </div>

            {/* 3. Collapsed unselected section */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sliders className="w-4 h-4 text-ui-accent" />
                <span>
                  {isNorwegian
                    ? 'Skjult / sammenleggbar seksjon for uvalgte apper'
                    : 'Collapsed Section for Unselected Tools'}
                </span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                {isNorwegian
                  ? 'Apper fra pakker du ikke krysset av under oppsettet forblir lett tilgjengelige i en sammenleggbar meny nederst i «Alle apper». Du kan åpne den og installere verktøyene når som helst.'
                  : 'Tools from suites you did not check during setup remain readily accessible in a collapsed section at the bottom of All Apps. You can unfold it and install them whenever you wish.'}
              </p>
            </div>

            {/* 4. Automatic setup */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sun className="w-4 h-4 text-ui-accent" />
                <span>
                  {isNorwegian
                    ? 'Automatisk oppsett-veiviser for eksisterende brukere'
                    : 'Automatic Suite Setup for Upgrading Users'}
                </span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                {isNorwegian
                  ? 'Når du oppdaterer til v1.0.13, får du automatisk opp den nye verktøyveiviseren uten forhåndsvalgte pakker, slik at du selv kan tilpasse arbeidsflyten din.'
                  : 'When updating to v1.0.13, you are automatically prompted with the new suite wizard with nothing pre-selected so you can tailor your workflow to your preferences.'}
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
              <span>
                {t('onboarding.setupWorkspace') ||
                  (isNorwegian ? 'Klargjør arbeidsområde' : 'Setup Workspace')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="btn-primary text-xs px-5 py-2 rounded-lg font-medium cursor-pointer shadow-sm"
          >
            {t('common.gotIt') || (isNorwegian ? 'Forstått' : 'Got it')}
          </button>
        </div>
      </div>
    </div>
  );
};
