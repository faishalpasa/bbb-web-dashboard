import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { useAppContext } from '@/app-context';
import { getRoles } from '@/services/role';
import type { RoleListItem } from '@/types/role';
import { errorMessage } from '@/utils/error';

interface PageContextValue {
    roles: RoleListItem[];
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
        <PageContext.Provider value={{ roles, isLoading, failure, reload: () => setReloadToken((value) => value + 1) }}>
            {children}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const value = useContext(PageContext);
    if (!value) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');
    return value;
};
