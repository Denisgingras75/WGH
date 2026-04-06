#!/usr/bin/env python3
"""
Convert all-dishes.csv to SQL import script
Usage: python3 csv-to-sql.py
"""

import csv

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def main():
    # Read CSV
    dishes = []
    with open('all-dishes.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dishes.append(row)

    print(f"-- Bulk Import Script")
    print(f"-- Generated from all-dishes.csv")
    print(f"-- Total dishes: {len(dishes)}")
    print()

    # Group by restaurant
    restaurants = {}
    for dish in dishes:
        restaurant = dish['restaurant_name']
        if restaurant not in restaurants:
            restaurants[restaurant] = []
        restaurants[restaurant].append(dish)

    print(f"-- Found {len(restaurants)} restaurants")
    print()

    # Generate SQL for each restaurant
    for restaurant_name, restaurant_dishes in restaurants.items():
        print(f"-- {restaurant_name} ({len(restaurant_dishes)} dishes)")
        print(f"DELETE FROM dishes")
        print(f"WHERE restaurant_id = (SELECT id FROM restaurants WHERE name = '{escape_sql_string(restaurant_name)}');")
        print()
        print(f"INSERT INTO dishes (restaurant_id, name, category, price) VALUES")

        for i, dish in enumerate(restaurant_dishes):
            dish_name = escape_sql_string(dish['dish_name'])
            category = dish['category']
            price = dish['price']

            comma = ',' if i < len(restaurant_dishes) - 1 else ';'

            print(f"((SELECT id FROM restaurants WHERE name = '{escape_sql_string(restaurant_name)}'), '{dish_name}', '{category}', {price}){comma}")

        print()
        print()

if __name__ == '__main__':
    main()
