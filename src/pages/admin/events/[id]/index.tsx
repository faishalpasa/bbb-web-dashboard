import { PERMISSIONS as P } from '@/constants/permission';
import { usePermissions } from '@/hooks/usePermissions';
import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageEventDetail = () => {
    const { can } = usePermissions();
    useTitle(can(P.EVENT_PARTICIPANT_VIEW) ? 'Peserta kegiatan' : 'Detail kegiatan');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
