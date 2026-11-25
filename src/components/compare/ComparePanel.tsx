import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, GitCompare, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { content, modulesById, objectsById, processRoute, processesById, stepsById, text } from "@/content/data";
import type { ContentProcess, ContentScene, ContentStep } from "@/content/schemas";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";

function objectSet(process: ContentProcess): Set<string> {
  return new Set(process.steps.flatMap((id) => stepsById.get(id)?.objects ?? []));
}

function stepList(process: ContentProcess): ContentStep[] {
  return process.steps.map((id) => stepsById.get(id)).filter((step): step is ContentStep => Boolean(step));
}

function ProcessColumn({ process, objects, label }: { process: ContentProcess; objects: Set<string>; label: "A" | "B" }) {
  const module = modulesById.get(process.module);
  const steps = stepList(process);
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[9px] font-semibold text-slate-500">{label}</span>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: module?.color }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-slate-900">{text(process.title)}</div>
          <div className="text-[9px] text-slate-400">{module?.abbr} · {steps.length} 步 · {objects.size} 对象</div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2 rounded-lg bg-slate-50/70 px-2 py-1.5">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white text-[8px] text-slate-400">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] text-slate-700">{text(step.title)}</span>
              <span className="block truncate font-mono text-[8px] text-slate-400">{step.tcode ?? "—"} · {step.objects.length} 对象</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectChips({ ids, tone }: { ids: string[]; tone: "shared" | "left" | "right" }) {
  if (!ids.length) return <span className="text-[9px] text-slate-300">无</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ids.slice(0, 12).map((id) => {
        const object = objectsById.get(id);
        if (!object) return null;
        return <span key={id} className={cn("rounded-md border px-1.5 py-1 font-mono text-[8px]", tone === "shared" ? "border-sky-100 bg-sky-50 text-sky-700" : "border-slate-100 bg-slate-50 text-slate-500")}>{object.technicalName}</span>;
      })}
      {ids.length > 12 ? <span className="px-1 text-[8px] text-slate-300">+{ids.length - 12}</span> : null}
    </div>
  );
}

export function CompareButton({ scene }: { scene: ContentScene }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (scene.level !== "process") return null;
  const params = new URLSearchParams(location.search);
  const active = Boolean(params.get("compare"));
  const toggle = () => {
    const next = new URLSearchParams(location.search);
    if (active) next.delete("compare");
    else {
      next.delete("step"); next.delete("object"); next.delete("tab");
      const current = processesById.get(scene.process ?? "");
      const other = content.processes.find((process) => process.module === current?.module && process.id !== current?.id);
      if (other) next.set("compare", other.id);
    }
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" });
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={active} aria-label={active ? "关闭流程对比" : "对比流程"} className={cn("panel flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium transition-colors", active ? "text-sky-700" : "text-slate-400 hover:text-slate-700")}>
      <GitCompare className="h-3 w-3" /> <span className="hidden sm:inline">对比</span>
    </button>
  );
}

export function ComparePanel({ scene }: { scene: ContentScene }) {
  const location = useLocation();
  const navigate = useNavigate();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(location.search);
  const compareId = params.get("compare");
  const left = processesById.get(scene.process ?? "");
  const right = compareId ? processesById.get(compareId) : undefined;
  const open = Boolean(left && right && scene.level === "process");
  useFocusTrap(panelRef, open, closeRef);

  const close = () => {
    const next = new URLSearchParams(location.search);
    next.delete("compare");
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next.toString()}` : "" }, { replace: true });
  };
  const select = (id: string) => {
    const next = new URLSearchParams(location.search);
    next.set("compare", id);
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true });
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, compareId]);

  const leftObjects = useMemo(() => (left ? objectSet(left) : new Set<string>()), [left]);
  const rightObjects = useMemo(() => (right ? objectSet(right) : new Set<string>()), [right]);
  const shared = useMemo(() => [...leftObjects].filter((id) => rightObjects.has(id)), [leftObjects, rightObjects]);
  const onlyLeft = useMemo(() => [...leftObjects].filter((id) => !rightObjects.has(id)), [leftObjects, rightObjects]);
  const onlyRight = useMemo(() => [...rightObjects].filter((id) => !leftObjects.has(id)), [leftObjects, rightObjects]);

  if (!open || !left || !right) return null;
  const leftModule = modulesById.get(left.module);
  const rightModule = modulesById.get(right.module);
  const groups = content.modules.map((module) => ({ module, processes: content.processes.filter((process) => process.module === module.id) })).filter((group) => group.processes.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="流程对比" tabIndex={-1} className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-600"><GitCompare className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Compare processes</div>
            <div className="text-[14px] font-semibold text-slate-900">流程对比</div>
          </div>
          <button ref={closeRef} type="button" onClick={close} aria-label="关闭流程对比" className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <ProcessColumn process={left} objects={leftObjects} label="A" />
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2 text-[9px] text-slate-400">
                <span className="shrink-0">对比流程</span>
                <select value={right.id} onChange={(event) => select(event.target.value)} aria-label="选择对比流程" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-sky-300">
                  {groups.map((group) => <optgroup key={group.module.id} label={`${group.module.abbr} · ${text(group.module.title)}`}>{group.processes.map((process) => <option key={process.id} value={process.id}>{text(process.title)}</option>)}</optgroup>)}
                </select>
              </div>
              <ProcessColumn process={right} objects={rightObjects} label="B" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-600">共同对象 · {shared.length}</div>
              <div className="mt-2"><ObjectChips ids={shared} tone="shared" /></div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">仅 A · {onlyLeft.length}</div>
              <div className="mt-2"><ObjectChips ids={onlyLeft} tone="left" /></div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">仅 B · {onlyRight.length}</div>
              <div className="mt-2"><ObjectChips ids={onlyRight} tone="right" /></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
          <span className="hidden text-[9px] text-slate-400 sm:block">对比的是流程中的开发对象集合，不代表运行时依赖。</span>
          <button type="button" onClick={() => { close(); navigate(processRoute(right)); }} className="ml-auto flex h-8 items-center gap-1 rounded-lg bg-slate-900 px-3 text-[10px] font-medium text-white hover:bg-slate-700">打开 B 流程 <ArrowRight className="h-3 w-3" /></button>
        </div>
      </div>
    </div>
  );
}
