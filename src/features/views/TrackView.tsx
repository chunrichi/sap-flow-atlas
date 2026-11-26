import { ArrowRight, ChevronDown, ChevronRight, ExternalLink, ListTree, MapPin, MousePointerClick } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  content,
  flowsById,
  isConditionalProcess,
  modulesById,
  objectsForStep,
  processSteps,
  processesById,
  processVariantDescriptions,
  processVariantLabels,
  processVariantShort,
  statusLabels,
  stepsById,
  text,
} from '@/content/data';
import type { ContentProcess, ContentScene, ContentStep } from '@/content/schemas';
import {
  processMatchesFilters,
  stepMatchesFilters,
  statusRank,
  processesForStage,
  stageLabel,
  type DockMode,
  type FilterState,
  type Selection,
} from '@/lib/workspace';
import { cn } from '@/lib/cn';

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-slate-300',
  reviewed: 'bg-sky-500',
  verified: 'bg-emerald-500',
};

function ObjectChips({ step }: { step: ContentStep }) {
  const objects = objectsForStep(step);
  if (!objects.length) return <span className="text-[10px] text-slate-300">未关联对象</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {objects.slice(0, 6).map((object) => {
        const module = modulesById.get(object.module);
        return (
          <span key={object.id} className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: module?.color ?? '#94a3b8' }} />
            {object.technicalName}
          </span>
        );
      })}
      {objects.length > 6 ? <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">+{objects.length - 6}</span> : null}
    </div>
  );
}

function VariantBadge({ variant, className }: { variant: string; className?: string }) {
  if (variant === 'core') return null;
  return (
    <span
      title={processVariantDescriptions[variant] ?? variant}
      className={cn(
        'rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-medium',
        variant === 'optional'
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-rose-300 bg-rose-50 text-rose-700',
        className,
      )}
    >
      {processVariantShort[variant] ?? variant}
    </span>
  );
}

function VariantLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400', className)}>
      <span className="flex items-center gap-1"><i className="h-px w-4 bg-slate-400" /> 实线 = 核心流程</span>
      <span className="flex items-center gap-1"><i className="h-px w-4 border-t border-dashed border-amber-400" /> 虚线 = 可选流程</span>
      <span className="flex items-center gap-1"><i className="h-px w-4 border-t border-dashed border-rose-400" /> 虚线 = 例外路径</span>
      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full border border-dashed border-amber-400" /> 条件步骤</span>
    </div>
  );
}

function StepRow({
  step,
  index,
  selected,
  dimmed,
  expanded,
  onSelect,
  onToggle,
  onPin,
}: {
  step: ContentStep;
  index: number;
  selected: boolean;
  dimmed: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onPin: () => void;
}) {
  const module = modulesById.get(step.primaryModule);
  return (
    <div className={cn('group relative pl-9', dimmed && 'opacity-35')}>
      <span className="absolute left-[15px] top-0 h-full w-px bg-slate-200 group-last:h-1/2" aria-hidden />
      <span
        className={cn(
          'absolute left-0 top-3 grid h-7 w-7 place-items-center rounded-full border-2 text-[11px] font-semibold transition-colors',
          selected ? 'border-blue-500 bg-blue-600 text-white' : 'border-white bg-slate-100 text-slate-500 ring-1 ring-slate-200',
        )}
        style={selected ? undefined : { color: module?.color }}
      >
        {index + 1}
      </span>
      <div
        className={cn(
          'mb-2 overflow-hidden rounded-xl border bg-white transition-colors',
          selected
            ? 'border-blue-300 shadow-[0_0_0_2px_rgba(59,130,246,0.10)]'
            : step.optional
              ? 'border-dashed border-amber-300/80 bg-amber-50/20 hover:border-amber-400'
              : 'border-slate-200 hover:border-slate-300',
        )}
      >
        <div className="flex items-center gap-3 p-2.5">
          <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left" aria-current={selected ? 'step' : undefined}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-semibold text-slate-900">{text(step.title)}</span>
              {step.tcode ? <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{step.tcode}</span> : null}
              {step.optional ? (
                <span className="rounded-full border border-dashed border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">条件步骤</span>
              ) : null}
              <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[step.status])} title={statusLabels[step.status]} />
              <span className="text-[10px] text-slate-400">{statusLabels[step.status]}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span>{objectsForStep(step).length} 个对象</span>
              <span>·</span>
              <span>{module?.abbr}</span>
              {step.crossModule.length ? <><span>·</span><span>跨模块 {step.crossModule.length}</span></> : null}
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label={expanded ? '收起步骤详情' : '展开步骤详情'} className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={onPin} className="hidden h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50 sm:flex">
              详情 <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
        {expanded ? (
          <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <p className="mb-2 text-[10px] leading-relaxed text-slate-500">{text(step.summary)}</p>
            {step.optional && step.condition ? (
              <p className="mb-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/70 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800">
                触发条件：{text(step.condition)}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">输入 / 输出</div>
                <div className="mt-1 text-[10px] leading-relaxed text-slate-600">
                  <span className="text-slate-400">输入：</span>{step.inputs.slice(0, 4).join('、') || '未补充'}
                  <br />
                  <span className="text-slate-400">输出：</span>{step.outputs.slice(0, 4).join('、') || '未补充'}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">开发对象</div>
                <div className="mt-1"><ObjectChips step={step} /></div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={onPin} className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[10px] font-medium text-white hover:bg-slate-700">打开完整详情 <ArrowRight className="h-3 w-3" /></button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProcessCard({
  process,
  selectedStepId,
  onSelectStep,
  onNavigate,
  hasSelectedStep,
}: {
  process: ContentProcess;
  selectedStepId: string | null;
  onSelectStep: (id: string, mode?: DockMode) => void;
  onNavigate: () => void;
  hasSelectedStep: boolean;
}) {
  const [expanded, setExpanded] = useState(hasSelectedStep);
  useEffect(() => { if (hasSelectedStep) setExpanded(true); }, [hasSelectedStep]);
  const module = modulesById.get(process.module);
  const flow = flowsById.get(process.flow);
  const steps = processSteps(process);
  const conditional = isConditionalProcess(process);
  return (
    <div
      className={cn(
        'rounded-xl border bg-white',
        conditional
          ? process.variant === 'exception'
            ? 'border-dashed border-rose-300/80 bg-rose-50/20'
            : 'border-dashed border-amber-300/80 bg-amber-50/20'
          : 'border-slate-200',
      )}
    >
      <div className="flex items-start gap-2.5 p-3">
        <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ background: module?.color ?? '#64748b' }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-slate-900">{text(process.title)}</span>
            <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-400">{module?.abbr} · {flow ? stageLabel(flow, process.stage) : process.stage}</span>
            <VariantBadge variant={process.variant} />
            <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[process.status])} />
          </div>
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{text(process.summary)}</p>
          {conditional && process.trigger ? (
            <p className="mt-1 rounded-md border border-dashed border-amber-200 bg-white/70 px-1.5 py-0.5 text-[9px] leading-relaxed text-amber-700">
              触发条件：{text(process.trigger)}
            </p>
          ) : null}
          <div className="mt-1 text-[9px] text-slate-400">{steps.length} 步 · {process.roles.length} 角色</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50">
            {expanded ? '收起' : '步骤'} {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          <button type="button" onClick={onNavigate} className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2 text-[10px] font-medium text-white hover:bg-slate-700">
            进入 <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2">
          <div className="grid gap-1 sm:grid-cols-2">
            {steps.map((step, index) => (
              <button key={step.id} type="button" onClick={() => onSelectStep(step.id, 'peek')} className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white', selectedStepId === step.id && 'bg-blue-50 ring-1 ring-blue-200')}>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[9px] text-slate-400 ring-1 ring-slate-200">{index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[10px] text-slate-700">{text(step.title)}</span><span className="text-[9px] text-slate-400">{step.tcode ?? '—'} · {step.objects.length} 对象</span></span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TrackView({
  scene,
  filters,
  selection,
  stageParam,
  onSelectStep,
  onNavigateProcess,
}: {
  scene: ContentScene;
  filters: FilterState;
  selection: Selection | null;
  stageParam: string | null;
  onSelectStep: (id: string, mode?: DockMode) => void;
  onNavigateProcess: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const process = scene.level === 'process' ? processesById.get(scene.process ?? '') : undefined;
  const flow = scene.level === 'flow' ? flowsById.get(scene.flow ?? '') : process ? flowsById.get(process.flow) : undefined;
  const selectedStepId = selection?.kind === 'step' ? selection.id : null;

  const processStepsFiltered = useMemo(() => {
    if (!process) return [];
    return process.steps
      .map((id, index) => ({ step: stepsById.get(id), index }))
      .filter((item): item is { step: ContentStep; index: number } => Boolean(item.step))
      .map((item) => ({ ...item, match: stepMatchesFilters(item.step, filters) }))
      .filter((item) => !filters.isolate || item.match);
  }, [filters, process]);

  if (process && flow) {
    const module = modulesById.get(process.module);
    return (
      <div className="h-full overflow-y-auto bg-[var(--color-canvas)] px-4 py-4">
        <div
          className={cn(
            'mb-3 rounded-xl border bg-white px-3.5 py-3',
            isConditionalProcess(process)
              ? process.variant === 'exception'
                ? 'border-dashed border-rose-300/80 bg-rose-50/20'
                : 'border-dashed border-amber-300/80 bg-amber-50/20'
              : 'border-slate-200',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-8 w-1 rounded-full" style={{ background: module?.color }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                {text(flow.title)} · {stageLabel(flow, process.stage)}
                <VariantBadge variant={process.variant} />
              </div>
              <div className="text-[16px] font-semibold text-slate-900">{text(process.title)}</div>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <div>{process.status === 'verified' ? '已验证' : process.status === 'reviewed' ? '已复核' : '草稿'} · {processSteps(process).length} 步</div>
              <div>{process.roles.slice(0, 3).join(' / ')}</div>
            </div>
          </div>
          {isConditionalProcess(process) && process.trigger ? (
            <p className="mt-2 rounded-lg border border-dashed border-amber-200 bg-white/70 px-2 py-1 text-[10px] leading-relaxed text-amber-800">
              <span className="font-medium">{processVariantLabels[process.variant] ?? '条件流程'}触发条件：</span>
              {text(process.trigger)}
            </p>
          ) : null}
          <VariantLegend className="mt-2" />
        </div>
        {processStepsFiltered.length ? (
          <div className="mx-auto max-w-3xl">
            {processStepsFiltered.map(({ step, match, index }) => (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                selected={selectedStepId === step.id}
                dimmed={!match && !filters.isolate}
                expanded={expanded.has(step.id)}
                onSelect={() => onSelectStep(step.id, 'peek')}
                onToggle={() => setExpanded((current) => { const next = new Set(current); if (next.has(step.id)) next.delete(step.id); else next.add(step.id); return next; })}
                onPin={() => onSelectStep(step.id, 'pin')}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-xl border border-dashed border-slate-200 bg-white/70 p-8 text-center">
            <ListTree className="mx-auto h-6 w-6 text-slate-300" />
            <div className="mt-2 text-[12px] font-medium text-slate-600">当前筛选下没有步骤</div>
            <div className="mt-1 text-[10px] text-slate-400">清除筛选或关闭「仅显示匹配」。</div>
          </div>
        )}
      </div>
    );
  }

  if (flow) {
    const stages = stageParam ? flow.stages.filter((stage) => stage.id === stageParam) : flow.stages;
    const conditionalCount = flow.processes
      .map((id) => processesById.get(id))
      .filter((item) => item && isConditionalProcess(item)).length;
    return (
      <div className="h-full overflow-y-auto bg-[var(--color-canvas)] px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50/40 px-3.5 py-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-sky-600"><GitBranchIcon /> 端到端流程 · {flow.abbr}</div>
            <div className="mt-0.5 text-[17px] font-semibold text-slate-900">{text(flow.title)}</div>
            <div className="mt-1 text-[10px] text-slate-500">
              {flow.stages.length} 阶段 · {flow.processes.length} 个模块流程 · {flow.modules.length} 个模块
              {conditionalCount ? " · " + conditionalCount + " 个条件流程" : ""}
            </div>
            <VariantLegend className="mt-2" />
          </div>
          {stages.map((stage) => {
            const stageProcesses = processesForStage(flow, stage.id).filter((item) => processMatchesFilters(item, filters));
            const total = processesForStage(flow, stage.id).length;
            return (
              <section key={stage.id} className="mb-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[9px] font-semibold text-white">{flow.stages.findIndex((item) => item.id === stage.id) + 1}</span>
                  <h2 className="text-[13px] font-semibold text-slate-800">{stageLabel(flow, stage.id)}</h2>
                  <span className="text-[10px] text-slate-400">{stageProcesses.length} / {total} 流程</span>
                  {!total ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400">未覆盖</span> : null}
                </div>
                <div className="space-y-2">
                  {stageProcesses.map((item) => (
                    <ProcessCard
                      key={item.id}
                      process={item}
                      selectedStepId={selectedStepId}
                      hasSelectedStep={Boolean(selectedStepId && item.steps.includes(selectedStepId))}
                      onSelectStep={onSelectStep}
                      onNavigate={() => onNavigateProcess(item.id)}
                    />
                  ))}
                  {!stageProcesses.length ? <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-2 text-[10px] text-slate-400">{total ? '当前筛选下没有流程' : '该阶段暂未建流程'}</div> : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return <div className="grid h-full place-items-center text-[12px] text-slate-400">暂无可展示的流程</div>;
}

function GitBranchIcon() {
  return <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />;
}
