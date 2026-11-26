import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Boxes, ChevronRight, Compass, GitBranch, ListTree, PanelLeftClose, PanelLeftOpen, Search, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { content, flowsById, modulesById, processRoute, processesById, stepRoute, stepsById, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { useWorkspaceStore } from '@/store/workspace';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/cn';

type Props = {
  scene: ContentScene;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
};

export function NavigationRail({ scene, collapsed, onToggleCollapsed, onNavigate }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const activeStep = params.get('step');
  const currentModule = scene.module;
  const currentProcess = scene.process;
  const currentFlow = scene.flow;
  const savedViews = useWorkspaceStore((state) => state.savedViews);
  const removeSavedView = useWorkspaceStore((state) => state.removeSavedView);
  const openSearch = useUIStore((state) => state.setSearchOpen);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(currentModule ? [currentModule] : []));
  const [flowsOpen, setFlowsOpen] = useState(false);

  useEffect(() => {
    if (!currentModule) return;
    setExpanded((previous) => {
      if (previous.has(currentModule)) return previous;
      const next = new Set(previous);
      next.add(currentModule);
      return next;
    });
  }, [currentModule]);

  const modules = useMemo(() => content.modules, []);

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-slate-200/80 bg-white/80 py-2 backdrop-blur-sm">
        <button type="button" onClick={onToggleCollapsed} aria-label="展开导航" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><PanelLeftOpen className="h-4 w-4" /></button>
        <Link to="/" onClick={onNavigate} aria-label="系统全景" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Compass className="h-4 w-4" /></Link>
        <button type="button" onClick={() => openSearch(true)} aria-label="搜索" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Search className="h-4 w-4" /></button>
        <div className="my-1 h-px w-6 bg-slate-200" />
        {modules.map((module) => (
          <Link key={module.id} to={`/m/${module.id}`} onClick={onNavigate} aria-label={text(module.title)} title={text(module.title)} className={cn('grid h-8 w-9 place-items-center rounded-lg text-[9px] font-bold text-white transition-transform hover:scale-105', currentModule === module.id && 'ring-2 ring-slate-900 ring-offset-1')} style={{ background: module.color }}>{module.abbr}</Link>
        ))}
        <Link to="/objects" onClick={onNavigate} aria-label="对象索引" className="mt-1 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Boxes className="h-4 w-4" /></Link>
      </aside>
    );
  }

  return (
    <aside className="flex w-[244px] shrink-0 flex-col border-r border-slate-200/80 bg-white/75 backdrop-blur-sm">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200/70 px-3">
        <ListTree className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-600">知识库导航</span>
        <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400">{modules.length}</span>
        <button type="button" onClick={onToggleCollapsed} aria-label="收起导航" className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><PanelLeftClose className="h-3.5 w-3.5" /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-2 gap-1">
          <Link to="/" onClick={onNavigate} className={cn('flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px]', location.pathname === '/' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}><Compass className="h-3.5 w-3.5" /> 全景</Link>
          <Link to="/objects" onClick={onNavigate} className={cn('flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px]', location.pathname === '/objects' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}><Boxes className="h-3.5 w-3.5" /> 对象</Link>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">模块 / 流程</span>
          <button type="button" onClick={() => setFlowsOpen((value) => !value)} className="text-[9px] text-slate-400 hover:text-slate-700">价值流</button>
        </div>

        <div className="mt-1">
          {modules.map((module) => {
            const processes = content.processes.filter((process) => process.module === module.id);
            const isExpanded = expanded.has(module.id);
            const isCurrent = currentModule === module.id;
            return (
              <div key={module.id} className="mb-0.5">
                <div className={cn('group flex items-center rounded-lg', isCurrent && 'bg-blue-50/70')}>
                  <Link to={`/m/${module.id}`} onClick={onNavigate} aria-current={isCurrent ? 'page' : undefined} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <span className="grid h-5 w-7 shrink-0 place-items-center rounded-md text-[8px] font-bold text-white" style={{ background: module.color }}>{module.abbr}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">{text(module.title)}</span>
                    <span className="shrink-0 text-[9px] text-slate-300">{processes.length}</span>
                  </Link>
                  {processes.length ? (
                    <button type="button" aria-label={isExpanded ? '收起' : '展开'} aria-expanded={isExpanded} onClick={() => setExpanded((previous) => { const next = new Set(previous); if (next.has(module.id)) next.delete(module.id); else next.add(module.id); return next; })} className="mr-1 grid h-6 w-5 shrink-0 place-items-center rounded text-slate-300 hover:bg-white hover:text-slate-600">
                      <ChevronRight className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')} />
                    </button>
                  ) : null}
                </div>
                {isExpanded && processes.length ? (
                  <div className="ml-3 border-l border-slate-200/80 pl-2">
                    {processes.map((process) => {
                      const isActiveProcess = currentProcess === process.id;
                      return (
                        <div key={process.id} className="mb-0.5">
                          <Link to={processRoute(process)} onClick={onNavigate} aria-current={isActiveProcess ? 'page' : undefined} className={cn('block truncate rounded-md px-2 py-1.5 text-[11px] leading-tight', isActiveProcess ? 'bg-slate-900 font-medium text-white' : 'text-slate-600 hover:bg-slate-50')}>{text(process.title)}</Link>
                          {isActiveProcess ? (
                            <div className="mb-1 mt-1 space-y-0.5">
                              {process.steps.map((stepId, index) => {
                                const step = stepsById.get(stepId);
                                if (!step) return null;
                                const isActiveStep = activeStep === step.id;
                                return (
                                  <Link key={step.id} to={`${stepRoute(step)}&dock=peek`} onClick={onNavigate} aria-current={isActiveStep ? 'step' : undefined} className={cn('flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] leading-tight', isActiveStep ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600')}>
                                    <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded text-[8px]', isActiveStep ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400')}>{index + 1}</span>
                                    <span className="truncate">{text(step.title)}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 border-t border-slate-200/70 pt-2">
          <button type="button" onClick={() => setFlowsOpen((value) => !value)} className="flex w-full items-center gap-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <GitBranch className="h-3 w-3" /> 端到端价值流
            <ChevronRight className={cn('ml-auto h-3 w-3 transition-transform', flowsOpen && 'rotate-90')} />
          </button>
          {flowsOpen ? (
            <div className="mt-1 space-y-0.5">
              {content.flows.map((flow) => {
                const first = modulesById.get(flow.modules[0] ?? '');
                const active = currentFlow === flow.id;
                return (
                  <Link key={flow.id} to={`/f/${flow.id}`} onClick={onNavigate} className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]', active ? 'bg-sky-50 font-medium text-sky-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700')}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: first?.color ?? '#0284c7' }} />
                    <span className="min-w-0 flex-1 truncate">{text(flow.title)}</span>
                    <span className="shrink-0 text-[8px] text-slate-300">{flow.abbr}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        {savedViews.length ? (
          <div className="mt-3 border-t border-slate-200/70 pt-2">
            <div className="flex items-center gap-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400"><Bookmark className="h-3 w-3" /> 我的视图</div>
            <div className="mt-1 space-y-0.5">
              {savedViews.map((view) => (
                <div key={view.id} className="group flex items-center gap-1 rounded-md hover:bg-slate-50">
                  <Link to={view.href} onClick={onNavigate} className="min-w-0 flex-1 truncate px-2 py-1.5 text-[10px] text-slate-600">{view.name}</Link>
                  <button type="button" onClick={() => removeSavedView(view.id)} aria-label={`删除 ${view.name}`} className="mr-1 hidden h-5 w-5 place-items-center rounded text-slate-300 hover:bg-white hover:text-rose-500 group-hover:grid"><Trash2 className="h-2.5 w-2.5" /></button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-200/70 p-2">
        <p className="px-1 text-[9px] leading-relaxed text-slate-400">从模块、价值流或对象进入；每条路径都可分享、可刷新。</p>
      </div>
    </aside>
  );
}
