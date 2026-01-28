/**
 * Retrieval Service (Jina AI)
 * 
 * HTTP client for Jina AI Reader API.
 * Used for UP-TO-DATE INFORMATION retrieval only.
 * GLM 4.5 Air remains the ONLY reasoning engine.
 * 
 * DISCLAIMER: Jina AI is a DATA SOURCE, not a reasoning engine.
 * Retrieved content is treated as EXTERNAL CONTEXT, not ground truth.
 */

import { log, logError } from './logger';

// Jina AI Reader API (converts URLs/queries to readable text)
const JINA_READER_URL = 'https://r.jina.ai/';
const JINA_SEARCH_URL = 'https://s.jina.ai/';

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
 * Fetch content from Jina AI Search API
 * This searches the web and returns summarized content
 */
export async function fetchFromJina(query: string): Promise<RetrievalResult> {
    const startTime = Date.now();

    if (!process.env.JINA_API_KEY) {
        log('warn', 'system', 'RETRIEVAL_SKIPPED', { data: { reason: 'JINA_API_KEY missing' } });
        return {
            success: false,
            content: '',
            truncated: false,
            processingTimeMs: 0,
            error: 'Jina API Key missing'
        };
    }

    try {
        log('info', 'system', 'RETRIEVAL_START', {
            data: { query, service: 'jina-search' }
        });

        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RETRIEVAL_TIMEOUT_MS);

        const response = await fetch(`${JINA_SEARCH_URL}${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain',
                'X-No-Cache': 'true',
                'Authorization': `Bearer ${process.env.JINA_API_KEY}`
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Jina API returned ${response.status}`);
        }

        let content = await response.text();
        const processingTimeMs = Date.now() - startTime;

        // Sanitize content
        content = sanitizeContent(content);

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
            success: true,
            content,
            source: 'Jina AI Search',
            truncated,
            processingTimeMs
        };

    } catch (error) {
        const processingTimeMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check for timeout
        if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
            logError('system', 'RETRIEVAL_TIMEOUT', `Jina AI timeout after ${RETRIEVAL_TIMEOUT_MS}ms`);
            return {
                success: false,
                content: '',
                truncated: false,
                processingTimeMs,
                error: 'Retrieval timeout - continuing without external data'
            };
        }

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
 * Fetch content from a specific URL using Jina Reader
 */
export async function fetchUrlContent(url: string): Promise<RetrievalResult> {
    const startTime = Date.now();

    if (!process.env.JINA_API_KEY) {
        log('warn', 'system', 'RETRIEVAL_SKIPPED', { data: { reason: 'JINA_API_KEY missing' } });
        return {
            success: false,
            content: '',
            truncated: false,
            processingTimeMs: 0,
            source: url,
            error: 'Jina API Key missing'
        };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RETRIEVAL_TIMEOUT_MS);

        const response = await fetch(`${JINA_READER_URL}${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain',
                'Authorization': `Bearer ${process.env.JINA_API_KEY}`
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Jina Reader returned ${response.status}`);
        }

        let content = await response.text();
        const processingTimeMs = Date.now() - startTime;

        content = sanitizeContent(content);
        const truncated = content.length > RETRIEVAL_MAX_CHARS;
        if (truncated) {
            content = content.substring(0, RETRIEVAL_MAX_CHARS) + '...';
        }

        return {
            success: true,
            content,
            source: url,
            truncated,
            processingTimeMs
        };

    } catch (error) {
        const processingTimeMs = Date.now() - startTime;
        return {
            success: false,
            content: '',
            truncated: false,
            processingTimeMs,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Sanitize retrieved content
 * Remove HTML, scripts, excessive whitespace
 */
function sanitizeContent(content: string): string {
    return content
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove style content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove control characters
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Trim
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
