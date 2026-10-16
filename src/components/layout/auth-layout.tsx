import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/brand-logo';

interface AuthLayoutProps {
    children?: ReactNode;
    title: string;
    description: ReactNode;
}

export const AuthLayout = ({ children, title, description }: AuthLayoutProps) => (
    <main
        className="bbb-auth-surface bg-background text-foreground flex min-h-svh items-center justify-center px-6 py-12"
        data-test-id="auth_layout_root"
    >
        <div className="flex w-full max-w-[342px] flex-col gap-9">
            <div className="space-y-9">
                <BrandLogo className="mx-auto w-[280px]" />

                <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-[-0.025em]">{title}</h1>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>
            {children}
        </div>
    </main>
);
