import { useNavigate } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { ROUTES } from '@/constants/route';
import { type EventForm, useEventForm } from '@/hooks/useEventForm';
import { getEventOptions, postEvent } from '@/services/event';
import type { EventOptions } from '@/types/event';
import { errorMessage } from '@/utils/error';

interface PageContextValue {
    form: EventForm;
    options: EventOptions | null;
    isSubmitting: boolean;
    submitError: string | null;
    save: (publish: boolean) => Promise<void>;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const form = useEventForm();
    const [options, setOptions] = useState<EventOptions | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setOptions((await getEventOptions()).data);
            } catch (error) {
                setSubmitError(errorMessage(error));
            }
        };

        void loadOptions();
    }, []);

    const save = async (publish: boolean) => {
        if (isSubmitting) return;
        setSubmitError(null);

        const input = form.buildInput(publish);

        if (!input) {
            setSubmitError('Periksa isian formulir yang ditandai di bawah.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await postEvent(input);
            toast.add({ type: 'success', title: publish ? 'Kegiatan dipublikasikan.' : 'Draf kegiatan disimpan.' });

            void navigate({ to: ROUTES.eventDetail, params: { eventId: response.data.id } });
        } catch (error) {
            setSubmitError(form.applyServerErrors(error) ? 'Periksa isian formulir yang ditandai di bawah.' : errorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return <PageContext.Provider value={{ form, options, isSubmitting, submitError, save }}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
