'use client';

import { Memory, PersonalityMode } from '@/types';
import { Brain, Layers, Database, ChevronRight } from 'lucide-react';

interface RightPanelProps {
    memory: Memory | null;
    mode: PersonalityMode;
}

export default function RightPanel({ memory, mode }: RightPanelProps) {
    if (!memory) return null;

    return (
        <div className="w-[300px] bg-zinc-950 border-l border-zinc-900 h-full flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-zinc-900">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Context & Memory</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Active Mode */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <Layers size={12} />
                        ACTIVE MODE
                    </h3>
                    <div className="bg-zinc-900/50 border border-zinc-900 rounded-lg p-3">
                        <div className="text-sm font-medium text-zinc-200 capitalize mb-1">{mode}</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">
                            {getModeDescription(mode)}
                        </div>
                    </div>
                </div>

                {/* User Profile Summary */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <UserIcon />
                        USER PROFILE
                    </h3>
                    <div className="space-y-2">
                        <ContextItem label="Role" value="Tech Student & Creator" />
                        <ContextItem label="Focus" value="AI, Web Dev, Automation" />
                        <ContextItem label="Language" value="Bahasa Indonesia (ID)" />
                    </div>
                </div>

                {/* System Stats */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <Database size={12} />
                        SYSTEM
                    </h3>
                    <div className="bg-zinc-900/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Memory</span>
                            <span className="text-zinc-300">Active</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">Model</span>
                            <span className="text-zinc-300">Llama 3.3 70B</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContextItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-start justify-between group cursor-default">
            <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</span>
            <span className="text-xs text-zinc-300 text-right max-w-[150px] truncate">{value}</span>
        </div>
    );
}

function UserIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function getModeDescription(mode: PersonalityMode): string {
    switch (mode) {
        case 'mentor': return 'Provides structured guidance and educational explanations.';
        case 'bestfriend': return 'Casual, supportive, and direct peer-to-peer conversation.';
        case 'strict': return 'No-nonsense, concise, and highly efficient responses.';
        case 'chaos': return 'Lateral thinking, brainstorming, and unconventional ideas.';
        default: return '';
    }
}
