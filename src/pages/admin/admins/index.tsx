import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageAdmins = () => {
    useTitle('Admin');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
