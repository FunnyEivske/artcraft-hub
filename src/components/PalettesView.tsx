import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Copy,
  Check,
  Trash2,
  Download,
  X,
  Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ColorPalette, ColorSwatch, AppReleaseInfo } from '../types';

interface PalettesViewProps {
  palettes: ColorPalette[];
  allApps?: AppReleaseInfo[];
  onSavePalettes: (palettes: ColorPalette[]) => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const PalettesView: React.FC<PalettesViewProps> = ({
  palettes,
  allApps = [],
  onSavePalettes,
  onShowToast,
}) => {
  const { t } = useTranslation();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeExportMenuId, setActiveExportMenuId] = useState<string | null>(null);

  // New palette form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColors, setNewColors] = useState<ColorSwatch[]>([
    { hex: '#3b82f6', name: 'Primary Accent' },
    { hex: '#10b981', name: 'Emerald' },
    { hex: '#f59e0b', name: 'Warm Amber' },
    { hex: '#8b5cf6', name: 'Purple Mist' },
  ]);

  const [pickerHex, setPickerHex] = useState('#ec4899');
  const [pickerName, setPickerName] = useState('Rose Pink');

  // Apps that can accept exported color palettes
  const paletteTargetIds = ['photocraft', 'krita', 'vectorcraft', 'figcraft', 'designcraft'];
  const installedPaletteApps = allApps.filter(
    (a) => paletteTargetIds.includes(a.app_id) && a.status !== 'NotInstalled'
  );

  const copyToClipboard = (text: string, msg?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    if (onShowToast) {
      onShowToast(msg || t('common.copied'), 'success');
    }
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map((char) => char + char).join('');
    }
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const handleAddColorToNewPalette = () => {
    if (!pickerHex) return;
    setNewColors([...newColors, { hex: pickerHex, name: pickerName || 'Color' }]);
    setPickerName('');
  };

  const handleRemoveColorFromNew = (index: number) => {
    setNewColors(newColors.filter((_, i) => i !== index));
  };

  const handleCreatePaletteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newColors.length === 0) return;

    const newPal: ColorPalette = {
      id: `palette-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom creative palette.',
      colors: newColors,
    };

    const updated = [...palettes, newPal];
    onSavePalettes(updated);
    setNewName('');
    setNewDesc('');
    setShowAddModal(false);
    if (onShowToast) {
      onShowToast(t('common.success'), 'success');
    }
  };

  const handleDeletePalette = (id: string) => {
    const updated = palettes.filter((p) => p.id !== id);
    onSavePalettes(updated);
  };

  // Export formats
  const exportAsCss = (palette: ColorPalette) => {
    const css = `:root {\n${palette.colors
      .map((c, i) => `  --color-${c.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}: ${c.hex};`)
      .join('\n')}\n}`;
    copyToClipboard(css, `CSS :root for "${palette.name}" copied!`);
    setActiveExportMenuId(null);
  };

  const exportAsGpl = (palette: ColorPalette) => {
    // GIMP/Krita Palette format (.gpl)
    const header = `GIMP Palette\nName: ${palette.name}\nColumns: 4\n#\n`;
    const lines = palette.colors
      .map((c) => {
        const { r, g, b } = hexToRgb(c.hex);
        return `${r.toString().padStart(3, ' ')} ${g.toString().padStart(3, ' ')} ${b.toString().padStart(3, ' ')}\t${c.name}`;
      })
      .join('\n');
    const fullGpl = header + lines;
    copyToClipboard(fullGpl, `GPL palette for Krita copied!`);
    setActiveExportMenuId(null);
  };

  const exportForApp = (app: AppReleaseInfo, palette: ColorPalette) => {
    if (app.app_id === 'krita') {
      exportAsGpl(palette);
    } else {
      exportAsCss(palette);
    }
    if (onShowToast) {
      onShowToast(`Palette "${palette.name}" exported for ${app.app_name}!`, 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-[1080px] pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ui-text">
            {t('palettes.title')}
          </h1>
          <p className="text-xs text-ui-muted mt-1">
            {t('palettes.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('palettes.newPalette')}</span>
        </button>
      </div>

      {/* Palettes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {palettes.map((palette) => {
          const isMenuOpen = activeExportMenuId === palette.id;

          return (
            <div
              key={palette.id}
              className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4 flex flex-col justify-between shadow-sm hover:border-ui-border-strong transition-all duration-150"
            >
              <div>
                {/* Palette Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-ui-text truncate">
                      {palette.name}
                    </h3>
                    <p className="text-xs text-ui-muted truncate mt-0.5">
                      {palette.description}
                    </p>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-1.5 relative">
                    {/* Export Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveExportMenuId(isMenuOpen ? null : palette.id)}
                        title="Export palette"
                        className="btn-quiet p-1.5 rounded-lg text-ui-muted hover:text-ui-text cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-8 z-30 w-52 py-1 rounded-xl bg-ui-surface border border-ui-border shadow-xl text-xs animate-in fade-in duration-100">
                          {installedPaletteApps.length > 0 && (
                            <>
                              <div className="px-3 py-1 text-[10px] font-medium text-ui-muted uppercase tracking-wider">
                                Export to App
                              </div>
                              {installedPaletteApps.map((app) => (
                                <button
                                  key={app.app_id}
                                  type="button"
                                  onClick={() => exportForApp(app, palette)}
                                  className="w-full h-7 px-3 flex items-center justify-between text-xs text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer text-left"
                                >
                                  <span>{app.app_name}</span>
                                  <span className="text-[10px] text-ui-muted font-mono">
                                    {app.app_id === 'krita' ? '.gpl' : 'CSS'}
                                  </span>
                                </button>
                              ))}
                              <div className="my-1 border-t border-ui-border" />
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => exportAsCss(palette)}
                            className="w-full h-7 px-3 flex items-center gap-2 text-xs text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer text-left"
                          >
                            <Download className="w-3 h-3 text-ui-muted" />
                            <span>Copy CSS variables</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportAsGpl(palette)}
                            className="w-full h-7 px-3 flex items-center gap-2 text-xs text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer text-left"
                          >
                            <Download className="w-3 h-3 text-ui-muted" />
                            <span>Copy Krita / GPL format</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePalette(palette.id)}
                      title="Delete palette"
                      className="btn-quiet p-1.5 rounded-lg text-ui-muted hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Swatches Banner Bar */}
                <div className="h-9 w-full rounded-lg overflow-hidden flex border border-ui-border my-3">
                  {palette.colors.map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c.hex }}
                      className="flex-1 h-full cursor-pointer transition-transform hover:scale-105"
                      onClick={() => copyToClipboard(c.hex, `Copied ${c.name} (${c.hex})`)}
                      title={`Click to copy ${c.name} (${c.hex})`}
                    />
                  ))}
                </div>

                {/* Swatch Details List */}
                <div className="space-y-1.5 pt-1">
                  {palette.colors.map((c, i) => {
                    const isCopied = copiedHex === c.hex;
                    const rgb = hexToRgb(c.hex);

                    return (
                      <div
                        key={i}
                        onClick={() => copyToClipboard(c.hex, `Copied ${c.hex}`)}
                        className="group flex items-center justify-between p-2 rounded-lg bg-ui-bg hover:bg-ui-surface-2 border border-ui-border cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-4 h-4 rounded-md border border-ui-border shadow-xs"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-xs font-medium text-ui-text">{c.name}</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-ui-muted group-hover:text-ui-text transition-colors">
                            {c.hex}
                          </span>
                          <span className="text-ui-muted hidden sm:inline text-[10px]">
                            rgb({rgb.r}, {rgb.g}, {rgb.b})
                          </span>
                          <div className="p-0.5 text-ui-muted group-hover:text-ui-accent">
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-ui-border flex items-center justify-between text-[11px] text-ui-muted">
                <span>{palette.colors.length} swatches</span>
                <span>Click swatch to copy</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Palette Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-ui-surface border border-ui-border rounded-2xl shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-ui-muted hover:text-ui-text hover:bg-ui-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-ui-surface-2 border border-ui-border flex items-center justify-center text-ui-accent">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ui-text">
                  {t('palettes.newPalette')}
                </h3>
                <p className="text-xs text-ui-muted">
                  Saved across OpenArt creative suite
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePaletteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ui-text mb-1">
                  Palette Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nordic Sunrise"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-ui-bg border border-ui-border text-ui-text text-xs focus:outline-none focus:border-ui-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ui-text mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Purpose or theme..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-ui-bg border border-ui-border text-ui-text text-xs focus:outline-none focus:border-ui-accent"
                />
              </div>

              {/* Swatches in new palette */}
              <div>
                <label className="block text-xs font-medium text-ui-text mb-1">
                  Colors ({newColors.length})
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {newColors.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-ui-bg border border-ui-border"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-ui-border"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs text-ui-text">{c.name}</span>
                        <span className="text-[10px] font-mono text-ui-muted">{c.hex}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorFromNew(idx)}
                        className="text-ui-muted hover:text-red-400 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add color tool */}
              <div className="p-2.5 rounded-lg bg-ui-bg border border-ui-border flex items-center gap-2.5">
                <input
                  type="color"
                  value={pickerHex}
                  onChange={(e) => setPickerHex(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={pickerName}
                  onChange={(e) => setPickerName(e.target.value)}
                  placeholder="Color Name"
                  className="flex-1 h-7 px-2.5 rounded-md bg-ui-surface border border-ui-border text-xs text-ui-text focus:outline-none focus:border-ui-accent"
                />
                <button
                  type="button"
                  onClick={handleAddColorToNewPalette}
                  className="btn-secondary text-xs h-7 px-3 rounded-md cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-ui-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-quiet text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-1.5 rounded-lg cursor-pointer"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
