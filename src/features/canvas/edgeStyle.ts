export const EDGE_COLORS: Record<string, string> = {
  sequence: "#94a3b8",
  handoff: "#3b82f6",
  portal: "#8b5cf6",
  flow: "#0ea5e9",
  data: "#b8c4d4",
  dependency: "#aebccd",
  loop: "#f59e0b",
};

export function edgeColor(kind: string): string {
  return EDGE_COLORS[kind] ?? "#94a3b8";
}
