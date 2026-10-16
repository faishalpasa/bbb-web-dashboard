// Mocks run only on the Vite dev server so a production build can never ship fixtures or mock credentials.
export const IS_MOCK_API_ENABLED = import.meta.env.DEV && import.meta.env.VITE_API_MOCKING_ENABLED === 'true';
