-- Commission types may now point to a portfolio gallery. Backfill editable
-- JSON while leaving immutable publication snapshots readable as authored.
UPDATE sites s SET settings = jsonb_set(settings, '{commissions,types}', (
  SELECT jsonb_agg('{"galleryId":null}'::jsonb || item ORDER BY ord)
  FROM jsonb_array_elements(s.settings #> '{commissions,types}') WITH ORDINALITY AS t(item,ord)
))
WHERE jsonb_path_exists(settings, '$.commissions.types[*] ? (!exists(@.galleryId))');
