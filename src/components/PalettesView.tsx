import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Copy,
  Check,
  Trash2,
  Download,
  X,
} from 'lucide-react';
import { ColorPalette, ColorSwatch } from '../types';

interface PalettesViewProps {
  palettes: ColorPalette[];
  onSavePalettes: (palettes: ColorPalette[]) => void;
}

export const PalettesView: React.FC<PalettesViewProps> = ({
  palettes,
  onSavePalettes,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New palette form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColors, setNewColors] = useState<ColorSwatch[]>([
    { hex: '#6366f1', name: 'Accent Primary' },
    { hex: '#06b6d4', name: 'Cyan Glow' },
    { hex: '#ec4899', name: 'Vibrant Magenta' },
    { hex: '#f59e0b', name: 'Warm Amber' },
  ]);

  const [pickerHex, setPickerHex] = useState('#10b981');
  const [pickerName, setPickerName] = useState('Emerald Green');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const hexToRgb = (hex: string): string => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map((char) => char + char).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleAddColorToNewPalette = () => {
    if (!pickerHex) return;
    setNewColors([...newColors, { hex: pickerHex, name: pickerName || 'Farge' }]);
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
      description: newDesc.trim() || 'Egendefinert palett for ArtCraft.',
      colors: newColors,
    };

    const updated = [...palettes, newPal];
    onSavePalettes(updated);
    setNewName('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const handleDeletePalette = (id: string) => {
    const updated = palettes.filter((p) => p.id !== id);
    onSavePalettes(updated);
  };

  const exportAsCss = (palette: ColorPalette) => {
    const css = `:root {\n${palette.colors
      .map((c, i) => `  --color-${c.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}: ${c.hex};`)
      .join('\n')}\n}`;
    copyToClipboard(css);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <span>Felles Ressursbank & Fargepaletter</span>
          </h2>
          <p className="text-xs text-slate-400">
            Globale fargeprofiler og tokens lagret i ~/ArtCraftHub/Assets/palettes.json
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ny Fargepalett</span>
        </button>
      </div>

      {/* Palettes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {palettes.map((palette) => (
          <div
            key={palette.id}
            className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 flex flex-col justify-between"
          >
            <div>
              {/* Palette Card Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white">{palette.name}</h3>
                  <p className="text-xs text-slate-400">{palette.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => exportAsCss(palette)}
                    title="Kopier som CSS variabler (:root)"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePalette(palette.id)}
                    title="Slett denne paletten"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Swatches Banner Bar */}
              <div className="h-10 w-full rounded-xl overflow-hidden flex shadow-inner border border-white/5 my-3">
                {palette.colors.map((c, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: c.hex }}
                    className="flex-1 h-full cursor-pointer transition-transform hover:scale-105"
                    onClick={() => copyToClipboard(c.hex)}
                    title={`Klikk for å kopiere ${c.name} (${c.hex})`}
                  />
                ))}
              </div>

              {/* Swatch Details List with 1-Click Copy */}
              <div className="space-y-1.5 pt-1">
                {palette.colors.map((c, i) => {
                  const isCopied = copiedHex === c.hex;
                  return (
                    <div
                      key={i}
                      onClick={() => copyToClipboard(c.hex)}
                      className="group flex items-center justify-between p-2 rounded-xl bg-[#111723]/60 hover:bg-[#182132] border border-white/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs font-medium text-slate-300">{c.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors">
                          {c.hex}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                          {hexToRgb(c.hex)}
                        </span>
                        <div className="p-1 text-slate-400 group-hover:text-indigo-400">
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
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

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <span>{palette.colors.length} farge-swatches</span>
              <span>Klikk farge for HEX/RGB-kopiering</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Palette Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Palette className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ny Global Fargepalett</h3>
                <p className="text-xs text-slate-400">Lagres i ~/ArtCraftHub/Assets/palettes.json</p>
              </div>
            </div>

            <form onSubmit={handleCreatePaletteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Palettnavn</label>
                <input
                  type="text"
                  required
                  placeholder="f.eks. Mørk Minimalisme 2026"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111722] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Beskrivelse</label>
                <input
                  type="text"
                  placeholder="Formål, bruksområde..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#111722] border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Swatches in new palette */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Farger ({newColors.length})</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {newColors.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-[#0e141f] border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs text-slate-300">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{c.hex}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColorFromNew(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add color tool */}
              <div className="p-3 rounded-xl bg-[#0e141f] border border-white/5 flex items-center gap-3">
                <input
                  type="color"
                  value={pickerHex}
                  onChange={(e) => setPickerHex(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={pickerName}
                  onChange={(e) => setPickerName(e.target.value)}
                  placeholder="Fargenavn"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#141b27] border border-white/10 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddColorToNewPalette}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  Legg til
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                >
                  Lagre Palett
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
