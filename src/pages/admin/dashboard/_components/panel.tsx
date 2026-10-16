import type { PropsWithChildren, ReactNode } from 'react';

interface PanelProps extends PropsWithChildren {
    title: string;
    description?: ReactNode;
    'data-test-id': string;
}

export const Panel = ({ title, description, children, 'data-test-id': testId }: PanelProps) => (
    <section className="border-border bg-card rounded-lg border" data-test-id={testId}>
        <header className="border-border border-b px-4 py-3 last:border-b-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
        </header>
        {children}
    </section>
);
