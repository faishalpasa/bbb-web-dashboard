import type { PropsWithChildren } from 'react';

import type { Permission } from '@/constants/permission';
import { usePermissions } from '@/hooks/usePermissions';

export const PermissionGate = ({ permission, children }: PropsWithChildren<{ permission: Permission }>) => {
    const { can } = usePermissions();
    return can(permission) ? children : null;
};
