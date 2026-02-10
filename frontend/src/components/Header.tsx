'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Trash2 } from 'lucide-react';

interface HeaderProps {
    onClear: () => void;
}

export default function Header({ onClear }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
                {/* Title */}
                <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100"></div>
                    <h1 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Personal Agent
                    </h1>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                        onClick={onClear}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Clear History"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
