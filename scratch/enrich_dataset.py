import json

input_js = r'c:\Users\echo\Music\FitnessApp\FitTrack_RN\utils\intentionalDataset.js'

# Read existing intentionalDataset
with open(input_js, 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.replace('export const intentionalDataset = ', '').rstrip(';')
    data = json.loads(json_str)

# Manual Enrichments (Professional Fitness Data)
enrichments = {
    "stamina": [
        "To boost stamina, try 'Zone 2' training. This means walking or running at a pace where you can still hold a full conversation. It builds your aerobic base without burnout.",
        "Interval training is the fastest way to increase endurance. Try 1 minute of brisk walking followed by 2 minutes of regular pace. Repeat this 10 times during your next session.",
        "Focus on your breathing. Inhaling through the nose and exhaling through the mouth helps regulate your heart rate and allows you to go for longer distances.",
        "Consistency is more important than intensity. Three 20-minute sessions are better for stamina than one 60-minute session followed by a week of rest."
    ],
    "hydration": [
        "Don't just drink water; think about electrolytes! If you're sweating a lot, make sure you're getting sodium, potassium, and magnesium to prevent cramping.",
        "A simple way to check your hydration is the 'Urine Test'. It should be a pale straw color. If it's dark yellow, you're likely dehydrated.",
        "Try the '8x8 rule' as a baseline: eight 8-ounce glasses of water a day. But remember, your activity level and the weather can increase this need significantly.",
        "Drink 500ml of water as soon as you wake up. It jumpstarts your metabolism and rehydrates your body after 8 hours of sleep."
    ],
    "walking": [
        "Focus on your posture. Keep your head up, shoulders relaxed, and engage your core. This prevents back pain and allows you to walk more efficiently.",
        "Use your arms! Swinging your arms naturally at a 90-degree angle helps drive your momentum and burns up to 10% more calories.",
        "Add some 'Incline Intervals'. If you're outside, find a small hill. Walking up a slight grade significantly increases your heart rate and strengthens your glutes.",
        "The best pace for fat burning is a 'Brisk Walk'—about 100 steps per minute. It's fast enough to make you warm but not so fast that you're breathless."
    ],
    "wellness": [
        "Try the 'Box Breathing' technique for stress: Inhale for 4 seconds, hold for 4, exhale for 4, and hold for 4. It instantly calms your nervous system.",
        "Movement is the best antidepressant. Even a 5-minute walk increases blood flow to the brain and releases endorphins that improve your mood.",
        "Practice 'Mindful Movement'. Instead of listening to a podcast, try focusing solely on the sensation of your feet hitting the ground for just 2 minutes.",
        "Rest is a weapon. High-performers know that recovery is when the body actually gets stronger. Don't feel guilty about taking a slow day."
    ],
    "motivation": [
        "Use the '5-Minute Rule'. Tell yourself you'll only walk for 5 minutes. Usually, once you start, the friction disappears and you'll finish the whole session.",
        "Focus on 'Identity-Based Habits'. Don't say 'I'm trying to walk more.' Say 'I am a person who never misses a daily walk.' The shift in mindset is powerful.",
        "Track your non-scale victories. Better sleep, more energy, and a lower resting heart rate are often more important than the number on the scale.",
        "Find your 'Why'. Are you walking for longevity, for your family, or for mental clarity? Keep that reason at the front of your mind when it feels hard."
    ]
}

# Merge enrichments
for cat, items in enrichments.items():
    if cat in data:
        data[cat].extend(items)
    else:
        data[cat] = items

# Save back
js_content = f"export const intentionalDataset = {json.dumps(data, indent=2)};"
with open(input_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Enriched intentionalDataset.js with {sum(len(v) for v in enrichments.values())} new professional items.")
