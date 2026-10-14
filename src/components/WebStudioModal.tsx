import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  Sparkles,
  Volume2,
  Play,
  Square,
} from 'lucide-react';
import { AppReleaseInfo } from '../types';

interface WebStudioModalProps {
  app: AppReleaseInfo | null;
  onClose: () => void;
}

export const WebStudioModal: React.FC<WebStudioModalProps> = ({ app, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brushColor, setBrushColor] = useState<string>(app ? app.color_accent : '#6366f1');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioFreq, setAudioFreq] = useState<number>(440);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPainting = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (!app) return;
    setBrushColor(app.color_accent);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and initialize canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative grid pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Welcome title badge inside canvas
    ctx.fillStyle = app.color_accent;
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(`${app.app_name} WebAssembly Studio`, 40, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui';
    ctx.fillText(`${app.category} • Aktiv i OpenArt Hub Sandbox`, 40, 90);
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Klikk og dra for å tegne og skape direkte på lerretet.', 40, 115);

    return () => {
      stopAudio();
    };
  }, [app]);

  if (!app) return null;

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isPainting.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isPainting.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${app.app_id}_skisse.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // SoundCraft Web Audio API Synthesizer
  const toggleAudio = () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(audioFreq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioContextRef.current = ctx;
      oscillatorRef.current = osc;
      setIsAudioPlaying(true);
    } catch {
      // Audio not supported
    }
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {
        // ignore
      }
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const handleFrequencyChange = (freq: number) => {
    setAudioFreq(freq);
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div
        className={`glass-panel border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#111724] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border border-white/10"
              style={{ backgroundColor: `${app.color_accent}25`, color: app.color_accent }}
            >
              {app.app_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{app.app_name} Web Studio</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  WebAssembly Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kjører internt i OpenArt Hub • Ingen skyavhengighet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? 'Gjenopprett størrelse' : 'Fullskjerm'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Lukk studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0a0e17]">
          {/* Left Toolbar */}
          <div className="w-full md:w-60 bg-[#0f1420] border-r border-white/5 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Verktøy & Farger
                </span>
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {[app.color_accent, '#38bdf8', '#10b981', '#ec4899', '#f59e0b', '#ffffff', '#94a3b8', '#6366f1', '#e11d48', '#0f172a'].map(
                    (hex) => (
                      <button
                        key={hex}
                        onClick={() => setBrushColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-7 h-7 rounded-lg border transition-transform ${
                          brushColor === hex ? 'scale-110 border-white shadow-md' : 'border-white/10'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Pensel/Strek:</span>
                  <span className="font-mono text-white font-bold">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Special Audio synthesizer panel if SoundCraft */}
              {app.app_id === 'soundcraft' && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Tonegenerator</span>
                    </span>
                    <button
                      onClick={toggleAudio}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        isAudioPlaying ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {isAudioPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isAudioPlaying ? 'Stopp' : 'Test lyd'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span>Frekvens: {audioFreq} Hz</span>
                    <input
                      type="range"
                      min="150"
                      max="1200"
                      value={audioFreq}
                      onChange={(e) => handleFrequencyChange(Number(e.target.value))}
                      className="w-full accent-indigo-400 mt-1 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Supported formats tip */}
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 space-y-1">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>Støttede filtyper:</span>
                </span>
                <p className="font-mono text-[10px] text-slate-500">
                  {app.file_types.join(', ')}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                onClick={clearCanvas}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tøm lerret</span>
              </button>
              <button
                onClick={downloadCanvasImage}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Eksporter PNG</span>
              </button>
            </div>
          </div>

          {/* Interactive Creative Canvas Area */}
          <div className="flex-1 p-4 md:p-6 flex items-center justify-center relative overflow-auto">
            <canvas
              ref={canvasRef}
              width={1000}
              height={620}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10 cursor-crosshair bg-[#0f172a]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
