import { create } from "zustand";

export type HoverKind = "step" | "process" | "object";

export type HoverPayload = {
  kind: HoverKind;
  id: string;
  x: number;
  y: number;
};

type UIState = {
  hover: HoverPayload | null;
  pinnedHover: HoverPayload | null;
  searchOpen: boolean;
  minimapOpen: boolean;
  scheduleHover: (payload: HoverPayload, delay?: number) => void;
  openHoverNow: (payload: HoverPayload) => void;
  scheduleClose: (delay?: number) => void;
  cancelClose: () => void;
  clearHover: () => void;
  pinHover: () => void;
  unpinHover: () => void;
  setSearchOpen: (open: boolean) => void;
  setMinimapOpen: (open: boolean) => void;
};

let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (openTimer) clearTimeout(openTimer);
  if (closeTimer) clearTimeout(closeTimer);
  openTimer = null;
  closeTimer = null;
}

export const useUIStore = create<UIState>((set, get) => ({
  hover: null,
  pinnedHover: null,
  searchOpen: false,
  minimapOpen: false,
  scheduleHover: (payload, delay = 120) => {
    clearTimers();
    openTimer = setTimeout(() => set({ hover: payload }), delay);
  },
  openHoverNow: (payload) => {
    clearTimers();
    set({ hover: payload });
  },
  scheduleClose: (delay = 220) => {
    if (openTimer) clearTimeout(openTimer);
    openTimer = null;
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (get().hover) set({ hover: null });
    }, delay);
  },
  cancelClose: () => {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = null;
  },
  clearHover: () => {
    clearTimers();
    set({ hover: null });
  },
  pinHover: () => {
    const hover = get().hover;
    if (!hover) return;
    clearTimers();
    set({ pinnedHover: hover, hover: null });
  },
  unpinHover: () => set({ pinnedHover: null }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setMinimapOpen: (open) => set({ minimapOpen: open }),
}));
