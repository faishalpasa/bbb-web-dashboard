import { useNavigate } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

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
        setSubmitError(null);

        const input = form.buildInput(publish);

        if (!input) return;

        setIsSubmitting(true);

        try {
            const response = await postEvent(input);

            void navigate({ to: ROUTES.eventDetail, params: { eventId: response.data.id } });
        } catch (error) {
            if (!form.applyServerErrors(error)) setSubmitError(errorMessage(error));
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
