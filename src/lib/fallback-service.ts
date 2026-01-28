/**
 * Fallback Service
 * 
 * Handles LLM fallback logic with comprehensive logging.
 * Invoked only on: timeout, runtime error, or model unavailability.
 */

import { FALLBACK_MODEL_IDS, getModelById } from './models';

export interface FallbackEvent {
    timestamp: number;
    primaryModel: string;
    fallbackModel: string;
    reason: FallbackReason;
    errorDetails?: string;
    sessionId?: string;
    channel?: 'web' | 'whatsapp';
}

export type FallbackReason =
    | 'timeout'
    | 'rate_limit'
    | 'model_unavailable'
    | 'api_error'
    | 'runtime_error'
    | 'unknown';

// In-memory fallback log (in production, this would go to a database/logging service)
const fallbackLog: FallbackEvent[] = [];
const MAX_LOG_ENTRIES = 1000;

/**
 * Log a fallback event
 */
export function logFallbackEvent(event: Omit<FallbackEvent, 'timestamp'>): void {
    const fullEvent: FallbackEvent = {
        ...event,
        timestamp: Date.now()
    };

    // Add to log
    fallbackLog.push(fullEvent);

    // Trim if too large
    if (fallbackLog.length > MAX_LOG_ENTRIES) {
        fallbackLog.shift();
    }

    // Console log for visibility
    const primaryName = getModelById(event.primaryModel)?.name || event.primaryModel;
    const fallbackName = getModelById(event.fallbackModel)?.name || event.fallbackModel;

    console.log(`
⚠️ FALLBACK EVENT
━━━━━━━━━━━━━━━━━━━━━━━
Primary:  ${primaryName}
Fallback: ${fallbackName}
Reason:   ${event.reason}
${event.errorDetails ? `Details:  ${event.errorDetails}` : ''}
${event.channel ? `Channel:  ${event.channel}` : ''}
${event.sessionId ? `Session:  ${event.sessionId}` : ''}
Time:     ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━
`);
}

/**
 * Determine fallback reason from error
 */
export function determineFallbackReason(error: Error | string): FallbackReason {
    const message = typeof error === 'string' ? error : error.message;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('timeout')) {
        return 'timeout';
    }
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
        return 'rate_limit';
    }
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
        return 'model_unavailable';
    }
    if (lowerMessage.includes('api error') || lowerMessage.includes('500') || lowerMessage.includes('502') || lowerMessage.includes('503')) {
        return 'api_error';
    }
    if (lowerMessage.includes('runtime') || lowerMessage.includes('exception')) {
        return 'runtime_error';
    }

    return 'unknown';
}

/**
 * Get next fallback model
 */
export function getNextFallbackModel(currentModel: string): string | null {
    const currentIndex = FALLBACK_MODEL_IDS.indexOf(currentModel);

    // If current model is primary, return first fallback
    if (currentIndex === -1) {
        return FALLBACK_MODEL_IDS[0] || null;
    }

    // Return next in fallback chain
    if (currentIndex < FALLBACK_MODEL_IDS.length - 1) {
        return FALLBACK_MODEL_IDS[currentIndex + 1];
    }

    // No more fallbacks
    return null;
}

/**
 * Get recent fallback events
 */
export function getRecentFallbackEvents(limit: number = 10): FallbackEvent[] {
    return fallbackLog.slice(-limit);
}

/**
 * Get fallback statistics
 */
export function getFallbackStats(): {
    total: number;
    byReason: Record<FallbackReason, number>;
    last24Hours: number;
} {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const byReason: Record<FallbackReason, number> = {
        timeout: 0,
        rate_limit: 0,
        model_unavailable: 0,
        api_error: 0,
        runtime_error: 0,
        unknown: 0
    };

    let last24Hours = 0;

    for (const event of fallbackLog) {
        byReason[event.reason]++;
        if (event.timestamp > oneDayAgo) {
            last24Hours++;
        }
    }

    return {
        total: fallbackLog.length,
        byReason,
        last24Hours
    };
}

/**
 * Clear fallback log
 */
export function clearFallbackLog(): void {
    fallbackLog.length = 0;
}
