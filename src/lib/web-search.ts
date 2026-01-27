// Web search using Wikipedia REST API (most reliable free option)

interface SearchResult {
    title: string;
    snippet: string;
    url: string;
}

// Wikipedia Search API - works reliably!
async function searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
        // Clean query
        const cleanQuery = query
            .replace(/apa itu\s*/gi, '')
            .replace(/siapa\s*(itu)?\s*/gi, '')
            .replace(/what is\s*/gi, '')
            .replace(/who is\s*/gi, '')
            .replace(/jelaskan\s*(tentang)?\s*/gi, '')
            .replace(/explain\s*/gi, '')
            .replace(/berita\s*(tentang|terbaru)?\s*/gi, '')
            .replace(/info\s*(tentang)?\s*/gi, '')
            .replace(/cari\s*(tentang|kan)?\s*/gi, '')
            .replace(/\?/g, '')
            .trim();

        if (!cleanQuery) return [];

        console.log('📚 Wikipedia search for:', cleanQuery);

        // First, try Indonesian Wikipedia
        const idResults = await fetchWikipediaSummary(cleanQuery, 'id');
        if (idResults.length > 0) return idResults;

        // Fallback to English Wikipedia
        const enResults = await fetchWikipediaSummary(cleanQuery, 'en');
        if (enResults.length > 0) return enResults;

        // If direct lookup fails, try search API
        return await searchWikipediaAPI(cleanQuery);
    } catch (error) {
        console.error('Wikipedia search error:', error);
        return [];
    }
}

async function fetchWikipediaSummary(query: string, lang: 'id' | 'en'): Promise<SearchResult[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`,
            {
                headers: {
                    'User-Agent': 'AIAssistant/1.0',
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        if (data.extract && data.type !== 'disambiguation') {
            console.log(`✅ Found Wikipedia (${lang}) article:`, data.title);
            return [{
                title: data.title || query,
                snippet: data.extract,
                url: data.content_urls?.desktop?.page || ''
            }];
        }
        return [];
    } catch {
        return [];
    }
}

async function searchWikipediaAPI(query: string): Promise<SearchResult[]> {
    try {
        const encodedQuery = encodeURIComponent(query);

        // Use Wikipedia's search API
        const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&origin=*&srlimit=3`,
            {
                headers: {
                    'User-Agent': 'AIAssistant/1.0'
                }
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const results: SearchResult[] = [];

        if (data.query?.search) {
            for (const item of data.query.search.slice(0, 3)) {
                // Remove HTML tags from snippet
                const cleanSnippet = item.snippet?.replace(/<[^>]*>/g, '') || '';
                results.push({
                    title: item.title,
                    snippet: cleanSnippet,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
                });
            }
            console.log(`✅ Wikipedia search found ${results.length} results`);
        }

        return results;
    } catch (error) {
        console.error('Wikipedia API search error:', error);
        return [];
    }
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
    console.log('🔍 Starting web search for:', query);

    const results = await searchWikipedia(query);

    if (results.length > 0) {
        return results;
    }

    console.log('❌ No search results found');
    return [];
}

export function shouldSearch(message: string): boolean {
    const searchTriggers = [
        'berita',
        'news',
        'terbaru',
        'latest',
        'hari ini',
        'today',
        'update',
        'search',
        'cari',
        'carikan',
        'google',
        'info tentang',
        'apa itu',
        'what is',
        'who is',
        'siapa itu',
        'siapa',
        'kapan',
        'when did',
        'how to',
        'cara',
        'bagaimana',
        'harga',
        'price',
        'cuaca',
        'weather',
        'jelaskan',
        'explain',
        'presiden',
        'president'
    ];

    const lowerMessage = message.toLowerCase();
    const shouldTrigger = searchTriggers.some(trigger => lowerMessage.includes(trigger));

    if (shouldTrigger) {
        console.log('🎯 Search triggered by keyword match');
    }

    return shouldTrigger;
}

export function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
        return '';
    }

    let formatted = '\n\n📌 **Hasil Pencarian Web:**\n';
    for (const result of results) {
        formatted += `\n• **${result.title}**\n  ${result.snippet.slice(0, 300)}${result.snippet.length > 300 ? '...' : ''}\n`;
        if (result.url) {
            formatted += `  🔗 ${result.url}\n`;
        }
    }

    return formatted;
}
