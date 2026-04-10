-- High priority audit fixes (2026-04-10)
-- Idempotent: safe to re-run in Supabase SQL Editor.

-- Prevent authenticated users from spoofing restaurants.created_by while preserving the
-- existing per-user creation limit.
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
CREATE POLICY "Authenticated users can insert restaurants" ON restaurants
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by = (SELECT auth.uid())
    AND (
      is_admin()
      OR (
        SELECT count(*)
        FROM restaurants
        WHERE created_by = (SELECT auth.uid())
          AND created_at > now() - interval '1 hour'
      ) < 5
    )
  );

-- Prevent authenticated users from spoofing dishes.created_by while preserving the
-- existing per-user creation limit.
DROP POLICY IF EXISTS "Authenticated users can insert dishes" ON dishes;
CREATE POLICY "Authenticated users can insert dishes" ON dishes
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND created_by = (SELECT auth.uid())
    AND (
      is_admin()
      OR auth.role() = 'service_role'
      OR (
        SELECT count(*)
        FROM dishes
        WHERE created_by = (SELECT auth.uid())
          AND created_at > now() - interval '1 hour'
      ) < 20
    )
  );
