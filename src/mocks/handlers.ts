import { http, HttpResponse } from 'msw';

// Health-only mocks: auth/RBAC flows use the real API. No stale capability-only session fixture to grant access.
export const handlers = [http.get('*/api/health', () => HttpResponse.json({ data: { status: 'ok' } }))];
