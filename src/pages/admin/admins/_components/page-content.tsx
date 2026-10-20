import { Link } from '@tanstack/react-router';

import { AlertMessage } from '@/components/molecules/alert-message';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { FormField } from '@/components/molecules/form-field';
import { StatusBadge } from '@/components/molecules/status-badge';
import { TablePagination } from '@/components/molecules/table-pagination';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { ADMIN_ACCOUNT_TONES } from '@/constants/superadmin';
import { usePermissions } from '@/hooks/usePermissions';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { can } = usePermissions();
    const {
        admins,
        pagination,
        failure,
        isLoading,
        notice,
        deactivating,
        deactivateError,
        isDeactivating,
        closeDeactivate,
        confirmDeactivate,
        reload,
        roleOptions,
        roleOptionsError,
        isLoadingRoles,
        changingRole,
        nextRoleId,
        roleChangeError,
        isChangingRole,
        closeRoleChange,
        setNextRoleId,
        confirmRoleChange,
    } = usePageContext();

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Admin</h1>
                    <p className="text-muted-foreground text-sm">Kelola akun admin sesuai izin yang diberikan.</p>
                </div>
                {can(P.ADMIN_INVITE) && (
                    <Button asChild>
                        <Link to={ROUTES.adminNew} data-test-id="admins_link_new">
                            Tambah Admin
                        </Link>
                    </Button>
                )}
            </header>

            {notice && (
                <AlertMessage tone={notice.tone} data-test-id="admins_alert_notice">
                    {notice.text}
                </AlertMessage>
            )}

            {failure ? (
                <div className="max-w-xl space-y-3">
                    <AlertMessage data-test-id="admins_alert_error">{failure.message}</AlertMessage>
                    <Button variant="outline" onClick={reload} data-test-id="admins_button_retry">
                        Coba lagi
                    </Button>
                </div>
            ) : (
                <>
                    <section
                        className="border-border bg-card overflow-hidden rounded-lg border"
                        aria-busy={isLoading}
                        data-test-id="admins_table_root"
                    >
                        <div className="hidden md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/60 text-left">
                                    <tr>
                                        <th className="py-3 pr-3 pl-4 font-semibold">Nama</th>
                                        <th className="px-3 py-3 font-semibold">Email</th>
                                        <th className="px-3 py-3 font-semibold">Peran</th>
                                        <th className="px-3 py-3 font-semibold">Status</th>
                                        <th className="py-3 pr-4 pl-3 text-right font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading && admins.length === 0
                                        ? [0, 1, 2, 3].map((index) => (
                                              <tr key={index} className="border-border border-t">
                                                  <td colSpan={5} className="px-4 py-3">
                                                      <Skeleton className="h-5 w-full" />
                                                  </td>
                                              </tr>
                                          ))
                                        : pagination.items.map((admin) => (
                                              <tr key={admin.id} className="border-border border-t" data-test-id={`admins_row_${admin.id}`}>
                                                  <td className="py-3 pr-3 pl-4 font-medium">{admin.name}</td>
                                                  <td className="px-3 py-3">{admin.email}</td>
                                                  <td className="px-3 py-3">{admin.role.label}</td>
                                                  <td className="px-3 py-3">
                                                      <StatusBadge
                                                          tone={ADMIN_ACCOUNT_TONES[admin.status.value]}
                                                          label={admin.status.label}
                                                          data-test-id={`admins_badge_status_${admin.id}`}
                                                      />
                                                  </td>
                                                  <td className="py-2 pr-4 pl-3">
                                                      <RowActions admin={admin} />
                                                  </td>
                                              </tr>
                                          ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden" data-test-id="admins_cards">
                            {pagination.items.map((admin) => (
                                <li
                                    key={admin.id}
                                    className="border-border space-y-1 border-t p-4 first:border-t-0"
                                    data-test-id={`admins_card_${admin.id}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold">{admin.name}</p>
                                        <StatusBadge
                                            tone={ADMIN_ACCOUNT_TONES[admin.status.value]}
                                            label={admin.status.label}
                                            data-test-id={`admins_card_badge_status_${admin.id}`}
                                        />
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {admin.email} · {admin.role.label}
                                    </p>
                                    <RowActions admin={admin} />
                                </li>
                            ))}
                        </ul>
                        <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                            <span className="sr-only">{admins.length} admin</span>
                            <TablePagination
                                total={admins.length}
                                perPage={pagination.perPage}
                                onPerPageChange={pagination.setPerPage}
                                currentPage={pagination.page}
                                lastPage={pagination.lastPage}
                                isLoading={isLoading}
                                onPageChange={pagination.goToPage}
                                data-test-id="admins_pagination"
                            />
                        </footer>
                    </section>
                    <p className="bg-secondary/70 rounded-lg p-4 text-sm" data-test-id="admins_text_note">
                        Admin yang keluar dari tim dinonaktifkan, bukan dihapus, supaya riwayat kerjanya tetap punya nama. Superadmin tidak bisa
                        menonaktifkan dirinya sendiri.
                    </p>
                </>
            )}

            <ConfirmationDialog
                open={can(P.ADMIN_ROLE_UPDATE) && changingRole !== null}
                onClose={closeRoleChange}
                onConfirm={() => void confirmRoleChange()}
                title="Ubah role admin?"
                description={`${changingRole?.name ?? ''} saat ini memiliki role ${changingRole?.role.label ?? ''}. Perubahan akses berlaku pada request berikutnya, tanpa login ulang.`}
                confirmLabel="Simpan Role"
                cancelLabel="Batal"
                isSubmitting={isChangingRole}
                isConfirmDisabled={
                    isLoadingRoles || !nextRoleId || nextRoleId === changingRole?.roleInfo.id || !roleOptions.some((role) => role.id === nextRoleId)
                }
                error={roleChangeError}
                data-test-id="admins_dialog_role"
            >
                <div className="px-4 sm:px-0">
                    <FormField id="adminNextRole" label="Role baru" data-test-id="admins_next_role">
                        <NativeSelect
                            id="adminNextRole"
                            value={nextRoleId}
                            onChange={(event) => setNextRoleId(event.target.value)}
                            disabled={isChangingRole || isLoadingRoles}
                            aria-required="true"
                            data-test-id="admins_select_role"
                        >
                            <option value="">{isLoadingRoles ? 'Memuat role…' : 'Pilih role'}</option>
                            {roleOptions.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>
                    {roleOptionsError && <AlertMessage data-test-id="admins_assignment_options_error">{roleOptionsError}</AlertMessage>}
                </div>
            </ConfirmationDialog>
            <ConfirmationDialog
                open={can(P.ADMIN_DEACTIVATE) && deactivating !== null}
                onClose={closeDeactivate}
                onConfirm={() => void confirmDeactivate()}
                title="Nonaktifkan admin?"
                description={
                    deactivating
                        ? `${deactivating.name} tidak bisa lagi masuk ke dashboard. Riwayat kerjanya tetap tersimpan dan akunnya bisa diaktifkan kembali.`
                        : ''
                }
                confirmLabel="Nonaktifkan"
                cancelLabel="Batal"
                isSubmitting={isDeactivating}
                error={deactivateError}
                isDestructive
                data-test-id="admins_dialog_deactivate"
            />
        </div>
    );
};

const RowActions = ({ admin }: { admin: ReturnType<typeof usePageContext>['admins'][number] }) => {
    const { can } = usePermissions();
    const { openRoleChange } = usePageContext();
    return (
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <RowAction admin={admin} />
            {can(P.ADMIN_ROLE_UPDATE) && admin.actions.canChangeRole && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-card"
                    onClick={() => openRoleChange(admin)}
                    data-test-id={`admins_button_role_${admin.id}`}
                >
                    Ubah Role
                </Button>
            )}
        </div>
    );
};

const RowAction = ({ admin }: { admin: ReturnType<typeof usePageContext>['admins'][number] }) => {
    const { can } = usePermissions();
    const { pendingActivationId, openDeactivate, activate } = usePageContext();

    if (admin.isCurrentUser) {
        return (
            <span className="text-muted-foreground text-sm" data-test-id={`admins_text_you_${admin.id}`}>
                Anda
            </span>
        );
    }

    if (can(P.ADMIN_DEACTIVATE) && admin.actions.canDeactivate) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-card text-destructive hover:text-destructive"
                onClick={() => openDeactivate(admin)}
                data-test-id={`admins_button_deactivate_${admin.id}`}
            >
                Nonaktifkan
            </Button>
        );
    }

    if (can(P.ADMIN_ACTIVATE) && admin.actions.canActivate) {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-card"
                disabled={pendingActivationId === admin.id}
                onClick={() => void activate(admin)}
                data-test-id={`admins_button_activate_${admin.id}`}
            >
                Aktifkan Kembali
            </Button>
        );
    }

    return null;
};
