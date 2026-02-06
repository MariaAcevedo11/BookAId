import json
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_PATH = Path("data/processed/books_clean.json")
TOP_K = 10


class BookRecommender:
    def __init__(self):
        self.books = self._load_books()
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=5000
        )
        self.book_vectors = self.vectorizer.fit_transform(
            [book["text"] for book in self.books]
        )

    def _load_books(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def recommend(self, query: str, top_k: int = TOP_K):
        if not query.strip():
            return []

        query_vector = self.vectorizer.transform([query.lower()])
        similarities = cosine_similarity(query_vector, self.book_vectors)[0]

        ranked_indices = similarities.argsort()[::-1][:top_k]

        recommendations = []
        for idx in ranked_indices:
            book = self.books[idx]
            recommendations.append({
                "id": book["id"],
                "title": book["title"],
                "score": float(similarities[idx])
            })

        return recommendations
