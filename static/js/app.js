/**
 * QuoteHub - Modern Client Application
 * Supports both GitHub Pages static hosting and Flask server mode
 */

(function () {
    'use strict';

    // State
    const state = {
        allQuotes: [],
        currentHeroQuote: null,
        searchQuery: '',
        selectedCategory: '',
        selectedAuthor: '',
        categories: [],
        authors: []
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

    // Data Management
    async function loadDataset() {
        try {
            // First try loading quotes.json directly (works seamlessly on GitHub Pages and local servers)
            const res = await fetch('./data/quotes.json');
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('Direct static fetch failed, trying API fallback...', err);
        }

        // Fallback to Flask API route
        try {
            const apiRes = await fetch('/api/quotes');
            const data = await apiRes.json();
            return data.quotes || [];
        } catch (err) {
            console.error('Failed to load quotes data', err);
            return [];
        }
    }

    function processMetadata(quotes) {
        const catMap = {};
        const authMap = {};

        quotes.forEach(q => {
            const cat = q.category || 'General';
            const auth = q.author || 'Unknown';
            catMap[cat] = (catMap[cat] || 0) + 1;
            authMap[auth] = (authMap[auth] || 0) + 1;
        });

        const categories = Object.keys(catMap).sort().map(k => ({ name: k, count: catMap[k] }));
        const authors = Object.keys(authMap).sort().map(k => ({ name: k, count: authMap[k] }));

        return { categories, authors };
    }

    function getRandomQuote(category = null) {
        let pool = state.allQuotes;
        if (category) {
            const filtered = pool.filter(q => q.category.toLowerCase() === category.toLowerCase());
            if (filtered.length > 0) pool = filtered;
        }
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function filterQuotes() {
        const q = state.searchQuery.toLowerCase();
        const cat = state.selectedCategory.toLowerCase();
        const auth = state.selectedAuthor.toLowerCase();

        return state.allQuotes.filter(item => {
            if (cat && (item.category || '').toLowerCase() !== cat) return false;
            if (auth && (item.author || '').toLowerCase() !== auth) return false;
            if (q) {
                const inQuote = (item.quote || '').toLowerCase().includes(q);
                const inAuthor = (item.author || '').toLowerCase().includes(q);
                if (!inQuote && !inAuthor) return false;
            }
            return true;
        });
    }

    // Render Functions
    function renderHeroQuote(quote) {
        if (!quote) return;
        state.currentHeroQuote = quote;

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

    function renderQuotesList(filteredQuotes) {
        elements.resultsCount.textContent = filteredQuotes.length;
        elements.quotesGrid.innerHTML = '';

        if (!filteredQuotes || filteredQuotes.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.quotesGrid.style.display = 'none';
        } else {
            elements.emptyState.classList.add('hidden');
            elements.quotesGrid.style.display = 'grid';

            filteredQuotes.forEach(item => {
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

        document.querySelectorAll('#category-pills .pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.category === category);
        });

        renderQuotesList(filterQuotes());
    }

    function setAuthor(author) {
        state.selectedAuthor = author;
        elements.selectAuthor.value = author;
        renderQuotesList(filterQuotes());
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

        renderQuotesList(filterQuotes());
    }

    // Event Listeners
    function setupEventListeners() {
        // Next Random Quote
        elements.btnNextQuote.addEventListener('click', () => {
            elements.btnNextQuote.disabled = true;
            const quote = getRandomQuote(state.selectedCategory);
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
            renderQuotesList(filterQuotes());
        }, 150);

        elements.searchInput.addEventListener('input', onSearchInput);

        // Clear Search Button
        elements.btnClearSearch.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.searchQuery = '';
            elements.btnClearSearch.style.display = 'none';
            renderQuotesList(filterQuotes());
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

        // Load 100 quotes
        const quotes = await loadDataset();
        state.allQuotes = quotes;

        const { categories, authors } = processMetadata(quotes);
        state.categories = categories;
        state.authors = authors;

        // Render header stats
        if (elements.totalQuotesStat) elements.totalQuotesStat.textContent = quotes.length;
        if (elements.totalCategoriesStat) elements.totalCategoriesStat.textContent = categories.length;

        // Render controls and initial view
        renderCategoryPills(categories);
        renderCategorySelect(categories);
        renderAuthorSelect(authors);
        renderQuotesList(quotes);

        // Render initial hero random quote
        const initialHero = getRandomQuote();
        renderHeroQuote(initialHero);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
