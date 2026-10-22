import { Link } from '@tanstack/react-router';
import { Clock, LoaderCircle, MessageCircle } from 'lucide-react';

import { BrandLogo } from '@/components/brand-logo';
import InputError from '@/components/input-error';
import { PasswordInput } from '@/components/molecules/password-input';
import { RequiredMark } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/route';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { state, email, invalidMessage, adminWhatsappUrl, password, passwordError, isSubmitting, setPassword, handleSubmit } = usePageContext();

    return (
        <main
            className="bbb-auth-surface bg-background text-foreground flex min-h-svh items-center justify-center px-4 py-10"
            data-test-id="reset_root"
        >
            <div className="w-full max-w-[400px] space-y-6">
                <BrandLogo className="mx-auto w-[260px]" />

                <section className="border-border bg-card space-y-5 rounded-xl border p-6 shadow-sm">
                    {state === 'loading' && (
                        <div className="space-y-3" aria-busy="true" data-test-id="reset_loading">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                    )}

                    {state === 'ready' && (
                        <form className="space-y-5" onSubmit={handleSubmit} noValidate data-test-id="reset_form">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-semibold tracking-[-0.025em]">Buat password baru</h1>
                                <p className="text-sm">Setelah password diganti, semua sesi masuk yang lama akan berakhir.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="resetEmail">Email</Label>
                                <Input
                                    id="resetEmail"
                                    value={email ?? ''}
                                    readOnly
                                    className="bg-secondary/70 h-11"
                                    data-test-id="reset_input_email"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="resetPassword">
                                    Password baru
                                    <RequiredMark />
                                </Label>
                                <PasswordInput
                                    id="resetPassword"
                                    autoFocus
                                    autoComplete="new-password"
                                    required
                                    aria-required="true"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    data-test-id="reset_input_password"
                                />
                                <InputError message={passwordError ?? undefined} data-test-id="reset_error_password" />
                            </div>

                            <Button type="submit" className="h-11 w-full font-semibold" disabled={isSubmitting} data-test-id="reset_button_submit">
                                {isSubmitting && <LoaderCircle className="animate-spin" />}
                                Simpan Password
                            </Button>

                            <p className="text-muted-foreground text-xs">Setelah disimpan, Anda langsung masuk ke dashboard.</p>
                        </form>
                    )}

                    {state === 'invalid' && (
                        <div className="space-y-5 text-center" data-test-id="reset_invalid">
                            <span
                                className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fbefc4] text-[#7a5b00]"
                                aria-hidden="true"
                            >
                                <Clock className="size-5" />
                            </span>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-semibold tracking-[-0.025em]">Link tidak berlaku</h1>
                                <p className="text-sm" data-test-id="reset_text_invalid">
                                    {invalidMessage ?? 'Link ini sudah kedaluwarsa atau pernah dipakai.'}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Button asChild className="h-11 w-full font-semibold">
                                    <Link to={ROUTES.forgotPassword} data-test-id="reset_link_forgot">
                                        Minta link baru
                                    </Link>
                                </Button>
                                {adminWhatsappUrl && (
                                    <Button asChild variant="outline" className="bg-card h-11 w-full">
                                        <a href={adminWhatsappUrl} target="_blank" rel="noreferrer" data-test-id="reset_link_whatsapp">
                                            <MessageCircle aria-hidden="true" />
                                            Hubungi superadmin lewat WhatsApp
                                        </a>
                                    </Button>
                                )}
                                <Button asChild variant="ghost" className="h-11 w-full">
                                    <Link to={ROUTES.login} data-test-id="reset_link_login">
                                        Ke halaman masuk
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};
