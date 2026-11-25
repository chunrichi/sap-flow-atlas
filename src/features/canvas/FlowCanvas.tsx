import { useCallback, useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import { flushSync } from "react-dom";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useLocation, useNavigate } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import { content, objectsById, processesById, sceneRoute, scenesById } from "@/content/data";
import type { ContentScene, SceneNode } from "@/content/schemas";
import { edgeTypes } from "./edges";
import { edgeColor } from "./edgeStyle";
import { LodContext, zoomTier, type LodLevel } from "./lod";
import { Legend } from "./SceneChrome";
import { nodeTypes, type AtlasNodeData } from "./nodes";
import { useUIStore } from "@/store/ui";

function refValue(ref?: string): string {
  if (!ref) return "";
  const divider = ref.indexOf(":");
  return divider === -1 ? ref : ref.slice(divider + 1);
}

function CanvasInner({ scene }: { scene: ContentScene }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { fitView, getZoom } = useReactFlow();
  const [lod, setLod] = useState<LodLevel>(1);
  const minimapOpen = useUIStore((state) => state.minimapOpen);
  const setMinimapOpen = useUIStore((state) => state.setMinimapOpen);
  const selectedObjectId = new URLSearchParams(location.search).get("object");
  const relatedSteps = useMemo(
    () => (selectedObjectId ? new Set(content.objectUsage[selectedObjectId] ?? []) : null),
    [selectedObjectId],
  );
  const filterType = new URLSearchParams(location.search).get("filter");
  const filteredStepIds = useMemo(() => {
    if (!filterType) return null;
    return new Set(
      content.steps
        .filter((step) => step.objects.some((id) => objectsById.get(id)?.type === filterType))
        .map((step) => step.id),
    );
  }, [filterType]);

  const setQuery = useCallback(
    (key: "step" | "object", value: string) => {
      const params = new URLSearchParams(location.search);
      params.delete("step");
      params.delete("object");
      params.set(key, value);
      params.set("tab", "overview");
      navigate({ pathname: location.pathname, search: `?${params.toString()}` });
    },
    [location.pathname, location.search, navigate],
  );

  const navigateWithTransition = useCallback(
    (to: string) => {
      const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
      if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        navigate(to);
        return;
      }
      doc.startViewTransition(() => {
        flushSync(() => navigate(to));
      });
    },
    [navigate],
  );

  const activate = useCallback(
    (sceneNode: SceneNode) => {
      useUIStore.getState().clearHover();
      const ref = sceneNode.ref;
      if (sceneNode.kind === "portal") {
        const target = sceneNode.target;
        if (!target) return;
        const targetScene = scenesById.get(target.scene);
        const base = targetScene ? sceneRoute(targetScene) : "/";
        const params = new URLSearchParams();
        if (target.step) params.set("step", target.step);
        if (target.object) params.set("object", target.object);
        if (params.toString()) params.set("tab", "overview");
        const query = params.toString();
        navigate(`${base}${query ? `?${query}` : ""}`);
        return;
      }
      if (!ref) return;
      if (sceneNode.kind === "object") {
        setQuery("object", ref);
        return;
      }
      if (ref.startsWith("module:")) {
        navigateWithTransition(`/m/${refValue(ref)}`);
        return;
      }
      if (ref.startsWith("process:")) {
        const process = processesById.get(refValue(ref));
        if (process) navigateWithTransition(`/m/${process.module}/p/${process.id}`);
        return;
      }
      if (ref.startsWith("step:")) {
        setQuery("step", refValue(ref));
        return;
      }
      if (ref.startsWith("flow:")) {
        navigate(`/f/${refValue(ref)}`);
      }
    },
    [navigate, navigateWithTransition, setQuery],
  );

  const hoverFor = useCallback(
    (sceneNode: SceneNode) => (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      const kind =
        sceneNode.kind === "step" ? "step" : sceneNode.kind === "process" ? "process" : sceneNode.kind === "object" ? "object" : null;
      if (!kind) return;
      const id = sceneNode.kind === "object" ? sceneNode.ref ?? "" : refValue(sceneNode.ref);
      const rect = event.currentTarget.getBoundingClientRect();
      useUIStore.getState().scheduleHover({ kind, id, x: rect.right + 4, y: rect.top + 12 });
    },
    [],
  );

  const focusHover = useCallback(
    (sceneNode: SceneNode) => (rect: DOMRect) => {
      const kind =
        sceneNode.kind === "step" ? "step" : sceneNode.kind === "process" ? "process" : sceneNode.kind === "object" ? "object" : null;
      if (!kind) return;
      const id = sceneNode.kind === "object" ? sceneNode.ref ?? "" : refValue(sceneNode.ref);
      useUIStore.getState().openHoverNow({ kind, id, x: rect.right + 4, y: rect.top + 12 });
    },
    [],
  );

  const nodes = useMemo<Node[]>(() => {
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
      const stepId = sceneNode.kind === "step" ? refValue(sceneNode.ref) : undefined;
      const processId = sceneNode.kind === "process" ? refValue(sceneNode.ref) : undefined;
      const objectRef = sceneNode.kind === "object" ? sceneNode.ref ?? "" : "";
      const objectType = objectRef ? objectsById.get(objectRef)?.type : undefined;
      const processRelated = Boolean(
        processId && filterType && processesById.get(processId)?.steps.some((id) => filteredStepIds?.has(id)),
      );
      const isFocusable = sceneNode.kind === "step" || sceneNode.kind === "object";
      const isFilterable = isFocusable || sceneNode.kind === "process";
      const objectFocusRelated = !selectedObjectId
        ? true
        : stepId
          ? Boolean(relatedSteps?.has(stepId))
          : objectRef === selectedObjectId;
      const filterRelated = !filterType
        ? true
        : stepId
          ? Boolean(filteredStepIds?.has(stepId))
          : processId
            ? processRelated
            : objectType === filterType;
      const selected = sceneNode.kind === "object" && sceneNode.ref === selectedObjectId;
      const related =
        (Boolean(filterType) && isFilterable && filterRelated) ||
        (Boolean(selectedObjectId) && isFocusable && objectFocusRelated);
      const dimmed =
        (Boolean(filterType) && isFilterable && !filterRelated) ||
        (Boolean(selectedObjectId) && isFocusable && !objectFocusRelated && !selected);
      const data: AtlasNodeData = {
        sceneNode,
        scene,
        related,
        selected,
        dimmed,
        index,
        onActivate: () => activate(sceneNode),
        onHover: hoverFor(sceneNode),
        onHoverFocus: focusHover(sceneNode),
        onLeave: () => useUIStore.getState().scheduleClose(),
      };
      return {
        id: sceneNode.id,
        type: sceneNode.kind,
        position: { x: sceneNode.position[0], y: sceneNode.position[1] },
        style: { width: sceneNode.size[0], height: sceneNode.size[1] },
        data: data as unknown as Record<string, unknown>,
        draggable: false,
        selectable: sceneNode.kind !== "note",
        zIndex: sceneNode.emphasis === "primary" ? 3 : 2,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
    return [...groups, ...contentNodes];
  }, [activate, filteredStepIds, filterType, focusHover, hoverFor, relatedSteps, scene, selectedObjectId]);

  const edges = useMemo<Edge[]>(() => {
    return scene.edges.map((sceneEdge) => ({
      id: sceneEdge.id,
      source: sceneEdge.from,
      target: sceneEdge.to,
      type: "atlas",
      data: { sceneEdge, scene } as unknown as Record<string, unknown>,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 13,
        height: 13,
        color: edgeColor(sceneEdge.kind),
      },
    }));
  }, [scene]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: { x: 40, y: 36 }, duration: 450, maxZoom: 1.15 }).then(() => {
        setLod(zoomTier(getZoom()));
      });
    }, 90);
    return () => window.clearTimeout(timer);
  }, [fitView, getZoom, scene.id]);

  useEffect(() => {
    setMinimapOpen(false);
  }, [scene.id, setMinimapOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "m" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      setMinimapOpen(!useUIStore.getState().minimapOpen);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setMinimapOpen]);

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      if (node.type === "group") return;
      const data = node.data as unknown as AtlasNodeData;
      if (data?.sceneNode) activate(data.sceneNode);
    },
    [activate],
  );

  const onPaneClick = useCallback(() => {
    useUIStore.getState().clearHover();
    const params = new URLSearchParams(location.search);
    if (!params.has("step") && !params.has("object")) return;
    params.delete("step");
    params.delete("object");
    params.delete("tab");
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="h-full w-full">
      <LodContext.Provider value={lod}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={scene.viewport ?? { x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.22}
        maxZoom={1.8}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMoveStart={() => useUIStore.getState().clearHover()}
        onMove={(_, viewport) => {
          const next = zoomTier(viewport.zoom);
          setLod((current) => (current === next ? current : next));
        }}
        onInit={(instance) => setLod(zoomTier(instance.getZoom()))}
        fitView
        fitViewOptions={{ padding: { x: 40, y: 36 } }}
        proOptions={{ hideAttribution: false }}
        className="h-full w-full"
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1.1} color="#d7dee8" />
        <Controls position="bottom-right" showInteractive={false} />
        {minimapOpen ? (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeBorderRadius={4}
            nodeColor={(node) => {
              if (node.type === "module") return "#bfdbfe";
              if (node.type === "process") return "#bae6fd";
              if (node.type === "step") return "#ddd6fe";
              if (node.type === "object") return "#fde68a";
              if (node.type === "flow") return "#7dd3fc";
              return "transparent";
            }}
            nodeStrokeColor={(node) => (node.type === "group" ? "transparent" : "#cbd5e1")}
            maskColor="rgba(248, 250, 252, 0.72)"
            style={{
              width: 168,
              height: 110,
              margin: 16,
              marginBottom: 100,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              background: "#ffffff",
              overflow: "hidden",
            }}
            className="atlas-minimap"
          />
        ) : null}
        {scene.level === "process" || scene.level === "flow" ? (
          <Panel position="bottom-left" style={{ margin: 16 }}>
            <Legend />
          </Panel>
        ) : null}
      </ReactFlow>
      </LodContext.Provider>
    </div>
  );
}

export function FlowCanvas({ scene }: { scene: ContentScene }) {
  return (
    <ReactFlowProvider>
      <CanvasInner scene={scene} />
    </ReactFlowProvider>
  );
}