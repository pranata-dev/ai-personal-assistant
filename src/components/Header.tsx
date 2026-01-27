'use client';

import { PersonalityMode } from '@/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
    mode: PersonalityMode;
    onReset: () => void;
}

export default function Header({ mode, onReset }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-100"></div>
                    <h1 className="font-medium text-sm text-zinc-300 tracking-tight">AI Assistant</h1>
                    <span className="text-zinc-600 text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        v1.0
                    </span>
                </div>

                {/* Helper */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
                        {mode} Mode
                    </div>

                    <div className="h-4 w-px bg-zinc-800/50" />
                    <ThemeToggle />
                    <div className="h-4 w-px bg-zinc-800/50" />

                    <button
                        onClick={onReset}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Reset Context"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>
        </header>
    );
}
