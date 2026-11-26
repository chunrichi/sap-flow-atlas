import { describe, expect, it } from 'vitest';
import { flowsById, stepsById, text } from '../src/content/data';
import { buildStory } from '../src/lib/story';

describe('story builder', () => {
  it('keeps the curated O2C story', () => {
    const flow = flowsById.get('order-to-cash')!;
    const entries = buildStory(flow);
    expect(entries).toHaveLength(6);
    expect(entries[0]!.stepId).toBe('sd-va01-create-sales-order');
    expect(entries[entries.length - 1]!.stepId).toBe('fi-f28-post-incoming-payment');
    expect(entries.every((entry) => stepsById.has(entry.stepId))).toBe(true);
  });

  it('builds a 3–8 step story for every flow', () => {
    for (const flow of flowsById.values()) {
      const entries = buildStory(flow);
      expect(entries.length, flow.id).toBeGreaterThanOrEqual(3);
      expect(entries.length, flow.id).toBeLessThanOrEqual(8);
      expect(new Set(entries.map((entry) => entry.stepId)).size, flow.id).toBe(entries.length);
      for (const entry of entries) {
        expect(stepsById.has(entry.stepId), `${flow.id} -> ${entry.stepId}`).toBe(true);
        expect(entry.stage.trim().length, `${flow.id} -> ${entry.stepId}`).toBeGreaterThan(0);
        expect(entry.note.trim().length, `${flow.id} -> ${entry.stepId}`).toBeGreaterThan(0);
      }
    }
  });

  it('covers the P2P stages with a longer story', () => {
    const flow = flowsById.get('procure-to-pay')!;
    expect(buildStory(flow).length).toBeGreaterThanOrEqual(5);
  });

  it('localizes generic stage labels', () => {
    const flow = flowsById.get('procure-to-pay')!;
    const stageTitles = new Set(flow.stages.map((stage) => text(stage.title)));
    const entries = buildStory(flow);
    expect(entries.every((entry) => stageTitles.has(entry.stage))).toBe(true);
  });
});
