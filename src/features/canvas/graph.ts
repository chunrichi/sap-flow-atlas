import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { PointerEvent } from "react";
import { objectsById, processesById, sceneRoute, scenesById, stepsById } from "@/content/data";
import type { ContentScene, SceneNode } from "@/content/schemas";
import { hasFacetFilters, objectMatchesFilters, processMatchesFilters, stepMatchesFilters, type FilterState } from "@/lib/workspace";
import { edgeColor } from "./edgeStyle";
import type { AtlasNodeData } from "./nodes";

export function refValue(ref?: string): string {
  if (!ref) return "";
  const divider = ref.indexOf(":");
  return divider === -1 ? ref : ref.slice(divider + 1);
}

export type CanvasFocus = {
  selectedObjectId: string | null;
  selectedStepId: string | null;
  relatedStepIds: Set<string> | null;
};

export type CanvasBindings = {
  activate: (sceneNode: SceneNode) => void;
  hover: (sceneNode: SceneNode) => (event: PointerEvent<HTMLElement>) => void;
  hoverFocus: (sceneNode: SceneNode) => (rect: DOMRect) => void;
  leave: () => void;
};

type NodeVisibility = { filterMatch: boolean; hidden: boolean; related: boolean; dimmed: boolean };

function matchesFilters(sceneNode: SceneNode, filters: FilterState): boolean {
  if (sceneNode.kind === "step") {
    const step = sceneNode.ref ? stepsById.get(refValue(sceneNode.ref)) : undefined;
    return step ? stepMatchesFilters(step, filters) : true;
  }
  if (sceneNode.kind === "process") {
    const process = sceneNode.ref ? processesById.get(refValue(sceneNode.ref)) : undefined;
    return process ? processMatchesFilters(process, filters) : true;
  }
  if (sceneNode.kind === "object") {
    const object = sceneNode.ref ? objectsById.get(sceneNode.ref) : undefined;
    return object ? objectMatchesFilters(object, filters) : true;
  }
  return true;
}

function isFocusable(sceneNode: SceneNode): boolean {
  return sceneNode.kind === "step" || sceneNode.kind === "object";
}

function followsObjectFocus(sceneNode: SceneNode, focus: CanvasFocus): boolean {
  if (!focus.selectedObjectId) return true;
  if (sceneNode.kind === "step") {
    return Boolean(sceneNode.ref && focus.relatedStepIds?.has(refValue(sceneNode.ref)));
  }
  return sceneNode.kind === "object" && sceneNode.ref === focus.selectedObjectId;
}

export function isNodeSelected(sceneNode: SceneNode, focus: CanvasFocus): boolean {
  if (sceneNode.kind === "object") return sceneNode.ref === focus.selectedObjectId;
  if (sceneNode.kind !== "step" || !sceneNode.ref || !focus.selectedStepId) return false;
  return refValue(sceneNode.ref) === focus.selectedStepId;
}

/** 过滤、对象聚焦与选中态共同决定一个节点的视觉状态。 */
export function nodeVisibility(
  sceneNode: SceneNode,
  filters: FilterState,
  focus: CanvasFocus,
): NodeVisibility {
  const filterMatch = matchesFilters(sceneNode, filters);
  const filterActive = hasFacetFilters(filters);
  const focusable = isFocusable(sceneNode);
  const relatedToObject = followsObjectFocus(sceneNode, focus);
  const selected = isNodeSelected(sceneNode, focus);
  const hidden = filterActive && filters.isolate && !filterMatch;
  const related =
    (filterActive && filterMatch && focusable) ||
    (Boolean(focus.selectedObjectId) && focusable && relatedToObject);
  const dimmed =
    (filterActive && !filterMatch) ||
    (Boolean(focus.selectedObjectId) && focusable && !relatedToObject && !selected);
  return { filterMatch, hidden, related, dimmed };
}

export function buildCanvasNodes(
  scene: ContentScene,
  filters: FilterState,
  focus: CanvasFocus,
  bind: CanvasBindings,
): Node[] {
  const groups: Node[] = scene.groups.map((group) => ({
    id: group.id,
    type: "group",
    position: { x: group.position[0], y: group.position[1] },
    style: { width: group.size[0], height: group.size[1] },
    data: { group } as unknown as Record<string, unknown>,
    draggable: false,
    selectable: false,
    zIndex: 0,
  }));
  let stepIndex = 0;
  const contentNodes: Node[] = scene.nodes.map((sceneNode) => {
    const index = sceneNode.kind === "step" ? stepIndex++ : undefined;
    const { hidden, related, dimmed } = nodeVisibility(sceneNode, filters, focus);
    const selected = isNodeSelected(sceneNode, focus);
    const data: AtlasNodeData = {
      sceneNode,
      scene,
      related,
      selected,
      dimmed,
      index,
      onActivate: () => bind.activate(sceneNode),
      onHover: bind.hover(sceneNode),
      onHoverFocus: bind.hoverFocus(sceneNode),
      onLeave: bind.leave,
    };
    return {
      id: sceneNode.id,
      type: sceneNode.kind,
      position: { x: sceneNode.position[0], y: sceneNode.position[1] },
      style: { width: sceneNode.size[0], height: sceneNode.size[1] },
      data: data as unknown as Record<string, unknown>,
      draggable: false,
      selectable: sceneNode.kind !== "note",
      hidden,
      zIndex: sceneNode.emphasis === "primary" ? 3 : 2,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
  return [...groups, ...contentNodes];
}

export function buildCanvasEdges(scene: ContentScene, nodes: Node[]): Edge[] {
  const hiddenIds = new Set(nodes.filter((node) => node.hidden).map((node) => node.id));
  return scene.edges.map((sceneEdge) => ({
    id: sceneEdge.id,
    source: sceneEdge.from,
    target: sceneEdge.to,
    type: "atlas",
    data: { sceneEdge, scene } as unknown as Record<string, unknown>,
    hidden: hiddenIds.has(sceneEdge.from) || hiddenIds.has(sceneEdge.to),
    markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13, color: edgeColor(sceneEdge.kind) },
  }));
}

export type Activation =
  | { kind: "query"; key: "step" | "object"; value: string }
  | { kind: "route"; to: string; transition: boolean }
  | null;

/** 把场景节点解析成一次导航动作；找不到目标时返回 null。 */
export function resolveActivation(sceneNode: SceneNode): Activation {
  if (sceneNode.kind === "portal") {
    const target = sceneNode.target;
    if (!target) return null;
    const targetScene = scenesById.get(target.scene);
    const base = targetScene ? sceneRoute(targetScene) : "/";
    const params = new URLSearchParams();
    if (target.step) params.set("step", target.step);
    if (target.object) params.set("object", target.object);
    if (params.toString()) params.set("tab", "overview");
    const query = params.toString();
    return { kind: "route", to: `${base}${query ? `?${query}` : ""}`, transition: false };
  }
  const ref = sceneNode.ref;
  if (!ref) return null;
  if (sceneNode.kind === "object") return { kind: "query", key: "object", value: ref };
  if (ref.startsWith("module:")) return { kind: "route", to: `/m/${refValue(ref)}`, transition: true };
  if (ref.startsWith("process:")) {
    const process = processesById.get(refValue(ref));
    return process ? { kind: "route", to: `/m/${process.module}/p/${process.id}`, transition: true } : null;
  }
  if (ref.startsWith("step:")) return { kind: "query", key: "step", value: refValue(ref) };
  if (ref.startsWith("flow:")) return { kind: "route", to: `/f/${refValue(ref)}`, transition: false };
  return null;
}
