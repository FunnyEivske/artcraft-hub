import React, { useState } from 'react';
import { AppReleaseInfo } from '../types';
import { BrandLogo } from './BrandLogo';

// Adobe Creative Cloud style 2-letter capitalization: Pc (PhotoCraft), Vc (VectorCraft), Fc (FilmCraft), etc.
const ABBREVIATIONS: Record<string, string> = {
  photocraft: 'Pc',
  vectorcraft: 'Vc',
  filmcraft: 'Fc',
  lightcraft: 'Lc',
  pdfcraft: 'Pdf',
  effectcraft: 'Ec',
  designcraft: 'Dc',
  figcraft: 'Fg',
  soundcraft: 'Sc',
  cadcraft: 'Cd',
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
  cadcraft: '#f97316', // Vivid CAD Orange (CADCraft)
  blender: '#ea580c', // Vivid Blender Orange
  krita: '#0284c7', // Vivid Krita Blue
};

export const appAbbreviation = (app: Pick<AppReleaseInfo, 'app_id' | 'app_name'>) => {
  const key = app.app_id?.toLowerCase() || '';
  if (ABBREVIATIONS[key]) return ABBREVIATIONS[key];
  const base = app.app_name.replace(/craft$/i, '');
  if (base.length >= 2) {
    return base.charAt(0).toUpperCase() + base.charAt(1).toLowerCase();
  }
  return base.toUpperCase() || '??';
};

interface AppTileProps {
  app: Pick<AppReleaseInfo, 'app_id' | 'app_name' | 'color_accent'>;
  size?: number;
}

export const AppTile: React.FC<AppTileProps> = ({ app, size = 40 }) => {
  const key = app.app_id?.toLowerCase() || '';
  const [loadError, setLoadError] = useState(false);

  // Official logo for OpenArt Hub
  if (key === 'openart-hub' || key === 'artcraft-hub') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'radial-gradient(circle at 30% 30%, #312e81 0%, #111827 100%)',
          border: '1.5px solid rgba(129, 140, 248, 0.4)',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
        }}
      >
        <BrandLogo size={Math.round(size * 0.65)} />
      </div>
    );
  }

  // Official brand logo for Blender
  if (key === 'blender') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(234, 88, 12, 0.22) 0%, #0a0d14 100%)',
          border: '1.5px solid #ea580c',
          boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.12)),
        }}
      >
        <img
          src={loadError ? '/blender.svg' : '/blender.png'}
          alt="Blender"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(234, 88, 12, 0.6))"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  // Official brand logo for Krita
  if (key === 'krita') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(2, 132, 199, 0.22) 0%, #0a0d14 100%)',
          border: '1.5px solid #0284c7',
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.12)),
        }}
      >
        <img
          src={loadError ? '/krita.svg' : '/krita.png'}
          alt="Krita"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(2, 132, 199, 0.6))"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  // ArtCraft studios with Adobe-style typography (e.g. Pc, Vc, Fc)
  const accent = VIVID_COLORS[key] || app.color_accent || '#38bdf8';
  const abbr = appAbbreviation(app);
  const isLong = abbr.length > 2;

  return (
    <div
      aria-hidden
      className="flex-shrink-0 flex items-center justify-center font-bold select-none transition-transform hover:scale-105"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 25%, #161822) 0%, #090b10 100%)`,
        border: `2px solid ${accent}`,
        boxShadow: `0 4px 14px color-mix(in srgb, ${accent} 45%, transparent), inset 0 1px 1px rgba(255,255,255,0.25)`,
        color: accent,
        fontSize: Math.round(size * (isLong ? 0.36 : 0.48)),
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        letterSpacing: isLong ? '-0.04em' : '-0.01em',
        textShadow: `0 0 12px color-mix(in srgb, ${accent} 65%, transparent)`,
      }}
    >
      {abbr}
    </div>
  );
};