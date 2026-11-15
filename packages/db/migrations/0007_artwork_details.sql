ALTER TABLE artworks ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(details) = 'object');
