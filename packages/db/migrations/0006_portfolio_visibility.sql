ALTER TABLE sites
  ADD COLUMN discoverable boolean NOT NULL DEFAULT false,
  ADD COLUMN indexable boolean NOT NULL DEFAULT true;
CREATE INDEX sites_discovery ON sites (handle) WHERE discoverable AND published_id IS NOT NULL;

-- Block destinations can now also contain portfolio:commissions in the existing JSON URL field.
-- Existing external URLs and empty destinations retain their meaning.
-- Draft themes are JSON. Immutable older publication snapshots get the same
-- defaults when read through the shared schema.
UPDATE themes SET config = '{"sectionScale":1,"paperTexture":false,"showBranding":false}'::jsonb || config;
