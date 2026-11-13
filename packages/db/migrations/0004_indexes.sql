CREATE INDEX revision_assets_lookup ON revision_assets(site_id,asset_id);
CREATE INDEX memberships_artwork ON memberships(site_id,art_id);
CREATE INDEX tokens_expiry ON tokens(expires_at);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE INDEX uploads_expiry ON uploads(expires_at);
CREATE INDEX garbage_age ON garbage(created_at);
CREATE INDEX reports_open ON reports(created_at) WHERE status='open';
