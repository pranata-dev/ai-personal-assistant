/**
 * Message Normalizer
 * 
 * Normalizes incoming messages from different channels (Web, WhatsApp)
 * into a unified format for processing by AssistantCore.
 */

export type Channel = 'web' | 'whatsapp';

export interface NormalizedMessage {
    text: string;
    channel: Channel;
    sessionId: string;
    timestamp: number;
    metadata?: {
        // WhatsApp-specific
        phoneNumber?: string;
        pushName?: string;
        // Web-specific
        userId?: string;
        // Shared
        messageId?: string;
    };
}

export interface RawWebMessage {
    content: string;
    sessionId?: string;
}

export interface RawWhatsAppMessage {
    key: {
        remoteJid: string;
        fromMe: boolean;
        id: string;
    };
    pushName?: string;
    message: {
        conversation?: string;
        extendedTextMessage?: {
            text: string;
        };
    };
}

/**
 * Normalize a web message into the unified format
 */
export function normalizeWebMessage(raw: RawWebMessage): NormalizedMessage {
    return {
        text: raw.content,
        channel: 'web',
        sessionId: raw.sessionId || `web-${Date.now()}`,
        timestamp: Date.now(),
        metadata: {
            userId: raw.sessionId
        }
    };
}

/**
 * Normalize a WhatsApp message into the unified format
 */
export function normalizeWhatsAppMessage(raw: RawWhatsAppMessage): NormalizedMessage {
    // Extract text from various WhatsApp message formats
    const text = raw.message.conversation ||
        raw.message.extendedTextMessage?.text ||
        '';

    // Extract phone number from remoteJid (format: 1234567890@s.whatsapp.net)
    const phoneNumber = raw.key.remoteJid.split('@')[0];

    return {
        text,
        channel: 'whatsapp',
        sessionId: `wa-${phoneNumber}`,
        timestamp: Date.now(),
        metadata: {
            phoneNumber,
            pushName: raw.pushName,
            messageId: raw.key.id
        }
    };
}

/**
 * Generate a unique session ID for context management
 */
export function generateSessionId(channel: Channel, identifier?: string): string {
    if (identifier) {
        return `${channel}-${identifier}`;
    }
    return `${channel}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
