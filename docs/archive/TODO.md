# What's Good Here - Remaining Issues

**Current Rating: 8.5/10** (Ready to Launch)

## Medium Priority (Fix in Month 1)

### 1. Ranking Algorithm Improvements
- **Issue:** Raw % doesn't account for vote count confidence
- **Fix:** Implement Bayesian scoring or Wilson score interval

### 2. No Recency Weighting
- **Issue:** Old votes weighted same as new votes
- **Fix:** Add time decay to ranking formula

### 3. Email in sessionStorage
- **Location:** `src/pages/Profile.jsx`
- **Issue:** PII stored client-side
- **Fix:** Remove or encrypt

### 4. Photo Quality Scoring
- **Issue:** No blur/contrast detection
- **Fix:** Add perceptual quality checks

## Low Priority (Backlog)

- Add comprehensive test coverage (currently 2/10)
- Badge system fraud detection
- Cache friend votes data
- TypeScript migration

---

## Completed Fixes ✓

- [x] Double-vote prevention (useVote.js)
- [x] Auth session handling (AuthContext.jsx)
- [x] Spatial index for distance queries (add-spatial-index.sql)
- [x] RLS policies validated
- [x] SQL injection prevention (sanitize.js)
- [x] Path traversal fix (dishPhotosApi.js)
- [x] N+1 queries in getUserProfile (followsApi.js) - now uses Promise.all
- [x] Console logs silenced in production (main.jsx)
- [x] Standardized error handling - all APIs now throw on error
- [x] Consistent loading states - ProfileSkeleton added
- [x] Cursor-based pagination for followers/following (followsApi.js, FollowListModal.jsx)
- [x] Server-side rate limiting (add-rate-limiting.sql, votesApi.js, dishPhotosApi.js)
