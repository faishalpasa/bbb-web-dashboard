import { ScaffoldLayout } from '@/components/layout/scaffold-layout';
import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageDashboard = () => {
    useTitle('Admin');
    return (
        <PageContextProvider>
            <ScaffoldLayout>
                <PageContent />
            </ScaffoldLayout>
        </PageContextProvider>
    );
};
