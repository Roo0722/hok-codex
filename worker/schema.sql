CREATE TABLE IF NOT EXISTS items (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_cn TEXT,
  price INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  category TEXT NOT NULL,
  stats TEXT NOT NULL,
  passive TEXT,
  active TEXT,
  unique_effect TEXT,
  components TEXT NOT NULL DEFAULT '[]',
  builds_into TEXT NOT NULL DEFAULT '[]',
  patch_added TEXT,
  last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  skill_id TEXT PRIMARY KEY,
  hero_slug TEXT NOT NULL,
  hero_name TEXT NOT NULL,
  slot TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  damage_values TEXT,
  cooldown TEXT,
  mana_cost INTEGER,
  cast_range INTEGER,
  patch_added TEXT,
  last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS arcana (
  arcana_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_cn TEXT,
  color TEXT NOT NULL,
  tier INTEGER NOT NULL,
  unlock_level INTEGER NOT NULL,
  stats TEXT NOT NULL,
  bonus TEXT,
  patch_added TEXT,
  last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patches (
  patch_id TEXT PRIMARY KEY,
  patch_version TEXT NOT NULL,
  release_date TEXT NOT NULL,
  source_urls TEXT NOT NULL DEFAULT '[]',
  raw_summary TEXT,
  structured_changes TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  discovered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hero_rankings (
  hero_name TEXT PRIMARY KEY,
  tier TEXT,
  role TEXT,
  win_rate TEXT,
  pick_rate TEXT,
  ban_rate TEXT,
  confidence TEXT NOT NULL DEFAULT 'low',
  source_urls TEXT NOT NULL DEFAULT '[]',
  last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ranking_meta (
  id TEXT PRIMARY KEY,
  last_checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patches_status ON patches(status);
CREATE INDEX IF NOT EXISTS idx_patches_release_date ON patches(release_date);
