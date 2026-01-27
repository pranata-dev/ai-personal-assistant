'use client';

import { X, Moon, Sun, Globe, Languages, Zap } from 'lucide-react';
import { t, Language } from '@/lib/i18n';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    spokenLanguage: 'id-ID' | 'en-US' | 'auto';
    setSpokenLanguage: (lang: 'id-ID' | 'en-US' | 'auto') => void;
}

export default function SettingsModal({
    isOpen, onClose,
    language, setLanguage,
    theme, setTheme,
    spokenLanguage, setSpokenLanguage
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{t('settingsTitle', language)}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Theme */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                            {t('appearance', language)}
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setTheme('dark')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark'
                                        ? 'bg-zinc-800 text-blue-400 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {t('darkMode', language)}
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light'
                                        ? 'bg-white text-zinc-900 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {t('lightMode', language)}
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-600">
                            {t('lightModeNote', language)}
                        </p>
                    </div>

                    {/* Interface Language */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Globe size={16} />
                            {t('interfaceLanguage', language)}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${language === 'en'
                                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 dark:text-blue-400'
                                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="text-xs font-semibold">English</div>
                            </button>
                            <button
                                onClick={() => setLanguage('id')}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${language === 'id'
                                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-500 dark:text-blue-400'
                                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="text-xs font-semibold">Indonesia</div>
                            </button>
                        </div>
                    </div>

                    {/* Spoken Language */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Languages size={16} />
                            {t('spokenLanguage', language)}
                        </label>
                        <div className="relative">
                            <select
                                value={spokenLanguage}
                                onChange={(e) => setSpokenLanguage(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-300 outline-none focus:border-blue-500/50 transition-colors appearance-none"
                            >
                                <option value="auto">Auto Detect (Browser Default)</option>
                                <option value="id-ID">Bahasa Indonesia (ID)</option>
                                <option value="en-US">English (US)</option>
                            </select>
                            <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-500">
                                <Zap size={14} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-zinc-500">{t('statelessSession', language)}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
                    >
                        {t('done', language)}
                    </button>
                </div>
            </div>
        </div>
    );
}
