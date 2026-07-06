import {
  Env,
  searchForLatestPatch,
  structurePatchWithAI,
  validateStructuredPatch,
} from "./patch-fetcher";
import { runRankingsCheck } from "./rankings-fetcher";
import { isAuthorized, analyzeManualInput, confirmManualPatch } from "./admin";
import { ADMIN_PAGE_HTML } from "./admin-page";

async function runPatchCheck(env: Env): Promise<{ status: string; patchVersion?: string }> {
  const searchBundles = await searchForLatestPatch(env);
  const totalResults = searchBundles.reduce((sum, b) => sum + b.results.length, 0);
  if (totalResults === 0) {
    return { status: "no_results" };
  }

  const structured = await structurePatchWithAI(env, searchBundles);
  if (!structured) {
    return { status: "no_new_patch" };
  }

  const isValid = await validateStructuredPatch(env, structured);
  if (!isValid) {
    return { status: "already_known_or_invalid", patchVersion: structured.patchVersion };
  }

  const patchId = `patch-${structured.patchVersion}-${Date.now()}`;
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO patches (patch_id, patch_version, release_date, source_urls, raw_summary, structured_changes, status, discovered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      patchId,
      structured.patchVersion,
      structured.releaseDate,
      JSON.stringify(searchBundles.flatMap((b) => b.results.map((r) => r.url))),
      structured.rawSummary,
      JSON.stringify(structured.structuredChanges),
      "pending",
      now
    )
    .run();

  return { status: "new_patch_detected", patchVersion: structured.patchVersion };
}

async function publishPatch(env: Env, patchId: string): Promise<boolean> {
  const patch = await env.DB.prepare("SELECT * FROM patches WHERE patch_id = ?")
    .bind(patchId)
    .first();

  if (!patch) return false;

  const changes = JSON.parse(String(patch.structured_changes ?? "[]"));
  const now = new Date().toISOString();

  for (const change of changes) {
    if (change.entityType === "item") {
      await env.DB.prepare(
        `UPDATE items SET last_updated = ? WHERE item_id = ? OR name = ?`
      )
        .bind(now, change.entityId, change.entityName)
        .run();
    } else if (change.entityType === "skill") {
      await env.DB.prepare(
        `UPDATE skills SET last_updated = ? WHERE skill_id = ? OR name = ?`
      )
        .bind(now, change.entityId, change.entityName)
        .run();
    } else if (change.entityType === "arcana") {
      await env.DB.prepare(
        `UPDATE arcana SET last_updated = ? WHERE arcana_id = ? OR name = ?`
      )
        .bind(now, change.entityId, change.entityName)
        .run();
    }
  }

  await env.DB.prepare("UPDATE patches SET status = 'published' WHERE patch_id = ?")
    .bind(patchId)
    .run();

  return true;
}

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/admin") {
      return new Response(ADMIN_PAGE_HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }

    if (url.pathname === "/api/admin/analyze" && request.method === "POST") {
      if (!isAuthorized(request, env)) {
        return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
      }
      const body = (await request.json().catch(() => ({}))) as { url?: string; text?: string };
      const result = await analyzeManualInput(env, body);
      return withCors(Response.json(result));
    }

    if (url.pathname === "/api/admin/confirm" && request.method === "POST") {
      if (!isAuthorized(request, env)) {
        return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
      }
      const body = await request.json().catch(() => null);
      if (!body) {
        return withCors(Response.json({ error: "Invalid patch payload" }, { status: 400 }));
      }
      const result = await confirmManualPatch(env, body as Parameters<typeof confirmManualPatch>[1]);
      return withCors(Response.json(result));
    }

    if (url.pathname === "/api/patches" && request.method === "GET") {
      const results = await env.DB.prepare(
        "SELECT * FROM patches ORDER BY release_date DESC"
      ).all();
      return withCors(Response.json(results.results));
    }

    if (url.pathname === "/api/items" && request.method === "GET") {
      const results = await env.DB.prepare("SELECT * FROM items").all();
      return withCors(Response.json(results.results));
    }

    if (url.pathname === "/api/skills" && request.method === "GET") {
      const results = await env.DB.prepare("SELECT * FROM skills").all();
      return withCors(Response.json(results.results));
    }

    if (url.pathname === "/api/arcana" && request.method === "GET") {
      const results = await env.DB.prepare("SELECT * FROM arcana").all();
      return withCors(Response.json(results.results));
    }

    if (url.pathname === "/api/rankings" && request.method === "GET") {
      const results = await env.DB.prepare("SELECT * FROM hero_rankings ORDER BY tier ASC").all();
      return withCors(Response.json(results.results));
    }

    if (url.pathname === "/api/rankings/check" && request.method === "POST") {
      const force = url.searchParams.get("force") === "true";
      try {
        const result = await runRankingsCheck(env, force);
        return withCors(Response.json(result));
      } catch (e) {
        return withCors(Response.json({ error: String(e), stack: e instanceof Error ? e.stack : undefined }, { status: 500 }));
      }
    }

    if (url.pathname === "/api/patches/check" && request.method === "POST") {
      const result = await runPatchCheck(env);
      return withCors(Response.json(result));
    }

    if (url.pathname.startsWith("/api/patches/publish/") && request.method === "POST") {
      const patchId = url.pathname.split("/").pop() ?? "";
      const ok = await publishPatch(env, patchId);
      return withCors(Response.json({ published: ok }));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const result = await runPatchCheck(env);
    if (result.status === "new_patch_detected") {
      console.log(`New patch detected: ${result.patchVersion}, pending review`);
    }

    const rankingResult = await runRankingsCheck(env);
    if (rankingResult.status === "updated") {
      console.log(`Rankings updated: ${rankingResult.count} heroes`);
    }
  },
};
