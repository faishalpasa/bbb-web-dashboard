import { Link } from '@tanstack/react-router';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { PermissionGate } from '@/components/molecules/permission-gate';
import { TablePagination } from '@/components/molecules/table-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePageContext } from '../_context';

export const PageContent = () => {
    const { roles, pagination, isLoading, failure, reload } = usePageContext();

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Role dan Permission</h1>
                    <p className="text-muted-foreground text-sm">
                        Satu akun admin memiliki satu role. Permission baru hanya ditambah lewat migration database.
                    </p>
                </div>
                <PermissionGate permission={P.ROLE_CREATE}>
                    <Button asChild data-test-id="roles_button_create">
                        <Link to={ROUTES.roleNew}>Buat Role</Link>
                    </Button>
                </PermissionGate>
            </header>
            {failure && (
                <div className="space-y-2">
                    <FeedbackToast data-test-id="roles_error">{failure}</FeedbackToast>
                    <Button variant="outline" onClick={reload} data-test-id="roles_button_retry">
                        Coba lagi
                    </Button>
                </div>
            )}
            <section className="border-border bg-card rounded-lg border p-4" aria-label="Daftar role" data-test-id="roles_list">
                {isLoading && roles.length === 0 ? (
                    <Skeleton className="h-40" />
                ) : (
                    <ul className="divide-border divide-y">
                        {pagination.items.map((role) => (
                            <li key={role.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="font-medium break-words">
                                        {role.label} {role.isSystem && <span className="bg-secondary rounded px-1.5 py-0.5 text-xs">Sistem</span>}
                                    </p>
                                    <p className="text-muted-foreground text-xs break-all">
                                        {role.name} · {role.adminCount} akun
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" data-test-id={`roles_button_view_${role.id}`}>
                                    <Link to={ROUTES.roleDetail} params={{ roleId: role.id }}>
                                        Lihat
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
                    <span className="sr-only">{roles.length} role</span>
                    <TablePagination
                        total={roles.length}
                        perPage={pagination.perPage}
                        onPerPageChange={pagination.setPerPage}
                        currentPage={pagination.page}
                        lastPage={pagination.lastPage}
                        isLoading={isLoading}
                        onPageChange={pagination.goToPage}
                        data-test-id="roles_pagination"
                    />
                </footer>
            </section>
        </div>
    );
};
