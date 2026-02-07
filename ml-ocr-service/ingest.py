import requests
import json
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote

load_dotenv()

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

BASE_URL = os.getenv("BASE_URL")
OUTPUT_PATH = Path(os.getenv("OUTPUT_PATH", "data/raw/openlibrary_raw.json"))


SUBJECTS = list(set([
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
    "politics and government",
    "women",
    "kings and rulers",
    "composers",
    "artists",
    "social sciences",
    "religion",
    "political science",
    "psychology",
    "places",
    "brazil",
    "india",
    "indonesia",
    "united states",
    "textbooks",
    "geography",
    "algebra",
    "education",
    "science",
    "english language",
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
]))

def fetch_subject(subject: str):
    all_works = []
    offset = 0
    page_size = 50  # reduce page size for faster fetch
    max_pages = 3   # limit to 3 pages per subject (adjust as needed)

    encoded_subject = quote(subject.replace(" ", "_"))

    pages_fetched = 0

    while True:
        url = f"{BASE_URL}/{encoded_subject}.json?limit={page_size}&offset={offset}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            works = data.get("works", [])
            if not works:
                break
            all_works.extend(works)
            if len(works) < page_size:
                break

            offset += page_size
            pages_fetched += 1
            logging.info(f"Fetched {len(works)} works for subject '{subject}' (offset {offset})")

            if pages_fetched >= max_pages:
                logging.info(f"Reached max pages ({max_pages}) for subject '{subject}', stopping early.")
                break

        except requests.RequestException as e:
            logging.error(f"Failed to fetch subject '{subject}' at offset {offset}: {e}")
            break

    return all_works


def fetch_work_details(work_key: str):
    url = f"https://openlibrary.org{work_key}.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Extract only needed fields
        filtered_data = {
            "key": data.get("key"),
            "title": data.get("title"),
            "description": extract_description(data),
            "subjects": data.get("subjects", []),
            "authors": [author.get("author", {}).get("key") for author in data.get("authors", []) if author.get("author")],
            "first_publish_date": data.get("first_publish_date") or data.get("created", {}).get("value")
        }
        return filtered_data
    except requests.RequestException as e:
        logging.warning(f"Failed to fetch details for work {work_key}: {e}")
        return None

def extract_description(work_json):
    desc = work_json.get("description", "")
    if isinstance(desc, dict):
        return desc.get("value", "")
    return desc or ""

def main():
    all_books = {}

    for subject in SUBJECTS:
        logging.info(f"Fetching subject: {subject}")
        works = fetch_subject(subject)

        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_work = {
                executor.submit(fetch_work_details, work.get("key")): work for work in works if work.get("key")
            }

            for future in as_completed(future_to_work):
                work = future_to_work[future]
                work_key = work.get("key")
                if work_key in all_books:
                    continue
                details = future.result()
                if details:
                    description = extract_description(details)
                    work["description"] = description
                work["source_subject"] = subject
                all_books[work_key] = work

        time.sleep(1)  

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(list(all_books.values()), f, indent=2, ensure_ascii=False)

    logging.info(f"Saved {len(all_books)} books to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
