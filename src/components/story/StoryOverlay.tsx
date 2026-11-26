import { ArrowLeft, ArrowRight, BookOpen, Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { flowsById, modulesById, objectsForStep, processForStep, stepRoute, stepsById, text } from '@/content/data';
import { buildStory } from '@/lib/story';
import { cn } from '@/lib/cn';

export function StoryButton({ scene }: { scene: { level: string; flow?: string } }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (scene.level !== 'flow' || !scene.flow) return null;
  const flow = flowsById.get(scene.flow);
  if (!flow) return null;
  const entries = buildStory(flow);
  if (entries.length < 3) return null;
  const params = new URLSearchParams(location.search);
  const active = params.get('story') === flow.id;
  const toggle = () => {
    const next = new URLSearchParams(location.search);
    if (active) {
      next.delete('story');
      next.delete('storyStep');
    } else {
      next.set('story', flow.id);
      next.set('storyStep', '0');
      next.set('step', entries[0]!.stepId);
      next.set('view', 'track');
      next.delete('object');
      next.delete('tab');
      next.delete('dock');
    }
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' });
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={active} className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors', active ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
      <BookOpen className="h-3.5 w-3.5" /> 故事
    </button>
  );
}

export function StoryOverlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const storyId = params.get('story');
  const flow = storyId ? flowsById.get(storyId) : undefined;
  const active = Boolean(flow && location.pathname === `/f/${storyId}`);
  const entries = useMemo(() => (flow ? buildStory(flow) : []), [flow]);
  const rawIndex = Number(params.get('storyStep') ?? 0);
  const index = Number.isFinite(rawIndex) ? Math.max(0, Math.min(entries.length - 1, rawIndex)) : 0;
  const current = entries[index];
  const step = current ? stepsById.get(current.stepId) : undefined;
  const [playing, setPlaying] = useState(false);

  const go = useCallback((next: number) => {
    if (!flow) return;
    const target = Math.max(0, Math.min(entries.length - 1, next));
    const entry = entries[target];
    const query = new URLSearchParams(location.search);
    query.set('story', flow.id);
    query.set('storyStep', String(target));
    if (entry) query.set('step', entry.stepId);
    query.set('view', 'track');
    query.delete('object');
    query.delete('tab');
    query.delete('dock');
    navigate({ pathname: location.pathname, search: `?${query.toString()}` }, { replace: true });
  }, [entries, flow, location.pathname, location.search, navigate]);

  const close = useCallback(() => {
    const query = new URLSearchParams(location.search);
    query.delete('story');
    query.delete('storyStep');
    if (current) {
      query.set('step', current.stepId);
      query.set('dock', 'pin');
      query.set('view', 'track');
    }
    navigate({ pathname: location.pathname, search: query.toString() ? `?${query.toString()}` : '' }, { replace: true });
  }, [current, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') go(index - 1);
      if (event.key === 'ArrowRight') go(index + 1);
      if (event.key === ' ') { event.preventDefault(); setPlaying((value) => !value); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, close, go, index]);

  useEffect(() => {
    if (!active || !playing) return;
    if (index >= entries.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => go(index + 1), 4800);
    return () => window.clearTimeout(timer);
  }, [active, entries.length, go, index, playing]);

  if (!active || !flow || !current || !step) return null;
  const module = modulesById.get(step.primaryModule);
  const objects = objectsForStep(step).slice(0, 4);
  const process = processForStep(step);
  const isLast = index === entries.length - 1;

  const openStep = () => {
    close();
    navigate(`${stepRoute(step)}&view=track&dock=pin`);
  };

  return (
    <div role="region" aria-label={`${text(flow.title)} 故事模式`} className="fixed bottom-[104px] left-1/2 z-40 w-[min(880px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)] backdrop-blur-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"><BookOpen className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>Guided story · {flow.abbr}</span>
            <span className="text-slate-300">/</span>
            <span className="text-sky-600">{index + 1} / {entries.length}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <h2 aria-live="polite" className="text-[17px] font-semibold tracking-tight text-slate-900">{text(step.title)}</h2>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-medium text-sky-700">{current.stage}</span>
            {step.tcode ? <span className="font-mono text-[10px] text-slate-400">{step.tcode}</span> : null}
          </div>
        </div>
        <button type="button" onClick={close} aria-label="退出故事模式" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-600">{current.note}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{text(step.summary)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {objects.map((object) => <span key={object.id} className="rounded-md border border-slate-100 bg-slate-50 px-1.5 py-1 font-mono text-[9px] text-slate-500">{object.technicalName}</span>)}
        <span className="ml-auto flex items-center gap-1 text-[9px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full" style={{ background: module?.color }} /> {module?.abbr}{process ? ` · ${text(process.title)}` : ''}</span>
      </div>

      <div className="mt-4 flex gap-1">
        {entries.map((entry, i) => (
          <button key={entry.stepId} type="button" onClick={() => go(i)} aria-label={`跳到第 ${i + 1} 步：${entry.stage}`} className={cn('h-1 flex-1 rounded-full transition-colors', i === index ? 'bg-sky-500' : i < index ? 'bg-sky-200' : 'bg-slate-100 hover:bg-slate-200')} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-40"><ArrowLeft className="h-3 w-3" /> 上一步</button>
        <button type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label={playing ? '暂停自动播放' : '自动播放'}>{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
        {isLast ? (
          <button type="button" onClick={openStep} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white hover:bg-slate-700">打开这一步 <ArrowRight className="h-3 w-3" /></button>
        ) : (
          <button type="button" onClick={() => go(index + 1)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 text-[10px] font-medium text-white hover:bg-slate-700">下一步 <ArrowRight className="h-3 w-3" /></button>
        )}
        <button type="button" onClick={openStep} className="hidden h-8 items-center gap-1 rounded-lg px-2 text-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-700 sm:flex">查看步骤</button>
        <span className="hidden text-[9px] text-slate-300 sm:block">← → 切换 · 空格播放 · Esc 退出</span>
      </div>
    </div>
  );
}