'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface WhatsAppQRProps {
    onBack: () => void;
}

/**
 * DISCLAIMER: This WhatsApp integration uses WhatsApp Web automation via Evolution API.
 * It is NOT affiliated with Meta or WhatsApp.
 * For internal use, experimentation, and portfolio demo ONLY.
 */
export default function WhatsAppQR({ onBack }: WhatsAppQRProps) {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'connected' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const fetchQR = async () => {
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/whatsapp/qr');
            const data = await response.json();

            if (data.error) {
                setStatus('error');
                setErrorMessage(data.error);
                return;
            }

            if (data.connected) {
                setStatus('connected');
                return;
            }

            if (data.qrCode) {
                setQrCode(data.qrCode);
                setStatus('ready');
            }
        } catch {
            setStatus('error');
            setErrorMessage('Failed to connect to Evolution API');
        }
    };

    useEffect(() => {
        fetchQR();

        // Poll for connection status every 5 seconds
        const interval = setInterval(fetchQR, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to selection</span>
                </button>

                {/* Card */}
                <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <h2 className="text-xl font-medium text-foreground text-center mb-2">
                        Connect WhatsApp
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
                        Scan the QR code with your WhatsApp app
                    </p>

                    {/* QR Display */}
                    <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
                        {status === 'loading' && (
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-zinc-500">Loading QR Code...</p>
                            </div>
                        )}

                        {status === 'ready' && qrCode && (
                            <img
                                src={qrCode}
                                alt="WhatsApp QR Code"
                                className="w-full h-full object-contain p-4"
                            />
                        )}

                        {status === 'connected' && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-green-600 font-medium">Connected!</p>
                                <p className="text-sm text-zinc-500 mt-1">You can now chat via WhatsApp</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-center p-4">
                                <p className="text-red-500 mb-2">Connection Error</p>
                                <p className="text-sm text-zinc-500">{errorMessage}</p>
                                <button
                                    onClick={fetchQR}
                                    className="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Disclaimer */}
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                            ⚠️ Non-official WhatsApp integration for prototype and internal use only.
                            Not affiliated with Meta or WhatsApp.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-8">
                    Built by <span className="italic">Pranata</span> & <span className="italic">LumoraLabs</span>
                </p>
            </div>
        </div>
    );
}
