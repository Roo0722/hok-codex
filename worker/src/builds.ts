import { Env } from "./scraping-protocol";

export interface BuildItemSlot {
  id: string;
  name: string;
}

export interface HeroBuild {
  buildId: string;
  heroName: string;
  buildName: string;
  badge: string | null;
  description: string | null;
  items: (BuildItemSlot | null)[]; // fixed length 12, null = empty slot
  position: number;
  source: string | null;
  lastUpdated: string;
}

const SLOT_COUNT = 12;

function normalizeItems(items: (BuildItemSlot | null)[] | undefined): (BuildItemSlot | null)[] {
  const arr = Array.isArray(items) ? items.slice(0, SLOT_COUNT) : [];
  while (arr.length < SLOT_COUNT) arr.push(null);
  return arr;
}

export async function listBuilds(env: Env, heroName?: string): Promise<HeroBuild[]> {
  const query = heroName
    ? env.DB.prepare("SELECT * FROM hero_builds WHERE hero_name = ? ORDER BY position ASC").bind(heroName)
    : env.DB.prepare("SELECT * FROM hero_builds ORDER BY hero_name ASC, position ASC");

  const results = await query.all();
  return results.results.map((r) => ({
    buildId: String(r.build_id),
    heroName: String(r.hero_name),
    buildName: String(r.build_name),
    badge: r.badge ? String(r.badge) : null,
    description: r.description ? String(r.description) : null,
    items: normalizeItems(JSON.parse(String(r.items || "[]"))),
    position: Number(r.position),
    source: r.source ? String(r.source) : null,
    lastUpdated: String(r.last_updated),
  }));
}

export async function saveBuild(
  env: Env,
  build: {
    buildId?: string;
    heroName: string;
    buildName: string;
    badge?: string;
    description?: string;
    items: (BuildItemSlot | null)[];
    position?: number;
  }
): Promise<{ buildId: string }> {
  const buildId = build.buildId || `build-manual-${build.heroName}-${Date.now()}`;
  const now = new Date().toISOString();
  const items = normalizeItems(build.items);

  await env.DB.prepare(
    `INSERT INTO hero_builds (build_id, hero_name, build_name, badge, description, items, position, source, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(build_id) DO UPDATE SET
       hero_name = excluded.hero_name,
       build_name = excluded.build_name,
       badge = excluded.badge,
       description = excluded.description,
       items = excluded.items,
       position = excluded.position,
       last_updated = excluded.last_updated`
  )
    .bind(
      buildId,
      build.heroName,
      build.buildName,
      build.badge || null,
      build.description || null,
      JSON.stringify(items),
      build.position ?? 0,
      "manual",
      now
    )
    .run();

  return { buildId };
}

export async function deleteBuild(env: Env, buildId: string): Promise<{ deleted: boolean }> {
  await env.DB.prepare("DELETE FROM hero_builds WHERE build_id = ?").bind(buildId).run();
  return { deleted: true };
}
