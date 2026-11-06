import { ScaffoldLayout } from '@/components/layout/scaffold-layout';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/hooks/useTitle';

// "Coba lagi" reloads the browser so every stale state and chunk is fetched again.
export const PageServerError = () => {
    useTitle('Terjadi kesalahan');
    return (
        <ScaffoldLayout>
            <section className="space-y-4 text-center">
                <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
                <Button onClick={() => window.location.reload()} data-test-id="error_button_retry">
                    Coba lagi
                </Button>
            </section>
        </ScaffoldLayout>
    );
};
