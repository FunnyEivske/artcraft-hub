import React, { useMemo, useState } from 'react';
import { LayoutList, LayoutGrid, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppReleaseInfo, DownloadProgressPayload } from '../types';
import { AppCard, AppRow } from './AppCard';
import { getSelectedSuiteAppIds } from '../suites';

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

interface FilterPill {
  id: string;
  labelKey: string;
  fallback: string;
  appIds?: string[];
}

const FILTER_PILLS: FilterPill[] = [
  { id: 'all', labelKey: 'common.all', fallback: 'All' },
  {
    id: 'vtuber',
    labelKey: 'VTuber & Streaming',
    fallback: 'VTuber & Streaming',
    appIds: ['sysmocap', 'openvtuber', 'pyngtuber', 'open-llm-vtuber', 'obs'],
  },
  { id: 'video', labelKey: 'mediaTypes.video', fallback: 'Video', appIds: ['filmcraft', 'effectcraft', 'obs'] },
  { id: 'audio', labelKey: 'mediaTypes.audio', fallback: 'Audio', appIds: ['soundcraft', 'audacity'] },
  { id: 'photo', labelKey: 'toolboxes.photo.title', fallback: 'Photo', appIds: ['photocraft', 'lightcraft'] },
  { id: 'painting', labelKey: 'mediaTypes.painting', fallback: 'Painting', appIds: ['krita'] },
  { id: 'vector', labelKey: 'mediaTypes.vector', fallback: 'Vector', appIds: ['vectorcraft', 'figcraft'] },
  { id: '3d', labelKey: 'mediaTypes.threeD', fallback: '3D', appIds: ['blender', 'cadcraft'] },
  {
    id: 'office',
    labelKey: 'toolboxes.layout.title',
    fallback: 'Office & Layout',
    appIds: ['pdfcraft', 'designcraft', 'wordcraft', 'deckcraft', 'gridcraft'],
  },
];

export const AppHubView: React.FC<AppHubViewProps> = ({
  apps,
  searchQuery,
  onClearFilters,
  onLaunchNative,
  onInstall,
  onUninstall,
  progressMap,
}) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>('rows');
  const [showUnselected, setShowUnselected] = useState(false);

  // Read user's selected suites from setup
  const selectedSuiteAppIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('openart_selected_suites');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return getSelectedSuiteAppIds(parsed);
        }
      }
    } catch {
      // ignore
    }
    return getSelectedSuiteAppIds([]);
  }, []);

  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return apps.filter((app) => {
      // Pill filter
      let matchesPill = true;
      if (activeFilter !== 'all') {
        const pill = FILTER_PILLS.find((p) => p.id === activeFilter);
        if (pill?.appIds) {
          matchesPill = pill.appIds.includes(app.app_id);
        }
      }

      // Search query
      const matchesSearch =
        !query ||
        app.app_name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.alternative_to.toLowerCase().includes(query) ||
        app.file_types.some((ext) => ext.toLowerCase().includes(query));

      return matchesPill && matchesSearch;
    });
  }, [apps, activeFilter, searchQuery]);

  const installed = filteredApps.filter((a) => a.status !== 'NotInstalled');
  const available = filteredApps.filter((a) => a.status === 'NotInstalled');

  // Split available apps: Primary (matching chosen suites) vs Unselected (hidden in collapsed section)
  const mainAvailable = available.filter((a) => selectedSuiteAppIds.has(a.app_id));
  const unselectedAvailable = available.filter((a) => !selectedSuiteAppIds.has(a.app_id));

  const itemProps = { onLaunchNative, onInstall, onUninstall };

  return (
    <div className="max-w-[1120px] pb-12 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ui-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ui-text">
              {t('nav.allApps')}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-ui-surface-2 text-ui-muted border border-ui-border">
              {apps.length}
            </span>
          </div>
          <p className="text-xs text-ui-muted mt-1">
            {t('apps.subtitle', { count: apps.length })}
          </p>
        </div>

        {/* View mode toggle (Rows vs Grid) */}
        <div className="flex items-center gap-1 bg-ui-surface-2 p-1 rounded-lg border border-ui-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('rows')}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'rows'
                ? 'bg-ui-surface text-ui-text shadow-sm'
                : 'text-ui-muted hover:text-ui-text'
            }`}
            title="List view"
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-ui-surface text-ui-text shadow-sm'
                : 'text-ui-muted hover:text-ui-text'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setActiveFilter(pill.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === pill.id
                ? 'bg-ui-surface-2 text-ui-text border border-ui-border-strong font-medium shadow-none'
                : 'bg-transparent text-ui-muted hover:text-ui-text hover:bg-ui-surface-2/60 border border-transparent'
            }`}
          >
            {t(pill.labelKey) || pill.fallback}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="py-16 text-center border border-dashed border-ui-border rounded-xl bg-ui-surface/50">
          <p className="text-xs text-ui-muted">{t('apps.noResults')}</p>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('all');
              onClearFilters();
            }}
            className="btn-secondary text-xs px-3.5 py-1.5 rounded-lg mt-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('apps.clearFilters')}</span>
          </button>
        </div>
      )}

      {/* Installed Apps Section */}
      {installed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
              {t('apps.installedTitle')} ({installed.length})
            </h2>
          </div>

          {viewMode === 'rows' ? (
            <div className="rounded-xl border border-ui-border bg-ui-surface divide-y divide-ui-border">
              {installed.map((app) => (
                <AppRow
                  key={app.app_id}
                  app={app}
                  progress={progressMap[app.app_id]}
                  {...itemProps}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
              {installed.map((app) => (
                <AppCard
                  key={app.app_id}
                  app={app}
                  progress={progressMap[app.app_id]}
                  {...itemProps}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Available Apps Section (Selected in setup) */}
      {mainAvailable.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
              {t('apps.availableTitle')} ({mainAvailable.length})
            </h2>
          </div>

          {viewMode === 'rows' ? (
            <div className="rounded-xl border border-ui-border bg-ui-surface divide-y divide-ui-border">
              {mainAvailable.map((app) => (
                <AppRow
                  key={app.app_id}
                  app={app}
                  progress={progressMap[app.app_id]}
                  {...itemProps}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
              {mainAvailable.map((app) => (
                <AppCard
                  key={app.app_id}
                  app={app}
                  progress={progressMap[app.app_id]}
                  {...itemProps}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Hidden / Collapsed section for apps unselected during setup */}
      {unselectedAvailable.length > 0 && (
        <section className="pt-2">
          <button
            type="button"
            onClick={() => setShowUnselected((prev) => !prev)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-ui-border bg-ui-surface/60 hover:bg-ui-surface transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ui-surface-2 border border-ui-border flex items-center justify-center text-ui-muted group-hover:text-ui-text transition-colors">
                {showUnselected ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ui-text">
                    Flere verktøy du kan utforske
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-ui-surface-2 text-ui-muted border border-ui-border">
                    {unselectedAvailable.length} apper
                  </span>
                </div>
                <p className="text-[11px] text-ui-muted">
                  Disse pakkene ble ikke valgt i oppsettet, men du kan installere og bruke dem når som helst.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-ui-accent group-hover:underline">
              {showUnselected ? 'Skjul' : 'Vis alle apper'}
            </span>
          </button>

          {showUnselected && (
            <div className="mt-3 space-y-3 animate-in fade-in duration-200">
              {viewMode === 'rows' ? (
                <div className="rounded-xl border border-ui-border bg-ui-surface divide-y divide-ui-border">
                  {unselectedAvailable.map((app) => (
                    <AppRow
                      key={app.app_id}
                      app={app}
                      progress={progressMap[app.app_id]}
                      {...itemProps}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
                  {unselectedAvailable.map((app) => (
                    <AppCard
                      key={app.app_id}
                      app={app}
                      progress={progressMap[app.app_id]}
                      {...itemProps}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};