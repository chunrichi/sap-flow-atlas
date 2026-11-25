import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, Braces, GitBranch, Info, Layers3 } from "lucide-react";
import {
  content,
  modulesById,
  objectsById,
  objectTypeLabels,
  objectTypeShort,
  objectsForStep,
  processesById,
  stepsById,
  statusLabels,
  text,
} from "@/content/data";
import type {
  ContentModule,
  ContentObject,
  ContentProcess,
  ContentScene,
  ContentStep,
  SceneGroup,
  SceneNode,
} from "@/content/schemas";
import { cn } from "@/lib/cn";
import { useLod } from "./lod";

export type AtlasNodeData = {
  sceneNode: SceneNode;
  scene: ContentScene;
  index?: number;
  related?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onActivate: () => void;
  onHover?: (event: PointerEvent<HTMLElement>) => void;
  onHoverFocus?: (rect: DOMRect) => void;
  onLeave?: () => void;
};

export type GroupNodeData = {
  group: SceneGroup;
};

function refValue(ref?: string): string {
  if (!ref) return "";
  const divider = ref.indexOf(":");
  return divider === -1 ? ref : ref.slice(divider + 1);
}

function colorForModule(module: ContentModule | undefined): string {
  return module?.color ?? "#2563eb";
}

function moduleForSceneNode(node: SceneNode): ContentModule | undefined {
  if (node.module) return modulesById.get(node.module);
  if (node.ref?.startsWith("module:")) return modulesById.get(refValue(node.ref));
  if (node.ref?.startsWith("process:")) {
    const process = processesById.get(refValue(node.ref));
    return process ? modulesById.get(process.module) : undefined;
  }
  if (node.ref?.startsWith("step:")) {
    const step = stepsById.get(refValue(node.ref));
    return step ? modulesById.get(step.primaryModule) : undefined;
  }
  if (node.ref?.startsWith("object:")) return modulesById.get(objectsById.get(refValue(node.ref))?.module ?? "");
  return undefined;
}

function colorForSceneNode(node: SceneNode): string {
  const module = moduleForSceneNode(node);
  if (module) return module.color;
  return "#2563eb";
}

function activateOnKey(event: KeyboardEvent<HTMLElement>, onActivate: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function hoverHandlers(data: AtlasNodeData) {
  return {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => data.onHover?.(event),
    onPointerLeave: () => data.onLeave?.(),
    onFocus: (event: FocusEvent<HTMLElement>) => data.onHoverFocus?.(event.currentTarget.getBoundingClientRect()),
    onBlur: () => data.onLeave?.(),
  };
}

function NodeShell({
  children,
  color,
  className,
  data,
  label,
}: {
  children: ReactNode;
  color: string;
  className?: string;
  data: AtlasNodeData;
  label: string;
}) {
  const transitionName = data.sceneNode.kind === "module" ? `module-${refValue(data.sceneNode.ref)}` : undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      className={cn("node-card text-left", data.related && "node-related", data.selected && "node-selected", data.dimmed && "node-dimmed", className)}
      style={{ "--module-color": color, viewTransitionName: transitionName } as CSSProperties}
      onKeyDown={(event) => activateOnKey(event, data.onActivate)}
      {...hoverHandlers(data)}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      {children}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      title={statusLabels[status] ?? status}
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "verified" && "bg-emerald-500",
        status === "reviewed" && "bg-sky-500",
        status === "draft" && "bg-slate-300",
      )}
    />
  );
}

export function ModuleNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const lod = useLod();
  const module = modulesById.get(refValue(data.sceneNode.ref));
  if (!module) return null;
  const processes = content.processes.filter((process) => process.module === module.id).length;
  const steps = content.steps.filter((step) => step.modules.includes(module.id)).length;
  const color = module.color;

  return (
    <NodeShell
      data={data}
      color={color}
      label={`${text(module.title)} 模块`}
      className="module-glow"
    >
      <div className="flex h-full flex-col p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="grid h-7 min-w-7 place-items-center rounded-lg px-2 text-[10px] font-bold tracking-wide text-white"
              style={{ background: color }}
            >
              {module.abbr}
            </span>
            <StatusDot status={module.status} />
          </div>
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-medium tracking-[0.12em] text-slate-400">
            MODULE
          </span>
        </div>
        <h3 className="mt-2.5 truncate text-[15px] font-semibold tracking-tight text-slate-900">
          {text(module.title)}
        </h3>
        {lod > 0 ? (
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{text(module.summary)}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2 text-[10px] text-slate-400">
          <span>
            {processes} 流程 · {steps} 步骤
          </span>
          <span className="flex items-center gap-0.5 font-medium text-slate-500">
            进入 <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </NodeShell>
  );
}

export function ProcessNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const lod = useLod();
  const process = processesById.get(refValue(data.sceneNode.ref));
  if (!process) return null;
  const module = modulesById.get(process.module);
  const steps = process.steps.length;
  const objects = new Set(
    process.steps.flatMap((id) => stepsById.get(id)?.objects ?? []),
  ).size;
  const color = colorForModule(module);

  return (
    <NodeShell data={data} color={color} label={`${text(process.title)} 流程`}>
      <div className="flex h-full flex-col p-4 pl-5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-slate-500">
            {module?.abbr} · {process.stage}
          </span>
          <StatusDot status={process.status} />
        </div>
        <h3 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug text-slate-900">
          {text(process.title)}
        </h3>
        {lod > 0 ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{text(process.summary)}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2 text-[10px] text-slate-400">
          <span>
            {steps} 步骤 · {objects} 对象
          </span>
          <span className="flex items-center gap-0.5 font-medium text-slate-500">
            打开流程 <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </NodeShell>
  );
}

export function StepNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const lod = useLod();
  const step = stepsById.get(refValue(data.sceneNode.ref));
  if (!step) return null;
  const module = modulesById.get(step.primaryModule);
  const objects = objectsForStep(step);
  const grouped = objects.reduce<Record<string, number>>((acc, object) => {
    acc[object.type] = (acc[object.type] ?? 0) + 1;
    return acc;
  }, {});
  const color = colorForModule(module);

  return (
    <NodeShell data={data} color={color} label={`${text(step.title)} 步骤`}>
      <div className="flex h-full flex-col p-3.5 pl-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="grid h-5 min-w-5 place-items-center rounded-md px-1 text-[10px] font-semibold text-white"
              style={{ background: color }}
            >
              {(data.index ?? 0) + 1}
            </span>
            {step.tcode ? (
              <span className="truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-600">
                {step.tcode}
              </span>
            ) : (
              <span className="text-[9px] text-slate-400">STEP</span>
            )}
          </div>
          <StatusDot status={step.status} />
        </div>
        <h3 className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
          {text(step.title)}
        </h3>
        {lod > 0 ? (
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-400">{text(step.summary)}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-1 pt-2">
          {lod > 0 ? (
            <>
              <div className="flex flex-wrap gap-1">
                {Object.entries(grouped)
                  .slice(0, 3)
                  .map(([type, count]) => (
                    <span
                      key={type}
                      className="rounded border border-slate-100 bg-slate-50/80 px-1 py-0.5 text-[8px] font-medium text-slate-500"
                    >
                      {objectTypeShort[type] ?? type} {count > 1 ? count : ""}
                    </span>
                  ))}
              </div>
              <span className="shrink-0 text-[9px] text-slate-400">Hover 看对象</span>
            </>
          ) : (
            <span className="text-[9px] text-slate-400">{objects.length} 个对象</span>
          )}
        </div>
      </div>
    </NodeShell>
  );
}

export function FlowNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const flowId = refValue(data.sceneNode.ref);
  const flow = content.flows.find((item) => item.id === flowId);
  if (!flow) return null;
  const color = "#0284c7";
  return (
    <NodeShell data={data} color={color} label={`${text(flow.title)} 端到端流程`}>
      <div className="flex h-full flex-col p-4 pl-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.14em] text-sky-600">
            <GitBranch className="h-3 w-3" /> VALUE CHAIN
          </span>
          <StatusDot status={flow.status} />
        </div>
        <h3 className="mt-2 text-[14px] font-semibold text-slate-900">{text(flow.title)}</h3>
        <div className="mt-2 flex items-center gap-1">
          {flow.modules.slice(0, 5).map((id) => {
            const module = modulesById.get(id);
            return (
              <span
                key={id}
                title={module ? text(module.title) : id}
                className="h-2 w-2 rounded-full"
                style={{ background: module?.color ?? "#94a3b8" }}
              />
            );
          })}
          <span className="ml-1 text-[9px] text-slate-400">{flow.stages.length} 阶段</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-[10px] text-slate-400">
          <span>{flow.abbr}</span>
          <span className="flex items-center gap-0.5 font-medium text-slate-500">
            查看全景 <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </NodeShell>
  );
}

export function PortalNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const module = data.sceneNode.module ? modulesById.get(data.sceneNode.module) : undefined;
  const color = colorForModule(module);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={text(data.sceneNode.label, "跨模块入口")}
      className="flex h-full w-full flex-col justify-center rounded-2xl border border-dashed bg-white/70 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white"
      style={{
        borderColor: `color-mix(in srgb, ${color} 35%, #e2e8f0)`,
        boxShadow: `inset 3px 0 0 ${color}`,
      }}
      onKeyDown={(event) => activateOnKey(event, data.onActivate)}
      onClick={(event) => {
        event.stopPropagation();
        data.onActivate();
      }}
    >
      <div className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.12em] text-slate-400">
        <Layers3 className="h-3 w-3" /> PORTAL
      </div>
      <div className="mt-1 line-clamp-2 text-[12px] font-semibold text-slate-800">
        {text(data.sceneNode.label, "跨模块查看")}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
        {module ? module.abbr : "跨模块"} <ArrowUpRight className="h-3 w-3" />
      </div>
    </div>
  );
}

export function NoteNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const color = colorForSceneNode(data.sceneNode);
  return (
    <div
      className="flex h-full w-full items-start gap-2 rounded-2xl border border-dashed bg-white/70 p-3 text-[11px] leading-relaxed text-slate-500 backdrop-blur-sm"
      style={{ borderColor: `color-mix(in srgb, ${color} 22%, #e2e8f0)` }}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span>{text(data.sceneNode.label)}</span>
    </div>
  );
}

export function ObjectNode(props: NodeProps) {
  const data = props.data as unknown as AtlasNodeData;
  const lod = useLod();
  const ref = data.sceneNode.ref ?? "";
  const object = objectsById.get(ref);
  if (!object) return null;
  const module = modulesById.get(object.module);
  const color = colorForModule(module);
  const usage = content.objectUsage[object.id]?.length ?? 0;

  return (
    <NodeShell data={data} color={color} label={`${object.technicalName} 开发对象`}>
      <div className="flex h-full flex-col p-3.5 pl-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-white"
            style={{ background: color }}
          >
            {objectTypeLabels[object.type] ?? object.type}
          </span>
          <StatusDot status={object.status} />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Braces className="h-3 w-3 text-slate-400" />
          <span className="line-clamp-2 break-all font-mono text-[10px] font-semibold leading-tight text-slate-800">{object.technicalName}</span>
        </div>
        <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-slate-500">{text(object.title)}</p>
        {lod > 0 ? (
          <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-400">{text(object.summary)}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2 text-[9px] text-slate-400">
          <span>{object.relations.length} 关系</span>
          <span>{usage} 处使用</span>
        </div>
      </div>
    </NodeShell>
  );
}

export function GroupNode(props: NodeProps) {
  const data = props.data as unknown as GroupNodeData;
  const group = data.group;
  const module = group.module ? modulesById.get(group.module) : undefined;
  const color = colorForModule(module);
  return (
    <div
      className="pointer-events-none h-full w-full rounded-3xl border border-dashed"
      style={{
        borderColor: `color-mix(in srgb, ${color} 20%, #e2e8f0)`,
        background: `color-mix(in srgb, ${color} 4%, transparent)`,
      }}
    >
      <div
        className="absolute left-4 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm"
        style={{ color }}
      >
        {text(group.title)}
      </div>
    </div>
  );
}

export const nodeTypes = {
  module: ModuleNode,
  process: ProcessNode,
  step: StepNode,
  flow: FlowNode,
  portal: PortalNode,
  note: NoteNode,
  object: ObjectNode,
  group: GroupNode,
};
