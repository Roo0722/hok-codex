import {
  Env,
  getKnownEntityNames,
  callStructuringAI,
  validateEntityName,
} from "./scraping-protocol";
import type { StructuredPatch } from "./patch-fetcher";

export function isAuthorized(request: Request, env: Env): boolean {
  const provided = request.headers.get("X-Admin-Password");
  return !!env.ADMIN_PASSWORD && provided === env.ADMIN_PASSWORD;
}

const MANUAL_SYSTEM_PROMPT = `You extract structured patch-note data for Honor of Kings Global from text supplied directly by a trusted admin (not a web search result).

Strict rules:
- Only reference hero, item, or arcana names that appear in the provided known-entity list. If a name doesn't match, omit that change rather than guessing.
- Do not invent values. If a detail isn't clearly stated in the text, leave the field as an empty string.
- Output ONLY valid JSON, no markdown formatting, no commentary.
- If you cannot identify a patch version or release date from the text, respond with {"patchVersion": null}.`;

export async function analyzeManualInput(
  env: Env,
  input: { url?: string; text?: string }
): Promise<{ preview: StructuredPatch | null; fetchedContent?: string; error?: string }> {
  let content = input.text || "";

  if (input.url) {
    try {
      const res = await fetch(input.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HoKCodexBot/1.0)" },
      });
      if (!res.ok) {
        return { preview: null, error: `Failed to fetch URL: HTTP ${res.status}` };
      }
      const fetchedText = await res.text();
      // Strip HTML tags for a rough text extraction; good enough for AI input.
      const stripped = fetchedText.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      content += `\n\n${stripped.slice(0, 15000)}`;
    } catch (e) {
      return { preview: null, error: `Fetch error: ${String(e)}` };
    }
  }

  if (!content.trim()) {
    return { preview: null, error: "No content provided (empty URL fetch and no text)." };
  }

  const known = await getKnownEntityNames(env);
  const userContent = `Known heroes: ${known.heroes.join(", ")}
Known items: ${known.items.join(", ")}
Known arcana: ${known.arcana.join(", ")}

Content to analyze:
${content}

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

  const parsed = await callStructuringAI(env, MANUAL_SYSTEM_PROMPT, userContent);
  if (!parsed || typeof parsed !== "object" || !("patchVersion" in parsed) || !parsed.patchVersion) {
    return { preview: null, error: "AI could not identify a patch from this content.", fetchedContent: content.slice(0, 2000) };
  }

  const result = parsed as StructuredPatch;
  const allKnown = [...known.heroes, ...known.items, ...known.arcana];
  result.structuredChanges = (result.structuredChanges || [])
    .map((change) => {
      const matched = validateEntityName(change.entityName, allKnown);
      if (!matched) return null;
      return { ...change, entityName: matched };
    })
    .filter((c): c is (typeof result.structuredChanges)[number] => c !== null);

  return { preview: result };
}

export async function confirmManualPatch(env: Env, patch: StructuredPatch): Promise<{ patchId: string }> {
  const patchId = `patch-manual-${patch.patchVersion}-${Date.now()}`;
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO patches (patch_id, patch_version, release_date, source_urls, raw_summary, structured_changes, status, discovered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      patchId,
      patch.patchVersion,
      patch.releaseDate,
      JSON.stringify([]),
      patch.rawSummary,
      JSON.stringify(patch.structuredChanges),
      "published",
      now
    )
    .run();

  return { patchId };
}
