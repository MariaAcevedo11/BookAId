import json
from pathlib import Path
import re

RAW_PATH = Path("data/raw/openlibrary_raw.json") 
PROCESSED_PATH = Path("data/processed/books_clean.json")

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"<.*?>", " ", text) 
    text = re.sub(r"[^a-z\s]", " ", text)  
    text = re.sub(r"\s+", " ", text).strip()  
    return text

def preprocess():
    with open(RAW_PATH, "r", encoding="utf-8") as f:
        raw_books = json.load(f)

    processed_books = []

    for book in raw_books:
        title = book.get("title", "").strip()
        subjects = book.get("subject", [])  # cambio aquí

        if not title or not subjects:
            continue

        subject_text = " ".join(subjects)

        description = book.get("description", "")
        if not description:
            description = ""

        combined_text = f"{title} {subject_text} {description}"
        combined_text = normalize_text(combined_text)

        processed_books.append({
            "id": book.get("key"),
            "title": title,
            "description": description,
            "source_subject": book.get("source_subject", ""),
            "text": combined_text
        })

    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(PROCESSED_PATH, "w", encoding="utf-8") as f:
        json.dump(processed_books, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Preprocessed {len(processed_books)} books")
    print(f"[OUTPUT] {PROCESSED_PATH}")


if __name__ == "__main__":
    preprocess()
