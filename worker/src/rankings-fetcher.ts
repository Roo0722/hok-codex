import {
  Env,
  multiQuerySearch,
  getKnownEntityNames,
  callStructuringAI,
  validateEntityName,
  countCorroboratingSources,
  MIN_CORROBORATING_SOURCES_FOR_HIGH_CONFIDENCE,
} from "./scraping-protocol";

interface RankingEntry {
  heroName: string;
  tier: string;
  role: string;
  winRate: string;
  pickRate: string;
  banRate: string;
  confidence?: "high" | "low";
}

const SEARCH_QUERIES = [
  "Honor of Kings Global hero tier list current season",
  "Honor of Kings Global best heroes win rate ranking",
  "Honor of Kings hero hot list current patch",
];

const SYSTEM_PROMPT = `You extract hero tier-list / ranking data for Honor of Kings Global from search results.

Strict rules:
- Only reference hero names that appear in the provided known-hero list. If a name doesn't match, omit that entry rather than guessing.
- Do not invent win rates, pick rates, or tiers. If a stat isn't clearly stated, leave it as an empty string.
- Output ONLY valid JSON, no markdown formatting, no commentary.
- If the search results contain no usable ranking data, respond with {"rankings": []}.`;

const RANKING_REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export async function shouldRefreshRankings(env: Env): Promise<boolean> {
  const row = await env.DB.prepare("SELECT last_checked_at FROM ranking_meta WHERE id = 'singleton'").first();
  if (!row) return true;
  const lastChecked = new Date(String(row.last_checked_at)).getTime();
  return Date.now() - lastChecked > RANKING_REFRESH_INTERVAL_MS;
}

async function markRankingsChecked(env: Env): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO ranking_meta (id, last_checked_at) VALUES ('singleton', ?)
     ON CONFLICT(id) DO UPDATE SET last_checked_at = excluded.last_checked_at`
  )
    .bind(now)
    .run();
}

export async function runRankingsCheck(env: Env, force = false): Promise<{ status: string; count?: number }> {
  if (!force && !(await shouldRefreshRankings(env))) {
    return { status: "not_due" };
  }

  const bundles = await multiQuerySearch(env, SEARCH_QUERIES, {
    includeDomains: ["hokstats.gg", "liquipedia.net", "reddit.com"],
    maxResultsPerQuery: 5,
  });

  const totalResults = bundles.reduce((sum, b) => sum + b.results.length, 0);
  if (totalResults === 0) {
    await markRankingsChecked(env);
    return { status: "no_results" };
  }

  const known = await getKnownEntityNames(env);
  const context = bundles
    .flatMap((b) => b.results.map((r) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`))
    .join("\n\n---\n\n");

  const userContent = `Known heroes: ${known.heroes.join(", ")}

Search results:
${context}

Return JSON matching exactly:
{
  "rankings": [
    {
      "heroName": "must exactly match a name from the known heroes list",
      "tier": "e.g. S+, S, A, B, C",
      "role": "e.g. Mid, Jungle, Roam",
      "winRate": "e.g. 52.3% or empty string",
      "pickRate": "e.g. 18.1% or empty string",
      "banRate": "e.g. 5.2% or empty string"
    }
  ]
}`;

  const parsed = await callStructuringAI(env, SYSTEM_PROMPT, userContent);
  await markRankingsChecked(env);

  if (!parsed || typeof parsed !== "object" || !("rankings" in parsed)) {
    return { status: "no_usable_data" };
  }

  const rankings = (parsed as { rankings: RankingEntry[] }).rankings;
  if (!Array.isArray(rankings) || rankings.length === 0) {
    return { status: "no_usable_data" };
  }

  const sourceUrls = JSON.stringify(bundles.flatMap((b) => b.results.map((r) => r.url)));
  const now = new Date().toISOString();
  let written = 0;

  for (const entry of rankings) {
    const matched = validateEntityName(entry.heroName, known.heroes);
    if (!matched) continue;

    const sourceCount = countCorroboratingSources(bundles, matched);
    const confidence = sourceCount >= MIN_CORROBORATING_SOURCES_FOR_HIGH_CONFIDENCE ? "high" : "low";

    await env.DB.prepare(
      `INSERT OR REPLACE INTO hero_rankings (hero_name, tier, role, win_rate, pick_rate, ban_rate, confidence, source_urls, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(matched, entry.tier || "", entry.role || "", entry.winRate || "", entry.pickRate || "", entry.banRate || "", confidence, sourceUrls, now)
      .run();
    written++;
  }

  return { status: "updated", count: written };
}
