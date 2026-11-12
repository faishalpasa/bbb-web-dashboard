import { useNavigate } from '@tanstack/react-router';
import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useState } from 'react';

import { toast } from '@/components/ui/toast';
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
    isConfirmOpen: boolean;
    confirmDescription: string;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    confirmSubmit: () => Promise<void>;
    closeConfirm: () => void;
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
    const [isConfirmOpen, setConfirmOpen] = useState(false);

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
            await putMember(member.id, { ...input, email: form.fields.email.trim() });
            toast.add({ type: 'success', title: 'Perubahan member disimpan.' });
            void navigate({ to: ROUTES.memberDetail, params: { memberId: member.id } });
        } catch (error) {
            if (form.applyServerErrors(error)) toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
            else setSubmitError(errorMessage(error));
        } finally {
            setIsSubmitting(false);
            setConfirmOpen(false);
        }
    };

    const newEmail = form.fields.email.trim();
    const emailChanged = newEmail.toLowerCase() !== member.email.toLowerCase();
    const confirmDescription = emailChanged
        ? `Perubahan langsung terlihat oleh member. Email masuk berubah dari ${member.email} ke ${newEmail}, dan pemberitahuan dikirim ke kedua alamat.`
        : 'Perubahan langsung terlihat oleh member.';

    return (
        <FormContext.Provider
            value={{
                form,
                isSubmitting,
                submitError,
                isConfirmOpen,
                confirmDescription,
                handleSubmit,
                confirmSubmit,
                closeConfirm: () => setConfirmOpen(false),
            }}
        >
            {children}
        </FormContext.Provider>
    );
};

export const useFormContext = (): FormContextValue => {
    const context = useContext(FormContext);

    if (!context) throw new Error('useFormContext harus digunakan di dalam MemberEditFormProvider.');

    return context;
};
