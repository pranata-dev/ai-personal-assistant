'use client';

import { useState, useRef, useEffect } from 'react';
import { MODELS, AIModel } from '@/lib/models';
import { ChevronDown } from 'lucide-react';

interface ModelSelectorProps {
    currentModel: string;
    onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selected = MODELS.find(m => m.id === currentModel) || MODELS[0];

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
                <span>{selected.name}</span>
                <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 overflow-hidden">
                    {MODELS.map((model) => (
                        <button
                            key={model.id}
                            onClick={() => {
                                onModelChange(model.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${model.id === currentModel ? 'bg-zinc-50 dark:bg-zinc-800' : ''
                                }`}
                        >
                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                {model.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {model.description}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
