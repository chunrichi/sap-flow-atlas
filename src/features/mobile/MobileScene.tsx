import { ArrowRight, ChevronRight, GitBranch, Info, Layers3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  content,
  modulesById,
  objectsById,
  objectTypeLabels,
  objectTypeShort,
  processesById,
  scenesById,
  sceneRoute,
  stepsById,
  text,
} from "@/content/data";
import type { ContentScene, SceneNode } from "@/content/schemas";

function refValue(ref?: string): string {
  if (!ref) return "";
  const divider = ref.indexOf(":");
  return divider === -1 ? ref : ref.slice(divider + 1);
}

function orderNodes(scene: ContentScene): SceneNode[] {
  const nodes = scene.nodes.filter((node) => node.kind !== "group");
  if (scene.level === "process") {
    return [...nodes].sort((a, b) => a.position[0] - b.position[0]);
  }
  return [...nodes].sort((a, b) => a.position[1] - b.position[1] || a.position[0] - b.position[0]);
}

export function MobileScene({ scene }: { scene: ContentScene }) {
  const navigate = useNavigate();
  const location = useLocation();
  const nodes = orderNodes(scene).filter((node) => node.kind !== "note");
  const notes = scene.nodes.filter((node) => node.kind === "note");

  const openQuery = (key: "step" | "object", value: string) => {
    const params = new URLSearchParams(location.search);
    params.delete("step");
    params.delete("object");
    params.set(key, value);
    params.set("tab", "overview");
    navigate({ pathname: location.pathname, search: `?${params.toString()}` });
  };

  const activate = (node: SceneNode) => {
    if (node.kind === "portal") {
      const target = node.target;
      if (!target) return;
      const targetScene = scenesById.get(target.scene);
      const base = targetScene ? sceneRoute(targetScene) : "/";
      const params = new URLSearchParams();
      if (target.step) params.set("step", target.step);
      if (target.object) params.set("object", target.object);
      if (params.toString()) params.set("tab", "overview");
      navigate(`${base}${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }
    if (!node.ref) return;
    if (node.kind === "object") {
      openQuery("object", node.ref);
      return;
    }
    if (node.ref.startsWith("module:")) {
      navigate(`/m/${refValue(node.ref)}`);
      return;
    }
    if (node.ref.startsWith("process:")) {
      const process = processesById.get(refValue(node.ref));
      if (process) navigate(`/m/${process.module}/p/${process.id}`);
      return;
    }
    if (node.ref.startsWith("flow:")) {
      navigate(`/f/${refValue(node.ref)}`);
      return;
    }
    if (node.ref.startsWith("step:")) openQuery("step", refValue(node.ref));
  };

  let stepIndex = 0;

  const assigned = new Set<string>();
  const groups = scene.groups
    .map((group) => {
      const [gx, gy] = group.position;
      const [gw, gh] = group.size;
      const inside = nodes.filter((node) => {
        const [nx, ny] = node.position;
        const [nw, nh] = node.size;
        const cx = nx + nw / 2;
        const cy = ny + nh / 2;
        return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
      });
      for (const node of inside) assigned.add(node.id);
      return { group, nodes: inside };
    })
    .filter((entry) => entry.nodes.length > 0);
  const ungrouped = nodes.filter((node) => !assigned.has(node.id));
  const blocks = groups.length
    ? [...groups.map((entry) => ({ id: entry.group.id, title: entry.group.title, nodes: entry.nodes })), ...(ungrouped.length ? [{ id: "ungrouped", title: { zh: "其他", en: "Other" }, nodes: ungrouped }] : [])]
    : [{ id: "all", title: undefined, nodes }];

  const render = (node: SceneNode) => {
    if (node.kind === "module") {
      const module = modulesById.get(refValue(node.ref));
      if (!module) return null;
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => activate(node)}
          className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-transform active:scale-[0.99]"
          style={{ borderLeft: `3px solid ${module.color}` }}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[9px] font-bold text-white" style={{ background: module.color }}>
            {module.abbr}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-slate-900">{text(module.title)}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[10px] leading-relaxed text-slate-500">{text(module.summary)}</span>
            <span className="mt-1 block text-[9px] text-slate-400">{module.scope.slice(0, 3).join(" · ")}</span>
          </span>
        </button>
      );
    }

    if (node.kind === "process") {
      const process = processesById.get(refValue(node.ref));
      if (!process) return null;
      const module = modulesById.get(process.module);
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => activate(node)}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm active:scale-[0.99]"
        >
          <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: module?.color }} />
          <span className="min-w-0 flex-1">
            <span className="text-[9px] uppercase tracking-[0.12em] text-slate-400">{module?.abbr} · {process.stage}</span>
            <span className="mt-0.5 block text-[13px] font-semibold text-slate-900">{text(process.title)}</span>
            <span className="mt-0.5 line-clamp-2 block text-[10px] leading-relaxed text-slate-500">{text(process.summary)}</span>
            <span className="mt-1 block text-[9px] text-slate-400">{process.steps.length} 步骤 · {process.roles.length} 角色</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
        </button>
      );
    }

    if (node.kind === "step") {
      const step = stepsById.get(refValue(node.ref));
      if (!step) return null;
      const module = modulesById.get(step.primaryModule);
      const index = stepIndex;
      stepIndex += 1;
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => activate(node)}
          className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm active:scale-[0.99]"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-semibold text-white" style={{ background: module?.color }}>
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13px] font-semibold text-slate-900">{text(step.title)}</span>
              {step.tcode ? <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{step.tcode}</span> : null}
            </span>
            <span className="mt-0.5 line-clamp-2 block text-[10px] leading-relaxed text-slate-500">{text(step.summary)}</span>
            <span className="mt-1 flex items-center gap-2 text-[9px] text-slate-400">
              <span>{step.objects.length} 对象</span>
              <span>·</span>
              <span>{module?.abbr}</span>
            </span>
          </span>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
        </button>
      );
    }

    if (node.kind === "flow") {
      const flow = content.flows.find((item) => item.id === refValue(node.ref));
      if (!flow) return null;
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => activate(node)}
          className="flex w-full items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 text-left active:scale-[0.99]"
        >
          <GitBranch className="h-5 w-5 shrink-0 text-sky-500" />
          <span className="min-w-0 flex-1">
            <span className="text-[9px] uppercase tracking-[0.12em] text-sky-500">价值流 · {flow.abbr}</span>
            <span className="mt-0.5 block text-[13px] font-semibold text-slate-900">{text(flow.title)}</span>
            <span className="mt-0.5 block text-[10px] text-slate-500">{flow.modules.length} 模块 · {flow.stages.length} 阶段</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-sky-300" />
        </button>
      );
    }

    if (node.kind === "object") {
      const object = objectsById.get(node.ref ?? "");
      if (!object) return null;
      const module = modulesById.get(object.module);
      const usage = content.objectUsage[object.id]?.length ?? 0;
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => activate(node)}
          className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm active:scale-[0.99]"
        >
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8px] font-semibold text-white" style={{ background: module?.color }}>
            {objectTypeShort[object.type] ?? object.type.slice(0, 3)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-all font-mono text-[11px] font-semibold text-slate-800">{object.technicalName}</span>
            <span className="mt-0.5 block text-[10px] text-slate-500">{text(object.title)}</span>
            <span className="mt-1 block text-[9px] text-slate-400">{object.relations.length} 关系 · {usage} 处使用 · {object.module.toUpperCase()}</span>
          </span>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
        </button>
      );
    }

    if (node.kind === "portal") {
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => activate(node)}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-3.5 text-left active:scale-[0.99]"
        >
          <Layers3 className="h-4 w-4 shrink-0 text-violet-500" />
          <span className="min-w-0 flex-1 text-[12px] font-medium text-slate-700">{text(node.label, "跨模块入口")}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-violet-400" />
        </button>
      );
    }

    return null;
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-canvas)] px-4 pb-28 pt-1">
      <div className="mb-3 flex items-center justify-between text-[9px] text-slate-400">
        <span className="flex items-center gap-1"><Info className="h-3 w-3" /> 轻触卡片查看详情</span>
        <span>{nodes.length} 个节点</span>
      </div>
      <div className="space-y-5">
        {blocks.map((block) => (
          <section key={block.id}>
            {block.title ? (
              <div className="mb-2 flex items-center gap-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                {text(block.title)}
              </div>
            ) : null}
            <div className="space-y-2.5">{block.nodes.map(render)}</div>
          </section>
        ))}
      </div>
      {notes.length > 0 ? (
        <div className="mt-4 space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-white/60 p-3 text-[10px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
              {text(note.label)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
