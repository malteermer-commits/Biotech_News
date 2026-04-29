const fs = require('fs');

// ========================================================
// 1. HIER DEINEN API KEY EINTRAGEN (oder als Umgebungsvariable)
// ========================================================
const API_KEY = process.env.NEWS_API_KEY || 'DEIN_API_KEY_HIER'; 

// Themen: Medizin, Molekularbiologie, Biotechnologie
const QUERIES = ['medicine', 'molecular biology', 'biotechnology'];

// API URL zusammensetzen (sucht nach den Themen auf Englisch für bessere Ergebnisse)
const API_URL = `https://newsapi.org/v2/everything?q=(${encodeURIComponent(QUERIES.join(' OR '))})&language=en&sortBy=publishedAt&pageSize=20&apiKey=${API_KEY}`;

async function fetchNews() {
    console.log('Starte Datenabruf von NewsAPI...');
    
    // Überprüfen, ob der API Key geändert wurde
    if (API_KEY === 'DEIN_API_KEY_HIER') {
        console.error('FEHLER: Bitte setze die Umgebungsvariable NEWS_API_KEY (für GitHub Actions) oder trage deinen echten API-Key in der fetch-news.js Datei ein!');
        process.exit(1);
    }

    try {
        // Native Fetch-API von Node.js nutzen (erfordert Node 18+)
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error(`API Fehler: ${data.message}`);
        }

        let articles = data.articles;

        // ========================================================
        // Filter-Logik: Duplikate und fehlerhafte Einträge entfernen
        // ========================================================
        
        const seenTitles = new Set();
        const seenUrls = new Set();
        
        articles = articles.filter(article => {
            // Artikel ohne echten Titel überspringen
            if (!article.title || article.title === '[Removed]') return false;
            
            // Check auf Duplikate via URL oder Titel
            if (seenUrls.has(article.url) || seenTitles.has(article.title)) {
                return false; // Duplikat! Wir behalten es nicht.
            }
            
            seenUrls.add(article.url);
            seenTitles.add(article.title);
            return true; // Artikel ist neu, wir behalten ihn.
        });

        // ========================================================
        // Daten speichern
        // ========================================================
        
        // Speichere die gefilterten Daten in einer JSON-Datei
        fs.writeFileSync('news.json', JSON.stringify(articles, null, 2));
        
        console.log(`✅ Erfolgreich ${articles.length} gefilterte Artikel gespeichert in news.json`);

    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Nachrichten:', error.message);
        process.exit(1);
    }
}

// Skript ausführen
fetchNews();
