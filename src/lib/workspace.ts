import {
  content,
  flowsById,
  modulesById,
  objectsForStep,
  objectsById,
  processForStep,
  processSteps,
  processesById,
  stepsById,
  text,
} from '@/content/data';
import type { ContentFlow, ContentObject, ContentProcess, ContentScene, ContentStep } from '@/content/schemas';

export type ViewId = 'map' | 'track' | 'matrix' | 'table' | 'lineage';
export type WorkspaceLevel = ContentScene['level'];
export type DockMode = 'peek' | 'pin';

export type FilterState = {
  modules: string[];
  types: string[];
  statuses: string[];
  roles: string[];
  flow: string | null;
  isolate: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  modules: [],
  types: [],
  statuses: [],
  roles: [],
  flow: null,
  isolate: false,
};

const VIEW_LABELS: Record<ViewId, string> = {
  map: '地图',
  track: '轨道',
  matrix: '矩阵',
  table: '清单',
  lineage: '脉络',
};

const LEVEL_VIEWS: Record<WorkspaceLevel, ViewId[]> = {
  universe: ['map', 'matrix', 'table'],
  module: ['map', 'matrix', 'table'],
  process: ['track', 'map', 'table'],
  flow: ['track', 'map', 'table'],
};

export function viewLabel(view: ViewId): string {
  return VIEW_LABELS[view];
}

export function viewsForLevel(level: WorkspaceLevel, hasObject: boolean): ViewId[] {
  const base = LEVEL_VIEWS[level] ?? LEVEL_VIEWS.universe;
  if (hasObject) return [...base, 'lineage'];
  return base;
}

export function defaultView(level: WorkspaceLevel): ViewId {
  if (level === 'process' || level === 'flow') return 'track';
  return 'map';
}

export function normalizeView(raw: string | null, level: WorkspaceLevel, hasObject: boolean): ViewId {
  const allowed = viewsForLevel(level, hasObject);
  if (raw && (allowed as string[]).includes(raw)) return raw as ViewId;
  return defaultView(level);
}

function readList(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readFilters(params: URLSearchParams): FilterState {
  const legacyType = params.get('filter');
  return {
    modules: readList(params, 'fmod'),
    types: readList(params, 'ftype').length ? readList(params, 'ftype') : legacyType ? [legacyType] : [],
    statuses: readList(params, 'fstatus'),
    roles: readList(params, 'frole'),
    flow: params.get('fflow') || null,
    isolate: params.get('isolate') === '1',
  };
}

export function filterCount(filters: FilterState): number {
  return filters.modules.length + filters.types.length + filters.statuses.length + filters.roles.length + (filters.flow ? 1 : 0) + (filters.isolate ? 1 : 0);
}

export function hasActiveFilters(filters: FilterState): boolean {
  return filterCount(filters) > 0;
}

export function hasFacetFilters(filters: FilterState): boolean {
  return filters.modules.length + filters.types.length + filters.statuses.length + filters.roles.length + (filters.flow ? 1 : 0) > 0;
}

export function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function updateFilter(filters: FilterState, key: 'modules' | 'types' | 'statuses' | 'roles', value: string): FilterState {
  return { ...filters, [key]: toggleFilterValue(filters[key], value) };
}

export function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.modules.length) params.set('fmod', filters.modules.join(','));
  if (filters.types.length) params.set('ftype', filters.types.join(','));
  if (filters.statuses.length) params.set('fstatus', filters.statuses.join(','));
  if (filters.roles.length) params.set('frole', filters.roles.join(','));
  if (filters.flow) params.set('fflow', filters.flow);
  if (filters.isolate) params.set('isolate', '1');
  return params;
}

export function searchWithUpdates(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') next.delete(key);
    else next.set(key, value);
  }
  return next;
}

export function filtersWithUpdates(
  current: URLSearchParams,
  filters: FilterState,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const key of ['fmod', 'ftype', 'fstatus', 'frole', 'fflow', 'isolate', 'filter']) next.delete(key);
  const serialized = filtersToParams(filters);
  for (const [key, value] of serialized.entries()) next.set(key, value);
  return next;
}

export function hrefFor(pathname: string, search: string, updates: Record<string, string | null | undefined>): string {
  const params = searchWithUpdates(new URLSearchParams(search), updates);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export type Selection = { kind: 'step' | 'object'; id: string };

export function readSelection(params: URLSearchParams): Selection | null {
  const object = params.get('object');
  if (object) return { kind: 'object', id: object };
  const step = params.get('step');
  if (step) return { kind: 'step', id: step };
  return null;
}

export function readDock(params: URLSearchParams, selection: Selection | null): DockMode | null {
  if (!selection) return null;
  return params.get('dock') === 'peek' ? 'peek' : 'pin';
}

export function stepMatchesFilters(step: ContentStep, filters: FilterState): boolean {
  if (filters.modules.length && !filters.modules.includes(step.primaryModule) && !step.modules.some((id) => filters.modules.includes(id))) return false;
  if (filters.statuses.length && !filters.statuses.includes(step.status)) return false;
  if (filters.flow) {
    const process = processForStep(step);
    if (!process || process.flow !== filters.flow) return false;
  }
  if (filters.roles.length) {
    const process = processForStep(step);
    if (!process || !process.roles.some((role) => filters.roles.includes(role))) return false;
  }
  if (filters.types.length) {
    const objects = objectsForStep(step);
    if (!objects.some((object) => filters.types.includes(object.type))) return false;
  }
  return true;
}

export function processMatchesFilters(process: ContentProcess, filters: FilterState): boolean {
  if (filters.modules.length && !filters.modules.includes(process.module)) return false;
  if (filters.statuses.length && !filters.statuses.includes(process.status)) return false;
  if (filters.flow && process.flow !== filters.flow) return false;
  if (filters.roles.length && !process.roles.some((role) => filters.roles.includes(role))) return false;
  if (filters.types.length) {
    const steps = processSteps(process);
    if (!steps.some((step) => objectsForStep(step).some((object) => filters.types.includes(object.type)))) return false;
  }
  return true;
}

export function objectMatchesFilters(object: ContentObject, filters: FilterState): boolean {
  if (filters.modules.length && !filters.modules.includes(object.module)) return false;
  if (filters.statuses.length && !filters.statuses.includes(object.status)) return false;
  if (filters.types.length && !filters.types.includes(object.type)) return false;
  return true;
}

export function statusRank(status: string): number {
  return status === 'verified' ? 3 : status === 'reviewed' ? 2 : 1;
}

export function rollupStatus(statuses: string[]): 'draft' | 'reviewed' | 'verified' {
  if (!statuses.length) return 'draft';
  const min = Math.min(...statuses.map(statusRank));
  return min >= 3 ? 'verified' : min === 2 ? 'reviewed' : 'draft';
}

export function processObjects(process: ContentProcess): ContentObject[] {
  const ids = new Set(process.steps.flatMap((id) => stepsById.get(id)?.objects ?? []));
  return [...ids].map((id) => objectsById.get(id)).filter((object): object is ContentObject => Boolean(object));
}

export function flowForProcessId(processId: string | undefined | null): ContentFlow | undefined {
  const process = processId ? processesById.get(processId) : undefined;
  return process ? flowsById.get(process.flow) : undefined;
}

export function processesForStage(flow: ContentFlow, stageId: string): ContentProcess[] {
  return flow.processes
    .map((id) => processesById.get(id))
    .filter((process): process is ContentProcess => Boolean(process) && process!.stage === stageId);
}

export function stageLabel(flow: ContentFlow, stageId: string | undefined): string {
  if (!stageId) return '';
  return text(flow.stages.find((stage) => stage.id === stageId)?.title, stageId);
}

export function allRoles(): string[] {
  return [...new Set(content.processes.flatMap((process) => process.roles))].sort((a, b) => a.localeCompare(b, 'zh'));
}

export function moduleFlowCount(moduleId: string, flowId: string, filters?: FilterState): number {
  const flow = flowsById.get(flowId);
  if (!flow) return 0;
  let count = 0;
  for (const processId of flow.processes) {
    const process = processesById.get(processId);
    if (!process || process.module !== moduleId) continue;
    const steps = processSteps(process);
    count += filters ? steps.filter((step) => stepMatchesFilters(step, filters)).length : steps.length;
  }
  return count;
}

export function moduleFlowStatuses(moduleId: string, flowId: string): string[] {
  const flow = flowsById.get(flowId);
  if (!flow) return [];
  return flow.processes
    .map((id) => processesById.get(id))
    .filter((process): process is ContentProcess => Boolean(process) && process!.module === moduleId)
    .map((process) => process.status);
}

export type ObjectRelationItem = { object: ContentObject; kind: string; note?: string };

export function objectRelationsBidirectional(object: ContentObject): {
  incoming: ObjectRelationItem[];
  outgoing: ObjectRelationItem[];
} {
  const incoming: ObjectRelationItem[] = [];
  for (const candidate of content.objects) {
    for (const relation of candidate.relations) {
      if (relation.target === object.id) incoming.push({ object: candidate, kind: relation.kind, note: relation.note });
    }
  }
  const outgoing: ObjectRelationItem[] = [];
  for (const relation of object.relations) {
    const target = objectsById.get(relation.target);
    if (target) outgoing.push({ object: target, kind: relation.kind, note: relation.note });
  }
  return { incoming, outgoing };
}
