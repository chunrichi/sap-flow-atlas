import { useEffect } from "react";
import { Command } from "cmdk";
import { Boxes, Code2, CornerDownLeft, GitBranch, Search, SquareStack, Workflow, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  content,
  flowRoute,
  modulesById,
  objectTypeLabels,
  objectsById,
  objectRoute,
  processRoute,
  processesById,
  stepRoute,
  text,
} from "@/content/data";
import { useUIStore } from "@/store/ui";

function strictFilter(value: string, search: string): number {
  const needle = search.trim().toLowerCase();
  if (!needle) return 1;
  const haystack = value.toLowerCase();
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (!tokens.every((token) => haystack.includes(token))) return 0;
  const first = haystack.indexOf(tokens[0] ?? needle);
  return first === 0 ? 2 : 1;
}

export function CommandPalette() {
  const open = useUIStore((state) => state.searchOpen);
  const setOpen = useUIStore((state) => state.setSearchOpen);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useUIStore.getState().setSearchOpen(!useUIStore.getState().searchOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Command.Dialog
      filter={strictFilter}
      open={open}
      onOpenChange={setOpen}
      label="搜索 SAP 知识库"
      shouldFilter
    >
      <div className="panel overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Command.Input
            autoFocus
            placeholder="搜索模块、流程、T-Code…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block">
            Esc
          </kbd>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭搜索"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <Command.List className="max-h-[min(62vh,540px)] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-10 text-center text-sm text-slate-500">
            没有找到匹配内容。试试模块缩写（SD）、T-Code（VA01）或表名（VBAK）。
          </Command.Empty>

          <Command.Group heading="模块">
            {content.modules.map((module) => (
              <Command.Item
                key={module.id}
                value={`${module.id} ${module.abbr} ${text(module.title)} ${module.scope.join(" ")}`}
                onSelect={() => go(`/m/${module.id}`)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: module.color }}
                />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-slate-800">{text(module.title)}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{module.abbr}</span>
                </span>
                <Boxes className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="端到端流程">
            {content.flows.map((flow) => (
              <Command.Item
                key={flow.id}
                value={`${flow.id} ${flow.abbr} ${text(flow.title)}`}
                onSelect={() => go(flowRoute(flow))}
              >
                <GitBranch className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-slate-800">{text(flow.title)}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{flow.abbr}</span>
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="业务流程">
            {content.processes.map((process) => {
              const module = modulesById.get(process.module);
              return (
                <Command.Item
                  key={process.id}
                  value={`${process.id} ${text(process.title)} ${module?.abbr ?? ""}`}
                  onSelect={() => go(processRoute(process))}
                >
                  <Workflow className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-slate-800">{text(process.title)}</span>
                    <span className="ml-2 text-[11px] text-slate-400">{module?.abbr}</span>
                  </span>
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="流程步骤">
            {content.steps.map((step) => {
              const process = processesById.get(step.processes[0] ?? "");
              return (
                <Command.Item
                  key={step.id}
                  value={`${step.id} ${text(step.title)} ${step.tcode ?? ""} ${text(process?.title)} ${step.modules.map((id) => modulesById.get(id)?.abbr ?? id).join(" ")} ${step.objects.map((id) => { const object = objectsById.get(id); return object ? `${object.technicalName} ${text(object.title)}` : id; }).join(" ")}`}
                  onSelect={() => go(stepRoute(step))}
                >
                  <SquareStack className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-slate-800">{text(step.title)}</span>
                    {step.tcode ? (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                        {step.tcode}
                      </span>
                    ) : null}
                  </span>
                  <span className="hidden text-[11px] text-slate-400 sm:block">{process ? text(process.title) : ""}</span>
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Group heading="开发对象">
            {content.objects.map((object) => (
              <Command.Item
                key={object.id}
                value={`${object.id} ${object.technicalName} ${text(object.title)} ${object.module}`}
                onSelect={() => go(objectRoute(object))}
              >
                <Code2 className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-mono text-[12px] font-medium text-slate-800">{object.technicalName}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{objectTypeLabels[object.type] ?? object.type}</span>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">
          <span>↑↓ 选择 · ↵ 打开 · Esc 关闭</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> 进入
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
