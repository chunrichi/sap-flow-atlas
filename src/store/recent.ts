import { create } from "zustand";

const KEY = "atlas-recent-v1";
const MAX = 5;

export type RecentEntry = {
  path: string;
  title: string;
  level: "universe" | "module" | "process" | "flow";
};

function read(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.path === "string" && typeof entry.title === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function persist(entries: RecentEntry[]) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage can be unavailable in private mode.
  }
}

type RecentState = {
  entries: RecentEntry[];
  record: (entry: RecentEntry) => void;
  clear: () => void;
};

export const useRecentStore = create<RecentState>((set) => ({
  entries: read(),
  record: (entry) => set((state) => {
    const next = [entry, ...state.entries.filter((item) => item.path !== entry.path)].slice(0, MAX);
    persist(next);
    return { entries: next };
  }),
  clear: () => {
    persist([]);
    set({ entries: [] });
  },
}));
