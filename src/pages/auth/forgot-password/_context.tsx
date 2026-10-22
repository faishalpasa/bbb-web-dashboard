import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useState } from 'react';

import { postForgotPassword } from '@/services/auth';
import { errorMessage, fieldErrorMessage } from '@/utils/error';

interface PageContextValue {
    email: string;
    emailError: string | null;
    sentTo: string | null;
    resendAvailableAt: string | null;
    isSubmitting: boolean;
    setEmail: (value: string) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    resend: () => Promise<void>;
    changeEmail: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [email, setEmailState] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const send = async (address: string) => {
        setEmailError(null);
        setIsSubmitting(true);

        try {
            const response = await postForgotPassword(address.trim());

            setSentTo(address.trim());
            setResendAvailableAt(response.data.resendAvailableAt);
        } catch (error) {
            setEmailError(fieldErrorMessage(error, 'email') ?? errorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        await send(email);
    };

    return (
        <PageContext.Provider
            value={{
                email,
                emailError,
                sentTo,
                resendAvailableAt,
                isSubmitting,
                setEmail: (value) => {
                    setEmailState(value);
                    setEmailError(null);
                },
                handleSubmit,
                resend: () => send(sentTo ?? email),
                changeEmail: () => {
                    setSentTo(null);
                    setResendAvailableAt(null);
                },
            }}
        >
            {children}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
