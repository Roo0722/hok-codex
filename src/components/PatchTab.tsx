"use client";

import { useState } from "react";
import type { Patch } from "@/data/patches";
import { ChevronRight, Calendar, AlertCircle } from "lucide-react";

interface PatchTabProps {
  publishedPatches: Patch[];
  pendingPatches: Patch[];
}

export function PatchTab({ publishedPatches, pendingPatches }: PatchTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-3 space-y-3">
      {pendingPatches.length > 0 && (
        <div className="hok-card rounded-lg p-3 border border-[#E85D3A]/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-[#F09880]" />
            <span className="text-xs font-semibold text-[#F09880]">
              {pendingPatches.length} patch{pendingPatches.length > 1 ? "es" : ""} awaiting review
            </span>
          </div>
          <p className="text-[11px] text-[#999999]">
            A new patch was detected but hasn&apos;t been validated yet. Changes below don&apos;t include this.
          </p>
        </div>
      )}

      {publishedPatches.length === 0 && pendingPatches.length === 0 && (
        <p className="text-sm text-[#808080] text-center py-8">
          No patches recorded yet.
        </p>
      )}

      {publishedPatches.map((patch) => {
        const isExpanded = expandedId === patch.patchId;
        const formattedDate = new Date(patch.releaseDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <div key={patch.patchId} className="hok-card rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : patch.patchId)}
              className="w-full text-left p-4 flex items-start gap-3"
            >
              <span className="text-base font-bold text-[#C2924C] shrink-0">
                {patch.patchVersion}
              </span>
              <div className="flex-1 min-w-0">
                <span className="flex items-center gap-1 text-[10px] text-[#808080] mb-1">
                  <Calendar size={10} />
                  {formattedDate}
                </span>
                <p className="text-xs text-[#999999] line-clamp-2">{patch.rawSummary}</p>
              </div>
              <ChevronRight
                size={16}
                className={`shrink-0 text-[#808080] mt-1 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-[#C2924C]/10">
                <div className="space-y-2 mt-3">
                  {patch.structuredChanges.map((change, i) => (
                    <div key={i} className="flex items-start justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <span className="text-[#F0F0F0] font-medium">{change.entityName}</span>
                        <span className="text-[#808080]"> · {change.fieldChanged}</span>
                      </div>
                      <div className="shrink-0 font-mono text-right">
                        <span className="text-[#808080] line-through">{change.oldValue}</span>
                        {" → "}
                        <span className="text-[#4ADE80]">{change.newValue}</span>
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
