'use client';

import { Plus, Settings, Menu, X } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onReset: () => void;
    onOpenSettings: () => void;
    onToggle: () => void;
}

export default function Sidebar({
    isOpen,
    onReset,
    onOpenSettings,
    onToggle,
}: SidebarProps) {
    return (
        <div
            className={`${isOpen ? 'w-[240px]' : 'w-[52px]'
                } bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}
        >
            {/* Header */}
            <div className="h-12 flex items-center px-3 border-b border-zinc-200 dark:border-zinc-800 justify-between">
                {isOpen ? (
                    <>
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                            History
                        </span>
                        <button
                            onClick={onToggle}
                            className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                            title="Collapse"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onToggle}
                        className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 transition-colors mx-auto"
                        title="Expand"
                    >
                        <Menu size={16} />
                    </button>
                )}
            </div>

            {/* New Chat Button */}
            <div className="p-2">
                <button
                    onClick={onReset}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                        bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
                        hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors
                        ${!isOpen && 'justify-center px-0'}`}
                    title={!isOpen ? 'New chat' : ''}
                >
                    <Plus size={14} />
                    {isOpen && 'New chat'}
                </button>
            </div>

            {/* Placeholder for future chat history */}
            {isOpen && (
                <div className="flex-1 px-3 py-4">
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        Conversations will appear here.
                    </p>
                </div>
            )}

            {!isOpen && <div className="flex-1" />}

            {/* Bottom */}
            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={onOpenSettings}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm transition-colors
                        ${!isOpen && 'justify-center px-0'}`}
                    title={!isOpen ? 'Settings' : ''}
                >
                    <Settings size={14} />
                    {isOpen && 'Settings'}
                </button>
            </div>

            {/* Footer */}
            {isOpen && (
                <div className="px-3 pb-3 pt-2">
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
                        Made with love by LumoraLabs
                    </p>
                </div>
            )}
        </div>
    );
}
