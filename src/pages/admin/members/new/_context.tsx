import { useNavigate } from '@tanstack/react-router';
import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { ROUTES } from '@/constants/route';
import { type MemberForm, useMemberForm } from '@/hooks/useMemberForm';
import { getMemberOptions, postMember } from '@/services/member';
import type { SelectOption } from '@/types/api';
import { errorMessage } from '@/utils/error';

interface PageContextValue {
    form: MemberForm;
    preferences: SelectOption[];
    sendInvitation: boolean;
    consentAcknowledged: boolean;
    isSubmitting: boolean;
    submitError: string | null;
    isConfirmOpen: boolean;
    confirmDescription: string;
    setSendInvitation: (value: boolean) => void;
    setConsentAcknowledged: (value: boolean) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    confirmSubmit: () => Promise<void>;
    closeConfirm: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const form = useMemberForm();
    const [preferences, setPreferences] = useState<SelectOption[]>([]);
    const [sendInvitation, setSendInvitation] = useState(true);
    const [consentAcknowledged, setConsentAcknowledged] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const { data } = await getMemberOptions();
                setPreferences(data.preferences);
                form.reading.setOptions(data.readingProfileOptions);
            } catch {
                setSubmitError('Pilihan preferensi gagal dimuat. Muat ulang halaman untuk mencoba lagi.');
            }
        };

        void loadPreferences();
        // Options are loaded once, not whenever the form draft changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Checks the form first, so the confirmation only appears for something that can be saved.
    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (isSubmitting) return;
        setSubmitError(null);

        if (!form.validate({ requireEmail: true })) {
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
            return;
        }

        setConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        if (isSubmitting) return;
        const input = form.validate({ requireEmail: true });

        if (!input) {
            setConfirmOpen(false);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await postMember({
                ...input,
                email: form.fields.email.trim(),
                sendInvitation,
                consentAcknowledged,
            });

            toast.add({ type: 'success', title: 'Member berhasil ditambahkan.' });
            void navigate({ to: ROUTES.memberDetail, params: { memberId: response.data.id } });
        } catch (error) {
            if (form.applyServerErrors(error)) toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
            else setSubmitError(errorMessage(error));
        } finally {
            setIsSubmitting(false);
            setConfirmOpen(false);
        }
    };

    const confirmDescription = sendInvitation
        ? `Member ditambahkan dan email undangan dikirim ke ${form.fields.email.trim()} supaya mereka bisa membuat password sendiri.`
        : 'Member ditambahkan tanpa email undangan. Akunnya tersambung otomatis saat mereka mendaftar atau masuk dengan email yang sama.';

    const value: PageContextValue = {
        form,
        preferences,
        sendInvitation,
        consentAcknowledged,
        isSubmitting,
        submitError,
        isConfirmOpen,
        confirmDescription,
        setSendInvitation,
        setConsentAcknowledged,
        handleSubmit,
        confirmSubmit,
        closeConfirm: () => setConfirmOpen(false),
    };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
