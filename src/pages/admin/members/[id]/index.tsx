import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageMemberDetail = () => {
    useTitle('Detail member');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
