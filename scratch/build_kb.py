import json
import os

input_json = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\assets\dataset\fitness_dataset.json'
output_js = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\utils\knowledgeBase.js'

with open(input_json, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract instruction and output, clean them up slightly
knowledge = []
for item in data:
    instr = item['instruction'].lower()
    out = item['output']
    # Keep it simple: instruction acts as keywords
    knowledge.append({
        "q": instr,
        "a": out
    })

js_content = f"export const knowledgeBase = {json.dumps(knowledge, indent=2)};"

with open(output_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully created {output_js} with {len(knowledge)} entries.")
