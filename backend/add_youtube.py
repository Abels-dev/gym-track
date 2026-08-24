import json
import urllib.parse
import re

def clean_exercise_name(name):
    # Remove gender tags like (male), (female), and version tags like v. 2
    cleaned = re.sub(r'\(male\)|\(female\)|v\.\s*\d+', '', name, flags=re.IGNORECASE)
    # Clean up multi-spaces
    return " ".join(cleaned.split())

# Load your dataset
with open('cleaned-exercises.json', 'r') as f:
    exercises = json.load(f)

for item in exercises:
    clean_name = clean_exercise_name(item['name'])
    # Construct a target query
    query = f"how to do {clean_name} exercise form tutorial"
    encoded_query = urllib.parse.quote(query)
    
    # Overwrite the dummy videoUrl with the YouTube search link
    item['videoUrl'] = f"https://www.youtube.com/results?search_query={encoded_query}"

# Save to a new JSON file
with open('exercises-with-youtube.json', 'w') as f:
    json.dump(exercises, f, indent=2)

print("Successfully converted 600+ video URLs!")