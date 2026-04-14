# Supabase SQL Organization

This folder contains all SQL for the What's Good Here database.

## Folder Structure

```
supabase/
├── schema/          # Core table definitions
├── functions/       # Database functions (RPC)
├── policies/        # Row Level Security (RLS) policies
├── indexes/         # Database indexes and constraints
├── seed/            # Initial data
│   └── menus/       # Restaurant menu data
└── migrations/
    ├── applied/     # One-time migrations (already run)
    └── archive/     # Old/deprecated scripts
```

## How to Use

### Adding New Schema
1. Create file in `schema/` (e.g., `add-new-feature-table.sql`)
2. Run in Supabase SQL Editor
3. File stays in `schema/` for reference

### Adding New Functions
1. Create file in `functions/`
2. Run in Supabase SQL Editor
3. Functions can be re-run safely (CREATE OR REPLACE)

### Adding RLS Policies
1. Create file in `policies/`
2. Run in Supabase SQL Editor
3. Document what the policy protects

### Adding Indexes
1. Create file in `indexes/`
2. Use `IF NOT EXISTS` so it's safe to re-run
3. Run in Supabase SQL Editor

### One-Time Migrations
1. Create file in `migrations/applied/` with date prefix
2. Run in Supabase SQL Editor
3. Never run again (data changes, fixes, etc.)

## Current Schema Overview

### Core Tables
- `profiles` - User profiles (extends Supabase auth.users)
- `restaurants` - Restaurant listings
- `dishes` - Menu items
- `votes` - User ratings (rating_10, 1-10 scale)
- `dish_photos` - User-uploaded photos
- `follows` - Social connections
- `notifications` - User notifications
- `badges` - Achievement definitions
- `user_badges` - Earned badges

### Key Functions
- `get_ranked_dishes()` - Main ranking algorithm
- `get_restaurant_dishes()` - Restaurant menu with stats

### Key Policies
- All tables have RLS enabled
- Users can only modify their own data
- Admin table controls write access to dishes/restaurants
