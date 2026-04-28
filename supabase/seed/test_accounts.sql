-- WGH test-account confirmation + role seeder
-- Created 2026-04-27. Idempotent — safe to re-run.
--
-- Accounts (all password: WghTest2026!):
--   denisgingras75+anon@gmail.com    44d5d78f-e740-4b35-87f5-ca9a9fbd4916
--   denisgingras75+user1@gmail.com   ccbca471-5206-4ae7-aac9-de4fdecb34d2
--   denisgingras75+user2@gmail.com   4e87957d-80bd-4e99-bc0d-172525f850b4
--   denisgingras75+manager@gmail.com cedbb24d-deae-4ef8-add7-c857263a5fb7
--   denisgingras75+admin@gmail.com   7699451d-1236-48b4-857c-09ade222f569
--   denisgingras75+curator@gmail.com 5b49c630-d52a-441f-93d7-763871ea79fe

-- 1. Auto-confirm all 6 emails so they can sign in without clicking the
--    confirmation link. SQL Editor runs as service role; this is allowed.
UPDATE auth.users
   SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
       confirmed_at       = COALESCE(confirmed_at,       NOW())
 WHERE email IN (
   'denisgingras75+anon@gmail.com',
   'denisgingras75+user1@gmail.com',
   'denisgingras75+user2@gmail.com',
   'denisgingras75+manager@gmail.com',
   'denisgingras75+admin@gmail.com',
   'denisgingras75+curator@gmail.com'
 );

-- 2. Grant roles (admin / manager / curator).
DO $$
DECLARE
  v_admin_id   UUID;
  v_manager_id UUID;
  v_curator_id UUID;
  v_restaurant UUID;
BEGIN
  SELECT id INTO v_admin_id   FROM auth.users WHERE email = 'denisgingras75+admin@gmail.com';
  SELECT id INTO v_manager_id FROM auth.users WHERE email = 'denisgingras75+manager@gmail.com';
  SELECT id INTO v_curator_id FROM auth.users WHERE email = 'denisgingras75+curator@gmail.com';

  -- Pick a restaurant for the manager. First one alphabetically by default.
  SELECT id INTO v_restaurant FROM restaurants ORDER BY name LIMIT 1;

  IF v_admin_id IS NULL OR v_manager_id IS NULL OR v_curator_id IS NULL THEN
    RAISE EXCEPTION 'Test accounts not found in auth.users. Sign up first.';
  END IF;

  -- Admin
  INSERT INTO admins (user_id) VALUES (v_admin_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Curator (the trigger reverts client UPDATEs of is_local_curator —
  -- SQL Editor's elevated role bypasses it)
  UPDATE profiles
     SET is_local_curator    = true,
         can_invite_curators = true
   WHERE id = v_curator_id;

  -- Manager
  INSERT INTO restaurant_managers (user_id, restaurant_id, role, created_by)
  VALUES (v_manager_id, v_restaurant, 'manager', v_admin_id)
  ON CONFLICT (user_id, restaurant_id) DO NOTHING;

  RAISE NOTICE 'Granted: admin=%, manager=% (restaurant=%), curator=%',
    v_admin_id, v_manager_id, v_restaurant, v_curator_id;
END $$;

-- Optional: seed enough overlapping votes between user1+user2 to make
-- taste-compatibility math compute (RPC needs ≥10 shared dishes).
-- Uncomment after the role grants succeed, then run separately.
--
-- DO $$
-- DECLARE
--   v_u1 UUID; v_u2 UUID; r RECORD;
-- BEGIN
--   SELECT id INTO v_u1 FROM auth.users WHERE email = 'denisgingras75+user1@gmail.com';
--   SELECT id INTO v_u2 FROM auth.users WHERE email = 'denisgingras75+user2@gmail.com';
--   FOR r IN SELECT id FROM dishes ORDER BY total_votes DESC LIMIT 12 LOOP
--     INSERT INTO votes (dish_id, user_id, rating, source) VALUES
--       (r.id, v_u1, 7 + (random()*3)::int, 'user'),
--       (r.id, v_u2, 6 + (random()*4)::int, 'user')
--     ON CONFLICT (dish_id, user_id) WHERE source = 'user' DO NOTHING;
--   END LOOP;
-- END $$;

-- ROLLBACK:
-- DELETE FROM admins WHERE user_id = (SELECT id FROM auth.users WHERE email = 'denisgingras75+admin@gmail.com');
-- DELETE FROM restaurant_managers WHERE user_id = (SELECT id FROM auth.users WHERE email = 'denisgingras75+manager@gmail.com');
-- UPDATE profiles SET is_local_curator = false, can_invite_curators = false
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'denisgingras75+curator@gmail.com');
