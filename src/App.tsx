import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useParams, matchPath, Link } from 'react-router-dom';
import { content, flowsById, modulesById, processesById, text } from '@/content/data';
import { sceneForRoute } from '@/lib/scenes';
import { useUIStore } from '@/store/ui';
import { CommandPalette } from '@/components/search/CommandPalette';
import { HoverCard } from '@/components/hover/HoverCard';
import { Header } from '@/components/layout/Header';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { StoryOverlay } from '@/components/story/StoryOverlay';
import { WorkspacePage } from '@/features/workspace/WorkspacePage';

const ObjectsPage = lazy(() => import('@/features/objects/ObjectsPage').then((module) => ({ default: module.ObjectsPage })));

function UniversePage() {
  return <WorkspacePage scene={sceneForRoute({ kind: 'universe' })} />;
}

function ModulePage() {
  const { moduleId } = useParams();
  const module = moduleId ? modulesById.get(moduleId) : undefined;
  if (!moduleId || !module) return <NotFound />;
  return <WorkspacePage scene={sceneForRoute({ kind: 'module', moduleId })} />;
}

function ProcessPage() {
  const { moduleId, processId } = useParams();
  const process = processId ? processesById.get(processId) : undefined;
  if (!process) return <NotFound />;
  if (process.module !== moduleId) {
    return <Navigate to={`/m/${process.module}/p/${process.id}`} replace />;
  }
  return <WorkspacePage scene={sceneForRoute({ kind: 'process', moduleId: process.module, processId: process.id })} />;
}

function FlowPage() {
  const { flowId } = useParams();
  const flow = flowId ? flowsById.get(flowId) : undefined;
  if (!flow) return <NotFound />;
  return <WorkspacePage scene={sceneForRoute({ kind: 'flow', flowId: flow.id })} />;
}

function NotFound() {
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <div className="panel max-w-md rounded-3xl px-8 py-10 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">404</div>
        <h1 className="mt-2 text-[16px] font-semibold text-slate-900">这条路径还没有内容</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-500">检查 URL，或回到系统全景重新进入。内容可以在 content/ 下持续补充。</p>
        <Link to="/" className="mt-5 inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-[12px] font-medium text-white hover:bg-slate-700">回到系统全景</Link>
      </div>
    </div>
  );
}

function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation();
  return useMemo(() => {
    if (pathname === '/objects') return [{ label: '全部模块', to: '/' }, { label: '开发对象索引' }];
    const processMatch = matchPath('/m/:moduleId/p/:processId', pathname);
    if (processMatch) {
      const module = modulesById.get(processMatch.params.moduleId ?? '');
      const process = processesById.get(processMatch.params.processId ?? '');
      return [
        { label: '全部模块', to: '/' },
        { label: module ? text(module.title) : '模块', to: `/m/${module?.id ?? ''}` },
        { label: process ? text(process.title) : '流程' },
      ];
    }
    const moduleMatch = matchPath('/m/:moduleId', pathname);
    if (moduleMatch) {
      const module = modulesById.get(moduleMatch.params.moduleId ?? '');
      return [
        { label: '全部模块', to: '/' },
        { label: module ? text(module.title) : '模块' },
      ];
    }
    const flowMatch = matchPath('/f/:flowId', pathname);
    if (flowMatch) {
      const flow = flowsById.get(flowMatch.params.flowId ?? '');
      return [
        { label: '全部模块', to: '/' },
        { label: flow ? text(flow.title) : '端到端流程' },
      ];
    }
    return [{ label: '全部模块' }];
  }, [pathname]);
}

export function App() {
  const breadcrumbs = useBreadcrumbs();
  const openSearch = useUIStore((state) => state.setSearchOpen);

  useEffect(() => {
    const current = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'SAP 系统全景';
    document.title = `${current} · SAP Flow Atlas`;
  }, [breadcrumbs]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-canvas)]">
      <a
        href="#main-canvas"
        onClick={(event) => { event.preventDefault(); document.getElementById('main-canvas')?.focus(); }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-[11px] focus:font-medium focus:text-white"
      >
        跳到主内容
      </a>
      <Header breadcrumbs={breadcrumbs} onSearch={() => openSearch(true)} />
      <main id="main-canvas" tabIndex={-1} className="relative min-h-0 flex-1 overflow-hidden outline-none">
        <Routes>
          <Route path="/" element={<UniversePage />} />
          <Route path="/m/:moduleId" element={<ModulePage />} />
          <Route path="/m/:moduleId/p/:processId" element={<ProcessPage />} />
          <Route path="/f/:flowId" element={<FlowPage />} />
          <Route path="/objects" element={<Suspense fallback={<div className="grid h-full place-items-center text-[11px] text-slate-400">加载对象索引…</div>}><ObjectsPage /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <HoverCard />
        <StoryOverlay />
      </main>
      <CommandPalette />
    </div>
  );
}
