'use client';

import { PersonalityMode } from '@/types';
import { Sparkles, Terminal, BookOpen, User, Zap } from 'lucide-react';

interface ModeSelectorProps {
    currentMode: PersonalityMode;
    onModeChange: (mode: PersonalityMode) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export default function ModeSelector({ currentMode, onModeChange, isOpen, onToggle }: ModeSelectorProps) {
    const modes: { id: PersonalityMode; label: string; icon: any }[] = [
        { id: 'mentor', label: 'Mentor', icon: BookOpen },
        { id: 'bestfriend', label: 'Peer', icon: User },
        { id: 'strict', label: 'Strict', icon: Terminal },
        { id: 'chaos', label: 'Creative', icon: Sparkles },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Mode List */}
            <div className={`
        mb-3 transition-all duration-200 origin-bottom-right
        ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
      `}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-1 min-w-[160px]">
                    {modes.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = currentMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => {
                                    onModeChange(mode.id);
                                    onToggle();
                                }}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
                  transition-colors duration-200
                  ${isActive
                                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                    }
                `}
                            >
                                <Icon size={14} className={isActive ? 'text-zinc-100' : 'text-zinc-500'} />
                                {mode.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className={`
          h-10 px-4 rounded-full shadow-lg border border-zinc-800
          flex items-center gap-2 text-xs font-medium uppercase tracking-wider
          transition-all duration-200 hover:border-zinc-700
          ${isOpen ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}
        `}
            >
                <Zap size={14} className={isOpen ? 'text-zinc-900' : 'text-zinc-500'} />
                <span>{isOpen ? 'Close' : 'Mode'}</span>
            </button>
        </div>
    );
}
