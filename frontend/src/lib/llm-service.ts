/**
 * LLM Service (Strict Single Model)
 * 
 * Exclusively uses GLM 4.5 Air with a Persistent Retry Queue.
 * No fallbacks, no model switching. Just patient retrying.
 */

import { PRIMARY_MODEL_ID } from './models';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface LLMRequest {
    messages: Array<{ role: string; content: string }>;
    model?: string; // Ignored, always uses PRIMARY
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface LLMResponse {
    content: string;
    modelUsed: string;
    fallbackUsed: boolean;
    tokensUsed?: number;
    processingTimeMs: number;
}

// Max 50 retries * 10s = ~8.3 minutes of patience
const MAX_RETRIES = 50;
const RETRY_CAP_MS = 10000; // Max wait between retries
const GLOBAL_TIMEOUT_MS = 600000; // 10 minutes

export async function callLLM(
    request: LLMRequest,
    apiKey: string
): Promise<LLMResponse> {
    const startTime = Date.now();
    const modelId = PRIMARY_MODEL_ID;

    console.log(`🚀 Starting Request: ${modelId}`);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 Retry Attempt ${attempt}/${MAX_RETRIES} for ${modelId}...`);
            }

            const response = await callOpenRouterAPI(
                modelId,
                request.messages,
                apiKey,
                request.temperature ?? 0.5,
                request.maxTokens ?? 1024
            );

            const processingTimeMs = Date.now() - startTime;
            return {
                content: response.content,
                modelUsed: modelId,
                fallbackUsed: false, // Concept no longer exists
                tokensUsed: response.tokensUsed,
                processingTimeMs
            };

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.includes('429');
            const isServerBusy = msg.includes('502') || msg.includes('503') || msg.includes('fetch failed');

            // Permanent errors (Auth, Bad Request) -> Fail immediately
            if (!isRateLimit && !isServerBusy) {
                console.error(`❌ Permanent Error: ${msg}`);
                throw error;
            }

            // Retryable errors
            if (attempt < MAX_RETRIES) {
                // Backoff: 2s, 4s, 8s, 10s...
                const backoff = Math.min(1000 * Math.pow(2, attempt + 1), RETRY_CAP_MS);
                console.warn(`⚠️ Error: ${msg}. Waiting ${backoff / 1000}s...`);
                await new Promise(r => setTimeout(r, backoff));
                continue;
            }

            throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${msg}`);
        }
    }

    throw new Error('Unexpected loop exit');
}

async function callOpenRouterAPI(
    model: string,
    messages: any[],
    apiKey: string,
    temperature: number,
    maxTokens: number
): Promise<{ content: string; tokensUsed?: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GLOBAL_TIMEOUT_MS);

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/pranata-dev',
                'X-Title': 'AI Assistant (Single Model)'
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Throw specific errors for the retry loop to catch
            if (response.status === 429) throw new Error('Rate limit exceeded (429)');
            if (response.status >= 500) throw new Error(`Server Error (${response.status})`);

            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'API Error');
        }

        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens
        };

    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request Timeout');
        }
        throw error;
    }
}

export function detectPotentialHallucination(response: string): boolean {
    return false; // Disabled for simplicity
}
