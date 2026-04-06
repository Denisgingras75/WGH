# Auto-Sync CSV to Supabase

## Setup (One Time Only)

1. Get your service role key from Supabase:
   - Go to https://fzgbxwonitnqmeguqixn.supabase.co
   - Project Settings → API
   - Copy the **service_role** key (starts with `eyJ...`)

2. Set it as an environment variable:
   ```bash
   export SUPABASE_SERVICE_KEY="your_service_role_key_here"
   ```

## Usage

Every time you update `all-dishes.csv`:

```bash
cd /Users/danielwalsh/.local/bin/whats-good-here
SUPABASE_SERVICE_KEY="your_key" python3 sync-to-supabase.py
```

That's it! The script will:
1. Read all dishes from `all-dishes.csv`
2. Delete old dishes for each restaurant
3. Insert new dishes from CSV
4. Show you the progress

## Alternative: Manual SQL Workflow

If you prefer the manual approach:

```bash
python3 csv-to-sql.py > bulk-import.sql
```

Then paste `bulk-import.sql` into Supabase SQL Editor and run it.

## Security Note

⚠️ **Never commit your service role key to GitHub!**

The key is like an admin password. Keep it secret, keep it safe.
