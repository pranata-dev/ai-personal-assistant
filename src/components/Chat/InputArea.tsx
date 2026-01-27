'use client';

import { useState, KeyboardEvent } from 'react';
import { PersonalityMode } from '@/types';
import { ArrowUp } from 'lucide-react';

interface InputAreaProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    mode: PersonalityMode;
}

export default function InputArea({ onSend, isLoading, mode }: InputAreaProps) {
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
        <div className="border-t border-zinc-900 bg-zinc-950 p-4">
            <div className="max-w-3xl mx-auto relative group">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-zinc-900 border border-zinc-800
            focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700
            text-zinc-200 placeholder-zinc-600 text-sm resize-none
            transition-all duration-200 outline-none
            min-h-[46px] max-h-[200px]"
                    style={{ height: 'auto' }}
                />

                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`
            absolute right-2 bottom-2 p-1.5 rounded-md transition-all duration-200
            ${input.trim() && !isLoading
                            ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-300'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }
          `}
                >
                    {isLoading ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                    ) : (
                        <ArrowUp size={16} />
                    )}
                </button>
            </div>

            <div className="max-w-3xl mx-auto mt-2 flex justify-between px-1">
                <p className="text-[10px] text-zinc-600">
                    CMD + Enter to send
                </p>
                <p className="text-[10px] text-zinc-700">
                    AI Assistant • Powered by Llama 3.3
                </p>
            </div>
        </div>
    );
}
