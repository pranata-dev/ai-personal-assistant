'use client';

import { MessageSquare, Smartphone } from 'lucide-react';

interface ChannelSelectorProps {
    onSelectWeb: () => void;
    onSelectWhatsApp: () => void;
}

export default function ChannelSelector({ onSelectWeb, onSelectWhatsApp }: ChannelSelectorProps) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold text-foreground mb-3">
                        AI Personal Assistant
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Choose how you want to interact with your assistant
                    </p>
                </div>

                {/* Channel Options */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Web Option */}
                    <button
                        onClick={onSelectWeb}
                        className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg transition-all duration-200 text-left"
                    >
                        <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-medium text-foreground mb-2">
                            Use on Web
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Chat directly in your browser with full features and instant responses.
                        </p>
                    </button>

                    {/* WhatsApp Option */}
                    <button
                        onClick={onSelectWhatsApp}
                        className="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg transition-all duration-200 text-left"
                    >
                        <div className="w-14 h-14 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Smartphone className="w-7 h-7 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-medium text-foreground mb-2">
                            Use on WhatsApp
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Connect via QR code and chat from your phone.
                        </p>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-12">
                    Built by <span className="italic">Pranata</span> & <span className="italic">LumoraLabs</span>
                </p>
            </div>
        </div>
    );
}
