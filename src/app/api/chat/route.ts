import { NextResponse } from 'next/server';
import { PersonalityMode, Message } from '@/types';
import { getSystemPrompt, formatConversationHistory } from '@/lib/ai-engine';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callOpenRouter(messages: { role: string; content: string }[], apiKey: string, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'AI Personal Assistant'
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
                messages,
                max_tokens: 1024,
                temperature: 0.7,
            })
        });

        // If rate limited and we have retries left, wait and retry
        if (response.status === 429 && attempt < retries) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s
            console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}...`);
            await sleep(waitTime);
            continue;
        }

        return response;
    }

    // This shouldn't happen, but just in case
    throw new Error('Max retries exceeded');
}

export async function POST(request: Request) {
    try {
        const { message, mode, history } = await request.json() as {
            message: string;
            mode: PersonalityMode;
            history: Message[];
        };

        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured. Please add OPENROUTER_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        const systemPrompt = getSystemPrompt(mode);
        const conversationHistory = formatConversationHistory(history);

        // Build messages array for OpenRouter
        const messages = [
            { role: 'system', content: systemPrompt },
        ];

        // Add conversation history as context
        if (conversationHistory) {
            messages.push({
                role: 'user',
                content: `Previous conversation:\n${conversationHistory}\n\n---\nCurrent message:`
            });
        }

        messages.push({ role: 'user', content: message });

        const response = await callOpenRouter(messages, apiKey);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', errorData);

            // Special handling for rate limit
            if (response.status === 429) {
                return NextResponse.json(
                    { error: '⏰ Rate limit tercapai! Tunggu beberapa detik lalu coba lagi. (Free tier punya limit ~20 req/menit)' },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                { error: `API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || 'Maaf, tidak bisa generate response.';

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('OpenRouter API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response. Please try again.' },
            { status: 500 }
        );
    }
}
