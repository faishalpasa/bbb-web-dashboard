import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { useAppContext } from '@/app-context';
import { toast } from '@/components/ui/toast';
import { getAdminRoleOptions } from '@/services/role';
import { postAdmin } from '@/services/superadmin';
import type { AdminRoleSummary } from '@/types/auth';
import type { AdminInvitationResult } from '@/types/superadmin';
import { errorMessage, fieldErrorMessage } from '@/utils/error';

interface InviteErrors {
    name?: string;
    email?: string;
    roleId?: string;
}

interface PageContextValue {
    fields: { name: string; email: string; roleId: string };
    errors: InviteErrors;
    roleOptions: AdminRoleSummary[];
    roleOptionsError: string | null;
    isLoadingRoles: boolean;
    isSubmitting: boolean;
    submitError: string | null;
    invitation: AdminInvitationResult | null;
    isConfirmOpen: boolean;
    confirmDescription: string;
    setField: (name: 'name' | 'email' | 'roleId', value: string) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    confirmSubmit: () => Promise<void>;
    closeConfirm: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { session } = useAppContext();
    const grantSignature = session?.permissions.join(',') ?? '';
    const [fields, setFields] = useState({ name: '', email: '', roleId: '' });
    const [errors, setErrors] = useState<InviteErrors>({});
    const [roleOptions, setRoleOptions] = useState<AdminRoleSummary[]>([]);
    const [roleOptionsError, setRoleOptionsError] = useState<string | null>(null);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<AdminInvitationResult | null>(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

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
    }, [grantSignature]);

    const validate = (): boolean => {
        const nextErrors: InviteErrors = {};

        if (!fields.name.trim()) nextErrors.name = 'Nama harus diisi.';
        if (!fields.email.trim()) nextErrors.email = 'Email harus diisi.';
        if (!fields.roleId) nextErrors.roleId = 'Role harus dipilih.';

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
            return false;
        }

        return true;
    };

    // Checks the form first, so the confirmation only appears for something that can be sent.
    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (isSubmitting || !validate()) return;
        setConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError(null);
        setInvitation(null);

        try {
            const response = await postAdmin({ name: fields.name.trim(), email: fields.email.trim(), roleId: fields.roleId });

            setInvitation(response.data);
            toast.add({ type: 'success', title: 'Undangan admin berhasil dibuat.' });
            setFields({ name: '', email: '', roleId: '' });
        } catch (error) {
            const fieldErrors: InviteErrors = {
                name: fieldErrorMessage(error, 'name'),
                email: fieldErrorMessage(error, 'email'),
                roleId: fieldErrorMessage(error, 'roleId'),
            };

            setErrors(fieldErrors);

            if (!fieldErrors.name && !fieldErrors.email && !fieldErrors.roleId) setSubmitError(errorMessage(error));
            else toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
        } finally {
            setIsSubmitting(false);
            setConfirmOpen(false);
        }
    };

    const roleLabel = roleOptions.find((role) => role.id === fields.roleId)?.label ?? 'admin';
    const confirmDescription = `Email undangan dikirim ke ${fields.email.trim()} supaya ${fields.name.trim()} bisa membuat password sendiri. Role: ${roleLabel}.`;

    const value = useMemo<PageContextValue>(
        () => ({
            fields,
            errors,
            roleOptions,
            roleOptionsError,
            isLoadingRoles,
            isSubmitting,
            submitError,
            invitation,
            isConfirmOpen,
            confirmDescription,
            setField: (name, valueText) => {
                setFields((current) => ({ ...current, [name]: valueText }));
                setErrors((current) => ({ ...current, [name]: undefined }));
            },
            handleSubmit,
            confirmSubmit,
            closeConfirm: () => setConfirmOpen(false),
        }),
        // handleSubmit closes over the current form fields.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fields, errors, roleOptions, roleOptionsError, isLoadingRoles, isSubmitting, submitError, invitation, isConfirmOpen],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
