import { Filter, Menu } from 'lucide-react';
import { ScenePill } from '@/features/canvas/SceneChrome';
import type { ContentScene } from '@/content/schemas';
import { filterCount, type FilterState, type ViewId } from '@/lib/workspace';
import { cn } from '@/lib/cn';
import { LensMenu } from './LensMenu';
import { MoreMenu } from './MoreMenu';

export function WorkspaceToolbar({
  scene,
  view,
  hasObject,
  filters,
  filtersOpen,
  onViewChange,
  onToggleFilters,
  onOpenDrawer,
  onSaveCurrent,
  onOpenHelp,
}: {
  scene: ContentScene;
  view: ViewId;
  hasObject: boolean;
  filters: FilterState;
  filtersOpen: boolean;
  onViewChange: (view: ViewId) => void;
  onToggleFilters: () => void;
  onOpenDrawer: () => void;
  onSaveCurrent: (name: string) => void;
  onOpenHelp: () => void;
}) {
  const activeCount = filterCount(filters);
  return (
    <div className="relative z-40 flex min-h-[52px] shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/90 px-3 py-1.5 backdrop-blur-sm">
      <button type="button" onClick={onOpenDrawer} aria-label="打开导航" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 xl:hidden"><Menu className="h-4 w-4" /></button>
      <ScenePill scene={scene} />
      <div className="ml-auto hidden md:block"><LensMenu level={scene.level} view={view} hasObject={hasObject} onChange={onViewChange} /></div>
      <button
        type="button"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
        className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] transition-colors', activeCount || filtersOpen ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}
      >
        <Filter className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">筛选</span>
        {activeCount ? <span className="rounded bg-white px-1 text-[9px] text-blue-600">{activeCount}</span> : null}
      </button>
      <MoreMenu scene={scene} onSaveCurrent={onSaveCurrent} onOpenHelp={onOpenHelp} />
    </div>
  );
}
