import { create } from 'zustand';

export type SavedView = {
  id: string;
  name: string;
  href: string;
  createdAt: string;
};

type WorkspaceState = {
  dockWidth: number;
  railCollapsed: boolean;
  drawerOpen: boolean;
  filtersOpen: boolean;
  savedViews: SavedView[];
  setDockWidth: (width: number) => void;
  toggleRail: () => void;
  setDrawerOpen: (open: boolean) => void;
  setFiltersOpen: (open: boolean) => void;
  addSavedView: (name: string, href: string) => void;
  removeSavedView: (id: string) => void;
};

const DOCK_KEY = 'atlas.workbench.dockWidth';
const RAIL_KEY = 'atlas.workbench.railCollapsed';
const SAVED_KEY = 'atlas.workbench.savedViews';

function readNumber(key: string, fallback: number): number {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function readBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  } catch {
    return fallback;
  }
}

function readSavedViews(): SavedView[] {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedView => Boolean(item && typeof item === 'object' && 'name' in item && 'href' in item)).slice(0, 12);
  } catch {
    return [];
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage may be unavailable in private mode
  }
}

function persistSaved(views: SavedView[]) {
  write(SAVED_KEY, JSON.stringify(views));
}

function clampWidth(width: number): number {
  return Math.min(640, Math.max(320, Math.round(width)));
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  dockWidth: readNumber(DOCK_KEY, 440),
  railCollapsed: readBoolean(RAIL_KEY, false),
  drawerOpen: false,
  filtersOpen: false,
  savedViews: readSavedViews(),
  setDockWidth: (width) => {
    const next = clampWidth(width);
    write(DOCK_KEY, String(next));
    set({ dockWidth: next });
  },
  toggleRail: () => {
    const next = !get().railCollapsed;
    write(RAIL_KEY, next ? '1' : '0');
    set({ railCollapsed: next });
  },
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setFiltersOpen: (open) => set({ filtersOpen: open }),
  addSavedView: (name, href) => {
    const clean = name.trim().slice(0, 40);
    if (!clean) return;
    const next = [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: clean, href, createdAt: new Date().toISOString() },
      ...get().savedViews.filter((item) => item.href !== href),
    ].slice(0, 12);
    persistSaved(next);
    set({ savedViews: next });
  },
  removeSavedView: (id) => {
    const next = get().savedViews.filter((item) => item.id !== id);
    persistSaved(next);
    set({ savedViews: next });
  },
}));
