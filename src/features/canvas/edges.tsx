import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { text } from "@/content/data";
import type { ContentScene, SceneEdge } from "@/content/schemas";
import { cn } from "@/lib/cn";
import { edgeColor } from "./edgeStyle";

export type AtlasEdgeData = {
  sceneEdge: SceneEdge;
  scene: ContentScene;
};

export function AtlasEdge(props: EdgeProps) {
  const data = props.data as unknown as AtlasEdgeData;
  const edge = data.sceneEdge;
  const color = edgeColor(edge.kind);
  const [path, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        className={cn(`edge-${edge.kind}`)}
        style={{
          stroke: color,
          strokeWidth: edge.kind === "handoff" ? 1.9 : edge.kind === "flow" ? 1.4 : 1.6,
          opacity: edge.kind === "flow" ? 0.65 : 0.9,
        }}
      />
      {edge.label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute rounded-md border border-slate-200/80 bg-white/95 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {text(edge.label)}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const edgeTypes = { atlas: AtlasEdge };
