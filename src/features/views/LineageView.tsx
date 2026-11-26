import { ArrowRight, Braces, ChevronRight, Network, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { content, modulesById, objectTypeLabels, processForStep, statusLabels, stepsForObject, text } from '@/content/data';
import type { ContentObject } from '@/content/schemas';
import { objectRelationsBidirectional, type ObjectRelationItem } from '@/lib/workspace';
import { cn } from '@/lib/cn';

type HopItem = ObjectRelationItem & { level: 1 | 2 };

function RelationCard({ item, onOpen }: { item: HopItem; onOpen: () => void }) {
  const module = modulesById.get(item.object.module);
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: module?.color }} />
        <span className="text-[9px] uppercase tracking-[0.1em] text-slate-400">{objectTypeLabels[item.object.type] ?? item.object.type}</span>
        <span className="ml-auto rounded bg-slate-50 px-1 py-0.5 font-mono text-[8px] text-slate-400">{item.kind}</span>
      </div>
      <div className="mt-1 truncate font-mono text-[10px] font-semibold text-slate-700">{item.object.technicalName}</div>
      <div className="truncate text-[9px] text-slate-400">{text(item.object.title)}</div>
      {item.note ? <div className="mt-0.5 truncate text-[8px] text-slate-300">{item.note}</div> : null}
    </button>
  );
}

function HopGroup({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: HopItem[];
  onOpen: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center gap-1 px-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-300">
        <span className="h-px w-3 bg-slate-200" /> {title} · {items.length}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => <RelationCard key={`${item.level}-${item.object.id}-${item.kind}`} item={item} onOpen={() => onOpen(item.object.id)} />)}
      </div>
    </div>
  );
}

export function LineageView({
  objectId,
  onSelectObject,
  onSelectStep,
}: {
  objectId: string | null;
  onSelectObject: (id: string) => void;
  onSelectStep: (id: string, mode?: 'peek' | 'pin') => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const depth: 1 | 2 = params.get('depth') === '2' ? 2 : 1;
  const setDepth = (next: 1 | 2) => {
    const query = new URLSearchParams(location.search);
    if (next === 2) query.set('depth', '2');
    else query.delete('depth');
    navigate({ pathname: location.pathname, search: query.toString() ? `?${query.toString()}` : '' }, { replace: true });
  };
  const object = objectId ? content.objects.find((item) => item.id === objectId) : undefined;
  const direct = useMemo(() => object ? objectRelationsBidirectional(object) : { incoming: [], outgoing: [] }, [object]);

  const hops = useMemo(() => {
    const upstream = new Map<string, HopItem>();
    const downstream = new Map<string, HopItem>();
    for (const item of direct.incoming) upstream.set(item.object.id, { ...item, level: 1 });
    for (const item of direct.outgoing) downstream.set(item.object.id, { ...item, level: 1 });
    if (object && depth === 2) {
      const baseUp = new Set([object.id, ...upstream.keys()]);
      for (const candidate of content.objects) {
        if (baseUp.has(candidate.id)) continue;
        for (const relation of candidate.relations) {
          if (baseUp.has(relation.target)) {
            upstream.set(candidate.id, { object: candidate, kind: relation.kind, note: relation.note, level: 2 });
            break;
          }
        }
      }
      const baseDown = new Set([object.id, ...downstream.keys()]);
      for (const item of direct.outgoing) {
        for (const relation of item.object.relations) {
          const next = content.objects.find((candidate) => candidate.id === relation.target);
          if (next && !baseDown.has(next.id)) {
            downstream.set(next.id, { object: next, kind: relation.kind, note: relation.note, level: 2 });
            baseDown.add(next.id);
          }
        }
      }
    }
    const split = (items: Iterable<HopItem>) => {
      const all = [...items];
      return { one: all.filter((item) => item.level === 1), two: all.filter((item) => item.level === 2) };
    };
    return { up: split(upstream.values()), down: split(downstream.values()) };
  }, [depth, direct, object]);

  const usage = useMemo(() => object ? stepsForObject(object) : [], [object]);

  if (!object) {
    return (
      <div className="grid h-full place-items-center bg-[var(--color-canvas)] p-6">
        <div className="max-w-md rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Network className="mx-auto h-7 w-7 text-slate-300" />
          <div className="mt-2 text-[12px] font-medium text-slate-600">先选择一个对象</div>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">从对象清单、步骤详情或搜索进入，这里会显示上下游关系与使用位置。</p>
        </div>
      </div>
    );
  }

  const module = modulesById.get(object.module);
  const upCount = hops.up.one.length + hops.up.two.length;
  const downCount = hops.down.one.length + hops.down.two.length;

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-canvas)] px-4 py-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><Network className="h-3 w-3" /> 对象脉络</div>
            <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold text-slate-900"><Braces className="h-4 w-4 text-slate-400" /> {object.technicalName}</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{text(object.title)} · {module?.abbr} · {direct.incoming.length + direct.outgoing.length} 直接关系 · {usage.length} 处使用</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
            {[1, 2].map((value) => (
              <button key={value} type="button" onClick={() => setDepth(value as 1 | 2)} aria-pressed={depth === value} aria-label={value === 1 ? '只看一跳关系' : '显示两跳关系'} data-depth={value} className={cn('rounded-md px-2 py-1 text-[10px]', depth === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}>
                {value} 跳
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(190px,0.95fr)_minmax(0,1fr)]">
          <section className="rounded-xl border border-slate-200 bg-white/70 p-2">
            <div className="mb-2 flex items-center gap-1 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400"><ArrowRight className="h-3 w-3 rotate-180" /> 上游依赖 · {upCount}</div>
            {depth === 2 ? <HopGroup title="1 跳" items={hops.up.one} onOpen={onSelectObject} /> : null}
            {depth === 2 ? <HopGroup title="2 跳" items={hops.up.two} onOpen={onSelectObject} /> : null}
            {depth === 1 ? <HopGroup title="直接依赖" items={hops.up.one} onOpen={onSelectObject} /> : null}
            {!upCount ? <div className="rounded-lg border border-dashed border-slate-200 px-2 py-3 text-center text-[9px] text-slate-400">暂无上游关系</div> : null}
          </section>

          <section className="rounded-xl border border-slate-900/10 bg-white p-2 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400"><Braces className="h-3 w-3" /> 当前对象</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: module?.color }} /><span className="text-[9px] uppercase tracking-[0.1em] text-slate-400">{objectTypeLabels[object.type] ?? object.type}</span><span className={cn('ml-auto rounded px-1 py-0.5 text-[8px]', object.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : object.status === 'reviewed' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500')}>{statusLabels[object.status]}</span></div>
              <div className="mt-1 break-all font-mono text-[12px] font-semibold text-slate-900">{object.technicalName}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">{text(object.title)}</div>
              <p className="mt-1.5 line-clamp-4 text-[10px] leading-relaxed text-slate-500">{text(object.summary)}</p>
            </div>
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400"><Workflow className="h-3 w-3" /> 使用位置 · {usage.length}</div>
              <div className="space-y-1">
                {usage.slice(0, 6).map((step) => {
                  const process = processForStep(step);
                  return (
                    <button key={step.id} type="button" onClick={() => onSelectStep(step.id, 'pin')} className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-white">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      <span className="min-w-0 flex-1 truncate text-[9px] text-slate-600">{text(step.title)}</span>
                      <span className="shrink-0 font-mono text-[8px] text-slate-300">{step.tcode ?? ''}</span>
                      <ChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-300" />
                    </button>
                  );
                })}
                {!usage.length ? <div className="text-[9px] text-slate-400">还没有被步骤引用</div> : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white/70 p-2">
            <div className="mb-2 flex items-center gap-1 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400"><ArrowRight className="h-3 w-3" /> 下游依赖 · {downCount}</div>
            {depth === 2 ? <HopGroup title="1 跳" items={hops.down.one} onOpen={onSelectObject} /> : null}
            {depth === 2 ? <HopGroup title="2 跳" items={hops.down.two} onOpen={onSelectObject} /> : null}
            {depth === 1 ? <HopGroup title="直接依赖" items={hops.down.one} onOpen={onSelectObject} /> : null}
            {!downCount ? <div className="rounded-lg border border-dashed border-slate-200 px-2 py-3 text-center text-[9px] text-slate-400">暂无下游关系</div> : null}
          </section>
        </div>

        <p className="mt-2 text-[9px] text-slate-400">关系来自 content/objects 的 relations；上游为反向引用，下游为正向依赖。{depth === 1 ? '当前只展示一跳关系。' : '两跳视图按 1 跳 / 2 跳分组，不把远层关系和直接关系混在一起。'}</p>
      </div>
    </div>
  );
}
