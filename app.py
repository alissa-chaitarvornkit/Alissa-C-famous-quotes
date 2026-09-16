import json
import os
import random
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "quotes.json")

def load_quotes():
    """Load quotes from the JSON data file."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# Cache quotes in memory
QUOTES = load_quotes()

@app.route("/")
def index():
    """Render main SPA template."""
    return render_template("index.html")

@app.route("/api/quote/random", methods=["GET"])
def get_random_quote():
    """Return a single random quote, with optional category or author filtering."""
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    pool = QUOTES
    if category:
        pool = [q for q in pool if q.get("category", "").lower() == category]
    if author:
        pool = [q for q in pool if author in q.get("author", "").lower()]

    if not pool:
        return jsonify({"error": "No quotes match the specified filters."}), 404

    return jsonify(random.choice(pool))

@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """Return all quotes matching search query, category, and author."""
    q = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    results = QUOTES

    if category:
        results = [quote for quote in results if quote.get("category", "").lower() == category]

    if author:
        results = [quote for quote in results if quote.get("author", "").lower() == author]

    if q:
        results = [
            quote for quote in results
            if q in quote.get("quote", "").lower() or q in quote.get("author", "").lower()
        ]

    return jsonify({
        "total": len(results),
        "quotes": results
    })

@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Return list of distinct categories and quote count for each."""
    counts = {}
    for quote in QUOTES:
        cat = quote.get("category", "General")
        counts[cat] = counts.get(cat, 0) + 1
    
    categories = sorted([{"name": k, "count": v} for k, v in counts.items()], key=lambda x: x["name"])
    return jsonify(categories)

@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Return list of distinct authors and quote count for each."""
    counts = {}
    for quote in QUOTES:
        author = quote.get("author", "Unknown")
        counts[author] = counts.get(author, 0) + 1
    
    authors = sorted([{"name": k, "count": v} for k, v in counts.items()], key=lambda x: x["name"])
    return jsonify(authors)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
