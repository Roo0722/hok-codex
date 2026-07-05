"use client";

import { useEffect, useState } from "react";
import type { Patch, PatchChange } from "@/data/patches";
import { checkForPatchUpdate, fetchLivePatches, type RemotePatch } from "@/lib/worker-api";
import { ChevronRight, Calendar, AlertCircle, RefreshCw, WifiOff } from "lucide-react";

interface PatchTabProps {
  publishedPatches: Patch[];
  pendingPatches: Patch[];
}

function remoteToPatch(r: RemotePatch): Patch {
  let structuredChanges: PatchChange[] = [];
  try {
    structuredChanges = JSON.parse(r.structured_changes || "[]");
  } catch {
    structuredChanges = [];
  }
  let sourceUrls: string[] = [];
  try {
    sourceUrls = JSON.parse(r.source_urls || "[]");
  } catch {
    sourceUrls = [];
  }
  return {
    patchId: r.patch_id,
    patchVersion: r.patch_version,
    releaseDate: r.release_date,
    sourceUrls,
    rawSummary: r.raw_summary,
    structuredChanges,
    status: r.status as "published" | "pending",
    discoveredAt: r.discovered_at,
  };
}

export function PatchTab({ publishedPatches, pendingPatches }: PatchTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [live, setLive] = useState<Patch[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLive = async () => {
    setLoading(true);
    try {
      const remote = await fetchLivePatches();
      setLive(remote.map(remoteToPatch));
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLive();
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const result = await checkForPatchUpdate();
      if (result.status === "new_patch_detected") {
        setCheckResult(`New patch found: ${result.patchVersion}.`);
      } else if (result.status === "no_new_patch" || result.status === "no_results") {
        setCheckResult("No new patch found — you're up to date.");
      } else if (result.status === "already_known_or_invalid") {
        setCheckResult("Latest patch already recorded.");
      } else {
        setCheckResult("Check complete.");
      }
      await loadLive();
    } catch {
      setCheckResult("Couldn't reach the update service. Check your connection.");
    } finally {
      setChecking(false);
    }
  };

  const effectivePatches = live ?? [...publishedPatches, ...pendingPatches];
  const shownPublished = effectivePatches
    .filter((p) => p.status === "published")
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
  const shownPending = effectivePatches.filter((p) => p.status === "pending");

  return (
    <div className="p-3 space-y-3">
      <button
        onClick={handleCheck}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 hok-card rounded-lg py-2.5 text-sm font-medium text-[#E7C285] disabled:opacity-50"
      >
        <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
        {checking ? "Checking for updates..." : "Check for updates"}
      </button>

      {checkResult && (
        <p className="text-xs text-[#999999] text-center">{checkResult}</p>
      )}

      {offline && !loading && (
        <div className="flex items-center gap-2 justify-center text-xs text-[#999999]">
          <WifiOff size={12} />
          Showing offline data — couldn&apos;t reach the live server.
        </div>
      )}

      {loading && (
        <p className="text-sm text-[#808080] text-center py-4">Loading latest patches...</p>
      )}

      {!loading && shownPending.length > 0 && (
        <div className="hok-card rounded-lg p-3 border border-[#E85D3A]/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-[#F09880]" />
            <span className="text-xs font-semibold text-[#F09880]">
              {shownPending.length} patch{shownPending.length > 1 ? "es" : ""} awaiting review
            </span>
          </div>
          <p className="text-[11px] text-[#999999]">
            A new patch was detected but hasn&apos;t been validated yet. Changes below don&apos;t include this.
          </p>
        </div>
      )}

      {!loading && shownPublished.length === 0 && shownPending.length === 0 && (
        <p className="text-sm text-[#808080] text-center py-8">
          No patches recorded yet.
        </p>
      )}

      {!loading &&
        shownPublished.map((patch) => {
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
                  {patch.structuredChanges.length === 0 ? (
                    <p className="text-xs text-[#808080] mt-3">No itemized changes listed for this update.</p>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {patch.structuredChanges.map((change, i) => (
                        <div key={i} className="text-xs">
                          <div className="flex items-baseline gap-1.5 mb-0.5">
                            <span className="text-[#F0F0F0] font-medium">{change.entityName}</span>
                            <span className="text-[#808080]">· {change.fieldChanged}</span>
                          </div>
                          <p className="font-mono text-[11px] leading-relaxed break-words">
                            {change.oldValue && (
                              <>
                                <span className="text-[#808080] line-through">{change.oldValue}</span>
                                {" → "}
                              </>
                            )}
                            <span className="text-[#4ADE80]">{change.newValue}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
