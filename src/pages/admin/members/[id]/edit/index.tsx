import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageMemberEdit = () => {
    useTitle('Edit data member');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
