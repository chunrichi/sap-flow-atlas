import { createContext, useContext } from "react";

export type LodLevel = 0 | 1 | 2;

export const LodContext = createContext<LodLevel>(1);

export function useLod(): LodLevel {
  return useContext(LodContext);
}

export function zoomTier(zoom: number): LodLevel {
  if (zoom < 0.62) return 0;
  if (zoom > 1.08) return 2;
  return 1;
}
