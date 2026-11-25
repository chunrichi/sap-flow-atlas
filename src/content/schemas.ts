import { z } from "zod";

export const localeTextSchema = z.object({
  zh: z.string().min(1),
  en: z.string().optional(),
});

export const statusSchema = z.enum(["draft", "reviewed", "verified"]);
export const sourceKindSchema = z.enum([
  "official-doc",
  "official-api",
  "official-library",
  "community",
  "book",
  "third-party",
  "system-export",
]);

export const moduleSchema = z.object({
  id: z.string().min(1),
  type: z.literal("module"),
  abbr: z.string().min(1),
  title: localeTextSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1),
  summary: localeTextSchema,
  scope: z.array(z.string()).default([]),
  keyFlows: z.array(z.string()).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  sources: z.array(z.string()).default([]),
  updatedAt: z.string().min(1),
});

export const stageSchema = z.object({
  id: z.string().min(1),
  title: localeTextSchema,
  primaryModule: z.string().min(1),
  description: z.string().optional(),
});

export const flowSchema = z.object({
  id: z.string().min(1),
  type: z.literal("flow"),
  abbr: z.string().min(1),
  title: localeTextSchema,
  summary: localeTextSchema,
  modules: z.array(z.string()).default([]),
  stages: z.array(stageSchema).min(1),
  processes: z.array(z.string()).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  sources: z.array(z.string()).default([]),
  updatedAt: z.string().min(1),
});

export const edgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.string().default("sequence"),
  label: localeTextSchema.optional(),
});

export const processSchema = z.object({
  id: z.string().min(1),
  type: z.literal("process"),
  title: localeTextSchema,
  module: z.string().min(1),
  flow: z.string().min(1),
  stage: z.string().min(1),
  summary: localeTextSchema,
  steps: z.array(z.string()).default([]),
  edges: z.array(edgeSchema).default([]),
  roles: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  sources: z.array(z.string()).default([]),
  updatedAt: z.string().min(1),
});

export const crossModuleSchema = z.object({
  module: z.string().min(1),
  relation: z.string().min(1),
  note: z.string().min(1),
});

export const stepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("step"),
  title: localeTextSchema,
  primaryModule: z.string().min(1),
  modules: z.array(z.string()).default([]),
  processes: z.array(z.string()).default([]),
  flows: z.array(z.string()).default([]),
  tcode: z.string().optional(),
  summary: localeTextSchema,
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  painPoints: z.array(z.string()).default([]),
  objects: z.array(z.string()).default([]),
  snippets: z.array(z.string()).default([]),
  crossModule: z.array(crossModuleSchema).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  sources: z.array(z.string()).default([]),
  updatedAt: z.string().min(1),
});

export const objectTypeSchema = z.enum([
  "tcode", "table", "bapi", "cds", "odata", "enhancement",
  "class", "function", "idoc", "fiori", "report", "job",
]);

export const relationSchema = z.object({
  target: z.string().min(1),
  kind: z.string().min(1),
  note: z.string().optional(),
});

export const objectSchema = z.object({
  id: z.string().min(1),
  type: objectTypeSchema,
  technicalName: z.string().min(1),
  title: localeTextSchema,
  module: z.string().min(1),
  package: z.string().optional(),
  tableClass: z.string().optional(),
  subtype: z.string().optional(),
  viewType: z.string().optional(),
  serviceVersion: z.string().optional(),
  functionGroup: z.string().optional(),
  messageType: z.string().optional(),
  appId: z.string().optional(),
  summary: localeTextSchema,
  relations: z.array(relationSchema).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  sources: z.array(z.string()).default([]),
  updatedAt: z.string().min(1),
});

export const annotationSchema = z.object({
  lines: z.union([z.string(), z.number()]),
  note: z.string().min(1),
});

export const snippetSchema = z.object({
  id: z.string().min(1),
  type: z.literal("snippet"),
  language: z.string().min(1),
  title: localeTextSchema,
  objects: z.array(z.string()).default([]),
  file: z.string().min(1),
  summary: localeTextSchema,
  annotations: z.array(annotationSchema).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  sources: z.array(z.string()).default([]),
  updatedAt: z.string().min(1),
});

export const sceneNodeKindSchema = z.enum([
  "module", "flow", "process", "step", "object", "portal", "note", "group",
]);

export const pointSchema = z.tuple([z.number(), z.number()]);

export const sceneNodeSchema = z.object({
  id: z.string().min(1),
  kind: sceneNodeKindSchema,
  ref: z.string().optional(),
  module: z.string().optional(),
  position: pointSchema,
  size: pointSchema,
  emphasis: z.string().optional(),
  label: localeTextSchema.optional(),
  target: z.object({
    scene: z.string().min(1),
    step: z.string().optional(),
    object: z.string().optional(),
  }).optional(),
});

export const sceneEdgeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["sequence", "handoff", "data", "dependency", "portal", "loop", "flow"]),
  from: z.string().min(1),
  to: z.string().min(1),
  ref: z.string().optional(),
  label: localeTextSchema.optional(),
});

export const sceneGroupSchema = z.object({
  id: z.string().min(1),
  title: localeTextSchema,
  position: pointSchema,
  size: pointSchema,
  module: z.string().optional(),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  type: z.literal("scene"),
  level: z.enum(["universe", "module", "process", "flow"]),
  module: z.string().optional(),
  process: z.string().optional(),
  flow: z.string().optional(),
  title: localeTextSchema,
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().positive(),
  }).optional(),
  groups: z.array(sceneGroupSchema).default([]),
  nodes: z.array(sceneNodeSchema).default([]),
  edges: z.array(sceneEdgeSchema).default([]),
});

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  kind: sourceKindSchema,
  language: z.string().min(1),
  version: z.string().min(1),
  accessedAt: z.string().min(1),
  note: z.string().optional(),
});

export const sourceFileSchema = z.object({
  sources: z.array(sourceSchema).min(1),
});

export const crosslinkSchema = z.object({
  id: z.string().min(1),
  type: z.literal("crosslink"),
  from: z.string().min(1),
  to: z.string().min(1),
  relation: z.string().min(1),
  label: localeTextSchema,
  note: z.string().min(1),
  sources: z.array(z.string()).default([]),
  status: statusSchema,
  sapVersion: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const termSchema = z.object({
  id: z.string().min(1),
  term: localeTextSchema,
  definition: localeTextSchema,
  module: z.string().min(1),
  related: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
});

export const glossaryFileSchema = z.object({
  terms: z.array(termSchema).min(1),
});

export type LocaleText = z.infer<typeof localeTextSchema>;
export type ContentModule = z.infer<typeof moduleSchema>;
export type ContentFlow = z.infer<typeof flowSchema>;
export type ContentProcess = z.infer<typeof processSchema>;
export type ContentStep = z.infer<typeof stepSchema>;
export type ContentObject = z.infer<typeof objectSchema>;
export type ContentSnippet = z.infer<typeof snippetSchema> & {
  code: string;
  lineCount: number;
};
export type ContentScene = z.infer<typeof sceneSchema>;
export type ContentSource = z.infer<typeof sourceSchema>;
export type ContentCrosslink = z.infer<typeof crosslinkSchema>;
export type ContentTerm = z.infer<typeof termSchema>;
export type SceneNode = z.infer<typeof sceneNodeSchema>;
export type SceneEdge = z.infer<typeof sceneEdgeSchema>;
export type SceneGroup = z.infer<typeof sceneGroupSchema>;
export type ContentStatus = z.infer<typeof statusSchema>;

export type ContentStats = {
  modules: number;
  flows: number;
  processes: number;
  steps: number;
  objects: number;
  snippets: number;
  scenes: number;
  sources: number;
};

export type Occurrence = {
  sceneId: string;
  nodeId: string;
};

export type Content = {
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
  stats: ContentStats;
  occurrences: Record<string, Occurrence[]>;
  objectUsage: Record<string, string[]>;
  generatedAt: string;
};
