import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageInvitation = () => {
    useTitle('Aktifkan akun admin');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
