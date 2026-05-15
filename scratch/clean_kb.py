import json
import re

input_js = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\utils\knowledgeBase.js'
# Read the file (it's a JS export, so we need to parse the JSON part)
with open(input_js, 'r', encoding='utf-8') as f:
    content = f.read()
    # Extract the JSON array
    json_str = content.replace('export const knowledgeBase = ', '').rstrip(';')
    data = json.loads(json_str)

def clean_truncated_text(text):
    # Remove trailing list items like "5. " or "10." that have no text
    text = re.sub(r'\d+\.\s*$', '', text).strip()
    
    # Remove things like "5. Talk" or "5. Keep" if they look like the start of a new item that got cut off
    # We look for a number followed by a very short word at the very end
    text = re.sub(r'\d+\.\s+[A-Z][a-z]{0,10}$', '', text).strip()
    
    # If the last sentence doesn't end with punctuation, it's likely truncated.
    last_punc = max(text.rfind('.'), text.rfind('!'), text.rfind('?'))
    if last_punc != -1 and last_punc < len(text) - 1:
        text = text[:last_punc+1]
    
    return text.strip()

cleaned_data = []
for item in data:
    cleaned_data.append({
        "q": item['q'],
        "a": clean_truncated_text(item['a'])
    })

output_content = f"export const knowledgeBase = {json.dumps(cleaned_data, indent=2)};"
with open(input_js, 'w', encoding='utf-8') as f:
    f.write(output_content)

print(f"Cleaned {len(cleaned_data)} entries in knowledgeBase.js")
