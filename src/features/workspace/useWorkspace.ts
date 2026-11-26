import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { objectsById, stepsById } from '@/content/data';
import {
  EMPTY_FILTERS,
  filtersWithUpdates,
  hrefFor,
  normalizeView,
  readDock,
  readFilters,
  readSelection,
  searchWithUpdates,
  type DockMode,
  type FilterState,
  type Selection,
  type ViewId,
} from '@/lib/workspace';
import type { ContentScene } from '@/content/schemas';

export function useWorkspaceNavigation(scene: ContentScene) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selection = useMemo(() => {
    const current = readSelection(params);
    if (!current) return null;
    const exists = current.kind === 'object' ? objectsById.has(current.id) : stepsById.has(current.id);
    return exists ? current : null;
  }, [params]);
  const filters = useMemo(() => readFilters(params), [params]);
  const view = useMemo(() => normalizeView(params.get('view'), scene.level, selection?.kind === 'object'), [params, scene.level, selection?.kind]);
  const dock = useMemo(() => readDock(params, selection), [params, selection]);
  const story = params.get('story');

  const replace = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = searchWithUpdates(params, updates);
      const query = next.toString();
      navigate({ pathname: location.pathname, search: query ? `?${query}` : '' }, { replace: true });
    },
    [location.pathname, navigate, params],
  );

  const setView = useCallback((next: ViewId) => replace({ view: next }), [replace]);

  const setFilters = useCallback(
    (next: FilterState) => {
      const search = filtersWithUpdates(params, next);
      const query = search.toString();
      navigate({ pathname: location.pathname, search: query ? `?${query}` : '' }, { replace: true });
    },
    [location.pathname, navigate, params],
  );

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  const selectStep = useCallback(
    (id: string, mode: DockMode = 'peek') => {
      replace({ step: id, object: null, tab: 'overview', dock: mode });
    },
    [replace],
  );

  const selectObject = useCallback(
    (id: string, mode: DockMode = 'pin') => {
      replace({ step: null, object: id, tab: 'overview', dock: mode });
    },
    [replace],
  );

  const select = useCallback(
    (selectionNext: Selection, mode: DockMode = 'peek') => {
      if (selectionNext.kind === 'step') selectStep(selectionNext.id, mode);
      else selectObject(selectionNext.id, mode);
    },
    [selectObject, selectStep],
  );

  const clearSelection = useCallback(() => replace({ step: null, object: null, tab: null, dock: null }), [replace]);

  const setDock = useCallback((mode: DockMode) => replace({ dock: mode }), [replace]);
  const setTab = useCallback((tab: string) => replace({ tab }), [replace]);

  const href = useCallback(
    (pathname: string, updates: Record<string, string | null | undefined> = {}) =>
      hrefFor(pathname, location.search, updates),
    [location.search],
  );

  return {
    params,
    pathname: location.pathname,
    selection,
    filters,
    view,
    dock,
    story,
    replace,
    setView,
    setFilters,
    resetFilters,
    selectStep,
    selectObject,
    select,
    clearSelection,
    setDock,
    setTab,
    href,
  };
}
