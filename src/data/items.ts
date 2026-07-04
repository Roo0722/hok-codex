export interface ItemStats {
  attack?: number;
  magicAttack?: number;
  hp?: number;
  armor?: number;
  magicRes?: number;
  attackSpeed?: number;
  critRate?: number;
  cdReduction?: number;
  lifesteal?: number;
  movementSpeed?: number;
  armorPen?: number;
  magicPen?: number;
  hpRegen?: number;
  manaRegen?: number;
  mana?: number;
  goldPer10?: number;
}

export interface ItemComponent {
  id: string;
  name: string;
  price?: number;
}

export interface Item {
  itemId: string;
  name: string;
  nameCn?: string;
  price: number;
  tier: number;
  category: string;
  stats: ItemStats;
  passive?: string;
  active?: string;
  unique?: string;
  components: ItemComponent[];
  buildsInto: ItemComponent[];
  patchAdded: string;
  lastUpdated: string;
}

import itemsDataRaw from "./items-data.json";

export const items: Item[] = itemsDataRaw as unknown as Item[];

export const allItemCategories: string[] = [
  ...new Set(items.map((i) => i.category)),
].sort();

export function getItemImagePath(itemId: string): string {
  return `/hok-images/items/${itemId}.png`;
}
