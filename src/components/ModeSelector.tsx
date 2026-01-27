'use client';

import { PersonalityMode } from '@/types';
import { knowledgeBase } from '@/lib/knowledge-base';

interface ModeSelectorProps {
    currentMode: PersonalityMode;
    onModeChange: (mode: PersonalityMode) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export default function ModeSelector({ currentMode, onModeChange, isOpen, onToggle }: ModeSelectorProps) {
    const modes = Object.entries(knowledgeBase.personality.modes) as [PersonalityMode, typeof knowledgeBase.personality.modes.mentor][];
    const currentModeConfig = knowledgeBase.personality.modes[currentMode];

    const modeColors: Record<PersonalityMode, string> = {
        mentor: 'from-purple-500 to-indigo-600',
        bestfriend: 'from-cyan-500 to-teal-600',
        strict: 'from-orange-500 to-red-600',
        chaos: 'from-pink-500 via-purple-500 to-cyan-500'
    };

    return (
        <div className="fixed bottom-24 right-4 z-50">
            {/* Mode options (visible when open) */}
            <div className={`
        absolute bottom-full right-0 mb-2 transition-all duration-300
        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
                <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-2 shadow-xl">
                    {modes.map(([mode, config]) => (
                        <button
                            key={mode}
                            onClick={() => {
                                onModeChange(mode);
                                onToggle();
                            }}
                            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 text-left
                ${currentMode === mode
                                    ? `bg-gradient-to-r ${modeColors[mode]} text-white`
                                    : 'hover:bg-white/10 text-gray-300'
                                }
              `}
                        >
                            <span className="text-xl">{config.emoji}</span>
                            <div>
                                <div className="font-medium capitalize">{mode}</div>
                                <div className="text-xs opacity-70">{config.tone}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggle button */}
            <button
                onClick={onToggle}
                className={`
          w-14 h-14 rounded-full shadow-lg
          bg-gradient-to-r ${modeColors[currentMode]}
          flex items-center justify-center text-2xl
          transition-all duration-300 hover:scale-110
          ${isOpen ? 'rotate-180' : ''}
        `}
            >
                {currentModeConfig.emoji}
            </button>
        </div>
    );
}
