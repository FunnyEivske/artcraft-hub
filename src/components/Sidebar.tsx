import React from 'react';
import {
  LayoutGrid,
  ArrowDownCircle,
  FolderOpen,
  Palette,
  Image,
  PenTool,
  Film,
  Sliders,
  FileText,
  Sparkles,
  LayoutTemplate,
  Layout,
  Volume2,
} from 'lucide-react';
import { SystemInfo } from '../types';

export type HubTab = 'apps' | 'projects' | 'palettes' | 'updates';

export const CATEGORIES: { name: string; icon: React.ElementType }[] = [
  { name: 'Foto & Piksel', icon: Image },
  { name: 'Vektor & Mønster', icon: PenTool },
  { name: 'Video', icon: Film },
  { name: 'RAW & Farge', icon: Sliders },
  { name: 'Dokument & Mønsterark', icon: FileText },
  { name: 'VFX & Motion', icon: Sparkles },
  { name: 'Layout & Trykk', icon: LayoutTemplate },
  { name: 'UI/UX & Prototyping', icon: Layout },
  { name: 'Lyd & Miksing', icon: Volume2 },
];

interface SidebarProps {
  activeTab: HubTab;
  onSelectTab: (tab: HubTab) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
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
    className={`w-full h-8 flex items-center gap-2.5 px-3 rounded-md text-[13px] text-left transition-colors ${
      active
        ? 'bg-[#3a3a3a] text-white font-semibold'
        : 'text-ui-muted hover:bg-ui-hover hover:text-ui-text'
    }`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
    <span className="flex-1 truncate">{label}</span>
    {trailing}
  </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-5 pb-1.5 text-[11px] font-semibold text-ui-faint">{children}</div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  selectedCategory,
  onSelectCategory,
  appCount,
  updatesCount,
  systemInfo,
}) => {
  const isAllApps = activeTab === 'apps' && selectedCategory === 'Alle';

  return (
    <aside className="w-[232px] flex-shrink-0 bg-ui-rail border-r border-ui-line flex flex-col">
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <Item
          active={isAllApps}
          onClick={() => {
            onSelectTab('apps');
            onSelectCategory('Alle');
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

        <SectionLabel>Kategorier</SectionLabel>
        {CATEGORIES.map((cat) => (
          <Item
            key={cat.name}
            active={activeTab === 'apps' && selectedCategory === cat.name}
            onClick={() => {
              onSelectTab('apps');
              onSelectCategory(cat.name);
            }}
            icon={cat.icon}
            label={cat.name}
          />
        ))}

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
        <div className="px-5 py-3 border-t border-ui-line text-[11px] text-ui-faint">
          <span className="capitalize">{systemInfo.os}</span> · {systemInfo.arch}
        </div>
      )}
    </aside>
  );
};
