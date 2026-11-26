import { ArrowRight, GitCompare, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { content, modulesById, objectsById, processRoute, processesById, statusLabels, stepsById, text } from '@/content/data';
import type { ContentProcess, ContentScene, ContentStep } from '@/content/schemas';
import { cn } from '@/lib/cn';

function objectSet(process: ContentProcess): Set<string> {
  return new Set(process.steps.flatMap((id) => stepsById.get(id)?.objects ?? []));
}

function stepList(process: ContentProcess): ContentStep[] {
  return process.steps.map((id) => stepsById.get(id)).filter((step): step is ContentStep => Boolean(step));
}

function ProcessColumn({ process, objects, label, onStep }: { process: ContentProcess; objects: Set<string>; label: 'A' | 'B'; onStep: (step: ContentStep) => void }) {
  const module = modulesById.get(process.module);
  const steps = stepList(process);
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-2.5 py-2">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-900 text-[9px] font-semibold text-white">{label}</span>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: module?.color }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-semibold text-slate-900">{text(process.title)}</div>
          <div className="text-[9px] text-slate-400">{module?.abbr} · {steps.length} 步 · {objects.size} 对象</div>
        </div>
        <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-400">{statusLabels[process.status]}</span>
      </div>
      <div className="max-h-[210px] space-y-0.5 overflow-y-auto p-1.5">
        {steps.map((step, index) => (
          <button key={step.id} type="button" onClick={() => onStep(step)} className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-slate-50">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-slate-100 text-[8px] text-slate-400">{index + 1}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[10px] text-slate-700">{text(step.title)}</span><span className="block truncate font-mono text-[8px] text-slate-400">{step.tcode ?? '—'} · {step.objects.length} 对象</span></span>
            <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function CompareButton({ scene }: { scene: ContentScene }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (scene.level !== 'process') return null;
  const params = new URLSearchParams(location.search);
  const active = Boolean(params.get('compare'));
  const toggle = () => {
    const next = new URLSearchParams(location.search);
    if (active) next.delete('compare');
    else {
      next.delete('step'); next.delete('object'); next.delete('tab'); next.delete('dock');
      const current = processesById.get(scene.process ?? '');
      const other = content.processes.find((process) => process.module === current?.module && process.id !== current?.id);
      if (other) next.set('compare', other.id);
    }
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' });
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={active} aria-label={active ? '关闭流程对比' : '对比流程'} className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors', active ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
      <GitCompare className="h-3.5 w-3.5" /> 对比
    </button>
  );
}

export function ComparePanel({ scene }: { scene: ContentScene }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const compareId = params.get('compare');
  const left = scene.level === 'process' ? processesById.get(scene.process ?? '') : undefined;
  const right = compareId ? processesById.get(compareId) : undefined;
  if (!left || !right) return null;

  const close = () => {
    const next = new URLSearchParams(location.search);
    next.delete('compare');
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next.toString()}` : '' }, { replace: true });
  };
  const select = (id: string) => {
    const next = new URLSearchParams(location.search);
    next.set('compare', id);
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true });
  };
  const openStep = (step: ContentStep, process: ContentProcess) => {
    navigate({ pathname: processRoute(process), search: `?step=${encodeURIComponent(step.id)}&dock=pin&view=track` });
  };

  const leftObjects = objectSet(left);
  const rightObjects = objectSet(right);
  const shared = [...leftObjects].filter((id) => rightObjects.has(id));
  const onlyLeft = [...leftObjects].filter((id) => !rightObjects.has(id));
  const onlyRight = [...rightObjects].filter((id) => !leftObjects.has(id));
  const leftSteps = stepList(left).map((step) => step.id);
  const rightSteps = stepList(right).map((step) => step.id);
  const sharedSteps = leftSteps.filter((id) => rightSteps.includes(id));

  const groups = content.modules
    .map((module) => ({ module, processes: content.processes.filter((process) => process.module === module.id) }))
    .filter((group) => group.processes.length > 0);

  return (
    <section className="flex h-[300px] shrink-0 flex-col border-t border-slate-200 bg-white/95" aria-label="流程对比">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-50 text-sky-600"><GitCompare className="h-4 w-4" /></span>
        <div className="min-w-0">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Compare processes</div>
          <div className="text-[12px] font-semibold text-slate-900">流程对比 · 共同 {shared.length} 对象 / 仅 A {onlyLeft.length} / 仅 B {onlyRight.length}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select value={right.id} onChange={(event) => select(event.target.value)} aria-label="选择对比流程" className="h-7 max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600 outline-none focus:border-sky-300">
            {groups.map((group) => <optgroup key={group.module.id} label={`${group.module.abbr} · ${text(group.module.title)}`}>{group.processes.map((process) => <option key={process.id} value={process.id}>{text(process.title)}</option>)}</optgroup>)}
          </select>
          <button type="button" onClick={close} aria-label="关闭流程对比" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto p-2.5 md:grid-cols-2">
        <ProcessColumn process={left} objects={leftObjects} label="A" onStep={(step) => openStep(step, left)} />
        <ProcessColumn process={right} objects={rightObjects} label="B" onStep={(step) => openStep(step, right)} />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-1.5 text-[9px] text-slate-400">
        <span>路径对比：共同步骤 {sharedSteps.length} / A {leftSteps.length} / B {rightSteps.length}</span>
        <span className="min-w-0 max-w-[55%] truncate" title={`共同：${shared.map((id) => objectsById.get(id)?.technicalName ?? id).join('、')}；仅 A：${onlyLeft.map((id) => objectsById.get(id)?.technicalName ?? id).join('、')}；仅 B：${onlyRight.map((id) => objectsById.get(id)?.technicalName ?? id).join('、')}`}>共同：{shared.slice(0, 5).map((id) => objectsById.get(id)?.technicalName ?? id).join('、') || '无'}</span>
        <span className="rounded bg-slate-50 px-1.5 py-0.5">仅 A {onlyLeft.length} · 仅 B {onlyRight.length}</span>
        <button type="button" onClick={() => { close(); navigate(processRoute(right)); }} className="ml-auto flex h-6 items-center gap-1 rounded-md bg-slate-900 px-2 text-[10px] font-medium text-white hover:bg-slate-700">打开 B 流程 <ArrowRight className="h-3 w-3" /></button>
      </div>
    </section>
  );
}
