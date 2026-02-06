
from recommender import BookRecommender


def main():
    recommender = BookRecommender()

    test_queries = [
        "harry potter magic wizard school",
        "medieval fantasy dragons swords",
        "kids in a farm",
        "science fiction space future robots"
    ]

    for query in test_queries:
        print("\n" + "=" * 60)
        print(f"QUERY: {query}\n")

        results = recommender.recommend(query, top_k=10)

        for i, rec in enumerate(results, start=1):
            title = rec["title"]
            score = rec["score"]
            print(f"{i:02d}. {title}  |  score: {score:.3f}")


if __name__ == "__main__":
    main()
