import { AuthLayout } from '@/components/layout/auth-layout';
import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageLogin = () => {
    useTitle('Masuk');

    return (
        <PageContextProvider>
            <AuthLayout title="Masuk ke dashboard admin" description="Gunakan email dan password akun adminmu.">
                <PageContent />
            </AuthLayout>
        </PageContextProvider>
    );
};
