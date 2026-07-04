export type SkillSlot = "Passive" | "1" | "2" | "Ultimate";

export interface SkillScaling {
  level: number;
  value: number;
}

export interface Skill {
  skillId: string;
  heroSlug: string;
  heroName: string;
  slot: SkillSlot;
  name: string;
  description: string;
  damageValues?: SkillScaling[];
  cooldown?: SkillScaling[];
  manaCost?: number;
  castRange?: number;
  patchAdded: string;
  lastUpdated: string;
}

import skillsDataRaw from "./skills-data.json";

export const skills: Skill[] = skillsDataRaw as unknown as Skill[];

export function getSkillsForHero(heroSlug: string): Skill[] {
  return skills.filter((s) => s.heroSlug === heroSlug);
}

export function getSkillImagePath(heroSlug: string, slot: SkillSlot): string {
  return `/hok-images/skills/${heroSlug}-${slot.toLowerCase()}.png`;
}
