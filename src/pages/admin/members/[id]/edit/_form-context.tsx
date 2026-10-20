import { useNavigate } from '@tanstack/react-router';
import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useState } from 'react';

import { ROUTES } from '@/constants/route';
import { type MemberForm, useMemberForm } from '@/hooks/useMemberForm';
import { putMember } from '@/services/member';
import type { MemberDetail } from '@/types/member';
import type { ReadingProfileOptions } from '@/types/reading-profile';
import { errorMessage } from '@/utils/error';

interface FormContextValue {
    form: MemberForm;
    isSubmitting: boolean;
    submitError: string | null;
    handleSubmit: FormEventHandler<HTMLFormElement>;
}

const FormContext = createContext<FormContextValue | null>(null);

interface MemberEditFormProviderProps extends PropsWithChildren {
    member: MemberDetail;
    options: ReadingProfileOptions;
}

// Mounted only once the member is loaded, so the form starts from the saved values.
export const MemberEditFormProvider = ({ member, options, children }: MemberEditFormProviderProps) => {
    const navigate = useNavigate();
    const form = useMemberForm(member, options);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setSubmitError(null);

        const input = form.validate({ requireEmail: false });

        if (!input) return;

        setIsSubmitting(true);

        try {
            await putMember(member.id, input);
            void navigate({ to: ROUTES.memberDetail, params: { memberId: member.id } });
        } catch (error) {
            if (!form.applyServerErrors(error)) setSubmitError(errorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return <FormContext.Provider value={{ form, isSubmitting, submitError, handleSubmit }}>{children}</FormContext.Provider>;
};

export const useFormContext = (): FormContextValue => {
    const context = useContext(FormContext);

    if (!context) throw new Error('useFormContext harus digunakan di dalam MemberEditFormProvider.');

    return context;
};
