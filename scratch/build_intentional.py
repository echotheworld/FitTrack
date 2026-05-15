import json
import os

input_js = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\utils\knowledgeBase.js'
output_js = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\utils\intentionalDataset.js'

# Read knowledgeBase
with open(input_js, 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.replace('export const knowledgeBase = ', '').rstrip(';')
    kb_data = json.loads(json_str)

# Define our intentional categories and keywords
categories = {
    "stamina": ["stamina", "endurance", "longer", "distance", "breath", "tired", "run"],
    "muscle": ["muscle", "strength", "tone", "weights", "abs", "legs", "arms", "push-ups", "squats"],
    "nutrition": ["food", "diet", "eat", "protein", "carbs", "calories", "healthy", "meal", "breakfast", "dinner", "snack"],
    "motivation": ["lazy", "motivation", "hard", "tired", "start", "quit", "bored", "discipline", "goals"],
    "sleep": ["sleep", "rest", "night", "awake", "recovery", "insomnia", "bed"],
    "walking": ["walk", "steps", "hike", "moving", "outside", "nature", "brisk"],
    "weight_loss": ["weight", "fat", "slim", "burn", "lose", "metabolism", "composition"],
    "hydration": ["water", "drink", "thirsty", "dehydrated", "bottle", "hydration"],
    "wellness": ["stress", "mental", "focus", "clarity", "meditation", "mindfulness", "anxiety", "balance"]
}

# Group KB entries into categories
intentional_data = {cat: [] for cat in categories}
intentional_data["general"] = []

for item in kb_data:
    q = item['q'].lower()
    found_cat = False
    for cat, keywords in categories.items():
        if any(kw in q for kw in keywords):
            intentional_data[cat].append(item['a'])
            found_cat = True
            break
    if not found_cat:
        intentional_data["general"].append(item['a'])

# Save as intentionalDataset.js
js_content = f"export const intentionalDataset = {json.dumps(intentional_data, indent=2)};"
with open(output_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Created intentionalDataset.js with categories: {list(intentional_data.keys())}")
for cat, items in intentional_data.items():
    print(f" - {cat}: {len(items)} items")
