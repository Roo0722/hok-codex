"use client";

import type { Hero } from "@/data/heroes";
import { getHeroImagePath } from "@/data/heroes";
import type { RemoteRanking } from "@/lib/worker-api";

interface HeroCardProps {
  hero: Hero;
  changedRecently?: boolean;
  ranking?: RemoteRanking | null;
  onClick: (hero: Hero) => void;
}

const tierColors: Record<string, string> = {
  "S+": "text-[#E85D3A]",
  S: "text-[#E7C285]",
  A: "text-[#89B4E8]",
  B: "text-[#4ADE80]",
  C: "text-[#999999]",
};

export function HeroCard({ hero, changedRecently, ranking, onClick }: HeroCardProps) {
  const displayTier = ranking?.tier || hero.tier;
  const tierColor = tierColors[displayTier] || "text-[#999999]";

  return (
    <button
      onClick={() => onClick(hero)}
      className="hok-card rounded-lg p-3 text-left w-full relative flex items-center gap-3"
    >
      {changedRecently && (
        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-[#E85D3A]/20 text-[#F09880] border border-[#E85D3A]/30">
          Updated
        </span>
      )}
      <div className="w-12 h-12 rounded-full bg-[#2A2A2A] overflow-hidden shrink-0">
        <img
          src={getHeroImagePath(hero.slug)}
          alt={hero.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#F0F0F0] truncate">{hero.name}</h3>
          {displayTier && (
            <span className={`text-xs font-bold ${tierColor}`}>{displayTier}</span>
          )}
        </div>
        <p className="text-xs text-[#808080] truncate">
          {hero.classType}
          {hero.roles.length > 0 ? ` · ${hero.roles.join(", ")}` : ""}
        </p>
        {ranking?.win_rate && (
          <p className="text-[10px] text-[#666666] mt-0.5">
            Win rate {ranking.win_rate}
            {ranking.pick_rate ? ` · Pick ${ranking.pick_rate}` : ""}
          </p>
        )}
      </div>
    </button>
  );
}
