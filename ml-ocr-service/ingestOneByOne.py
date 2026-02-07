import requests
import json
from pathlib import Path

OUTPUT_PATH = Path("data/raw/openlibrary_raw.json")

def extract_description(work_json):
    desc = work_json.get("description", "")
    if isinstance(desc, dict):
        return desc.get("value", "")
    return desc or ""

def fetch_work_details(work_key: str):
    url = f"https://openlibrary.org{work_key}.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
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
        print(f"Failed to fetch details for work {work_key}: {e}")
        return None

def main():
    while True:
        book_key = input("Enter the book key (e.g. /works/OL12345W) or 'exit' to quit: ").strip()
        if book_key.lower() == "exit":
            break
        if not book_key.startswith("/works/"):
            print("Invalid book key format. It should start with '/works/'.")
            continue

        book_details = fetch_work_details(book_key)
        if book_details:
            print("\nFetched book details:")
            print(json.dumps(book_details, indent=2, ensure_ascii=False))

            # Optionally, save to file
            save = input("Save this book to file? (y/n): ").strip().lower()
            if save == "y":
                OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
                with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
                    json.dump(book_details, f, indent=2, ensure_ascii=False)
                print(f"Book saved to {OUTPUT_PATH}\n")
        else:
            print("Could not fetch book details.\n")

if __name__ == "__main__":
    main()
