#!/usr/bin/env python3
"""
Auto-sync CSV to Supabase
Usage:
  export SUPABASE_SERVICE_KEY="your_service_role_key_here"
  python3 sync-to-supabase.py

Or set it inline:
  SUPABASE_SERVICE_KEY="your_key" python3 sync-to-supabase.py
"""

import csv
import os
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = "https://fzgbxwonitnqmeguqixn.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set!")
    print()
    print("Please set it before running:")
    print('  export SUPABASE_SERVICE_KEY="your_service_role_key_here"')
    print('  python3 sync-to-supabase.py')
    print()
    print("Or run it inline:")
    print('  SUPABASE_SERVICE_KEY="your_key" python3 sync-to-supabase.py')
    exit(1)

def main():
    print("🚀 Starting CSV → Supabase sync...")
    print()

    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Read CSV
    dishes = []
    with open('all-dishes.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dishes.append(row)

    print(f"📊 Loaded {len(dishes)} dishes from CSV")

    # Group by restaurant
    restaurants = {}
    for dish in dishes:
        restaurant = dish['restaurant_name']
        if restaurant not in restaurants:
            restaurants[restaurant] = []
        restaurants[restaurant].append(dish)

    print(f"🏪 Found {len(restaurants)} restaurants")
    print()

    # Sync each restaurant
    total_synced = 0
    for restaurant_name, restaurant_dishes in restaurants.items():
        try:
            print(f"⏳ Syncing {restaurant_name} ({len(restaurant_dishes)} dishes)...", end=" ")

            # Get restaurant ID
            result = supabase.table('restaurants').select('id').eq('name', restaurant_name).execute()

            if not result.data or len(result.data) == 0:
                print(f"❌ Restaurant not found in database!")
                continue

            restaurant_id = result.data[0]['id']

            # Delete old dishes for this restaurant
            supabase.table('dishes').delete().eq('restaurant_id', restaurant_id).execute()

            # Insert new dishes
            dishes_to_insert = []
            for dish in restaurant_dishes:
                dishes_to_insert.append({
                    'restaurant_id': restaurant_id,
                    'name': dish['dish_name'],
                    'category': dish['category'],
                    'price': float(dish['price'])
                })

            # Insert in batches (Supabase has limits)
            batch_size = 100
            for i in range(0, len(dishes_to_insert), batch_size):
                batch = dishes_to_insert[i:i + batch_size]
                supabase.table('dishes').insert(batch).execute()

            print(f"✅ Synced!")
            total_synced += len(restaurant_dishes)

        except Exception as e:
            print(f"❌ Error: {str(e)}")
            continue

    print()
    print(f"🎉 Sync complete! {total_synced} dishes synced across {len(restaurants)} restaurants")

if __name__ == '__main__':
    main()
