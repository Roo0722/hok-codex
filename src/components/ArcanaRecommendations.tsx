"use client";

import { useState } from "react";
import { arcanaLoadoutsByRole, type ArcanaRecommendation } from "@/data/arcana-recommendations";
import { ChevronRight } from "lucide-react";

const colorDot: Record<ArcanaRecommendation["color"], string> = {
  Red: "bg-[#E85D3A]",
  Green: "bg-[#22C55E]",
  Blue: "bg-[#5B8BD4]",
};

export function ArcanaRecommendations() {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  return (
    <div className="px-3 pb-3 space-y-2">
      <p className="text-xs font-semibold text-[#C2924C] px-1">Recommended loadouts by role</p>
      {arcanaLoadoutsByRole.map((loadout) => {
        const isExpanded = expandedRole === loadout.role;
        return (
          <div key={loadout.role} className="hok-card rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRole(isExpanded ? null : loadout.role)}
              className="w-full text-left p-3 flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-[#E7C285]">{loadout.role}</span>
              <ChevronRight
                size={16}
                className={`text-[#808080] transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-[#C2924C]/10 pt-2">
                <p className="text-xs text-[#999999] mb-3">{loadout.description}</p>
                <div className="space-y-2">
                  {loadout.recommendations.map((rec) => (
                    <div key={rec.color} className="flex items-start gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${colorDot[rec.color]}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F0F0F0]">{rec.names.join(", ")}</p>
                        <p className="text-[11px] text-[#808080]">{rec.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
