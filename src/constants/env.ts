// Mocks run only on the Vite dev server so a production build can never ship fixtures or mock credentials.
export const IS_MOCK_API_ENABLED = import.meta.env.DEV && import.meta.env.VITE_API_MOCKING_ENABLED === 'true';

// Origin of the member/public web app, where each event's public page /e/{slug} lives. Empty until configured.
export const PUBLIC_WEB_URL = (import.meta.env.VITE_PUBLIC_WEB_URL ?? '').replace(/\/$/, '');
