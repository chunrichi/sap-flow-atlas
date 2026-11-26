import { readFileSync } from "node:fs";
import path from "node:path";
import type { Content } from "../src/content/schemas";

const file = path.join(process.cwd(), "src/generated/content.json");
let content: Content;
try {
  content = JSON.parse(readFileSync(file, "utf8")) as Content;
} catch {
  console.error("缺少 src/generated/content.json，请先运行 pnpm content:build");
  process.exit(1);
}

const pad = (value: string | number, width: number) => String(value).padEnd(width);
const num = (value: number, width = 6) => String(value).padStart(width);
const conditional = (variant: string) => variant !== "core";

const processById = new Map(content.processes.map((process) => [process.id, process]));
const stepById = new Map(content.steps.map((step) => [step.id, step]));
const flowProcesses = (flowId: string) =>
  (content.flows.find((flow) => flow.id === flowId)?.processes ?? [])
    .map((id) => processById.get(id))
    .filter((process): process is NonNullable<typeof process> => Boolean(process));

console.log("SAP Flow Atlas · 内容覆盖报告");
console.log(`生成于 ${content.generatedAt}`);
const optionalProcesses = content.processes.filter((process) => conditional(process.variant));
const optionalSteps = content.steps.filter((step) => step.optional);
console.log(
  `总计：${content.stats.modules} 模块 / ${content.stats.flows} 价值流 / ${content.stats.processes} 流程` +
    `（${optionalProcesses.length} 条件流程）/ ${content.stats.steps} 步骤` +
    `（${optionalSteps.length} 条件步骤）/ ${content.stats.objects} 对象`
);
console.log("");

console.log("模块覆盖");
console.log(pad("模块", 8) + pad("流程", 6) + pad("条件", 6) + pad("步骤", 6) + pad("对象", 6) + "角色");
for (const module of content.modules) {
  const processes = content.processes.filter((process) => process.module === module.id);
  const steps = content.steps.filter((step) => step.primaryModule === module.id);
  const objects = content.objects.filter((object) => object.module === module.id);
  const roles = new Set(processes.flatMap((process) => process.roles));
  console.log(
    pad(module.abbr, 8) +
      num(processes.length) +
      num(processes.filter((process) => conditional(process.variant)).length) +
      num(steps.length) +
      num(objects.length) +
      ` ${roles.size}`
  );
}
console.log("");

console.log("价值流阶段覆盖");
for (const flow of content.flows) {
  const covered = flow.stages.filter((stage) => flowProcesses(flow.id).some((process) => process.stage === stage.id));
  const missing = flow.stages.filter((stage) => !covered.includes(stage));
  const processes = flowProcesses(flow.id);
  const stepIds = new Set(processes.flatMap((process) => process.steps));
  const objectIds = new Set([...stepIds].flatMap((id) => stepById.get(id)?.objects ?? []));
  console.log(
    `${flow.abbr.padEnd(7)} ${String(covered.length).padStart(2)}/${flow.stages.length} 阶段` +
      ` · ${String(processes.length).padStart(2)} 流程` +
      ` · ${String(stepIds.size).padStart(3)} 步骤` +
      ` · ${String(objectIds.size).padStart(3)} 对象` +
      (missing.length ? ` · 缺口 ${missing.map((stage) => stage.id).join(", ")}` : "")
  );
}
console.log("");

console.log("条件流程（虚线呈现）");
for (const process of optionalProcesses.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`- ${process.id} [${process.variant}] ${process.title.zh} — ${process.trigger?.zh ?? "缺少条件"}`);
}
console.log("");

console.log("条件步骤（只在特定条件下执行）");
for (const step of optionalSteps.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`- ${step.id} — ${step.condition?.zh ?? "缺少条件"}`);
}
console.log("");

console.log("对象类型");
const types = new Map<string, number>();
for (const object of content.objects) types.set(object.type, (types.get(object.type) ?? 0) + 1);
console.log([...types.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => `${type} ${count}`).join(" · "));
console.log("");

const unused = content.objects.filter((object) => !content.objectUsage[object.id]);
const emptyProcesses = content.processes.filter((process) => process.steps.length === 0);
const emptyStages = content.flows.flatMap((flow) =>
  flow.stages
    .filter((stage) => !flowProcesses(flow.id).some((process) => process.stage === stage.id))
    .map((stage) => `${flow.id}/${stage.id}`),
);
console.log("缺口检查");
console.log(`- 未覆盖阶段：${emptyStages.length ? emptyStages.join(", ") : "0"}`);
console.log(`- 空流程：${emptyProcesses.length ? emptyProcesses.map((process) => process.id).join(", ") : "0"}`);
console.log(`- 未被步骤引用的对象：${unused.length ? unused.map((object) => object.id).join(", ") : "0"}`);

if (process.argv.includes("--strict") && (emptyStages.length || emptyProcesses.length || unused.length)) {
  process.exitCode = 1;
}
