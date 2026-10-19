import React from 'react';
import { Search, RefreshCw, X, ArrowDownCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from './BrandLogo';

const GithubMark = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2z" />
  </svg>
);

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefreshReleases: () => void;
  isRefreshing: boolean;
  hasUpdatesAvailable?: boolean;
  updatesCount?: number;
  onOpenUpdatePrompt?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefreshReleases,
  isRefreshing,
  hasUpdatesAvailable = false,
  updatesCount = 0,
  onOpenUpdatePrompt,
}) => {
  const { t } = useTranslation();

  return (
    <header className="h-12 flex-shrink-0 flex items-center gap-4 px-4 bg-ui-surface border-b border-ui-border">
      {/* Brand */}
      <div className="flex items-center gap-2.5 w-[216px] flex-shrink-0">
        <BrandLogo className="w-7 h-7" size={28} />
        <span className="text-[15px] font-semibold tracking-tight text-ui-text">OpenArt</span>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-[460px]">
          <Search className="w-4 h-4 text-ui-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            className="w-full h-8 bg-ui-bg border border-ui-border rounded-full pl-9 pr-8 text-[13px] text-ui-text placeholder-ui-muted focus:outline-none focus:border-ui-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ui-muted hover:text-ui-text"
              title={t('common.close')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 w-[216px] justify-end flex-shrink-0">
        {hasUpdatesAvailable ? (
          <button
            onClick={onOpenUpdatePrompt}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ui-surface-2 border border-ui-accent text-ui-accent hover:opacity-90 transition-all text-[12px] font-medium cursor-pointer"
            title={`${t('updates.available')} (${updatesCount})`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5 text-ui-accent" />
            <span className="text-[11.5px] font-medium tracking-tight">{t('nav.updates')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-ui-accent"></span>
          </button>
        ) : (
          <button
            onClick={onRefreshReleases}
            disabled={isRefreshing}
            className="btn-quiet w-8 h-8 rounded-md flex items-center justify-center text-ui-muted hover:text-ui-text transition-colors"
            title={t('updates.check')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-ui-accent' : ''}`} />
          </button>
        )}
        <a
          href="https://github.com/storytold"
          target="_blank"
          rel="noreferrer"
          className="btn-quiet w-8 h-8 rounded-md flex items-center justify-center text-ui-muted hover:text-ui-text transition-colors"
          title="GitHub"
        >
          <GithubMark />
        </a>
      </div>
    </header>
  );
};
