import { useState } from 'react';
import { Compass, X } from 'lucide-react';

const KEY = 'atlas.onboarded.v1';

export function FirstVisitTip({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return !window.localStorage.getItem(KEY); } catch { return false; }
  });
  if (!enabled || !open) return null;
  const close = () => {
    setOpen(false);
    try { window.localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
  };
  return (
    <div className="fixed bottom-10 left-[264px] z-30 hidden w-[320px] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:block" role="note" aria-label="上手提示">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"><Compass className="h-3 w-3" /> 从这里开始</div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">先看全景，再选镜头。地图看关系，轨道读顺序，矩阵看覆盖，清单做批量。</p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] text-slate-400">
        <span className="rounded-md bg-slate-50 px-1.5 py-1">1 点模块下钻</span>
        <span className="rounded-md bg-slate-50 px-1.5 py-1">2 切换镜头</span>
        <span className="rounded-md bg-slate-50 px-1.5 py-1">3 点步骤看详情</span>
      </div>
      <button type="button" onClick={close} aria-label="关闭上手提示" className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-600"><X className="h-3 w-3" /></button>
    </div>
  );
}
