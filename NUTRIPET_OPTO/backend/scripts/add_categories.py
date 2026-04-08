import csv
import os

foods_path = os.path.join(os.path.dirname(__file__), "..", "data", "foods.csv")
output_path = os.path.join(os.path.dirname(__file__), "..", "data", "foods_categorized.csv")

categories = {
    'Meat': ['Chicken', 'Beef', 'Turkey', 'Lamb', 'Pork', 'Duck', 'Venison', 'Bison', 'Rabbit Meat', 'Goat Meat', 'Goose Meat', 'Pheasant', 'Ostrich', 'Liver', 'Heart', 'Kidney', 'Gizzard', 'Mammal Meat'],
    'Seafood': ['Salmon', 'Tuna', 'Sardine', 'Shrimp', 'Cod', 'Mackerel', 'Anchovy', 'Herring', 'Trout', 'Crab', 'Mussel', 'Clam', 'Squid', 'Oyster', 'Tilapia', 'Catfish'],
    'Dairy/Egg': ['Egg', 'Cheese', 'Yogurt', 'Milk', 'Butter'],
    'Vegetable': ['Potato', 'Carrot', 'Broccoli', 'Spinach', 'Green Beans', 'Pumpkin', 'Peas', 'Onion', 'Garlic', 'Mushroom', 'Tomato', 'Celery', 'Cucumber', 'Zucchini', 'Bell Pepper', 'Kale', 'Cabbage', 'Cauliflower', 'Asparagus', 'Beet', 'Sweet Potato', 'Rhubarb', 'Iceberg Lettuce'],
    'Fruit': ['Apple', 'Banana', 'Blueberry', 'Watermelon', 'Strawberry', 'Mango', 'Orange', 'Pineapple', 'Avocado', 'Coconut', 'Grapes', 'Raisins', 'Cranberry', 'Papaya', 'Cantaloupe', 'Peach', 'Plum'],
    'Grain/Bean': ['Rice', 'Oats', 'Quinoa', 'Lentils', 'Chickpeas', 'Black Beans', 'Barley', 'Millet', 'Buckwheat', 'Amaranth', 'Sorghum', 'Corn', 'Bread', 'Tofu'],
    'Seed/Nut': ['Peanut Butter', 'Almonds', 'Walnuts', 'Sunflower Seeds', 'Flaxseed', 'Chia Seeds', 'Pumpkin Seeds', 'Hemp Seeds', 'Macadamia Nut'],
    'Other': ['Bone Meal', 'Kelp', 'Spirulina', 'Wheatgrass', 'Honey', 'Xylitol', 'Cinnamon', 'Turmeric', 'Ginger', 'Parsley', 'Oil', 'Chocolate', 'Alcohol', 'Caffeine', 'Lily', 'Cricket Flour']
}

def get_category(name):
    for cat, keywords in categories.items():
        for keyword in keywords:
            if keyword.lower() in name.lower():
                return cat
    return 'Other'

with open(foods_path, 'r', newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    if 'category' not in header:
        header.insert(1, 'category')
    rows = []
    for row in reader:
        name = row[0]
        if 'category' not in row: # well row is a list
            cat = get_category(name)
            row.insert(1, cat)
        rows.append(row)

with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(rows)

print("Categorization complete.")
