import { useAppContext } from '@/app-context';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { appName } = useAppContext();
    const { isScaffold } = usePageContext();
    return (
        <section className="border-border bg-card w-full max-w-xl space-y-4 rounded-xl border p-8" data-test-id="dashboard_scaffold_content">
            <h1 className="text-2xl font-semibold">{appName}</h1>
            {isScaffold && (
                <p className="text-muted-foreground">
                    Fondasi aplikasi admin sudah siap. Tampilan dashboard dan autentikasi admin belum diimplementasikan.
                </p>
            )}
        </section>
    );
};
