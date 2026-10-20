import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useAppContext } from '@/app-context';
import { useClientPagination, type ClientPagination } from '@/hooks/useClientPagination';
import { getRoles } from '@/services/role';
import type { RoleListItem } from '@/types/role';
import { errorMessage } from '@/utils/error';

interface PageContextValue {
    roles: RoleListItem[];
    pagination: ClientPagination<RoleListItem>;
    isLoading: boolean;
    failure: string | null;
    reload: () => void;
}
const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { session } = useAppContext();
    const [roles, setRoles] = useState<RoleListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [failure, setFailure] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const signature = session?.permissions.join(',') ?? '';
    const pagination = useClientPagination(roles, signature);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setFailure(null);
        void getRoles()
            .then((list) => {
                if (!cancelled) setRoles(list.data.items);
            })
            .catch((error: unknown) => {
                if (!cancelled) setFailure(errorMessage(error));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [reloadToken, signature]);

    return (
        <PageContext.Provider value={{ roles, pagination, isLoading, failure, reload: () => setReloadToken((value) => value + 1) }}>
            {children}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const value = useContext(PageContext);
    if (!value) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');
    return value;
};
