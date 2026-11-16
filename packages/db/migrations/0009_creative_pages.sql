CREATE TABLE creative_pages (
 site_id uuid NOT NULL, page_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('comic','character','project','product')),
 visible boolean NOT NULL, featured boolean NOT NULL, description text NOT NULL, status text NOT NULL,
 tags jsonb NOT NULL, fields jsonb NOT NULL, cover uuid, link text NOT NULL,
 PRIMARY KEY(site_id,page_id), FOREIGN KEY(site_id,page_id) REFERENCES pages ON DELETE CASCADE,
 FOREIGN KEY(site_id,cover) REFERENCES artworks
);
CREATE TABLE creative_artworks (
 site_id uuid NOT NULL,page_id uuid NOT NULL,art_id uuid NOT NULL,position integer NOT NULL,
 PRIMARY KEY(site_id,page_id,position), FOREIGN KEY(site_id,page_id) REFERENCES creative_pages ON DELETE CASCADE,
 FOREIGN KEY(site_id,art_id) REFERENCES artworks
);
CREATE TABLE creative_relations (
 site_id uuid NOT NULL,page_id uuid NOT NULL,target uuid NOT NULL,position integer NOT NULL,
 PRIMARY KEY(site_id,page_id,target), FOREIGN KEY(site_id,page_id) REFERENCES creative_pages ON DELETE CASCADE,
 FOREIGN KEY(site_id,target) REFERENCES pages ON DELETE CASCADE, CHECK(page_id<>target)
);
CREATE TABLE comic_chapters (
 site_id uuid NOT NULL,page_id uuid NOT NULL,id uuid NOT NULL,title text NOT NULL,position integer NOT NULL,
 visible boolean NOT NULL,publication_date date,cover uuid,PRIMARY KEY(site_id,page_id,id),
 FOREIGN KEY(site_id,page_id) REFERENCES creative_pages ON DELETE CASCADE, FOREIGN KEY(site_id,cover) REFERENCES artworks
);
CREATE TABLE comic_pages (
 site_id uuid NOT NULL,page_id uuid NOT NULL,chapter_id uuid NOT NULL,position integer NOT NULL,art_id uuid NOT NULL,
 PRIMARY KEY(site_id,page_id,chapter_id,position), FOREIGN KEY(site_id,page_id,chapter_id) REFERENCES comic_chapters ON DELETE CASCADE,
 FOREIGN KEY(site_id,art_id) REFERENCES artworks
);
CREATE TABLE digital_products (
 site_id uuid NOT NULL,page_id uuid NOT NULL, price numeric NOT NULL CHECK(price BETWEEN 0 AND 1000000),
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),checkout text NOT NULL,available boolean NOT NULL,
 PRIMARY KEY(site_id,page_id),FOREIGN KEY(site_id,page_id) REFERENCES creative_pages ON DELETE CASCADE
);
CREATE TABLE page_history (
 site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,page_id uuid NOT NULL, version integer NOT NULL,
 snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(site_id,page_id,version)
);
CREATE TABLE saved_sections (
 site_id uuid NOT NULL REFERENCES sites ON DELETE CASCADE,id uuid NOT NULL DEFAULT gen_random_uuid(),
 name text NOT NULL,blocks jsonb NOT NULL,PRIMARY KEY(site_id,id)
);
