import React from 'react';
import {
  Sparkles,
  X,
  Box,
  Palette,
  Download,
  FolderPlus,
  RefreshCw,
  Camera,
  ArrowRight,
} from 'lucide-react';

interface ChangelogModalProps {
  version?: string;
  onClose: () => void;
  onOpenOnboarding?: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  version = '1.0.1',
  onClose,
  onOpenOnboarding,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-ui-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-ui-text">
        {/* Header */}
        <div className="px-6 py-5 border-b border-ui-line bg-gradient-to-r from-ui-surface via-[#1e1e24] to-[#18181b] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Hva er nytt i OpenArt Hub
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                  v{version}
                </span>
              </div>
              <p className="text-[12px] text-ui-muted mt-0.5">
                Oppdateringslogg med alle forbedringer siden v1.0.0
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-ui-muted hover:text-white hover:bg-ui-surface transition-colors flex items-center justify-center"
            title="Lukk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changelog Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          {/* Highlight Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-ui-blue/15 border border-purple-500/30 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-2 text-[14px]">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Kreativt arbeidsområde, ekte filhistorikk & moderne oppsett
            </span>
            <p className="text-[12px] text-ui-muted leading-relaxed">
              De siste dagene har vi oppgradert OpenArt Hub med full organisering for Blender- og Krita-ressurser, filtrering av skjermbilder, og en moderne 1-klikks installasjonsopplevelse!
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {/* 1. Kreativt Arbeidsområde */}
            <div className="p-4 rounded-xl bg-ui-surface/60 border border-ui-border space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <FolderPlus className="w-4 h-4 text-orange-400" />
                <span>Kreativt Arbeidsområde (Dokumenter / OpenArt)</span>
              </div>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Når du åpner appen, oppretter den automatisk standardmapper for Blender (Prosjekter & Assets), Teksturer, Børster, Referanser, Lydeffekter og Vektorer i din Dokumenter-mappe. Du kan tilpasse eller velge bort mapper etter eget ønske.
              </p>
            </div>

            {/* 2. Ekte Blender & Krita Historikk */}
            <div className="p-4 rounded-xl bg-ui-surface/60 border border-ui-border space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Box className="w-4 h-4 text-sky-400" />
                <span>Ekte app-historikk (Blender & Krita)</span>
              </div>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Hub-en leser nå direkte fra Blenders interne <code className="text-orange-300 bg-white/5 px-1 py-0.5 rounded text-[11px]">recent-files.txt</code> og Kritas <code className="text-sky-300 bg-white/5 px-1 py-0.5 rounded text-[11px]">kritarc</code> på tvers av Windows (%APPDATA%), macOS og Linux.
              </p>
            </div>

            {/* 3. Skjermbilde-filtrering */}
            <div className="p-4 rounded-xl bg-ui-surface/60 border border-ui-border space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Camera className="w-4 h-4 text-rose-400" />
                <span>Intelligent skjermbilde-filtrering</span>
              </div>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Skjermklipp fra Utklippsverktøy (Snipping Tool) og tastatursnarveier (Win+Shift+S / PrtScn) filtreres nå automatisk bort, slik at hjemmeskjermen din forblir ren og kun viser ekte kunstverk og prosjekter. Kan overstyres i Innstillinger.
              </p>
            </div>

            {/* 4. Moderne 1-klikk Windows-installer */}
            <div className="p-4 rounded-xl bg-ui-surface/60 border border-ui-border space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Moderne 1-klikk installasjon (Discord / Spotify-stil)</span>
              </div>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Borte er 90-talls dialogbokser og skumle Windows UAC-advarsler. Installasjonsprogrammet kjører lynraskt, legger snarvei på skrivebordet og starter appen automatisk. Ved avinstallasjon kan du velge å rense lagrede innstillinger med ett klikk.
              </p>
            </div>

            {/* 5. Oppdateringssenter & Live Varsling */}
            <div className="p-4 rounded-xl bg-ui-surface/60 border border-ui-border space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                <span>Sanntids oppdateringsvarsling</span>
              </div>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Når nye oppdateringer er klare, forvandles oppdateringsikonet i toppmenyen til en grønn, pulserende nedlastingsknapp. Du får se endringsnotater og sanntids nedlastingsfremgang før installeren starter automatisk.
              </p>
            </div>

            {/* 6. Restart Onboarding */}
            <div className="p-4 rounded-xl bg-ui-surface/60 border border-ui-border space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Restart / Redo Onboarding i Innstillinger</span>
              </div>
              <p className="text-[12px] text-ui-muted leading-relaxed">
                Vil du endre oppsettet eller konfigurere mappene på nytt? Du finner nå en dedikert <strong>«Restart / Redo Onboarding»</strong>-knapp i Innstillinger som lar deg kjøre gjennom veiviseren når som helst.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-ui-line bg-ui-surface/60 flex items-center justify-between">
          {onOpenOnboarding ? (
            <button
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="text-[12px] text-purple-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Åpne mappe-veiviser nå</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="btn-primary py-2 px-5 text-[13px] flex items-center gap-2 font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-900/30"
          >
            <span>Kult, la oss skape!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
