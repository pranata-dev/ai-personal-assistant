/**
 * LLM Service
 * 
 * Encapsulates all LLM API interactions.
 * Primary model: GLM 4.5 Air
 * Single-core inference with automatic fallback.
 */

import { DEFAULT_MODEL_ID, FALLBACK_MODEL_IDS, reportModelFailure } from './models';

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
    const selectedModel = request.model || DEFAULT_MODEL_ID;
    const timeout = request.timeout || DEFAULT_TIMEOUT_MS;

    // Models to try: selected first, then fallbacks
    const modelsToTry = [
        selectedModel,
        ...FALLBACK_MODEL_IDS.filter(m => m !== selectedModel)
    ];

    let lastError: LLMError | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
        const modelId = modelsToTry[i];
        const isFallback = i > 0;

        try {
            console.log(`🤖 LLM Request: ${modelId}${isFallback ? ' (fallback)' : ' (primary)'}`);

            const response = await callSingleModel(
                modelId,
                request.messages,
                apiKey,
                request.temperature ?? 0.5,
                request.maxTokens ?? 1024,
                timeout
            );

            const processingTimeMs = Date.now() - startTime;

            if (isFallback) {
                console.log(`⚠️ Fallback used: ${modelId} (reason: ${lastError?.message || 'unknown'})`);
            }

            return {
                content: response.content,
                modelUsed: modelId,
                fallbackUsed: isFallback,
                fallbackReason: isFallback ? lastError?.message : undefined,
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

            // Check for Quota/Billing errors
            const isQuotaError = errorMessage.toLowerCase().includes('quota') ||
                errorMessage.toLowerCase().includes('billing') ||
                errorMessage.toLowerCase().includes('credit') ||
                errorMessage.toLowerCase().includes('unauthorized') ||
                errorMessage.toLowerCase().includes('invalid API key');

            // Report to Quota Guard
            reportModelFailure(modelId, isQuotaError);

            console.warn(`❌ Model ${modelId} failed: ${errorMessage}`);

            // Exponential Backoff: Delay before next model (helps with rate limits)
            if (i < modelsToTry.length - 1) {
                const backoffMs = Math.min(1000 * Math.pow(2, i), 10000);
                console.log(`⏳ Waiting ${backoffMs}ms before trying fallback model...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }

            // Continue to next model
            continue;
        }
    }

    // All models failed
    throw new Error(`All LLM models failed. Last error: ${lastError?.message || 'Unknown'}`);
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
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'AI Personal Assistant'
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
