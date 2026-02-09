'use client';

import { useState, KeyboardEvent } from 'react';
import { PersonalityMode } from '@/types';
import { ArrowUp } from 'lucide-react';
import { Language } from '@/lib/i18n';

interface InputAreaProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    mode: PersonalityMode;
    spokenLanguage: 'id-ID' | 'en-US' | 'auto';
    language: Language;
}

export default function InputArea({ onSend, isLoading }: InputAreaProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="px-4 py-3">
            <div className="max-w-3xl mx-auto">
                <div
                    className={`
                        relative flex items-end gap-2 bg-white dark:bg-zinc-900
                        rounded-2xl border transition-all duration-200 shadow-sm
                        ${input
                            ? 'border-zinc-300 dark:border-zinc-700 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800'
                        }
                    `}
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-transparent text-zinc-900 dark:text-zinc-100
                            placeholder-zinc-400 dark:placeholder-zinc-500
                            text-[15px] resize-none outline-none min-h-[48px] max-h-[160px]"
                        rows={1}
                    />

                    <div className="pr-2 pb-2">
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={`
                                p-2 rounded-xl transition-all duration-200
                                ${input.trim() && !isLoading
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                                }
                            `}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <ArrowUp size={16} strokeWidth={2.5} />
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center mt-2 text-[10px] text-zinc-400 dark:text-zinc-600">
                    AI may produce inaccurate information.
                </p>
            </div>
        </div>
    );
}
