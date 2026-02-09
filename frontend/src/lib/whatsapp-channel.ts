/**
 * WhatsApp Channel
 * 
 * DISCLAIMER: This WhatsApp integration uses WhatsApp Web automation via Evolution API.
 * It is NOT affiliated with Meta or WhatsApp.
 * For internal use, experimentation, and portfolio demo ONLY.
 * 
 * Handles all WhatsApp-specific functionality:
 * - QR code generation
 * - Message sending
 * - Webhook processing
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'ai-assistant';

export interface WhatsAppQRResponse {
    success: boolean;
    qrCode?: string;
    connected?: boolean;
    error?: string;
}

export interface WhatsAppSendResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Get QR code for WhatsApp connection
 */
export async function getWhatsAppQR(): Promise<WhatsAppQRResponse> {
    try {
        // Check connection status first
        const statusResponse = await fetch(
            `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.instance?.state === 'open') {
                return { success: true, connected: true };
            }
        }

        // Get QR code
        const qrResponse = await fetch(
            `${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`,
            {
                method: 'GET',
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!qrResponse.ok) {
            // Try to create instance if not exists
            if (qrResponse.status === 404) {
                return await createInstance();
            }
            return { success: false, error: 'Failed to get QR code' };
        }

        const qrData = await qrResponse.json();
        const qrCode = qrData.base64 || qrData.qrcode?.base64;

        if (qrCode) {
            return { success: true, qrCode };
        }

        return { success: false, error: 'No QR code returned' };

    } catch (error) {
        console.error('WhatsApp QR Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Create Evolution API instance
 */
async function createInstance(): Promise<WhatsAppQRResponse> {
    try {
        const response = await fetch(
            `${EVOLUTION_API_URL}/instance/create`,
            {
                method: 'POST',
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceName: EVOLUTION_INSTANCE,
                    qrcode: true
                })
            }
        );

        if (!response.ok) {
            return { success: false, error: 'Failed to create instance' };
        }

        const data = await response.json();
        const qrCode = data.qrcode?.base64;

        if (qrCode) {
            return { success: true, qrCode };
        }

        return { success: false, error: 'No QR code from instance creation' };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send message via WhatsApp
 */
export async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string
): Promise<WhatsAppSendResponse> {
    try {
        // Format phone number (remove any non-digits, ensure country code)
        const formattedNumber = phoneNumber.replace(/\D/g, '');

        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
            {
                method: 'POST',
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: `${formattedNumber}@s.whatsapp.net`,
                    text: message
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('WhatsApp Send Error:', errorText);
            return { success: false, error: 'Failed to send message' };
        }

        const data = await response.json();

        return {
            success: true,
            messageId: data.key?.id
        };

    } catch (error) {
        console.error('WhatsApp Send Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check WhatsApp connection status
 */
export async function checkWhatsAppConnection(): Promise<{
    connected: boolean;
    phoneNumber?: string;
}> {
    try {
        const response = await fetch(
            `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            return { connected: false };
        }

        const data = await response.json();

        return {
            connected: data.instance?.state === 'open',
            phoneNumber: data.instance?.wuid?.replace('@s.whatsapp.net', '')
        };

    } catch {
        return { connected: false };
    }
}
