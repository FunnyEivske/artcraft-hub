import React from 'react';
import { AppReleaseInfo } from '../types';

// Distinct Craft abbreviations: PC (PhotoCraft), VC (VectorCraft), FC (FilmCraft), LC (LightCraft), etc.
const ABBREVIATIONS: Record<string, string> = {
  photocraft: 'PC',
  vectorcraft: 'VC',
  filmcraft: 'FC',
  lightcraft: 'LC',
  pdfcraft: 'PDF',
  effectcraft: 'EC',
  designcraft: 'DC',
  figcraft: 'FG',
  soundcraft: 'SC',
};

// Saturated, distinct, vivid studio colors
const VIVID_COLORS: Record<string, string> = {
  photocraft: '#38bdf8', // Vivid Sky Cyan (PhotoCraft)
  vectorcraft: '#f59e0b', // Vivid Amber Gold (VectorCraft)
  filmcraft: '#ec4899', // Vivid Neon Rose (FilmCraft)
  lightcraft: '#06b6d4', // Vivid Electric Turquoise (LightCraft)
  pdfcraft: '#ef4444', // Vivid Bright Red (PdfCraft)
  effectcraft: '#a855f7', // Vivid Purple (EffectCraft)
  designcraft: '#e11d48', // Vivid Crimson Pink (DesignCraft)
  figcraft: '#10b981', // Vivid Emerald Green (FigCraft)
  soundcraft: '#6366f1', // Vivid Indigo (SoundCraft)
};

export const appAbbreviation = (app: Pick<AppReleaseInfo, 'app_id' | 'app_name'>) => {
  const key = app.app_id?.toLowerCase() || '';
  if (ABBREVIATIONS[key]) return ABBREVIATIONS[key];
  const base = app.app_name.replace(/craft$/i, '');
  return base.slice(0, 2).toUpperCase() || '??';
};

interface AppTileProps {
  app: Pick<AppReleaseInfo, 'app_id' | 'app_name' | 'color_accent'>;
  size?: number;
}

export const AppTile: React.FC<AppTileProps> = ({ app, size = 40 }) => {
  const key = app.app_id?.toLowerCase() || '';
  const accent = VIVID_COLORS[key] || app.color_accent || '#38bdf8';
  const abbr = appAbbreviation(app);
  const isLong = abbr.length > 2;

  return (
    <div
      aria-hidden
      className="flex-shrink-0 flex items-center justify-center font-extrabold select-none transition-transform hover:scale-105"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        background: `linear-gradient(140deg, color-mix(in srgb, ${accent} 28%, #141824) 0%, #0a0d14 100%)`,
        border: `2px solid ${accent}`,
        boxShadow: `0 4px 14px color-mix(in srgb, ${accent} 45%, transparent), inset 0 1px 1px rgba(255,255,255,0.25)`,
        color: accent,
        fontSize: Math.round(size * (isLong ? 0.35 : 0.46)),
        letterSpacing: '-0.02em',
        textShadow: `0 0 10px color-mix(in srgb, ${accent} 70%, transparent)`,
      }}
    >
      {abbr}
    </div>
  );
};
