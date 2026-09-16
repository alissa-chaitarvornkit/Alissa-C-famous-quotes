import json
import os
import unittest
from app import app, DATA_FILE, load_quotes

class QuoteAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_quotes_json_integrity(self):
        """Verify quotes.json exists, has exactly 100 quotes, and has required fields."""
        self.assertTrue(os.path.exists(DATA_FILE), f"Quotes file not found at {DATA_FILE}")
        quotes = load_quotes()
        self.assertEqual(len(quotes), 100, f"Expected 100 quotes, found {len(quotes)}")

        ids = set()
        for idx, q in enumerate(quotes, 1):
            self.assertIn("id", q)
            self.assertIn("quote", q)
            self.assertIn("author", q)
            self.assertIn("category", q)
            self.assertTrue(isinstance(q["id"], int))
            self.assertTrue(len(q["quote"].strip()) > 0)
            self.assertTrue(len(q["author"].strip()) > 0)
            self.assertTrue(len(q["category"].strip()) > 0)
            ids.add(q["id"])

        self.assertEqual(len(ids), 100, "All 100 quote IDs must be unique.")

    def test_index_route(self):
        """Verify the main route returns 200 and loads the HTML."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"QuoteHub", response.data)
        self.assertIn(b"Search by author", response.data)

    def test_random_quote_api(self):
        """Verify /api/quote/random returns a single valid quote."""
        response = self.client.get("/api/quote/random")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertIn("quote", data)
        self.assertIn("author", data)
        self.assertIn("category", data)

    def test_random_quote_with_category(self):
        """Verify /api/quote/random respects the category filter."""
        response = self.client.get("/api/quote/random?category=Technology")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["category"], "Technology")

    def test_get_quotes_all(self):
        """Verify /api/quotes returns all 100 quotes by default."""
        response = self.client.get("/api/quotes")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["total"], 100)
        self.assertEqual(len(data["quotes"]), 100)

    def test_search_by_author(self):
        """Verify searching for an author returns relevant quotes."""
        response = self.client.get("/api/quotes?q=Einstein")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreaterEqual(data["total"], 1)
        for q in data["quotes"]:
            self.assertIn("Einstein", q["author"])

    def test_search_by_keyword(self):
        """Verify searching by quote keyword matches in the text."""
        response = self.client.get("/api/quotes?q=computer")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreaterEqual(data["total"], 1)
        # Check that at least one matched "computer"
        matched = any("computer" in q["quote"].lower() or "computer" in q["author"].lower() for q in data["quotes"])
        self.assertTrue(matched)

    def test_filter_by_category(self):
        """Verify filtering by category returns only quotes in that category."""
        response = self.client.get("/api/quotes?category=Science")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreater(data["total"], 0)
        for q in data["quotes"]:
            self.assertEqual(q["category"], "Science")

    def test_categories_api(self):
        """Verify /api/categories returns category statistics that sum to 100."""
        response = self.client.get("/api/categories")
        self.assertEqual(response.status_code, 200)
        categories = response.get_json()
        self.assertGreater(len(categories), 0)
        total_count = sum(c["count"] for c in categories)
        self.assertEqual(total_count, 100)

    def test_authors_api(self):
        """Verify /api/authors returns distinct authors list with total quote count summing to 100."""
        response = self.client.get("/api/authors")
        self.assertEqual(response.status_code, 200)
        authors = response.get_json()
        self.assertGreater(len(authors), 0)
        total_count = sum(a["count"] for a in authors)
        self.assertEqual(total_count, 100)

if __name__ == "__main__":
    unittest.main()
