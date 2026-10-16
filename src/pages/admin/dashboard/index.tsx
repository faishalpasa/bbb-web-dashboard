import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageDashboard = () => {
    useTitle('Dashboard');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
