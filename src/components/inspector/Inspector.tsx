import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  GitBranch,
  Link2,
  ListTree,
  MapPin,
  Network,
  Pin,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  content,
  flowsById,
  modulesById,
  objectRoute,
  objectTypeLabels,
  objectsById,
  objectsForStep,
  processForStep,
  processSteps,
  processesById,
  scenesById,
  sceneRoute,
  snippetsForObject,
  snippetsForStep,
  sourcesFor,
  statusLabels,
  stepRoute,
  stepsById,
  stepsForObject,
  text,
} from "@/content/data";
import type {
  ContentObject,
  ContentSnippet,
  ContentSource,
  ContentStep,
} from "@/content/schemas";
import { annotationSet, codeLines, tokenizeAbap } from "@/lib/abap";
import { cn } from "@/lib/cn";
import { objectRelationsBidirectional } from "@/lib/workspace";

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  reviewed: "bg-sky-50 text-sky-600",
  verified: "bg-emerald-50 text-emerald-600",
};

type Tab = { key: string; label: string };

const STEP_TABS: Tab[] = [
  { key: "overview", label: "概览" },
  { key: "objects", label: "开发对象" },
  { key: "code", label: "代码" },
  { key: "cross", label: "跨模块" },
  { key: "sources", label: "来源" },
];

const OBJECT_TABS: Tab[] = [
  { key: "overview", label: "概览" },
  { key: "relations", label: "关系" },
  { key: "usage", label: "使用位置" },
  { key: "code", label: "代码" },
  { key: "sources", label: "来源" },
];

const SOURCE_KIND_LABEL: Record<string, string> = {
  "official-doc": "官方文档",
  "official-api": "官方 API",
  "official-library": "官方资料库",
  community: "社区",
  book: "书籍",
  "third-party": "第三方",
  "system-export": "系统导出",
};

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <div className="text-[12px] font-medium text-slate-600">{title}</div>
      <div className="mt-1 text-[10px] leading-relaxed text-slate-400">{hint}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ChipList({ items, tone = "slate" }: { items: string[]; tone?: "slate" | "amber" }) {
  if (!items.length) return <span className="text-[11px] text-slate-400">未补充</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "rounded-lg px-2 py-1 text-[10px]",
            tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CodeBlock({ snippet }: { snippet: ContentSnippet }) {
  const [copied, setCopied] = useState(false);
  const annotated = useMemo(() => annotationSet(snippet.annotations), [snippet]);
  const lines = useMemo(() => codeLines(snippet.code), [snippet.code]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-medium text-slate-700">{text(snippet.title)}</div>
          <div className="mt-0.5 text-[9px] text-slate-400">{text(snippet.summary)}</div>
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex h-6 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 text-[9px] text-slate-500 hover:bg-slate-50"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <div className="code-surface mt-2 max-h-[360px] overflow-auto">
        <pre className="py-2">
          {lines.map((line, index) => (
            <div
              key={`${index}-${line.slice(0, 12)}`}
              className={cn("abap-line", annotated.has(index + 1) && "is-annotated")}
            >
              <span className="abap-gutter">{index + 1}</span>
              <span className="min-w-0">
                {line.length === 0 ? "\u00a0" : tokenizeAbap(line).map((token, tokenIndex) => (
                  <span key={`${token.text}-${tokenIndex}`} className={cn(`tok-${token.type}`)}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
      {snippet.annotations.length ? (
        <div className="mt-2 space-y-1.5">
          {snippet.annotations.map((annotation) => (
            <div key={`${annotation.lines}-${annotation.note}`} className="flex gap-2 text-[9px] leading-relaxed text-slate-500">
              <span className="shrink-0 rounded bg-amber-50 px-1 py-0.5 font-mono text-[8px] text-amber-700">
                {annotation.lines}
              </span>
              <span>{annotation.note}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SourceList({ sources }: { sources: ContentSource[] }) {
  if (!sources.length) {
    return <EmptyState title="还没有来源" hint="补充 content/sources/sources.yaml 后，这里会自动出现。" />;
  }
  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group block rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] font-medium text-slate-700 group-hover:text-blue-700">{source.title}</div>
            <ExternalLink className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-400" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400">
            <span>{source.publisher}</span>
            <span>·</span>
            <span>{source.version}</span>
            <span>·</span>
            <span>{SOURCE_KIND_LABEL[source.kind] ?? source.kind}</span>
            <span>·</span>
            <span>核对 {source.accessedAt}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

function ObjectRow({
  object,
  onOpen,
}: {
  object: ContentObject;
  onOpen: (object: ContentObject) => void;
}) {
  const module = modulesById.get(object.module);
  const snippets = snippetsForObject(object);
  return (
    <button
      type="button"
      onClick={() => onOpen(object)}
      className="group flex w-full items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <span
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[8px] font-semibold text-white"
        style={{ background: module?.color ?? "#64748b" }}
      >
        {objectTypeLabels[object.type]?.slice(0, 3) ?? object.type}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] font-semibold text-slate-700">{object.technicalName}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-400" />
        </span>
        <span className="mt-0.5 block truncate text-[9px] text-slate-400">
          {text(object.title)} · {object.relations.length} 关系{snippets.length ? ` · ${snippets.length} 段代码` : ""}
        </span>
      </span>
    </button>
  );
}

function StepOverview({ step }: { step: ContentStep }) {
  const module = modulesById.get(step.primaryModule);
  const process = processForStep(step);
  const flow = step.flows[0] ? flowsById.get(step.flows[0]) : undefined;
  return (
    <div>
      <p className="text-[12px] leading-relaxed text-slate-600">{text(step.summary)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] text-slate-500">{module?.abbr} {module ? text(module.title) : ""}</span>
        <span className={cn("rounded-md px-2 py-1 text-[9px]", STATUS_CLASS[step.status])}>{statusLabels[step.status]}</span>
        <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[9px] text-slate-500">{step.sapVersion}</span>
        {step.tcode ? <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[9px] text-blue-600">{step.tcode}</span> : null}
      </div>

      <Section title="输入 / 输出">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            <div className="text-[9px] font-semibold text-slate-400">输入</div>
            <div className="mt-1.5"><ChipList items={step.inputs} /></div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            <div className="text-[9px] font-semibold text-slate-400">输出</div>
            <div className="mt-1.5"><ChipList items={step.outputs} /></div>
          </div>
        </div>
      </Section>

      <Section title="业务规则">
        {step.rules.length ? (
          <ul className="space-y-1.5">
            {step.rules.map((rule) => (
              <li key={rule} className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                {rule}
              </li>
            ))}
          </ul>
        ) : <span className="text-[11px] text-slate-400">未补充</span>}
      </Section>

      <Section title="常见问题">
        {step.painPoints.length ? (
          <div className="space-y-1.5">
            {step.painPoints.map((point) => (
              <div key={point} className="flex gap-2 rounded-lg bg-amber-50/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-amber-800">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {point}
              </div>
            ))}
          </div>
        ) : <span className="text-[11px] text-slate-400">未补充</span>}
      </Section>

      <Section title="所属流程">
        <div className="flex flex-wrap gap-2">
          {process ? (
            <Link to={`/m/${process.module}/p/${process.id}`} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600 hover:border-blue-200 hover:bg-blue-50/30">
              <ListTree className="h-3 w-3" /> {text(process.title)} <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
          {flow ? (
            <Link to={`/f/${flow.id}`} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600 hover:border-sky-200 hover:bg-sky-50/30">
              <GitBranch className="h-3 w-3" /> {text(flow.title)} <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      </Section>

      {process ? (
        <Section title="角色与产出">
          <div className="space-y-2">
            <ChipList items={process.roles} />
            <ChipList items={process.outcomes} tone="amber" />
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function StepObjects({ step }: { step: ContentStep }) {
  const objects = objectsForStep(step);
  const navigate = useNavigate();
  const location = useLocation();
  const openObject = (object: ContentObject) => {
    navigate(`${objectRoute(object)}&tab=overview`);
  };
  if (!objects.length) return <EmptyState title="还没有开发对象" hint="在 step.yaml 的 objects 中引用 tcode/table/bapi 等对象。" />;

  const groups = objects.reduce<Record<string, ContentObject[]>>((acc, object) => {
    (acc[object.type] ??= []).push(object);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([type, items]) => (
        <div key={type}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">{objectTypeLabels[type] ?? type}</span>
            <span className="text-[9px] text-slate-300">{items.length}</span>
          </div>
          <div className="space-y-1.5">{items.map((object) => <ObjectRow key={object.id} object={object} onOpen={openObject} />)}</div>
        </div>
      ))}
    </div>
  );
}

function StepCode({ step }: { step: ContentStep }) {
  const snippets = snippetsForStep(step);
  if (!snippets.length) return <EmptyState title="还没有示例代码" hint="在 content/snippets 下新增片段，并在 step.yaml 的 snippets 中引用。" />;
  return <div className="space-y-4">{snippets.map((snippet) => <CodeBlock key={snippet.id} snippet={snippet} />)}</div>;
}

function StepCrossModule({ step }: { step: ContentStep }) {
  const occurrences = content.occurrences[step.id] ?? [];
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">语义关系</div>
        {step.crossModule.length ? (
          <div className="mt-1.5 space-y-2">
            {step.crossModule.map((item) => {
              const module = modulesById.get(item.module);
              return (
                <Link key={`${item.module}-${item.relation}`} to={`/m/${item.module}`} className="group flex items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:border-blue-200">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: module?.color }} />
                  <span className="min-w-0">
                    <span className="text-[10px] font-medium text-slate-700">{module?.abbr} · {item.relation}</span>
                    <span className="mt-0.5 block text-[9px] leading-relaxed text-slate-400">{item.note}</span>
                  </span>
                  <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-400" />
                </Link>
              );
            })}
          </div>
        ) : <div className="mt-1.5 text-[10px] text-slate-400">暂无跨模块说明。</div>}
      </div>
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">在画布中出现</div>
        <div className="mt-1.5 space-y-2">
          {occurrences.length ? occurrences.map((occ) => {
            const scene = scenesById.get(occ.sceneId);
            if (!scene) return null;
            const href = `${sceneRoute(scene)}?step=${encodeURIComponent(step.id)}`;
            return (
              <Link key={`${occ.sceneId}-${occ.nodeId}`} to={href} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-[10px] text-slate-600 hover:border-blue-200">
                <Boxes className="h-3 w-3 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">{text(scene.title)}</span>
                <span className="text-[8px] uppercase text-slate-300">{scene.level}</span>
                <ArrowRight className="h-3 w-3 text-slate-300" />
              </Link>
            );
          }) : <div className="text-[10px] text-slate-400">还没有放入任何场景。</div>}
        </div>
      </div>
    </div>
  );
}

function StepSources({ step }: { step: ContentStep }) {
  return <SourceList sources={sourcesFor(step.sources)} />;
}

function StepBody({ step, tab }: { step: ContentStep; tab: string }) {
  if (tab === "objects") return <StepObjects step={step} />;
  if (tab === "code") return <StepCode step={step} />;
  if (tab === "cross") return <StepCrossModule step={step} />;
  if (tab === "sources") return <StepSources step={step} />;
  return <StepOverview step={step} />;
}

function ObjectOverview({ object }: { object: ContentObject }) {
  const module = modulesById.get(object.module);
  const steps = stepsForObject(object);
  const snippets = snippetsForObject(object);
  const relations = objectRelationsBidirectional(object);
  const relationCount = relations.incoming.length + relations.outgoing.length;
  return (
    <div>
      <p className="text-[12px] leading-relaxed text-slate-600">{text(object.summary)}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cn("rounded-md px-2 py-1 text-[9px]", STATUS_CLASS[object.status])}>{statusLabels[object.status]}</span>
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] text-slate-500">{module?.abbr} {module ? text(module.title) : ""}</span>
        <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[9px] text-slate-500">{object.sapVersion}</span>
        {object.package ? <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[9px] text-slate-500">包 {object.package}</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center"><div className="text-[16px] font-semibold text-slate-800">{relationCount}</div><div className="text-[8px] text-slate-400">关系</div></div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center"><div className="text-[16px] font-semibold text-slate-800">{steps.length}</div><div className="text-[8px] text-slate-400">使用步骤</div></div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center"><div className="text-[16px] font-semibold text-slate-800">{snippets.length}</div><div className="text-[8px] text-slate-400">代码片段</div></div>
      </div>
      <Section title="技术信息">
        <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 text-[10px]">
          <div className="flex justify-between gap-3"><span className="text-slate-400">类型</span><span className="font-mono text-slate-600">{objectTypeLabels[object.type] ?? object.type}</span></div>
          <div className="flex justify-between gap-3"><span className="text-slate-400">技术名</span><span className="font-mono text-slate-600">{object.technicalName}</span></div>
          <div className="flex justify-between gap-3"><span className="text-slate-400">ID</span><span className="truncate font-mono text-slate-600">{object.id}</span></div>
        </div>
      </Section>
    </div>
  );
}

function ObjectRelations({ object }: { object: ContentObject }) {
  const navigate = useNavigate();
  const openObject = (id: string) => {
    const target = objectsById.get(id);
    if (target) navigate(`${objectRoute(target)}&tab=overview`);
  };
  const relations = objectRelationsBidirectional(object);
  if (!relations.incoming.length && !relations.outgoing.length) {
    return <EmptyState title="还没有关系" hint="在 object.yaml 的 relations 中补充 calls / reads / writes / enhances 等关系。" />;
  }
  return (
    <div className="space-y-4">
      {relations.outgoing.length ? (
        <section>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">依赖 · {relations.outgoing.length}</div>
          <div className="space-y-1.5">
            {relations.outgoing.map((relation) => (
              <button key={`out-${relation.kind}-${relation.object.id}`} type="button" onClick={() => openObject(relation.object.id)} className="flex w-full items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/30">
                <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[8px] text-white">{relation.kind}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-mono text-[10px] font-medium text-slate-700">{relation.object.technicalName}</span><span className="mt-0.5 block text-[9px] text-slate-400">{text(relation.object.title)}{relation.note ? ` · ${relation.note}` : ""}</span></span>
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {relations.incoming.length ? (
        <section>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">被引用 · {relations.incoming.length}</div>
          <div className="space-y-1.5">
            {relations.incoming.map((relation) => (
              <button key={`in-${relation.kind}-${relation.object.id}`} type="button" onClick={() => openObject(relation.object.id)} className="flex w-full items-start gap-2 rounded-xl border border-slate-100 bg-white p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/30">
                <span className="rounded-md bg-sky-50 px-1.5 py-0.5 font-mono text-[8px] text-sky-700">被 {relation.kind}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-mono text-[10px] font-medium text-slate-700">{relation.object.technicalName}</span><span className="mt-0.5 block text-[9px] text-slate-400">{text(relation.object.title)}</span></span>
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ObjectUsage({ object }: { object: ContentObject }) {
  const steps = stepsForObject(object);
  const navigate = useNavigate();
  const location = useLocation();
  const openStep = (step: ContentStep) => {
    navigate(`${stepRoute(step)}&tab=overview`);
  };
  if (!steps.length) return <EmptyState title="还没有被步骤引用" hint="在 step.yaml 的 objects 中加入该对象后，这里会显示使用位置。" />;
  return (
    <div className="space-y-1.5">
      {steps.map((step) => {
        const module = modulesById.get(step.primaryModule);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => openStep(step)}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-white px-2.5 py-2 text-left hover:border-blue-200 hover:bg-blue-50/30"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: module?.color }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-medium text-slate-700">{text(step.title)}</span>
              <span className="text-[9px] text-slate-400">{module?.abbr} · {step.tcode ?? "步骤"}</span>
            </span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
          </button>
        );
      })}
    </div>
  );
}

function ObjectCode({ object }: { object: ContentObject }) {
  const snippets = snippetsForObject(object);
  if (!snippets.length) return <EmptyState title="还没有相关代码" hint="新增 snippet 并把该对象写入 objects 列表，即可在这里展示。" />;
  return <div className="space-y-4">{snippets.map((snippet) => <CodeBlock key={snippet.id} snippet={snippet} />)}</div>;
}

function ObjectBody({ object, tab }: { object: ContentObject; tab: string }) {
  if (tab === "relations") return <ObjectRelations object={object} />;
  if (tab === "usage") return <ObjectUsage object={object} />;
  if (tab === "code") return <ObjectCode object={object} />;
  if (tab === "sources") return <SourceList sources={sourcesFor(object.sources)} />;
  return <ObjectOverview object={object} />;
}

export function DetailDock({ mode, width }: { mode: 'peek' | 'pin'; width: number | string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const stepId = params.get('step');
  const objectId = params.get('object');
  const step = stepId ? stepsById.get(stepId) : undefined;
  const object = objectId ? objectsById.get(objectId) : undefined;
  const active = object ?? step;
  const isObject = Boolean(object);
  const tabs = isObject ? OBJECT_TABS : STEP_TABS;
  const requestedTab = params.get('tab') ?? 'overview';
  const tab = tabs.some((item) => item.key === requestedTab) ? requestedTab : 'overview';
  const story = params.get('story');
  const [copied, setCopied] = useState(false);

  const patch = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const close = useCallback(() => patch({ step: null, object: null, tab: null, dock: null }), [patch]);
  const setTab = useCallback((key: string) => patch({ tab: key }), [patch]);
  const pin = useCallback(() => patch({ dock: 'pin' }), [patch]);
  const openMap = useCallback(() => patch({ view: 'map', dock: 'pin' }), [patch]);
  const openLineage = useCallback(() => patch({ view: 'lineage', dock: 'pin' }), [patch]);
  const openObject = useCallback((id: string) => patch({ step: null, object: id, tab: 'overview', dock: 'pin' }), [patch]);
  const openStep = useCallback((id: string) => patch({ step: id, object: null, tab: 'overview', dock: 'pin' }), [patch]);
  const openStepScene = useCallback((id: string) => {
    const target = stepsById.get(id);
    if (target) navigate(`${stepRoute(target)}&view=track&dock=pin`);
  }, [navigate]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, close]);

  if (story || !active) return null;

  const title = text(active.title);
  const kindLabel = isObject ? (object ? objectTypeLabels[object.type] ?? object.type : '对象') : '流程步骤';
  const moduleId = active && 'primaryModule' in active ? active.primaryModule : active?.module;
  const module = moduleId ? modulesById.get(moduleId) : undefined;
  const process = step ? processForStep(step) : undefined;
  const stepList = process ? processSteps(process) : [];
  const stepIndex = step ? stepList.findIndex((item) => item.id === step.id) : -1;
  const prevStep = stepIndex > 0 ? stepList[stepIndex - 1] : undefined;
  const nextStep = stepIndex >= 0 && stepIndex < stepList.length - 1 ? stepList[stepIndex + 1] : undefined;
  const objectSteps = object ? stepsForObject(object) : [];
  const peeking = mode === 'peek';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside
      role="complementary"
      aria-label={`${title} 详情`}
      className={cn(
        'detail-dock dock-in flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white/95 shadow-[-12px_0_40px_-32px_rgba(15,23,42,0.45)]',
        peeking ? 'bg-white' : '',
      )}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
    >
      <div className="flex items-start gap-2.5 border-b border-slate-100 px-3 py-3">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: module?.color ?? '#2563eb' }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-slate-400">
            <span>{kindLabel}</span>
            <span>·</span>
            <span>{module?.abbr ?? 'SAP'}</span>
            <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] normal-case tracking-normal', active.status ? STATUS_CLASS[active.status] : '')}>
              {active.status ? statusLabels[active.status] : '草稿'}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[15px] font-semibold tracking-tight text-slate-900">{title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            {'tcode' in active && active.tcode ? <span className="rounded bg-slate-100 px-1 font-mono text-slate-500">{active.tcode}</span> : null}
            {'technicalName' in active ? <span className="truncate font-mono">{active.technicalName}</span> : null}
            <span>·</span>
            <span>{active.sapVersion}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {peeking ? <button type="button" onClick={pin} aria-label="固定详情" className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pin className="h-3.5 w-3.5" /></button> : null}
          <button type="button" onClick={close} aria-label="关闭详情" className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {peeking ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="text-[12px] leading-relaxed text-slate-600">{text(active.summary)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {'tcode' in active && active.tcode ? <span className="rounded bg-blue-50 px-2 py-1 font-mono text-[10px] text-blue-600">{active.tcode}</span> : null}
            {'technicalName' in active ? <span className="rounded bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">{active.technicalName}</span> : null}
            <span className="rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{module?.abbr}</span>
            {step ? <span className="rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{objectsForStep(step).length} 对象</span> : null}
            {object ? <span className="rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-500">{objectSteps.length} 处使用</span> : null}
          </div>
          {step ? (
            <div className="mt-4">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">开发对象</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {objectsForStep(step).slice(0, 6).map((item) => (
                  <button key={item.id} type="button" onClick={() => openObject(item.id)} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 font-mono text-[10px] text-slate-500 hover:border-blue-200 hover:text-blue-700">{item.technicalName}</button>
                ))}
              </div>
            </div>
          ) : null}
          {object ? (
            <div className="mt-4">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">使用位置</div>
              <div className="mt-1.5 space-y-1">
                {objectSteps.slice(0, 4).map((item) => (
                  <button key={item.id} type="button" onClick={() => openStepScene(item.id)} className="flex w-full items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5 text-left hover:border-blue-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-slate-600">{text(item.title)}</span>
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                  </button>
                ))}
                {!objectSteps.length ? <span className="text-[10px] text-slate-400">还没有被步骤引用</span> : null}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button type="button" onClick={pin} className="flex h-8 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[10px] font-medium text-white hover:bg-slate-700">固定详情 <Pin className="h-3 w-3" /></button>
            <button type="button" onClick={openMap} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] text-slate-500 hover:bg-slate-50"><MapPin className="h-3 w-3" /> 在图中定位</button>
            {object ? <button type="button" onClick={openLineage} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] text-slate-500 hover:bg-slate-50"><Network className="h-3 w-3" /> 对象脉络</button> : null}
          </div>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="详情分类" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] transition-colors',
                  tab === item.key ? 'bg-slate-900 font-medium text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={tabs.find((item) => item.key === tab)?.label} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {isObject && object ? <ObjectBody object={object} tab={tab} /> : null}
            {!isObject && step ? <StepBody step={step} tab={tab} /> : null}
            <div className="mt-5 flex items-center gap-1 border-t border-slate-100 pt-2 text-[9px] text-slate-300">
              <BookOpen className="h-3 w-3" /> 内容来自 content/，可继续补充
              <span className="ml-auto font-mono">ID {active.id}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 border-t border-slate-100 px-3 py-2">
            {step ? (
              <>
                <button type="button" onClick={() => prevStep && openStep(prevStep.id)} disabled={!prevStep} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-40"><ArrowLeft className="h-3 w-3" /> 上一步</button>
                <span className="text-[9px] text-slate-400">{stepIndex + 1} / {stepList.length}</span>
                <button type="button" onClick={() => nextStep && openStep(nextStep.id)} disabled={!nextStep} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-40">下一步 <ArrowRight className="h-3 w-3" /></button>
              </>
            ) : (
              <button type="button" onClick={openLineage} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50"><Network className="h-3 w-3" /> 对象脉络</button>
            )}
            <button type="button" onClick={openMap} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50"><MapPin className="h-3 w-3" /> 定位</button>
            <button type="button" onClick={copyLink} className="ml-auto flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-500 hover:bg-slate-50">{copied ? '已复制' : '复制链接'}</button>
            <button type="button" onClick={close} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50" aria-label="关闭详情"><X className="h-3.5 w-3.5" /></button>
          </div>
        </>
      )}
    </aside>
  );
}
