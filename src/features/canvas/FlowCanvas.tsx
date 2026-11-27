import { useCallback, useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import { flushSync } from "react-dom";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import { useLocation, useNavigate } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import { content } from "@/content/data";
import type { ContentScene, SceneNode } from "@/content/schemas";
import type { FilterState } from "@/lib/workspace";
import { edgeTypes } from "./edges";
import {
  buildCanvasEdges,
  buildCanvasNodes,
  resolveActivation,
  type CanvasBindings,
  type CanvasFocus,
} from "./graph";
import { LodContext, zoomTier, type LodLevel } from "./lod";
import { Legend } from "./SceneChrome";
import { nodeTypes, type AtlasNodeData } from "./nodes";
import { useUIStore } from "@/store/ui";

function refValue(ref?: string): string {
  if (!ref) return "";
  const divider = ref.indexOf(":");
  return divider === -1 ? ref : ref.slice(divider + 1);
}

function CanvasInner({ scene, filters, dockOpen, dockWidth }: { scene: ContentScene; filters: FilterState; dockOpen: boolean; dockWidth: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { fitView, getZoom, getNode, setCenter } = useReactFlow();
  const [lod, setLod] = useState<LodLevel>(1);
  const minimapOpen = useUIStore((state) => state.minimapOpen);
  const setMinimapOpen = useUIStore((state) => state.setMinimapOpen);
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedObjectId = params.get("object");
  const selectedStepId = params.get("step");
  const relatedSteps = useMemo(
    () => (selectedObjectId ? new Set(content.objectUsage[selectedObjectId] ?? []) : null),
    [selectedObjectId],
  );

  const setQuery = useCallback(
    (key: "step" | "object", value: string) => {
      const params = new URLSearchParams(location.search);
      params.delete("step");
      params.delete("object");
      params.set(key, value);
      params.set("tab", "overview");
      params.set("dock", "peek");
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
      const action = resolveActivation(sceneNode);
      if (!action) return;
      if (action.kind === "query") {
        setQuery(action.key, action.value);
        return;
      }
      if (action.transition) navigateWithTransition(action.to);
      else navigate(action.to);
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

  const focus = useMemo<CanvasFocus>(
    () => ({ selectedObjectId, selectedStepId, relatedStepIds: relatedSteps }),
    [relatedSteps, selectedObjectId, selectedStepId],
  );
  const bind = useMemo<CanvasBindings>(
    () => ({ activate, hover: hoverFor, hoverFocus: focusHover, leave: () => useUIStore.getState().scheduleClose() }),
    [activate, focusHover, hoverFor],
  );
  const nodes = useMemo(() => buildCanvasNodes(scene, filters, focus, bind), [bind, filters, focus, scene]);
  const edges = useMemo(() => buildCanvasEdges(scene, nodes), [nodes, scene]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      void fitView({ padding: { x: 40, y: 36 }, duration: reduced ? 0 : 450, maxZoom: 1.15 }).then(() => {
        setLod(zoomTier(getZoom()));
      });
    }, 90);
    return () => window.clearTimeout(timer);
  }, [fitView, getZoom, scene.id]);

  useEffect(() => {
    const onFit = () => { void fitView({ padding: { x: 48, y: 40 }, duration: 350, maxZoom: 1.1 }); };
    window.addEventListener('atlas:fit', onFit);
    return () => window.removeEventListener('atlas:fit', onFit);
  }, [fitView]);

  useEffect(() => {
    if (!dockOpen) return;
    const objectNode = selectedObjectId
      ? scene.nodes.find((node) => node.kind === 'object' && node.ref === selectedObjectId)
      : undefined;
    const nodeId = selectedStepId ? `step-${selectedStepId}` : objectNode?.id;
    if (!nodeId) return;
    const timer = window.setTimeout(() => {
      const node = getNode(nodeId);
      if (!node) return;
      const width = node.width ?? (node as unknown as { measured?: { width?: number } }).measured?.width ?? 0;
      const height = node.height ?? (node as unknown as { measured?: { height?: number } }).measured?.height ?? 0;
      const zoom = getZoom();
      const offset = dockWidth / (2 * Math.max(zoom, 0.2));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      void setCenter(node.position.x + width / 2 + offset, node.position.y + height / 2, { zoom, duration: reduced ? 0 : 380 });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [dockOpen, dockWidth, getNode, getZoom, scene.nodes, selectedObjectId, selectedStepId, setCenter]);

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
        {scene.level === "process" ||
        scene.level === "flow" ||
        (scene.level === "module" &&
          content.processes.some((process) => process.module === scene.module && process.variant !== "core")) ? (
          <Panel position="bottom-left" style={{ margin: 16 }}>
            <Legend />
          </Panel>
        ) : null}
      </ReactFlow>
      </LodContext.Provider>
    </div>
  );
}

export function FlowCanvas({ scene, filters, dockOpen = false, dockWidth = 0 }: { scene: ContentScene; filters: FilterState; dockOpen?: boolean; dockWidth?: number }) {
  return (
    <ReactFlowProvider>
      <CanvasInner scene={scene} filters={filters} dockOpen={dockOpen} dockWidth={dockWidth} />
    </ReactFlowProvider>
  );
}