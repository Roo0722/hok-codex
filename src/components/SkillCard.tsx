"use client";

import type { Skill } from "@/data/skills";
import { getSkillImagePath } from "@/data/skills";

interface SkillCardProps {
  skill: Skill;
  changedRecently?: boolean;
}

export function SkillCard({ skill, changedRecently }: SkillCardProps) {
  return (
    <div className="hok-card rounded-lg p-3 relative">
      {changedRecently && (
        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-[#E85D3A]/20 text-[#F09880] border border-[#E85D3A]/30">
          Updated
        </span>
      )}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded bg-[#2A2A2A] overflow-hidden shrink-0">
          <img
            src={getSkillImagePath(skill.heroSlug, skill.slot)}
            alt={skill.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#F0F0F0] truncate">{skill.name}</h3>
          <p className="text-xs text-[#808080]">
            {skill.heroName} · {skill.slot}
          </p>
        </div>
      </div>

      <p className="text-xs text-[#CCCCCC] leading-relaxed mb-2">{skill.description}</p>

      <div className="flex flex-wrap gap-3 text-[11px] text-[#999999]">
        {skill.manaCost !== undefined && <span>Mana: {skill.manaCost}</span>}
        {skill.castRange !== undefined && <span>Range: {skill.castRange}</span>}
        {skill.cooldown && skill.cooldown.length > 0 && (
          <span>
            Cooldown: {skill.cooldown.map((c) => c.value).join("/")}s
          </span>
        )}
      </div>
    </div>
  );
}
