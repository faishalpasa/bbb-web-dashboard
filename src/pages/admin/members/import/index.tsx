import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageMemberImport = () => {
    useTitle('Preview Masterlist');
    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
