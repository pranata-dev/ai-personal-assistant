import { NextResponse } from 'next/server';
import { normalizeWhatsAppMessage, RawWhatsAppMessage } from '@/lib/message-normalizer';
import { getSessionContext, updateSessionContext, prepareForLLM, checkSpecialIntent, setSessionMode } from '@/lib/assistant-core';
import { callLLM, detectPotentialHallucination } from '@/lib/llm-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-channel';
import { logFallbackEvent, determineFallbackReason } from '@/lib/fallback-service';

/**
 * DISCLAIMER: This WhatsApp integration uses WhatsApp Web automation via Evolution API.
 * It is NOT affiliated with Meta or WhatsApp.
 * For internal use, experimentation, and portfolio demo ONLY.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Log incoming webhook
        console.log('📱 WhatsApp Webhook:', JSON.stringify(body, null, 2));

        // Handle different Evolution API event types
        if (body.event === 'messages.upsert') {
            const messages = body.data?.messages || [];

            for (const msg of messages) {
                // Skip messages from self
                if (msg.key?.fromMe) continue;

                // Process the message
                await processWhatsAppMessage(msg);
            }
        }

        // Always return 200 to acknowledge webhook
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('WhatsApp Webhook Error:', error);
        // Still return 200 to prevent webhook retries
        return NextResponse.json({ received: true, error: 'Processing failed' });
    }
}

async function processWhatsAppMessage(rawMessage: RawWhatsAppMessage) {
    try {
        // Normalize the message
        const normalizedMessage = normalizeWhatsAppMessage(rawMessage);

        // Skip empty messages
        if (!normalizedMessage.text.trim()) {
            return;
        }

        console.log(`💬 Processing: "${normalizedMessage.text}" from ${normalizedMessage.metadata?.phoneNumber}`);

        // Get session context
        const context = getSessionContext(normalizedMessage.sessionId);

        // Check for special intents
        const specialIntent = checkSpecialIntent(normalizedMessage.text);

        if (specialIntent.isSpecial) {
            // Handle mode switch
            if (specialIntent.type === 'mode_switch' && specialIntent.mode) {
                setSessionMode(normalizedMessage.sessionId, specialIntent.mode);
            }

            // Send special response
            if (specialIntent.response && normalizedMessage.metadata?.phoneNumber) {
                await sendWhatsAppMessage(
                    normalizedMessage.metadata.phoneNumber,
                    specialIntent.response
                );
            }
            return;
        }

        // Prepare for LLM
        const { messages } = prepareForLLM({
            message: normalizedMessage,
            mode: context.mode,
            history: context.history
        });

        // Call LLM
        const llmResponse = await callLLM(
            { messages },
            OPENROUTER_API_KEY
        );

        // Fallback logging removed (Single Model Policy)

        // Check for potential hallucination
        if (detectPotentialHallucination(llmResponse.content)) {
            console.warn('⚠️ Potential hallucination detected in response');
        }

        // Update session context
        updateSessionContext(
            normalizedMessage.sessionId,
            normalizedMessage.text,
            llmResponse.content
        );

        // Send response to WhatsApp
        if (normalizedMessage.metadata?.phoneNumber) {
            await sendWhatsAppMessage(
                normalizedMessage.metadata.phoneNumber,
                llmResponse.content
            );
        }

        console.log(`✅ Response sent to ${normalizedMessage.metadata?.phoneNumber}`);

    } catch (error) {
        console.error('Message processing error:', error);

        // Send error message to user
        if (rawMessage.key?.remoteJid) {
            const phoneNumber = rawMessage.key.remoteJid.split('@')[0];
            await sendWhatsAppMessage(
                phoneNumber,
                'Sorry, I encountered an error processing your message. Please try again.'
            );
        }
    }
}
