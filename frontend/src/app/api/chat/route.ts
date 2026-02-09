import { NextResponse } from 'next/server';

/**
 * Chat API Route – Placeholder Proxy
 * 
 * In the monorepo architecture, this route acts as a thin proxy
 * to the Python FastAPI backend. For now, it returns a placeholder
 * response until the backend is wired up in Step 3.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, mode, history } = body;

        // TODO: Step 3 will wire this to the Python backend
        // For now, return a placeholder response so the UI stays functional
        return NextResponse.json({
            response: `🔧 **Backend not connected yet.** Your message: "${message}" (mode: ${mode}). The Python backend will handle this in Step 4.`,
            model: 'placeholder',
            usedRetrieval: false,
        });

    } catch (error) {
        console.error('Chat Route Error:', error);
        return NextResponse.json(
            { error: 'Chat proxy encountered an error.' },
            { status: 500 }
        );
    }
}
