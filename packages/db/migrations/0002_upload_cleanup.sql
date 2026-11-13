CREATE FUNCTION queue_upload_gc() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO garbage(object_key) VALUES (OLD.site_id||'/'||OLD.id||'/staging') ON CONFLICT DO NOTHING;
 RETURN OLD;
END $$;
CREATE TRIGGER delete_upload AFTER DELETE ON uploads FOR EACH ROW EXECUTE FUNCTION queue_upload_gc();
