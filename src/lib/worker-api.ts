export const WORKER_BASE_URL = "https://hok-codex-worker.jnjnbnd.workers.dev";

export async function checkForPatchUpdate(): Promise<{ status: string; patchVersion?: string }> {
  const res = await fetch(`${WORKER_BASE_URL}/api/patches/check`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Patch check failed: ${res.status}`);
  }
  return res.json();
}
