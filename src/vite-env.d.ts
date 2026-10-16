/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_ORIGIN?: string;
    readonly VITE_API_MOCKING_ENABLED?: 'true' | 'false';
    readonly VITE_PUBLIC_WEB_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
