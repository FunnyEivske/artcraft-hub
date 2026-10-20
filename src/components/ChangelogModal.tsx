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
  version = '1.0.13',
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
                5 nye apper, VTuber & Streaming, modulære verktøypakker og ny veiviser.
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
          <div className="p-4 rounded-xl bg-ui-surface-2 border border-ui-accent/40 space-y-1.5">
            <span className="font-semibold text-ui-text flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-ui-accent" />
              Nytt i v1.0.13: 5 nye apper, VTuber & Streaming og modulært oppsett
            </span>
            <p className="text-xs text-ui-muted leading-relaxed">
              Versjon 1.0.13 utvider OpenArt-økosystemet med 5 populære apper: SysMocap, OpenVTuber, PyNGTuber, Open-LLM-VTuber og OBS Studio. Et helt nytt førstegangsoppsett lar deg velge akkurat de verktøypakkene du trenger, med en skjult sammenleggbar seksjon i app-oversikten for resten av katalogen!
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {/* 1. 5 nye apper */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-accent/40 space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Video className="w-4 h-4 text-ui-accent" />
                <span>5 nye apper med offisielle logoer</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                SysMocap (3D webkamera motion capture), OpenVTuber (ansikts- og hodesporing), PyNGTuber (mikrofonstyrt 2D-avatar), Open-LLM-VTuber (samtalebasert AI-avatar med stemme/leppesynk) og OBS Studio (kringkasting og videoopptak) er nå fullt integrert.
              </p>
            </div>

            {/* 2. Modulært oppsett */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Layers className="w-4 h-4 text-ui-accent" />
                <span>Modulære verktøypakker i førstegangsoppsettet</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                I oppsettet velger du mellom «Kreative apper» (hele pakken fra bilde til video og lyd), «Office-pakke» (WordCraft, GridCraft, DeckCraft, PdfCraft), «VTuber & Streaming» og «Videoredigering», eller klikk «Alle apper» for å velge alt automatisk.
              </p>
            </div>

            {/* 3. Skjult sammenleggbar seksjon */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sliders className="w-4 h-4 text-ui-accent" />
                <span>Skjult / sammenleggbar seksjon for uvalgte apper</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Apper fra pakker du ikke krysset av under oppsettet forblir lett tilgjengelige i en sammenleggbar meny nederst i «Alle apper». Du kan åpne den og installere verktøyene når som helst.
              </p>
            </div>

            {/* 4. Oppdatering for alle brukere */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sun className="w-4 h-4 text-ui-accent" />
                <span>Automatisk oppsett-veiviser for eksisterende brukere</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Når du oppdaterer til v1.0.13, får du automatisk opp den nye verktøyveiviseren uten forhåndsvalgte pakker, slik at du selv kan tilpasse arbeidsflyten din.
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
              <span>{t('onboarding.setupWorkspace')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="btn-primary text-xs px-5 py-2 rounded-lg font-medium cursor-pointer shadow-sm"
          >
            {t('common.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};
