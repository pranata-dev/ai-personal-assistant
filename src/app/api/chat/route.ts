import { NextResponse } from 'next/server';
import { getSystemPrompt, detectOperatingMode } from '@/lib/ai-engine';
import { PersonalityMode } from '@/types';
import { getModelPool, reportModelFailure } from '@/lib/models';
import { detectRetrievalIntent, extractSearchQuery } from '@/lib/retrieval-intent';
import { fetchFromJina, buildRetrievalContext } from '@/lib/retrieval-service';
import { log } from '@/lib/logger';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(request: Request) {
    try {
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: 'OpenRouter API Key not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { message, mode, history } = body;

        // Get prioritized model pool (filters out blocked/quota-exceeded models)
        const modelPool = getModelPool();

        // Detect operating mode (assistant vs chat)
        const operatingMode = detectOperatingMode(message);

        // 1. Detect if retrieval is needed using intent detection
        const retrievalIntent = detectRetrievalIntent(message);
        let retrievalContext = '';
        let retrievalNotice = '';

        if (retrievalIntent.shouldRetrieve) {
            log('info', 'system', 'RETRIEVAL_TRIGGERED', {
                data: {
                    trigger: retrievalIntent.matchedTrigger,
                    confidence: retrievalIntent.confidence,
                    reason: retrievalIntent.reason
                }
            });

            // Extract optimized search query
            const searchQuery = extractSearchQuery(message);

            // Fetch from Jina AI
            const result = await fetchFromJina(searchQuery);

            if (result.success) {
                retrievalContext = buildRetrievalContext(result);
                console.log(`✅ Jina AI retrieval successful (${result.content.length} chars, ${result.processingTimeMs}ms)`);
            } else {
                // Retrieval failed - continue without it
                retrievalNotice = '\n\n(Note: Real-time data retrieval was attempted but unavailable. Response based on available knowledge.)';
                console.warn(`⚠️ Jina AI retrieval failed: ${result.error}`);
            }
        }

        // 2. Prepare System Prompt with retrieval context
        const baseSystemPrompt = getSystemPrompt(mode as PersonalityMode, operatingMode);
        const fullSystemPrompt = retrievalContext
            ? `${baseSystemPrompt}\n\n${retrievalContext}`
            : baseSystemPrompt;

        // 3. Prepare Messages for API
        const messages = [
            { role: 'system', content: fullSystemPrompt },
            ...history.map((msg: any) => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        // 4. Call OpenRouter API with Model Rotation
        let lastError: Error | null = null;
        let successfulResponse: any = null;
        let usedModelId = '';

        for (const model of modelPool) {
            const modelId = model.id;
            try {
                console.log(`🤖 Trying model from pool: ${modelId}`);

                const data = await callOpenRouter(messages, OPENROUTER_API_KEY, modelId);

                // Check for valid response
                if (!data.choices || !data.choices[0]?.message?.content) {
                    console.warn(`Model ${modelId} returned empty response`);
                    throw new Error('Empty response from model');
                }

                successfulResponse = data;
                usedModelId = modelId;
                break; // Success!

            } catch (e) {
                const error = e as Error;
                console.warn(`Model ${modelId} failed:`, error.message);
                lastError = error;

                // Check for Quota/Billing errors
                const isQuotaError = error.message.includes('quota') ||
                    error.message.includes('billing') ||
                    error.message.includes('credit') ||
                    error.message.includes('unauthorized') || // 401
                    error.message.includes('invalid API key');

                // Report failure to Quota Guard (blocks model if quota error)
                reportModelFailure(modelId, isQuotaError);

                continue; // Try next model
            }
        }

        if (successfulResponse) {
            return NextResponse.json({
                response: successfulResponse.choices[0].message.content + retrievalNotice,
                model: usedModelId,
                usedRetrieval: retrievalIntent.shouldRetrieve && retrievalContext !== ''
            });
        }

        // All models failed
        console.error('All models failed. Last error:', lastError);

        let errorMessage = "AI service is temporarily unavailable. Please try again later.";

        // If pool was empty (all blocked) or last error was quota
        if (modelPool.length === 0) {
            errorMessage = "All AI models are currently unavailable due to quota limits. Please try again in 15 minutes.";
        } else if (lastError?.message?.includes('quota exceeded') || lastError?.message?.includes('AI service quota exceeded')) {
            errorMessage = "AI service quota exceeded. Please try again later or check API limits.";
        } else if (lastError?.message?.toLowerCase().includes('rate limit')) {
            errorMessage = "AI service is currently busy (Rate Limit). Please try again in a few seconds.";
        } else if (lastError) {
            errorMessage = `All models unavailable: ${lastError.message}`;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 503 }
        );

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

async function callOpenRouter(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
    retries = 3
): Promise<{ choices?: { message: { content: string } }[]; error?: { message: string } }> {
    let lastMsg = 'Unknown error';
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 OpenRouter request to ${model} (attempt ${attempt})`);

            // 15 second timeout for LLM generation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                    'X-Title': 'AI Personal Assistant'
                },
                body: JSON.stringify({
                    model: model,
                    messages,
                    max_tokens: 1024,
                    temperature: 0.5,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle non-retryable errors
            if (response.status === 401 || response.status === 403) {
                const errData = await response.json().catch(() => ({}));
                console.error(`❌ ${model} Auth/Perm Error (${response.status}):`, errData);
                throw new Error('Using invalid API key or unauthorized model');
            }

            if (response.status === 402) {
                const errData = await response.json().catch(() => ({}));
                console.error(`❌ ${model} Quota Exceeded (402):`, errData);
                throw new Error('AI service quota exceeded');
            }

            // Handle rate limiting (Retryable)
            if (response.status === 429) {
                lastMsg = `Rate limit exceeded (429) on ${model}`;

                // Fail faster on rate limits to allow switching to other models
                if (attempt > 1) {
                    throw new Error(`Rate limit exceeded (429) on ${model}`);
                }

                const delay = 1000; // Fixed 1s delay for rate limit
                console.warn(`⚠️ Rate limit hit for ${model}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Parse response body
            const data = await response.json();

            // Log the response for debugging
            if (!response.ok) {
                console.error(`❌ ${model} HTTP ${response.status}:`, JSON.stringify(data));

                // Check if error message indicates quota/billing issues
                const errorMsg = data.error?.message?.toLowerCase() || '';
                if (errorMsg.includes('quota') || errorMsg.includes('billing') || errorMsg.includes('credit')) {
                    throw new Error('AI service quota exceeded');
                }

                throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
            }

            // Check for API-level errors
            if (data.error) {
                console.error(`❌ ${model} API error:`, data.error);

                const errorMsg = data.error.message?.toLowerCase() || '';
                if (errorMsg.includes('quota') || errorMsg.includes('billing') || errorMsg.includes('credit')) {
                    throw new Error('AI service quota exceeded');
                }

                throw new Error(data.error.message || 'API returned error');
            }

            console.log(`✅ ${model} responded successfully`);
            return data;

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            lastMsg = msg;

            // If it's a non-retryable error, rethrow immediately to skip retries
            if (msg.includes('quota') || msg.includes('unauthorized') || msg.includes('invalid API key')) {
                throw e;
            }

            console.error(`❌ ${model} attempt ${attempt} failed:`, msg);

            if (attempt === retries) throw e;

            // Backoff for other errors (network, 5xx)
            const delay = Math.pow(2, attempt) * 500;
            console.warn(`🔄 Retrying ${model} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error(`Connection failed after ${retries} attempts. Last error: ${lastMsg}`);
}

