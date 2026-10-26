import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './index.css';

import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { AppContextProvider, useAppContext } from '@/app-context';
import { Toaster } from '@/components/ui/toast';
import { IS_MOCK_API_ENABLED } from '@/constants/env';
import { ROUTES } from '@/constants/route';
import { router } from '@/router';
import { setPermissionDeniedHandler } from '@/utils/api';

const AppRouter = () => {
    const auth = useAppContext();
    const { ensureSession } = auth;
    const signature = auth.session ? `${auth.session.user.id}:${auth.session.permissions?.join(',')}` : '';
    useEffect(() => {
        void router.invalidate();
    }, [signature]);
    useEffect(() => {
        setPermissionDeniedHandler(() => {
            void ensureSession(true)
                .catch(() => undefined)
                .finally(() => {
                    void router.navigate({ to: ROUTES.forbidden });
                });
        });
        return () => setPermissionDeniedHandler(null);
    }, [ensureSession]);

    return <RouterProvider router={router} context={{ auth }} />;
};

let reactRoot: Root | undefined;
import.meta.hot?.dispose(() => reactRoot?.unmount());

const startApp = async () => {
    if (IS_MOCK_API_ENABLED) {
        const { mockWorker } = await import('@/mocks/browser');
        await mockWorker.start({ onUnhandledRequest: 'bypass' });
    }
    const root = document.getElementById('root');
    if (!root) throw new Error('Elemen #root tidak ditemukan.');
    reactRoot = createRoot(root);
    reactRoot.render(
        <AppContextProvider>
            <AppRouter />
            <Toaster />
        </AppContextProvider>,
    );
};

void startApp();
