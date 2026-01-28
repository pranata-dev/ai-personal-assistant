// Enhanced Web Search using DuckDuckGo Instant Answers + Wikipedia
// Priority: Direct Wikipedia articles > DuckDuckGo > Wikipedia Search

interface SearchResult {
    title: string;
    snippet: string;
    url: string;
    source: 'duckduckgo' | 'wikipedia';
}

// Special handler for common "current leader" queries - directly fetch Wikipedia article
async function fetchCurrentLeader(query: string): Promise<SearchResult | null> {
    const lowerQuery = query.toLowerCase();

    // Map common queries to Wikipedia article titles
    const leaderMappings: { patterns: string[]; articleTitle: string; lang: 'id' | 'en' }[] = [
        {
            patterns: ['presiden indonesia', 'president of indonesia', 'siapa presiden', 'indonesian president'],
            articleTitle: 'President_of_Indonesia',
            lang: 'en'
        },
        {
            patterns: ['wakil presiden', 'vice president of indonesia'],
            articleTitle: 'Vice_President_of_Indonesia',
            lang: 'en'
        },
        {
            patterns: ['gubernur jakarta', 'governor of jakarta'],
            articleTitle: 'Governor_of_Jakarta',
            lang: 'en'
        }
    ];

    for (const mapping of leaderMappings) {
        if (mapping.patterns.some(p => lowerQuery.includes(p))) {
            console.log(`🎯 Direct fetch for: ${mapping.articleTitle}`);
            try {
                const response = await fetch(
                    `https://${mapping.lang}.wikipedia.org/api/rest_v1/page/summary/${mapping.articleTitle}`,
                    {
                        headers: {
                            'User-Agent': 'AIAssistant/1.0',
                            'Accept': 'application/json'
                        }
                    }
                );

                if (!response.ok) continue;

                const data = await response.json();
                if (data.extract) {
                    console.log(`✅ Found direct Wikipedia article: ${data.title}`);
                    return {
                        title: data.title,
                        snippet: data.extract,
                        url: data.content_urls?.desktop?.page || '',
                        source: 'wikipedia'
                    };
                }
            } catch (e) {
                console.error('Direct fetch error:', e);
            }
        }
    }
    return null;
}

// DuckDuckGo Instant Answer API - Great for quick facts & current info
async function searchDuckDuckGo(query: string): Promise<SearchResult | null> {
    try {
        // Also try English version for better results
        const englishQuery = query
            .replace(/siapa\s*(itu)?\s*/gi, 'who is ')
            .replace(/presiden indonesia/gi, 'president of indonesia')
            .replace(/saat ini/gi, 'current')
            .replace(/sekarang/gi, 'current');

        const encodedQuery = encodeURIComponent(englishQuery);
        console.log('🦆 DuckDuckGo search for:', englishQuery);

        const response = await fetch(
            `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`,
            {
                headers: {
                    'User-Agent': 'AIAssistant/1.0'
                }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        // Check Abstract (main answer)
        if (data.Abstract && data.Abstract.length > 50) {
            console.log('✅ DuckDuckGo Abstract found:', data.Heading);
            return {
                title: data.Heading || query,
                snippet: data.Abstract,
                url: data.AbstractURL || '',
                source: 'duckduckgo'
            };
        }

        // Check Answer (quick facts like "Who is the president of...")
        if (data.Answer && data.Answer.length > 10) {
            console.log('✅ DuckDuckGo Answer found');
            return {
                title: data.AnswerType || 'Quick Answer',
                snippet: data.Answer,
                url: '',
                source: 'duckduckgo'
            };
        }

        // Check Infobox (structured data)
        if (data.Infobox?.content?.length > 0) {
            const infoLines = data.Infobox.content
                .slice(0, 5)
                .map((item: { label: string; value: string }) => `${item.label}: ${item.value}`)
                .join('\n');
            if (infoLines) {
                console.log('✅ DuckDuckGo Infobox found');
                return {
                    title: data.Heading || query,
                    snippet: infoLines,
                    url: data.AbstractURL || '',
                    source: 'duckduckgo'
                };
            }
        }

        // Check Related Topics for quick definitions
        if (data.RelatedTopics?.length > 0 && data.RelatedTopics[0]?.Text) {
            const firstTopic = data.RelatedTopics[0];
            console.log('✅ DuckDuckGo Related Topic found');
            return {
                title: firstTopic.FirstURL?.split('/').pop()?.replace(/_/g, ' ') || query,
                snippet: firstTopic.Text,
                url: firstTopic.FirstURL || '',
                source: 'duckduckgo'
            };
        }

        console.log('❌ DuckDuckGo: No relevant instant answer');
        return null;
    } catch (error) {
        console.error('DuckDuckGo search error:', error);
        return null;
    }
}

// Wikipedia Search API - works reliably for encyclopedic content
async function searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
        // Clean query
        let cleanQuery = query
            .replace(/apa itu\s*/gi, '')
            .replace(/siapa\s*(itu)?\s*/gi, '')
            .replace(/what is\s*/gi, '')
            .replace(/who is\s*/gi, '')
            .replace(/jelaskan\s*(tentang)?\s*/gi, '')
            .replace(/explain\s*/gi, '')
            .replace(/berita\s*(tentang|terbaru)?\s*/gi, '')
            .replace(/info\s*(tentang)?\s*/gi, '')
            .replace(/cari\s*(tentang|kan)?\s*/gi, '')
            .replace(/saat ini/gi, '')
            .replace(/sekarang/gi, '')
            .replace(/current/gi, '')
            .replace(/\?/g, '')
            .trim();

        if (!cleanQuery) return [];

        // Specific fix for "siapa presiden"
        if (cleanQuery.toLowerCase().includes('presiden') && !cleanQuery.toLowerCase().includes('indonesia')) {
            cleanQuery += ' indonesia';
        }

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
                url: data.content_urls?.desktop?.page || '',
                source: 'wikipedia'
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
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                    source: 'wikipedia'
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

// Main search function - tries direct article fetch first, then DuckDuckGo, then Wikipedia search
export async function searchWeb(query: string): Promise<string> {
    console.log('🔍 Starting enhanced web search for:', query);

    // 0. Try direct article fetch for known queries (e.g., "president of indonesia")
    const directResult = await fetchCurrentLeader(query);
    if (directResult) {
        return formatSingleResult(directResult);
    }

    // 1. Try DuckDuckGo for instant answers (fast & current)
    const ddgResult = await searchDuckDuckGo(query);
    if (ddgResult) {
        return formatSingleResult(ddgResult);
    }

    // 2. Fallback to Wikipedia (reliable encyclopedic content)
    const wikiResults = await searchWikipedia(query);
    if (wikiResults.length > 0) {
        return formatSingleResult(wikiResults[0]);
    }

    console.log('❌ No search results found from any source');
    return '';
}

function formatSingleResult(result: SearchResult): string {
    let formatted = `SOURCE: ${result.source.toUpperCase()}\n`;
    formatted += `TITLE: ${result.title}\n`;
    formatted += `CONTENT: ${result.snippet}\n`;
    if (result.url) {
        formatted += `URL: ${result.url}\n`;
    }
    return formatted;
}

export function shouldSearch(message: string): boolean {
    const searchTriggers = [
        'berita', 'news', 'terbaru', 'latest', 'hari ini', 'today', 'update',
        'search', 'cari', 'carikan', 'google', 'info tentang',
        'apa itu', 'what is', 'who is', 'siapa itu', 'siapa',
        'kapan', 'when did', 'how to', 'cara', 'bagaimana',
        'harga', 'price', 'cuaca', 'weather', 'jelaskan', 'explain',
        'presiden', 'president', 'current', 'sekarang', 'saat ini',
        'terbaru', 'newest', 'gubernur', 'governor', 'menteri', 'minister'
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

    let formatted = '\n\n**Web Search Results:**\n';
    for (const result of results) {
        formatted += `\n**${result.title}** _(${result.source})_\n${result.snippet.slice(0, 300)}${result.snippet.length > 300 ? '...' : ''}\n`;
        if (result.url) {
            formatted += `Source: ${result.url}\n`;
        }
    }

    return formatted;
}
