import React, { useMemo } from 'react';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppCard, AppRow } from './AppCard';

interface AppHubViewProps {
  apps: AppReleaseInfo[];
  selectedCategory: string;
  searchQuery: string;
  onClearFilters: () => void;
  onLaunchNative: (appId: string) => void;
  onInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => void;
  onUninstall?: (app: AppReleaseInfo) => void;
  progressMap: Record<string, DownloadProgressPayload>;
}

const SectionHeading: React.FC<{ title: string; count: number }> = ({ title, count }) => (
  <h2 className="text-[13px] font-semibold text-ui-muted mb-2">
    {title} <span className="text-ui-faint font-normal">({count})</span>
  </h2>
);

export const AppHubView: React.FC<AppHubViewProps> = ({
  apps,
  selectedCategory,
  searchQuery,
  onClearFilters,
  onLaunchNative,
  onInstall,
  onUninstall,
  progressMap,
}) => {
  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return apps.filter((app) => {
      const matchesCategory = selectedCategory === 'Alle' || app.category === selectedCategory;
      const matchesSearch =
        !query ||
        app.app_name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.alternative_to.toLowerCase().includes(query) ||
        app.file_types.some((ext) => ext.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [apps, selectedCategory, searchQuery]);

  const installed = filteredApps.filter((a) => a.status !== 'NotInstalled');
  const available = filteredApps.filter((a) => a.status === 'NotInstalled');

  const title = selectedCategory === 'Alle' ? 'Alle apper' : selectedCategory;
  const itemProps = { onLaunchNative, onInstall, onUninstall };

  return (
    <div className="max-w-[1080px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {searchQuery ? (
          <p className="text-[13px] text-ui-muted mt-1">
            Treff for «{searchQuery}»
          </p>
        ) : (
          <p className="text-[13px] text-ui-muted mt-1">
            Komplett kreativ pakke med 10 ArtCraft-studioer (PhotoCraft, VectorCraft, CADCraft m.fl.) samt Blender og Krita.
          </p>
        )}
      </div>

      {filteredApps.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[14px] text-ui-muted">Fant ingen apper som passer.</p>
          <button onClick={onClearFilters} className="btn-secondary mt-4">
            Vis alle apper
          </button>
        </div>
      )}

      {installed.length > 0 && (
        <section className="mb-8">
          <SectionHeading title="Installert & Klare til bruk" count={installed.length} />
          <div className="rounded-lg border border-ui-border bg-ui-panel divide-y divide-ui-line">
            {installed.map((app) => (
              <AppRow key={app.app_id} app={app} progress={progressMap[app.app_id]} {...itemProps} />
            ))}
          </div>
        </section>
      )}

      {available.length > 0 && (
        <section>
          <SectionHeading title="Tilgjengelig for installasjon" count={available.length} />
          <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {available.map((app) => (
              <AppCard key={app.app_id} app={app} progress={progressMap[app.app_id]} {...itemProps} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};