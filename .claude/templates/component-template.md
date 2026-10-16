# Component Template

## Location

- Reusable: `src/components/<category>/<component-name>.tsx`
- Page-specific: `src/pages/<area>/<page>/_components/<component-name>.tsx`

```tsx
interface ComponentNameProps {
    title: string;
}

export const ComponentName = ({ title }: ComponentNameProps) => {
    return <section>{title}</section>;
};
```

Use named exports, strict props, Tailwind, Indonesian copy, and a stable `data-test-id` on every interactive element. Avoid raw Axios, nested ternaries, and page business rules.

