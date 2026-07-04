/**
 * HoK Image Downloader
 *
 * Downloads hero splash/square images, item icons, and arcana icons.
 * Adapted from Roo0722/hokdatabase's working download-images.ts —
 * same fallback-chain logic, repo-relative paths instead of hardcoded ones.
 *
 * Saves to public/hok-images/{heroes,items,arcana}/
 *
 * Requires scrape-data/{heroes,items,arcana}.json and scrape-data/hero-{slug}.json
 * to exist first (produced by the data scrape step, not by this script).
 *
 * Usage:
 *   npx tsx scripts/download-images.ts              # download all
 *   npx tsx scripts/download-images.ts heroes        # only hero images
 *   npx tsx scripts/download-images.ts items         # only item icons
 *   npx tsx scripts/download-images.ts arcana        # only arcana icons
 */

import { mkdir, writeFile, readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "scrape-data");
const IMG_DIR = path.join(ROOT, "public", "hok-images");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function downloadWithRetry(
  url: string,
  outPath: string,
  retries = 3,
  delayMs = 1000
): Promise<boolean> {
  if (existsSync(outPath)) {
    const st = await stat(outPath);
    if (st.size > 0) return true;
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.status === 429) {
        console.warn(`  429 for ${url}, attempt ${attempt}/${retries}`);
        await sleep(delayMs * attempt * 2);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) throw new Error("Empty response");
      await writeFile(outPath, buf);
      return true;
    } catch (e: any) {
      if (attempt === retries) {
        console.error(`  Failed ${url}: ${e.message}`);
        return false;
      }
      await sleep(delayMs * attempt);
    }
  }
  return false;
}

async function downloadHeroImage(slug: string, hero: any) {
  const outDir = path.join(IMG_DIR, "heroes");
  await mkdir(outDir, { recursive: true });

  const splashPath = path.join(outDir, `${slug}-splash.jpg`);
  const squarePath = path.join(outDir, `${slug}.jpg`);

  let splashOk = false;
  let squareOk = false;

  splashOk = await downloadWithRetry(
    `https://hokstats.gg${hero.splashImage || `/heroes-splash/${slug}.jpg`}`,
    splashPath
  );

  if (hero.squareImage) {
    squareOk = await downloadWithRetry(hero.squareImage, squarePath);
    if (!squareOk && hero.fallbackImage) {
      squareOk = await downloadWithRetry(hero.fallbackImage, squarePath);
    }
  } else if (hero.fallbackImage) {
    squareOk = await downloadWithRetry(hero.fallbackImage, squarePath);
  }

  return { splashOk, squareOk };
}

async function downloadHeroImages() {
  console.log("=== Downloading hero images ===");
  const heroesPath = path.join(DATA_DIR, "heroes.json");
  if (!existsSync(heroesPath)) {
    console.warn(`  Skipped: ${heroesPath} not found yet.`);
    return;
  }
  const heroes = JSON.parse(await readFile(heroesPath, "utf8"));
  let done = 0;
  let splashCount = 0;
  let squareCount = 0;

  const batchSize = 4;
  for (let i = 0; i < heroes.length; i += batchSize) {
    const batch = heroes.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (h: any) => {
        try {
          const detailPath = path.join(DATA_DIR, `hero-${h.slug}.json`);
          const detail = JSON.parse(await readFile(detailPath, "utf8"));
          return await downloadHeroImage(h.slug, detail);
        } catch (e: any) {
          console.error(`  Error for ${h.slug}: ${e.message}`);
          return { splashOk: false, squareOk: false };
        }
      })
    );
    for (const r of results) {
      done++;
      if (r.status === "fulfilled") {
        if (r.value.splashOk) splashCount++;
        if (r.value.squareOk) squareCount++;
      }
    }
    if (done % 16 < batchSize || done === heroes.length) {
      console.log(`  [${done}/${heroes.length}] splash: ${splashCount}, square: ${squareCount}`);
    }
    await sleep(150);
  }
  console.log(`Done: ${splashCount} splash, ${squareCount} square images`);
}

async function downloadItemImages() {
  console.log("=== Downloading item images ===");
  const itemsPath = path.join(DATA_DIR, "items.json");
  if (!existsSync(itemsPath)) {
    console.warn(`  Skipped: ${itemsPath} not found yet.`);
    return;
  }
  const items = JSON.parse(await readFile(itemsPath, "utf8"));
  await mkdir(path.join(IMG_DIR, "items"), { recursive: true });

  let done = 0;
  let ok = 0;
  const batchSize = 8;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (it: any) => {
        try {
          const outPath = path.join(IMG_DIR, "items", `${it.id}.png`);
          return await downloadWithRetry(`https://hokstats.gg/items/${it.id}.png`, outPath);
        } catch {
          return false;
        }
      })
    );
    for (const r of results) {
      done++;
      if (r.status === "fulfilled" && r.value) ok++;
    }
    if (done % 24 < batchSize || done === items.length) console.log(`  [${done}/${items.length}] ok: ${ok}`);
    await sleep(100);
  }
  console.log(`Done: ${ok}/${items.length} item images`);
}

async function downloadArcanaImages() {
  console.log("=== Downloading arcana images ===");
  const arcanaPath = path.join(DATA_DIR, "arcana.json");
  if (!existsSync(arcanaPath)) {
    console.warn(`  Skipped: ${arcanaPath} not found yet.`);
    return;
  }
  const arcana = JSON.parse(await readFile(arcanaPath, "utf8"));
  await mkdir(path.join(IMG_DIR, "arcana"), { recursive: true });

  let done = 0;
  let ok = 0;
  const batchSize = 8;
  for (let i = 0; i < arcana.length; i += batchSize) {
    const batch = arcana.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (a: any) => {
        try {
          const outPath = path.join(IMG_DIR, "arcana", `${a.arcanaId}.png`);
          return await downloadWithRetry(`https://hokstats.gg${a.image}`, outPath);
        } catch {
          return false;
        }
      })
    );
    for (const r of results) {
      done++;
      if (r.status === "fulfilled" && r.value) ok++;
    }
  }
  console.log(`Done: ${ok}/${arcana.length} arcana images`);
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  const arg = process.argv[2] || "all";

  if (arg === "all" || arg === "heroes") await downloadHeroImages();
  if (arg === "all" || arg === "items") await downloadItemImages();
  if (arg === "all" || arg === "arcana") await downloadArcanaImages();

  console.log("=== Image download complete ===");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
