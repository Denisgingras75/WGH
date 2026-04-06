# Agent Phone — WGH Cross-Fork Sync

Last updated by **Denis's Claude** — 2026-02-24

---

## How This Works

Two developers (Denis + Dan), each with their own Claude Code sessions, coordinate through this file. Think of it as a jail phone with a window — you can see the other side's work, and this file is the phone line.

**Denis's Claude:** Reads and writes this file directly. Update the status section every time you start or finish meaningful work.

**Dan's Claude:** Read this file on session startup via:
```bash
curl -s https://raw.githubusercontent.com/Denisgingras75/whats-good-here/main/AGENT-PHONE.md
```
To reply or flag something, open an issue on Denis's repo:
```bash
gh issue create --repo Denisgingras75/whats-good-here --title "Agent Phone: [subject]" --body "[message]"
```

---

## Current Status

### Denis's Side
- **Working on:** Codex learning system (complete), launch strategy planning
- **Last session:** 2026-02-24 — Built Codex (cross-session memory + playbooks), audited full codebase, identified specials flow as launch priority
- **Branch:** `main` (67 commits ahead of upstream)
- **Don't touch:** Nothing blocked — all clear

### Dan's Side
- **Last known:** `280943e` — Editorial refinement (4 days ago)
- **Working on:** Unknown — Dan, have your Claude update this section via issue
- **Branch:** `upstream/main`

---

## Active Warnings

- **DishListItem is the single source of truth now.** Denis refactored all dish display into one component with 3 variants. Don't create new dish card components.
- **13 components were deleted** in spring cleaning. Don't import: RankedDishRow, VotedDishCard, TopDishCard, Top10Compact, CategorySkeleton, SearchHero, DishCard, CategoryImageCard, CategoryGrid, or any component from the old profile tabs.
- **Profile uses JournalFeed now.** Old 5-tab profile system is gone. Replaced with shelf-based food journal (Good Here / Not Good Here / Heard That's Good There / All).
- **E2E tests exist.** Run `npm run test:e2e` before pushing. 25 scenarios, Playwright, port 5174.

---

## Recent Changes (Denis's 67 commits)

| What | Impact | Files |
|------|--------|-------|
| Unified DishListItem | All dish display through one component | `src/components/DishListItem.jsx` |
| Food Journal Profile | Profile page completely rebuilt | `src/pages/Profile.jsx`, `src/components/profile/` |
| Dish Page Redesign | Verdict/Action/Evidence layout | `src/pages/Dish.jsx` |
| E2E Test Suite | 25 Playwright scenarios | `e2e/`, `playwright.config.js` |
| Spring Cleaning | 13 dead components removed | Various |
| Pitch Page | `/for-restaurants` route | `src/pages/ForRestaurants.jsx` |
| Shared Components | CategoryChips, SectionHeader extracted | `src/components/` |

---

## Message Board

**2026-02-24 (Denis → Dan):** Hey Dan — Denis says hi. Your specials/events system is solid, all intact. I've been building on top of it. 67 commits ahead on my fork. Pull from `Denisgingras75/whats-good-here` main before starting new work. Full details in Issue #5 on your repo. Let's coordinate through this file going forward — your Claude reads it, my Claude writes it. If you need to say something back, open an issue on my repo with "Agent Phone:" in the title.
