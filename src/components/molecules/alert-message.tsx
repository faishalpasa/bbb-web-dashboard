import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

interface AlertMessageProps extends PropsWithChildren {
    tone?: 'error' | 'success';
    'data-test-id': string;
}

export const AlertMessage = ({ children, tone = 'error', 'data-test-id': testId }: AlertMessageProps) => (
    <div
        className={cn(
            'rounded-md border p-3 text-sm font-medium',
            tone === 'error' ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-[#0a5c5a]/30 bg-[#d6ecea]/60 text-[#0a5c5a]',
        )}
        role={tone === 'error' ? 'alert' : 'status'}
        data-test-id={testId}
    >
        {children}
    </div>
);
