'use client';

import { useState, KeyboardEvent } from 'react';
import { PersonalityMode } from '@/types';
import { ArrowUp, Paperclip, Mic } from 'lucide-react';

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
        <div className="p-4 bg-zinc-950">
            <div className="max-w-4xl mx-auto">
                <div className={`
          relative bg-zinc-900 rounded-xl border transition-all duration-200
          ${input ? 'border-zinc-700 ring-1 ring-zinc-800' : 'border-zinc-800'}
        `}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${mode}...`}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-transparent text-zinc-200 placeholder-zinc-600 
              text-[15px] resize-none outline-none min-h-[56px] max-h-[200px]"
                        rows={1}
                        style={{ height: 'auto' }}
                    />

                    <div className="flex justify-between items-center px-2 pb-2">
                        <div className="flex gap-1">
                            <IconButton icon={Paperclip} />
                            <IconButton icon={Mic} />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={`
                p-2 rounded-lg transition-all duration-200 flex items-center gap-2
                ${input.trim() && !isLoading
                                    ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }
              `}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <ArrowUp size={16} />
                            )}
                        </button>
                    </div>
                </div>

                <div className="text-center mt-3">
                    <span className="text-[10px] text-zinc-600">
                        AI can make mistakes. Verify important information.
                    </span>
                </div>
            </div>
        </div>
    );
}

function IconButton({ icon: Icon }: { icon: any }) {
    return (
        <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
            <Icon size={18} />
        </button>
    );
}
