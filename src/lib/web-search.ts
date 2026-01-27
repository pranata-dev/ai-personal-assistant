// Web search using DuckDuckGo Instant Answer API (no API key needed!)

interface SearchResult {
    title: string;
    snippet: string;
    url: string;
}

interface DDGResponse {
    Abstract?: string;
    AbstractText?: string;
    AbstractSource?: string;
    AbstractURL?: string;
    RelatedTopics?: Array<{
        Text?: string;
        FirstURL?: string;
    }>;
    Answer?: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
    try {
        // Use DuckDuckGo Instant Answer API
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
        );

        if (!response.ok) {
            console.error('Search failed:', response.status);
            return [];
        }

        const data: DDGResponse = await response.json();
        const results: SearchResult[] = [];

        // Add abstract if available
        if (data.AbstractText) {
            results.push({
                title: data.AbstractSource || 'Summary',
                snippet: data.AbstractText,
                url: data.AbstractURL || ''
            });
        }

        // Add answer if available
        if (data.Answer) {
            results.push({
                title: 'Quick Answer',
                snippet: data.Answer,
                url: ''
            });
        }

        // Add related topics
        if (data.RelatedTopics) {
            for (const topic of data.RelatedTopics.slice(0, 5)) {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.split(' - ')[0] || 'Related',
                        snippet: topic.Text,
                        url: topic.FirstURL
                    });
                }
            }
        }

        return results.slice(0, 5); // Return max 5 results
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
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
        'google',
        'info tentang',
        'apa itu',
        'what is',
        'who is',
        'siapa',
        'kapan',
        'when',
        'how to',
        'cara',
        'harga',
        'price',
        'cuaca',
        'weather'
    ];

    const lowerMessage = message.toLowerCase();
    return searchTriggers.some(trigger => lowerMessage.includes(trigger));
}

export function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
        return '';
    }

    let formatted = '\n\n📌 **Hasil Pencarian Web:**\n';
    for (const result of results) {
        formatted += `\n• **${result.title}**\n  ${result.snippet.slice(0, 200)}${result.snippet.length > 200 ? '...' : ''}\n`;
        if (result.url) {
            formatted += `  🔗 ${result.url}\n`;
        }
    }

    return formatted;
}
