import { Check, ChevronDown, LayoutGrid, ListTree, Map as MapIcon, Table2, Waypoints } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { viewLabel, viewsForLevel, type ViewId, type WorkspaceLevel } from '@/lib/workspace';
import { cn } from '@/lib/cn';

const ICONS: Record<ViewId, typeof MapIcon> = {
  map: MapIcon,
  track: ListTree,
  matrix: LayoutGrid,
  table: Table2,
  lineage: Waypoints,
};

export function LensMenu({
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const views = viewsForLevel(level, hasObject);
  const CurrentIcon = ICONS[view];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors', open || views.length > 1 ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'border-slate-200 bg-white text-slate-400')}
      >
        <CurrentIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{viewLabel(view)}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>
      {open ? (
        <div role="menu" aria-label="切换视图" className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <div className="px-2 pb-1 pt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">视图</div>
          {views.map((item) => {
            const Icon = ICONS[item];
            return (
              <button
                key={item}
                type="button"
                role="menuitemradio"
                aria-checked={view === item}
                onClick={() => { onChange(item); setOpen(false); }}
                className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px]', view === item ? 'bg-slate-900 font-medium text-white' : 'text-slate-600 hover:bg-slate-50')}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1">{viewLabel(item)}</span>
                {view === item ? <Check className="h-3 w-3" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
