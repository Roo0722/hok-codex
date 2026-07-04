# HoK Codex Worker

Cloudflare Worker backend for patch auto-detection. Runs on a 12-hour cron,
searches via Tavily, structures results with an AI call, and stores pending
patches in D1 for review before publishing.

## One-time setup (not yet done — required before this works)

1. Create the D1 database:
   ```
   wrangler d1 create hok-codex-db
   ```
   Copy the returned `database_id` into `wrangler.toml` (currently a placeholder).

2. Run the schema:
   ```
   npm run db:init:remote
   ```

3. Set secrets (never commit these):
   ```
   wrangler secret put TAVILY_API_KEY
   wrangler secret put AI_API_KEY
   ```
   `AI_API_URL` can stay as a var in `wrangler.toml` if using a fixed
   Groq/OpenRouter endpoint — currently not set, needs adding.

4. Deploy:
   ```
   npm run deploy
   ```

## Endpoints

- `GET /api/items` — all items
- `GET /api/skills` — all skills
- `GET /api/arcana` — all arcana
- `GET /api/patches` — all patches, newest first
- `POST /api/patches/check` — manually trigger a patch search (also runs on cron)
- `POST /api/patches/publish/:patchId` — apply a pending patch's changes and mark it published

## Status

Schema and logic in place. Not yet deployed — D1 database has not been created,
so `database_id` in wrangler.toml is still a placeholder, and no data has been
loaded into the tables yet.
