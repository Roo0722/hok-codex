import {
  Env,
  multiQuerySearch,
  getKnownEntityNames,
  callStructuringAI,
  validateEntityName,
  countCorroboratingSources,
  MIN_CORROBORATING_SOURCES_FOR_HIGH_CONFIDENCE,
  type SourceBundle,
} from "./scraping-protocol";

interface StructuredChange {
  entityType: "item" | "skill" | "arcana" | "hero";
  entityId: string;
  entityName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  confidence?: "high" | "low";
}

export interface StructuredPatch {
  patchVersion: string;
  releaseDate: string;
  rawSummary: string;
  structuredChanges: StructuredChange[];
}

const SEARCH_QUERIES = [
  "Honor of Kings Global latest patch notes",
  "Honor of Kings Global balance update hero changes",
  "Honor of Kings Global server maintenance update announcement",
];

const SYSTEM_PROMPT = `You extract structured patch-note data for Honor of Kings Global from search results.

Strict rules:
- Only reference hero, item, or arcana names that appear in the provided known-entity list. If you cannot match a name to that list, omit the change entirely rather than guessing.
- Do not invent patch versions, dates, or values. If a detail is not clearly stated in the source text, leave the field as an empty string.
- If the search results do not describe an identifiable new patch, respond with {"patchVersion": null}.
- Output ONLY valid JSON, no markdown formatting, no commentary.`;

export async function searchForLatestPatch(env: Env): Promise<SourceBundle[]> {
  return multiQuerySearch(env, SEARCH_QUERIES, {
    includeDomains: ["world.honorofkings.com", "hokstats.gg", "reddit.com", "liquipedia.net"],
    maxResultsPerQuery: 5,
  });
}

export async function structurePatchWithAI(
  env: Env,
  bundles: SourceBundle[]
): Promise<StructuredPatch | null> {
  const known = await getKnownEntityNames(env);
  const context = bundles
    .flatMap((b) => b.results.map((r) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`))
    .join("\n\n---\n\n");

  const userContent = `Known heroes: ${known.heroes.slice(0, 200).join(", ")}
Known items: ${known.items.slice(0, 200).join(", ")}
Known arcana: ${known.arcana.join(", ")}

Search results:
${context}

Return JSON matching exactly:
{
  "patchVersion": "string, e.g. S38",
  "releaseDate": "YYYY-MM-DD",
  "rawSummary": "2-3 sentence summary",
  "structuredChanges": [
    {
      "entityType": "item" | "skill" | "arcana" | "hero",
      "entityId": "best-guess id or slug",
      "entityName": "must exactly match a name from the known lists above",
      "fieldChanged": "e.g. cooldown, price, damage",
      "oldValue": "string, empty if unknown",
      "newValue": "string"
    }
  ]
}`;

  const parsed = await callStructuringAI(env, SYSTEM_PROMPT, userContent);
  if (!parsed || typeof parsed !== "object" || !("patchVersion" in parsed) || !parsed.patchVersion) {
    return null;
  }

  const result = parsed as StructuredPatch;

  // Validate every entity name against the known lists; drop unmatched ones
  // and attach a corroboration-based confidence score.
  const allKnown = [...known.heroes, ...known.items, ...known.arcana];
  result.structuredChanges = result.structuredChanges
    .map((change) => {
      const matched = validateEntityName(change.entityName, allKnown);
      if (!matched) return null;
      const sourceCount = countCorroboratingSources(bundles, matched);
      return {
        ...change,
        entityName: matched,
        confidence: sourceCount >= MIN_CORROBORATING_SOURCES_FOR_HIGH_CONFIDENCE ? "high" : "low",
      } as StructuredChange;
    })
    .filter((c): c is StructuredChange => c !== null);

  return result;
}

export async function validateStructuredPatch(env: Env, patch: StructuredPatch): Promise<boolean> {
  if (!patch.patchVersion || !patch.releaseDate) return false;

  const existing = await env.DB.prepare("SELECT patch_id FROM patches WHERE patch_version = ?")
    .bind(patch.patchVersion)
    .first();

  return existing === null;
}
