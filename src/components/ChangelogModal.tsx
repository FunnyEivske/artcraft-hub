import React from 'react';
import {
  Sparkles,
  X,
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
  version = '1.0.12',
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
                Offisiell Audacity-logo, feilrettet oppdateringsinstallatør med UAC og renere grensesnitt.
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
              Nytt i v1.0.12: Offisiell Audacity-logo & Fikset oppdateringsprosess
            </span>
            <p className="text-xs text-ui-muted leading-relaxed">
              Versjon 1.0.12 tar i bruk den ekte, offisielle Audacity-merkevarelogoen (hodetelefoner med lydbølge) i stedet for tekstforkortelsen «Au», og løser oppdateringsproblemet: Installatøren lastes ned direkte fra GitHub Releases som ekte kjørbart program (.exe / .msi) og starter med automatisk Windows UAC-administratorgodkjenning.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {/* 1. Audacity Logo */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-accent/40 space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Play className="w-4 h-4 text-ui-accent" />
                <span>Offisiell Audacity-logo integrert</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Audacity prydes nå med sitt offisielle merkevareikon på tvers av hele appen: i app-katalogen, på hjem-skjermen og i hurtigstart. Full støtte for .aup3-prosjekter og lydformater (.wav, .mp3, .flac, .ogg).
              </p>
            </div>

            {/* 2. Oppdateringsprosess */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sun className="w-4 h-4 text-ui-accent" />
                <span>Feilrettet selvoppdaterer & UAC-administratoroppstart</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Når du klikker oppdater, lastes den nyeste installatøren ned direkte som en ekte installatørfil. Hub-en starter installasjonsprogrammet med nødvendige administratorrettigheter og lukkes automatisk slik at oppdateringen kan fullføres umiddelbart uten filkonflikter.
              </p>
            </div>

            {/* 3. Ekte installasjonskontroll */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sliders className="w-4 h-4 text-ui-accent" />
                <span>Ekte installasjonskontroll & Filverifisering</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                OpenArt Hub venter nå på at installasjonsprogrammer fullføres, og verifiserer at den kjørbare filen faktisk eksisterer på disken før en app markeres som installert. Avbrutte installasjoner fjernes automatisk.
              </p>
            </div>

            {/* 4. Overlappende handlingsmeny */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Sparkles className="w-4 h-4 text-ui-accent" />
                <span>3-prikkers meny tegnes over appen uten avskjæring</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Handlingsmenyen åpnes i en React-portal over alle andre elementer med høyeste lagprioritet (z-index), og flipper oppover når knappen er nær bunnen av vinduet.
              </p>
            </div>

            {/* 5. Oversettelser & Rent grensesnitt */}
            <div className="p-3.5 rounded-xl bg-ui-bg border border-ui-border space-y-1">
              <div className="flex items-center gap-2 text-ui-text font-medium">
                <Globe className="w-4 h-4 text-ui-accent" />
                <span>Fikset menytekster & Fjernet «Alternativ til»-merkelapper</span>
              </div>
              <p className="text-ui-muted leading-relaxed">
                Alle elementer i 3-prikkers menyen vises med ren tekst på gjeldende språk uten synlige nøkkelnavn, og «Alternativ til»-merkelappene er fjernet for et minimalistisk utseende.
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
