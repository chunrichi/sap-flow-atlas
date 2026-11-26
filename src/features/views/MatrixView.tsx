import { ArrowRight, ChevronRight, LayoutGrid } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { content, processesById, processRoute, processSteps, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { moduleFlowCount, moduleFlowStatuses, rollupStatus, stageLabel, type FilterState } from '@/lib/workspace';
import { cn } from '@/lib/cn';

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-slate-300',
  reviewed: 'bg-sky-500',
  verified: 'bg-emerald-500',
};

export function MatrixView({ scene, filters }: { scene: ContentScene; filters: FilterState }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const cellParam = params.get('cell');
  const [cellModule, cellFlow] = cellParam ? cellParam.split(':') : [];
  const cell = cellModule && cellFlow && content.modules.some((item) => item.id === cellModule) && content.flows.some((item) => item.id === cellFlow)
    ? { module: cellModule, flow: cellFlow }
    : null;
  const setCell = (next: { module: string; flow: string } | null) => {
    const query = new URLSearchParams(location.search);
    if (next) query.set('cell', `${next.module}:${next.flow}`);
    else query.delete('cell');
    navigate({ pathname: location.pathname, search: query.toString() ? `?${query.toString()}` : '' }, { replace: true });
  };
  const currentModule = scene.module;
  const activeFilters = filters.modules.length + filters.types.length + filters.statuses.length + filters.roles.length + (filters.flow ? 1 : 0) > 0;

  const rows = useMemo(() => content.modules.map((module) => ({
    module,
    cells: content.flows.map((flow) => ({
      flow,
      count: moduleFlowCount(module.id, flow.id, activeFilters ? filters : undefined),
      status: rollupStatus(moduleFlowStatuses(module.id, flow.id)),
      covered: moduleFlowStatuses(module.id, flow.id).length > 0,
    })),
  })), [activeFilters, filters]);

  const selectedProcesses = useMemo(() => {
    if (!cell) return [];
    const flow = content.flows.find((item) => item.id === cell.flow);
    if (!flow) return [];
    return flow.processes
      .map((id) => processesById.get(id))
      .filter(Boolean)
      .filter((process) => process!.module === cell.module);
  }, [cell]);

  return (
    <div className="h-full overflow-auto bg-[var(--color-canvas)] px-4 py-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><LayoutGrid className="h-3 w-3" /> 覆盖矩阵</div>
            <h2 className="mt-1 text-[17px] font-semibold text-slate-900">模块 × 价值流</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">单元格数字是该模块在该价值流中的步骤数；点单元格查看流程。</p>
          </div>
          <span className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] text-slate-400 sm:block">{content.modules.length} 模块 · {content.flows.length} 价值流</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="min-w-[860px]">
            <div className="grid border-b border-slate-200 bg-slate-50/80" style={{ gridTemplateColumns: `160px repeat(${content.flows.length}, minmax(78px, 1fr))` }}>
              <div className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">模块</div>
              {content.flows.map((flow) => (
                <Link key={flow.id} to={`/f/${flow.id}`} className="border-r border-slate-100 px-1.5 py-2 text-center text-[10px] font-medium text-slate-500 hover:bg-white hover:text-slate-900" title={text(flow.title)}>
                  <span className="block truncate">{flow.abbr}</span>
                  <span className="mt-0.5 block truncate text-[9px] font-normal text-slate-300">{flow.stages.length} 阶段</span>
                </Link>
              ))}
            </div>
            {rows.map(({ module, cells }) => (
              <div key={module.id} className={cn('grid border-b border-slate-100 last:border-b-0', currentModule === module.id && 'bg-blue-50/30')} style={{ gridTemplateColumns: `160px repeat(${content.flows.length}, minmax(78px, 1fr))` }}>
                <Link to={`/m/${module.id}`} className={cn('sticky left-0 z-10 flex items-center gap-2 border-r border-slate-200 px-3 py-2 hover:bg-white', currentModule === module.id ? 'bg-blue-50/90' : 'bg-white/95')}>
                  <span className="grid h-6 w-8 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white" style={{ background: module.color }}>{module.abbr}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-slate-700">{text(module.title)}</span>
                    <span className="block text-[9px] text-slate-400">{content.processes.filter((process) => process.module === module.id).length} 流程</span>
                  </span>
                </Link>
                {cells.map(({ flow, count, status, covered }) => {
                  const selected = cell?.module === module.id && cell.flow === flow.id;
                  return (
                    <button
                      key={flow.id}
                      type="button"
                      onClick={() => setCell(selected ? null : { module: module.id, flow: flow.id })}
                      disabled={!covered}
                      title={covered ? `${text(module.title)} × ${text(flow.title)}：${count} 步` : '未覆盖'}
                      aria-label={covered ? `${module.abbr} × ${flow.abbr}：${count} 步` : `${module.abbr} × ${flow.abbr}：未覆盖`}
                      data-cell={`${module.id}-${flow.id}`}
                      className={cn(
                        'group relative flex min-h-[38px] flex-col items-center justify-center gap-0.5 border-r border-slate-100 px-1 py-1 text-center transition-colors',
                        covered ? 'hover:bg-sky-50' : 'cursor-default bg-slate-50/40',
                        selected && 'bg-sky-100 ring-1 ring-inset ring-sky-300',
                      )}
                    >
                      {covered ? (
                        <>
                          <span className={cn('text-[12px] font-semibold', selected ? 'text-sky-800' : 'text-slate-700')}>{count}</span>
                          <span className={cn('h-1 w-1 rounded-full', STATUS_DOT[status])} title={status} />
                        </>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> 草稿</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> 已复核</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 已验证</span>
          <span>— 表示该模块尚未覆盖这条价值流</span>
          {activeFilters ? <span className="text-amber-600">数字已按当前筛选计算</span> : null}
        </div>

        {cell ? (
          <div className="fixed bottom-10 left-4 right-4 z-30 max-h-[46vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.35)] md:left-auto md:right-4 md:w-[380px]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-800">{text(content.modules.find((item) => item.id === cell.module)?.title)} × {text(content.flows.find((item) => item.id === cell.flow)?.title)}</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{selectedProcesses.length} 个流程</span>
              <button type="button" onClick={() => setCell(null)} className="ml-auto text-[10px] text-slate-400 hover:text-slate-700">关闭</button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {selectedProcesses.map((process) => (
                <Link key={process!.id} to={processRoute(process!)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 hover:border-blue-200 hover:bg-blue-50/30">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[9px] text-slate-500">{processSteps(process!).length}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium text-slate-700">{text(process!.title)}</span><span className="text-[9px] text-slate-400">{stageLabel(content.flows.find((item) => item.id === cell.flow)!, process!.stage)} · {process!.roles.slice(0, 2).join(' / ')}</span></span>
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                </Link>
              ))}
            </div>
            {selectedProcesses.length ? <Link to={processRoute(selectedProcesses[0]!)} className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-1.5 text-[10px] font-medium text-white hover:bg-slate-700">打开第一个流程 <ArrowRight className="h-3 w-3" /></Link> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
