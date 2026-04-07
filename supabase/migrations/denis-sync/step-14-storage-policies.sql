-- =============================================
-- 14. STORAGE POLICIES
-- =============================================

-- dish-photos bucket (ensure bucket exists first via Supabase dashboard)
DROP POLICY IF EXISTS "dish_photos_public_read" ON storage.objects;
CREATE POLICY "dish_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'dish-photos');

DROP POLICY IF EXISTS "dish_photos_insert_own" ON storage.objects;
CREATE POLICY "dish_photos_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dish-photos'
    AND (select auth.uid()) = owner
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'))
  );

DROP POLICY IF EXISTS "dish_photos_update_own" ON storage.objects;
CREATE POLICY "dish_photos_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'dish-photos' AND (select auth.uid()) = owner);

DROP POLICY IF EXISTS "dish_photos_delete_own" ON storage.objects;
CREATE POLICY "dish_photos_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'dish-photos' AND (select auth.uid()) = owner);


