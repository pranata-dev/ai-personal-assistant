// Web search using multiple fallback methods

interface SearchResult {
    title: string;
    snippet: string;
    url: string;
}

// Use DuckDuckGo HTML search (more reliable than Instant Answer API)
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
        const encodedQuery = encodeURIComponent(query);

        // Use DuckDuckGo lite version which returns simpler HTML
        const response = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodedQuery}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            console.log('DuckDuckGo search failed:', response.status);
            return [];
        }

        const html = await response.text();
        const results: SearchResult[] = [];

        // Simple regex parsing for results
        // Look for result links and snippets
        const linkRegex = /<a[^>]+class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([^<]+)/gi;

        const links: { url: string; title: string }[] = [];
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
            links.push({ url: match[1], title: match[2] });
        }

        const snippets: string[] = [];
        while ((match = snippetRegex.exec(html)) !== null) {
            snippets.push(match[1].trim());
        }

        for (let i = 0; i < Math.min(links.length, 5); i++) {
            results.push({
                title: links[i]?.title || 'Result',
                snippet: snippets[i] || '',
                url: links[i]?.url || ''
            });
        }

        return results;
    } catch (error) {
        console.error('DuckDuckGo search error:', error);
        return [];
    }
}

// Fallback: Use Wikipedia API for "apa itu" / "siapa" questions
async function searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
        // Clean query for Wikipedia
        const cleanQuery = query
            .replace(/apa itu\s*/i, '')
            .replace(/siapa\s*/i, '')
            .replace(/what is\s*/i, '')
            .replace(/who is\s*/i, '')
            .replace(/\?/g, '')
            .trim();

        const encodedQuery = encodeURIComponent(cleanQuery);
        const response = await fetch(
            `https://id.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`
        );

        if (!response.ok) {
            // Try English Wikipedia
            const enResponse = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`
            );
            if (!enResponse.ok) return [];

            const data = await enResponse.json();
            if (data.extract) {
                return [{
                    title: data.title || cleanQuery,
                    snippet: data.extract,
                    url: data.content_urls?.desktop?.page || ''
                }];
            }
            return [];
        }

        const data = await response.json();
        if (data.extract) {
            return [{
                title: data.title || cleanQuery,
                snippet: data.extract,
                url: data.content_urls?.desktop?.page || ''
            }];
        }

        return [];
    } catch (error) {
        console.error('Wikipedia search error:', error);
        return [];
    }
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
    console.log('🔍 Starting web search for:', query);

    // Check if it's a definition/person question - use Wikipedia
    const isDefinitionQuery = /apa itu|siapa|what is|who is/i.test(query);

    if (isDefinitionQuery) {
        console.log('📚 Using Wikipedia for definition query');
        const wikiResults = await searchWikipedia(query);
        if (wikiResults.length > 0) {
            console.log('✅ Wikipedia found results');
            return wikiResults;
        }
    }

    // For other queries, try DuckDuckGo
    console.log('🦆 Using DuckDuckGo search');
    const ddgResults = await searchDuckDuckGo(query);

    if (ddgResults.length > 0) {
        console.log('✅ DuckDuckGo found', ddgResults.length, 'results');
        return ddgResults;
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
        'explain'
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
