'use client';

import { Memory, PersonalityMode } from '@/types';
import { Layers, Database, Shield } from 'lucide-react';

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
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">System Status</span>
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

                {/* Privacy Badge */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <Shield size={12} />
                        PRIVACY
                    </h3>
                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-900/50">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>Stateless Session</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
                            No personal data is stored. Context is cleared upon refresh.
                        </p>
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
                            <span className="text-zinc-500">Session</span>
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

function getModeDescription(mode: PersonalityMode): string {
    switch (mode) {
        case 'mentor': return 'Provides structured guidance and educational explanations.';
        case 'bestfriend': return 'Casual, supportive, and direct peer-to-peer conversation.';
        case 'strict': return 'No-nonsense, concise, and highly efficient responses.';
        case 'chaos': return 'Lateral thinking, brainstorming, and unconventional ideas.';
        default: return '';
    }
}
