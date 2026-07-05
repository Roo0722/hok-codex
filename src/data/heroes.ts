export interface HeroStats {
  maxHp?: number | null;
  physDef?: number | null;
  magDef?: number | null;
  physAtk?: number | null;
  moveSpeed?: number | null;
  hpPer5s?: number | null;
  manaPer5s?: number | null;
  maxMana?: number | null;
  attackSpeed?: number | null;
}

export interface Hero {
  heroId: string;
  slug: string;
  name: string;
  tier: string;
  difficulty: number;
  classType: string;
  subclasses: string[];
  roles: string[];
  summary: string;
  stats: HeroStats;
  patchAdded: string;
  lastUpdated: string;
}

import heroesDataRaw from "./heroes-data.json";

export const heroes: Hero[] = heroesDataRaw as unknown as Hero[];

export function getHeroImagePath(slug: string): string {
  return `/hok-images/heroes/${slug}.jpg`;
}

export function getHeroSplashPath(slug: string): string {
  return `/hok-images/heroes/${slug}-splash.jpg`;
}
