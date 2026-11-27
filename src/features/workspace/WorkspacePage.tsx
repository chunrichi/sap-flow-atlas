import { lazy, Suspense, useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { content, flowsById, modulesById, objectTypeLabels, objectsById, processRoute, processesById, statusLabels, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { DetailDock } from '@/components/inspector/Inspector';
import { NavigationRail } from '@/components/navigation/NavigationRail';
import { TrackView } from '@/features/views/TrackView';

const FlowCanvas = lazy(() => import('@/features/canvas/FlowCanvas').then((module) => ({ default: module.FlowCanvas })));
const MatrixView = lazy(() => import('@/features/views/MatrixView').then((module) => ({ default: module.MatrixView })));
const TableView = lazy(() => import('@/features/views/TableView').then((module) => ({ default: module.TableView })));
const LineageView = lazy(() => import('@/features/views/LineageView').then((module) => ({ default: module.LineageView })));
import { ComparePanel } from '@/components/compare/ComparePanel';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useWorkspaceStore } from '@/store/workspace';
import { useRecentStore } from '@/store/recent';
import { useUIStore } from '@/store/ui';
import { filterCount, normalizeView, type ViewId } from '@/lib/workspace';
import { cn } from '@/lib/cn';
import { FilterBar } from './FilterBar';
import { FirstVisitTip } from './FirstVisitTip';
import { ShortcutsDialog } from './ShortcutsDialog';
import { PathBand } from './PathBand';
import { StageRail } from './StageRail';
import { StatusBar } from './StatusBar';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { ViewSwitcher } from './ViewSwitcher';
import { useWorkspaceNavigation } from './useWorkspace';

export function WorkspacePage({ scene }: { scene: ContentScene }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isCompact = useMediaQuery('(max-width: 1279px)');
  const ws = useWorkspaceNavigation(scene);
  const { filters, selection, view, dock } = ws;
  const hasObject = selection?.kind === 'object';
  const filtersOpen = useWorkspaceStore((state) => state.filtersOpen);
  const setFiltersOpen = useWorkspaceStore((state) => state.setFiltersOpen);
  const railCollapsed = useWorkspaceStore((state) => state.railCollapsed);
  const toggleRail = useWorkspaceStore((state) => state.toggleRail);
  const drawerOpen = useWorkspaceStore((state) => state.drawerOpen);
  const setDrawerOpen = useWorkspaceStore((state) => state.setDrawerOpen);
  const dockWidth = useWorkspaceStore((state) => state.dockWidth);
  const setDockWidth = useWorkspaceStore((state) => state.setDockWidth);
  const addSavedView = useWorkspaceStore((state) => state.addSavedView);
  const openSearch = useUIStore((state) => state.setSearchOpen);
  const record = useRecentStore((state) => state.record);
  const [helpOpen, setHelpOpen] = useState(() => new URLSearchParams(location.search).get('help') === '1');
  const stageParam = ws.params.get('stage');
  const mobileDefault = isMobile && !ws.params.get('view')
    ? (scene.level === 'universe' || scene.level === 'module' ? 'table' as ViewId : 'track' as ViewId)
    : null;
  const activeView = mobileDefault ?? view;

  useEffect(() => {
    record({ path: location.pathname, title: text(scene.title), level: scene.level });
  }, [location.pathname, record, scene.id, scene.level, scene.title]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search, setDrawerOpen]);

  useEffect(() => {
    if (ws.params.get('filters') === '1') setFiltersOpen(true);
    if (ws.params.get('drawer') === '1') setDrawerOpen(true);
    if (ws.params.get('help') === '1') setHelpOpen(true);
  }, [setDrawerOpen, setFiltersOpen, ws.params]);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    if (ws.params.get('help') === '1') ws.replace({ help: null });
  }, [ws]);

  const setView = useCallback((next: ViewId) => {
    ws.setView(normalizeView(next, scene.level, hasObject));
  }, [hasObject, scene.level, ws]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') {
        if (ws.story) return;
        if (selection) ws.clearSelection();
        else setDrawerOpen(false);
        return;
      }
      if (event.key === '?') {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (event.key === '/') {
        event.preventDefault();
        openSearch(true);
        return;
      }
      if (event.key === 'f' || event.key === 'F') {
        window.dispatchEvent(new CustomEvent('atlas:fit'));
        return;
      }
      if (['1', '2', '3', '4'].includes(event.key)) {
        const views = scene.level === 'universe' || scene.level === 'module' ? ['map', 'matrix', 'table'] : ['track', 'map', 'table'];
        const next = views[Number(event.key) - 1];
        if (next) setView(next as ViewId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch, scene.level, selection, setDrawerOpen, setView, ws]);

  const openProcess = useCallback((id: string) => {
    const process = processesById.get(id);
    if (process) navigate(processRoute(process));
  }, [navigate]);

  const saveCurrent = useCallback((name: string) => {
    addSavedView(name, `${location.pathname}${location.search}`);
  }, [addSavedView, location.pathname, location.search]);

  const onSelectTableStep = useCallback((id: string) => {
    ws.selectStep(id, 'peek');
  }, [ws]);

  const onTableObject = useCallback((id: string) => {
    if (activeView === 'lineage') ws.selectObject(id, 'pin');
    else navigate(`/objects?object=${encodeURIComponent(id)}&dock=pin`);
  }, [activeView, navigate, ws]);

  const resizer = (
    <div
      role="separator"
      aria-label="调整详情宽度"
      tabIndex={0}
      onPointerDown={(event) => {
        if (isMobile) return;
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = dockWidth;
        const move = (moveEvent: PointerEvent) => setDockWidth(startWidth + (startX - moveEvent.clientX));
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      }}
      className="hidden w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-blue-200 md:block"
    />
  );

  const showDock = Boolean(selection) && !ws.story;
  const dockMode = dock ?? 'pin';
  const effectiveDockWidth = dockMode === 'peek' ? 320 : dockWidth;

  const lens = (() => {
    if (activeView === 'map') return <FlowCanvas scene={scene} filters={filters} dockOpen={showDock} dockWidth={effectiveDockWidth} />;
    if (activeView === 'track') return <TrackView scene={scene} filters={filters} selection={selection} stageParam={stageParam} onSelectStep={ws.selectStep} onNavigateProcess={openProcess} />;
    if (activeView === 'matrix') return <MatrixView scene={scene} filters={filters} />;
    if (activeView === 'table') return <TableView scene={scene} filters={filters} selection={selection} onSelectStep={onSelectTableStep} onSelectObject={onTableObject} />;
    if (activeView === 'lineage') return <LineageView objectId={selection?.kind === 'object' ? selection.id : null} onSelectObject={(id) => ws.selectObject(id, 'pin')} onSelectStep={ws.selectStep} />;
    return null;
  })();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-canvas)]">
      <WorkspaceToolbar
        scene={scene}
        view={activeView}
        hasObject={hasObject}
        filters={filters}
        filtersOpen={filtersOpen}
        onViewChange={setView}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
        onOpenDrawer={() => setDrawerOpen(true)}
        onSaveCurrent={saveCurrent}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {isMobile ? <div className="flex justify-center border-b border-slate-200/70 bg-white/80 px-2 py-1"><ViewSwitcherMobile level={scene.level} view={activeView} hasObject={hasObject} onChange={setView} /></div> : null}

      <div className="flex min-h-0 flex-1">
        {!isCompact ? <NavigationRail scene={scene} collapsed={railCollapsed} onToggleCollapsed={toggleRail} /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          {filtersOpen ? (
            <div className="max-h-[46vh] overflow-y-auto">
              <FilterBar filters={filters} onChange={ws.setFilters} onReset={ws.resetFilters} onClose={() => setFiltersOpen(false)} />
            </div>
          ) : null}
          {filterCount(filters) > 0 && !filtersOpen ? (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/70 bg-blue-50/40 px-3 py-1.5 text-[10px] text-blue-700">
              <span className="font-medium">筛选</span>
              {filters.modules.map((id) => <span key={`m-${id}`} className="rounded bg-white px-1.5 py-0.5">{modulesById.get(id)?.abbr ?? id}</span>)}
              {filters.types.map((type) => <span key={`t-${type}`} className="rounded bg-white px-1.5 py-0.5">{objectTypeLabels[type] ?? type}</span>)}
              {filters.statuses.map((status) => <span key={`s-${status}`} className="rounded bg-white px-1.5 py-0.5">{statusLabels[status] ?? status}</span>)}
              {filters.roles.map((role) => <span key={`r-${role}`} className="rounded bg-white px-1.5 py-0.5">{role}</span>)}
              {filters.flow ? <span className="rounded bg-white px-1.5 py-0.5">{text(flowsById.get(filters.flow)?.title)}</span> : null}
              {filters.isolate ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">仅显示匹配</span> : null}
              <button type="button" onClick={ws.resetFilters} className="ml-auto text-[10px] text-blue-500 hover:text-blue-800">清除</button>
            </div>
          ) : null}
          {scene.level === 'flow' ? <StageRail scene={scene} filters={filters} stageParam={stageParam} onStage={(stage) => ws.replace({ stage })} /> : null}
          <div className="relative flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-hidden">
              <Suspense fallback={<div className="grid h-full place-items-center bg-[var(--color-canvas)] text-[11px] text-slate-400">加载视图…</div>}>{lens}</Suspense>
            </div>
            {showDock ? (
              isMobile ? (
                <>
                  {resizer}
                  <div className={cn("absolute inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white shadow-[0_-18px_50px_-24px_rgba(15,23,42,0.45)]", dockMode === 'peek' ? 'h-[46vh]' : 'h-[76vh]')}>
                    <div className="flex h-4 shrink-0 items-center justify-center"><span className="h-1 w-10 rounded-full bg-slate-300" /></div>
                    <div className="min-h-0 flex-1"><DetailDock mode={dockMode} width="100%" /></div>
                  </div>
                </>
              ) : (
                <>{dockMode === 'pin' ? resizer : null}<DetailDock mode={dockMode} width={effectiveDockWidth} /></>
              )
            ) : null}
          </div>
          <ComparePanel scene={scene} />
          <PathBand scene={scene} selection={selection} dock={dock} filters={filters} onSelectStep={ws.selectStep} onNavigateProcess={openProcess} />
        </div>
      </div>
      <StatusBar scene={scene} view={activeView} selection={selection} filters={filters} onHelp={() => setHelpOpen(true)} />
      <FirstVisitTip enabled={scene.level === 'universe' && activeView === 'map'} />
      <ShortcutsDialog open={helpOpen} onClose={closeHelp} />
      {isCompact && drawerOpen ? (
        <div className="fixed inset-0 z-50 flex bg-slate-900/25 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="知识库导航">
          <button type="button" aria-label="关闭导航" className="absolute inset-0 cursor-default" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-10 h-full w-[280px] overflow-hidden bg-white shadow-2xl">
            <NavigationRail scene={scene} collapsed={false} onToggleCollapsed={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ViewSwitcherMobile({ level, view, hasObject, onChange }: { level: ContentScene['level']; view: ViewId; hasObject: boolean; onChange: (view: ViewId) => void }) {
  return <ViewSwitcher level={level} view={view} hasObject={hasObject} onChange={onChange} />;
}
