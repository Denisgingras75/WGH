-- Migration: add_dish_to_my_local_list
-- Appends a single dish to the caller's local list (Top 10) from anywhere
-- (restaurant tab, dish page) without round-tripping the whole list. Enforces
-- the rate-first gate on the SERVER (the UI gate alone was advisory — a raw RPC
-- call could bypass it; this closes the integrity gap noted in PR #7).
--
-- Additive (CREATE OR REPLACE) — no rollback block needed.
-- ROLLBACK (if ever required): DROP FUNCTION IF EXISTS add_dish_to_my_local_list(UUID);

CREATE OR REPLACE FUNCTION add_dish_to_my_local_list(p_dish_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_list_id UUID;
  v_count INT;
  v_position INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'not_authenticated', 'error', 'Not authenticated');
  END IF;

  -- Curator-gated feature (mirrors save_my_local_list).
  IF NOT is_local_curator() THEN
    RETURN json_build_object('success', false, 'code', 'not_curator', 'error', 'Not a local curator');
  END IF;

  SELECT local_lists.id INTO v_list_id FROM local_lists WHERE local_lists.user_id = v_user_id;
  IF v_list_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'no_list', 'error', 'No list found — accept an invite first');
  END IF;

  -- Rate-first gate (server-enforced): the curator must have given this dish a
  -- number before it can go on their Top 10.
  IF NOT EXISTS (
    SELECT 1 FROM votes
    WHERE votes.dish_id = p_dish_id
      AND votes.user_id = v_user_id
      AND votes.rating_10 IS NOT NULL
  ) THEN
    RETURN json_build_object('success', false, 'code', 'not_rated', 'error', 'Rate this dish first');
  END IF;

  -- Already on the list? (also guarded by the unique constraint)
  IF EXISTS (
    SELECT 1 FROM local_list_items
    WHERE local_list_items.list_id = v_list_id
      AND local_list_items.dish_id = p_dish_id
  ) THEN
    RETURN json_build_object('success', false, 'code', 'duplicate', 'error', 'Already on your Top 10');
  END IF;

  -- Capacity check (max 10).
  SELECT COUNT(*) INTO v_count FROM local_list_items WHERE local_list_items.list_id = v_list_id;
  IF v_count >= 10 THEN
    RETURN json_build_object('success', false, 'code', 'full', 'error', 'Your Top 10 is full');
  END IF;

  SELECT COALESCE(MAX(local_list_items."position"), 0) + 1
    INTO v_position
    FROM local_list_items
    WHERE local_list_items.list_id = v_list_id;

  INSERT INTO local_list_items (list_id, dish_id, "position", note)
  VALUES (v_list_id, p_dish_id, v_position, NULL);

  -- Adding from anywhere publishes the list (a non-empty list is active,
  -- consistent with save_my_local_list semantics).
  UPDATE local_lists SET is_active = true WHERE local_lists.id = v_list_id;

  RETURN json_build_object('success', true, 'list_id', v_list_id, 'position', v_position, 'item_count', v_count + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
