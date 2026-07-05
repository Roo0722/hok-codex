/**
 * Shared scraping protocol for hok-codex.
 *
 * Used by both the patch-detection and hero-ranking pipelines. The goal is
 * accuracy over recall: it is better to find nothing than to write a
 * hallucinated or misattributed change into the database.
 *
 * Core principles:
 * 1. Multi-query search — never rely on a single search phrasing.
 * 2. Cross-source corroboration — a claim is only trusted if it appears
 *    (or is consistent) across more than one independent source.
 * 3. Known-entity validation — the AI is only allowed to reference entities
 *    that already exist in our database. It cannot invent new item/hero
 *    names; anything unmatched is dropped rather than guessed.
 * 4. Confidence scoring — every extracted fact gets a confidence score.
 *    Low-confidence results are always marked "pending" for human review,
 *    never auto-published, regardless of any other setting.
 */

export interface Env {
  DB: D1Database;
  TAVILY_API_KEY: string;
  AI_API_KEY: string;
  AI_API_URL: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

export interface SourceBundle {
  query: string;
  results: SearchResult[];
}

/**
 * Run several differently-worded searches and tag each result with the
 * query that found it. Multiple queries reduce the chance that a single
 * bad search phrasing produces a misleading result set.
 */
export async function multiQuerySearch(
  env: Env,
  queries: string[],
  options: { includeDomains?: string[]; maxResultsPerQuery?: number } = {}
): Promise<SourceBundle[]> {
  const bundles: SourceBundle[] = [];

  for (const query of queries) {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: options.maxResultsPerQuery ?? 5,
        include_domains: options.includeDomains,
      }),
    });

    if (!res.ok) {
      // A single failed query should not kill the whole run.
      continue;
    }

    const data = (await res.json()) as { results: SearchResult[] };
    bundles.push({ query, results: data.results ?? [] });
  }

  return bundles;
}

/** Count how many distinct source domains mention a given entity name. */
export function countCorroboratingSources(bundles: SourceBundle[], entityName: string): number {
  const domains = new Set<string>();
  const needle = entityName.toLowerCase();

  for (const bundle of bundles) {
    for (const result of bundle.results) {
      if (result.content.toLowerCase().includes(needle) || result.title.toLowerCase().includes(needle)) {
        try {
          domains.add(new URL(result.url).hostname);
        } catch {
          domains.add(result.url);
        }
      }
    }
  }

  return domains.size;
}

/**
 * Fetch the known entity names from D1 so the AI can be constrained to
 * only reference things that actually exist in our database.
 */
export async function getKnownEntityNames(env: Env): Promise<{
  heroes: string[];
  items: string[];
  arcana: string[];
}> {
  const [heroRows, itemRows, arcanaRows] = await Promise.all([
    env.DB.prepare("SELECT DISTINCT hero_name FROM skills").all(),
    env.DB.prepare("SELECT name FROM items").all(),
    env.DB.prepare("SELECT name FROM arcana").all(),
  ]);

  return {
    heroes: heroRows.results.map((r) => String(r.hero_name)),
    items: itemRows.results.map((r) => String(r.name)),
    arcana: arcanaRows.results.map((r) => String(r.name)),
  };
}

/**
 * Call the AI with a strict extraction prompt. The caller supplies the
 * task-specific instructions and JSON shape; this function just handles
 * the actual request/response/cleanup so both pipelines behave identically.
 */
export async function callStructuringAI(
  env: Env,
  systemInstructions: string,
  userContent: string
): Promise<unknown | null> {
  const res = await fetch(env.AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: userContent },
      ],
      temperature: 0,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI structuring failed: ${res.status}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Filter a set of extracted entity names down to only those that fuzzy-match
 * something in the known list. Anything that doesn't match closely enough
 * is dropped rather than guessed at — accuracy over completeness.
 */
export function validateEntityName(candidate: string, knownNames: string[]): string | null {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = normalize(candidate);

  // Exact match first.
  const exact = knownNames.find((n) => normalize(n) === target);
  if (exact) return exact;

  // Substring match as a fallback (handles minor AI phrasing differences).
  const partial = knownNames.find(
    (n) => normalize(n).includes(target) || target.includes(normalize(n))
  );
  return partial ?? null;
}

export const MIN_CORROBORATING_SOURCES_FOR_HIGH_CONFIDENCE = 2;
