'use client';

import { ReactNode } from 'react';

export default function MainArea({ children }: { children: ReactNode }) {
    return (
        <div className="flex-1 flex flex-col h-full bg-background min-w-0 relative">
            {children}
        </div>
    );
}
