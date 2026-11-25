import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { modulesById, objectsForStep, stepRoute, stepsById, text } from "@/content/data";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";

const STORY = "o2c";
const STEPS = [
  { id: "sd-va01-create-sales-order", stage: "订单", note: "先接住客户需求：订单类型、客户、物料、数量与交期决定后续所有节点。" },
  { id: "sd-vk11-maintain-condition", stage: "定价", note: "价格不是手填：VK11 维护的条件记录会在订单定价时被条件技术读取。" },
  { id: "sd-vkm3-credit-check", stage: "信用", note: "信用检查拦截超限订单；被冻结的订单需要释放后才能继续履约。" },
  { id: "sd-vl01n-create-delivery", stage: "履约", note: "交货把订单转成实物履约；库存、批次与发货日期在这里确定。" },
  { id: "sd-vf01-create-billing", stage: "开票", note: "开票形成应收与收入；发票日期与会计期间必须匹配。" },
  { id: "fi-f28-post-incoming-payment", stage: "收款", note: "收款清销应收，O2C 的资金闭环在这里结束。" },
] as const;

export function StoryOverlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const active = params.get("story") === STORY && location.pathname === "/f/order-to-cash";
  const rawIndex = Number(params.get("storyStep") ?? 0);
  const index = Number.isFinite(rawIndex) ? Math.max(0, Math.min(STEPS.length - 1, rawIndex)) : 0;
  const current = STEPS[index]!;
  const step = stepsById.get(current.id);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useFocusTrap(panelRef, active, closeRef);

  const go = (next: number) => {
    const target = Math.max(0, Math.min(STEPS.length - 1, next));
    const query = new URLSearchParams(location.search);
    query.set("story", STORY);
    query.set("storyStep", String(target));
    navigate({ pathname: location.pathname, search: `?${query.toString()}` }, { replace: true });
  };
  const close = () => {
    const query = new URLSearchParams(location.search);
    query.delete("story");
    query.delete("storyStep");
    navigate({ pathname: location.pathname, search: query.toString() ? `?${query.toString()}` : "" }, { replace: true });
  };

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!active || !step) return null;
  const module = modulesById.get(step.primaryModule);
  const objects = objectsForStep(step).slice(0, 4);
  const isLast = index === STEPS.length - 1;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="订单到收款故事模式"
      tabIndex={-1}
      className="fixed bottom-4 left-1/2 z-40 w-[min(860px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur-md sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
          <BookOpen className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>Guided story · O2C</span>
            <span className="text-slate-300">/</span>
            <span className="text-sky-600">{index + 1} / {STEPS.length}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <h2 aria-live="polite" className="text-[17px] font-semibold tracking-tight text-slate-900">{text(step.title)}</h2>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-medium text-sky-700">{current.stage}</span>
            {step.tcode ? <span className="font-mono text-[10px] text-slate-400">{step.tcode}</span> : null}
          </div>
        </div>
        <button ref={closeRef} type="button" onClick={close} aria-label="退出故事模式" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-600">{current.note}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{text(step.summary)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {objects.map((object) => (
          <span key={object.id} className="rounded-md border border-slate-100 bg-slate-50 px-1.5 py-1 font-mono text-[9px] text-slate-500">{object.technicalName}</span>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[9px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full" style={{ background: module?.color }} /> {module?.abbr}</span>
      </div>

      <div className="mt-4 flex gap-1">
        {STEPS.map((item, i) => (
          <button key={item.id} type="button" onClick={() => go(i)} aria-label={`跳到第 ${i + 1} 步`} className={cn("h-1 flex-1 rounded-full transition-colors", i === index ? "bg-sky-500" : i < index ? "bg-sky-200" : "bg-slate-100 hover:bg-slate-200")} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-40">
          <ArrowLeft className="h-3 w-3" /> 上一步
        </button>
        {isLast ? (
          <button type="button" onClick={() => { close(); navigate(`${stepRoute(step)}&tab=overview`); }} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white hover:bg-slate-700">
            打开这一步 <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <button type="button" onClick={() => go(index + 1)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white hover:bg-slate-700">
            下一步 <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {!isLast ? (
          <button type="button" onClick={() => { close(); navigate(`${stepRoute(step)}&tab=overview`); }} className="flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <ExternalLink className="h-3 w-3" /> <span className="hidden sm:inline">查看步骤</span>
          </button>
        ) : null}
        <span className="hidden text-[9px] text-slate-300 sm:block">← → 切换 · Esc 退出</span>
      </div>
    </div>
  );
}
