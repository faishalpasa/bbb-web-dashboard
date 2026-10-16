import { useNavigate } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useContext, useState } from 'react';

import { ROUTES } from '@/constants/route';
import { type EventForm, useEventForm } from '@/hooks/useEventForm';
import { putEvent } from '@/services/event';
import type { EventDetail } from '@/types/event';
import { errorMessage } from '@/utils/error';

interface FormContextValue {
    form: EventForm;
    isSubmitting: boolean;
    submitError: string | null;
    save: (publish: boolean) => Promise<void>;
}

const FormContext = createContext<FormContextValue | null>(null);

interface EventEditFormProviderProps extends PropsWithChildren {
    event: EventDetail;
}

// Mounted only once the event is loaded, so the form starts from the saved values.
export const EventEditFormProvider = ({ event, children }: EventEditFormProviderProps) => {
    const navigate = useNavigate();
    const form = useEventForm(event);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const save = async (publish: boolean) => {
        setSubmitError(null);

        const input = form.buildInput(publish);

        if (!input) return;

        setIsSubmitting(true);

        try {
            await putEvent(event.id, input);
            void navigate({ to: ROUTES.eventDetail, params: { eventId: event.id } });
        } catch (error) {
            if (!form.applyServerErrors(error)) setSubmitError(errorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return <FormContext.Provider value={{ form, isSubmitting, submitError, save }}>{children}</FormContext.Provider>;
};

export const useFormContext = (): FormContextValue => {
    const context = useContext(FormContext);

    if (!context) throw new Error('useFormContext harus digunakan di dalam EventEditFormProvider.');

    return context;
};
