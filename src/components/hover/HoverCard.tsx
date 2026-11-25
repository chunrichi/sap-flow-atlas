import { useEffect, useMemo } from "react";
import { ArrowRight, Code2, ExternalLink, GitBranch, ListTree, Pin, PinOff, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  modulesById,
  objectTypeLabels,
  objectsById,
  objectsForStep,
  processForStep,
  processesById,
  snippetsForObject,
  snippetsForStep,
  statusLabels,
  stepRoute,
  stepsById,
  stepsForObject,
  text,
} from "@/content/data";
import type { ContentObject, ContentStep } from "@/content/schemas";
import { tokenizeAbap } from "@/lib/abap";
import { cn } from "@/lib/cn";
import { useUIStore } from "@/store/ui";

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  reviewed: "bg-sky-50 text-sky-600",
  verified: "bg-emerald-50 text-emerald-600",
};

function useObjectQuery() {
  const navigate = useNavigate();
  const location = useLocation();
  return (object: ContentObject) => {
    const params = new URLSearchParams(location.search);
    params.delete("step");
    params.set("object", object.id);
    params.set("tab", "overview");
    useUIStore.getState().clearHover();
    navigate({ pathname: location.pathname, search: `?${params.toString()}` });
  };
}

function ObjectChips({ objects, onPick }: { objects: ContentObject[]; onPick: (object: ContentObject) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {objects.slice(0, 5).map((object) => (
        <button
          key={object.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPick(object);
          }}
          className="group flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50/70 px-1.5 py-1 text-[9px] text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <span className="max-w-[110px] truncate font-mono">{object.technicalName}</span>
        </button>
      ))}
      {objects.length > 5 ? (
        <span className="rounded-md bg-slate-50 px-1.5 py-1 text-[9px] text-slate-400">+{objects.length - 5}</span>
      ) : null}
    </div>
  );
}

function CodePreview({ step }: { step: ContentStep }) {
  const snippet = snippetsForStep(step)[0];
  if (!snippet) return null;
  const lines = snippet.code.split("\n").filter(Boolean).slice(0, 5);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-2.5 py-1.5">
        <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
          <Code2 className="h-3 w-3" /> {text(snippet.title)}
        </span>
        <span className="font-mono text-[8px] uppercase text-slate-400">{snippet.language}</span>
      </div>
      <pre className="overflow-hidden px-2.5 py-2 font-mono text-[9px] leading-[1.65] text-slate-600">
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} className="whitespace-pre">
            {tokenizeAbap(line).map((token, tokenIndex) => (
              <span key={`${token.text}-${tokenIndex}`} className={cn(`tok-${token.type}`)}>
                {token.text}
              </span>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}

function StepHover({ step, close }: { step: ContentStep; close: () => void }) {
  const module = modulesById.get(step.primaryModule);
  const objects = objectsForStep(step);
  const process = processForStep(step);
  const navigate = useNavigate();
  const location = useLocation();
  const pickObject = useObjectQuery();

  const openStep = () => {
    const params = new URLSearchParams(location.search);
    params.set("step", step.id);
    params.delete("object");
    params.set("tab", "overview");
    close();
    navigate({ pathname: location.pathname, search: `?${params.toString()}` });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: module?.color }} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-slate-900">{text(step.title)}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-400">
              <span>{module?.abbr}</span>
              <span>·</span>
              <span>{process ? text(process.title) : "未归入流程"}</span>
              {step.tcode ? <span className="rounded bg-slate-100 px-1 font-mono text-slate-500">{step.tcode}</span> : null}
            </div>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8px]", STATUS_CLASS[step.status])}>
          {statusLabels[step.status]}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-slate-500">{text(step.summary)}</p>
      <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400">
        <span>开发对象 {objects.length}</span>
        <span>{step.crossModule.length ? `跨模块 ${step.crossModule.length}` : "单模块步骤"}</span>
      </div>
      <div className="mt-1.5">
        <ObjectChips objects={objects} onPick={pickObject} />
      </div>
      <CodePreview step={step} />
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={openStep}
          className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white transition-colors hover:bg-slate-700"
        >
          打开完整详情 <ArrowRight className="h-3 w-3" />
        </button>
        {process ? (
          <button
            type="button"
            onClick={() => {
              close();
              navigate(`/m/${process.module}/p/${process.id}`);
            }}
            className="flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50"
          >
            <ListTree className="h-3 w-3" /> 流程
          </button>
        ) : null}
      </div>
    </>
  );
}

function ProcessHover({ processId, close }: { processId: string; close: () => void }) {
  const process = processesById.get(processId);
  if (!process) return null;
  const module = modulesById.get(process.module);
  const objects = new Set(process.steps.flatMap((id) => stepsById.get(id)?.objects ?? []));
  const navigate = useNavigate();
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: module?.color }} />
          <div>
            <div className="text-[13px] font-semibold text-slate-900">{text(process.title)}</div>
            <div className="text-[9px] text-slate-400">{module?.abbr} · {process.stage}</div>
          </div>
        </div>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[8px]", STATUS_CLASS[process.status])}>
          {statusLabels[process.status]}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-slate-500">{text(process.summary)}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-center">
        <div><div className="text-[14px] font-semibold text-slate-800">{process.steps.length}</div><div className="text-[8px] text-slate-400">步骤</div></div>
        <div><div className="text-[14px] font-semibold text-slate-800">{objects.size}</div><div className="text-[8px] text-slate-400">对象</div></div>
        <div><div className="text-[14px] font-semibold text-slate-800">{process.roles.length}</div><div className="text-[8px] text-slate-400">角色</div></div>
      </div>
      <button
        type="button"
        onClick={() => { close(); navigate(`/m/${process.module}/p/${process.id}`); }}
        className="mt-3 flex h-7 w-full items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white hover:bg-slate-700"
      >
        进入流程 <ArrowRight className="h-3 w-3" />
      </button>
    </>
  );
}

function ObjectHover({ objectId, close }: { objectId: string; close: () => void }) {
  const object = objectsById.get(objectId);
  if (!object) return null;
  const module = modulesById.get(object.module);
  const steps = stepsForObject(object);
  const snippets = snippetsForObject(object);
  const navigate = useNavigate();
  const location = useLocation();
  const openStep = (step: ContentStep) => {
    close();
    navigate(`${stepRoute(step)}&tab=overview`);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: module?.color }} />
            {objectTypeLabels[object.type] ?? object.type}
          </div>
          <div className="mt-1 truncate font-mono text-[12px] font-semibold text-slate-900">{object.technicalName}</div>
          <div className="truncate text-[9px] text-slate-400">{text(object.title)}</div>
        </div>
        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[8px]", STATUS_CLASS[object.status])}>
          {statusLabels[object.status]}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-slate-500">{text(object.summary)}</p>
      <div className="mt-3 flex items-center gap-4 text-[9px] text-slate-400">
        <span><strong className="text-slate-700">{object.relations.length}</strong> 关系</span>
        <span><strong className="text-slate-700">{steps.length}</strong> 处使用</span>
        <span><strong className="text-slate-700">{snippets.length}</strong> 段代码</span>
      </div>
      {steps.length ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
          <div className="flex items-center justify-between px-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>相关步骤</span>
            <span className="font-normal tracking-normal text-slate-300">{steps.length}</span>
          </div>
          <div className="mt-1 space-y-0.5">
            {steps.slice(0, 3).map((step) => {
              const stepModule = modulesById.get(step.primaryModule);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => openStep(step)}
                  className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-white"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: stepModule?.color }} />
                  <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600">{text(step.title)}</span>
                  <span className="shrink-0 font-mono text-[8px] text-slate-300">{step.tcode ?? stepModule?.abbr}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          close();
          const params = new URLSearchParams(location.search);
          params.delete("step");
          params.set("object", object.id);
          params.set("tab", "overview");
          navigate({ pathname: location.pathname, search: `?${params.toString()}` });
        }}
        className="mt-3 flex h-7 w-full items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white hover:bg-slate-700"
      >
        查看对象详情 <ArrowRight className="h-3 w-3" />
      </button>
    </>
  );
}

export function HoverCard() {
  const hover = useUIStore((state) => state.hover);
  const pinnedHover = useUIStore((state) => state.pinnedHover);
  const cancelClose = useUIStore((state) => state.cancelClose);
  const scheduleClose = useUIStore((state) => state.scheduleClose);
  const clearHover = useUIStore((state) => state.clearHover);
  const pinHover = useUIStore((state) => state.pinHover);
  const unpinHover = useUIStore((state) => state.unpinHover);
  const location = useLocation();
  const active = hover ?? pinnedHover;
  const isPinned = Boolean(pinnedHover && !hover);

  useEffect(() => {
    unpinHover();
  }, [location.pathname, location.search, unpinHover]);

  const position = useMemo(() => {
    if (!active) return { left: 0, top: 0 };
    const width = 360;
    const height = 500;
    const left = active.x + width + 16 > window.innerWidth - 12 ? Math.max(12, active.x - width - 24) : active.x + 12;
    const top = Math.min(Math.max(76, active.y - 8), Math.max(76, window.innerHeight - height - 16));
    return { left, top };
  }, [active]);

  const hoveredStep = active?.kind === "step" ? stepsById.get(active.id) : undefined;

  if (!active) return null;

  const close = () => {
    clearHover();
    unpinHover();
  };

  return (
    <div
      role="dialog"
      aria-label={isPinned ? "已钉住的节点预览" : "节点预览"}
      className="hover-card fixed z-50 w-[360px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.45)]"
      style={{ left: position.left, top: position.top }}
      onPointerEnter={cancelClose}
      onPointerLeave={() => scheduleClose(260)}
    >
      <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => (hover ? pinHover() : unpinHover())}
          aria-label={isPinned ? "取消钉住" : "钉住预览"}
          className={cn(
            "grid h-5 w-5 place-items-center rounded-md hover:bg-slate-100",
            isPinned ? "text-sky-600" : "text-slate-300 hover:text-slate-500",
          )}
        >
          {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="关闭预览"
          className="grid h-5 w-5 place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {hoveredStep ? <StepHover step={hoveredStep} close={close} /> : null}
      {active.kind === "process" ? <ProcessHover processId={active.id} close={close} /> : null}
      {active.kind === "object" ? <ObjectHover objectId={active.id} close={close} /> : null}
      <div className="mt-2 flex items-center gap-1 text-[8px] text-slate-300">
        <GitBranch className="h-2.5 w-2.5" /> 内容来自 content/ · 可继续补充
        {isPinned ? <span className="rounded bg-sky-50 px-1 py-0.5 text-sky-600">已钉住</span> : null}
        {active.kind === "step" ? <ExternalLink className="ml-auto h-2.5 w-2.5" /> : null}
      </div>
    </div>
  );
}
