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
  wordcraft: 'Wc',
  deckcraft: 'Dk',
  gridcraft: 'Gc',
  audacity: 'Au',
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
  wordcraft: '#2563eb', // Vivid Royal Blue (WordCraft)
  deckcraft: '#ea580c', // Vivid Presentation Orange (DeckCraft)
  gridcraft: '#16a34a', // Vivid Sheet Green (GridCraft)
  blender: '#ea580c', // Vivid Blender Orange
  krita: '#0284c7', // Vivid Krita Blue
  audacity: '#2563eb', // Vivid Audacity Royal Blue
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

  // Official brand logo for Audacity
  if (key === 'audacity') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(37, 99, 235, 0.25) 0%, #0a0d14 100%)',
          border: '1.5px solid #2563eb',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.1)),
        }}
      >
        <img
          src={loadError ? '/audacity.png' : '/audacity.svg'}
          alt="Audacity"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(37, 99, 235, 0.6))"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  // Official brand logo for OBS Studio
  if (key === 'obs') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.22) 0%, #090b10 100%)',
          border: '1.5px solid #3b82f6',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.12)),
        }}
      >
        <img
          src="/obs.svg"
          alt="OBS Studio"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(59, 130, 246, 0.6))"
        />
      </div>
    );
  }

  // Official brand logo for SysMocap
  if (key === 'sysmocap') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(6, 182, 212, 0.22) 0%, #090b10 100%)',
          border: '1.5px solid #06b6d4',
          boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.12)),
        }}
      >
        <img
          src="/sysmocap.png"
          alt="SysMocap"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(6, 182, 212, 0.6))"
        />
      </div>
    );
  }

  // Official brand logo for OpenVTuber
  if (key === 'openvtuber') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(236, 72, 153, 0.22) 0%, #090b10 100%)',
          border: '1.5px solid #ec4899',
          boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.12)),
        }}
      >
        <img
          src="/openvtuber.png"
          alt="OpenVTuber"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(236, 72, 153, 0.6))"
        />
      </div>
    );
  }

  // Official brand logo for PyNGTuber
  if (key === 'pyngtuber') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.22) 0%, #090b10 100%)',
          border: '1.5px solid #a855f7',
          boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.1)),
        }}
      >
        <img
          src="/pyngtuber.png"
          alt="PyNGTuber"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(168, 85, 247, 0.6))"
        />
      </div>
    );
  }

  // Official brand logo for Open-LLM-VTuber
  if (key === 'open-llm-vtuber') {
    return (
      <div
        aria-hidden
        className="flex-shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.22) 0%, #090b10 100%)',
          border: '1.5px solid #8b5cf6',
          boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35), inset 0 1px 1px rgba(255,255,255,0.25)',
          padding: Math.max(2, Math.round(size * 0.1)),
        }}
      >
        <img
          src="/open-llm-vtuber.png"
          alt="Open-LLM-VTuber"
          className="w-full h-full object-contain filter drop-shadow(0 1px 4px rgba(139, 92, 246, 0.6))"
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