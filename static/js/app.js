/**
 * QuoteHub - Modern Vanilla JavaScript Application
 */

(function () {
    'use strict';

    // State
    const state = {
        currentHeroQuote: null,
        searchQuery: '',
        selectedCategory: '',
        selectedAuthor: '',
        categories: [],
        authors: [],
        totalQuotesCount: 0
    };

    // DOM Elements
    const elements = {
        // Hero Spotlight
        heroCard: document.getElementById('spotlight-card'),
        heroCategory: document.getElementById('hero-category'),
        heroQuote: document.getElementById('hero-quote'),
        heroAuthor: document.getElementById('hero-author'),
        btnNextQuote: document.getElementById('btn-next-quote'),
        btnCopyHero: document.getElementById('btn-copy-hero'),
        copyIcon: document.getElementById('copy-icon'),
        copyText: document.getElementById('copy-text'),

        // Search & Filters
        searchInput: document.getElementById('search-input'),
        btnClearSearch: document.getElementById('btn-clear-search'),
        categoryPills: document.getElementById('category-pills'),
        selectCategory: document.getElementById('select-category'),
        selectAuthor: document.getElementById('select-author'),
        btnResetFilters: document.getElementById('btn-reset-filters'),
        btnEmptyReset: document.getElementById('btn-empty-reset'),

        // Results & Grid
        resultsCount: document.getElementById('results-count'),
        activeFilterIndicator: document.getElementById('active-filter-indicator'),
        quotesGrid: document.getElementById('quotes-grid'),
        emptyState: document.getElementById('empty-state'),
        totalQuotesStat: document.getElementById('total-quotes-stat'),
        totalCategoriesStat: document.getElementById('total-categories-stat'),

        // Toast
        toast: document.getElementById('toast')
    };

    // Utilities
    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function showToast(message = 'Quote copied to clipboard!') {
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 2500);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast();
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast();
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(textarea);
    }

    // API Calls
    async function fetchRandomQuote() {
        try {
            let url = '/api/quote/random';
            if (state.selectedCategory) {
                url += `?category=${encodeURIComponent(state.selectedCategory)}`;
            }
            const res = await fetch(url);
            if (!res.ok) {
                // Fallback to totally random if filter yields none
                const fallbackRes = await fetch('/api/quote/random');
                return await fallbackRes.json();
            }
            return await res.json();
        } catch (err) {
            console.error('Error fetching random quote:', err);
            return null;
        }
    }

    async function fetchCategories() {
        try {
            const res = await fetch('/api/categories');
            return await res.json();
        } catch (err) {
            console.error('Error fetching categories:', err);
            return [];
        }
    }

    async function fetchAuthors() {
        try {
            const res = await fetch('/api/authors');
            return await res.json();
        } catch (err) {
            console.error('Error fetching authors:', err);
            return [];
        }
    }

    async function fetchQuotes() {
        try {
            const params = new URLSearchParams();
            if (state.searchQuery) params.append('q', state.searchQuery);
            if (state.selectedCategory) params.append('category', state.selectedCategory);
            if (state.selectedAuthor) params.append('author', state.selectedAuthor);

            const res = await fetch(`/api/quotes?${params.toString()}`);
            return await res.json();
        } catch (err) {
            console.error('Error fetching quotes:', err);
            return { total: 0, quotes: [] };
        }
    }

    // Render Functions
    function renderHeroQuote(quote) {
        if (!quote) return;
        state.currentHeroQuote = quote;

        // Fade out
        elements.heroQuote.style.opacity = '0';
        elements.heroAuthor.style.opacity = '0';

        setTimeout(() => {
            elements.heroQuote.textContent = `“${quote.quote}”`;
            elements.heroAuthor.textContent = `— ${quote.author}`;
            elements.heroCategory.textContent = quote.category;
            elements.heroCategory.setAttribute('data-cat', quote.category);

            elements.heroQuote.style.opacity = '1';
            elements.heroAuthor.style.opacity = '1';
        }, 150);
    }

    function renderCategoryPills(categories) {
        elements.categoryPills.innerHTML = '';

        // "All" Pill
        const allBtn = document.createElement('button');
        allBtn.className = `pill ${state.selectedCategory === '' ? 'active' : ''}`;
        allBtn.textContent = 'All';
        allBtn.dataset.category = '';
        allBtn.addEventListener('click', () => setCategory(''));
        elements.categoryPills.appendChild(allBtn);

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `pill ${state.selectedCategory === cat.name ? 'active' : ''}`;
            btn.textContent = `${cat.name} (${cat.count})`;
            btn.dataset.category = cat.name;
            btn.addEventListener('click', () => setCategory(cat.name));
            elements.categoryPills.appendChild(btn);
        });
    }

    function renderCategorySelect(categories) {
        elements.selectCategory.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = `${cat.name} (${cat.count})`;
            elements.selectCategory.appendChild(opt);
        });
    }

    function renderAuthorSelect(authors) {
        elements.selectAuthor.innerHTML = '<option value="">All Authors</option>';
        authors.forEach(auth => {
            const opt = document.createElement('option');
            opt.value = auth.name;
            opt.textContent = `${auth.name} (${auth.count})`;
            elements.selectAuthor.appendChild(opt);
        });
    }

    function renderQuotesList(quotesData) {
        elements.resultsCount.textContent = quotesData.total;
        elements.quotesGrid.innerHTML = '';

        if (!quotesData.quotes || quotesData.quotes.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.quotesGrid.style.display = 'none';
        } else {
            elements.emptyState.classList.add('hidden');
            elements.quotesGrid.style.display = 'grid';

            quotesData.quotes.forEach(item => {
                const card = createQuoteCard(item);
                elements.quotesGrid.appendChild(card);
            });
        }

        updateFilterIndicator();
    }

    function createQuoteCard(item) {
        const card = document.createElement('article');
        card.className = 'quote-card';

        const cardTop = document.createElement('div');
        cardTop.className = 'card-top';

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.setAttribute('data-cat', item.category);
        badge.textContent = item.category;
        badge.title = `Click to filter by ${item.category}`;
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            setCategory(item.category);
        });
        cardTop.appendChild(badge);

        const idBadge = document.createElement('span');
        idBadge.className = 'count-pill';
        idBadge.textContent = `#${item.id}`;
        cardTop.appendChild(idBadge);

        const quoteText = document.createElement('blockquote');
        quoteText.className = 'card-quote-text';
        quoteText.textContent = `“${item.quote}”`;

        const cardBottom = document.createElement('div');
        cardBottom.className = 'card-bottom';

        const author = document.createElement('cite');
        author.className = 'card-author';
        author.textContent = `— ${item.author}`;
        author.title = `Click to filter by ${item.author}`;
        author.style.cursor = 'pointer';
        author.addEventListener('click', () => {
            setAuthor(item.author);
        });

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn-card-copy';
        copyBtn.title = 'Copy quote';
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.addEventListener('click', () => {
            copyToClipboard(`"${item.quote}" — ${item.author}`);
        });
        actions.appendChild(copyBtn);

        cardBottom.appendChild(author);
        cardBottom.appendChild(actions);

        card.appendChild(cardTop);
        card.appendChild(quoteText);
        card.appendChild(cardBottom);

        return card;
    }

    function updateFilterIndicator() {
        const filters = [];
        if (state.searchQuery) filters.push(`search: "${state.searchQuery}"`);
        if (state.selectedCategory) filters.push(`category: "${state.selectedCategory}"`);
        if (state.selectedAuthor) filters.push(`author: "${state.selectedAuthor}"`);

        if (filters.length > 0) {
            elements.activeFilterIndicator.textContent = `Filtered by ${filters.join(', ')}`;
        } else {
            elements.activeFilterIndicator.textContent = '';
        }
    }

    // Filter Actions
    function setCategory(category) {
        state.selectedCategory = category;
        elements.selectCategory.value = category;

        // Update pills active state
        document.querySelectorAll('#category-pills .pill').forEach(pill => {
            if (pill.dataset.category === category) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        refreshQuotes();
    }

    function setAuthor(author) {
        state.selectedAuthor = author;
        elements.selectAuthor.value = author;
        refreshQuotes();
    }

    async function refreshQuotes() {
        const data = await fetchQuotes();
        renderQuotesList(data);
    }

    function resetFilters() {
        state.searchQuery = '';
        state.selectedCategory = '';
        state.selectedAuthor = '';

        elements.searchInput.value = '';
        elements.btnClearSearch.style.display = 'none';
        elements.selectCategory.value = '';
        elements.selectAuthor.value = '';

        document.querySelectorAll('#category-pills .pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.category === '');
        });

        refreshQuotes();
    }

    // Event Listeners
    function setupEventListeners() {
        // Random Quote Hero Button
        elements.btnNextQuote.addEventListener('click', async () => {
            elements.btnNextQuote.disabled = true;
            const quote = await fetchRandomQuote();
            renderHeroQuote(quote);
            setTimeout(() => { elements.btnNextQuote.disabled = false; }, 200);
        });

        // Copy Hero Quote
        elements.btnCopyHero.addEventListener('click', () => {
            if (state.currentHeroQuote) {
                copyToClipboard(`"${state.currentHeroQuote.quote}" — ${state.currentHeroQuote.author}`);
                elements.copyText.textContent = 'Copied!';
                setTimeout(() => {
                    elements.copyText.textContent = 'Copy Quote';
                }, 1500);
            }
        });

        // Search Input (debounced)
        const onSearchInput = debounce((e) => {
            state.searchQuery = e.target.value.trim();
            elements.btnClearSearch.style.display = state.searchQuery ? 'block' : 'none';
            refreshQuotes();
        }, 200);

        elements.searchInput.addEventListener('input', onSearchInput);

        // Clear Search Button
        elements.btnClearSearch.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.searchQuery = '';
            elements.btnClearSearch.style.display = 'none';
            refreshQuotes();
        });

        // Category Dropdown
        elements.selectCategory.addEventListener('change', (e) => {
            setCategory(e.target.value);
        });

        // Author Dropdown
        elements.selectAuthor.addEventListener('change', (e) => {
            setAuthor(e.target.value);
        });

        // Reset Filter Buttons
        elements.btnResetFilters.addEventListener('click', resetFilters);
        elements.btnEmptyReset.addEventListener('click', resetFilters);
    }

    // Initialization
    async function init() {
        setupEventListeners();

        // 1. Fetch categories and authors in parallel
        const [categories, authors, initialQuotes, heroQuote] = await Promise.all([
            fetchCategories(),
            fetchAuthors(),
            fetchQuotes(),
            fetchRandomQuote()
        ]);

        state.categories = categories;
        state.authors = authors;
        state.totalQuotesCount = initialQuotes.total;

        // Render stats in header
        if (elements.totalQuotesStat) elements.totalQuotesStat.textContent = initialQuotes.total;
        if (elements.totalCategoriesStat) elements.totalCategoriesStat.textContent = categories.length;

        // Render components
        renderCategoryPills(categories);
        renderCategorySelect(categories);
        renderAuthorSelect(authors);
        renderQuotesList(initialQuotes);
        renderHeroQuote(heroQuote);
    }

    // Boot
    document.addEventListener('DOMContentLoaded', init);
})();
