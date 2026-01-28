import { NextResponse } from 'next/server';
import { getSystemPrompt, formatConversationHistory, detectOperatingMode } from '@/lib/ai-engine';
import { searchWeb as performWebSearch } from '@/lib/web-search';
import { PersonalityMode } from '@/types';
import { DEFAULT_MODEL_ID, FALLBACK_MODEL_IDS } from '@/lib/models';

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

        // 1. Check for web search triggers (expanded list for current events)
        const searchKeywords = [
            'berita', 'news', 'apa itu', 'siapa', 'cari', 'presiden', 'gubernur',
            'cuaca', 'harga', 'jadwal', 'timnas', 'skor', 'gempa', 'banjir',
            'traffic', 'macet', 'wik', 'current', 'sekarang', 'saat ini',
            'terbaru', 'latest', 'today', 'hari ini', 'menteri', 'minister',
            'who is', 'what is', 'when did', 'kapan'
        ];
        const lowerMessage = message.toLowerCase();
        const shouldSearch = searchKeywords.some(keyword => lowerMessage.includes(keyword));

        let searchContext = '';

        if (shouldSearch) {
            try {
                // Timeout web search after 5 seconds
                const searchPromise = performWebSearch(message);
                const timeoutPromise = new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Search timeout')), 5000)
                );

                const searchResult = await Promise.race([searchPromise, timeoutPromise]).catch(() => null);

                if (searchResult) {
                    // Limit search context to 1500 characters to avoid token limits
                    const limitedResult = searchResult.substring(0, 1500);
                    searchContext = `
REAL-TIME SEARCH RESULTS:
${limitedResult}

Use this data as your PRIMARY source.`;
                }
            } catch (e) {
                console.warn('Web search failed:', e);
                // Continue without search context
            }
        }

        // 2. Prepare System Prompt with operating mode
        const baseSystemPrompt = getSystemPrompt(mode as PersonalityMode, operatingMode);
        const fullSystemPrompt = searchContext
            ? `${baseSystemPrompt}\n\n${searchContext}`
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
                    response: data.choices[0].message.content,
                    model: modelId // Return which model was used
                });
            } catch (e) {
                console.warn(`Model ${modelId} failed:`, e);
                lastError = e as Error;
                continue; // Try next model
            }
        }

        // All models failed
        console.error('All models failed:', lastError);
        return NextResponse.json(
            { error: `All models unavailable: ${lastError?.message || 'Unknown error'}` },
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
    retries = 2
): Promise<{ choices?: { message: { content: string } }[]; error?: { message: string } }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 OpenRouter request to ${model} (attempt ${attempt})`);

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
                })
            });

            // Handle rate limiting
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
                throw new Error(`HTTP ${response.status}: ${data.error?.message || 'Unknown error'}`);
            }

            // Check for API-level errors
            if (data.error) {
                console.error(`❌ ${model} API error:`, data.error);
                throw new Error(data.error.message || 'API returned error');
            }

            console.log(`✅ ${model} responded successfully`);
            return data;

        } catch (e) {
            console.error(`❌ ${model} attempt ${attempt} failed:`, e);
            if (attempt === retries) throw e;
            console.warn(`🔄 Retrying ${model}...`);
        }
    }
    throw new Error('Max retries exceeded');
}

