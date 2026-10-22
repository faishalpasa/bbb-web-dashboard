import { Link } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import { PasswordInput } from '@/components/molecules/password-input';
import { RequiredMark } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/route';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { fields, errors, isSubmitting, setEmail, setPassword, handleSubmit } = usePageContext();

    return (
        <form className="flex flex-col gap-7" onSubmit={handleSubmit} data-test-id="auth_form_login">
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="email">
                        Email
                        <RequiredMark />
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        aria-required="true"
                        autoFocus
                        autoComplete="username"
                        value={fields.email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="nama@email.com"
                        className="bg-card h-11"
                        data-test-id="auth_input_email"
                    />
                    <InputError message={errors.email} data-test-id="auth_error_email" />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password">
                            Password
                            <RequiredMark />
                        </Label>
                        <Link
                            to={ROUTES.forgotPassword}
                            className="text-foreground decoration-foreground/30 hover:decoration-foreground text-xs font-semibold underline underline-offset-4"
                            data-test-id="auth_link_forgot_password"
                        >
                            Lupa password?
                        </Link>
                    </div>
                    <PasswordInput
                        id="password"
                        required
                        aria-required="true"
                        autoComplete="current-password"
                        value={fields.password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Masukkan password"
                        data-test-id="auth_input_password"
                    />
                    <InputError message={errors.password} data-test-id="auth_error_password" />
                </div>

                <Button type="submit" className="mt-1 h-11 w-full" disabled={isSubmitting} data-test-id="auth_button_login">
                    {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Masuk
                </Button>
            </div>

            <p className="text-muted-foreground text-center text-sm">Akun admin dibuat lewat undangan superadmin.</p>
        </form>
    );
};
