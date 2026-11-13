-- Run on a migrated, disposable database. All fixtures roll back.
BEGIN;
DO $$
DECLARE
 u uuid := gen_random_uuid(); v uuid := gen_random_uuid();
 s uuid := gen_random_uuid(); other_site uuid := gen_random_uuid();
 page_id uuid := gen_random_uuid(); other_page uuid := gen_random_uuid();
 asset uuid := gen_random_uuid(); art uuid := gen_random_uuid(); g uuid := gen_random_uuid();
 rev uuid := gen_random_uuid(); up uuid := gen_random_uuid();
BEGIN
 INSERT INTO users(id,email,display_name,password_hash) VALUES(u,u||'@example.test','Artist A','fixture'),(v,v||'@example.test','Artist B','fixture');
 INSERT INTO sites(id,owner_id,handle,title,home) VALUES(s,u,'x-'||s,'First',page_id),(other_site,v,'x-'||other_site,'Second',other_page);
 INSERT INTO pages VALUES(s,page_id,'Home','home',1,true,'[]'),(other_site,other_page,'Home','home',1,true,'[]');
 INSERT INTO assets(site_id,id,bytes,width,height,source_bytes,source_width,source_height) VALUES(s,asset,1024,16,16,1200,16,16);
 INSERT INTO artworks VALUES(s,art,asset,'Title','','',true,1);
 INSERT INTO galleries VALUES(s,g,'Prints','prints','',true,art,1);
 INSERT INTO memberships VALUES(s,g,art,1);
 BEGIN
   INSERT INTO artworks VALUES(other_site,gen_random_uuid(),asset,'Intrusion','','',false,1);
   SET CONSTRAINTS ALL IMMEDIATE;
   RAISE EXCEPTION 'cross-site asset accepted';
 EXCEPTION WHEN foreign_key_violation THEN NULL;
 END;
 BEGIN
   INSERT INTO pages VALUES(s,gen_random_uuid(),'Duplicate','home',2,true,'[]');
   RAISE EXCEPTION 'duplicate slug accepted';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 INSERT INTO revisions(site_id,id,snapshot) VALUES(s,rev,'{"title":"First"}');
 INSERT INTO revision_assets VALUES(s,rev,asset);
 UPDATE sites SET published_id=rev,title='Draft edit' WHERE id=s;
 IF (SELECT snapshot->>'title' FROM revisions WHERE site_id=s AND id=rev)<>'First' THEN RAISE EXCEPTION 'snapshot changed'; END IF;
 DELETE FROM galleries WHERE site_id=s AND id=g;
 IF EXISTS(SELECT FROM memberships WHERE site_id=s) OR NOT EXISTS(SELECT FROM artworks WHERE id=art AND featured) THEN RAISE EXCEPTION 'membership cascade damaged artwork'; END IF;
 INSERT INTO uploads(id,site_id,source_bytes) VALUES(up,s,123);
 DELETE FROM users WHERE id=u;
 SET CONSTRAINTS ALL IMMEDIATE;
 IF EXISTS(SELECT FROM sites WHERE owner_id=u) OR EXISTS(SELECT FROM revisions WHERE site_id=s) OR EXISTS(SELECT FROM assets WHERE site_id=s) THEN RAISE EXCEPTION 'incomplete deletion'; END IF;
 IF (SELECT count(*) FROM garbage WHERE object_key LIKE s||'/%')<>3 THEN RAISE EXCEPTION 'incomplete cleanup queue'; END IF;
 IF NOT EXISTS(SELECT FROM sites WHERE owner_id=v) THEN RAISE EXCEPTION 'other tenant damaged'; END IF;
END $$;
ROLLBACK;
