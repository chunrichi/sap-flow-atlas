import { Keyboard, Layers3 } from 'lucide-react';
import { content, objectsById, processesById, stepsById, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { filterCount, viewLabel, type FilterState, type Selection, type ViewId } from '@/lib/workspace';

export function StatusBar({
  scene,
  view,
  selection,
  filters,
  onHelp,
}: {
  scene: ContentScene;
  view: ViewId;
  selection: Selection | null;
  filters: FilterState;
  onHelp?: () => void;
}) {
  const process = scene.level === 'process' ? processesById.get(scene.process ?? '') : undefined;
  const step = selection?.kind === 'step' ? stepsById.get(selection.id) : undefined;
  const object = selection?.kind === 'object' ? objectsById.get(selection.id) : undefined;
  const selectedLabel = step ? text(step.title) : object ? object.technicalName : process ? text(process.title) : text(scene.title);
  return (
    <div className="flex h-7 shrink-0 items-center gap-3 border-t border-slate-200/70 bg-white/85 px-3 text-[10px] text-slate-400">
      <span className="flex items-center gap-1"><Layers3 className="h-3 w-3" /> {content.stats.modules} 模块 · {content.stats.flows} 价值流 · {content.stats.steps} 步骤 · {content.stats.objects} 对象</span>
      <span className="hidden h-3 w-px bg-slate-200 md:block" />
      <span className="hidden md:inline">视图：{viewLabel(view)}</span>
      <span className="min-w-0 truncate" aria-live="polite">当前：{selectedLabel}</span>
      {filterCount(filters) ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600">筛选 {filterCount(filters)}</span> : null}
      <button type="button" onClick={onHelp} className="ml-auto hidden items-center gap-1 rounded px-1 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:flex" aria-label="查看键盘快捷键"><Keyboard className="h-3 w-3" /> ←/→ 步骤 · ? 快捷键</button>
    </div>
  );
}
