import { Link } from '@tanstack/react-router';
import { LoaderCircle, MailCheck } from 'lucide-react';

import InputError from '@/components/input-error';
import { AuthLayout } from '@/components/layout/auth-layout';
import { RequiredMark } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/route';
import { useCountdown } from '@/hooks/useCountdown';

import { usePageContext } from '../_context';

const BackToLogin = () => (
    <p className="text-center text-sm">
        <Link
            to={ROUTES.login}
            className="text-foreground decoration-foreground/30 hover:decoration-foreground font-semibold underline underline-offset-4"
            data-test-id="forgot_link_login"
        >
            Kembali ke halaman masuk
        </Link>
    </p>
);

export const PageContent = () => {
    const { email, emailError, sentTo, resendAvailableAt, isSubmitting, setEmail, handleSubmit, resend, changeEmail } = usePageContext();
    const secondsLeft = useCountdown(resendAvailableAt);

    if (sentTo) {
        return (
            <AuthLayout title="Cek email Anda" description="Link untuk membuat password baru sudah kami proses.">
                <div className="flex flex-col gap-6" data-test-id="forgot_sent">
                    <div className="border-border bg-card flex gap-3 rounded-lg border p-4">
                        <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <p className="text-sm" data-test-id="forgot_text_sent">
                            Jika <strong className="break-all">{sentTo}</strong> terdaftar sebagai admin aktif, link atur ulang password dikirim ke
                            sana. Link berlaku 60 menit dan hanya bisa dipakai sekali. Cek juga folder Spam.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-card h-11 w-full"
                            disabled={isSubmitting || secondsLeft > 0}
                            onClick={() => void resend()}
                            data-test-id="forgot_button_resend"
                        >
                            {isSubmitting && <LoaderCircle className="animate-spin" />}
                            {secondsLeft > 0 ? `Kirim ulang dalam ${secondsLeft} detik` : 'Kirim ulang link'}
                        </Button>
                        <Button type="button" variant="ghost" className="h-11 w-full" onClick={changeEmail} data-test-id="forgot_button_change_email">
                            Pakai email lain
                        </Button>
                    </div>

                    <BackToLogin />
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Lupa password" description="Masukkan email akun admin Anda. Kami akan mengirim link untuk membuat password baru.">
            <form className="flex flex-col gap-7" onSubmit={handleSubmit} noValidate data-test-id="forgot_form">
                <div className="grid gap-2">
                    <Label htmlFor="forgotEmail">
                        Email
                        <RequiredMark />
                    </Label>
                    <Input
                        id="forgotEmail"
                        type="email"
                        required
                        aria-required="true"
                        autoFocus
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="nama@email.com"
                        className="bg-card h-11"
                        data-test-id="forgot_input_email"
                    />
                    <InputError message={emailError ?? undefined} data-test-id="forgot_error_email" />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={isSubmitting || email.trim() === ''} data-test-id="forgot_button_submit">
                    {isSubmitting && <LoaderCircle className="animate-spin" />}
                    Kirim Link Reset
                </Button>

                <BackToLogin />
            </form>
        </AuthLayout>
    );
};
