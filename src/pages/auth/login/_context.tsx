import { useNavigate } from '@tanstack/react-router';
import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useState } from 'react';

import { useAppContext } from '@/app-context';
import { postLogin } from '@/services/auth';
import type { AdminLoginInput } from '@/types/auth';
import { errorMessage, fieldErrorMessage } from '@/utils/error';
import { landingRoute } from '@/utils/permission';

interface LoginErrors {
    email?: string;
    password?: string;
}

interface PageContextValue {
    fields: AdminLoginInput;
    errors: LoginErrors;
    isSubmitting: boolean;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
}

const INITIAL_FIELDS: AdminLoginInput = { email: '', password: '' };

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const { setSession } = useAppContext();
    const [fields, setFields] = useState<AdminLoginInput>(INITIAL_FIELDS);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        try {
            const response = await postLogin(fields);

            setSession(response.data);
            void navigate({ to: landingRoute(response.data) });
        } catch (error) {
            setErrors({
                email: fieldErrorMessage(error, 'email') ?? errorMessage(error),
                password: fieldErrorMessage(error, 'password'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const value: PageContextValue = {
        fields,
        errors,
        isSubmitting,
        setEmail: (email) => setFields((current) => ({ ...current, email })),
        setPassword: (password) => setFields((current) => ({ ...current, password })),
        handleSubmit,
    };

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
