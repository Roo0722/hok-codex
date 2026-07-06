DELETE FROM patches
WHERE patch_id LIKE 'patch-manual-S15-%'
AND release_date = '2026-07-02'
AND patch_id NOT IN (
  SELECT patch_id FROM patches
  WHERE patch_id LIKE 'patch-manual-S15-%' AND release_date = '2026-07-02'
  ORDER BY discovered_at DESC
  LIMIT 1
);
