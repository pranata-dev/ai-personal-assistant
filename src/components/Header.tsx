'use client';

import { PersonalityMode } from '@/types';
import { knowledgeBase } from '@/lib/knowledge-base';

interface HeaderProps {
    mode: PersonalityMode;
    onReset: () => void;
}

export default function Header({ mode, onReset }: HeaderProps) {
    const modeConfig = knowledgeBase.personality.modes[mode];

    const modeColors: Record<PersonalityMode, string> = {
        mentor: 'from-purple-500 to-indigo-600',
        bestfriend: 'from-cyan-500 to-teal-600',
        strict: 'from-orange-500 to-red-600',
        chaos: 'from-pink-500 via-purple-500 to-cyan-500'
    };

    return (
        <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                    <div className={`
            w-10 h-10 rounded-xl bg-gradient-to-br ${modeColors[mode]}
            flex items-center justify-center text-xl
            transition-all duration-300
          `}>
                        🤖
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-lg">AI Assistant</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className={`
                px-2 py-0.5 rounded-full bg-gradient-to-r ${modeColors[mode]}
                text-white font-medium
              `}>
                                {modeConfig.emoji} {mode}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReset}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white
              transition-all duration-200"
                        title="Reset Memory"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
