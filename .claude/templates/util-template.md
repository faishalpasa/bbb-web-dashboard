# Utility Template

## Location

`src/utils/<domain>.ts` (for example `utils/date.ts`, `utils/string.ts`)

```ts
export const formatMemberNumber = (sequence: number): string => {
    return `BFF-${sequence.toString().padStart(5, '0')}`;
};
```

Utilities are pure, side-effect free, typed, and named exports. Network calls belong in services; business rules belong on the server.
