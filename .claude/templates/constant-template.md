# Constant Template

## Location

`src/constants/<constant-name>.ts`

```ts
export const EVENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    CLOSED: 'closed',
    FINISHED: 'finished',
    CANCELLED: 'cancelled',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
    draft: 'Draf',
    published: 'Terbit',
    closed: 'Ditutup',
    finished: 'Selesai',
    cancelled: 'Dibatalkan',
};
```

Use named exports and derive union types. UI constants mirror backend enum values; backend remains authoritative.

