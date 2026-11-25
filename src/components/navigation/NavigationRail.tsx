import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Filter, ListTree, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { content, modulesById, objectTypeLabels, processesById, processRoute, stepRoute, stepsById, text } from "@/content/data";
import type { ContentScene } from "@/content/schemas";
import { cn } from "@/lib/cn";

const TYPE_ORDER = ["tcode", "table", "bapi", "enhancement", "cds", "odata", "function", "class", "idoc", "fiori", "report", "job"];

type Props = { scene: ContentScene };

export function NavigationRail({ scene }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const filter = params.get("filter");
  const activeStep = params.get("step");
  const currentModule = scene.module;
  const currentProcess = scene.process;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(currentModule ? [currentModule] : []));

  useEffect(() => {
    if (!currentModule) return;
    setExpanded((previous) => {
      if (previous.has(currentModule)) return previous;
      const next = new Set(previous);
      next.add(currentModule);
      return next;
    });
  }, [currentModule]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const object of content.objects) counts.set(object.type, (counts.get(object.type) ?? 0) + 1);
    return counts;
  }, []);
  const types = TYPE_ORDER.filter((type) => (typeCounts.get(type) ?? 0) > 0);

  const toggle = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setFilter = (type: string) => {
    const next = new URLSearchParams(location.search);
    if (next.get("filter") === type) next.delete("filter");
    else next.set("filter", type);
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" });
  };

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white/75 backdrop-blur-sm min-[1400px]:flex">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200/70 px-3">
        <ListTree className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-600">知识库导航</span>
        <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400">{content.modules.length}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">模块 / 流程 / 步骤</div>
        {content.modules.map((module) => {
          const processes = content.processes.filter((process) => process.module === module.id);
          const isExpanded = expanded.has(module.id);
          const isCurrent = currentModule === module.id;
          return (
            <div key={module.id} className="mb-0.5">
              <div className={cn("group flex items-center rounded-lg", isCurrent && "bg-blue-50/70")}>
                <Link to={`/m/${module.id}`} aria-current={isCurrent ? "page" : undefined} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <span className="grid h-5 w-7 shrink-0 place-items-center rounded-md text-[8px] font-bold text-white" style={{ background: module.color }}>
                    {module.abbr}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-700">{text(module.title)}</span>
                  <span className="shrink-0 text-[9px] text-slate-300">{processes.length}</span>
                </Link>
                {processes.length > 0 ? (
                  <button
                    type="button"
                    aria-label={isExpanded ? `收起 ${text(module.title)}` : `展开 ${text(module.title)}`}
                    aria-expanded={isExpanded}
                    onClick={() => toggle(module.id)}
                    className="mr-1 grid h-6 w-5 shrink-0 place-items-center rounded text-slate-300 hover:bg-white hover:text-slate-600"
                  >
                    <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                  </button>
                ) : null}
              </div>
              {isExpanded && processes.length > 0 ? (
                <div className="ml-3 border-l border-slate-200/80 pl-2">
                  {processes.map((process) => {
                    const isActiveProcess = currentProcess === process.id;
                    return (
                      <div key={process.id} className="mb-0.5">
                        <Link
                          to={processRoute(process)}
                          aria-current={isActiveProcess ? "page" : undefined}
                          className={cn(
                            "block truncate rounded-md px-2 py-1.5 text-[10px] leading-tight",
                            isActiveProcess ? "bg-slate-900 font-medium text-white" : "text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          {text(process.title)}
                        </Link>
                        {isActiveProcess ? (
                          <div className="mb-1 mt-1 space-y-0.5">
                            {process.steps.map((stepId, index) => {
                              const step = stepsById.get(stepId);
                              if (!step) return null;
                              const isActiveStep = activeStep === step.id;
                              return (
                                <Link
                                  key={step.id}
                                  to={`${stepRoute(step)}&tab=overview`}
                                  aria-current={isActiveStep ? "step" : undefined}
                                  className={cn(
                                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] leading-tight",
                                    isActiveStep ? "bg-blue-50 font-medium text-blue-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
                                  )}
                                >
                                  <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded text-[8px]", isActiveStep ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400")}>{index + 1}</span>
                                  <span className="truncate">{text(step.title)}</span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={cn("shrink-0 border-t border-slate-200/70 p-3", scene.level === "universe" && "hidden")}>
        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <Filter className="h-3 w-3" /> 筛选画布
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {types.map((type) => {
            const active = filter === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(type)}
                className={cn(
                  "rounded-md border px-1.5 py-1 text-[9px] leading-none transition-colors",
                  active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                {objectTypeLabels[type] ?? type}
                <span className="ml-1 text-[8px] text-slate-300">{typeCounts.get(type)}</span>
              </button>
            );
          })}
        </div>
        {filter ? (
          <button type="button" onClick={() => setFilter(filter)} className="mt-2 flex items-center gap-1 text-[9px] text-slate-400 hover:text-slate-700">
            <X className="h-3 w-3" /> 清除筛选
          </button>
        ) : null}
        <p className="mt-2 text-[9px] leading-relaxed text-slate-400">按对象类型高亮相关步骤与对象。</p>
      </div>
    </aside>
  );
}
