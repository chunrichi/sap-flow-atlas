import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Content } from "../src/content/schemas";

const content = JSON.parse(fs.readFileSync("src/generated/content.json", "utf8")) as Content;

const ids = <T extends { id: string }>(items: T[]) => new Set(items.map((item) => item.id));

describe("content graph", () => {
  it("has enough depth for a usable atlas", () => {
    expect(content.modules.length).toBeGreaterThanOrEqual(12);
    expect(content.flows.length).toBeGreaterThanOrEqual(8);
    expect(content.processes.length).toBeGreaterThanOrEqual(80);
    expect(content.steps.length).toBeGreaterThanOrEqual(230);
    expect(content.objects.length).toBeGreaterThanOrEqual(350);
    expect(content.snippets.length).toBeGreaterThanOrEqual(18);
    expect(content.scenes.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps process and step membership bidirectional", () => {
    const processIds = ids(content.processes);
    const stepIds = ids(content.steps);
    for (const process of content.processes) {
      expect(process.steps.length, `${process.id} has steps`).toBeGreaterThan(0);
      for (const stepId of process.steps) {
        expect(stepIds.has(stepId), `${process.id} -> ${stepId}`).toBe(true);
        const step = content.steps.find((item) => item.id === stepId)!;
        expect(step.processes, `${stepId} declares ${process.id}`).toContain(process.id);
      }
    }
    for (const step of content.steps) {
      for (const processId of step.processes) {
        expect(processIds.has(processId), `${step.id} -> ${processId}`).toBe(true);
      }
    }
  });

  it("resolves every flow process and every step object", () => {
    const processIds = ids(content.processes);
    const objectIds = ids(content.objects);
    const flowIds = ids(content.flows);
    for (const flow of content.flows) {
      for (const processId of flow.processes) {
        expect(processIds.has(processId), `${flow.id} -> ${processId}`).toBe(true);
      }
    }
    for (const step of content.steps) {
      for (const flowId of step.flows) expect(flowIds.has(flowId), `${step.id} -> ${flowId}`).toBe(true);
      for (const objectId of step.objects) expect(objectIds.has(objectId), `${step.id} -> ${objectId}`).toBe(true);
    }
  });

  it("keeps scene nodes and edges internally consistent", () => {
    const stepIds = ids(content.steps);
    const processIds = ids(content.processes);
    const flowIds = ids(content.flows);
    const moduleIds = ids(content.modules);
    const objectIds = ids(content.objects);
    for (const scene of content.scenes) {
      const nodeIds = new Set(scene.nodes.map((node) => node.id));
      for (const node of scene.nodes) {
        if (node.ref) {
          if (!objectIds.has(node.ref)) {
            const [kind, id] = node.ref.split(":", 2);
            const table = kind === "step" ? stepIds : kind === "process" ? processIds : kind === "flow" ? flowIds : kind === "module" ? moduleIds : null;
            expect(table, `${scene.id} ref ${node.ref}`).not.toBeNull();
            expect(table!.has(id), `${scene.id} ref ${node.ref}`).toBe(true);
          }
        }
        if (node.kind === "portal" && node.target?.scene) {
          expect(ids(content.scenes).has(node.target.scene), `${scene.id} portal ${node.target.scene}`).toBe(true);
        }
      }
      for (const edge of scene.edges) {
        expect(nodeIds.has(edge.from), `${scene.id} edge from ${edge.from}`).toBe(true);
        expect(nodeIds.has(edge.to), `${scene.id} edge to ${edge.to}`).toBe(true);
      }
    }
  });

  it("keeps snippet annotations within the code file", () => {
    for (const snippet of content.snippets) {
      const snippetPath = snippet.file.startsWith("content/")
        ? snippet.file
        : path.join("content/snippets", snippet.file);
      expect(fs.existsSync(snippetPath), snippetPath).toBe(true);
      const lines = fs.readFileSync(snippetPath, "utf8").split(/\r?\n/);
      for (const annotation of snippet.annotations) {
        const [start, end] = typeof annotation.lines === "string"
          ? annotation.lines.split("-").map(Number)
          : [annotation.lines, annotation.lines];
        expect(start).toBeGreaterThanOrEqual(1);
        expect(start).toBeLessThanOrEqual(end);
        expect(end).toBeLessThanOrEqual(lines.length);
      }
    }
  });

  it("keeps review content and module coverage complete", () => {
    for (const step of content.steps) {
      expect(step.rules.length, `${step.id} rules`).toBeGreaterThan(0);
      expect(step.painPoints.length, `${step.id} painPoints`).toBeGreaterThan(0);
    }
    for (const module of content.modules) {
      expect(content.processes.some((process) => process.module === module.id), `${module.id} process`).toBe(true);
    }
  });

  it("marks conditional processes and optional steps with triggers", () => {
    const conditional = content.processes.filter((process) => process.variant !== "core");
    expect(conditional.length).toBeGreaterThan(20);
    for (const process of conditional) {
      expect(process.trigger, `${process.id} trigger`).toBeTruthy();
      expect(process.trigger!.zh.length, `${process.id} trigger zh`).toBeGreaterThan(4);
    }
    expect(content.processes.some((process) => process.variant === "exception")).toBe(true);
    const optionalSteps = content.steps.filter((step) => step.optional);
    expect(optionalSteps.length).toBeGreaterThan(30);
    for (const step of optionalSteps) {
      expect(step.condition, `${step.id} condition`).toBeTruthy();
    }
  });

  it("covers every flow stage with at least one process", () => {
    for (const flow of content.flows) {
      for (const stage of flow.stages) {
        const covered = flow.processes
          .map((id) => content.processes.find((process) => process.id === id))
          .some((process) => process?.stage === stage.id);
        expect(covered, `${flow.id} / ${stage.id}`).toBe(true);
      }
    }
  });

  it("covers every declared object type", () => {
    const types = new Set<string>(content.objects.map((object) => object.type));
    for (const type of ["tcode", "table", "bapi", "cds", "odata", "enhancement", "class", "function", "idoc", "fiori", "report", "job"]) {
      expect(types.has(type), type).toBe(true);
    }
  });

  it("has the multi-module flows and ABAP development map", () => {
    expect(content.flows.map((flow) => flow.id)).toEqual(expect.arrayContaining(["acquire-to-retire", "develop-to-deploy", "hire-to-retire", "maintain-to-availability"]));
    expect(content.processes.map((process) => process.id)).toEqual(expect.arrayContaining(["sd-pricing", "sd-credit-management", "sd-returns", "abap-interface"]));
    expect(content.scenes.find((scene) => scene.id === "module-abap")?.nodes.some((node) => node.kind === "portal")).toBe(true);
  });
});
