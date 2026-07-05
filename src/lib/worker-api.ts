export const WORKER_BASE_URL = "https://hok-codex-worker.jnjnbnd.workers.dev";

export async function checkForPatchUpdate(): Promise<{ status: string; patchVersion?: string }> {
  const res = await fetch(`${WORKER_BASE_URL}/api/patches/check`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Patch check failed: ${res.status}`);
  }
  return res.json();
}

export interface RemoteRanking {
  hero_name: string;
  tier: string;
  role: string;
  win_rate: string;
  pick_rate: string;
  ban_rate: string;
  confidence: string;
  last_updated: string;
}

export async function fetchLiveRankings(): Promise<RemoteRanking[]> {
  const res = await fetch(`${WORKER_BASE_URL}/api/rankings`);
  if (!res.ok) {
    throw new Error(`Fetch rankings failed: ${res.status}`);
  }
  return res.json();
}
export interface RemotePatch {
  patch_id: string;
  patch_version: string;
  release_date: string;
  source_urls: string;
  raw_summary: string;
  structured_changes: string;
  status: string;
  discovered_at: string;
}

export async function fetchLivePatches(): Promise<RemotePatch[]> {
  const res = await fetch(`${WORKER_BASE_URL}/api/patches`);
  if (!res.ok) {
    throw new Error(`Fetch patches failed: ${res.status}`);
  }
  return res.json();
}
