import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes, Filter, Link2, X } from 'lucide-react';
import { content, stepRoute, stepsById, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { DetailDock } from '@/components/inspector/Inspector';
import { ObjectTable } from '@/features/views/TableView';
import { LineageView } from '@/features/views/LineageView';
import { FilterBar } from '@/features/workspace/FilterBar';
import { useWorkspaceNavigation } from '@/features/workspace/useWorkspace';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useWorkspaceStore } from '@/store/workspace';
import { filterCount } from '@/lib/workspace';
import { cn } from '@/lib/cn';

const OBJECTS_SCENE: ContentScene = {
  id: 'objects',
  type: 'scene',
  level: 'universe',
  title: { zh: '开发对象索引', en: 'Object index' },
  groups: [],
  nodes: [],
  edges: [],
};

export function ObjectsPage() {
  const ws = useWorkspaceNavigation(OBJECTS_SCENE);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const filtersOpen = useWorkspaceStore((state) => state.filtersOpen);
  const setFiltersOpen = useWorkspaceStore((state) => state.setFiltersOpen);
  const dockWidth = useWorkspaceStore((state) => state.dockWidth);
  const setDockWidth = useWorkspaceStore((state) => state.setDockWidth);
  const activeCount = filterCount(ws.filters);
  const [copied, setCopied] = useState(false);
  const showDock = Boolean(ws.selection);
  const lineage = ws.view === 'lineage' && ws.selection?.kind === 'object';

  const openObject = useCallback((object: { id: string }) => {
    ws.selectObject(object.id, 'pin');
  }, [ws]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const openStep = useCallback((id: string) => {
    const step = stepsById.get(id);
    if (step) navigate(`${stepRoute(step)}&view=track&dock=pin`);
  }, [navigate]);

  const table = (
    <div className="min-w-0 flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><Boxes className="h-3 w-3" /> 对象索引 · {content.stats.objects}</div>
            <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-slate-900">开发对象索引</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">按技术名、类型、模块、使用次数查找；点对象打开详情坞，或进入对象脉络。</p>
          </div>
          <Link to="/" className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-500 hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> 回到全景</Link>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px]', activeCount || filtersOpen ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}><Filter className="h-3.5 w-3.5" /> 筛选 {activeCount ? `(${activeCount})` : ''}</button>
          {activeCount ? <button type="button" onClick={ws.resetFilters} className="text-[10px] text-slate-400 hover:text-slate-700">清除</button> : null}
          <span className="ml-auto text-[10px] text-slate-400">点对象 → 详情坞 · 详情坞里可打开「对象脉络」</span>
        </div>
        {filtersOpen ? <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white"><FilterBar filters={ws.filters} onChange={ws.setFilters} onReset={ws.resetFilters} onClose={() => setFiltersOpen(false)} /></div> : null}
        {lineage ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <LineageView objectId={ws.selection?.kind === 'object' ? ws.selection.id : null} onSelectObject={(id) => ws.selectObject(id, 'pin')} onSelectStep={openStep} />
          </div>
        ) : (
          <ObjectTable objects={content.objects} filters={ws.filters} selectedId={ws.selection?.kind === 'object' ? ws.selection.id : null} onOpen={openObject} />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-canvas)]">
      <div className="flex min-h-[52px] shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/90 px-3 py-1.5">
        <Link to="/" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="回到系统全景"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="min-w-0">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Object index</div>
          <div className="truncate text-[13px] font-semibold text-slate-900">{text(OBJECTS_SCENE.title)}</div>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button type="button" onClick={() => ws.setView('map')} aria-pressed={!lineage} className={cn('rounded-md px-2 py-1 text-[10px]', !lineage ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}>清单</button>
          <button type="button" onClick={() => ws.setView('lineage')} disabled={ws.selection?.kind !== 'object'} aria-pressed={lineage} className={cn('rounded-md px-2 py-1 text-[10px] disabled:opacity-40', lineage ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}>脉络</button>
        </div>
        <button type="button" onClick={copyLink} aria-label="复制当前对象索引链接" className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500 hover:bg-slate-50"><Link2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">{copied ? '已复制' : '链接'}</span></button>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-500">{content.stats.objects} 对象</span>
      </div>
      <div className="relative flex min-h-0 flex-1">
        {table}
        {showDock ? (
          isMobile ? (
            <div className="absolute inset-x-0 bottom-0 z-40 h-[72vh] overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white">{<DetailDock mode={ws.dock ?? 'pin'} width="100%" />}</div>
          ) : (
            <>
              <div role="separator" aria-label="调整详情宽度" tabIndex={0} onPointerDown={(event) => { event.preventDefault(); const startX = event.clientX; const startWidth = dockWidth; const move = (moveEvent: PointerEvent) => setDockWidth(startWidth + (startX - moveEvent.clientX)); const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); }} className="w-1.5 shrink-0 cursor-col-resize hover:bg-blue-200" />
              <DetailDock mode={ws.dock ?? 'pin'} width={dockWidth} />
            </>
          )
        ) : null}
      </div>
    </div>
  );
}