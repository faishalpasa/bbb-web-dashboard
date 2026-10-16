import { createContext, type FormEventHandler, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getAdmins, postActivateAdmin, postAdmin, postDeactivateAdmin } from '@/services/superadmin';
import type { LoadFailure } from '@/types/api';
import type { AdminAccount, AdminInvitationResult } from '@/types/superadmin';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';

interface InviteErrors {
    name?: string;
    email?: string;
}

interface PageContextValue {
    admins: AdminAccount[];
    failure: LoadFailure | null;
    isLoading: boolean;
    notice: { tone: 'success' | 'error'; text: string } | null;
    invitation: AdminInvitationResult | null;
    inviteFields: { name: string; email: string };
    inviteErrors: InviteErrors;
    isInviting: boolean;
    deactivating: AdminAccount | null;
    deactivateError: string | null;
    isDeactivating: boolean;
    pendingActivationId: string | null;
    setInviteField: (name: 'name' | 'email', value: string) => void;
    handleInvite: FormEventHandler<HTMLFormElement>;
    openDeactivate: (admin: AdminAccount) => void;
    closeDeactivate: () => void;
    confirmDeactivate: () => Promise<void>;
    activate: (admin: AdminAccount) => Promise<void>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState<PageContextValue['notice']>(null);
    const [invitation, setInvitation] = useState<AdminInvitationResult | null>(null);
    const [inviteFields, setInviteFields] = useState({ name: '', email: '' });
    const [inviteErrors, setInviteErrors] = useState<InviteErrors>({});
    const [isInviting, setIsInviting] = useState(false);
    const [deactivating, setDeactivating] = useState<AdminAccount | null>(null);
    const [deactivateError, setDeactivateError] = useState<string | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

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

    const handleInvite: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        const next: InviteErrors = {};

        if (!inviteFields.name.trim()) next.name = 'Nama harus diisi.';
        if (!inviteFields.email.trim()) next.email = 'Email harus diisi.';

        setInviteErrors(next);

        if (Object.keys(next).length > 0) return;

        setIsInviting(true);
        setNotice(null);
        setInvitation(null);

        try {
            const response = await postAdmin({ name: inviteFields.name.trim(), email: inviteFields.email.trim() });

            setInvitation(response.data);
            setInviteFields({ name: '', email: '' });
            setReloadToken((token) => token + 1);
        } catch (error) {
            const fieldErrors: InviteErrors = { name: fieldErrorMessage(error, 'name'), email: fieldErrorMessage(error, 'email') };

            setInviteErrors(fieldErrors);

            if (!fieldErrors.name && !fieldErrors.email) setNotice({ tone: 'error', text: errorMessage(error) });
        } finally {
            setIsInviting(false);
        }
    };

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

    const value = useMemo<PageContextValue>(
        () => ({
            admins,
            failure,
            isLoading,
            notice,
            invitation,
            inviteFields,
            inviteErrors,
            isInviting,
            deactivating,
            deactivateError,
            isDeactivating,
            pendingActivationId,
            setInviteField: (name, valueText) => {
                setInviteFields((current) => ({ ...current, [name]: valueText }));
                setInviteErrors((current) => ({ ...current, [name]: undefined }));
            },
            handleInvite,
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
        // handleInvite closes over the form fields, so it is rebuilt with them.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            admins,
            failure,
            isLoading,
            notice,
            invitation,
            inviteFields,
            inviteErrors,
            isInviting,
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
