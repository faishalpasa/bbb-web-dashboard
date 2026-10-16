import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './index.css';

import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';

import { AppContextProvider } from '@/app-context';
import { IS_MOCK_API_ENABLED } from '@/constants/env';
import { router } from '@/router';

const startApp = async () => {
    if (IS_MOCK_API_ENABLED) {
        const { mockWorker } = await import('@/mocks/browser');
        await mockWorker.start({ onUnhandledRequest: 'bypass' });
    }
    const root = document.getElementById('root');
    if (!root) throw new Error('Elemen #root tidak ditemukan.');
    createRoot(root).render(
        <AppContextProvider>
            <RouterProvider router={router} />
        </AppContextProvider>,
    );
};

void startApp();
