import { useCallback } from 'react';

import { useAppContext } from '@/app-context';
import type { Permission } from '@/constants/permission';
import { can, canAll, canAny } from '@/utils/permission';

export const usePermissions = () => {
    const { session } = useAppContext();
    return {
        can: useCallback((permission: Permission) => can(session, permission), [session]),
        canAll: useCallback((permissions: readonly Permission[]) => canAll(session, permissions), [session]),
        canAny: useCallback((permissions: readonly Permission[]) => canAny(session, permissions), [session]),
    };
};
