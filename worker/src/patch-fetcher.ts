export interface Env {
  DB: D1Database;
  TAVILY_API_KEY: string;
  AI_API_KEY: string;
  AI_API_URL: string;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

interface StructuredChange {
  entityType: "item" | "skill" | "arcana" | "hero";
  entityId: string;
  entityName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
}

interface StructuredPatch {
  patchVersion: string;
  releaseDate: string;
  rawSummary: string;
  structuredChanges: StructuredChange[];
}

export async function searchForLatestPatch(env: Env): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: env.TAVILY_API_KEY,
      query: "Honor of Kings Global latest patch notes update",
      search_depth: "advanced",
      max_results: 6,
      include_domains: [
        "world.honorofkings.com",
        "hokstats.gg",
        "reddit.com",
        "liquipedia.net",
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`);
  }

  const data = (await res.json()) as { results: TavilyResult[] };
  return data.results ?? [];
}

export async function structurePatchWithAI(
  env: Env,
  searchResults: TavilyResult[],
  knownEntityNames: string[]
): Promise<StructuredPatch | null> {
  const context = searchResults
    .map((r) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`)
    .join("\n\n---\n\n");

  const prompt = `You are extracting structured patch-note data for Honor of Kings Global from search results below.

Known entity names in our database (only match against these, do not invent new ones): ${knownEntityNames.slice(0, 200).join(", ")}

Search results:
${context}

Return ONLY valid JSON, no markdown, no preamble, matching exactly this shape:
{
  "patchVersion": "string, e.g. S38",
  "releaseDate": "YYYY-MM-DD",
  "rawSummary": "2-3 sentence summary",
  "structuredChanges": [
    {
      "entityType": "item" | "skill" | "arcana" | "hero",
      "entityId": "best-guess id or slug",
      "entityName": "exact name as it appears in known entity names, if matched",
      "fieldChanged": "e.g. cooldown, price, damage",
      "oldValue": "string",
      "newValue": "string"
    }
  ]
}

If no new patch is identifiable from these results, return: {"patchVersion": null}`;

  const res = await fetch(env.AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI structuring failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.patchVersion) return null;
    return parsed as StructuredPatch;
  } catch {
    return null;
  }
}

export async function validateStructuredPatch(
  env: Env,
  patch: StructuredPatch
): Promise<boolean> {
  if (!patch.patchVersion || !patch.releaseDate) return false;
  if (!Array.isArray(patch.structuredChanges)) return false;

  for (const change of patch.structuredChanges) {
    if (!change.entityType || !change.entityId || !change.fieldChanged) {
      return false;
    }
  }

  const existing = await env.DB.prepare(
    "SELECT patch_id FROM patches WHERE patch_version = ?"
  )
    .bind(patch.patchVersion)
    .first();

  return existing === null;
}
