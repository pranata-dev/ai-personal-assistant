'use client';

import { Memory, PersonalityMode } from '@/types';
import { Layers, Shield, Cpu, Menu, X } from 'lucide-react';
import { getModelById } from '@/lib/models';
import { t, Language } from '@/lib/i18n';

interface RightPanelProps {
    memory: Memory | null;
    mode: PersonalityMode;
    isOpen: boolean;
    onToggle: () => void;
}

export default function RightPanel({ memory, mode, isOpen, onToggle }: RightPanelProps) {
    if (!memory) return null;

    const currentModelId = memory.preferences.currentModelId;
    const currentModel = getModelById(currentModelId);
    const language = memory.preferences.language as Language || 'en';

    return (
        <div className={`${isOpen ? 'w-[300px]' : 'w-[60px]'} bg-background border-l border-border h-full flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}>
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-border justify-between">
                {isOpen ? (
                    <>
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{t('systemStatus', language)}</span>
                        <button
                            onClick={onToggle}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-600 transition-colors"
                            title="Collapse panel"
                        >
                            <X size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-600 transition-colors mx-auto"
                        title="Expand panel"
                    >
                        <Menu size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Active Mode */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <Layers size={12} />
                        {t('activeMode', language)}
                    </h3>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-border rounded-lg p-3">
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 capitalize mb-1">{mode}</div>
                        <div className="text-xs text-zinc-500 leading-relaxed">
                            {getModeDescription(mode)}
                        </div>
                    </div>
                </div>

                {/* Model Info */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <Cpu size={12} />
                        {t('modelEngine', language)}
                    </h3>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-border rounded-lg p-3">
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">{currentModel?.name || t('unknownModel', language)}</div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">
                            {currentModel?.description}
                        </p>
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] border border-blue-200 dark:border-blue-500/20">
                            {currentModel?.role.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Privacy Badge */}
                <div>
                    <h3 className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-2">
                        <Shield size={12} />
                        {t('privacy', language)}
                    </h3>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>{t('statelessSession', language)}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                            {t('privacyDesc', language)}
                        </p>
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
