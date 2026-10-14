import React from 'react';
import {
  Layers,
  FolderKanban,
  Palette,
  RefreshCw,
  Sparkles,
  Monitor,
} from 'lucide-react';
import { SystemInfo } from '../types';

interface HeaderProps {
  activeTab: 'apps' | 'projects' | 'palettes' | 'updates';
  setActiveTab: (tab: 'apps' | 'projects' | 'palettes' | 'updates') => void;
  systemInfo: SystemInfo | null;
  updatesCount: number;
  onRefreshReleases: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemInfo,
  updatesCount,
  onRefreshReleases,
  isRefreshing,
}) => {
  return (
    <header className="glass-panel border-b border-white/5 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-pink-500 p-[1.5px] shadow-glow">
            <div className="w-full h-full bg-[#0d121c] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d121c]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              OpenArt Hub
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v1.0.0 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Kreativ suite for storytold ArtCraft-apper
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center p-1 bg-[#101622]/90 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveTab('apps')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'apps'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>App Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'projects'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Prosjekter & Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('palettes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'palettes'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Fargepaletter</span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'updates'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Oppdateringer</span>
          {updatesCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </nav>

      {/* System Status & Actions */}
      <div className="flex items-center gap-3">
        {systemInfo && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#121926] rounded-lg border border-white/5 text-slate-400 text-xs">
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize">{systemInfo.os}</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400">{systemInfo.arch}</span>
          </div>
        )}

        <button
          onClick={onRefreshReleases}
          disabled={isRefreshing}
          title="Synkroniser og sjekk siste releases fra storytold på GitHub"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#172030] hover:bg-[#202c42] active:scale-95 text-slate-300 hover:text-white rounded-lg border border-white/5 text-xs font-medium transition-all"
        >
          <svg className="w-3.5 h-3.5 text-sky-400 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <span>{isRefreshing ? 'Synkroniserer...' : 'Sjekk GitHub'}</span>
        </button>
      </div>
    </header>
  );
};
