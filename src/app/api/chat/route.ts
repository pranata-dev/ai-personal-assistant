import { NextResponse } from 'next/server';
import { getSystemPrompt, detectOperatingMode } from '@/lib/ai-engine';
import { PersonalityMode } from '@/types';
import { detectRetrievalIntent, extractSearchQuery } from '@/lib/retrieval-intent';
import { fetchFromJina, buildRetrievalContext } from '@/lib/retrieval-service';
import { log } from '@/lib/logger';
import { callLLM } from '@/lib/llm-service';

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

        // 4. Call OpenRouter API (delegated to LLM Service)
        const result = await callLLM({
            messages,
            model: model,
            temperature: 0.5,
            timeout: 30000
        }, OPENROUTER_API_KEY);

        return NextResponse.json({
            response: result.content + retrievalNotice,
            model: result.modelUsed,
            usedRetrieval: retrievalIntent.shouldRetrieve && retrievalContext !== ''
        });

    } catch (error) {
        console.error('Chat Route Error:', error);

        let errorMessage = "AI service is temporarily unavailable. Please try again later.";
        const msg = error instanceof Error ? error.message : String(error);

        if (msg.includes('quota') || msg.includes('billing')) {
            errorMessage = "AI service quota exceeded. Please try again later or check API limits.";
        } else if (msg.toLowerCase().includes('rate limit')) {
            errorMessage = "AI service is currently busy (Rate Limit). Please try again in a few seconds.";
        } else if (msg.toLowerCase().includes('all llm models failed')) {
            errorMessage = msg;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 503 }
        );
    }
}




