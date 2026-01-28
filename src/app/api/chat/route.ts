import { NextResponse } from 'next/server';
import { getSystemPrompt, detectOperatingMode } from '@/lib/ai-engine';
import { PersonalityMode } from '@/types';
import { DEFAULT_MODEL_ID, FALLBACK_MODEL_IDS } from '@/lib/models';
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
        const { message, mode, history, model } = body;

        // Primary model is GLM-4.5 Air, fallbacks are used if primary fails
        const selectedModel = model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL_ID;

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

        // 4. Call OpenRouter API with automatic fallback
        const modelsToTry = [selectedModel, ...FALLBACK_MODEL_IDS.filter(m => m !== selectedModel)];

        let lastError: Error | null = null;

        for (const modelId of modelsToTry) {
            try {
                console.log(`🤖 Trying model: ${modelId}`);
                const data = await callOpenRouter(messages, OPENROUTER_API_KEY, modelId);

                // Check for valid response
                if (!data.choices || !data.choices[0]?.message?.content) {
                    console.warn(`Model ${modelId} returned empty response`);
                    lastError = new Error('Empty response from model');
                    continue;
                }

                return NextResponse.json({
                    response: data.choices[0].message.content + retrievalNotice,
                    model: modelId,
                    usedRetrieval: retrievalIntent.shouldRetrieve && retrievalContext !== ''
                });
            } catch (e) {
                console.warn(`Model ${modelId} failed:`, e);
                lastError = e as Error;

                // If it's a quota error, we might still want to try other models *if* they are from different providers 
                // or if some are free vs paid. But if all fail, we need the specific error.
                continue; // Try next model
            }
        }

        // All models failed
        console.error('All models failed:', lastError);

        let errorMessage = `All models unavailable: ${lastError?.message || 'Unknown error'}`;
        if (lastError?.message?.includes('quota exceeded')) {
            errorMessage = "AI service quota exceeded. Please try again later or check API limits.";
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
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
                const delay = Math.pow(2, attempt) * 1000;
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

