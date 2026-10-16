# Hook Template

## Location

- Reusable: `src/hooks/use<HookName>.ts`
- Page-specific: beside the page using it.

```ts
interface UseExampleOptions {
    enabled?: boolean;
}

interface UseExampleResult {
    isLoading: boolean;
    error: string | null;
}

export const useExample = ({ enabled = true }: UseExampleOptions): UseExampleResult => {
    return { isLoading: !enabled, error: null };
};
```

Hooks may call typed domain services, but contain no JSX or server-authoritative business rules. Use named exports and no `any`.

