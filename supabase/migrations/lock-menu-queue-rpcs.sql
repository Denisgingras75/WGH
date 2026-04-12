-- Lock down menu_import_jobs RPC permissions
-- Date: 2026-04-12
--
-- Before this fix, anon could call claim_menu_import_jobs and enqueue_menu_import
-- freely, letting anyone halt the queue by claiming every pending job (10-min
-- lock each) or burn Claude API budget by flooding the queue with junk.

-- claim_menu_import_jobs: service_role only (called by menu-refresh Edge Function)
REVOKE EXECUTE ON FUNCTION claim_menu_import_jobs(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_menu_import_jobs(INT) TO service_role;

-- enqueue_menu_import: signed-in users + service_role (AddRestaurantModal
-- already gates behind useAuth, but the RPC itself now enforces it too)
REVOKE EXECUTE ON FUNCTION enqueue_menu_import(UUID, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION enqueue_menu_import(UUID, TEXT, INT) TO authenticated, service_role;

-- get_menu_import_status: leave open — public restaurant detail pages poll this
-- to show import progress. Read-only, no abuse potential.
