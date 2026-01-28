/**
 * Retrieval Intent Detection
 * 
 * Determines when to trigger Jina AI retrieval for up-to-date information.
 * GLM 4.5 Air remains the ONLY reasoning engine.
 * 
 * RULE: Only trigger retrieval for queries that genuinely need real-time data.
 */

// Keywords that TRIGGER retrieval (real-time/recent information needed)
const RETRIEVAL_TRIGGERS = [
    // Time-sensitive
    'today', 'latest', 'recent', 'current', 'now', 'live',
    'breaking', 'update', 'terbaru', 'hari ini', 'sekarang',

    // News and events
    'news', 'berita', 'announcement', 'happening', 'event',

    // Market and finance
    'price', 'stock', 'market', 'harga', 'saham', 'crypto', 'bitcoin',

    // Weather
    'weather', 'cuaca', 'forecast',

    // Sports
    'score', 'skor', 'match', 'pertandingan', 'game result',

    // Current leaders/officials
    'who is the president', 'siapa presiden', 'who is the',
    'current president', 'current leader', 'current ceo',

    // Trends
    'trending', 'viral', 'popular now',

    // Releases
    'release', 'launched', 'rilis', 'diluncurkan'
];

// Keywords that should NOT trigger retrieval (reasoning/personal tasks)
const NON_RETRIEVAL_PATTERNS = [
    // Personal tasks
    'remind me', 'ingatkan', 'set alarm', 'schedule',

    // Reasoning tasks
    'explain', 'jelaskan', 'calculate', 'hitung',
    'summarize this', 'translate', 'convert',

    // Casual conversation
    'hello', 'hi', 'halo', 'how are you', 'apa kabar',
    'thank you', 'terima kasih', 'thanks',

    // Help requests (about the assistant itself)
    'what can you do', 'help me', 'how to use',

    // Code/technical help (doesn't need real-time data)
    'code', 'function', 'program', 'debug', 'error',

    // Definitions (doesn't need real-time, use LLM knowledge)
    'what is the meaning of', 'define', 'definition'
];

export interface RetrievalIntent {
    shouldRetrieve: boolean;
    confidence: 'high' | 'medium' | 'low';
    matchedTrigger?: string;
    reason: string;
}

/**
 * Detect if user query requires real-time information retrieval
 */
export function detectRetrievalIntent(query: string): RetrievalIntent {
    const lowerQuery = query.toLowerCase().trim();

    // First, check if it matches non-retrieval patterns
    for (const pattern of NON_RETRIEVAL_PATTERNS) {
        if (lowerQuery.includes(pattern)) {
            return {
                shouldRetrieve: false,
                confidence: 'high',
                reason: `Matches non-retrieval pattern: "${pattern}"`
            };
        }
    }

    // Check for retrieval triggers
    for (const trigger of RETRIEVAL_TRIGGERS) {
        if (lowerQuery.includes(trigger)) {
            return {
                shouldRetrieve: true,
                confidence: 'high',
                matchedTrigger: trigger,
                reason: `Matches retrieval trigger: "${trigger}"`
            };
        }
    }

    // Check for question patterns about current state
    const currentStatePatterns = [
        /who is (?:the )?(?:current|new)?\s*\w+/i,
        /siapa\s+(?:presiden|menteri|gubernur)/i,
        /what (?:is|are) (?:the )?(?:latest|current|recent)/i,
        /apa\s+(?:berita|kabar|update)/i
    ];

    for (const pattern of currentStatePatterns) {
        if (pattern.test(lowerQuery)) {
            return {
                shouldRetrieve: true,
                confidence: 'medium',
                matchedTrigger: pattern.toString(),
                reason: 'Matches current state question pattern'
            };
        }
    }

    // Default: no retrieval needed
    return {
        shouldRetrieve: false,
        confidence: 'low',
        reason: 'No retrieval triggers detected'
    };
}

/**
 * Extract search query from user input for Jina AI
 * Cleans up the query for better search results
 */
export function extractSearchQuery(userInput: string): string {
    let query = userInput.trim();

    // Remove common prefixes
    const prefixesToRemove = [
        /^(please|can you|could you|tolong|bisa|cari)\s+/i,
        /^(search for|find|look up|cari|temukan)\s+/i,
        /^(what is|who is|when is|where is)\s+/i,
        /^(tell me about|info about|information on)\s+/i
    ];

    for (const prefix of prefixesToRemove) {
        query = query.replace(prefix, '');
    }

    // Add "latest" or "current" if asking about a person/position
    if (/presiden|president|ceo|leader|governor|gubernur/i.test(query)) {
        if (!/current|latest|terbaru|sekarang/i.test(query)) {
            query = `current ${query}`;
        }
    }

    return query.trim();
}
