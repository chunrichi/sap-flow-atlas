import raw from "@/generated/content.json";
import type {
  Content,
  ContentFlow,
  ContentModule,
  ContentObject,
  ContentProcess,
  ContentScene,
  ContentSnippet,
  ContentSource,
  ContentStep,
  ContentTerm,
  LocaleText,
} from "./schemas";

export const content = raw as unknown as Content;

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export const modulesById = indexById(content.modules);
export const flowsById = indexById(content.flows);
export const processesById = indexById(content.processes);
export const stepsById = indexById(content.steps);
export const objectsById = indexById(content.objects);
export const snippetsById = indexById(content.snippets);
export const scenesById = indexById(content.scenes);
export const sourcesById = indexById(content.sources);
export const termsById = indexById(content.terms);

export const objectTypeLabels: Record<string, string> = {
  tcode: "T-Code",
  table: "表",
  bapi: "BAPI",
  cds: "CDS",
  odata: "OData",
  enhancement: "增强",
  class: "类",
  function: "函数",
  idoc: "IDoc",
  fiori: "Fiori",
  report: "报表",
  job: "作业",
};

export const objectTypeShort: Record<string, string> = {
  tcode: "TC",
  table: "TBL",
  bapi: "BAPI",
  cds: "CDS",
  odata: "API",
  enhancement: "ENH",
  class: "CLS",
  function: "FM",
  idoc: "IDoc",
  fiori: "App",
  report: "RPT",
  job: "JOB",
};

export const statusLabels: Record<string, string> = {
  draft: "草稿",
  reviewed: "已复核",
  verified: "已验证",
};

export const levelLabels: Record<string, string> = {
  universe: "系统全景",
  module: "模块工作区",
  process: "流程画布",
  flow: "端到端流程",
};

export function text(value: LocaleText | undefined, fallback = ""): string {
  return value?.zh || value?.en || fallback;
}

export function moduleOf(value: { module?: string; primaryModule?: string }): ContentModule | undefined {
  const id = value.module ?? value.primaryModule;
  return id ? modulesById.get(id) : undefined;
}

export function moduleForStep(step: ContentStep): ContentModule | undefined {
  return modulesById.get(step.primaryModule);
}

export function processForStep(step: ContentStep): ContentProcess | undefined {
  return step.processes.map((id) => processesById.get(id)).find(Boolean);
}

export function objectsForStep(step: ContentStep): ContentObject[] {
  return step.objects.map((id) => objectsById.get(id)).filter((item): item is ContentObject => Boolean(item));
}

export function snippetsForStep(step: ContentStep): ContentSnippet[] {
  return step.snippets.map((id) => snippetsById.get(id)).filter((item): item is ContentSnippet => Boolean(item));
}

export function snippetsForObject(object: ContentObject): ContentSnippet[] {
  return content.snippets.filter((snippet) => snippet.objects.includes(object.id));
}

export function stepsForObject(object: ContentObject): ContentStep[] {
  return (content.objectUsage[object.id] ?? [])
    .map((id) => stepsById.get(id))
    .filter((item): item is ContentStep => Boolean(item));
}

export function sourcesFor(ids: string[]): ContentSource[] {
  return ids.map((id) => sourcesById.get(id)).filter((item): item is ContentSource => Boolean(item));
}

export function processSteps(process: ContentProcess): ContentStep[] {
  return process.steps.map((id) => stepsById.get(id)).filter((item): item is ContentStep => Boolean(item));
}

export function moduleProcesses(moduleId: string): ContentProcess[] {
  return content.processes.filter((process) => process.module === moduleId);
}

export function moduleSteps(moduleId: string): ContentStep[] {
  return content.steps.filter((step) => step.primaryModule === moduleId || step.modules.includes(moduleId));
}

export function moduleObjects(moduleId: string): ContentObject[] {
  return content.objects.filter((object) => object.module === moduleId);
}

export function moduleFlows(module: ContentModule): ContentFlow[] {
  return module.keyFlows
    .map((id) => flowsById.get(id))
    .filter((item): item is ContentFlow => Boolean(item));
}

export function sceneRoute(scene: ContentScene): string {
  switch (scene.level) {
    case "module":
      return `/m/${scene.module ?? ""}`;
    case "process":
      return `/m/${scene.module ?? ""}/p/${scene.process ?? ""}`;
    case "flow":
      return `/f/${scene.flow ?? ""}`;
    default:
      return "/";
  }
}

export function stepRoute(step: ContentStep): string {
  const process = processForStep(step);
  if (process) return `/m/${process.module}/p/${process.id}?step=${encodeURIComponent(step.id)}`;
  return `/m/${step.primaryModule}?step=${encodeURIComponent(step.id)}`;
}

export function objectRoute(object: ContentObject): string {
  const step = stepsForObject(object)[0];
  if (step) {
    const process = processForStep(step);
    const base = process ? `/m/${process.module}/p/${process.id}` : `/m/${step.primaryModule}`;
    return `${base}?object=${encodeURIComponent(object.id)}`;
  }
  return `/m/${object.module}?object=${encodeURIComponent(object.id)}`;
}

export function processRoute(process: ContentProcess): string {
  return `/m/${process.module}/p/${process.id}`;
}

export function flowRoute(flow: ContentFlow): string {
  return `/f/${flow.id}`;
}

export function objectById(id: string | null): ContentObject | undefined {
  return id ? objectsById.get(id) : undefined;
}

export function stepById(id: string | null): ContentStep | undefined {
  return id ? stepsById.get(id) : undefined;
}

export function termById(id: string): ContentTerm | undefined {
  return termsById.get(id);
}

export function sceneById(id: string): ContentScene | undefined {
  return scenesById.get(id);
}

export const moduleIconLabel: Record<string, string> = {
  sd: "SD",
  mm: "MM",
  fi: "FI",
  co: "CO",
  pp: "PP",
  qm: "QM",
  pm: "PM",
  ewm: "EWM",
  ps: "PS",
  cs: "CS",
  hr: "HR",
  abap: "ABAP",
};
