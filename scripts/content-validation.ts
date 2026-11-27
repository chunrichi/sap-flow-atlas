import type {
  ContentCrosslink,
  ContentFlow,
  ContentModule,
  ContentObject,
  ContentProcess,
  ContentScene,
  ContentSnippet,
  ContentSource,
  ContentStep,
  ContentTerm,
} from "../src/content/schemas";

export type ContentBundle = {
  modules: ContentModule[];
  flows: ContentFlow[];
  processes: ContentProcess[];
  steps: ContentStep[];
  objects: ContentObject[];
  snippets: ContentSnippet[];
  scenes: ContentScene[];
  sources: ContentSource[];
  crosslinks: ContentCrosslink[];
  terms: ContentTerm[];
};

export type ValidationResult = { errors: string[]; warnings: string[] };

type Ctx = ContentBundle & {
  modulesById: Map<string, ContentModule>;
  flowsById: Map<string, ContentFlow>;
  processesById: Map<string, ContentProcess>;
  stepsById: Map<string, ContentStep>;
  objectsById: Map<string, ContentObject>;
  snippetsById: Map<string, ContentSnippet>;
  scenesById: Map<string, ContentScene>;
  sourcesById: Map<string, ContentSource>;
  errors: string[];
  warnings: string[];
  resolve: (ref: string, where: string) => boolean;
  checkSources: (ids: string[] | undefined, where: string) => void;
};

function annotationRange(value: string | number): [number, number] {
  const parts = String(value).split("-").map((part) => Number(part));
  const start = parts[0] ?? 0;
  const end = parts.length > 1 ? (parts[1] ?? start) : start;
  return [start, end];
}

export function buildContext(bundle: ContentBundle): Ctx {
  const modulesById = new Map(bundle.modules.map((item) => [item.id, item]));
  const flowsById = new Map(bundle.flows.map((item) => [item.id, item]));
  const processesById = new Map(bundle.processes.map((item) => [item.id, item]));
  const stepsById = new Map(bundle.steps.map((item) => [item.id, item]));
  const objectsById = new Map(bundle.objects.map((item) => [item.id, item]));
  const snippetsById = new Map(bundle.snippets.map((item) => [item.id, item]));
  const scenesById = new Map(bundle.scenes.map((item) => [item.id, item]));
  const sourcesById = new Map(bundle.sources.map((item) => [item.id, item]));
  const crosslinksById = new Map(bundle.crosslinks.map((item) => [item.id, item]));
  const termsById = new Map(bundle.terms.map((item) => [item.id, item]));
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
  const errors: string[] = [];
  const warnings: string[] = [];
  const ctx = {
    ...bundle,
    modulesById, flowsById, processesById, stepsById, objectsById, snippetsById, scenesById, sourcesById,
    errors, warnings,
    resolve: (ref: string, where: string): boolean => {
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
    },
    checkSources: (ids: string[] | undefined, where: string) => {
      for (const id of ids ?? []) ctx.resolve(`source:${id}`, where);
    },
  };
  return ctx;
}

export function claimAllIds(ctx: Ctx): void {
  const claimed = new Map<string, string>();
  const claim = (id: string, where: string) => {
    const previous = claimed.get(id);
    if (previous) ctx.errors.push(`ID 重复: ${id}（${previous} 与 ${where}）`);
    else claimed.set(id, where);
  };
  ctx.modules.forEach((item) => claim(item.id, `module ${item.id}`));
  ctx.flows.forEach((item) => claim(item.id, `flow ${item.id}`));
  ctx.processes.forEach((item) => claim(item.id, `process ${item.id}`));
  ctx.steps.forEach((item) => claim(item.id, `step ${item.id}`));
  ctx.objects.forEach((item) => claim(item.id, `object ${item.id}`));
  ctx.snippets.forEach((item) => claim(item.id, `snippet ${item.id}`));
  ctx.scenes.forEach((item) => claim(item.id, `scene ${item.id}`));
  ctx.sources.forEach((item) => claim(item.id, `source ${item.id}`));
  ctx.crosslinks.forEach((item) => claim(item.id, `crosslink ${item.id}`));
  ctx.terms.forEach((item) => claim(item.id, `term ${item.id}`));
}

function checkModules(ctx: Ctx): void {
  for (const item of ctx.modules) {
    for (const flow of item.keyFlows) ctx.resolve(`flow:${flow}`, `module ${item.id}`);
    ctx.checkSources(item.sources, `module ${item.id}`);
  }
}

function checkFlows(ctx: Ctx): void {
  for (const flow of ctx.flows) {
    for (const mod of flow.modules) ctx.resolve(`module:${mod}`, `flow ${flow.id}`);
    for (const proc of flow.processes) ctx.resolve(`process:${proc}`, `flow ${flow.id}`);
    for (const stage of flow.stages) ctx.resolve(`module:${stage.primaryModule}`, `flow ${flow.id} stage ${stage.id}`);
    ctx.checkSources(flow.sources, `flow ${flow.id}`);
    if (flow.modules.length < 2) ctx.warnings.push(`flow ${flow.id}: 端到端流程只涉及 ${flow.modules.length} 个模块`);
  }
}

function checkProcesses(ctx: Ctx): void {
  for (const proc of ctx.processes) {
    ctx.resolve(`module:${proc.module}`, `process ${proc.id}`);
    ctx.resolve(`flow:${proc.flow}`, `process ${proc.id}`);
    if (proc.variant !== "core" && !proc.trigger) {
      ctx.errors.push(`process ${proc.id}: ${proc.variant} 流程必须写 trigger（何时进入该路径）`);
    }
    if (proc.variant === "core" && proc.trigger) {
      ctx.warnings.push(`process ${proc.id}: 核心流程无需 trigger`);
    }
    const ownerFlow = ctx.flowsById.get(proc.flow);
    if (ownerFlow) {
      if (!ownerFlow.processes.includes(proc.id)) {
        ctx.errors.push(`process ${proc.id}: 所属 flow ${proc.flow} 的 processes 未包含该流程`);
      }
      if (!ownerFlow.stages.some((stage) => stage.id === proc.stage)) {
        ctx.errors.push(`process ${proc.id}: stage ${proc.stage} 不属于 flow ${proc.flow}`);
      }
    }
    for (const stepId of proc.steps) {
      if (!ctx.resolve(`step:${stepId}`, `process ${proc.id}`)) continue;
      const step = ctx.stepsById.get(stepId);
      if (step && !step.processes.includes(proc.id)) {
        ctx.errors.push(`process ${proc.id}: step ${stepId} 的 processes 未声明该流程（双向不一致）`);
      }
    }
    for (const edge of proc.edges) {
      if (!proc.steps.includes(edge.from)) ctx.errors.push(`process ${proc.id}: 边起点 ${edge.from} 不在 steps 中`);
      if (!proc.steps.includes(edge.to)) ctx.errors.push(`process ${proc.id}: 边终点 ${edge.to} 不在 steps 中`);
    }
    ctx.checkSources(proc.sources, `process ${proc.id}`);
  }
}

function checkSteps(ctx: Ctx): void {
  for (const step of ctx.steps) {
    if (step.optional && !step.condition) {
      ctx.errors.push(`step ${step.id}: optional 步骤必须写 condition（触发条件）`);
    }
    if (!step.optional && step.condition) {
      ctx.warnings.push(`step ${step.id}: 非可选步骤写了 condition，可能漏标 optional`);
    }
    for (const mod of step.modules) ctx.resolve(`module:${mod}`, `step ${step.id}`);
    for (const procId of step.processes) {
      if (!ctx.resolve(`process:${procId}`, `step ${step.id}`)) continue;
      const proc = ctx.processesById.get(procId);
      if (proc && !proc.steps.includes(step.id)) {
        ctx.errors.push(`step ${step.id}: process ${procId} 未声明该步骤（双向不一致）`);
      }
    }
    for (const flowId of step.flows) ctx.resolve(`flow:${flowId}`, `step ${step.id}`);
    for (const objectId of step.objects) ctx.resolve(objectId, `step ${step.id}`);
    for (const snippetId of step.snippets) ctx.resolve(`snippet:${snippetId}`, `step ${step.id}`);
    ctx.checkSources(step.sources, `step ${step.id}`);
  }
}

function checkObjects(ctx: Ctx): void {
  for (const object of ctx.objects) {
    const [type, name] = object.id.split(":");
    if (type !== object.type) ctx.errors.push(`object ${object.id}: ID 前缀与 type 不一致`);
    if (name !== object.technicalName) ctx.errors.push(`object ${object.id}: technicalName 不一致`);
    ctx.resolve(`module:${object.module}`, `object ${object.id}`);
    for (const relation of object.relations) ctx.resolve(relation.target, `object ${object.id}`);
    ctx.checkSources(object.sources, `object ${object.id}`);
  }
}

function checkSnippets(ctx: Ctx): void {
  for (const snippet of ctx.snippets) {
    for (const objectId of snippet.objects) ctx.resolve(objectId, `snippet ${snippet.id}`);
    for (const annotation of snippet.annotations) {
      const [start, end] = annotationRange(annotation.lines);
      if (start < 1 || end < start || end > snippet.lineCount) {
        ctx.errors.push(`snippet ${snippet.id}: 注解范围 ${annotation.lines} 超出 ${snippet.lineCount} 行`);
      }
    }
    ctx.checkSources(snippet.sources, `snippet ${snippet.id}`);
  }
}

function checkScenes(ctx: Ctx): void {
  for (const scene of ctx.scenes) {
    if (scene.module) ctx.resolve(`module:${scene.module}`, `scene ${scene.id}`);
    if (scene.process) ctx.resolve(`process:${scene.process}`, `scene ${scene.id}`);
    if (scene.flow) ctx.resolve(`flow:${scene.flow}`, `scene ${scene.id}`);
    const nodeIds = new Set<string>();
    for (const node of scene.nodes) {
      if (nodeIds.has(node.id)) ctx.errors.push(`scene ${scene.id}: 节点 ID 重复 ${node.id}`);
      nodeIds.add(node.id);
      if (node.ref) ctx.resolve(node.ref, `scene ${scene.id} node ${node.id}`);
      if (node.kind === "portal") {
        if (!node.target) ctx.errors.push(`scene ${scene.id} node ${node.id}: portal 缺少 target`);
        else {
          ctx.resolve(`scene:${node.target.scene}`, `scene ${scene.id} node ${node.id}`);
          if (node.target.step) ctx.resolve(`step:${node.target.step}`, `scene ${scene.id} node ${node.id}`);
          if (node.target.object) ctx.resolve(node.target.object, `scene ${scene.id} node ${node.id}`);
        }
      }
    }
    const groupIds = new Set<string>();
    for (const group of scene.groups) {
      if (groupIds.has(group.id)) ctx.errors.push(`scene ${scene.id}: 分组 ID 重复 ${group.id}`);
      groupIds.add(group.id);
      if (nodeIds.has(group.id)) ctx.errors.push(`scene ${scene.id}: 分组 ID 与节点冲突 ${group.id}`);
    }
    for (const edge of scene.edges) {
      if (!nodeIds.has(edge.from)) ctx.errors.push(`scene ${scene.id}: 边 ${edge.id} 起点不存在 ${edge.from}`);
      if (!nodeIds.has(edge.to)) ctx.errors.push(`scene ${scene.id}: 边 ${edge.id} 终点不存在 ${edge.to}`);
    }
  }
}

function checkCrosslinks(ctx: Ctx): void {
  for (const crosslink of ctx.crosslinks) {
    ctx.resolve(crosslink.from, `crosslink ${crosslink.id}`);
    ctx.resolve(crosslink.to, `crosslink ${crosslink.id}`);
    ctx.checkSources(crosslink.sources, `crosslink ${crosslink.id}`);
  }
}

function checkTerms(ctx: Ctx): void {
  for (const term of ctx.terms) {
    ctx.resolve(`module:${term.module}`, `term ${term.id}`);
    for (const ref of term.related) ctx.resolve(ref, `term ${term.id}`);
    ctx.checkSources(term.sources, `term ${term.id}`);
  }
}

function checkSources(ctx: Ctx): void {
  for (const source of ctx.sources) {
    if (!source.url.startsWith("https://")) ctx.errors.push(`source ${source.id}: URL 必须为 https`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)) {
      ctx.errors.push(`source ${source.id}: accessedAt 必须是 YYYY-MM-DD`);
    }
  }
}

function checkStatuses(ctx: Ctx): void {
  const statusEntities: Array<{ id: string; status: string; sources: string[] }> = [
    ...ctx.modules, ...ctx.flows, ...ctx.processes, ...ctx.steps, ...ctx.objects, ...ctx.snippets, ...ctx.crosslinks,
  ];
  for (const entity of statusEntities) {
    if (entity.status === "verified") {
      const hasOfficial = entity.sources.some((id) => ctx.sourcesById.get(id)?.kind.startsWith("official"));
      if (!hasOfficial) ctx.warnings.push(`${entity.id}: verified 但没有 official-* 来源`);
    }
    if (entity.status !== "draft" && entity.sources.length === 0) {
      ctx.warnings.push(`${entity.id}: ${entity.status} 但没有来源`);
    }
  }
}

export function validateContent(bundle: ContentBundle): ValidationResult {
  const ctx = buildContext(bundle);
  claimAllIds(ctx);
  checkModules(ctx);
  checkFlows(ctx);
  checkProcesses(ctx);
  checkSteps(ctx);
  checkObjects(ctx);
  checkSnippets(ctx);
  checkScenes(ctx);
  checkCrosslinks(ctx);
  checkTerms(ctx);
  checkSources(ctx);
  checkStatuses(ctx);
  return { errors: ctx.errors, warnings: ctx.warnings };
}