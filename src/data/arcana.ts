export type ArcanaColor = "Red" | "Purple" | "Blue" | "Green";

export interface ArcanaStats {
  attack?: number;
  attackSpeed?: number;
  critRate?: number;
  movementSpeed?: number;
  hp?: number;
  armorPen?: number;
  cdReduction?: number;
  magicAttack?: number;
  magicPen?: number;
  lifesteal?: number;
  goldPer10?: number;
  magicRes?: number;
  hpRegen?: number;
  armor?: number;
}

export interface Arcana {
  arcanaId: string;
  name: string;
  nameCn?: string;
  color: ArcanaColor;
  tier: number;
  unlockLevel: number;
  stats: ArcanaStats;
  bonus?: string;
  patchAdded: string;
  lastUpdated: string;
}

import arcanaDataRaw from "./arcana-data.json";

export const arcana: Arcana[] = arcanaDataRaw as unknown as Arcana[];

export function getArcanaImagePath(arcanaId: string): string {
  return `/hok-images/arcana/${arcanaId}.png`;
}
