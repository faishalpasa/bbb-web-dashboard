import { Link } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { FormField } from '@/components/molecules/form-field';
import { RequiredNote } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ROUTES } from '@/constants/route';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { fields, errors, roleOptions, roleOptionsError, isLoadingRoles, isSubmitting, submitError, invitation, setField, handleSubmit } =
        usePageContext();

    return (
        <div className="max-w-2xl space-y-4">
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.admins} className="underline underline-offset-4" data-test-id="admin_new_link_breadcrumb_admins">
                        Admin
                    </Link>
                    <span className="text-muted-foreground"> / Tambah admin</span>
                </nav>
                <h1 className="text-2xl font-semibold">Tambah admin</h1>
                <p className="text-muted-foreground text-sm">Kirim undangan agar admin baru dapat membuat password dan masuk ke dashboard.</p>
                <RequiredNote />
            </header>

            {submitError && <FeedbackToast data-test-id="admin_new_alert_error">{submitError}</FeedbackToast>}

            {invitation && (
                <section className="border-border bg-card rounded-lg border p-4 text-sm" data-test-id="admin_new_invitation_result">
                    <span className="font-medium">Link undangan untuk {invitation.name}.</span>{' '}
                    <a
                        href={invitation.invitationPath}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold underline underline-offset-4"
                        data-test-id="admin_new_link_invitation"
                    >
                        Buka link undangan
                    </a>
                </section>
            )}

            <form className="border-border bg-card space-y-5 rounded-lg border p-5" noValidate onSubmit={handleSubmit} data-test-id="admin_new_form">
                <FormField id="adminName" label="Nama" error={errors.name} data-test-id="admin_new_name">
                    <Input
                        id="adminName"
                        value={fields.name}
                        aria-required="true"
                        onChange={(event) => setField('name', event.target.value)}
                        placeholder="Nama lengkap"
                        className="bg-card h-11"
                        data-test-id="admin_new_input_name"
                    />
                </FormField>

                <FormField
                    id="adminEmail"
                    label="Email"
                    hint="Admin menerima email undangan untuk membuat password sendiri."
                    error={errors.email}
                    data-test-id="admin_new_email"
                >
                    <Input
                        id="adminEmail"
                        type="email"
                        value={fields.email}
                        aria-required="true"
                        onChange={(event) => setField('email', event.target.value)}
                        placeholder="nama@email.com"
                        className="bg-card h-11"
                        data-test-id="admin_new_input_email"
                    />
                </FormField>

                <FormField
                    id="adminRole"
                    label="Role"
                    error={errors.roleId}
                    hint="Hanya role yang boleh Anda berikan yang ditampilkan."
                    data-test-id="admin_new_role"
                >
                    <NativeSelect
                        id="adminRole"
                        value={fields.roleId}
                        onChange={(event) => setField('roleId', event.target.value)}
                        disabled={isSubmitting || isLoadingRoles}
                        aria-required="true"
                        data-test-id="admin_new_select_role"
                    >
                        <option value="">{isLoadingRoles ? 'Memuat role…' : 'Pilih role'}</option>
                        {roleOptions.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.label}
                            </option>
                        ))}
                    </NativeSelect>
                </FormField>

                {roleOptionsError && <FeedbackToast data-test-id="admin_new_role_options_error">{roleOptionsError}</FeedbackToast>}
                {!isLoadingRoles && roleOptions.length === 0 && !roleOptionsError && (
                    <p className="text-muted-foreground text-sm">Belum ada role yang dapat Anda berikan.</p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button asChild variant="outline" className="bg-card h-11">
                        <Link to={ROUTES.admins} data-test-id="admin_new_link_cancel">
                            Batal
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        className="h-11"
                        disabled={isSubmitting || isLoadingRoles || roleOptions.length === 0}
                        data-test-id="admin_new_button_invite"
                    >
                        {isSubmitting && <LoaderCircle className="animate-spin" />}
                        Kirim Undangan
                    </Button>
                </div>
            </form>
        </div>
    );
};
