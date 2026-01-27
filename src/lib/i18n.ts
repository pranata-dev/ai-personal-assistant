export type Language = 'en' | 'id';

export const translations = {
    en: {
        // Sidebar
        newChat: 'New Chat',
        aiModel: 'AI MODEL',
        selectModel: 'Select Model',
        personalityModes: 'PERSONALITY MODES',
        settings: 'Settings',
        modeMentor: 'Mentor',
        modePeer: 'Peer',
        modeStrict: 'Strict',
        modeCreative: 'Creative',
        modeMentorDesc: 'Guided learning',
        modePeerDesc: 'Casual chat',
        modeStrictDesc: 'Direct answers',
        modeCreativeDesc: 'Brainstorming',

        // Settings Modal
        settingsTitle: 'Settings',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        lightModeNote: 'Note: Light mode is experimental.',
        interfaceLanguage: 'Interface Language',
        spokenLanguage: 'Spoken Language (Mic)',
        statelessSession: 'Stateless Session',
        done: 'Done',

        // Right Panel
        systemStatus: 'SYSTEM STATUS',
        activeMode: 'ACTIVE MODE',
        modelEngine: 'MODEL ENGINE',
        privacy: 'PRIVACY',
        privacyDesc: 'No personal data is stored. Context is cleared upon refresh.',
        unknownModel: 'Unknown Model',

        // Input Area
        messagePlaceholder: 'Message',
        aiDisclaimer: 'AI can make mistakes. Verify important information.',
        listening: 'Listening...',

        // Empty State
        readyToCollaborate: 'Ready to collaborate',
        emptyStateDesc: 'Select a mode or start typing to begin. Your session is private and stateless.',
        draftEmail: 'Draft Email',
        brainstormIdeas: 'Brainstorm Ideas',
    },
    id: {
        // Sidebar
        newChat: 'Chat Baru',
        aiModel: 'MODEL AI',
        selectModel: 'Pilih Model',
        personalityModes: 'MODE PERSONALITAS',
        settings: 'Pengaturan',
        modeMentor: 'Mentor',
        modePeer: 'Teman',
        modeStrict: 'Tegas',
        modeCreative: 'Kreatif',
        modeMentorDesc: 'Pembelajaran terpandu',
        modePeerDesc: 'Obrolan santai',
        modeStrictDesc: 'Jawaban langsung',
        modeCreativeDesc: 'Tukar pikiran',

        // Settings Modal
        settingsTitle: 'Pengaturan',
        appearance: 'Tampilan',
        darkMode: 'Mode Gelap',
        lightMode: 'Mode Terang',
        lightModeNote: 'Catatan: Mode terang masih eksperimental.',
        interfaceLanguage: 'Bahasa Antarmuka',
        spokenLanguage: 'Bahasa Bicara (Mic)',
        statelessSession: 'Sesi Tanpa Status',
        done: 'Selesai',

        // Right Panel
        systemStatus: 'STATUS SISTEM',
        activeMode: 'MODE AKTIF',
        modelEngine: 'MESIN MODEL',
        privacy: 'PRIVASI',
        privacyDesc: 'Data tidak disimpan. Konteks dihapus saat refresh.',
        unknownModel: 'Model Tidak Diketahui',

        // Input Area
        messagePlaceholder: 'Ketik pesan',
        aiDisclaimer: 'AI bisa salah. Verifikasi informasi penting.',
        listening: 'Mendengarkan...',

        // Empty State
        readyToCollaborate: 'Siap berkolaborasi',
        emptyStateDesc: 'Pilih mode atau mulai mengetik. Sesi ini privat dan tidak disimpan.',
        draftEmail: 'Tulis Email',
        brainstormIdeas: 'Cari Ide',
    }
};

export function t(key: keyof typeof translations['en'], lang: Language): string {
    return translations[lang][key] || translations['en'][key];
}
