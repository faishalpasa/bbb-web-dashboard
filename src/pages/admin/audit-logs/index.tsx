import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageAuditLogs = () => {
    useTitle('Log');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
