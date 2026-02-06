import requests
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import os 

load_dotenv()

base_url_path = os.getenv("BASE_URL")
SUBJECTS = ["fantasy", "science_fiction", "history"]
LIMIT = 100

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
