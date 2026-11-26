import { ArrowRight, ChevronDown, ChevronRight, List, Search, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { content, flowsById, isConditionalProcess, modulesById, objectTypeLabels, processForStep, processRoute, processSteps, processesById, processVariantShort, statusLabels, stepsForObject, text } from '@/content/data';
import { stageLabel } from '@/lib/workspace';
import type { ContentObject, ContentProcess, ContentScene, ContentStep } from '@/content/schemas';
import {
  filterCount,
  objectMatchesFilters,
  processMatchesFilters,
  stepMatchesFilters,
  type FilterState,
  type Selection,
} from '@/lib/workspace';
import { cn } from '@/lib/cn';

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500',
  reviewed: 'bg-sky-50 text-sky-600',
  verified: 'bg-emerald-50 text-emerald-600',
};

type TableKind = 'process' | 'step' | 'object';

function TableTabs({ value, onChange, counts }: { value: TableKind; onChange: (kind: TableKind) => void; counts: Record<TableKind, number> }) {
  const items: Array<{ id: TableKind; label: string }> = [
    { id: 'process', label: '流程' },
    { id: 'step', label: '步骤' },
    { id: 'object', label: '对象' },
  ];
  return (
    <div role="tablist" aria-label="清单类型" className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
      {items.map((item) => (
        <button key={item.id} type="button" role="tab" aria-selected={value === item.id} onClick={() => onChange(item.id)} className={cn('rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors', value === item.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}>
          {item.label} <span className={cn('ml-0.5 text-[9px]', value === item.id ? 'text-slate-300' : 'text-slate-400')}>{counts[item.id]}</span>
        </button>
      ))}
    </div>
  );
}

function ProcessRow({ process, expanded, onToggle, highlight }: { process: ContentProcess; expanded: boolean; onToggle: () => void; highlight: boolean }) {
  const module = modulesById.get(process.module);
  const flow = flowsById.get(process.flow);
  return (
    <div className={cn('border-b border-slate-100 last:border-b-0', highlight && 'bg-blue-50/30')}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: module?.color }} />
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-800">{text(process.title)}</span>
            <span className="rounded bg-slate-50 px-1 py-0.5 text-[9px] text-slate-400">{module?.abbr}</span>
            {isConditionalProcess(process) ? (
              <span className={cn('rounded-full border border-dashed px-1 py-0.5 text-[9px]', process.variant === 'exception' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-amber-300 bg-amber-50 text-amber-700')}>
                {processVariantShort[process.variant] ?? process.variant}
              </span>
            ) : null}
            <span className={cn('rounded px-1 py-0.5 text-[9px]', STATUS_CLASS[process.status])}>{statusLabels[process.status]}</span>
          </span>
          <span className="mt-0.5 block text-[9px] text-slate-400">{flow ? stageLabel(flow, process.stage) : process.stage} · {processSteps(process).length} 步 · {process.roles.slice(0, 2).join(' / ')}</span>
        </button>
        <Link to={processRoute(process)} className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2 text-[10px] font-medium text-white hover:bg-slate-700">进入 <ArrowRight className="h-3 w-3" /></Link>
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>
      </div>
      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2">
          <p className="text-[10px] leading-relaxed text-slate-500">{text(process.summary)}</p>
          {isConditionalProcess(process) && process.trigger ? (
            <p className="mt-1.5 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-2 py-1 text-[9px] leading-relaxed text-amber-800">
              触发条件：{text(process.trigger)}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {processSteps(process).map((step, index) => (
              <Link key={step.id} to={`${processRoute(process)}?step=${encodeURIComponent(step.id)}&view=track&dock=peek`} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] text-slate-500 hover:border-blue-200 hover:text-blue-700">{index + 1}. {text(step.title)}</Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepRow({ step, expanded, onToggle, onSelect }: { step: ContentStep; expanded: boolean; onToggle: () => void; onSelect: () => void }) {
  const module = modulesById.get(step.primaryModule);
  const process = processForStep(step);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: module?.color }} />
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-800">{text(step.title)}</span>
            {step.tcode ? <span className="rounded bg-slate-100 px-1 font-mono text-[9px] text-slate-500">{step.tcode}</span> : null}
            <span className={cn('rounded px-1 py-0.5 text-[9px]', STATUS_CLASS[step.status])}>{statusLabels[step.status]}</span>
          </span>
          <span className="mt-0.5 block text-[9px] text-slate-400">{module?.abbr} · {process ? text(process.title) : '未归入流程'} · {step.objects.length} 对象</span>
        </button>
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">{expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>
      </div>
      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2">
          <p className="text-[10px] leading-relaxed text-slate-500">{text(step.summary)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {step.objects.slice(0, 8).map((id) => { const object = content.objects.find((item) => item.id === id); return object ? <span key={id} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{object.technicalName}</span> : null; })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ObjectTable({
  objects,
  filters,
  selectedId,
  onOpen,
  compact = false,
}: {
  objects: ContentObject[];
  filters: FilterState;
  selectedId?: string | null;
  onOpen: (object: ContentObject) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'module' | 'type' | 'usage' | 'name'>('module');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return objects
      .filter((object) => objectMatchesFilters(object, filters))
      .filter((object) => !needle || `${object.technicalName} ${text(object.title)} ${object.id} ${object.module}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === 'type') return a.type.localeCompare(b.type) || a.technicalName.localeCompare(b.technicalName);
        if (sort === 'usage') return (content.objectUsage[b.id]?.length ?? 0) - (content.objectUsage[a.id]?.length ?? 0);
        if (sort === 'name') return a.technicalName.localeCompare(b.technicalName);
        return a.module.localeCompare(b.module) || a.technicalName.localeCompare(b.technicalName);
      });
  }, [filters, objects, query, sort]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2">
          <Search className="h-3 w-3 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="在对象中搜索技术名、标题、ID…" className="h-7 min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400" aria-label="搜索对象" />
        </div>
        <label className="flex items-center gap-1 text-[10px] text-slate-400">排序
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-[10px] text-slate-600 outline-none">
            <option value="module">模块</option>
            <option value="type">类型</option>
            <option value="usage">使用数</option>
            <option value="name">技术名</option>
          </select>
        </label>
        <span className="text-[10px] text-slate-400">{filtered.length} / {objects.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[9px] uppercase tracking-[0.1em] text-slate-400">
              <th className="px-3 py-2 font-medium">对象</th>
              <th className="px-2 py-2 font-medium">类型</th>
              <th className="hidden px-2 py-2 font-medium sm:table-cell">模块</th>
              <th className="hidden px-2 py-2 font-medium md:table-cell">使用</th>
              <th className="px-2 py-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, compact ? 80 : 500).map((object) => {
              const module = modulesById.get(object.module);
              const usage = stepsForObject(object).length;
              const open = expanded === object.id;
              return (
                <tr key={object.id} className={cn('border-b border-slate-50 align-top last:border-b-0', selectedId === object.id && 'bg-blue-50/40')}>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onOpen(object)} className="group block max-w-full text-left">
                      <span className="block truncate font-mono text-[11px] font-semibold text-slate-800 group-hover:text-blue-700">{object.technicalName}</span>
                      <span className="block truncate text-[10px] text-slate-400">{text(object.title)}</span>
                    </button>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-[10px] text-slate-500">{objectTypeLabels[object.type] ?? object.type}</td>
                  <td className="hidden px-2 py-2 text-[10px] text-slate-500 sm:table-cell"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: module?.color }} />{module?.abbr}</td>
                  <td className="hidden px-2 py-2 text-[10px] text-slate-500 md:table-cell">{usage} 步</td>
                  <td className="px-2 py-2"><span className={cn('rounded px-1.5 py-0.5 text-[9px]', STATUS_CLASS[object.status])}>{statusLabels[object.status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!filtered.length ? <div className="px-4 py-8 text-center text-[11px] text-slate-400">当前筛选下没有对象。清除筛选或换一个关键词。</div> : null}
    </div>
  );
}

export function TableView({
  scene,
  filters,
  selection,
  onSelectStep,
  onSelectObject,
}: {
  scene: ContentScene;
  filters: FilterState;
  selection: Selection | null;
  onSelectStep: (id: string) => void;
  onSelectObject: (id: string) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const raw = params.get('table');
  const kind: TableKind = raw === 'step' || raw === 'object' ? raw : 'process';
  const [expanded, setExpanded] = useState<string | null>(null);
  const setKind = (next: TableKind) => {
    const query = new URLSearchParams(location.search);
    if (next === 'process') query.delete('table'); else query.set('table', next);
    navigate({ pathname: location.pathname, search: query.toString() ? `?${query.toString()}` : '' }, { replace: true });
  };

  const currentProcess = scene.level === 'process' ? scene.process : undefined;
  const scopeProcesses = useMemo(() => {
    if (scene.level === 'process') return content.processes.filter((process) => process.module === scene.module);
    if (scene.level === 'module') return content.processes.filter((process) => process.module === scene.module);
    if (scene.level === 'flow') {
      const flow = flowsById.get(scene.flow ?? '');
      return flow ? flow.processes.map((id) => processesById.get(id)).filter((process): process is NonNullable<typeof process> => Boolean(process)) : [];
    }
    return content.processes;
  }, [scene.flow, scene.level, scene.module]);
  const scopeSteps = useMemo(() => {
    if (scene.level === 'universe') return content.steps;
    if (scene.level === 'flow') {
      const ids = new Set(scopeProcesses.flatMap((process) => process.steps));
      return content.steps.filter((step) => ids.has(step.id));
    }
    return content.steps.filter((step) => step.primaryModule === scene.module || step.modules.includes(scene.module ?? ''));
  }, [scene.level, scene.module, scopeProcesses]);
  const processes = useMemo(() => scopeProcesses.filter((process) => processMatchesFilters(process, filters)), [filters, scopeProcesses]);
  const steps = useMemo(() => scopeSteps.filter((step) => stepMatchesFilters(step, filters)), [filters, scopeSteps]);
  const objects = useMemo(() => content.objects.filter((object) => objectMatchesFilters(object, filters)), [filters]);

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-canvas)] px-4 py-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><Table2 className="h-3 w-3" /> 清单视图</div>
            <h2 className="mt-1 text-[17px] font-semibold text-slate-900">批量扫描与精确跳转</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">按当前筛选列出流程、步骤或对象；点行展开，点标题进入。</p>
          </div>
          <TableTabs value={kind} onChange={setKind} counts={{ process: processes.length, step: steps.length, object: objects.length }} />
        </div>

        {kind === 'process' ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {processes.map((process) => (
              <ProcessRow key={process.id} process={process} highlight={currentProcess === process.id} expanded={expanded === process.id} onToggle={() => setExpanded(expanded === process.id ? null : process.id)} />
            ))}
            {!processes.length ? <div className="px-4 py-8 text-center text-[11px] text-slate-400">当前筛选下没有流程。</div> : null}
          </div>
        ) : null}

        {kind === 'step' ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {steps.map((step) => (
              <StepRow key={step.id} step={step} expanded={expanded === step.id} onToggle={() => setExpanded(expanded === step.id ? null : step.id)} onSelect={() => onSelectStep(step.id)} />
            ))}
            {!steps.length ? <div className="px-4 py-8 text-center text-[11px] text-slate-400">当前筛选下没有步骤。</div> : null}
          </div>
        ) : null}

        {kind === 'object' ? (
          <ObjectTable objects={content.objects} filters={filters} selectedId={selection?.kind === 'object' ? selection.id : null} onOpen={(object) => onSelectObject(object.id)} />
        ) : null}

        {filterCount(filters) ? <div className="mt-2 text-[10px] text-slate-400">当前有 {filterCount(filters)} 个筛选条件；清单只显示匹配项。</div> : null}
      </div>
    </div>
  );
}
