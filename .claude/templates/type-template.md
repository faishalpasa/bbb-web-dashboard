# Type Template

## Location

`src/types/<domain>.d.ts`

```ts
import type { Identifier } from '@/types/api';

export interface MemberSummary {
    id: Identifier;
    memberNumber: string | null;
    name: string;
}

export type MemberStatus = 'active' | 'migrated' | 'exit_requested' | 'unsubscribed';
```

Use interfaces for object shapes and types for unions. Field names match the API contract (camelCase, identifiers as strings, datetimes as ISO 8601 UTC strings).
