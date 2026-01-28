/**
 * Logger Service
 * 
 * Centralized logging for all AI inputs/outputs.
 * Logs are stored in-memory for now (production would use a database).
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogChannel = 'web' | 'whatsapp' | 'system';

export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    channel: LogChannel;
    sessionId?: string;
    action: string;
    data?: Record<string, unknown>;
    input?: string;
    output?: string;
    modelUsed?: string;
    processingTimeMs?: number;
}

// In-memory log store
const logs: LogEntry[] = [];
const MAX_LOGS = 5000;

/**
 * Generate unique log ID
 */
function generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log an entry
 */
export function log(
    level: LogLevel,
    channel: LogChannel,
    action: string,
    details?: Partial<Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'channel' | 'action'>>
): void {
    const entry: LogEntry = {
        id: generateLogId(),
        timestamp: Date.now(),
        level,
        channel,
        action,
        ...details
    };

    logs.push(entry);

    // Trim if too large
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }

    // Console output with formatting
    const timeStr = new Date(entry.timestamp).toISOString().substr(11, 8);
    const levelEmoji = {
        info: '📘',
        warn: '⚠️',
        error: '❌',
        debug: '🔍'
    }[level];

    console.log(`${levelEmoji} [${timeStr}] [${channel.toUpperCase()}] ${action}`);

    if (details?.data) {
        console.log('   Data:', JSON.stringify(details.data, null, 2));
    }
    if (details?.input) {
        console.log(`   Input: "${details.input.substring(0, 100)}${details.input.length > 100 ? '...' : ''}"`);
    }
    if (details?.output) {
        console.log(`   Output: "${details.output.substring(0, 100)}${details.output.length > 100 ? '...' : ''}"`);
    }
}

/**
 * Log AI request/response
 */
export function logAIInteraction(
    channel: LogChannel,
    sessionId: string,
    input: string,
    output: string,
    modelUsed: string,
    processingTimeMs: number
): void {
    log('info', channel, 'AI_INTERACTION', {
        sessionId,
        input,
        output,
        modelUsed,
        processingTimeMs
    });
}

/**
 * Log error
 */
export function logError(
    channel: LogChannel,
    action: string,
    error: Error | string,
    sessionId?: string
): void {
    log('error', channel, action, {
        sessionId,
        data: {
            error: typeof error === 'string' ? error : error.message,
            stack: error instanceof Error ? error.stack : undefined
        }
    });
}

/**
 * Get recent logs
 */
export function getRecentLogs(limit: number = 50, filter?: {
    level?: LogLevel;
    channel?: LogChannel;
    sessionId?: string;
}): LogEntry[] {
    let filtered = logs;

    if (filter?.level) {
        filtered = filtered.filter(l => l.level === filter.level);
    }
    if (filter?.channel) {
        filtered = filtered.filter(l => l.channel === filter.channel);
    }
    if (filter?.sessionId) {
        filtered = filtered.filter(l => l.sessionId === filter.sessionId);
    }

    return filtered.slice(-limit);
}

/**
 * Get log statistics
 */
export function getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byChannel: Record<LogChannel, number>;
    last24Hours: number;
} {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const byLevel: Record<LogLevel, number> = {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0
    };

    const byChannel: Record<LogChannel, number> = {
        web: 0,
        whatsapp: 0,
        system: 0
    };

    let last24Hours = 0;

    for (const entry of logs) {
        byLevel[entry.level]++;
        byChannel[entry.channel]++;
        if (entry.timestamp > oneDayAgo) {
            last24Hours++;
        }
    }

    return {
        total: logs.length,
        byLevel,
        byChannel,
        last24Hours
    };
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
    logs.length = 0;
}

/**
 * Export logs as JSON
 */
export function exportLogs(): string {
    return JSON.stringify(logs, null, 2);
}
