-- Draft writes replace page rows within a transaction. This deferred key preserves
-- private objects on a normal save. Explicit listing deletion queues their cleanup.
CREATE TABLE product_assets (
 site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,page_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),
 bytes integer NOT NULL CHECK(bytes>0),name text NOT NULL, grant_digest text UNIQUE,grant_expires timestamptz,
 PRIMARY KEY(site_id,page_id), FOREIGN KEY(site_id,page_id) REFERENCES digital_products(site_id,page_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE FUNCTION queue_product_gc() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO garbage(object_key) VALUES ('products/'||OLD.site_id||'/'||OLD.id) ON CONFLICT DO NOTHING;
 RETURN OLD;
END $$;
CREATE TRIGGER delete_product_asset AFTER DELETE ON product_assets FOR EACH ROW EXECUTE FUNCTION queue_product_gc();

ALTER TABLE sites ADD COLUMN directory_opt_in boolean NOT NULL DEFAULT false, ADD COLUMN published_name text NOT NULL DEFAULT '', ADD COLUMN discovery_category text NOT NULL DEFAULT '', ADD COLUMN discovery_tags text NOT NULL DEFAULT '';
UPDATE sites s SET published_name=r.snapshot->>'title' FROM revisions r WHERE (r.site_id,r.id)=(s.id,s.published_id);
CREATE INDEX discovery_portfolio_search ON sites USING gin(to_tsvector('simple',published_name||' '||handle||' '||discovery_category||' '||discovery_tags))
 WHERE directory_opt_in AND published_id IS NOT NULL;
