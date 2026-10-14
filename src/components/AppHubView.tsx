import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter } from 'lucide-react';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppCard } from './AppCard';

interface AppHubViewProps {
  apps: AppReleaseInfo[];
  onLaunchNative: (appId: string) => void;
  onLaunchWeb: (app: AppReleaseInfo) => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  progressMap: Record<string, DownloadProgressPayload>;
}

export const AppHubView: React.FC<AppHubViewProps> = ({
  apps,
  onLaunchNative,
  onLaunchWeb,
  onInstall,
  progressMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['Alle', 'Foto & Piksel', 'Vektor & Mønster', 'Video', 'RAW & Farge', 'Dokument & Mønsterark', 'VFX & Motion', 'Layout & Trykk', 'UI/UX & Prototyping', 'Lyd & Miksing'];

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory =
        selectedCategory === 'Alle' || app.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        app.app_name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.alternative_to.toLowerCase().includes(query) ||
        app.file_types.some((ext) => ext.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [apps, selectedCategory, searchQuery]);

  const installedCount = apps.filter((a) => a.status === 'Installed').length;

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-[#131b2c] to-sky-950/40 p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Storytold Kreativt Økosystem</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            9 profesjonelle verktøy. Full frihet på eget skrivebord.
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Håndter, oppdater og kjør dine ArtCraft-studioer lokalt eller direkte i huben via WebAssembly. Bygget for lynrask ytelse og full kontroll over egne prosjekter.
          </p>

          <div className="mt-5 flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{installedCount} av {apps.length} apper installert</span>
            </div>
            <span>•</span>
            <span>Windows, macOS & Linux</span>
            <span>•</span>
            <span>GitHub Actions Auto-Update</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-500 ml-1 mr-1 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                  : 'bg-[#141b27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2333] border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk app, filtype (.svg, .raw, .psd)..."
            className="w-full bg-[#141b27] border border-white/5 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of the 9 ArtCraft Apps */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <AppCard
              key={app.app_id}
              app={app}
              onLaunchNative={onLaunchNative}
              onLaunchWeb={onLaunchWeb}
              onInstall={onInstall}
              progress={progressMap[app.app_id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#121926]/40 rounded-2xl border border-white/5">
          <p className="text-slate-400 text-sm">Ingen apper matchet søkekriteriene "{searchQuery}".</p>
          <button
            onClick={() => { setSelectedCategory('Alle'); setSearchQuery(''); }}
            className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
          >
            Tilbakestill filtre
          </button>
        </div>
      )}
    </div>
  );
};
