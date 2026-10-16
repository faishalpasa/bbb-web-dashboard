import { Link, useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

import { useAppContext } from '@/app-context';
import { BrandLogo } from '@/components/brand-logo';
import { ADMIN_ROLE_LABELS } from '@/constants/auth';
import { MAIN_NAVIGATION, type NavigationItem, SUPERADMIN_NAVIGATION } from '@/constants/navigation';
import { ROUTES } from '@/constants/route';
import { cn } from '@/lib/utils';
import type { AdminSession } from '@/types/auth';

const initialsOf = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

interface SidebarItemProps {
    item: NavigationItem;
    session: AdminSession;
    testPrefix: string;
    onNavigate?: () => void;
}

const SidebarItem = ({ item, session, testPrefix, onNavigate }: SidebarItemProps) => {
    const badgeCount = item.badge ? session.badges[item.badge] : 0;

    return (
        <Link
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.to === ROUTES.dashboard }}
            className="text-foreground hover:bg-secondary/70 flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors"
            activeProps={{ className: 'bg-secondary', 'aria-current': 'page' }}
            data-test-id={`${testPrefix}_link_${item.key}`}
        >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {badgeCount > 0 && (
                <span
                    className="rounded-full bg-[#fbe5d6] px-1.5 text-xs font-semibold text-[#8a3b12]"
                    data-test-id={`${testPrefix}_badge_${item.key}`}
                >
                    {badgeCount}
                </span>
            )}
        </Link>
    );
};

interface SidebarContentProps {
    testPrefix: string;
    onNavigate?: () => void;
}

// The menu itself; the desktop sidebar and the mobile drawer render the same content.
export const SidebarContent = ({ testPrefix, onNavigate }: SidebarContentProps) => {
    const { session, handleLogout } = useAppContext();
    const navigate = useNavigate();

    const onLogout = async () => {
        onNavigate?.();
        await handleLogout();
        void navigate({ to: ROUTES.login });
    };

    if (!session) return null;

    const superadminItems = SUPERADMIN_NAVIGATION.filter((item) => item.capability && session.can[item.capability]);

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col" data-test-id={`${testPrefix}_root`}>
            <div className="space-y-1 px-4 pt-5 pb-4">
                <BrandLogo className="w-[150px]" />
                <p className="text-muted-foreground text-xs font-medium">Admin</p>
            </div>

            <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-2" aria-label="Menu utama">
                <div className="grid gap-1">
                    {MAIN_NAVIGATION.map((item) => (
                        <SidebarItem key={item.key} item={item} session={session} testPrefix={testPrefix} onNavigate={onNavigate} />
                    ))}
                </div>

                {superadminItems.length > 0 && (
                    <div className="grid gap-1">
                        <p className="text-muted-foreground px-2.5 pb-1 text-[11px] font-semibold tracking-wider uppercase">Superadmin</p>
                        {superadminItems.map((item) => (
                            <SidebarItem key={item.key} item={item} session={session} testPrefix={testPrefix} onNavigate={onNavigate} />
                        ))}
                    </div>
                )}
            </nav>

            <div className="border-border flex items-center gap-2 border-t px-3 py-3">
                <span
                    className={cn('bg-secondary text-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold')}
                    aria-hidden="true"
                >
                    {initialsOf(session.user.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" data-test-id={`${testPrefix}_text_user_name`}>
                        {session.user.name}
                    </p>
                    <p className="text-muted-foreground text-xs" data-test-id={`${testPrefix}_text_user_role`}>
                        {ADMIN_ROLE_LABELS[session.user.role]}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                    aria-label="Keluar"
                    data-test-id={`${testPrefix}_button_logout`}
                >
                    <LogOut className="size-4" />
                </button>
            </div>
        </div>
    );
};

export const AdminSidebar = () => (
    <aside className="bg-background border-border sticky top-0 hidden h-svh w-[200px] shrink-0 flex-col border-r lg:flex">
        <SidebarContent testPrefix="sidebar" />
    </aside>
);
