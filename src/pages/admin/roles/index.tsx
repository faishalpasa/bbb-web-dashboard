import { useTitle } from '@/hooks/useTitle';
import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageRoles = () => {
    useTitle('Role dan Permission');
    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
