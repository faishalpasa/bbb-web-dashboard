import { Outlet } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/components/brand-logo';
import { AdminSidebar, SidebarContent } from '@/components/layout/admin-sidebar';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

export const AdminLayout = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <div className="bg-background text-foreground flex min-h-svh flex-col lg:flex-row" data-test-id="admin_layout_root">
            <AdminSidebar />

            <header
                className="border-border bg-background sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 lg:hidden"
                data-test-id="admin_topbar"
            >
                <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="hover:bg-secondary focus-visible:ring-ring -ml-2 flex size-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                    aria-label="Buka menu"
                    aria-expanded={isDrawerOpen}
                    data-test-id="admin_topbar_button_menu"
                >
                    <Menu className="size-5" />
                </button>
                <BrandLogo className="w-[110px]" />
            </header>

            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetContent data-test-id="admin_drawer" aria-describedby="admin-drawer-description">
                    <SheetTitle className="sr-only">Menu admin</SheetTitle>
                    <SheetDescription id="admin-drawer-description" className="sr-only">
                        Navigasi utama dashboard admin.
                    </SheetDescription>
                    <SheetClose
                        className="hover:bg-secondary focus-visible:ring-ring absolute top-3 right-3 flex size-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                        aria-label="Tutup menu"
                        data-test-id="admin_drawer_button_close"
                    >
                        <X className="size-4" />
                    </SheetClose>
                    <SidebarContent testPrefix="drawer" onNavigate={() => setIsDrawerOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="min-w-0 flex-1 p-4 lg:p-6">
                <Outlet />
            </main>
        </div>
    );
};
