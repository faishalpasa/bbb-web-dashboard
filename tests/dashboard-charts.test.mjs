import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const fixtures = {
    '@test/dashboard': `export let dashboard = null; export const setDashboard = value => { dashboard = value; };`,
    '../_context': `import {dashboard} from '@test/dashboard'; export const usePageContext = () => ({dashboard});`,
    '@/components/molecules/permission-gate': `export const PermissionGate = ({children}) => children;`,
    '@tanstack/react-router': `import {createElement} from 'react'; export const Link = ({children, to, params, ...props}) => createElement('a', {...props, href: to.replace('$eventId', params.eventId)}, children);`,
};
const bundle = await build({
    stdin: {
        contents: `export {MemberGrowthCard} from './src/pages/admin/dashboard/_components/member-growth-card';
            export {MemberStatusCard} from './src/pages/admin/dashboard/_components/member-status-card';
            export {EventPerformanceCard} from './src/pages/admin/dashboard/_components/event-performance-card';
            export {setDashboard} from '@test/dashboard'; export {createElement} from 'react';
            export {renderToStaticMarkup} from 'react-dom/server';`,
        resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    plugins: [
        {
            name: 'dashboard-fixtures',
            setup(build) {
                build.onResolve(
                    { filter: /^(?:@test\/dashboard|\.\.\/_context|@\/components\/molecules\/permission-gate|@tanstack\/react-router)$/ },
                    (args) => ({ path: args.path, namespace: 'fixture' }),
                );
                build.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
                    contents: fixtures[args.path],
                    loader: 'js',
                    resolveDir: process.cwd(),
                }));
            },
        },
    ],
});
const { MemberGrowthCard, MemberStatusCard, EventPerformanceCard, setDashboard, createElement, renderToStaticMarkup } = await import(
    `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);
const render = (Component) => renderToStaticMarkup(createElement(Component));

test('growth chart renders six monthly values including zero months', () => {
    setDashboard({
        memberGrowth: [
            { month: '2026-05', newMembers: 0 },
            { month: '2026-06', newMembers: 2 },
            { month: '2026-07', newMembers: 0 },
            { month: '2026-08', newMembers: 3 },
            { month: '2026-09', newMembers: 0 },
            { month: '2026-10', newMembers: 4 },
        ],
    });
    const html = render(MemberGrowthCard);
    assert.equal((html.match(/data-test-id="dashboard_bar_growth_/g) ?? []).length, 6);
    assert.match(html, /Pertumbuhan Member/);
    assert.match(html, /4 member baru pada 2026-10/);
});

test('status chart shows all statuses and exact counts', () => {
    setDashboard({
        stats: { members: { total: 5 } },
        memberStatuses: [
            { status: 'active', label: 'Aktif', count: 3 },
            { status: 'migrated', label: 'Menunggu data', count: 2 },
            { status: 'exit_requested', label: 'Mengajukan keluar', count: 0 },
            { status: 'unsubscribed', label: 'Nonaktif', count: 0 },
        ],
    });
    const html = render(MemberStatusCard);
    assert.equal((html.match(/data-test-id="dashboard_bar_status_/g) ?? []).length, 4);
    assert.match(html, /Aktif: 3 dari 5 member/);
    assert.match(html, /Menunggu data: 2 dari 5 member/);
});

test('event chart explains attendance rate and separates present from absent', () => {
    setDashboard({
        eventPerformance: [
            { eventId: 'qa-event', eventTitle: 'Kegiatan QA', startsAt: '2026-10-20T02:00:00Z', registered: 4, attended: 3, percent: 75 },
        ],
    });
    const html = render(EventPerformanceCard);
    assert.match(html, /Persentase hadir = hadir ÷ terdaftar/);
    assert.match(html, /4 terdaftar, 3 hadir, 1 tidak hadir/);
    assert.match(html, /75% hadir/);
    assert.match(html, /width:75%/);
    assert.match(html, /width:25%/);
    assert.match(html, /bg-foreground h-full/);
    assert.match(html, /bg-\[#a45f37\]/);
    assert.match(html, /dashboard_link_event_qa-event/);

    setDashboard({ eventPerformance: [] });
    assert.match(render(EventPerformanceCard), /Belum ada kegiatan yang selesai/);
});

test('summary card uses current active status, not old engaged metric', async () => {
    const source = await readFile(new URL('../src/pages/admin/dashboard/_context.tsx', import.meta.url), 'utf8');
    assert.match(source, /label: 'Member Aktif'/);
    assert.match(source, /stats\.activeMembers\.total/);
    assert.doesNotMatch(source, /stats\.engaged/);
});
