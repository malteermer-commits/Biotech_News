// Globale Variablen für den State
let allArticles = [];
let bookmarkedArticles = JSON.parse(localStorage.getItem('biotech_bookmarks')) || [];
let showBookmarksOnly = false;

// Setze das aktuelle Jahr in der Fußzeile
document.getElementById('year').textContent = new Date().getFullYear();

// Event-Listener für den Bookmark-Toggle-Button
document.getElementById('toggle-bookmarks').addEventListener('click', () => {
    showBookmarksOnly = !showBookmarksOnly;
    
    const btnText = document.getElementById('toggle-bookmarks-text');
    if (showBookmarksOnly) {
        btnText.textContent = 'Alle News anzeigen';
        renderNews();
    } else {
        btnText.textContent = 'Gespeichert';
        renderNews();
    }
});

// Zähler initialisieren
updateBookmarkCount();

// Hauptfunktion zum Laden der Nachrichten
async function loadNews() {
    try {
        const response = await fetch('news.json');
        
        if (!response.ok) {
            throw new Error('Daten konnten nicht geladen werden.');
        }

        allArticles = await response.json();

        // Überprüfen, ob Artikel vorhanden sind
        if (!allArticles || allArticles.length === 0) {
            document.getElementById('top-news').innerHTML = '<div class="p-12 text-center text-xl text-gray-500">Aktuell keine Nachrichten verfügbar.</div>';
            return;
        }

        renderNews();

    } catch (error) {
        console.error('Fehler beim Laden der Nachrichten:', error);
        
        document.getElementById('top-news').innerHTML = `
            <div class="p-12 text-center text-red-500">
                <h3 class="text-2xl font-bold mb-2">Daten nicht gefunden!</h3>
                <p>Hast du die Datei <code>news.json</code> bereits durch das Node-Skript generieren lassen?</p>
                <p class="text-sm mt-4 text-gray-500">(Lokal zum Testen ausführen: <code>node fetch-news.js</code> in deinem Terminal)</p>
            </div>
        `;
    }
}

function renderNews() {
    const articlesToDisplay = showBookmarksOnly 
        ? allArticles.filter(a => isBookmarked(a.url))
        : allArticles;

    const topNewsContainer = document.getElementById('top-news');
    const gridContainer = document.getElementById('news-grid');
    
    topNewsContainer.innerHTML = '';
    gridContainer.innerHTML = '';

    if (articlesToDisplay.length === 0) {
        if (showBookmarksOnly) {
            topNewsContainer.innerHTML = '<div class="p-12 text-center text-xl text-gray-500">Du hast noch keine Artikel gespeichert.</div>';
        } else {
            topNewsContainer.innerHTML = '<div class="p-12 text-center text-xl text-gray-500">Aktuell keine Nachrichten verfügbar.</div>';
        }
        return;
    }

    // Wenn wir nur Bookmarks anzeigen, gibt es ggf. keine "Top-News" in diesem Sinne,
    // aber wir behalten das Layout bei.
    renderTopNews(articlesToDisplay[0]);
    
    if (articlesToDisplay.length > 1) {
        renderNewsGrid(articlesToDisplay.slice(1));
    }
}

function isBookmarked(url) {
    return bookmarkedArticles.some(a => a.url === url);
}

function toggleBookmark(article) {
    if (isBookmarked(article.url)) {
        bookmarkedArticles = bookmarkedArticles.filter(a => a.url !== article.url);
    } else {
        bookmarkedArticles.push(article);
    }
    
    localStorage.setItem('biotech_bookmarks', JSON.stringify(bookmarkedArticles));
    updateBookmarkCount();
    
    // UI neu rendern
    renderNews();
}

// Wird vom HTML (onclick) aufgerufen
window.handleBookmarkClick = function(encodedUrl) {
    const url = decodeURIComponent(encodedUrl);
    const article = allArticles.find(a => a.url === url);
    if (article) {
        toggleBookmark(article);
    }
};

function updateBookmarkCount() {
    document.getElementById('bookmark-count').textContent = bookmarkedArticles.length;
}

function getBookmarkButtonHtml(article) {
    const isSaved = isBookmarked(article.url);
    const fillClass = isSaved ? 'currentColor' : 'none';
    const textClass = isSaved ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600';
    
    // Url encodieren, um sie sicher an die Funktion zu übergeben
    const encodedUrl = encodeURIComponent(article.url);
    
    return `
        <button onclick="handleBookmarkClick('${encodedUrl}')" class="${textClass} transition-colors p-2 rounded-full hover:bg-indigo-50 focus:outline-none" title="${isSaved ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}">
            <svg class="w-6 h-6" fill="${fillClass}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
        </button>
    `;
}

function renderTopNews(article) {
    const topNewsContainer = document.getElementById('top-news');
    const imageUrl = article.urlToImage || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80';
    const publishDate = new Date(article.publishedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    
    topNewsContainer.innerHTML = `
        <div class="flex flex-col md:flex-row h-full">
            <div class="md:w-1/2 relative overflow-hidden">
                <img src="${imageUrl}" alt="${article.title}" class="w-full h-72 md:h-full object-cover transition-transform duration-700 hover:scale-105">
            </div>
            <div class="p-8 md:w-1/2 flex flex-col justify-center relative">
                <div class="absolute top-4 right-4">
                    ${getBookmarkButtonHtml(article)}
                </div>
                <div class="flex items-center mb-3 mt-4 md:mt-0">
                    <span class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">${article.source.name}</span>
                    <span class="text-gray-400 text-sm ml-4">${publishDate}</span>
                </div>
                <h3 class="text-3xl font-extrabold text-gray-900 mb-4 line-clamp-3 leading-tight hover:text-blue-700 transition-colors">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
                </h3>
                <p class="text-gray-600 text-lg mb-8 line-clamp-4">${article.description || 'Keine Zusammenfassung verfügbar.'}</p>
                <div class="mt-auto">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                        Artikel lesen
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                </div>
            </div>
        </div>
    `;
}

function renderNewsGrid(articles) {
    const gridContainer = document.getElementById('news-grid');
    gridContainer.innerHTML = '';

    articles.forEach(article => {
        const imageUrl = article.urlToImage || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
        const publishDate = new Date(article.publishedAt).toLocaleDateString('de-DE');
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group';
        
        card.innerHTML = `
            <div class="h-48 overflow-hidden relative">
                <img src="${imageUrl}" alt="${article.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                    ${getBookmarkButtonHtml(article)}
                </div>
            </div>
            <div class="p-6 flex flex-col flex-grow">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">${article.source.name}</span>
                    <span class="text-gray-400 text-xs">${publishDate}</span>
                </div>
                <h4 class="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
                </h4>
                <p class="text-gray-600 text-sm mb-6 line-clamp-3 flex-grow">${article.description || 'Keine Zusammenfassung verfügbar.'}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" 
                   class="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center mt-auto">
                    Weiterlesen 
                    <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </a>
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

// Startet den Ladevorgang beim Öffnen der Seite
loadNews();
