import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageMembers = () => {
    useTitle('Member');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
