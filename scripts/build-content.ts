import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import {
  crosslinkSchema,
  flowSchema,
  glossaryFileSchema,
  moduleSchema,
  objectSchema,
  processSchema,
  sceneSchema,
  snippetSchema,
  sourceFileSchema,
  stepSchema,
  type Content,
  type ContentCrosslink,
  type ContentFlow,
  type ContentModule,
  type ContentObject,
  type ContentProcess,
  type ContentScene,
  type ContentSnippet,
  type ContentSource,
  type ContentStep,
  type ContentTerm,
  type Occurrence,
} from "../src/content/schemas";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "src", "generated");
const OUT_FILE = path.join(OUT_DIR, "content.json");

const errors: string[] = [];
const warnings: string[] = [];

const rel = (file: string) => path.relative(ROOT, file);

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function parseYaml<T extends z.ZodType>(file: string, schema: T): Promise<z.infer<T>> {
  const raw = YAML.parse(await readFile(file, "utf8"));
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`${rel(file)} 校验失败:\n${issues}`);
  }
  return result.data;
}

function moduleOrder(id: string): number {
  const order = ["sd", "mm", "fi", "co", "pp", "qm", "pm", "ewm", "ps", "cs", "hr", "abap"];
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
}

function sceneOrder(scene: ContentScene): number {
  return { universe: 0, module: 1, process: 2, flow: 3 }[scene.level];
}

function annotationRange(value: string | number): [number, number] {
  const parts = String(value).split("-").map((part) => Number(part));
  const start = parts[0] ?? 0;
  const end = parts.length > 1 ? (parts[1] ?? start) : start;
  return [start, end];
}

async function main() {
  const [moduleFiles, flowFiles, processFiles, stepFiles, objectFiles, snippetFiles, sceneFiles] = await Promise.all([
    walk(path.join(CONTENT_DIR, "modules")),
    walk(path.join(CONTENT_DIR, "flows")),
    walk(path.join(CONTENT_DIR, "processes")),
    walk(path.join(CONTENT_DIR, "steps")),
    walk(path.join(CONTENT_DIR, "objects")),
    walk(path.join(CONTENT_DIR, "snippets")),
    walk(path.join(CONTENT_DIR, "scenes")),
  ]);

  const modules: ContentModule[] = await Promise.all(
    moduleFiles.filter((file) => file.endsWith("module.yaml")).map((file) => parseYaml(file, moduleSchema)),
  );
  const flows: ContentFlow[] = await Promise.all(
    flowFiles.filter((file) => file.endsWith("flow.yaml")).map((file) => parseYaml(file, flowSchema)),
  );
  const processes: ContentProcess[] = await Promise.all(
    processFiles.filter((file) => file.endsWith("process.yaml")).map((file) => parseYaml(file, processSchema)),
  );
  const steps: ContentStep[] = await Promise.all(
    stepFiles.filter((file) => file.endsWith("step.yaml")).map((file) => parseYaml(file, stepSchema)),
  );
  const objects: ContentObject[] = await Promise.all(
    objectFiles.filter((file) => file.endsWith(".yaml")).map((file) => parseYaml(file, objectSchema)),
  );
  const scenes: ContentScene[] = await Promise.all(
    sceneFiles.filter((file) => file.endsWith(".scene.yaml")).map((file) => parseYaml(file, sceneSchema)),
  );

  const snippetMetas = await Promise.all(
    snippetFiles.filter((file) => file.endsWith(".yaml")).map((file) => parseYaml(file, snippetSchema)),
  );
  const snippets: ContentSnippet[] = await Promise.all(
    snippetMetas.map(async (meta) => {
      const codePath = path.join(CONTENT_DIR, "snippets", meta.file);
      let code = "";
      try {
        code = await readFile(codePath, "utf8");
      } catch {
        errors.push(`snippet ${meta.id}: 缺少代码文件 content/snippets/${meta.file}`);
      }
      const normalized = code.replace(/\r\n/g, "\n").replace(/\n$/, "");
      return { ...meta, code: normalized, lineCount: normalized ? normalized.split("\n").length : 0 };
    }),
  );

  const sourceFile = await parseYaml(path.join(CONTENT_DIR, "sources", "sources.yaml"), sourceFileSchema);
  const glossaryFile = await parseYaml(path.join(CONTENT_DIR, "glossary", "terms.yaml"), glossaryFileSchema);
  const crosslinkFiles = (await walk(path.join(CONTENT_DIR, "crosslinks"))).filter((file) => file.endsWith(".yaml"));
  const crosslinks: ContentCrosslink[] = await Promise.all(
    crosslinkFiles.map((file) => parseYaml(file, crosslinkSchema)),
  );
  const sources: ContentSource[] = sourceFile.sources;
  const terms: ContentTerm[] = glossaryFile.terms;

  modules.sort((a, b) => moduleOrder(a.id) - moduleOrder(b.id));
  flows.sort((a, b) => a.id.localeCompare(b.id));
  processes.sort((a, b) => a.id.localeCompare(b.id));
  steps.sort((a, b) => a.id.localeCompare(b.id));
  objects.sort((a, b) => a.id.localeCompare(b.id));
  snippets.sort((a, b) => a.id.localeCompare(b.id));
  scenes.sort((a, b) => sceneOrder(a) - sceneOrder(b) || a.id.localeCompare(b.id));

  const modulesById = new Map(modules.map((item) => [item.id, item]));
  const flowsById = new Map(flows.map((item) => [item.id, item]));
  const processesById = new Map(processes.map((item) => [item.id, item]));
  const stepsById = new Map(steps.map((item) => [item.id, item]));
  const objectsById = new Map(objects.map((item) => [item.id, item]));
  const snippetsById = new Map(snippets.map((item) => [item.id, item]));
  const scenesById = new Map(scenes.map((item) => [item.id, item]));
  const sourcesById = new Map(sources.map((item) => [item.id, item]));
  const crosslinksById = new Map(crosslinks.map((item) => [item.id, item]));
  const termsById = new Map(terms.map((item) => [item.id, item]));

  const claimed = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const previous = claimed.get(id);
    if (previous) errors.push(`ID 重复: ${id}（${previous} 与 ${where}）`);
    else claimed.set(id, where);
  };

  modules.forEach((item) => claim(item.id, `module ${item.id}`));
  flows.forEach((item) => claim(item.id, `flow ${item.id}`));
  processes.forEach((item) => claim(item.id, `process ${item.id}`));
  steps.forEach((item) => claim(item.id, `step ${item.id}`));
  objects.forEach((item) => claim(item.id, `object ${item.id}`));
  snippets.forEach((item) => claim(item.id, `snippet ${item.id}`));
  scenes.forEach((item) => claim(item.id, `scene ${item.id}`));
  sources.forEach((item) => claim(item.id, `source ${item.id}`));
  crosslinks.forEach((item) => claim(item.id, `crosslink ${item.id}`));
  terms.forEach((item) => claim(item.id, `term ${item.id}`));

  const registry: Record<string, Map<string, unknown>> = {
    module: modulesById,
    flow: flowsById,
    process: processesById,
    step: stepsById,
    snippet: snippetsById,
    scene: scenesById,
    source: sourcesById,
    crosslink: crosslinksById,
    term: termsById,
  };

  function resolve(ref: string, where: string): boolean {
    if (objectsById.has(ref)) return true;
    const divider = ref.indexOf(":");
    if (divider === -1) {
      errors.push(`${where}: 引用缺少命名空间 ${ref}`);
      return false;
    }
    const kind = ref.slice(0, divider);
    const id = ref.slice(divider + 1);
    const table = registry[kind];
    if (!table) {
      errors.push(`${where}: 未知引用类型 ${ref}`);
      return false;
    }
    if (!table.has(id)) {
      errors.push(`${where}: 找不到 ${ref}`);
      return false;
    }
    return true;
  }

  const checkSources = (ids: string[] | undefined, where: string) => {
    for (const id of ids ?? []) resolve(`source:${id}`, where);
  };

  for (const item of modules) {
    for (const flow of item.keyFlows) resolve(`flow:${flow}`, `module ${item.id}`);
    checkSources(item.sources, `module ${item.id}`);
  }
  for (const flow of flows) {
    for (const mod of flow.modules) resolve(`module:${mod}`, `flow ${flow.id}`);
    for (const proc of flow.processes) resolve(`process:${proc}`, `flow ${flow.id}`);
    for (const stage of flow.stages) resolve(`module:${stage.primaryModule}`, `flow ${flow.id} stage ${stage.id}`);
    checkSources(flow.sources, `flow ${flow.id}`);
    if (flow.modules.length < 2) warnings.push(`flow ${flow.id}: 端到端流程只涉及 ${flow.modules.length} 个模块`);
  }
  for (const proc of processes) {
    resolve(`module:${proc.module}`, `process ${proc.id}`);
    resolve(`flow:${proc.flow}`, `process ${proc.id}`);
    for (const stepId of proc.steps) {
      if (!resolve(`step:${stepId}`, `process ${proc.id}`)) continue;
      const step = stepsById.get(stepId);
      if (step && !step.processes.includes(proc.id)) {
        errors.push(`process ${proc.id}: step ${stepId} 的 processes 未声明该流程（双向不一致）`);
      }
    }
    for (const edge of proc.edges) {
      if (!proc.steps.includes(edge.from)) errors.push(`process ${proc.id}: 边起点 ${edge.from} 不在 steps 中`);
      if (!proc.steps.includes(edge.to)) errors.push(`process ${proc.id}: 边终点 ${edge.to} 不在 steps 中`);
    }
    checkSources(proc.sources, `process ${proc.id}`);
  }
  for (const step of steps) {
    for (const mod of step.modules) resolve(`module:${mod}`, `step ${step.id}`);
    for (const procId of step.processes) {
      if (!resolve(`process:${procId}`, `step ${step.id}`)) continue;
      const proc = processesById.get(procId);
      if (proc && !proc.steps.includes(step.id)) {
        errors.push(`step ${step.id}: process ${procId} 未声明该步骤（双向不一致）`);
      }
    }
    for (const flowId of step.flows) resolve(`flow:${flowId}`, `step ${step.id}`);
    for (const objectId of step.objects) resolve(objectId, `step ${step.id}`);
    for (const snippetId of step.snippets) resolve(`snippet:${snippetId}`, `step ${step.id}`);
    checkSources(step.sources, `step ${step.id}`);
  }
  for (const object of objects) {
    const [type, name] = object.id.split(":");
    if (type !== object.type) errors.push(`object ${object.id}: ID 前缀与 type 不一致`);
    if (name !== object.technicalName) errors.push(`object ${object.id}: technicalName 不一致`);
    resolve(`module:${object.module}`, `object ${object.id}`);
    for (const relation of object.relations) resolve(relation.target, `object ${object.id}`);
    checkSources(object.sources, `object ${object.id}`);
  }
  for (const snippet of snippets) {
    for (const objectId of snippet.objects) resolve(objectId, `snippet ${snippet.id}`);
    for (const annotation of snippet.annotations) {
      const [start, end] = annotationRange(annotation.lines);
      if (start < 1 || end < start || end > snippet.lineCount) {
        errors.push(`snippet ${snippet.id}: 注解范围 ${annotation.lines} 超出 ${snippet.lineCount} 行`);
      }
    }
    checkSources(snippet.sources, `snippet ${snippet.id}`);
  }
  for (const scene of scenes) {
    if (scene.module) resolve(`module:${scene.module}`, `scene ${scene.id}`);
    if (scene.process) resolve(`process:${scene.process}`, `scene ${scene.id}`);
    if (scene.flow) resolve(`flow:${scene.flow}`, `scene ${scene.id}`);
    const nodeIds = new Set<string>();
    for (const node of scene.nodes) {
      if (nodeIds.has(node.id)) errors.push(`scene ${scene.id}: 节点 ID 重复 ${node.id}`);
      nodeIds.add(node.id);
      if (node.ref) resolve(node.ref, `scene ${scene.id} node ${node.id}`);
      if (node.kind === "portal") {
        if (!node.target) errors.push(`scene ${scene.id} node ${node.id}: portal 缺少 target`);
        else {
          resolve(`scene:${node.target.scene}`, `scene ${scene.id} node ${node.id}`);
          if (node.target.step) resolve(`step:${node.target.step}`, `scene ${scene.id} node ${node.id}`);
          if (node.target.object) resolve(node.target.object, `scene ${scene.id} node ${node.id}`);
        }
      }
    }
    const groupIds = new Set<string>();
    for (const group of scene.groups) {
      if (groupIds.has(group.id)) errors.push(`scene ${scene.id}: 分组 ID 重复 ${group.id}`);
      groupIds.add(group.id);
      if (nodeIds.has(group.id)) errors.push(`scene ${scene.id}: 分组 ID 与节点冲突 ${group.id}`);
    }
    for (const edge of scene.edges) {
      if (!nodeIds.has(edge.from)) errors.push(`scene ${scene.id}: 边 ${edge.id} 起点不存在 ${edge.from}`);
      if (!nodeIds.has(edge.to)) errors.push(`scene ${scene.id}: 边 ${edge.id} 终点不存在 ${edge.to}`);
    }
  }
  for (const crosslink of crosslinks) {
    resolve(crosslink.from, `crosslink ${crosslink.id}`);
    resolve(crosslink.to, `crosslink ${crosslink.id}`);
    checkSources(crosslink.sources, `crosslink ${crosslink.id}`);
  }
  for (const term of terms) {
    resolve(`module:${term.module}`, `term ${term.id}`);
    for (const ref of term.related) resolve(ref, `term ${term.id}`);
    checkSources(term.sources, `term ${term.id}`);
  }
  for (const source of sources) {
    if (!source.url.startsWith("https://")) errors.push(`source ${source.id}: URL 必须为 https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)) {
      errors.push(`source ${source.id}: accessedAt 必须是 YYYY-MM-DD`);
    }
  }

  const statusEntities: Array<{ id: string; status: string; sources: string[] }> = [
    ...modules, ...flows, ...processes, ...steps, ...objects, ...snippets, ...crosslinks,
  ];
  for (const entity of statusEntities) {
    if (entity.status === "verified") {
      const hasOfficial = entity.sources.some((id) => sourcesById.get(id)?.kind.startsWith("official"));
      if (!hasOfficial) warnings.push(`${entity.id}: verified 但没有 official-* 来源`);
    }
    if (entity.status !== "draft" && entity.sources.length === 0) {
      warnings.push(`${entity.id}: ${entity.status} 但没有来源`);
    }
  }

  const occurrences: Record<string, Occurrence[]> = {};
  for (const scene of scenes) {
    for (const node of scene.nodes) {
      if (!node.ref?.startsWith("step:")) continue;
      const stepId = node.ref.slice("step:".length);
      if (!stepsById.has(stepId)) continue;
      (occurrences[stepId] ??= []).push({ sceneId: scene.id, nodeId: node.id });
    }
  }

  const objectUsage: Record<string, string[]> = {};
  for (const step of steps) {
    for (const objectId of step.objects) {
      const list = (objectUsage[objectId] ??= []);
      if (!list.includes(step.id)) list.push(step.id);
    }
  }

  if (errors.length > 0) {
    console.error(`\n内容校验失败，共 ${errors.length} 个错误:\n`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    if (warnings.length) {
      console.error(`\n另有 ${warnings.length} 个警告:`);
      for (const warning of warnings) console.error(`  ! ${warning}`);
    }
    process.exitCode = 1;
    return;
  }

  if (process.argv.includes("--check")) {
    console.log(`✓ 内容校验通过（${modules.length} 模块 / ${steps.length} 步骤 / ${objects.length} 对象）`);
    if (warnings.length) {
      console.log(`  ${warnings.length} 个警告:`);
      for (const warning of warnings) console.log(`  ! ${warning}`);
    }
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const content: Content = {
    modules,
    flows,
    processes,
    steps,
    objects,
    snippets,
    scenes,
    sources,
    crosslinks,
    terms,
    stats: {
      modules: modules.length,
      flows: flows.length,
      processes: processes.length,
      steps: steps.length,
      objects: objects.length,
      snippets: snippets.length,
      scenes: scenes.length,
      sources: sources.length,
    },
    occurrences,
    objectUsage,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(OUT_FILE, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log(`✓ 内容构建完成: ${rel(OUT_FILE)}`);
  console.log("  " + JSON.stringify(content.stats));
  if (warnings.length) {
    console.log(`  ${warnings.length} 个警告:`);
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
