# Service Template

## Axios service

Location: `src/services/<domain>.ts`

Types live in `src/types/<domain>.d.ts`.

```ts
import type { ApiEnvelope, Identifier, ServiceResponse } from '@/types/api';
import type { Resource } from '@/types/resource';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const getResource = async (id: Identifier): Promise<ServiceResponse<Resource>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<Resource>>(`/resources/${id}`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
```

Name functions by HTTP verb (`get`, `post`, `put`, `delete`). Add a matching MSW handler in `src/mocks/handlers.ts` while the API endpoint does not exist.
