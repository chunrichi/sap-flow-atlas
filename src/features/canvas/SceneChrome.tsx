import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown, Compass, GitBranch, Layers3, Map, MousePointer2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { content, levelLabels, modulesById, text } from "@/content/data";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/cn";
import type { ContentScene } from "@/content/schemas";

function sceneStats(scene: ContentScene): string {
  if (scene.level === "universe") return `${content.stats.modules} 模块 · ${content.stats.flows} 端到端流程`;
  if (scene.level === "module") {
    const processes = content.processes.filter((process) => process.module === scene.module).length;
    const steps = content.steps.filter((step) => step.modules.includes(scene.module ?? "")).length;
    const objectRefs = scene.nodes.filter((node) => node.kind === "object" && node.ref).map((node) => node.ref!);
    if (objectRefs.length > 0) {
      const snippets = content.snippets.filter((snippet) => snippet.objects.some((id) => objectRefs.includes(id))).length;
      return `${objectRefs.length} 对象 · ${snippets} 段代码`;
    }
    return `${processes} 流程 · ${steps} 步骤`;
  }
  if (scene.level === "process") {
    const process = content.processes.find((item) => item.id === scene.process);
    const steps = process?.steps.length ?? 0;
    const objects = new Set(
      (process?.steps ?? []).flatMap((id) => content.steps.find((step) => step.id === id)?.objects ?? []),
    ).size;
    return `${steps} 步骤 · ${objects} 对象`;
  }
  const flow = content.flows.find((item) => item.id === scene.flow);
  return `${flow?.modules.length ?? 0} 模块 · ${flow?.stages.length ?? 0} 阶段`;
}

export function ScenePill({ scene }: { scene: ContentScene }) {
  const parent =
    scene.level === "module" ? "/" : scene.level === "process" ? `/m/${scene.module}` : scene.level === "flow" ? "/" : null;

  return (
    <div className="panel flex items-center gap-3 rounded-2xl px-3 py-2" aria-live="polite">
      {parent ? (
        <Link
          to={parent}
          aria-label="返回上一层"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Compass className="h-3.5 w-3.5" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {levelLabels[scene.level]}
        </div>
        <div className="truncate text-[12px] font-semibold text-slate-900">{text(scene.title)}</div>
      </div>
      <span className="h-6 w-px bg-slate-200" />
      <span className="hidden whitespace-nowrap text-[10px] text-slate-400 sm:block">{sceneStats(scene)}</span>
    </div>
  );
}

export function Legend() {
  return (
    <div className="panel hidden rounded-2xl px-3 py-2 lg:block">
      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        <Layers3 className="h-3 w-3" /> 图例
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-500" /> 模块</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-500" /> 流程</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-violet-500" /> 步骤</span>
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-500" /> 对象</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1"><i className="h-px w-4 bg-slate-400" /> 顺序</span>
        <span className="flex items-center gap-1"><i className="h-px w-4 border-t border-dashed border-blue-400" /> 交接</span>
        <span className="flex items-center gap-1"><i className="h-px w-4 border-t border-dotted border-violet-400" /> 参与</span>
      </div>
    </div>
  );
}

export function CanvasHint() {
  return (
    <div className="panel hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] text-slate-400 md:flex">
      <MousePointer2 className="h-3 w-3" /> 拖动平移 · 滚轮缩放
    </div>
  );
}

export function FlowChip() {
  return (
    <div className="panel hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] text-slate-400 xl:flex">
      <GitBranch className="h-3 w-3" /> 点击模块进入工作区
    </div>
  );
}

export function FlowMenu() {
  const [open, setOpen] = useState(false);
  const priority = [
    "order-to-cash",
    "procure-to-pay",
    "record-to-report",
    "plan-to-produce",
    "acquire-to-retire",
    "hire-to-retire",
    "service-to-cash",
    "project-to-profit",
    "maintain-to-availability",
    "develop-to-deploy",
  ];
  const flows = [...content.flows].sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id));
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label="价值流目录"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="panel flex items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <GitBranch className="h-3.5 w-3.5 text-sky-600" />
        <span className="hidden sm:inline">价值流</span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{flows.length}</span>
        <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="关闭价值流目录"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">端到端价值流</span>
              <span className="text-[9px] text-slate-400">点击进入</span>
            </div>
            <div className="max-h-[min(70vh,520px)] space-y-0.5 overflow-y-auto">
              {flows.map((flow) => {
                const first = modulesById.get(flow.modules[0] ?? "");
                return (
                  <Link
                    key={flow.id}
                    to={`/f/${flow.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: first?.color ?? "#94a3b8" }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-1.5">
                        <span className="truncate text-[11px] font-medium text-slate-800">{text(flow.title)}</span>
                        <span className="shrink-0 text-[9px] text-slate-400">{flow.abbr}</span>
                      </span>
                      <span className="mt-0.5 block text-[9px] text-slate-400">{flow.modules.length} 模块 · {flow.stages.length} 阶段</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function MapToggle() {
  const open = useUIStore((state) => state.minimapOpen);
  const setOpen = useUIStore((state) => state.setMinimapOpen);
  return (
    <button
      type="button"
      aria-label={open ? "隐藏迷你地图" : "显示迷你地图"}
      aria-pressed={open}
      onClick={() => setOpen(!open)}
      className={cn(
        "panel hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium transition-colors md:flex",
        open ? "text-sky-700" : "text-slate-400 hover:text-slate-700",
      )}
    >
      <Map className="h-3 w-3" /> 地图
      <span className="rounded bg-slate-100 px-1 text-[8px] text-slate-400">M</span>
    </button>
  );
}

export function StoryButton({ scene }: { scene: ContentScene }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (scene.flow !== "order-to-cash") return null;
  const params = new URLSearchParams(location.search);
  const active = params.get("story") === "o2c";
  const toggle = () => {
    const next = new URLSearchParams(location.search);
    if (active) {
      next.delete("story");
      next.delete("storyStep");
    } else {
      next.delete("step");
      next.delete("object");
      next.delete("tab");
      next.set("story", "o2c");
      next.set("storyStep", "0");
    }
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? "退出 O2C 故事模式" : "打开 O2C 故事模式"}
      className={cn(
        "panel flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium transition-colors",
        active ? "text-sky-700" : "text-slate-500 hover:text-slate-800",
      )}
    >
      <BookOpen className="h-3 w-3" /> <span className="hidden sm:inline">{active ? "退出故事" : "故事模式"}</span><span className="sm:hidden">{active ? "退出" : "故事"}</span>
    </button>
  );
}