import { Link } from '@tanstack/react-router';

import { useAppContext } from '@/app-context';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/hooks/useTitle';
import { landingRoute } from '@/utils/permission';

export const PageAccessDenied = ({ noAccess = false }: { noAccess?: boolean }) => {
    useTitle(noAccess ? 'Akun belum memiliki akses' : 'Akses ditolak');
    const { session, handleLogout } = useAppContext();
    return (
        <section className="mx-auto max-w-xl space-y-4 py-12 text-center" data-test-id={noAccess ? 'access_empty' : 'access_forbidden'}>
            <h1 className="text-2xl font-semibold">{noAccess ? 'Akun belum memiliki akses' : '403 — Akses ditolak'}</h1>
            <p className="text-muted-foreground">Hubungi pengelola admin untuk mendapatkan akses yang diperlukan.</p>
            <div className="flex justify-center gap-3">
                {!noAccess && session && (
                    <Button asChild>
                        <Link to={landingRoute(session)} data-test-id="access_link_home">
                            Ke halaman yang diizinkan
                        </Link>
                    </Button>
                )}
                <Button variant="outline" onClick={() => void handleLogout()} data-test-id="access_button_logout">
                    Keluar Akun
                </Button>
            </div>
        </section>
    );
};

export const PageNoAccess = () => <PageAccessDenied noAccess />;
