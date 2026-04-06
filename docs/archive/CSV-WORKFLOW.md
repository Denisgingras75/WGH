# CSV Workflow for Adding Restaurant Menus

## Overview
This is WAY faster than creating individual SQL files. All your restaurant data is now in one CSV file that you can edit easily.

## Files Created
1. **all-dishes.csv** - Your master data file (475 dishes currently loaded)
2. **csv-to-sql.py** - Script to convert CSV to SQL
3. **CSV-WORKFLOW.md** - This file

## How to Add New Restaurants

### Option 1: Edit CSV Directly (Recommended)
1. Open `all-dishes.csv` in Excel, Numbers, or Google Sheets
2. Add new rows with format:
   ```
   restaurant_name,dish_name,category,price
   Town Bar,New Dish Name,burger,25.00
   ```
3. Save the file
4. Generate SQL: `python3 csv-to-sql.py > import.sql`
5. Copy `import.sql` contents and paste into Supabase SQL Editor
6. Run it!

### Option 2: I Can Add Them For You
Just send me:
- Restaurant name
- Menu link or menu items as text

I'll add them to the CSV for you.

## Categories Available
- breakfast
- breakfast sandwich
- burger
- sandwich
- fish
- pizza
- pasta
- salad
- taco
- wings
- tendys
- lobster roll
- lobster
- chowder
- apps
- fries
- fried chicken
- entree
- pokebowl
- sushi

## Current Restaurants in CSV (15 total)
1. TigerHawk Sandwich Company (33 dishes)
2. Mo's Lunch (26 dishes)
3. Coop de Ville (34 dishes)
4. Martha's Vineyard Chowder Company (47 dishes)
5. Lookout Tavern (70 dishes)
6. Nancy's Restaurant (48 dishes)
7. Offshore Ale Company (36 dishes)
8. MV Salads (8 dishes)
9. Black Dog (23 dishes)
10. 9 Craft Kitchen and Bar (38 dishes)
11. Beach Road (18 dishes)
12. The Attic (34 dishes)
13. Waterside Market (25 dishes)
14. Porto Pizza (8 dishes)
15. Town Bar (27 dishes)

**Total: 475 dishes**

## Tips
- Keep restaurant names EXACTLY the same as in your database
- Use consistent category names (see list above)
- You can edit prices in bulk (e.g., increase all prices by 10%)
- You can find/replace across all dishes easily
- Share the CSV with others to collaborate on data entry

## To Import Everything at Once
```bash
cd /Users/danielwalsh/.local/bin/whats-good-here
python3 csv-to-sql.py > bulk-import.sql
```

Then paste `bulk-import.sql` into Supabase and run it once!
