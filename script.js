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

        if (!allArticles || allArticles.length === 0) {
            document.getElementById('top-news').innerHTML = '<div class="p-16 text-center text-2xl text-forest font-bold">Aktuell keine Nachrichten verfügbar.</div>';
            return;
        }

        renderNews();

    } catch (error) {
        console.error('Fehler beim Laden der Nachrichten:', error);
        
        document.getElementById('top-news').innerHTML = `
            <div class="p-16 text-center text-red-700 bg-mint rounded-[2.5rem]">
                <h3 class="text-3xl font-black mb-4">Daten nicht gefunden!</h3>
                <p class="text-forest text-lg font-medium">Hast du die Datei <code>news.json</code> bereits generieren lassen?</p>
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
            topNewsContainer.innerHTML = '<div class="p-16 text-center text-2xl text-forest font-bold">Du hast noch keine Artikel gespeichert.</div>';
        } else {
            topNewsContainer.innerHTML = '<div class="p-16 text-center text-2xl text-forest font-bold">Aktuell keine Nachrichten verfügbar.</div>';
        }
        return;
    }

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
    renderNews();
}

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
    const textClass = isSaved ? 'text-forest' : 'text-forest/40 hover:text-forest';
    const encodedUrl = encodeURIComponent(article.url);
    
    return `
        <button onclick="handleBookmarkClick('${encodedUrl}')" class="${textClass} transition-colors p-2.5 rounded-full hover:bg-black/5 focus:outline-none" title="${isSaved ? 'Lesezeichen entfernen' : 'Lesezeichen hinzufügen'}">
            <svg class="w-7 h-7" fill="${fillClass}" stroke="currentColor" viewBox="0 0 24 24">
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
                <img src="${imageUrl}" alt="${article.title}" class="w-full h-80 md:h-full object-cover transition-transform duration-1000 hover:scale-105">
            </div>
            <div class="p-10 md:p-14 md:w-1/2 flex flex-col justify-center relative bg-mint">
                <div class="absolute top-6 right-6 bg-mint/90 backdrop-blur shadow-sm rounded-full">
                    ${getBookmarkButtonHtml(article)}
                </div>
                <div class="flex items-center mb-6 mt-4 md:mt-0">
                    <span class="bg-forest text-mint text-xs font-black px-4 py-1.5 rounded-full tracking-wider uppercase">${article.source.name}</span>
                    <span class="text-forest/60 font-bold text-sm ml-4">${publishDate}</span>
                </div>
                <h3 class="text-4xl md:text-5xl font-black text-forest mb-6 line-clamp-3 leading-[1.1] tracking-tight hover:text-forest/80 transition-colors">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
                </h3>
                <p class="text-forest/80 text-xl mb-10 line-clamp-4 font-medium leading-relaxed">${article.description || 'Keine Zusammenfassung verfügbar.'}</p>
                <div class="mt-auto">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" 
                       class="inline-flex items-center justify-center border-2 border-forest text-forest px-8 py-3.5 rounded-full font-bold hover:bg-forest hover:text-mint transition-all duration-300">
                        Read Article <span class="ml-2 font-bold text-xl leading-none">›</span>
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
        
        const card = document.createElement('div');
        card.className = 'bg-mint rounded-3xl overflow-hidden flex flex-col group relative transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl';
        
        card.innerHTML = `
            <div class="h-56 overflow-hidden relative m-2.5 rounded-[1.5rem]">
                <img src="${imageUrl}" alt="${article.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                <div class="absolute top-3 right-3 bg-mint/90 backdrop-blur-sm rounded-full shadow-sm">
                    ${getBookmarkButtonHtml(article)}
                </div>
            </div>
            <div class="p-6 flex flex-col flex-grow">
                <h4 class="text-xl font-black text-forest mb-3 line-clamp-2 leading-tight group-hover:text-forest/70 transition-colors">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
                </h4>
                <div class="flex justify-between items-center mt-auto pt-4">
                    <div class="text-forest/70 font-bold text-xs bg-forest/5 px-3 py-1.5 rounded-lg uppercase tracking-wide">
                        ${article.source.name}
                    </div>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="bg-forest text-mint rounded-full w-9 h-9 flex items-center justify-center hover:bg-forest/80 transition-colors shadow-md">
                        <span class="font-bold text-lg leading-none mt-0.5">›</span>
                    </a>
                </div>
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

// Startet den Ladevorgang beim Öffnen der Seite
loadNews();
