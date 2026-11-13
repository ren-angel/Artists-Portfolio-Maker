-- Artwork belongs to the site independently of its active image.
ALTER TABLE artworks ADD FOREIGN KEY(site_id) REFERENCES sites ON DELETE CASCADE;
ALTER TABLE artworks ALTER CONSTRAINT artworks_site_id_asset_id_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE galleries ALTER CONSTRAINT galleries_site_id_cover_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE revision_assets ALTER CONSTRAINT revision_assets_site_id_asset_id_fkey DEFERRABLE INITIALLY DEFERRED;
