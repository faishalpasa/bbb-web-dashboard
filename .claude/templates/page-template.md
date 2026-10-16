# Page Template

## Location

`src/pages/<area>/<page-name>/index.tsx`

```tsx
import { useTitle } from '@/hooks/useTitle';

import { PageContent } from './_components/page-content';
import { PageContextProvider } from './_context';

export const PageName = () => {
    useTitle('Judul Halaman');

    return (
        <PageContextProvider>
            <PageContent />
        </PageContextProvider>
    );
};
```

Keep the entry thin. Put page-only UI in `_components/`, state and service calls in `_context.tsx`, and register the route in `src/router.tsx` (`lazyRouteComponent(() => import('@/pages/...'), 'PageName')`) with its path in `ROUTES`.
