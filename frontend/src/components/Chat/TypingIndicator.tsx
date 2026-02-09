'use client';

import { PersonalityMode } from '@/types';

interface TypingIndicatorProps {
    mode: PersonalityMode;
}

export default function TypingIndicator({ mode }: TypingIndicatorProps) {
    return (
        <div className="flex items-center gap-1 h-8 px-2">
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
    );
}
