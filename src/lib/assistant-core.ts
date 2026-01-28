/**
 * Assistant Core
 * 
 * Channel-agnostic message processing center.
 * All channels (Web, WhatsApp) route messages through this core.
 */

import { NormalizedMessage, Channel } from './message-normalizer';
import { PersonalityMode } from '@/types';
import { detectIntent, getSystemPrompt, detectOperatingMode } from './ai-engine';

export interface AssistantRequest {
    message: NormalizedMessage;
    mode: PersonalityMode;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AssistantResponse {
    content: string;
    modelUsed: string;
    fallbackUsed: boolean;
    processingTimeMs: number;
    channel: Channel;
    sessionId: string;
}

// Session context store (in-memory for now)
// In production, this would be Redis or a database
const sessionContexts = new Map<string, {
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    mode: PersonalityMode;
    lastActive: number;
}>();

// Context TTL: 30 minutes
const CONTEXT_TTL_MS = 30 * 60 * 1000;

/**
 * Get or create session context
 */
export function getSessionContext(sessionId: string): {
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    mode: PersonalityMode;
} {
    const existing = sessionContexts.get(sessionId);

    if (existing && Date.now() - existing.lastActive < CONTEXT_TTL_MS) {
        existing.lastActive = Date.now();
        return existing;
    }

    // Create new context
    const newContext = {
        history: [],
        mode: 'bestfriend' as PersonalityMode,
        lastActive: Date.now()
    };
    sessionContexts.set(sessionId, newContext);
    return newContext;
}

/**
 * Update session context with new message
 */
export function updateSessionContext(
    sessionId: string,
    userMessage: string,
    assistantResponse: string
): void {
    const context = sessionContexts.get(sessionId);
    if (context) {
        context.history.push({ role: 'user', content: userMessage });
        context.history.push({ role: 'assistant', content: assistantResponse });

        // Keep only last 10 exchanges (20 messages)
        if (context.history.length > 20) {
            context.history = context.history.slice(-20);
        }

        context.lastActive = Date.now();
    }
}

/**
 * Set session mode
 */
export function setSessionMode(sessionId: string, mode: PersonalityMode): void {
    const context = sessionContexts.get(sessionId);
    if (context) {
        context.mode = mode;
    }
}

/**
 * Clear expired sessions (call periodically)
 */
export function cleanupSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, context] of sessionContexts.entries()) {
        if (now - context.lastActive > CONTEXT_TTL_MS) {
            sessionContexts.delete(sessionId);
            cleaned++;
        }
    }

    return cleaned;
}

/**
 * Prepare message for LLM processing
 */
export function prepareForLLM(request: AssistantRequest): {
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
} {
    // Detect operating mode
    const operatingMode = detectOperatingMode(request.message.text);

    // Get system prompt
    const systemPrompt = getSystemPrompt(request.mode, operatingMode);

    // Prepare messages
    const messages = [
        { role: 'system', content: systemPrompt },
        ...request.history.map(m => ({
            role: m.role,
            content: m.content
        })),
        { role: 'user', content: request.message.text }
    ];

    return { systemPrompt, messages };
}

/**
 * Check for special intents (mode switch, help, etc.)
 */
export function checkSpecialIntent(text: string): {
    isSpecial: boolean;
    type?: string;
    mode?: PersonalityMode;
    response?: string;
} {
    const intent = detectIntent(text);

    if (intent.type === 'mode_switch' && intent.mode) {
        return {
            isSpecial: true,
            type: 'mode_switch',
            mode: intent.mode,
            response: `Mode switched to: **${intent.mode}**`
        };
    }

    if (intent.type === 'help') {
        return {
            isSpecial: true,
            type: 'help',
            response: `**Available Commands**

**Modes:** \`mode mentor\`, \`mode friend\`, \`mode strict\`, \`mode creative\`
**Chat:** Say "chat mode" for casual conversation
**Reset:** \`reset memory\` to clear history
**Help:** \`help\` to show this message`
        };
    }

    if (intent.type === 'reset_memory') {
        return {
            isSpecial: true,
            type: 'reset_memory',
            response: '**Memory cleared.** Starting fresh.'
        };
    }

    return { isSpecial: false };
}

// Export types
export type { NormalizedMessage };
