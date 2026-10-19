import React from 'react';
import {
  Home,
  LayoutGrid,
  ArrowDownCircle,
  FolderOpen,
  Palette,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SystemInfo } from '../types';

export type HubTab = 'home' | 'apps' | 'projects' | 'palettes' | 'updates' | 'settings';

interface SidebarProps {
  activeTab: HubTab;
  onSelectTab: (tab: HubTab) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  appCount: number;
  updatesCount: number;
  systemInfo: SystemInfo | null;
}

const Item: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  trailing?: React.ReactNode;
}> = ({ active, onClick, icon: Icon, label, trailing }) => (
  <button
    onClick={onClick}
    className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-md text-[13px] text-left transition-colors cursor-pointer ${
      active
        ? 'bg-ui-surface-2 text-ui-text font-medium shadow-none'
        : 'text-ui-muted hover:bg-ui-surface-2/60 hover:text-ui-text'
    }`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
    <span className="flex-1 truncate">{label}</span>
    {trailing}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-5 pb-1.5 text-[11px] font-medium text-ui-muted uppercase tracking-wider">{children}</div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onSelectCategory,
  appCount,
  updatesCount,
  systemInfo,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-[220px] flex-shrink-0 bg-ui-surface border-r border-ui-border flex flex-col justify-between select-none">
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <Item
          active={activeTab === 'home'}
          onClick={() => onSelectTab('home')}
          icon={Home}
          label={t('nav.home')}
        />
        <Item
          active={activeTab === 'apps'}
          onClick={() => {
            onSelectTab('apps');
            if (onSelectCategory) onSelectCategory('Alle');
          }}
          icon={LayoutGrid}
          label={t('nav.allApps')}
          trailing={<span className="text-[12px] text-ui-muted font-normal">{appCount}</span>}
        />
        <Item
          active={activeTab === 'updates'}
          onClick={() => onSelectTab('updates')}
          icon={ArrowDownCircle}
          label={t('nav.updates')}
          trailing={
            updatesCount > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-ui-accent text-white text-[11px] font-medium flex items-center justify-center">
                {updatesCount}
              </span>
            ) : null
          }
        />

        <SectionLabel>{t('nav.work')}</SectionLabel>
        <Item
          active={activeTab === 'projects'}
          onClick={() => onSelectTab('projects')}
          icon={FolderOpen}
          label={t('nav.projects')}
        />
        <Item
          active={activeTab === 'palettes'}
          onClick={() => onSelectTab('palettes')}
          icon={Palette}
          label={t('nav.palettes')}
        />

        <SectionLabel>{t('nav.configuration')}</SectionLabel>
        <Item
          active={activeTab === 'settings'}
          onClick={() => onSelectTab('settings')}
          icon={Settings}
          label={t('nav.settings')}
        />
      </nav>

      {systemInfo && (
        <div className="px-4 py-3 border-t border-ui-border text-[11px] text-ui-muted flex items-center justify-between">
          <span className="capitalize font-medium text-ui-text">{systemInfo.os}</span>
          <span className="text-ui-muted font-mono text-[10px]">{systemInfo.arch}</span>
        </div>
      )}
    </aside>
  );
};