import { http, HttpResponse } from 'msw';

// No invented admin endpoints or credentials; add them after agreeing the API contract.
export const handlers = [http.get('*/api/health', () => HttpResponse.json({ data: { status: 'ok' } }))];
