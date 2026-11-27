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
import { validateContent } from "./content-validation";

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

  const stepsById = new Map(steps.map((item) => [item.id, item]));
  const validation = validateContent({ modules, flows, processes, steps, objects, snippets, scenes, sources, crosslinks, terms });
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

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
