'use client';

import { useState, KeyboardEvent } from 'react';
import { PersonalityMode } from '@/types';
import { getModeEmoji } from '@/lib/ai-engine';

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

    const placeholders: Record<PersonalityMode, string> = {
        mentor: 'Tanya apa yang ingin kamu pelajari...',
        bestfriend: 'Mau ngobrol apa nih? 😊',
        strict: 'Ketik pesan...',
        chaos: 'UNLEASH THE CHAOS!! 🔥'
    };

    return (
        <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-lg">
            {/* Command hints */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {['mode mentor', 'mode santai', 'chaos mode', 'bikinin prompt', 'help'].map((cmd) => (
                    <button
                        key={cmd}
                        onClick={() => setInput(cmd)}
                        className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full 
              bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white
              border border-white/10 transition-all duration-200"
                    >
                        {cmd}
                    </button>
                ))}
            </div>

            {/* Input area */}
            <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholders[mode]}
                        disabled={isLoading}
                        rows={1}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10
              focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
              text-white placeholder-gray-500 resize-none
              transition-all duration-200 outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[48px] max-h-[120px]"
                        style={{ height: 'auto' }}
                    />
                    {input.length > 200 && (
                        <span className="absolute right-3 bottom-3 text-xs text-gray-500">
                            {input.length}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`
            p-3 rounded-xl transition-all duration-200
            ${input.trim() && !isLoading
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-white/10 text-gray-500 cursor-not-allowed'
                        }
          `}
                >
                    {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
                Enter untuk kirim • Shift+Enter untuk baris baru • {getModeEmoji(mode)} Mode: {mode}
            </p>
        </div>
    );
}
