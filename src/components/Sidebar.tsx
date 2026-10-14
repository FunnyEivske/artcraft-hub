import React from 'react';
import {
  Home,
  LayoutGrid,
  ArrowDownCircle,
  FolderOpen,
  Palette,
} from 'lucide-react';
import { SystemInfo } from '../types';

export type HubTab = 'home' | 'apps' | 'projects' | 'palettes' | 'updates';

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
    className={`w-full h-9 flex items-center gap-2.5 px-3 rounded-md text-[13px] text-left transition-colors ${
      active
        ? 'bg-[#3a3a3a] text-white font-semibold shadow-sm'
        : 'text-ui-muted hover:bg-ui-hover hover:text-ui-text'
    }`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
    <span className="flex-1 truncate">{label}</span>
    {trailing}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-5 pb-1.5 text-[11px] font-semibold text-ui-faint uppercase tracking-wider">{children}</div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onSelectCategory,
  appCount,
  updatesCount,
  systemInfo,
}) => {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-ui-rail border-r border-ui-line flex flex-col justify-between">
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <Item
          active={activeTab === 'home'}
          onClick={() => onSelectTab('home')}
          icon={Home}
          label="Hjem"
        />
        <Item
          active={activeTab === 'apps'}
          onClick={() => {
            onSelectTab('apps');
            if (onSelectCategory) onSelectCategory('Alle');
          }}
          icon={LayoutGrid}
          label="Alle apper"
          trailing={<span className="text-[12px] text-ui-faint font-normal">{appCount}</span>}
        />
        <Item
          active={activeTab === 'updates'}
          onClick={() => onSelectTab('updates')}
          icon={ArrowDownCircle}
          label="Oppdateringer"
          trailing={
            updatesCount > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-ui-blue text-white text-[11px] font-semibold flex items-center justify-center">
                {updatesCount}
              </span>
            ) : null
          }
        />

        <SectionLabel>Arbeid</SectionLabel>
        <Item
          active={activeTab === 'projects'}
          onClick={() => onSelectTab('projects')}
          icon={FolderOpen}
          label="Prosjekter"
        />
        <Item
          active={activeTab === 'palettes'}
          onClick={() => onSelectTab('palettes')}
          icon={Palette}
          label="Fargepaletter"
        />
      </nav>

      {systemInfo && (
        <div className="px-4 py-3 border-t border-ui-line text-[11px] text-ui-faint flex items-center justify-between">
          <span className="capitalize font-medium text-ui-muted">{systemInfo.os}</span>
          <span className="text-ui-faint font-mono text-[10px]">{systemInfo.arch}</span>
        </div>
      )}
    </aside>
  );
};