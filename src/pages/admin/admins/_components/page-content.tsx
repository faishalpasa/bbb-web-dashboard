import { LoaderCircle } from 'lucide-react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { FormField } from '@/components/molecules/form-field';
import { RequiredNote } from '@/components/molecules/required-mark';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_ACCOUNT_TONES } from '@/constants/superadmin';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const {
        admins,
        failure,
        isLoading,
        notice,
        invitation,
        inviteFields,
        inviteErrors,
        isInviting,
        deactivating,
        deactivateError,
        isDeactivating,
        setInviteField,
        handleInvite,
        closeDeactivate,
        confirmDeactivate,
        reload,
    } = usePageContext();

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-semibold">Admin</h1>
                <p className="text-muted-foreground text-sm">Hanya superadmin yang bisa mengelola akun admin.</p>
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
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_380px]">
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
                                        <th className="py-3 pr-4 pl-3" />
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
                                        : admins.map((admin) => (
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
                                                  <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                                                      <RowAction admin={admin} />
                                                  </td>
                                              </tr>
                                          ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden" data-test-id="admins_cards">
                            {admins.map((admin) => (
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
                                    <RowAction admin={admin} />
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className="space-y-4">
                        <section className="border-border bg-card space-y-4 rounded-lg border p-5" data-test-id="admins_invite">
                            <h2 className="font-semibold">Tambah admin</h2>
                            <RequiredNote />
                            <form className="space-y-4" noValidate onSubmit={handleInvite} data-test-id="admins_invite_form">
                                <FormField id="inviteName" label="Nama" error={inviteErrors.name} data-test-id="admins_invite_name">
                                    <Input
                                        id="inviteName"
                                        value={inviteFields.name}
                                        aria-required="true"
                                        onChange={(event) => setInviteField('name', event.target.value)}
                                        placeholder="Nama lengkap"
                                        className="bg-card h-11"
                                        data-test-id="admins_input_name"
                                    />
                                </FormField>
                                <FormField
                                    id="inviteEmail"
                                    label="Email"
                                    hint="Admin menerima email undangan untuk membuat password sendiri."
                                    error={inviteErrors.email}
                                    data-test-id="admins_invite_email"
                                >
                                    <Input
                                        id="inviteEmail"
                                        type="email"
                                        value={inviteFields.email}
                                        aria-required="true"
                                        onChange={(event) => setInviteField('email', event.target.value)}
                                        placeholder="nama@email.com"
                                        className="bg-card h-11"
                                        data-test-id="admins_input_email"
                                    />
                                </FormField>
                                <Button type="submit" disabled={isInviting} data-test-id="admins_button_invite">
                                    {isInviting && <LoaderCircle className="animate-spin" />}
                                    Kirim Undangan
                                </Button>
                            </form>

                            {invitation && (
                                <div
                                    className="bg-secondary/70 space-y-1 rounded-md p-3 text-sm"
                                    role="status"
                                    data-test-id="admins_invitation_result"
                                >
                                    <p className="font-medium">Undangan untuk {invitation.name} dibuat.</p>
                                    <p className="text-muted-foreground">
                                        Fase dummy: email tidak dikirim.{' '}
                                        <a
                                            href={invitation.invitationPath}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-foreground font-semibold underline underline-offset-4"
                                            data-test-id="admins_link_invitation"
                                        >
                                            Buka link undangan
                                        </a>
                                    </p>
                                </div>
                            )}
                        </section>

                        <p className="bg-secondary/70 rounded-lg p-4 text-sm" data-test-id="admins_text_note">
                            Admin yang keluar dari tim dinonaktifkan, bukan dihapus, supaya riwayat kerjanya tetap punya nama. Superadmin tidak bisa
                            menonaktifkan dirinya sendiri.
                        </p>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={deactivating !== null}
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

const RowAction = ({ admin }: { admin: ReturnType<typeof usePageContext>['admins'][number] }) => {
    const { pendingActivationId, openDeactivate, activate } = usePageContext();

    if (admin.isCurrentUser) {
        return (
            <span className="text-muted-foreground text-sm" data-test-id={`admins_text_you_${admin.id}`}>
                Anda
            </span>
        );
    }

    if (admin.actions.canDeactivate) {
        return (
            <button
                type="button"
                onClick={() => openDeactivate(admin)}
                className="text-destructive text-sm font-semibold underline-offset-4 hover:underline"
                data-test-id={`admins_button_deactivate_${admin.id}`}
            >
                Nonaktifkan
            </button>
        );
    }

    if (admin.actions.canActivate) {
        return (
            <button
                type="button"
                disabled={pendingActivationId === admin.id}
                onClick={() => void activate(admin)}
                className="text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-50"
                data-test-id={`admins_button_activate_${admin.id}`}
            >
                Aktifkan Kembali
            </button>
        );
    }

    return null;
};
