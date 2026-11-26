import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Content, ContentObject, ContentProcess, ContentStep } from "../src/content/schemas";

const file = path.join(process.cwd(), "src/generated/content.json");
let content: Content;
try {
  content = JSON.parse(readFileSync(file, "utf8")) as Content;
} catch {
  console.error("缺少 src/generated/content.json，请先运行 pnpm content:build");
  process.exit(1);
}

const MODULE_ORDER = ["sd", "mm", "fi", "co", "pp", "qm", "pm", "ewm", "ps", "cs", "hr", "abap"];
const TYPE_LABELS: Record<string, string> = {
  tcode: "T-Code", table: "表", bapi: "BAPI", cds: "CDS", odata: "OData", enhancement: "增强",
  class: "类", function: "函数", idoc: "IDoc", fiori: "Fiori", report: "报表", job: "作业",
};
const VARIANT_LABELS: Record<string, string> = { core: "核心", optional: "可选", exception: "例外" };

const text = (value?: { zh?: string; en?: string }) => value?.zh || value?.en || "";
const esc = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
const unique = <T>(items: T[]) => [...new Set(items)];
const stepById = new Map(content.steps.map((step) => [step.id, step]));
const objectById = new Map(content.objects.map((object) => [object.id, object]));
const flowById = new Map(content.flows.map((flow) => [flow.id, flow]));
const moduleById = new Map(content.modules.map((module) => [module.id, module]));
const flowOrder = new Map(content.flows.map((flow, index) => [flow.id, index]));
const stageOrder = (process: ContentProcess) => flowById.get(process.flow)?.stages.findIndex((stage) => stage.id === process.stage) ?? 99;
const sortProcesses = (items: ContentProcess[]) => [...items].sort((a, b) => (flowOrder.get(a.flow) ?? 99) - (flowOrder.get(b.flow) ?? 99) || stageOrder(a) - stageOrder(b) || a.id.localeCompare(b.id));

function stageTitle(flowId: string, stageId: string): string {
  const stage = flowById.get(flowId)?.stages.find((item) => item.id === stageId);
  return stage ? text(stage.title) : stageId;
}

function processSteps(process: ContentProcess): ContentStep[] {
  return process.steps.map((id) => stepById.get(id)).filter((step): step is ContentStep => Boolean(step));
}

function processObjects(process: ContentProcess): ContentObject[] {
  const ids = unique(processSteps(process).flatMap((step) => step.objects));
  return ids.map((id) => objectById.get(id)).filter((object): object is ContentObject => Boolean(object));
}

function objectLabel(object: ContentObject): string {
  return `${TYPE_LABELS[object.type] ?? object.type} \`${object.technicalName}\``;
}

function variantBadge(variant: string): string {
  if (variant === "optional") return "〔可选〕";
  if (variant === "exception") return "〔例外〕";
  return "核心";
}

function variantPrefix(variant: string): string {
  if (variant === "optional") return "┄ ";
  if (variant === "exception") return "┅ ";
  return "";
}

const lines: string[] = [];
const add = (...items: string[]) => lines.push(...items);

add("# 13 · 模块流程与对象明细", "");
add("> 这份文档按模块列出每个业务流程的步骤、输入输出、规则与对象，回答「这个模块里到底有哪些流程、每一步碰什么对象」。", ">", "> 数据由 `pnpm content:catalog` 从 `src/generated/content.json` 生成；不要手工改数字。覆盖矩阵与条件清单见 [12 号文档](12-content-map.md)。", "");

add("## 0. 怎么读", "", "| 标记 | 含义 |", "| --- | --- |", "| 核心 | 主干流程，每个业务周期都会经过 |", "| 〔可选〕 / ┄ | 条件满足时才进入，主路径可以跳过；虚线块给出触发条件 |", "| 〔例外〕 / ┅ | 异常或纠偏路径，处理冻结、冲销、拒收、故障等偏差 |", "| 〔条件〕 | 流程内的条件步骤，只在特定条件下执行，步骤序号保留 |", "");

const optional = content.processes.filter((process) => process.variant === "optional");
const exception = content.processes.filter((process) => process.variant === "exception");
const optionalSteps = content.steps.filter((step) => step.optional);
add("## 1. 总览", "");
add(`- 模块 **${content.stats.modules}** · 价值流 **${content.stats.flows}** · 流程 **${content.stats.processes}**（可选 ${optional.length} + 例外 ${exception.length}）`);
add(`- 步骤 **${content.stats.steps}**（条件步骤 ${optionalSteps.length}） · 对象 **${content.stats.objects}** · 代码片段 **${content.stats.snippets}**`);
add("");
add("| 模块 | 流程 | 可选 | 例外 | 步骤 | 对象 | 角色 |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const moduleId of MODULE_ORDER) {
  const module = moduleById.get(moduleId);
  if (!module) continue;
  const processes = sortProcesses(content.processes.filter((process) => process.module === moduleId));
  const steps = content.steps.filter((step) => step.primaryModule === moduleId);
  const objects = content.objects.filter((object) => object.module === moduleId);
  const roles = new Set(processes.flatMap((process) => process.roles));
  add(`| ${module.abbr} ${text(module.title)} | ${processes.length} | ${processes.filter((process) => process.variant === "optional").length} | ${processes.filter((process) => process.variant === "exception").length} | ${steps.length} | ${objects.length} | ${roles.size} |`);
}
add("");

add("## 2. 模块明细", "");
MODULE_ORDER.forEach((moduleId, moduleIndex) => {
  const module = moduleById.get(moduleId);
  if (!module) return;
  const processes = sortProcesses(content.processes.filter((process) => process.module === moduleId));
  const steps = content.steps.filter((step) => step.primaryModule === moduleId);
  const objects = content.objects.filter((object) => object.module === moduleId);
  const typeCounts = new Map<string, number>();
  for (const object of objects) typeCounts.set(object.type, (typeCounts.get(object.type) ?? 0) + 1);
  add(`### 2.${moduleIndex + 1} ${module.abbr} ${text(module.title)}`, "");
  add(`> ${text(module.summary)}`, "");
  add(`**规模**：${processes.length} 个流程 · ${steps.length} 个步骤 · ${objects.length} 个对象（${[...typeCounts.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => `${TYPE_LABELS[type] ?? type} ${count}`).join(" · ")}）`, "");
  const flowIds = unique(processes.map((process) => process.flow));
  for (const flowId of flowIds) {
    const flow = flowById.get(flowId);
    if (!flow) continue;
    const flowProcesses = processes.filter((process) => process.flow === flowId).sort((a, b) => {
      const order = flow.stages.map((stage) => stage.id);
      return order.indexOf(a.stage) - order.indexOf(b.stage) || a.id.localeCompare(b.id);
    });
    add(`#### ${flow.abbr} ${text(flow.title)}`, "");
    add("| 流程 | 变体 | 阶段 | 步骤 | 对象 | 触发条件 / 摘要 |", "| --- | --- | --- | ---: | ---: | --- |");
    for (const process of flowProcesses) {
      const trigger = process.trigger ? `**${VARIANT_LABELS[process.variant]}**：${esc(text(process.trigger))}` : esc(text(process.summary));
      add(`| ${variantPrefix(process.variant)}${esc(text(process.title))} | ${variantBadge(process.variant)} | ${esc(stageTitle(process.flow, process.stage))} | ${process.steps.length} | ${processObjects(process).length} | ${trigger} |`);
    }
    add("");
  }

  add("#### 流程详情", "");
  for (const process of processes) {
    const flow = flowById.get(process.flow);
    const stepsForProcess = processSteps(process);
    const objectsForProcess = processObjects(process);
    add("<details>", `<summary>${variantPrefix(process.variant)}<b>${VARIANT_LABELS[process.variant] ?? process.variant}</b> · ${esc(text(process.title))} <code>${process.id}</code> · ${flow?.abbr ?? process.flow} / ${esc(stageTitle(process.flow, process.stage))} · ${stepsForProcess.length} 步 · ${objectsForProcess.length} 对象</summary>`, "");
    if (process.variant === "optional") {
      add("> ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄", "> **〔可选流程〕** 只有满足条件时才进入；主路径可以跳过。", `> **触发条件**：${esc(text(process.trigger))}`, "> ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄", "");
    } else if (process.variant === "exception") {
      add("> ━┅━┅━┅━┅━┅━┅━┅━┅━┅━┅━┅━┅", "> **〔例外流程〕** 从主路径分叉，处理偏差与纠偏。", `> **触发条件**：${esc(text(process.trigger))}`, "> ━┅━┅━┅━┅━┅━┅━┅━┅━┅━┅━┅━┅", "");
    }
    add(`**摘要**：${esc(text(process.summary))}`, "");
    add(`**角色**：${process.roles.join("、") || "—"} · **产出**：${process.outcomes.join("、") || "—"}`, "");
    add("| # | 步骤 | T-Code | 输入 → 输出 | 关键规则 | 对象 |", "| ---: | --- | --- | --- | --- | --- |");
    stepsForProcess.forEach((step, index) => {
      const optionalMark = step.optional ? " 〔条件〕" : "";
      const condition = step.optional && step.condition ? `<br><small>条件：${esc(text(step.condition))}</small>` : "";
      const inputOutput = `${esc(step.inputs.join("、") || "—")} → ${esc(step.outputs.join("、") || "—")}`;
      const rules = step.rules.slice(0, 2).map((rule) => esc(rule)).join("<br>") || "—";
      const objectLabels = step.objects.map((id) => objectById.get(id)).filter((object): object is ContentObject => Boolean(object)).map(objectLabel).join("<br>") || "—";
      add(`| ${index + 1}${step.optional ? " ┄" : ""} | ${esc(text(step.title))}${optionalMark}${condition} | ${step.tcode ?? "—"} | ${inputOutput} | ${rules} | ${objectLabels} |`);
    });
    add("", "</details>", "");
  }
});

add("## 3. 重新生成", "");
add("```bash");
add("pnpm content:catalog   # 构建内容并生成本文档");
add("pnpm content:report    # 覆盖矩阵与条件清单");
add("pnpm content:validate  # 只校验内容");
add("```", "");
add("> 内容仍以 `draft` 为主；T-Code、表名与流程顺序需要 SAP 顾问逐条复核。可选/例外流程的触发条件与条件步骤的 `condition` 已在构建时强制校验。");

const out = lines.join("\n") + "\n";
writeFileSync(path.join(process.cwd(), "docs/13-process-catalog.md"), out, "utf8");
console.log(`✓ 已生成 docs/13-process-catalog.md（${content.stats.modules} 模块 / ${content.stats.processes} 流程 / ${content.stats.steps} 步骤）`);
