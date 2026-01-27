'use client';

import { PersonalityMode } from '@/types';

interface TypingIndicatorProps {
    mode: PersonalityMode;
}

export default function TypingIndicator({ mode }: TypingIndicatorProps) {
    const modeColors: Record<PersonalityMode, string> = {
        mentor: 'bg-purple-500',
        bestfriend: 'bg-cyan-500',
        strict: 'bg-orange-500',
        chaos: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500'
    };

    return (
        <div className="flex gap-3 animate-fade-in">
            <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${modeColors[mode]}
      `}>
                <span className="animate-pulse">💭</span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
