import { processesById, processSteps, stepsById, text } from '@/content/data';
import type { ContentFlow, ContentProcess } from '@/content/schemas';
import { stageLabel } from '@/lib/workspace';

export type StoryEntry = { stepId: string; stage: string; note: string };

const STORY_NOTES: Record<string, string> = {
  'sd-va01-create-sales-order': '先接住客户需求：订单类型、客户、物料、数量与交期决定后续所有节点。',
  'sd-vk11-maintain-condition': '价格不是手填：VK11 维护的条件记录会在订单定价时被条件技术读取。',
  'sd-vkm3-credit-check': '信用检查拦截超限订单；被冻结的订单需要释放后才能继续履约。',
  'sd-vl01n-create-delivery': '交货把订单转成实物履约；库存、批次与发货日期在这里确定。',
  'sd-vf01-create-billing': '开票形成应收与收入；发票日期与会计期间必须匹配。',
  'fi-f28-post-incoming-payment': '收款清销应收，O2C 的资金闭环在这里结束。',
};

const O2C_STEPS = [
  ['sd-va01-create-sales-order', '订单'],
  ['sd-vk11-maintain-condition', '定价'],
  ['sd-vkm3-credit-check', '信用'],
  ['sd-vl01n-create-delivery', '履约'],
  ['sd-vf01-create-billing', '开票'],
  ['fi-f28-post-incoming-payment', '收款'],
];

export function buildStory(flow: ContentFlow): StoryEntry[] {
  if (flow.id === 'order-to-cash') {
    return O2C_STEPS
      .map(([stepId, stage]) => {
        const step = stepsById.get(stepId);
        return step ? { stepId, stage, note: STORY_NOTES[stepId] ?? text(step.summary) } : null;
      })
      .filter((entry): entry is StoryEntry => Boolean(entry));
  }
  const entries: StoryEntry[] = [];
  const seen = new Set<string>();
  const push = (stepId: string, stage: string) => {
    if (seen.has(stepId)) return;
    const step = stepsById.get(stepId);
    if (!step) return;
    seen.add(stepId);
    entries.push({ stepId, stage, note: text(step.summary) });
  };
  for (const stage of flow.stages) {
    const stageProcesses = flow.processes
      .map((id) => processesById.get(id))
      .filter((process): process is ContentProcess => process !== undefined && process.stage === stage.id);
    const first = stageProcesses[0];
    if (!first) continue;
    const firstStep = processSteps(first)[0];
    if (firstStep) push(firstStep.id, text(stage.title));
  }
  if (entries.length < 4) {
    for (const processId of flow.processes) {
      const process = processesById.get(processId);
      if (!process) continue;
      for (const step of processSteps(process)) push(step.id, stageLabel(flow, process.stage));
    }
  }
  return entries.slice(0, 8);
}
