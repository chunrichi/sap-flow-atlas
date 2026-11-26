import { Check, X } from 'lucide-react';
import { content, objectTypeLabels, statusLabels, text } from '@/content/data';
import { allRoles, filterCount, toggleFilterValue, type FilterState } from '@/lib/workspace';
import { cn } from '@/lib/cn';

const DOMAIN_PRESETS = [
  { id: 'all', label: '全部', modules: [] as string[] },
  { id: 'sales', label: '销售', modules: ['sd'] },
  { id: 'procurement', label: '采购', modules: ['mm', 'ewm'] },
  { id: 'finance', label: '财务', modules: ['fi', 'co'] },
  { id: 'abap', label: 'ABAP', modules: ['abap'] },
];

function Facet({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: Array<{ value: string; label: string; meta?: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</h3>
      <div className="max-h-32 space-y-0.5 overflow-y-auto pr-1">
        {items.map((item) => {
          const active = selected.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(item.value)}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] transition-colors',
                active ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded border', active ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white')}>
                {active ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.meta ? <span className="shrink-0 text-[9px] text-slate-300">{item.meta}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  onClose,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const typeItems = Object.entries(objectTypeLabels).map(([value, label]) => ({ value, label, meta: String(content.objects.filter((object) => object.type === value).length) }));
  const moduleItems = content.modules.map((module) => ({ value: module.id, label: `${module.abbr} · ${text(module.title)}`, meta: String(content.objects.filter((object) => object.module === module.id).length) }));
  const statusItems = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));
  const roleItems = allRoles().map((role) => ({ value: role, label: role }));
  const flowItems = content.flows.map((flow) => ({ value: flow.id, label: text(flow.title) }));

  return (
    <div className="border-b border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm" aria-label="筛选条件">
      <div className="flex items-center gap-2 pb-2">
        <span className="text-[11px] font-semibold text-slate-700">筛选</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{filterCount(filters)} 个条件</span>
        <span className="ml-auto hidden text-[10px] text-slate-400 sm:block">同时作用于地图、轨道、矩阵与清单</span>
        <button type="button" onClick={onReset} disabled={!filterCount(filters) && !filters.isolate} className="text-[10px] text-slate-400 hover:text-slate-700 disabled:opacity-40">清除</button>
        <button type="button" onClick={onClose} aria-label="收起筛选" className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px]">
        <span className="mr-1 text-slate-400">领域</span>
        {DOMAIN_PRESETS.map((preset) => {
          const active = preset.modules.length === filters.modules.length && preset.modules.every((module) => filters.modules.includes(module));
          return (
            <button key={preset.id} type="button" onClick={() => onChange({ ...filters, modules: preset.modules })} aria-pressed={active} className={cn('rounded-md border px-1.5 py-1', active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Facet title="模块" items={moduleItems} selected={filters.modules} onToggle={(value) => onChange({ ...filters, modules: toggleFilterValue(filters.modules, value) })} />
        <Facet title="对象类型" items={typeItems} selected={filters.types} onToggle={(value) => onChange({ ...filters, types: toggleFilterValue(filters.types, value) })} />
        <Facet title="内容状态" items={statusItems} selected={filters.statuses} onToggle={(value) => onChange({ ...filters, statuses: toggleFilterValue(filters.statuses, value) })} />
        <Facet title="角色" items={roleItems} selected={filters.roles} onToggle={(value) => onChange({ ...filters, roles: toggleFilterValue(filters.roles, value) })} />
        <section className="min-w-0">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">价值流</h3>
          <select
            value={filters.flow ?? ''}
            onChange={(event) => onChange({ ...filters, flow: event.target.value || null })}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-600 outline-none focus:border-blue-300"
            aria-label="按价值流筛选"
          >
            <option value="">全部价值流</option>
            {flowItems.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button
            type="button"
            aria-pressed={filters.isolate}
            onClick={() => onChange({ ...filters, isolate: !filters.isolate })}
            className={cn(
              'mt-2 flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-[11px] transition-colors',
              filters.isolate ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
            )}
          >
            <span>仅显示匹配</span>
            <span className={cn('h-3.5 w-6 rounded-full p-0.5 transition-colors', filters.isolate ? 'bg-amber-500' : 'bg-slate-200')}>
              <span className={cn('block h-2.5 w-2.5 rounded-full bg-white transition-transform', filters.isolate && 'translate-x-2.5')} />
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
