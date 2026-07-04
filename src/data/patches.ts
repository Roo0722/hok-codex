export type PatchEntityType = "item" | "skill" | "arcana" | "hero";
export type PatchStatus = "published" | "pending";

export interface PatchChange {
  entityType: PatchEntityType;
  entityId: string;
  entityName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
}

export interface Patch {
  patchId: string;
  patchVersion: string;
  releaseDate: string;
  sourceUrls: string[];
  rawSummary: string;
  structuredChanges: PatchChange[];
  status: PatchStatus;
  discoveredAt: string;
}

import patchesDataRaw from "./patches-data.json";

export const patches: Patch[] = patchesDataRaw as unknown as Patch[];

export function getPublishedPatches(): Patch[] {
  return patches
    .filter((p) => p.status === "published")
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
}

export function getPendingPatches(): Patch[] {
  return patches.filter((p) => p.status === "pending");
}

export function getChangesForEntity(entityId: string): PatchChange[] {
  return patches.flatMap((p) =>
    p.structuredChanges.filter((c) => c.entityId === entityId)
  );
}
