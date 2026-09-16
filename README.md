# QuoteHub - 100 Famous Quotes Web Application

A lightweight, modern web application built with **Python Flask**, **Plain Vanilla JavaScript**, **HTML5**, and **CSS3**.

Explore a curated collection of 100 well-known quotes across science, philosophy, literature, technology, art, and leadership.

---

## Features

- **Quote Spotlight**: Displays an inspiring random quote of the moment with a smooth transition and instant copy-to-clipboard button.
- **Random Quote Generator**: Click "🎲 Next Random Quote" to fetch new quotes dynamically without page reloads.
- **Instant Search**: Search through 100 quotes by author name or quote text with debounced live search.
- **Category Filtering**: Filter quotes across 8 categories (Technology, Science, Philosophy, Wisdom, Inspiration, Leadership, Literature, Art) using quick-filter pills or dropdown.
- **Author Filtering**: Select any author from the dynamic dropdown to view all quotes by that author.
- **Zero Frontend Build Dependencies**: Pure HTML5, CSS3, and standard modern ES6+ JavaScript (`fetch`, DOM manipulation, event delegation).
- **Responsive Design**: Designed for desktop, tablet, and mobile screens.

---

## Directory Structure

```text
agy-cli-projects/
├── app.py                  # Flask server and REST API routes
├── requirements.txt        # Python dependencies (Flask)
├── test_app.py             # Unit test suite (10 test cases)
├── data/
│   └── quotes.json         # Curated collection of 100 quotes
├── static/
│   ├── css/
│   │   └── style.css       # Responsive styling and design system
│   └── js/
│       └── app.js          # Vanilla JavaScript application
└── templates/
    └── index.html          # Semantic HTML5 template
```

---

## Getting Started

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Run the Application
```powershell
python app.py
```
Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

### 3. Run Automated Tests
```powershell
python -m unittest test_app.py -v
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web application interface |
| `GET` | `/api/quote/random` | Returns a random quote (supports `?category=` and `?author=`) |
| `GET` | `/api/quotes` | Returns filtered quotes (supports `?q=`, `?category=`, `?author=`) |
| `GET` | `/api/categories` | Returns all categories with quote counts |
| `GET` | `/api/authors` | Returns all authors with quote counts |
