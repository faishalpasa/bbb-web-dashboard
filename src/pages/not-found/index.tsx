import { Link } from '@tanstack/react-router';

import { ScaffoldLayout } from '@/components/layout/scaffold-layout';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/route';
import { useTitle } from '@/hooks/useTitle';

export const PageNotFound = () => {
    useTitle('Halaman tidak ditemukan');
    return (
        <ScaffoldLayout>
            <section className="space-y-4 text-center">
                <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
                <Button asChild>
                    <Link to={ROUTES.dashboard} data-test-id="error_link_dashboard">
                        Kembali
                    </Link>
                </Button>
            </section>
        </ScaffoldLayout>
    );
};
