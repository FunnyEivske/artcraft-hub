import React from 'react';
import { AppReleaseInfo } from '../types';

// Two-letter marks, the way a desktop suite labels its apps.
const ABBREVIATIONS: Record<string, string> = {
  photocraft: 'Ph',
  vectorcraft: 'Vc',
  filmcraft: 'Fm',
  lightcraft: 'Lc',
  pdfcraft: 'Pd',
  effectcraft: 'Ef',
  designcraft: 'Dc',
  figcraft: 'Fg',
  soundcraft: 'Sd',
};

export const appAbbreviation = (app: Pick<AppReleaseInfo, 'app_id' | 'app_name'>) => {
  const known = ABBREVIATIONS[app.app_id];
  if (known) return known;
  const base = app.app_name.replace(/craft$/i, '');
  return (base.charAt(0).toUpperCase() + (base.charAt(1) || '').toLowerCase()) || '?';
};

interface AppTileProps {
  app: Pick<AppReleaseInfo, 'app_id' | 'app_name' | 'color_accent'>;
  size?: number;
}

export const AppTile: React.FC<AppTileProps> = ({ app, size = 40 }) => {
  const accent = app.color_accent || '#888888';
  return (
    <div
      aria-hidden
      className="flex-shrink-0 flex items-center justify-center font-bold select-none"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: `color-mix(in srgb, ${accent} 20%, #101010)`,
        color: `color-mix(in srgb, ${accent} 80%, #ffffff)`,
        fontSize: Math.round(size * 0.42),
        letterSpacing: '-0.02em',
      }}
    >
      {appAbbreviation(app)}
    </div>
  );
};
