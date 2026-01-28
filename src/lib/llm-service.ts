/**
 * LLM Service
 * 
 * Encapsulates all LLM API interactions.
 * Primary model: GLM 4.5 Air
 * Single-core inference with automatic fallback.
 */

import { reportModelFailure } from './models';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface LLMRequest {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface LLMResponse {
    content: string;
    modelUsed: string;
    fallbackUsed: boolean;
    fallbackReason?: string;
    tokensUsed?: number;
    processingTimeMs: number;
}

export interface LLMError {
    code: string;
    message: string;
    modelAttempted: string;
}

// Timeout default: 45 seconds (increased for free tier models)
const DEFAULT_TIMEOUT_MS = 45000;

/**
 * Call the LLM with automatic fallback
 */
export async function callLLM(
    request: LLMRequest,
    apiKey: string
): Promise<LLMResponse> {
    const startTime = Date.now();

    // STRICT SINGLE MODEL POLICY
    const modelId = 'z-ai/glm-4.5-air:free';
    // Massive timeout to accommodate long queues (10 mins)
    const timeout = request.timeout || 600000;

    let lastError: LLMError | null = null;
    const MAX_RETRIES = 50; // Persistent Queue: ~8 minutes

    // Capped backoff (max 10s wait)
    // 2s, 4s, 8s, 10s, 10s, 10s ...
    const getBackoff = (attempt: number) => Math.min(1000 * Math.pow(2, attempt + 1), 10000);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🤖 LLM Request (Attempt ${attempt + 1}/${MAX_RETRIES}): ${modelId}`);

            const response = await callSingleModel(
                modelId,
                request.messages,
                apiKey,
                request.temperature ?? 0.5,
                request.maxTokens ?? 1024,
                timeout
            );

            const processingTimeMs = Date.now() - startTime;

            return {
                content: response.content,
                modelUsed: modelId,
                fallbackUsed: false,
                tokensUsed: response.tokensUsed,
                processingTimeMs
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            lastError = {
                code: 'LLM_ERROR',
                message: errorMessage,
                modelAttempted: modelId
            };

            const isRateLimit = errorMessage.toLowerCase().includes('rate limit') ||
                errorMessage.includes('429');

            // Only retry on Rate Limits or temporary server errors (502/503)
            const isRetryable = isRateLimit ||
                errorMessage.includes('502') ||
                errorMessage.includes('503') ||
                errorMessage.includes('fetch failed');

            if (isRetryable && attempt < MAX_RETRIES) {
                const backoffMs = getBackoff(attempt);
                console.warn(`⚠️ Attempt ${attempt + 1} failed: ${errorMessage}`);
                console.warn(`⏳ Waiting ${backoffMs / 1000}s before retry...`);

                await new Promise(resolve => setTimeout(resolve, backoffMs));
                continue;
            }

            // If not retryable or max retries reached, throw
            console.error(`❌ Model ${modelId} failed permanently: ${errorMessage}`);
            break;
        }
    }

    // All retries failed
    throw new Error(`LLM Failed after ${MAX_RETRIES + 1} attempts. Last error: ${lastError?.message || 'Unknown'}`);
}

/**
 * Call a single model with timeout
 */
async function callSingleModel(
    model: string,
    messages: Array<{ role: string; content: string }>,
    apiKey: string,
    temperature: number,
    maxTokens: number,
    timeout: number
): Promise<{ content: string; tokensUsed?: number }> {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/pranata-dev/ai-personal-assistant',
                'X-Title': 'AI Personal Assistant (Dev)'
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

        if (response.status === 429) {
            throw new Error('Rate limit exceeded');
        }

        if (response.status === 502 || response.status === 503) {
            throw new Error('No endpoints available (Service Unavailable)');
        }

        if (!response.ok) {
            let errorMsg = `API error ${response.status}`;
            try {
                const errJson = await response.json();
                if (errJson.error?.message) {
                    errorMsg = errJson.error.message; // Use the clean message from provider
                } else {
                    errorMsg += `: ${JSON.stringify(errJson)}`;
                }
            } catch {
                const errText = await response.text();
                errorMsg += `: ${errText}`;
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Unknown API error');
        }

        return {
            content: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens
        };

    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeout}ms`);
        }

        throw error;
    }
}

/**
 * Simple hallucination detection
 * Returns true if response might contain hallucinated content
 */
export function detectPotentialHallucination(response: string): boolean {
    const hallucinationPatterns = [
        /as of my (last |knowledge )?cutoff/i,
        /I don't have (access to )?real-time/i,
        /my training data (only goes|ends)/i,
        /I cannot browse the internet/i,
        /I don't have the ability to access/i
    ];

    return hallucinationPatterns.some(pattern => pattern.test(response));
}
