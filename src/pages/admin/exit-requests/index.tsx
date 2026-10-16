import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageExitRequests = () => {
    useTitle('Permintaan keluar');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
