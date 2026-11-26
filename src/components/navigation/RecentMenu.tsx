import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { levelLabels } from "@/content/data";
import { useRecentStore } from "@/store/recent";
import { cn } from "@/lib/cn";

export function RecentMenu() {
  const entries = useRecentStore((state) => state.entries);
  const clear = useRecentStore((state) => state.clear);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  if (!entries.length) return null;
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label="最近访问"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
      >
        <History className="h-3 w-3" />
        <span className="hidden sm:inline">最近</span>
        <span className="rounded bg-slate-100 px-1 text-[9px] text-slate-400">{entries.length}</span>
      </button>
      {open ? (
        <>
          <button type="button" aria-label="关闭最近访问" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">最近访问</span>
              <button type="button" onClick={clear} className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-slate-700"><X className="h-2.5 w-2.5" /> 清空</button>
            </div>
            <div className="space-y-0.5">
              {entries.map((entry) => {
                const active = entry.path === location.pathname;
                return (
                  <Link key={entry.path} to={entry.path} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-xl px-2 py-2", active ? "bg-sky-50" : "hover:bg-slate-50")}>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[8px] text-slate-400">{entry.level === "universe" ? "全" : entry.level === "module" ? "模" : entry.level === "process" ? "流" : "端"}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[10px]", active ? "font-medium text-sky-700" : "text-slate-700")}>{entry.title}</span>
                      <span className="text-[8px] text-slate-400">{levelLabels[entry.level]}</span>
                    </span>
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> : null}
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
