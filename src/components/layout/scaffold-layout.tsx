import type { PropsWithChildren } from 'react';

// Technical placeholder, not the admin artboard/sidebar implementation.
export const ScaffoldLayout = ({ children }: PropsWithChildren) => (
    <main className="mx-auto flex min-h-screen max-w-[1360px] items-center justify-center p-8" data-test-id="scaffold_layout_root">
        {children}
    </main>
);
