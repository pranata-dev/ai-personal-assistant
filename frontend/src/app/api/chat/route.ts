import { NextResponse } from 'next/server';

/**
 * Chat API Route – Stub
 * 
 * This route is no longer used. The frontend now calls the
 * Python FastAPI backend directly at http://localhost:8000/chat.
 */

export async function POST() {
    return NextResponse.json({ status: "Moved to Python Backend" });
}

export async function GET() {
    return NextResponse.json({ status: "Moved to Python Backend" });
}
