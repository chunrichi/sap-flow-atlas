import { describe, expect, it } from 'vitest';
import { flowsById, objectsById, processesById, stepsById } from '../src/content/data';
import {
  EMPTY_FILTERS,
  moduleFlowCount,
  objectRelationsBidirectional,
  processMatchesFilters,
  processesForStage,
  readDock,
  readFilters,
  rollupStatus,
  statusRank,
  stepMatchesFilters,
  normalizeView,
  viewsForLevel,
  hasFacetFilters,
} from '../src/lib/workspace';

describe('workspace filters', () => {
  it('parses facets and legacy object type', () => {
    const params = new URLSearchParams('fmod=fi&ftype=table,bapi&fstatus=reviewed&frole=%E5%BA%94%E4%BB%98%E4%BC%9A%E8%AE%A1&isolate=1&filter=cds');
    const filters = readFilters(params);
    expect(filters.modules).toEqual(['fi']);
    expect(filters.types).toEqual(['table', 'bapi']);
    expect(filters.statuses).toEqual(['reviewed']);
    expect(filters.roles).toEqual(['应付会计']);
    expect(filters.isolate).toBe(true);
    expect(readFilters(new URLSearchParams('filter=cds')).types).toEqual(['cds']);
  });

  it('matches AP steps by object type and isolates BAPI', () => {
    const process = processesById.get('fi-accounts-payable');
    expect(process).toBeTruthy();
    const steps = process!.steps.map((id) => stepsById.get(id)!).filter(Boolean);
    const allTables = { ...EMPTY_FILTERS, types: ['table'] };
    const bapiOnly = { ...EMPTY_FILTERS, types: ['bapi'] };
    expect(steps.filter((step) => stepMatchesFilters(step, allTables)).length).toBeGreaterThan(3);
    expect(steps.filter((step) => stepMatchesFilters(step, bapiOnly)).map((step) => step.id)).toEqual(['mm-miro-verify-invoice']);
    expect(processMatchesFilters(process!, bapiOnly)).toBe(true);
    expect(processMatchesFilters(process!, { ...EMPTY_FILTERS, types: ['idoc'] })).toBe(false);
  });

  it('counts module-flow coverage and stage membership', () => {
    expect(moduleFlowCount('sd', 'order-to-cash')).toBeGreaterThan(10);
    expect(moduleFlowCount('fi', 'procure-to-pay')).toBeGreaterThan(0);
    const flow = flowsById.get('procure-to-pay')!;
    const invoiceProcesses = processesForStage(flow, 'invoice');
    expect(invoiceProcesses.map((process) => process.id)).toContain('fi-accounts-payable');
  });

  it('rolls up statuses and finds reverse object relations', () => {
    expect(rollupStatus([])).toBe('draft');
    expect(rollupStatus(['verified', 'reviewed'])).toBe('reviewed');
    expect(statusRank('verified')).toBeGreaterThan(statusRank('draft'));
    const vbak = objectsById.get('table:VBAK')!;
    const relations = objectRelationsBidirectional(vbak);
    expect(relations.incoming.length).toBeGreaterThanOrEqual(5);
    expect(relations.outgoing.length).toBe(0);
  });
});
describe('workspace view state', () => {
  it('normalizes views by level and object selection', () => {
    expect(normalizeView(null, 'process', false)).toBe('track');
    expect(normalizeView('matrix', 'process', false)).toBe('track');
    expect(normalizeView('table', 'process', false)).toBe('table');
    expect(normalizeView('lineage', 'process', false)).toBe('track');
    expect(normalizeView('lineage', 'process', true)).toBe('lineage');
    expect(viewsForLevel('universe', false)).toEqual(['map', 'matrix', 'table']);
    expect(viewsForLevel('flow', true)).toContain('lineage');
  });

  it('reads dock mode only with a selection', () => {
    expect(readDock(new URLSearchParams('dock=peek'), null)).toBeNull();
    expect(readDock(new URLSearchParams('dock=peek'), { kind: 'step', id: 'x' })).toBe('peek');
    expect(readDock(new URLSearchParams(), { kind: 'object', id: 'x' })).toBe('pin');
  });

  it('distinguishes facets from isolate-only mode', () => {
    expect(hasFacetFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasFacetFilters({ ...EMPTY_FILTERS, isolate: true })).toBe(false);
    expect(hasFacetFilters({ ...EMPTY_FILTERS, types: ['bapi'] })).toBe(true);
  });
});
