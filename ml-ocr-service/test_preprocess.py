import json
from pathlib import Path

path = Path("data/processed/books_clean.json")

with open(path, "r", encoding="utf-8") as f:
    books = json.load(f)

print("Total books:", len(books))
print("First book:", books[0])
print("Last book:", books[-1])
