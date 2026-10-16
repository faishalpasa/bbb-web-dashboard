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
            tone === 'error' ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-[#0f3b45]/30 bg-[#dbe8ea]/60 text-[#0f3b45]',
        )}
        role={tone === 'error' ? 'alert' : 'status'}
        data-test-id={testId}
    >
        {children}
    </div>
);
