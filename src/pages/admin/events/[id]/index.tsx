import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageEventDetail = () => {
    useTitle('Peserta kegiatan');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
