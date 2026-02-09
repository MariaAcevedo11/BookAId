import json
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_PATH = Path("data/processed/books_clean.json")
TOP_K = 10
MIN_SCORE = 0.05  


class BookRecommender:
    def __init__(self):
        self.books = self._load_books()

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=10000,
            ngram_range=(1, 2)
        )

        self.book_vectors = self.vectorizer.fit_transform(
            [book["text"] for book in self.books]
        )

    def _load_books(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def _normalize_text(self, text: str) -> str:

        text = text.lower()
        text = re.sub(r"<.*?>", " ", text)      
        text = re.sub(r"[^a-z\s]", " ", text)    
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def recommend(self, query: str, top_k: int = TOP_K):
        if not query or not query.strip():
            return []

        query = self._normalize_text(query)
        if not query:
            return []

        query_vector = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, self.book_vectors)[0]

        ranked_indices = similarities.argsort()[::-1]

        recommendations = []
        for idx in ranked_indices:
            score = float(similarities[idx])

            if score < MIN_SCORE:
                break  

            book = self.books[idx]
            recommendations.append({
                "id": book["id"],
                "title": book["title"],
                "score": score
            })

            if len(recommendations) >= top_k:
                break

        return recommendations
