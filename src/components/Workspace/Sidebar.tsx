'use client';

import { PersonalityMode } from '@/types';
import { BookOpen, User, Terminal, Sparkles, Settings, Plus, Cpu, ChevronDown, Menu, X, Info } from 'lucide-react';
import { AVAILABLE_MODELS, getModelById } from '@/lib/models';
import { useMemo, useState } from 'react';
import { t, Language } from '@/lib/i18n';

interface SidebarProps {
    currentMode: PersonalityMode;
    currentModelId: string;
    language: Language;
    isOpen: boolean;
    onModeChange: (mode: PersonalityMode) => void;
    onModelChange: (modelId: string) => void;
    onReset: () => void;
    onOpenSettings: () => void;
    onOpenSystemStatus: () => void;
    onToggle: () => void;
}

export default function Sidebar({
    currentMode,
    currentModelId,
    language,
    isOpen,
    onModeChange,
    onModelChange,
    onReset,
    onOpenSettings,
    onOpenSystemStatus,
    onToggle
}: SidebarProps) {
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    const modes: { id: PersonalityMode; label: string; icon: any; desc: string }[] = [
        { id: 'mentor', label: t('modeMentor', language), icon: BookOpen, desc: t('modeMentorDesc', language) },
        { id: 'bestfriend', label: t('modePeer', language), icon: User, desc: t('modePeerDesc', language) },
        { id: 'strict', label: t('modeStrict', language), icon: Terminal, desc: t('modeStrictDesc', language) },
        { id: 'chaos', label: t('modeCreative', language), icon: Sparkles, desc: t('modeCreativeDesc', language) },
    ];

    const currentModel = useMemo(() => getModelById(currentModelId), [currentModelId]);

    return (
        <div className={`${isOpen ? 'w-[260px]' : 'w-[60px]'} bg-background border-r border-zinc-200 dark:border-zinc-950 flex flex-col h-full flex-shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden`}>
            {/* App Header */}
            <div className="h-14 flex items-center px-3 border-b border-zinc-200 dark:border-zinc-950 justify-between">
                {isOpen ? (
                    <>
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded bg-zinc-900 dark:bg-zinc-100 mr-2"></div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">AI Workspace</span>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-600 transition-colors"
                            title="Collapse sidebar"
                        >
                            <X size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-600 transition-colors mx-auto"
                        title="Expand sidebar"
                    >
                        <Menu size={18} />
                    </button>
                )}
            </div>

            {/* Main Nav */}
            <div className="p-2 space-y-1">
                <button
                    onClick={onReset}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm transition-colors border border-zinc-200 dark:border-zinc-900 ${!isOpen && 'justify-center'}`}
                    title={!isOpen ? t('newChat', language) : ''}
                >
                    <Plus size={14} />
                    {isOpen && t('newChat', language)}
                </button>
            </div>

            {/* Model Selector */}
            {isOpen && (
                <div className="px-2 mt-2 sticky">
                    <div className="px-2 text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5">
                        {t('aiModel', language)}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 transition-all text-sm group"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Cpu size={14} className="text-blue-500 flex-shrink-0" />
                                <span className="text-zinc-700 dark:text-zinc-300 truncate">{currentModel?.name || t('selectModel', language)}</span>
                            </div>
                            <ChevronDown size={14} className="text-zinc-500 dark:text-zinc-600 group-hover:text-zinc-800 dark:group-hover:text-zinc-400" />
                        </button>

                        {/* Dropdown */}
                        {isModelMenuOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 rounded-md shadow-xl py-1 z-30 overflow-hidden">
                                {AVAILABLE_MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            onModelChange(model.id);
                                            setIsModelMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors 
                                            ${currentModelId === model.id
                                                ? 'text-blue-600 dark:text-blue-400 bg-zinc-50 dark:bg-zinc-800/50'
                                                : 'text-zinc-600 dark:text-zinc-400'}`}
                                    >
                                        <div className="font-medium">{model.name}</div>
                                        <div className="text-[10px] text-zinc-500 dark:text-zinc-600 truncate">{model.role}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modes Section */}
            <div className={`px-4 pt-6 pb-2 text-[10px] font-medium text-zinc-500 uppercase tracking-widest ${!isOpen && 'px-0 text-center'}`}>
                {isOpen ? t('personalityModes', language) : '•••'}
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
                                    ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                                    : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-300'
                                }
                ${!isOpen && 'justify-center'}
              `}
                            title={!isOpen ? mode.label : ''}
                        >
                            <Icon size={16} className={isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-600'} />
                            {isOpen && (
                                <div className="text-left">
                                    <div className="font-medium leading-none">{mode.label}</div>
                                    <div className="text-[10px] mt-0.5 opacity-70">{mode.desc}</div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1" />

            {/* Bottom Actions */}
            <div className="p-2 border-t border-zinc-200 dark:border-zinc-950 space-y-0.5">
                <button
                    onClick={onOpenSystemStatus}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm transition-colors ${!isOpen && 'justify-center'}`}
                    title={!isOpen ? t('systemStatus', language) : ''}
                >
                    <Info size={16} />
                    {isOpen && t('systemStatus', language)}
                </button>
                <button
                    onClick={onOpenSettings}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm transition-colors ${!isOpen && 'justify-center'}`}
                    title={!isOpen ? t('settings', language) : ''}
                >
                    <Settings size={16} />
                    {isOpen && t('settings', language)}
                </button>
                {isOpen && (
                    <div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-600 mt-1 flex justify-between">
                        <span>v1.5 Toggle</span>
                        <span className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></span>
                    </div>
                )}
            </div>
        </div>
    );
}
