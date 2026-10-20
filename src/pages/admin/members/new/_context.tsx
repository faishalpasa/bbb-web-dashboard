import { useNavigate } from '@tanstack/react-router';
import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useEffect, useState } from 'react';

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
    setSendInvitation: (value: boolean) => void;
    setConsentAcknowledged: (value: boolean) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
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

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setSubmitError(null);

        const input = form.validate({ requireEmail: true });

        if (!input) return;

        setIsSubmitting(true);

        try {
            const response = await postMember({
                ...input,
                email: form.fields.email.trim(),
                sendInvitation,
                consentAcknowledged,
            });

            void navigate({ to: ROUTES.memberDetail, params: { memberId: response.data.id } });
        } catch (error) {
            if (!form.applyServerErrors(error)) setSubmitError(errorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const value: PageContextValue = {
        form,
        preferences,
        sendInvitation,
        consentAcknowledged,
        isSubmitting,
        submitError,
        setSendInvitation,
        setConsentAcknowledged,
        handleSubmit,
    };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
