import type { AdminRoleSummary } from '@/types/auth';

export interface PermissionOption {
    id: string;
    name: string;
    label: string;
    group: string;
    requires: string[];
    isAssignable: boolean;
}

export interface RoleListItem extends AdminRoleSummary {
    isSystem: boolean;
    adminCount: number;
}

export interface RoleDetail extends RoleListItem {
    permissions: PermissionOption[];
}

export interface RoleCreateInput {
    name: string;
    label: string;
    permissionIds: string[];
}
export type RoleUpdateInput = Omit<RoleCreateInput, 'name'>;
