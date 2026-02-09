'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { PersonalityMode } from '@/types';
import { ArrowUp, Paperclip, Mic, X } from 'lucide-react';
import { t, Language } from '@/lib/i18n';

interface InputAreaProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    mode: PersonalityMode;
    spokenLanguage: 'id-ID' | 'en-US' | 'auto'; // Added auto
    language: Language; // Added for UI text
}

export default function InputArea({ onSend, isLoading, mode, spokenLanguage, language }: InputAreaProps) {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Speech to Text Logic
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;

        // Handle Auto vs Explicit
        if (spokenLanguage && spokenLanguage !== 'auto') {
            recognition.lang = spokenLanguage;
        } else {
            recognition.lang = ''; // Browser default / Auto
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        if (isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }

        return () => recognition.stop();
    }, [isListening, spokenLanguage]);


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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setInput((prev) => prev + '\n\n' + text);
            };
            reader.readAsText(file);
        } else {
            alert("Currently only text files (.txt, .md) are supported for direct reading.");
        }

        e.target.value = '';
    };

    return (
        <div className="p-4 bg-background transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".txt,.md"
                />

                <div className={`
          relative bg-white dark:bg-zinc-800/50 rounded-xl border transition-all duration-200
          ${input ? 'border-zinc-400 dark:border-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-900/50' : 'border-zinc-200 dark:border-zinc-900'}
        `}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? t('listening', language) : `${t('messagePlaceholder', language)} ${mode}...`}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-transparent text-foreground placeholder-zinc-400 dark:placeholder-zinc-500 
              text-[15px] resize-none outline-none min-h-[56px] max-h-[200px]"
                        rows={1}
                        style={{ height: 'auto' }}
                    />

                    <div className="flex justify-between items-center px-2 pb-2">
                        <div className="flex gap-1">
                            <IconButton
                                icon={Paperclip}
                                onClick={() => fileInputRef.current?.click()}
                                label="Attach text file"
                            />
                            <IconButton
                                icon={Mic}
                                onClick={() => setIsListening(!isListening)}
                                active={isListening}
                                label="Voice Input"
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={`
                p-2 rounded-lg transition-all duration-200 flex items-center gap-2
                ${input.trim() && !isLoading
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
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
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                        {t('aiDisclaimer', language)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function IconButton({ icon: Icon, onClick, active, label }: { icon: any, onClick?: () => void, active?: boolean, label?: string }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`
                p-2 rounded-lg transition-colors group
                ${active
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'}
            `}
        >
            <Icon size={18} className={active ? 'animate-pulse' : ''} />
        </button>
    );
}
