-- =============================================
-- 6. HELPER FUNCTIONS (must come before RLS policies that reference them)
-- =============================================

-- is_admin()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = (select auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- is_local_curator()
CREATE OR REPLACE FUNCTION is_local_curator()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT is_local_curator FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- is_restaurant_manager()
CREATE OR REPLACE FUNCTION is_restaurant_manager(p_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM restaurant_managers
    WHERE user_id = (select auth.uid())
      AND restaurant_id = p_restaurant_id
      AND accepted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- get_bias_label()
CREATE OR REPLACE FUNCTION get_bias_label(bias NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN bias IS NULL THEN 'New Voter'
    WHEN bias < 0.5 THEN 'Consensus Voter'
    WHEN bias < 1.0 THEN 'Has Opinions'
    WHEN bias < 2.0 THEN 'Strong Opinions'
    ELSE 'Wild Card'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;


