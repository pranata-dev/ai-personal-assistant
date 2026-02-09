/**
 * Retrieval Service (Free Web Search)
 * 
 * Uses DuckDuckGo via searchWeb for free, privacy-focused retrieval.
 * Replaces Jina AI to ensure 100% free infrastructure.
 */

import { log, logError } from './logger';
import { searchWeb } from './web-search';

// Configuration
const RETRIEVAL_TIMEOUT_MS = parseInt(process.env.RETRIEVAL_TIMEOUT_MS || '6000');
const RETRIEVAL_MAX_CHARS = parseInt(process.env.RETRIEVAL_MAX_CHARS || '2000');

export interface RetrievalResult {
    success: boolean;
    content: string;
    source?: string;
    truncated: boolean;
    processingTimeMs: number;
    error?: string;
}

/**
 * Fetch content from Free Web Search (via searchWeb)
 */
export async function fetchFromJina(query: string): Promise<RetrievalResult> {
    const startTime = Date.now();

    try {
        log('info', 'system', 'RETRIEVAL_START', {
            data: { query, service: 'free-web-search' }
        });

        // Use the free searchWeb utility (DuckDuckGo wrapper)
        // Note: searchWeb returns a string directly
        const searchResult = await searchWeb(query);

        const processingTimeMs = Date.now() - startTime;
        let content = searchResult;

        // Check if truncation needed
        const truncated = content.length > RETRIEVAL_MAX_CHARS;
        if (truncated) {
            content = content.substring(0, RETRIEVAL_MAX_CHARS) + '...';
        }

        log('info', 'system', 'RETRIEVAL_SUCCESS', {
            data: {
                query,
                contentLength: content.length,
                truncated,
                processingTimeMs
            }
        });

        return {
            success: true, // Assuming non-empty means success if no error thrown
            content,
            source: 'Free Web Search (DuckDuckGo)',
            truncated,
            processingTimeMs
        };

    } catch (error) {
        const processingTimeMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logError('system', 'RETRIEVAL_ERROR', error instanceof Error ? error : new Error(errorMessage));

        return {
            success: false,
            content: '',
            truncated: false,
            processingTimeMs,
            error: errorMessage
        };
    }
}

/**
 * Fetch content from a specific URL 
 * (Stubbed or simplified for free tier - might need a different free scraper if needed)
 * For now, we'll return a placeholder or try basic fetch if possible, 
 * but since Jina Reader was used, we'll mark it as unavailable or basic fetch.
 */
export async function fetchUrlContent(url: string): Promise<RetrievalResult> {
    // For free tier, we don't have a reliable Jina Reader API key.
    // We can try to use Jina Reader without key (rate limited) or just fail.
    // User requested "100% FREE", Jina has free tier. 
    // But instruction said "REMOVE all JINA_API_KEY checks".
    // We will try fetch without key.

    const startTime = Date.now();
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), RETRIEVAL_TIMEOUT_MS);

        const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
            headers: { 'Accept': 'text/plain' },
            signal: controller.signal
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);
        let content = await response.text();

        content = sanitizeContent(content);
        const truncated = content.length > RETRIEVAL_MAX_CHARS;
        if (truncated) content = content.substring(0, RETRIEVAL_MAX_CHARS) + '...';

        return {
            success: true,
            content,
            source: url,
            truncated,
            processingTimeMs: Date.now() - startTime
        };
    } catch (e) {
        return {
            success: false,
            content: '',
            truncated: false,
            processingTimeMs: Date.now() - startTime,
            error: 'Free URL fetch failed'
        };
    }
}

/**
 * Sanitize retrieved content
 * Remove HTML, scripts, excessive whitespace
 */
function sanitizeContent(content: string): string {
    return content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Build context prompt for LLM with retrieved data
 */
export function buildRetrievalContext(result: RetrievalResult): string {
    if (!result.success || !result.content) {
        return '';
    }

    return `
EXTERNAL CONTEXT (Retrieved from ${result.source || 'web search'}):
---
${result.content}
---

IMPORTANT INSTRUCTIONS FOR USING THIS DATA:
1. This is externally retrieved information, treat it as a reference, not absolute truth
2. If the information seems incomplete or uncertain, acknowledge this
3. Preface your response with: "Based on recent publicly available information..."
4. Do not fabricate additional details not present in the data
5. If the data conflicts with your training, prefer the retrieved data for recent events
`;
}
