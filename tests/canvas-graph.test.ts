import { describe, expect, it, vi } from "vitest";
import { content } from "@/content/data";
import type { ContentScene, SceneNode } from "@/content/schemas";
import { EMPTY_FILTERS } from "@/lib/workspace";
import {
  buildCanvasEdges,
  buildCanvasNodes,
  nodeVisibility,
  refValue,
  resolveActivation,
  type CanvasBindings,
  type CanvasFocus,
} from "@/features/canvas/graph";

const noFocus: CanvasFocus = { selectedObjectId: null, selectedStepId: null, relatedStepIds: null };
const noBind: CanvasBindings = {
  activate: vi.fn(),
  hover: () => () => undefined,
  hoverFocus: () => () => undefined,
  leave: () => undefined,
};

function scene(nodes: SceneNode[], edges: ContentScene["edges"] = []): ContentScene {
  return {
    id: "test-scene",
    type: "scene",
    level: "process",
    title: { zh: "测试场景" },
    groups: [{ id: "g1", title: { zh: "分组" }, position: [0, 0], size: [400, 300] }],
    nodes,
    edges,
  };
}

function stepNode(id: string, stepId: string): SceneNode {
  return { id, kind: "step", ref: `step:${stepId}`, position: [10, 10], size: [200, 90] };
}

describe("canvas graph", () => {
  it("parses namespaced refs", () => {
    expect(refValue("step:sd-va01")).toBe("sd-va01");
    expect(refValue("plain")).toBe("plain");
    expect(refValue(undefined)).toBe("");
  });

  it("keeps step indices across object nodes", () => {
    const steps = content.steps.slice(0, 2);
    const objectId = content.objects[0]!.id;
    const nodes = buildCanvasNodes(scene([
      stepNode("s1", steps[0]!.id),
      { id: "o1", kind: "object", ref: objectId, position: [0, 0], size: [120, 40] },
      stepNode("s2", steps[1]!.id),
    ]), EMPTY_FILTERS, noFocus, noBind);
    const stepNodes = nodes.filter((node) => node.type === "step");
    expect(stepNodes.map((node) => (node.data as { index?: number }).index)).toEqual([0, 1]);
    expect(nodes[0]!.type).toBe("group");
  });

  it("hides non-matching nodes only in isolate mode", () => {
    const step = content.steps[0]!;
    const s = scene([stepNode("s1", step.id)]);
    const isolate = { ...EMPTY_FILTERS, modules: ["__missing__"], isolate: true };
    const soft = { ...isolate, isolate: false };
    expect(nodeVisibility(s.nodes[0]!, isolate, noFocus).hidden).toBe(true);
    const softNode = nodeVisibility(s.nodes[0]!, soft, noFocus);
    expect(softNode.hidden).toBe(false);
    expect(softNode.dimmed).toBe(true);
  });

  it("dims unrelated object nodes when an object is focused", () => {
    const [objectId, stepIds] = Object.entries(content.objectUsage).find(([, ids]) => ids.length > 0)!;
    const related = new Set(stepIds);
    const focus: CanvasFocus = { selectedObjectId: objectId, selectedStepId: null, relatedStepIds: related };
    const otherObject = content.objects.find((object) => object.id !== objectId)!;
    const nodes = buildCanvasNodes(scene([
      { id: "o1", kind: "object", ref: objectId, position: [0, 0], size: [120, 40] },
      { id: "o2", kind: "object", ref: otherObject.id, position: [0, 80], size: [120, 40] },
    ]), EMPTY_FILTERS, focus, noBind);
    const byId = new Map(nodes.map((node) => [node.id, node.data as { selected?: boolean; dimmed?: boolean }]));
    expect(byId.get("o1")?.selected).toBe(true);
    expect(byId.get("o1")?.dimmed).toBe(false);
    expect(byId.get("o2")?.dimmed).toBe(true);
  });

  it("marks edges hidden when either endpoint is hidden", () => {
    const step = content.steps[0]!;
    const s = scene(
      [stepNode("s1", step.id), { id: "o1", kind: "object", ref: content.objects[0]!.id, position: [0, 0], size: [100, 40] }],
      [
        { id: "e1", kind: "sequence", from: "s1", to: "o1" },
        { id: "e2", kind: "sequence", from: "o1", to: "s1" },
      ],
    );
    const isolate = { ...EMPTY_FILTERS, modules: ["__missing__"], isolate: true };
    const nodes = buildCanvasNodes(s, isolate, noFocus, noBind);
    const edges = buildCanvasEdges(s, nodes);
    expect(edges.every((edge) => edge.hidden)).toBe(true);
  });

  it("resolves node kinds to navigation actions", () => {
    const step = content.steps[0]!;
    const process = content.processes[0]!;
    const flow = content.flows[0]!;
    const targetScene = content.scenes[0]!;
    expect(resolveActivation({ id: "s", kind: "step", ref: `step:${step.id}`, position: [0, 0], size: [1, 1] }))
      .toEqual({ kind: "query", key: "step", value: step.id });
    expect(resolveActivation({ id: "o", kind: "object", ref: "table:VBAK", position: [0, 0], size: [1, 1] }))
      .toEqual({ kind: "query", key: "object", value: "table:VBAK" });
    expect(resolveActivation({ id: "m", kind: "module", ref: "module:sd", position: [0, 0], size: [1, 1] }))
      .toEqual({ kind: "route", to: "/m/sd", transition: true });
    expect(resolveActivation({ id: "p", kind: "process", ref: `process:${process.id}`, position: [0, 0], size: [1, 1] }))
      .toEqual({ kind: "route", to: `/m/${process.module}/p/${process.id}`, transition: true });
    expect(resolveActivation({ id: "f", kind: "flow", ref: `flow:${flow.id}`, position: [0, 0], size: [1, 1] }))
      .toEqual({ kind: "route", to: `/f/${flow.id}`, transition: false });
    const portal = resolveActivation({
      id: "portal", kind: "portal", position: [0, 0], size: [1, 1],
      target: { scene: targetScene.id, step: step.id },
    });
    expect(portal?.kind).toBe("route");
    expect(portal && portal.kind === "route" ? portal.to : "").toContain(`step=${step.id}`);
    expect(resolveActivation({ id: "n", kind: "note", position: [0, 0], size: [1, 1] })).toBeNull();
  });
});