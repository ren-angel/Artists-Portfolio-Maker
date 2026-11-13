CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE CHECK (email=lower(email)),
 password_hash text NOT NULL, display_name text NOT NULL, verified boolean NOT NULL DEFAULT false,
 avatar_asset uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (digest text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE tokens (digest text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, purpose text NOT NULL CHECK(purpose IN ('verify','reset')), expires_at timestamptz NOT NULL, UNIQUE(user_id,purpose));
CREATE TABLE sites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 handle text UNIQUE NOT NULL, version integer NOT NULL DEFAULT 1, title text NOT NULL, description text NOT NULL DEFAULT '',
 language text NOT NULL DEFAULT 'pt-BR', step integer NOT NULL DEFAULT 2, home uuid NOT NULL, social jsonb NOT NULL DEFAULT '[]',
 published_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sites_owner ON sites(owner_id);
CREATE TABLE entitlements (user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE, plan text NOT NULL DEFAULT 'free');
CREATE TABLE themes (site_id uuid PRIMARY KEY REFERENCES sites ON DELETE CASCADE, config jsonb NOT NULL);
CREATE TABLE pages (site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,id uuid NOT NULL,title text NOT NULL,slug text NOT NULL,position int NOT NULL,in_nav boolean NOT NULL,blocks jsonb NOT NULL, PRIMARY KEY(site_id,id),UNIQUE(site_id,slug));
CREATE TABLE assets (site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,id uuid NOT NULL DEFAULT gen_random_uuid(),bytes integer NOT NULL,width integer NOT NULL,height integer NOT NULL,source_bytes integer NOT NULL,source_width integer NOT NULL,source_height integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(site_id,id));
CREATE TABLE artworks (site_id uuid NOT NULL,id uuid NOT NULL,asset_id uuid NOT NULL,title text NOT NULL,description text NOT NULL,alt text NOT NULL,featured boolean NOT NULL,position int NOT NULL,PRIMARY KEY(site_id,id),FOREIGN KEY(site_id,asset_id) REFERENCES assets(site_id,id),UNIQUE(site_id,asset_id));
CREATE TABLE galleries (site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,id uuid NOT NULL,title text NOT NULL,slug text NOT NULL,description text NOT NULL,visible boolean NOT NULL,cover uuid,position int NOT NULL,PRIMARY KEY(site_id,id),UNIQUE(site_id,slug),FOREIGN KEY(site_id,cover) REFERENCES artworks(site_id,id));
CREATE TABLE memberships(site_id uuid NOT NULL,gallery_id uuid NOT NULL,art_id uuid NOT NULL,position int NOT NULL,PRIMARY KEY(site_id,gallery_id,art_id),FOREIGN KEY(site_id,gallery_id) REFERENCES galleries(site_id,id) ON DELETE CASCADE,FOREIGN KEY(site_id,art_id) REFERENCES artworks(site_id,id) ON DELETE CASCADE);
CREATE TABLE revisions(site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,id uuid NOT NULL DEFAULT gen_random_uuid(),snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(site_id,id));
ALTER TABLE sites ADD FOREIGN KEY(id,published_id) REFERENCES revisions(site_id,id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE sites ADD FOREIGN KEY(id,home) REFERENCES pages(site_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE revision_assets(site_id uuid NOT NULL,revision_id uuid NOT NULL,asset_id uuid NOT NULL,PRIMARY KEY(site_id,revision_id,asset_id),FOREIGN KEY(site_id,revision_id) REFERENCES revisions(site_id,id) ON DELETE CASCADE,FOREIGN KEY(site_id,asset_id) REFERENCES assets(site_id,id));
CREATE TABLE uploads(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,source_bytes int NOT NULL CHECK(source_bytes>0),replacement uuid,expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes');
CREATE INDEX uploads_site ON uploads(site_id);
CREATE TABLE garbage(object_key text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION queue_asset_gc() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO garbage(object_key) VALUES (OLD.site_id||'/'||OLD.id||'/master.webp'),(OLD.site_id||'/'||OLD.id||'/thumb.webp') ON CONFLICT DO NOTHING;
 RETURN OLD;
END $$;
CREATE TRIGGER delete_asset AFTER DELETE ON assets FOR EACH ROW EXECUTE FUNCTION queue_asset_gc();
CREATE TABLE events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id uuid REFERENCES users ON DELETE SET NULL,event text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reports(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),site_id uuid REFERENCES sites ON DELETE SET NULL,reason text NOT NULL,status text NOT NULL DEFAULT 'open',created_at timestamptz NOT NULL DEFAULT now());
