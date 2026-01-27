'use client';

import { PersonalityMode } from '@/types';
import { BookOpen, User, Terminal, Sparkles, Settings, History, Plus } from 'lucide-react';
import { knowledgeBase } from '@/lib/knowledge-base';

interface SidebarProps {
    currentMode: PersonalityMode;
    onModeChange: (mode: PersonalityMode) => void;
    onReset: () => void;
}

export default function Sidebar({ currentMode, onModeChange, onReset }: SidebarProps) {
    const modes: { id: PersonalityMode; label: string; icon: any; desc: string }[] = [
        { id: 'mentor', label: 'Mentor', icon: BookOpen, desc: 'Guided learning' },
        { id: 'bestfriend', label: 'Peer', icon: User, desc: 'Casual chat' },
        { id: 'strict', label: 'Strict', icon: Terminal, desc: 'Direct answers' },
        { id: 'chaos', label: 'Creative', icon: Sparkles, desc: 'Brainstorming' },
    ];

    return (
        <div className="w-[260px] bg-zinc-950 border-r border-zinc-900 flex flex-col h-full flex-shrink-0">
            {/* App Header */}
            <div className="h-14 flex items-center px-4 border-b border-zinc-900">
                <div className="w-4 h-4 rounded bg-zinc-100 mr-2"></div>
                <span className="font-semibold text-zinc-200">AI Workspace</span>
            </div>

            {/* Main Nav */}
            <div className="p-2 space-y-1">
                <button
                    onClick={onReset}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm transition-colors border border-zinc-800"
                >
                    <Plus size={14} />
                    New Chat
                </button>
            </div>

            {/* Modes Section */}
            <div className="px-4 pt-6 pb-2 text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                Personality Modes
            </div>
            <div className="px-2 space-y-0.5">
                {modes.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = currentMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => onModeChange(mode.id)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200
                ${isActive
                                    ? 'bg-zinc-900 text-zinc-100'
                                    : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
                                }
              `}
                        >
                            <Icon size={16} className={isActive ? 'text-zinc-100' : 'text-zinc-600'} />
                            <div className="text-left">
                                <div className="font-medium leading-none">{mode.label}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex-1" />

            {/* Bottom Actions */}
            <div className="p-2 border-t border-zinc-900">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 text-sm transition-colors">
                    <Settings size={16} />
                    Settings
                </button>
                <div className="px-3 py-2 text-xs text-zinc-600 mt-1 flex justify-between">
                    <span>v1.2 Desktop</span>
                    <span className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></span>
                </div>
            </div>
        </div>
    );
}
