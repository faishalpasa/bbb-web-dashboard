import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageEventEdit = () => {
    useTitle('Edit kegiatan');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
