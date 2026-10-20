import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAppContext } from '@/app-context';
import { PERMISSIONS as P } from '@/constants/permission';
import { useClientPagination, type ClientPagination } from '@/hooks/useClientPagination';
import { usePermissions } from '@/hooks/usePermissions';
import { getAdminRoleOptions, putAdminRole } from '@/services/role';
import { getAdmins, postActivateAdmin, postDeactivateAdmin } from '@/services/superadmin';
import type { LoadFailure } from '@/types/api';
import type { AdminRoleSummary } from '@/types/auth';
import type { AdminAccount } from '@/types/superadmin';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';

interface PageContextValue {
    admins: AdminAccount[];
    pagination: ClientPagination<AdminAccount>;
    failure: LoadFailure | null;
    isLoading: boolean;
    notice: { tone: 'success' | 'error'; text: string } | null;
    deactivating: AdminAccount | null;
    deactivateError: string | null;
    isDeactivating: boolean;
    pendingActivationId: string | null;
    roleOptions: AdminRoleSummary[];
    roleOptionsError: string | null;
    isLoadingRoles: boolean;
    changingRole: AdminAccount | null;
    nextRoleId: string;
    roleChangeError: string | null;
    isChangingRole: boolean;
    openRoleChange: (admin: AdminAccount) => void;
    closeRoleChange: () => void;
    setNextRoleId: (id: string) => void;
    confirmRoleChange: () => Promise<void>;
    openDeactivate: (admin: AdminAccount) => void;
    closeDeactivate: () => void;
    confirmDeactivate: () => Promise<void>;
    activate: (admin: AdminAccount) => Promise<void>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { can } = usePermissions();
    const { session } = useAppContext();
    const grantSignature = session?.permissions.join(',') ?? '';
    const canChangeRole = can(P.ADMIN_ROLE_UPDATE);
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const pagination = useClientPagination(admins, grantSignature);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState<PageContextValue['notice']>(null);
    const [roleOptions, setRoleOptions] = useState<AdminRoleSummary[]>([]);
    const [roleOptionsError, setRoleOptionsError] = useState<string | null>(null);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [changingRole, setChangingRole] = useState<AdminAccount | null>(null);
    const [nextRoleId, setNextRoleId] = useState('');
    const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
    const [isChangingRole, setIsChangingRole] = useState(false);
    const [deactivating, setDeactivating] = useState<AdminAccount | null>(null);
    const [deactivateError, setDeactivateError] = useState<string | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;
        if (!canChangeRole) {
            setRoleOptions([]);
            setIsLoadingRoles(false);
            return;
        }
        setIsLoadingRoles(true);
        setRoleOptionsError(null);
        void getAdminRoleOptions()
            .then((response) => {
                if (!cancelled) setRoleOptions(response.data.items);
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setRoleOptions([]);
                    setRoleOptionsError(errorMessage(error));
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoadingRoles(false);
            });
        return () => {
            cancelled = true;
        };
    }, [canChangeRole, reloadToken, grantSignature]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                setAdmins((await getAdmins()).data.items);
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [reloadToken]);

    const confirmDeactivate = useCallback(async () => {
        if (!deactivating) return;

        setIsDeactivating(true);
        setDeactivateError(null);

        try {
            await postDeactivateAdmin(deactivating.id);
            setNotice({ tone: 'success', text: `${deactivating.name} dinonaktifkan. Riwayat kerjanya tetap tersimpan.` });
            setDeactivating(null);
            setReloadToken((token) => token + 1);
        } catch (error) {
            setDeactivateError(errorMessage(error));
        } finally {
            setIsDeactivating(false);
        }
    }, [deactivating]);

    const activate = useCallback(async (admin: AdminAccount) => {
        setPendingActivationId(admin.id);
        setNotice(null);

        try {
            await postActivateAdmin(admin.id);
            setNotice({ tone: 'success', text: `${admin.name} diaktifkan kembali.` });
            setReloadToken((token) => token + 1);
        } catch (error) {
            setNotice({ tone: 'error', text: errorMessage(error) });
        } finally {
            setPendingActivationId(null);
        }
    }, []);

    const confirmRoleChange = useCallback(async () => {
        if (!changingRole || !nextRoleId || isChangingRole || isLoadingRoles || !roleOptions.some((role) => role.id === nextRoleId)) return;
        setIsChangingRole(true);
        setRoleChangeError(null);
        try {
            await putAdminRole(changingRole.id, nextRoleId);
            setChangingRole(null);
            setNotice({ tone: 'success', text: `Role ${changingRole.name} berhasil diubah. Akses berlaku pada request berikutnya.` });
            setReloadToken((value) => value + 1);
        } catch (error) {
            setRoleChangeError(fieldErrorMessage(error, 'roleId') ?? errorMessage(error));
        } finally {
            setIsChangingRole(false);
        }
    }, [changingRole, nextRoleId, isChangingRole, isLoadingRoles, roleOptions]);

    const value = useMemo<PageContextValue>(
        () => ({
            admins,
            pagination,
            failure,
            isLoading,
            notice,
            roleOptions,
            roleOptionsError,
            isLoadingRoles,
            changingRole,
            nextRoleId,
            roleChangeError,
            isChangingRole,
            setNextRoleId,
            confirmRoleChange,
            openRoleChange: (admin) => {
                setChangingRole(admin);
                setNextRoleId(admin.roleInfo.id);
                setRoleChangeError(null);
                setReloadToken((value) => value + 1);
            },
            closeRoleChange: () => setChangingRole(null),
            deactivating,
            deactivateError,
            isDeactivating,
            pendingActivationId,
            openDeactivate: (admin) => {
                setDeactivateError(null);
                setNotice(null);
                setDeactivating(admin);
            },
            closeDeactivate: () => setDeactivating(null),
            confirmDeactivate,
            activate,
            reload: () => setReloadToken((token) => token + 1),
        }),
        [
            admins,
            pagination,
            failure,
            isLoading,
            notice,
            roleOptions,
            roleOptionsError,
            isLoadingRoles,
            changingRole,
            nextRoleId,
            roleChangeError,
            isChangingRole,
            confirmRoleChange,
            deactivating,
            deactivateError,
            isDeactivating,
            pendingActivationId,
            confirmDeactivate,
            activate,
        ],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
