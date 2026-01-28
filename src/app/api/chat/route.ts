import { NextResponse } from 'next/server';
import { getSystemPrompt, formatConversationHistory } from '@/lib/ai-engine';
import { searchWeb as performWebSearch } from '@/lib/web-search';
import { PersonalityMode } from '@/types';
import { DEFAULT_MODEL_ID } from '@/lib/models';

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
        const { message, mode, history, model } = body; // Read model from request

        // Choose model: User selected > Env Var > Default Constant
        const selectedModel = model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL_ID;

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
            // Small delay to prevent rate limits on search API
            await new Promise(resolve => setTimeout(resolve, 300));
            const searchResult = await performWebSearch(message);
            if (searchResult) {
                searchContext = `
REAL-TIME SEARCH RESULTS (PRIORITIZE THIS DATA):
${searchResult}

CRITICAL INSTRUCTION: The information above was retrieved in real-time from the web. 
Use this data as the PRIMARY source for your answer. This is MORE CURRENT than your training data.
If the search results provide an answer, use it directly and cite the source.
Do NOT say you cannot access real-time data - the search results above ARE real-time data.`;
            }
        }

        // 2. Prepare System Prompt
        const baseSystemPrompt = getSystemPrompt(mode as PersonalityMode);
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

        // 4. Call OpenRouter API with Retry Logic
        const response = await callOpenRouter(messages, OPENROUTER_API_KEY, selectedModel);

        const data = await response.json();

        if (data.error) {
            console.error('OpenRouter API Error:', data.error);
            return NextResponse.json(
                { error: `AI Error: ${data.error.message || 'Unknown error'}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            response: data.choices[0].message.content
        });

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

async function callOpenRouter(messages: { role: string; content: string }[], apiKey: string, model: string, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
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
                    model: model, // Use dynamic model
                    messages,
                    max_tokens: 1024,
                    temperature: 0.7,
                })
            });

            if (response.status === 429) {
                // Rate limit - wait exponentially
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`OpenRouter responded with ${response.status}: ${errText}`);
            }

            return response;
        } catch (e) {
            if (attempt === retries) throw e;
            console.warn(`Attempt ${attempt} failed, retrying...`);
        }
    }
    throw new Error('Max retries exceeded');
}
