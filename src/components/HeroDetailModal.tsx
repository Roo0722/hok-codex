"use client";

import { useEffect, useState } from "react";
import type { Hero } from "@/data/heroes";
import { getHeroImagePath, getHeroSplashPath } from "@/data/heroes";
import { getSkillsForHero } from "@/data/skills";
import { fetchBuildsForHero, type RemoteBuild } from "@/lib/worker-api";
import { X } from "lucide-react";

interface HeroDetailModalProps {
  hero: Hero | null;
  onClose: () => void;
}

const slotOrder = ["Passive", "1", "2", "Ultimate"];

export function HeroDetailModal({ hero, onClose }: HeroDetailModalProps) {
  const [builds, setBuilds] = useState<RemoteBuild[]>([]);
  const [buildsLoading, setBuildsLoading] = useState(false);

  useEffect(() => {
    if (!hero) return;
    setBuildsLoading(true);
    fetchBuildsForHero(hero.name)
      .then(setBuilds)
      .catch(() => setBuilds([]))
      .finally(() => setBuildsLoading(false));
  }, [hero]);

  if (!hero) return null;

  const skills = getSkillsForHero(hero.slug).sort(
    (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot)
  );

  const statEntries = Object.entries(hero.stats).filter(([, v]) => v !== null && v !== undefined);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
      <div className="hok-card rounded-t-2xl sm:rounded-lg w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
        <div className="relative h-32 bg-[#2A2A2A] overflow-hidden">
          <img
            src={getHeroSplashPath(hero.slug)}
            alt={hero.name}
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white bg-black/40 rounded-full p-1"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-3 left-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#2A2A2A] overflow-hidden border-2 border-[#C2924C]">
              <img
                src={getHeroImagePath(hero.slug)}
                alt={hero.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F0F0F0]">{hero.name}</h2>
              <p className="text-xs text-[#E7C285]">
                {hero.tier} Tier · {hero.classType}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {hero.summary && (
            <p className="text-sm text-[#CCCCCC] leading-relaxed mb-4">{hero.summary}</p>
          )}

          {statEntries.length > 0 && (
            <div className="mb-4 pb-4 border-b border-[#C2924C]/10">
              <p className="text-xs font-semibold text-[#C2924C] mb-2">Base Stats</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {statEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-[#808080] capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <span className="text-[#F0F0F0] font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(buildsLoading || builds.length > 0) && (
            <div className="mb-4 pb-4 border-b border-[#C2924C]/10">
              <p className="text-xs font-semibold text-[#C2924C] mb-2">Recommended Builds</p>
              {buildsLoading && (
                <p className="text-xs text-[#808080]">Loading builds...</p>
              )}
              <div className="space-y-2">
                {builds.map((b) => (
                  <div key={b.buildId} className="hok-card rounded-lg p-3 border border-[#C2924C]/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#F0F0F0]">{b.buildName}</span>
                      {b.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C2924C]/20 text-[#E7C285]">
                          {b.badge}
                        </span>
                      )}
                    </div>
                    {b.description && (
                      <p className="text-xs text-[#999999] mb-2">{b.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {b.items
                        .filter((i): i is NonNullable<typeof i> => i !== null)
                        .map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-1 rounded bg-[#2A2A2A] text-[#F0F0F0]"
                          >
                            {item.name}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-[#C2924C] mb-2">Skills</p>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div
                key={skill.skillId}
                className="hok-card rounded-lg p-3 border border-[#C2924C]/10"
              >
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#C2924C] tracking-wide">
                    {skill.slot === "Passive" ? "passive" : skill.slot === "Ultimate" ? "ultimate" : "active"}
                  </span>
                  <span className="text-sm font-semibold text-[#F0F0F0]">{skill.name}</span>
                </div>
                <p className="text-xs text-[#CCCCCC] leading-relaxed">{skill.description}</p>
              </div>
            ))}
            {skills.length === 0 && (
              <p className="text-xs text-[#808080]">No skill data available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
