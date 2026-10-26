import { useNavigate } from '@tanstack/react-router';
import { type FormEventHandler, useEffect, useState } from 'react';

import { useAppContext } from '@/app-context';
import { toast } from '@/components/ui/toast';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { deleteRole, getPermissions, getRole, postRole, putRole } from '@/services/role';
import type { PermissionOption, RoleDetail } from '@/types/role';
import { errorMessage, fieldErrorMessage } from '@/utils/error';
import { togglePermission, togglePermissionGroup } from '@/utils/permission-tree';

interface RoleFields {
    name: string;
    label: string;
    permissionIds: string[];
}

type RoleErrors = Partial<Record<keyof RoleFields, string>>;

// Shared by the create page (no roleId) and the detail page; both render the same form.
export const useRoleEditor = (roleId?: string) => {
    const { session } = useAppContext();
    const { can } = usePermissions();
    const navigate = useNavigate();
    const isCreating = roleId === undefined;
    const [catalog, setCatalog] = useState<PermissionOption[]>([]);
    const [role, setRole] = useState<RoleDetail | null>(null);
    const [fields, setFields] = useState<RoleFields>({ name: '', label: '', permissionIds: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [failure, setFailure] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [errors, setErrors] = useState<RoleErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const signature = session?.permissions.join(',') ?? '';

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setFailure(null);
        void Promise.all([getPermissions(), roleId ? getRole(roleId) : Promise.resolve(null)])
            .then(([options, detail]) => {
                if (cancelled) return;
                setCatalog(options.data.items);
                if (detail) {
                    setRole(detail.data);
                    setFields({ name: detail.data.name, label: detail.data.label, permissionIds: detail.data.permissions.map((p) => p.id) });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) setFailure(errorMessage(error));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [roleId, reloadToken, signature]);

    const protectedReason =
        role?.isSystem && role.name === 'superadmin'
            ? 'Role sistem superadmin tidak bisa diubah atau dihapus.'
            : role && role.id === session?.role.id
              ? 'Role akun sendiri tidak bisa diubah. Gunakan pengelola lain.'
              : role?.permissions.some((p) => !catalog.find((option) => option.id === p.id)?.isAssignable)
                ? 'Role ini memiliki permission di luar izin akun Anda dan hanya dapat dibaca.'
                : null;
    const actionAllowed = isCreating ? can(P.ROLE_CREATE) : can(P.ROLE_UPDATE);
    const isReady = !isLoading && failure === null && (isCreating || role !== null);
    const canSave = isReady && protectedReason === null && actionAllowed;
    const readOnlyReason = protectedReason ?? (!actionAllowed ? 'Anda hanya dapat membaca role ini.' : null);
    const canDelete = isReady && role !== null && !role.isSystem && role.adminCount === 0 && protectedReason === null && can(P.ROLE_DELETE);

    const handleSave: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        if (!canSave || isSaving) return;
        const next: RoleErrors = {};
        if (isCreating && !fields.name.trim()) next.name = 'Nama role harus diisi.';
        if (!fields.label.trim()) next.label = 'Label role harus diisi.';
        setErrors(next);
        if (Object.keys(next).length > 0) {
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        setNotice(null);
        try {
            const input = { label: fields.label.trim(), permissionIds: fields.permissionIds };
            if (isCreating) {
                const response = await postRole({ ...input, name: fields.name.trim().toLowerCase() });
                toast.add({ type: 'success', title: 'Role berhasil dibuat.' });
                void navigate({ to: ROUTES.roleDetail, params: { roleId: response.data.id } });
                return;
            }
            const response = await putRole(role!.id, input);
            setRole(response.data);
            setFields({ name: response.data.name, label: response.data.label, permissionIds: response.data.permissions.map((p) => p.id) });
            setNotice('Role dan permission berhasil disimpan.');
        } catch (error) {
            setErrors({
                name: fieldErrorMessage(error, 'name'),
                label: fieldErrorMessage(error, 'label'),
                permissionIds: fieldErrorMessage(error, 'permissionIds'),
            });
            setSaveError(errorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!canDelete || !role || isDeleting) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteRole(role.id);
            toast.add({ type: 'success', title: 'Role berhasil dihapus.' });
            void navigate({ to: ROUTES.roles });
        } catch (error) {
            setDeleteError(errorMessage(error));
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        role,
        catalog,
        fields,
        isCreating,
        isLoading,
        failure,
        saveError,
        notice,
        errors,
        isSaving,
        readOnlyReason,
        canSave,
        canDelete,
        isDeleteOpen,
        isDeleting,
        deleteError,
        reload: () => setReloadToken((value) => value + 1),
        setField: (field: 'name' | 'label', value: string) => setFields((current) => ({ ...current, [field]: value })),
        toggle: (id: string, enabled: boolean) => {
            if (canSave) setFields((current) => ({ ...current, permissionIds: togglePermission(catalog, current.permissionIds, id, enabled) }));
        },
        toggleGroup: (group: string, enabled: boolean) => {
            if (canSave)
                setFields((current) => ({ ...current, permissionIds: togglePermissionGroup(catalog, current.permissionIds, group, enabled) }));
        },
        handleSave,
        setDeleteOpen: (open: boolean) => {
            setDeleteError(null);
            setDeleteOpen(open);
        },
        confirmDelete,
    };
};
