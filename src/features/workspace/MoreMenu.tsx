import { BookmarkPlus, Check, Clock, Keyboard, Link2, MoreHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompareButton } from '@/components/compare/ComparePanel';
import { StoryButton } from '@/components/story/StoryOverlay';
import { content, text } from '@/content/data';
import type { ContentScene } from '@/content/schemas';
import { useRecentStore } from '@/store/recent';
import { cn } from '@/lib/cn';

const LEVEL_LABEL: Record<string, string> = { universe: '全景', module: '模块', process: '流程', flow: '价值流' };

export function MoreMenu({
  scene,
  onSaveCurrent,
  onOpenHelp,
}: {
  scene: ContentScene;
  onSaveCurrent: (name: string) => void;
  onOpenHelp: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const entries = useRecentStore((state) => state.entries);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const save = () => {
    if (!name.trim()) return;
    onSaveCurrent(name.trim());
    setName('');
    setOpen(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} aria-label="更多操作" className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition-colors', open ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">更多</span>
      </button>
      {open ? (
        <div role="menu" aria-label="更多操作" className="absolute right-0 top-full z-50 mt-2 max-h-[75vh] w-[300px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="flex items-center gap-1 px-1 pb-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
            <span>更多</span><span className="h-3 w-px bg-slate-200" /><span className="normal-case tracking-normal text-slate-300">{LEVEL_LABEL[scene.level] ?? ''}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭更多菜单" className="ml-auto grid h-5 w-5 place-items-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-600"><X className="h-3 w-3" /></button>
          </div>

          <div className="rounded-lg bg-slate-50/70 p-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2">
              <BookmarkPlus className="h-3 w-3 text-slate-400" />
              <input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') save(); }} placeholder="保存当前视图…" aria-label="为新视图命名" className="h-7 min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400" />
              <button type="button" onClick={save} disabled={!name.trim()} className="h-5 rounded bg-slate-900 px-1.5 text-[9px] font-medium text-white disabled:opacity-40">保存</button>
            </div>
          </div>

          <div className="mt-1 grid grid-cols-2 gap-1">
            <button type="button" onClick={copy} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11px] text-slate-600 hover:bg-slate-50"><Link2 className="h-3.5 w-3.5 text-slate-400" /> {copied ? '已复制' : '复制链接'}</button>
            <button type="button" onClick={() => { setOpen(false); onOpenHelp(); }} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11px] text-slate-600 hover:bg-slate-50"><Keyboard className="h-3.5 w-3.5 text-slate-400" /> 快捷键</button>
          </div>

          <div className="mt-1 border-t border-slate-100 pt-1" onClick={() => setOpen(false)}>
            <CompareButton scene={scene} />
            <StoryButton scene={scene} />
          </div>

          {entries.length ? (
            <div className="mt-1 border-t border-slate-100 pt-1">
              <div className="flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-slate-400"><Clock className="h-3 w-3" /> 最近</div>
              <div className="space-y-0.5">
                {entries.map((entry) => (
                  <Link key={entry.path} to={entry.path} onClick={() => setOpen(false)} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                    <span className="text-[9px] text-slate-300">{LEVEL_LABEL[entry.level]}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {scene.level === 'universe' ? (
            <div className="mt-1 border-t border-slate-100 pt-1">
              <div className="px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-slate-400">端到端价值流</div>
              <div className="grid grid-cols-2 gap-0.5">
                {content.flows.map((flow) => (
                  <Link key={flow.id} to={`/f/${flow.id}`} onClick={() => setOpen(false)} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-slate-600 hover:bg-slate-50">
                    <span className="font-mono text-[9px] text-slate-300">{flow.abbr}</span><span className="truncate">{text(flow.title)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-1 flex items-center gap-1 border-t border-slate-100 px-2 pt-1.5 text-[9px] text-slate-300">
            <Check className="h-2.5 w-2.5" /> 当前 URL 可直接分享或保存
          </div>
        </div>
      ) : null}
    </div>
  );
}
