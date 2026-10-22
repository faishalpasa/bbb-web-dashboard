import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageResetPassword = () => {
    useTitle('Atur ulang password');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
