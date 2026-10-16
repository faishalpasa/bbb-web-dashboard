import { ScaffoldLayout } from '@/components/layout/scaffold-layout';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/hooks/useTitle';

export const PageServerError = ({ reset }: { reset: () => void }) => {
    useTitle('Terjadi kesalahan');
    return (
        <ScaffoldLayout>
            <section className="space-y-4 text-center">
                <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
                <Button onClick={reset} data-test-id="error_button_retry">
                    Coba lagi
                </Button>
            </section>
        </ScaffoldLayout>
    );
};
