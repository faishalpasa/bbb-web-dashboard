import type { PropsWithChildren } from 'react';

interface AlertMessageProps extends PropsWithChildren {
    'data-test-id': string;
}

export const AlertMessage = ({ children, 'data-test-id': testId }: AlertMessageProps) => (
    <div
        className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-3 text-sm font-medium"
        role="alert"
        data-test-id={testId}
    >
        {children}
    </div>
);
