import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
    children: ReactNode;
    className?: string;
    'data-test-id': string;
}

export const AdminPageHeader = ({ children, className, 'data-test-id': testId }: AdminPageHeaderProps) => (
    <section
        className={cn(
            'border-border bg-card sticky top-14 z-30 -mx-4 -mt-4 space-y-4 border-b px-4 py-4 lg:top-0 lg:-mx-6 lg:-mt-6 lg:px-6',
            className,
        )}
        data-test-id={testId}
    >
        {children}
    </section>
);
