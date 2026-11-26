import { ChevronDown, ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flowsById, isConditionalProcess, modulesById, objectsForStep, processSteps, processesById, processVariantShort, stepsById, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { processMatchesFilters, stepMatchesFilters, type DockMode, type FilterState, type Selection } from '@/lib/workspace';
import { cn } from '@/lib/cn';

type BandItem = {
  key: string;
  kind: 'step' | 'process';
  id: string;
  label: string;
  tcode?: string;
  count: number;
  module?: string;
  match: boolean;
  order: number;
  conditional?: boolean;
  variant?: string;
};

export function PathBand({
  scene,
  selection,
  dock,
  filters,
  onSelectStep,
  onNavigateProcess,
}: {
  scene: ContentScene;
  selection: Selection | null;
  dock: DockMode | null;
  filters: FilterState;
  onSelectStep: (id: string, mode?: DockMode) => void;
  onNavigateProcess: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const process = scene.level === 'process' ? processesById.get(scene.process ?? '') : undefined;
  const flow = scene.level === 'flow' ? flowsById.get(scene.flow ?? '') : process ? flowsById.get(process.flow) : undefined;

  const items = useMemo<BandItem[]>(() => {
    if (process) {
      return processSteps(process).map((step, index) => ({
        key: `step-${step.id}`,
        kind: 'step' as const,
        id: step.id,
        label: text(step.title),
        tcode: step.tcode,
        count: objectsForStep(step).length,
        module: step.primaryModule,
        match: stepMatchesFilters(step, filters),
        order: index + 1,
        conditional: step.optional,
      }));
    }
    if (!flow) return [];
    const stepNodes = scene.nodes
      .filter((node) => node.kind === 'step' && node.ref?.startsWith('step:'))
      .sort((a, b) => a.position[0] - b.position[0]);
    if (stepNodes.length) {
      const result: BandItem[] = [];
      stepNodes.forEach((node, index) => {
        const step = stepsById.get(node.ref!.slice(5));
        if (!step) return;
        result.push({
          key: `step-${step.id}`,
          kind: 'step',
          id: step.id,
          label: text(step.title),
          tcode: step.tcode,
          count: objectsForStep(step).length,
          module: step.primaryModule,
          match: stepMatchesFilters(step, filters),
          order: index + 1,
          conditional: step.optional,
        });
      });
      return result;
    }
    const result: BandItem[] = [];
    flow.processes.forEach((id, index) => {
      const item = processesById.get(id);
      if (!item) return;
      result.push({
        key: `process-${item.id}`,
        kind: 'process',
        id: item.id,
        label: text(item.title),
        count: item.steps.length,
        module: item.module,
        match: processMatchesFilters(item, filters),
        order: index + 1,
        conditional: isConditionalProcess(item),
        variant: item.variant,
      });
    });
    return result;
  }, [filters, flow, process, scene.nodes]);

  const visibleItems = filters.isolate ? items.filter((item) => item.match) : items;
  const selectedIndex = selection
    ? visibleItems.findIndex((item) => item.kind === selection.kind && item.id === selection.id)
    : -1;

  useEffect(() => {
    if (selectedIndex < 0) return;
    const key = visibleItems[selectedIndex]?.key;
    if (!key) return;
    itemRefs.current.get(key)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selectedIndex, visibleItems]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (!['arrowleft', 'arrowright', 'home', 'end', 'j', 'k'].includes(key)) return;
      if (!visibleItems.length) return;
      event.preventDefault();
      const current = selectedIndex < 0 ? 0 : selectedIndex;
      const next = key === 'home' ? 0 : key === 'end' ? visibleItems.length - 1 : key === 'arrowright' || key === 'j' ? Math.min(visibleItems.length - 1, current + 1) : Math.max(0, current - 1);
      const item = visibleItems[next];
      if (!item) return;
      if (item.kind === 'step') onSelectStep(item.id, dock === 'pin' ? 'pin' : 'peek');
      else onNavigateProcess(item.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dock, onNavigateProcess, onSelectStep, selectedIndex, visibleItems]);

  if (!visibleItems.length) return null;
  const selected = selectedIndex >= 0 ? visibleItems[selectedIndex] : undefined;
  const step = (items: BandItem[], delta: number) => items[Math.max(0, Math.min(items.length - 1, (selectedIndex < 0 ? 0 : selectedIndex) + delta))];

  if (collapsed) {
    return (
      <div className="flex h-9 shrink-0 items-center gap-2 border-t border-slate-200/80 bg-white/95 px-3 text-[10px] text-slate-500">
        <button type="button" onClick={() => setCollapsed(false)} className="flex items-center gap-1 hover:text-slate-800" aria-label="展开流程带"><ChevronRight className="h-3 w-3" /> 流程带</button>
        <span className="min-w-0 truncate text-slate-700">{selected ? `${selected.order}. ${selected.label}` : `${visibleItems.length} 步`}</span>
        <span className="ml-auto flex items-center gap-0.5">
          <button type="button" onClick={() => { const item = step(visibleItems, -1); if (item) item.kind === 'step' ? onSelectStep(item.id, dock ?? 'peek') : onNavigateProcess(item.id); }} className="grid h-6 w-6 place-items-center rounded hover:bg-slate-100" aria-label="上一步"><ChevronLeft className="h-3 w-3" /></button>
          <button type="button" onClick={() => { const item = step(visibleItems, 1); if (item) item.kind === 'step' ? onSelectStep(item.id, dock ?? 'peek') : onNavigateProcess(item.id); }} className="grid h-6 w-6 place-items-center rounded hover:bg-slate-100" aria-label="下一步"><ChevronRight className="h-3 w-3" /></button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-t border-slate-200/80 bg-white/95 px-3" aria-label="流程步骤导航">
      <span className="hidden shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:block">流程带</span>
      {visibleItems.length !== items.length ? <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] text-amber-700">{visibleItems.length}/{items.length}</span> : null}
      <nav aria-label="流程步骤" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
        {visibleItems.map((item, index) => {
          const active = selection?.kind === item.kind && selection.id === item.id;
          const module = item.module ? modulesById.get(item.module) : undefined;
          return (
            <div key={item.key} className="flex shrink-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" /> : null}
              <button
                ref={(node) => { if (node) itemRefs.current.set(item.key, node); }}
                type="button"
                onClick={() => item.kind === 'step' ? onSelectStep(item.id, dock === 'pin' ? 'pin' : 'peek') : onNavigateProcess(item.id)}
                onDoubleClick={() => item.kind === 'step' ? onSelectStep(item.id, 'pin') : onNavigateProcess(item.id)}
                aria-current={active ? 'step' : undefined}
                title={`${item.order}. ${item.label}${item.tcode ? ` · ${item.tcode}` : ''} · ${item.count} 个对象${item.conditional ? ` · ${item.variant === 'exception' ? '例外路径' : '可选流程/条件步骤'}` : ''}`}
                className={cn(
                  'flex h-10 min-w-[116px] max-w-[190px] items-center gap-1.5 rounded-lg border px-2 text-left transition-colors',
                  active
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : item.conditional
                      ? 'border-dashed border-amber-300/80 bg-amber-50/20 hover:border-amber-400 hover:bg-amber-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                  !item.match && 'opacity-40',
                )}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[9px] font-semibold text-white" style={{ background: module?.color ?? '#64748b' }}>
                  {item.kind === 'process' ? <Pin className="h-2.5 w-2.5" /> : item.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium text-slate-700">{item.label}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[8px] text-slate-400">
                    {item.tcode ? <span className="rounded bg-slate-100 px-1 font-mono">{item.tcode}</span> : null}
                    <span>{item.count} 对象</span>
                    {item.conditional ? <span className="rounded-full border border-dashed border-amber-300 px-1 text-amber-700">{processVariantShort[item.variant ?? 'optional'] ?? '可选'}</span> : null}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" onClick={() => { const item = step(visibleItems, -1); if (item) item.kind === 'step' ? onSelectStep(item.id, dock ?? 'peek') : onNavigateProcess(item.id); }} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" aria-label="上一步"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => { const item = step(visibleItems, 1); if (item) item.kind === 'step' ? onSelectStep(item.id, dock ?? 'peek') : onNavigateProcess(item.id); }} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" aria-label="下一步"><ChevronRight className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => setCollapsed(true)} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" aria-label="收起流程带"><ChevronDown className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
