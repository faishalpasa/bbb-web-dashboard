import { Link } from '@tanstack/react-router';

import { AlertMessage } from '@/components/molecules/alert-message';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { FormField } from '@/components/molecules/form-field';
import { PermissionTree } from '@/components/molecules/permission-tree';
import { RequiredNote } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/route';
import type { useRoleEditor } from '@/hooks/useRoleEditor';

interface RoleFormProps {
    editor: ReturnType<typeof useRoleEditor>;
}

export const RoleForm = ({ editor }: RoleFormProps) => {
    const { role, catalog, fields, isCreating, isLoading, failure, saveError, notice, errors, isSaving, readOnlyReason, canSave, canDelete } = editor;
    const isBusy = isSaving || editor.isDeleting;

    return (
        <div className="space-y-4">
            <header className="space-y-1">
                <Link to={ROUTES.roles} className="text-muted-foreground text-sm hover:underline" data-test-id="role_link_back">
                    ← Daftar role
                </Link>
                <h1 className="text-2xl font-semibold">{isCreating ? 'Buat Role' : `Role ${role?.label ?? ''}`}</h1>
            </header>
            {notice && (
                <AlertMessage tone="success" data-test-id="roles_notice">
                    {notice}
                </AlertMessage>
            )}
            {failure && (
                <div className="space-y-2">
                    <AlertMessage data-test-id="roles_error">{failure}</AlertMessage>
                    <Button variant="outline" onClick={editor.reload} data-test-id="roles_button_retry">
                        Coba lagi
                    </Button>
                </div>
            )}
            {isLoading ? (
                <Skeleton className="h-96" />
            ) : (
                !failure && (
                    <form
                        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
                        onSubmit={editor.handleSave}
                        noValidate
                        data-test-id="roles_form"
                    >
                        <section className="border-border bg-card space-y-4 rounded-lg border p-4 sm:p-5" data-test-id="roles_section_identity">
                            <RequiredNote />
                            {readOnlyReason && (
                                <p className="bg-secondary/70 rounded-md p-3 text-sm" role="status" data-test-id="roles_read_only">
                                    {readOnlyReason}
                                </p>
                            )}
                            <FormField
                                id="roleName"
                                label="Nama role"
                                hint="Nama stabil, misalnya member-editor. Tidak bisa diubah setelah dibuat."
                                error={errors.name}
                                data-test-id="roles_name"
                            >
                                <Input
                                    id="roleName"
                                    className="bg-card"
                                    value={fields.name}
                                    onChange={(event) => editor.setField('name', event.target.value)}
                                    disabled={!isCreating || !canSave || isBusy}
                                    maxLength={100}
                                    aria-required="true"
                                    data-test-id="roles_input_name"
                                />
                            </FormField>
                            <FormField id="roleLabel" label="Label role" error={errors.label} data-test-id="roles_label">
                                <Input
                                    id="roleLabel"
                                    className="bg-card"
                                    value={fields.label}
                                    onChange={(event) => editor.setField('label', event.target.value)}
                                    disabled={!canSave || isBusy}
                                    maxLength={100}
                                    aria-required="true"
                                    data-test-id="roles_input_label"
                                />
                            </FormField>
                            {saveError && <AlertMessage data-test-id="roles_save_error">{saveError}</AlertMessage>}
                            {role && role.adminCount > 0 && (
                                <p className="text-muted-foreground text-xs">
                                    Role dipakai {role.adminCount} akun, termasuk nonaktif dan diundang, sehingga tidak bisa dihapus.
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {canSave && (
                                    <Button type="submit" disabled={isBusy} data-test-id="roles_button_save">
                                        {isSaving ? 'Menyimpan…' : isCreating ? 'Buat Role' : 'Simpan Role'}
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-destructive"
                                        disabled={isBusy}
                                        onClick={() => editor.setDeleteOpen(true)}
                                        data-test-id="roles_button_delete"
                                    >
                                        Hapus Role
                                    </Button>
                                )}
                            </div>
                        </section>
                        <section className="border-border bg-card space-y-2 rounded-lg border p-4 sm:p-5" data-test-id="roles_section_permissions">
                            <h2 className="font-semibold">Permission</h2>
                            <p className="text-muted-foreground text-sm">
                                Centang modul untuk mengaktifkan semua izin di dalamnya. Aksi ikut mengaktifkan View; mematikan View mematikan aksi
                                yang bergantung padanya.
                            </p>
                            {fields.permissionIds.length === 0 && (
                                <p className="text-sm" data-test-id="roles_empty_permissions">
                                    Tanpa permission, akun tetap bisa login tetapi belum memiliki akses modul.
                                </p>
                            )}
                            {errors.permissionIds && <AlertMessage data-test-id="roles_permissions_error">{errors.permissionIds}</AlertMessage>}
                            <PermissionTree
                                catalog={catalog}
                                selected={fields.permissionIds}
                                disabled={!canSave || isBusy}
                                onToggle={editor.toggle}
                                onToggleGroup={editor.toggleGroup}
                            />
                        </section>
                    </form>
                )
            )}
            <ConfirmationDialog
                open={canDelete && editor.isDeleteOpen}
                onClose={() => editor.setDeleteOpen(false)}
                onConfirm={() => void editor.confirmDelete()}
                title="Hapus role?"
                description={`Role ${role?.label ?? ''} dan assignment permission-nya akan dihapus. Akun admin tidak dihapus.`}
                confirmLabel="Hapus Role"
                cancelLabel="Batal"
                isDestructive
                isSubmitting={editor.isDeleting}
                error={editor.deleteError}
                data-test-id="roles_dialog_delete"
            />
        </div>
    );
};
