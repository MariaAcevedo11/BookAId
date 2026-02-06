import requests
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import os 

load_dotenv()

base_url_path = os.getenv("BASE_URL")
SUBJECTS = [
  "arts",
  "architecture",
  "art education",
  "art history",
  "dance",
  "design",
  "fashion",
  "film",
  "graphic design",
  "music",
  "music theory",
  "painting",
  "photography",
  "animals",
  "bears",
  "cats",
  "kittens",
  "dogs",
  "puppies",
  "fiction",
  "fantasy",
  "historical fiction",
  "horror",
  "humor",
  "literature",
  "magic",
  "mystery and detective stories",
  "plays",
  "poetry",
  "romance",
  "science fiction",
  "short stories",
  "suspense",
  "young adult",
  "science and mathematics",
  "biology",
  "chemistry",
  "mathematics",
  "physics",
  "programming",
  "business and finance",
  "management",
  "entrepreneurship",
  "business economics",
  "business success",
  "finance",
  "children's books",
  "children's books",
  "rhyming stories",
  "baby books",
  "bedtime stories",
  "picture books",
  "history",
  "ancient history",
  "archaeology",
  "anthropology",
  "world war ii",
  "social life and customs",
  "health and wellness",
  "cooking",
  "cookbooks",
  "mental health",
  "exercise",
  "nutrition",
  "self-help",
  "biography",
  "autobiographies",
  "history",
  "politics and government",
  "world war ii",
  "women",
  "kings and rulers",
  "composers",
  "artists",
  "social sciences",
  "anthropology",
  "religion",
  "political science",
  "psychology",
  "places",
  "brazil",
  "india",
  "indonesia",
  "united states",
  "textbooks",
  "history",
  "mathematics",
  "geography",
  "psychology",
  "algebra",
  "education",
  "business and economics",
  "science",
  "chemistry",
  "english language",
  "physics",
  "computer science",
  "books by language",
  "english",
  "french",
  "spanish",
  "german",
  "russian",
  "italian",
  "chinese",
  "japanese"
];LIMIT = 100

OUTPUT_PATH = Path("data/raw/openlibrary_raw.json")


def fetch_subject(subject: str):
    url = f"{base_url_path}/{subject}.json?limit={LIMIT}"
    response = requests.get(url)

    if response.status_code != 200:
        print(f"[ERROR] Failed to fetch subject: {subject}")
        return []

    data = response.json()
    return data.get("works", [])


def main():
    all_books = {}
    
    for subject in SUBJECTS:
        print(f"[INFO] Fetching subject: {subject}")
        works = fetch_subject(subject)

        for work in works:
            work_key = work.get("key")

            if not work_key:
                continue

            if work_key not in all_books:
                work["source_subject"] = subject
                all_books[work_key] = work

        time.sleep(1)  # be nice to the API

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(list(all_books.values()), f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Saved {len(all_books)} books to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
