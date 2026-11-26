import { ChevronRight, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { processesById, flowsById, processRoute, processSteps, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { hasFacetFilters, processesForStage, stageLabel, stepMatchesFilters, type FilterState } from '@/lib/workspace';
import { cn } from '@/lib/cn';

export function StageRail({
  scene,
  filters,
  stageParam,
  onStage,
}: {
  scene: ContentScene;
  filters: FilterState;
  stageParam: string | null;
  onStage: (stage: string | null) => void;
}) {
  const navigate = useNavigate();
  const process = scene.level === 'process' ? processesById.get(scene.process ?? '') : undefined;
  const flow = scene.level === 'flow' ? flowsById.get(scene.flow ?? '') : process ? flowsById.get(process.flow) : undefined;
  if (!flow) return null;
  const currentStage = scene.level === 'flow' ? stageParam : process?.stage ?? null;
  const filtered = hasFacetFilters(filters);
  const coveredStages = flow.stages.filter((stage) => processesForStage(flow, stage.id).length > 0).length;

  const activate = (stageId: string) => {
    if (scene.level === 'flow') {
      onStage(stageParam === stageId ? null : stageId);
      return;
    }
    if (!process) return;
    const targets = processesForStage(flow, stageId);
    const target = targets[0];
    if (target && target.id !== process.id) navigate(processRoute(target));
  };

  return (
    <div className="flex min-h-0 items-center gap-2 overflow-x-auto border-b border-slate-200/70 bg-white/80 px-3 py-1.5 backdrop-blur-sm" aria-label="价值流阶段">
      <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <GitBranch className="h-3 w-3" /> {text(flow.title)}
      </span>
      <span className="h-4 w-px shrink-0 bg-slate-200" />
      {scene.level === 'flow' ? (
        <button
          type="button"
          onClick={() => onStage(null)}
          className={cn('shrink-0 rounded-md px-2 py-1 text-[10px]', stageParam ? 'text-slate-400 hover:bg-slate-50' : 'bg-slate-100 font-medium text-slate-700')}
        >
          全部
        </button>
      ) : null}
      {flow.stages.map((stage, index) => {
        const stageProcesses = processesForStage(flow, stage.id);
        const allSteps = stageProcesses.reduce((sum, item) => sum + processSteps(item).length, 0);
        const stepCount = filtered
          ? stageProcesses.reduce((sum, item) => sum + processSteps(item).filter((step) => stepMatchesFilters(step, filters)).length, 0)
          : allSteps;
        const active = currentStage === stage.id;
        const covered = stageProcesses.length > 0;
        const dimmed = filtered && stepCount === 0;
        return (
          <div key={stage.id} className="flex shrink-0 items-center gap-0.5">
            {index > 0 ? <ChevronRight className="h-3 w-3 text-slate-300" /> : null}
            <button
              type="button"
              onClick={() => activate(stage.id)}
              disabled={!covered && scene.level === 'process'}
              aria-current={active ? 'step' : undefined}
              title={covered ? `${stageProcesses.length} 个流程 · ${allSteps} 个步骤${filtered ? ` · 当前筛选 ${stepCount} 个` : ''}` : '该阶段暂无独立流程；相关步骤可能包含在其他流程中'}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors',
                active ? 'bg-blue-50 font-semibold text-blue-700' : covered ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-800' : 'text-slate-300',
                dimmed && !active && 'opacity-40',
                !covered && scene.level === 'process' && 'cursor-default',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', covered ? active ? 'bg-blue-500' : 'bg-slate-300' : 'border border-slate-300 bg-transparent')} />
              <span className="whitespace-nowrap">{stageLabel(flow, stage.id)}</span>
              <span className={cn('rounded px-1 text-[9px]', active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400')}>
                {covered ? stepCount : '未建'}
              </span>
            </button>
          </div>
        );
      })}
      <span className="ml-auto hidden shrink-0 text-[10px] text-slate-400 lg:block">
        覆盖 {coveredStages}/{flow.stages.length} 阶段 · {process ? `当前：${stageLabel(flow, process.stage)}` : '点击阶段筛选'}
      </span>
    </div>
  );
}
