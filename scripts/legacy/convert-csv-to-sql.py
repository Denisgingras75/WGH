#!/usr/bin/env python3
import csv
from collections import defaultdict

# Read CSV
dishes_by_restaurant = defaultdict(list)

with open('full-menus.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        restaurant = row['restaurant_name']
        dish_name = row['dish_name']
        category = row['category'].replace('_', ' ')  # Fix underscores
        price = row['price']

        dishes_by_restaurant[restaurant].append({
            'name': dish_name,
            'category': category,
            'price': price
        })

# Generate SQL
with open('supabase/import-full-menus.sql', 'w') as f:
    f.write("-- Import Full Restaurant Menus\n")
    f.write("-- Run this in Supabase SQL Editor\n\n")
    f.write("-- IMPORTANT: This will ADD to existing dishes. Run delete-old-dishes.sql first if needed.\n\n")

    for restaurant, dishes in sorted(dishes_by_restaurant.items()):
        f.write(f"-- {restaurant} ({len(dishes)} dishes)\n")
        f.write("INSERT INTO dishes (restaurant_id, name, category, price) VALUES\n")

        for i, dish in enumerate(dishes):
            # Escape single quotes
            dish_name = dish['name'].replace("'", "''")
            restaurant_name = restaurant.replace("'", "''")

            comma = "," if i < len(dishes) - 1 else ";"
            f.write(f"((SELECT id FROM restaurants WHERE name = '{restaurant_name}'), '{dish_name}', '{dish['category']}', {dish['price']}){comma}\n")

        f.write("\n")

    # Add verification query
    f.write("-- Verify all dishes were added\n")
    f.write("SELECT\n")
    f.write("  r.name as restaurant,\n")
    f.write("  COUNT(d.id) as dish_count\n")
    f.write("FROM restaurants r\n")
    f.write("LEFT JOIN dishes d ON r.id = d.restaurant_id\n")
    f.write("WHERE r.name NOT IN ('Bangkok Cuisine', 'Vineyard Caribbean Cuisine')\n")
    f.write("GROUP BY r.name\n")
    f.write("ORDER BY dish_count DESC, r.name;\n")

print("✅ Created supabase/import-full-menus.sql")
print("📊 Summary:")
for restaurant, dishes in sorted(dishes_by_restaurant.items()):
    print(f"  {restaurant}: {len(dishes)} dishes")
print(f"\nTotal: {sum(len(d) for d in dishes_by_restaurant.values())} dishes across {len(dishes_by_restaurant)} restaurants")
