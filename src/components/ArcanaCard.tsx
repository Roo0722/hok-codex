"use client";

import type { Arcana, ArcanaColor } from "@/data/arcana";
import { getArcanaImagePath } from "@/data/arcana";

interface ArcanaCardProps {
  arcana: Arcana;
  changedRecently?: boolean;
}

const colorConfig: Record<ArcanaColor, { text: string; border: string; bg: string }> = {
  Red: { text: "text-[#F09880]", border: "border-[#E85D3A]/30", bg: "bg-[#E85D3A]/10" },
  Purple: { text: "text-[#C084FC]", border: "border-[#A855F7]/30", bg: "bg-[#A855F7]/10" },
  Blue: { text: "text-[#89B4E8]", border: "border-[#5B8BD4]/30", bg: "bg-[#5B8BD4]/10" },
  Green: { text: "text-[#4ADE80]", border: "border-[#22C55E]/30", bg: "bg-[#22C55E]/10" },
};

export function ArcanaCard({ arcana, changedRecently }: ArcanaCardProps) {
  const config = colorConfig[arcana.color];

  return (
    <div className={`hok-card rounded-lg p-3 relative ${config.border} border`}>
      {changedRecently && (
        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-[#E85D3A]/20 text-[#F09880] border border-[#E85D3A]/30">
          Updated
        </span>
      )}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded bg-[#2A2A2A] overflow-hidden shrink-0">
          <img
            src={getArcanaImagePath(arcana.arcanaId)}
            alt={arcana.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#F0F0F0] truncate">{arcana.name}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}>
            {arcana.color} · Tier {arcana.tier}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {Object.entries(arcana.stats).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-[#808080] capitalize">{key}</span>
            <span className={`${config.text} font-mono`}>+{value}</span>
          </div>
        ))}
      </div>

      {arcana.bonus && (
        <p className="mt-2 pt-2 border-t border-[#C2924C]/10 text-[11px] text-[#999999] italic">
          {arcana.bonus}
        </p>
      )}
    </div>
  );
}
