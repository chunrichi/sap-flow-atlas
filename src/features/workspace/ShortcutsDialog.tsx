import { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useFocusTrap } from '@/lib/useFocusTrap';

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-50 py-1.5 last:border-b-0">
      <span className="text-[11px] text-slate-600">{label}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((key) => <kbd key={key} className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{key}</kbd>)}
      </span>
    </div>
  );
}

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useFocusTrap(panelRef, open, closeRef);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/25 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="键盘快捷键" tabIndex={-1} className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><Keyboard className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Keyboard shortcuts</div>
            <div className="text-[15px] font-semibold text-slate-900">键盘快捷键</div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭快捷键" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
        </div>
        <div className="grid gap-5 p-4 sm:grid-cols-2">
          <section>
            <h3 className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">视图与导航</h3>
            <Row keys={['1', '2', '3', '4']} label="切换镜头（按当前层级）" />
            <Row keys={['⌘K', '/']} label="搜索知识库" />
            <Row keys={['M']} label="MiniMap 开关（地图）" />
            <Row keys={['F']} label="适配当前场景（地图）" />
            <Row keys={['?']} label="打开快捷键" />
          </section>
          <section>
            <h3 className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">流程与详情</h3>
            <Row keys={['←', '→']} label="上一步 / 下一步" />
            <Row keys={['J', 'K']} label="同左（阅读流程）" />
            <Row keys={['Home', 'End']} label="工序首尾" />
            <Row keys={['双击']} label="从 Peek 固定到详情坞" />
            <Row keys={['Esc']} label="关闭详情 / 关闭弹层" />
          </section>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-[9px] text-slate-400">快捷键在输入框、下拉框和可编辑区域中自动暂停。</div>
      </div>
    </div>
  );
}
