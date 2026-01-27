import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PersonalityMode, Message } from '@/types';
import { getSystemPrompt, formatConversationHistory } from '@/lib/ai-engine';

export async function POST(request: Request) {
    try {
        const { message, mode, history } = await request.json() as {
            message: string;
            mode: PersonalityMode;
            history: Message[];
        };

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured. Please add GEMINI_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = getSystemPrompt(mode);
        const conversationHistory = formatConversationHistory(history);

        const prompt = `${systemPrompt}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n\n` : ''}USER MESSAGE:
${message}

RESPOND NATURALLY IN BAHASA INDONESIA (unless user speaks English):`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response. Please try again.' },
            { status: 500 }
        );
    }
}
