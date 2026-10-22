import { useNavigate, useSearch } from '@tanstack/react-router';
import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import { useAppContext } from '@/app-context';
import { ROUTES } from '@/constants/route';
import { postResetPassword, postVerifyResetToken } from '@/services/auth';
import { errorMessage, fieldErrorMessage, isServiceError } from '@/utils/error';
import { landingRoute } from '@/utils/permission';

type ResetState = 'loading' | 'ready' | 'invalid';

interface PageContextValue {
    state: ResetState;
    email: string | null;
    invalidMessage: string | null;
    adminWhatsappUrl: string | null;
    password: string;
    passwordError: string | null;
    isSubmitting: boolean;
    setPassword: (value: string) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const { setSession } = useAppContext();
    const { token: tokenFromUrl } = useSearch({ strict: false });
    // The one-time token lives only in memory once it has been read from the address bar.
    const token = useRef<string | undefined>(tokenFromUrl);
    const [state, setState] = useState<ResetState>('loading');
    const [email, setEmail] = useState<string | null>(null);
    const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
    const [adminWhatsappUrl, setAdminWhatsappUrl] = useState<string | null>(null);
    const [password, setPasswordState] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        token.current ??= tokenFromUrl;

        if (tokenFromUrl) void navigate({ to: ROUTES.resetPassword, search: {}, replace: true });
    }, [tokenFromUrl, navigate]);

    useEffect(() => {
        const load = async () => {
            if (!token.current) {
                setInvalidMessage('Link atur ulang password tidak valid.');
                setState('invalid');

                return;
            }

            try {
                setEmail((await postVerifyResetToken(token.current)).data.email);
                setState('ready');
            } catch (error) {
                setInvalidMessage(errorMessage(error));
                setAdminWhatsappUrl(isServiceError(error) ? (error.data?.adminWhatsappUrl ?? null) : null);
                setState('invalid');
            }
        };

        void load();
    }, []);

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        if (!token.current) return;

        setPasswordError(null);
        setIsSubmitting(true);

        try {
            const response = await postResetPassword(token.current, password);

            setSession(response.data);
            void navigate({ to: landingRoute(response.data) });
        } catch (error) {
            const fieldError = fieldErrorMessage(error, 'password');

            if (fieldError) {
                setPasswordError(fieldError);
            } else {
                // The link may have been used or expired while the form was open.
                setInvalidMessage(errorMessage(error));
                setAdminWhatsappUrl(isServiceError(error) ? (error.data?.adminWhatsappUrl ?? null) : null);
                setState('invalid');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageContext.Provider
            value={{
                state,
                email,
                invalidMessage,
                adminWhatsappUrl,
                password,
                passwordError,
                isSubmitting,
                setPassword: (value) => {
                    setPasswordState(value);
                    setPasswordError(null);
                },
                handleSubmit,
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
