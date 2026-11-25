import {
  content,
  flowsById,
  moduleFlows,
  moduleProcesses,
  processesById,
  scenesById,
  stepsById,
} from "@/content/data";
import type {
  ContentFlow,
  ContentProcess,
  ContentScene,
  ContentStep,
  LocaleText,
  SceneEdge,
  SceneGroup,
  SceneNode,
} from "@/content/schemas";

export type SceneRoute =
  | { kind: "universe" }
  | { kind: "module"; moduleId: string }
  | { kind: "process"; moduleId: string; processId: string }
  | { kind: "flow"; flowId: string };

const emptyLabel: LocaleText = {
  zh: "内容正在整理，稍后补充。",
  en: "Content is being organized and will be added soon.",
};

function emptyScene(id: string, title: LocaleText, level: ContentScene["level"]): ContentScene {
  return {
    id,
    type: "scene",
    level,
    title,
    viewport: { x: 0, y: 0, zoom: 0.9 },
    groups: [],
    nodes: [
      {
        id: "empty-note",
        kind: "note",
        position: [0, 0],
        size: [420, 150],
        label: emptyLabel,
      },
    ],
    edges: [],
  };
}

function buildModuleScene(moduleId: string): ContentScene {
  const module = content.modules.find((item) => item.id === moduleId);
  if (!module) return emptyScene(`module-${moduleId}`, { zh: moduleId }, "module");

  const processes = moduleProcesses(moduleId);
  const flows = moduleFlows(module);
  const rows = Math.max(1, Math.ceil(processes.length / 2));
  const cols = Math.min(Math.max(processes.length, 1), 2);
  const processGroupX = 340;
  const processGroupY = -40;
  const processGroupWidth = cols * 360 + 20;
  const processGroupHeight = rows * 220 + 20;
  const flowGroupX = processGroupX + processGroupWidth + 40;
  const flowGroupY = -40;
  const flowGroupWidth = 360;
  const flowGroupHeight = Math.max(190, flows.length * 170 + 20);
  const hubY = Math.max(80, processGroupY + (processGroupHeight - 170) / 2);

  const nodes: SceneNode[] = [
    {
      id: "module-hub",
      kind: "module",
      ref: `module:${moduleId}`,
      position: [0, hubY],
      size: [300, 170],
      emphasis: "primary",
    },
  ];
  const edges: SceneEdge[] = [];
  const groups: SceneGroup[] = [];

  if (processes.length > 0) {
    groups.push({
      id: "g-processes",
      title: { zh: "业务流程", en: "Processes" },
      position: [processGroupX, processGroupY],
      size: [processGroupWidth, processGroupHeight],
      module: moduleId,
    });
    processes.forEach((process, index) => {
      const nodeId = `process-${process.id}`;
      nodes.push({
        id: nodeId,
        kind: "process",
        ref: `process:${process.id}`,
        position: [processGroupX + 40 + (index % 2) * 360, processGroupY + 40 + Math.floor(index / 2) * 220],
        size: [300, 180],
      });
      edges.push({
        id: `edge-hub-${process.id}`,
        kind: "dependency",
        from: "module-hub",
        to: nodeId,
      });
    });
  } else {
    nodes.push({
      id: "empty-process",
      kind: "note",
      position: [processGroupX + 40, 0],
      size: [380, 160],
      label: {
        zh: "这个模块的业务流程还在整理。你可以先搜索开发对象，或从端到端流程进入。",
        en: "Processes for this module are still being organized. Search objects or start from a value chain.",
      },
    });
  }

  if (flows.length > 0) {
    groups.push({
      id: "g-flows",
      title: { zh: "端到端流程", en: "Value chains" },
      position: [flowGroupX, flowGroupY],
      size: [flowGroupWidth, flowGroupHeight],
      module: moduleId,
    });
    flows.forEach((flow, index) => {
      const nodeId = `flow-${flow.id}`;
      nodes.push({
        id: nodeId,
        kind: "flow",
        ref: `flow:${flow.id}`,
        position: [flowGroupX + 40, flowGroupY + 40 + index * 170],
        size: [280, 130],
      });
      if (processes.length === 0) {
        edges.push({
          id: `edge-hub-${flow.id}`,
          kind: "flow",
          from: "module-hub",
          to: nodeId,
        });
      }
    });
  }

  for (const process of processes) {
    const flowNode = nodes.find((node) => node.id === `flow-${process.flow}`);
    if (flowNode) {
      edges.push({
        id: `edge-${process.id}-flow`,
        kind: "flow",
        from: `process-${process.id}`,
        to: flowNode.id,
      });
    }
  }

  return {
    id: `module-${moduleId}`,
    type: "scene",
    level: "module",
    module: moduleId,
    title: module.title,
    viewport: { x: 0, y: 0, zoom: 0.78 },
    groups,
    nodes,
    edges,
  };
}
function buildProcessScene(process: ContentProcess): ContentScene {
  const steps = process.steps
    .map((id) => stepsById.get(id))
    .filter((step): step is ContentStep => Boolean(step));

  const cols = steps.length <= 4 ? Math.max(steps.length, 1) : steps.length <= 6 ? 3 : 4;
  const nodes: SceneNode[] = steps.map((step, index) => {
    const row = Math.floor(index / cols);
    const withinRow = index % cols;
    const col = row % 2 === 0 ? withinRow : cols - 1 - withinRow;
    return {
      id: `step-${step.id}`,
      kind: "step",
      ref: `step:${step.id}`,
      position: [col * 320, 120 + row * 210],
      size: [260, 150],
      emphasis: index === 0 ? "primary" : undefined,
    };
  });

  if (nodes.length === 0) {
    nodes.push({
      id: "empty-process",
      kind: "note",
      position: [0, 0],
      size: [420, 150],
      label: emptyLabel,
    });
  }

  const edges: SceneEdge[] = process.edges.map((edge, index) => ({
    id: `edge-${process.id}-${index}`,
    kind: edge.kind as SceneEdge["kind"],
    from: `step-${edge.from}`,
    to: `step-${edge.to}`,
    label: edge.label,
  }));

  if (edges.length === 0 && steps.length > 1) {
    for (let index = 1; index < steps.length; index += 1) {
      edges.push({
        id: `edge-auto-${process.id}-${index}`,
        kind: "sequence",
        from: `step-${steps[index - 1]!.id}`,
        to: `step-${steps[index]!.id}`,
      });
    }
  }

  return {
    id: `process-${process.id}`,
    type: "scene",
    level: "process",
    module: process.module,
    process: process.id,
    title: process.title,
    viewport: { x: 0, y: 0, zoom: 0.78 },
    groups: [],
    nodes,
    edges,
  };
}

function buildFlowScene(flow: ContentFlow): ContentScene {
  const processes = flow.processes
    .map((id) => processesById.get(id))
    .filter((process): process is ContentProcess => Boolean(process));

  const nodes: SceneNode[] = [
    {
      id: "flow-hub",
      kind: "flow",
      ref: `flow:${flow.id}`,
      position: [0, 0],
      size: [300, 150],
      emphasis: "primary",
    },
  ];
  const edges: SceneEdge[] = [];

  processes.forEach((process, index) => {
    const nodeId = `process-${process.id}`;
    nodes.push({
      id: nodeId,
      kind: "process",
      ref: `process:${process.id}`,
      position: [380 + index * 340, 100],
      size: [300, 180],
    });
    edges.push({
      id: `edge-${flow.id}-${process.id}`,
      kind: "flow",
      from: "flow-hub",
      to: nodeId,
      label: { zh: "包含", en: "contains" },
    });
  });

  if (processes.length === 0) {
    nodes.push({
      id: "flow-note",
      kind: "note",
      position: [380, 0],
      size: [420, 160],
      label: {
        zh: "这条端到端流程的模块流程还在整理。可先查看各模块工作区。",
        en: "Module processes for this value chain are still being organized. Browse modules first.",
      },
    });
  }

  return {
    id: `flow-${flow.id}`,
    type: "scene",
    level: "flow",
    flow: flow.id,
    title: flow.title,
    viewport: { x: 0, y: 0, zoom: 0.8 },
    groups: [],
    nodes,
    edges,
  };
}

export function sceneForRoute(route: SceneRoute): ContentScene {
  if (route.kind === "universe") {
    return scenesById.get("universe") ?? emptyScene("universe", { zh: "SAP 系统全景" }, "universe");
  }
  if (route.kind === "module") {
    return scenesById.get(`module-${route.moduleId}`) ?? buildModuleScene(route.moduleId);
  }
  if (route.kind === "process") {
    const explicit = scenesById.get(`process-${route.processId}`);
    if (explicit) return explicit;
    const process = processesById.get(route.processId);
    if (process) return buildProcessScene(process);
    return emptyScene(`process-${route.processId}`, { zh: "流程待补充" }, "process");
  }
  if (route.kind === "flow") {
    const explicit = scenesById.get(`flow-${route.flowId}`);
    if (explicit) return explicit;
    const flow = flowsById.get(route.flowId);
    if (flow) return buildFlowScene(flow);
    return emptyScene(`flow-${route.flowId}`, { zh: "流程待补充" }, "flow");
  }
  return emptyScene("universe", { zh: "SAP 系统全景" }, "universe");
}