import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageMemberNew = () => {
    useTitle('Member baru');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
