import { ListTree, LayoutGrid, Map as MapIcon, Table2, Waypoints } from 'lucide-react';
import { viewsForLevel, viewLabel, type ViewId, type WorkspaceLevel } from '@/lib/workspace';
import { cn } from '@/lib/cn';

const ICONS: Record<ViewId, typeof MapIcon> = {
  map: MapIcon,
  track: ListTree,
  matrix: LayoutGrid,
  table: Table2,
  lineage: Waypoints,
};

export function ViewSwitcher({
  level,
  view,
  hasObject,
  onChange,
}: {
  level: WorkspaceLevel;
  view: ViewId;
  hasObject: boolean;
  onChange: (view: ViewId) => void;
}) {
  const views = viewsForLevel(level, hasObject);
  return (
    <div role="tablist" aria-label="切换视图" className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/90 p-0.5 shadow-sm">
      {views.map((item) => {
        const Icon = ICONS[item];
        const active = item === view;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item)}
            title={viewLabel(item)}
            aria-label={viewLabel(item)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors',
              active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {active ? <span className="whitespace-nowrap">{viewLabel(item)}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
