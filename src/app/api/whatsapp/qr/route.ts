import { NextResponse } from 'next/server';

/**
 * DISCLAIMER: This WhatsApp integration uses WhatsApp Web automation via Evolution API.
 * It is NOT affiliated with Meta or WhatsApp.
 * For internal use, experimentation, and portfolio demo ONLY.
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'ai-assistant';

export async function GET() {
    try {
        // Check if Evolution API is configured
        if (!EVOLUTION_API_URL) {
            return NextResponse.json({
                error: 'Evolution API not configured. Please set EVOLUTION_API_URL in .env.local'
            }, { status: 503 });
        }

        // First, check instance status
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

            // If already connected, return connected status
            if (statusData.instance?.state === 'open') {
                return NextResponse.json({
                    connected: true,
                    status: 'connected'
                });
            }
        }

        // Fetch QR code from Evolution API
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
            const errorText = await qrResponse.text();
            console.error('Evolution API QR Error:', errorText);

            // Try to create instance if it doesn't exist
            if (qrResponse.status === 404) {
                const createResponse = await fetch(
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

                if (createResponse.ok) {
                    const createData = await createResponse.json();
                    if (createData.qrcode?.base64) {
                        return NextResponse.json({
                            qrCode: createData.qrcode.base64,
                            status: 'waiting_scan'
                        });
                    }
                }
            }

            return NextResponse.json({
                error: 'Failed to get QR code from Evolution API'
            }, { status: 500 });
        }

        const qrData = await qrResponse.json();

        if (qrData.base64 || qrData.qrcode?.base64) {
            return NextResponse.json({
                qrCode: qrData.base64 || qrData.qrcode.base64,
                status: 'waiting_scan'
            });
        }

        return NextResponse.json({
            error: 'No QR code returned from Evolution API'
        }, { status: 500 });

    } catch (error) {
        console.error('WhatsApp QR Error:', error);
        return NextResponse.json({
            error: 'Failed to connect to Evolution API. Make sure it is running.'
        }, { status: 500 });
    }
}
