import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from 'esbuild';

globalThis.window = { innerWidth: 1360 };
const mocks = {
    '@test/member-actions': `export let permissions = []; export let context;
        export const setFixture = (nextPermissions, nextContext) => {permissions = nextPermissions; context = nextContext;};`,
    '@/hooks/usePermissions': `import {permissions} from '@test/member-actions';
        export const usePermissions = () => ({canAll: names => names.every(name => permissions.includes(name))});`,
    '../_context': `import {context} from '@test/member-actions'; export const usePageContext = () => context;`,
    '@tanstack/react-router': `import {createElement} from 'react';
        export const Link = ({to, params, children, ...props}) => createElement('a', {...props, href: to.replace('$memberId', params.memberId)}, children);`,
};
const bundle = await build({
    stdin: {contents: `export {MemberTable} from './src/pages/admin/members/_components/member-table';
        export {setFixture} from '@test/member-actions'; export {createElement} from 'react';
        export {renderToStaticMarkup} from 'react-dom/server';`, resolveDir: process.cwd()},
    bundle: true, write: false, format: 'esm', platform: 'browser',
    plugins: [{name: 'member-actions-fixtures', setup(build) {
        build.onResolve({filter: /^(?:@test\/member-actions|@\/hooks\/usePermissions|\.\.\/_context|@tanstack\/react-router)$/}, args => ({path: args.path, namespace: 'fixture'}));
        build.onLoad({filter: /.*/, namespace: 'fixture'}, args => ({contents: mocks[args.path], loader: 'js', resolveDir: process.cwd()}));
    }}],
});
const {MemberTable, setFixture, createElement, renderToStaticMarkup} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const member = {id: 'qa-member', memberNumber: 'BFF-00123', name: 'Ibu QA', email: 'ibu.qa+member@example.test', whatsapp: '', regency: null, province: null,
    preference: null, status: {value: 'awaiting_data', label: 'Menunggu data'}, joinedEvents: 0, attendedEvents: 0, joinedAt: '2026-10-20T00:00:00Z'};
const render = (permissions, status = 'awaiting_data', whatsapp = '') => {
    setFixture(permissions, {list: {items: [{...member, whatsapp, status: {value: status, label: status}}], meta: {total: 1, currentPage: 1, lastPage: 1}},
        isLoading: false, rangeStart: 1, rangeEnd: 1, query: {page: 1, perPage: 25, sortBy: 'joinedAt', sortDirection: 'desc'}, goToPage() {}, setPerPage() {}, setSort() {}});
    return renderToStaticMarkup(createElement(MemberTable));
};

test('member edit links appear in desktop rows and mobile cards with the existing edit destination', () => {
    const html = render(['member-view', 'member-update']);
    assert.equal((html.match(/data-test-id="members_link_edit_qa-member"/g) ?? []).length, 2);
    assert.equal((html.match(/href="\/members\/qa-member\/edit"/g) ?? []).length, 2);
    assert.equal((html.match(/aria-label="Edit member Ibu QA"/g) ?? []).length, 2);
    assert.match(html, /size-11 md:size-9/);
});

test('view-only, create-only, empty and missing-view grants cannot expose edit', () => {
    for (const grants of [[], ['member-view'], ['member-view', 'member-create'], ['member-update']]) {
        const html = render(grants);
        assert.doesNotMatch(html, /members_link_edit_/);
        assert.match(html, /members_link_detail_qa-member/);
    }
});

test('email, WhatsApp, detail and edit share the same mobile and desktop dimensions', () => {
    const html = render(['member-view', 'member-update'], 'active', '081234567890');
    const actions = [...html.matchAll(/<a\b[^>]*data-test-id="members_link_(?:email|whatsapp|detail|edit)_qa-member"[^>]*>/g)].map(([tag]) => tag);
    assert.equal(actions.length, 8, 'four actions in both desktop rows and mobile cards');
    for (const tag of actions) {
        const classes = tag.match(/class="([^"]+)"/)[1].split(' ');
        assert.ok(classes.includes('size-11'), 'mobile target is 44px');
        assert.ok(classes.includes('md:size-9'), 'desktop target is 36px');
        assert.ok(!classes.includes('size-9'), 'unconditional 36px must not override mobile');
    }
});

test('email is visible in desktop and mobile and contact uses an encoded mailto link', () => {
    const html = render(['member-view']);
    assert.match(html, /members_text_email_qa-member/);
    assert.match(html, /members_card_email_qa-member/);
    assert.equal((html.match(/href="mailto:ibu.qa%2Bmember%40example.test"/g) ?? []).length, 2);
    assert.equal((html.match(/aria-label="Hubungi Ibu QA lewat email"/g) ?? []).length, 2);
});

test('name column stacks name email and WhatsApp without a separate contact column', () => {
    const html = render(['member-view'], 'active', '081234567890');
    assert.doesNotMatch(html, />Kontak<\/th>/);
    assert.doesNotMatch(html, />No\. WhatsApp<\/th>/);
    const cell = html.match(/<td[^>]*data-test-id="members_cell_name_qa-member"[^>]*>([\s\S]*?)<\/td>/)?.[1];
    assert.ok(cell);
    assert.match(cell, /0812-3456-7890/);
    assert.match(cell, /ibu.qa\+member@example.test/);
    assert.ok(cell.indexOf('Ibu QA') < cell.indexOf('ibu.qa+member@example.test'));
    assert.ok(cell.indexOf('ibu.qa+member@example.test') < cell.indexOf('0812-3456-7890'));
});

test('desktop headers follow the requested order without the attendance column', () => {
    const html = render(['member-view']);
    const head = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/)[1];
    const labels = [...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
        .map(([, cell]) => cell.replace(/<[^>]*>/g, '').trim());
    assert.deepEqual(labels, ['Nomor', 'Nama', 'Domisili', 'Bergabung', 'Preferensi', 'Status', 'Aksi']);
});

test('member WhatsApp icons match the 16px detail and edit icons', () => {
    const html = render(['member-view'], 'active', '081234567890');
    const icons = [...html.matchAll(/<img[^>]*src="\/images\/whatsapp.png"[^>]*>/g)].map(([tag]) => tag);
    assert.equal(icons.length, 2);
    for (const icon of icons) {
        assert.match(icon, /size-4/);
        assert.doesNotMatch(icon, /size-5/);
    }
});

test('edit visibility follows permissions rather than guessing member status restrictions', () => {
    for (const status of ['active', 'awaiting_data', 'inactive', 'exit_requested']) {
        assert.match(render(['member-view', 'member-update'], status), /members_link_edit_qa-member/);
    }
});

test('member table exposes sortable desktop headers with joined date newest first by default', () => {
    const html = render(['member-view']);

    for (const field of ['memberNumber', 'name', 'joinedAt']) {
        assert.match(html, new RegExp(`data-test-id="members_button_sort_${field}"`));
    }
    assert.match(html, /aria-sort="descending"/);
});

test('member table renders a dash when WhatsApp is absent', () => {
    const html = render(['member-view']);

    const contact = html.match(/<td[^>]*data-test-id="members_cell_name_qa-member"[^>]*>([\s\S]*?)<\/td>/)?.[1];
    assert.match(contact, />-<\/span>/);
    assert.match(html, /data-test-id="members_card_whatsapp_qa-member">-<\/p>/);
});

test('member and participant export labels no longer claim an Excel file', async () => {
    for (const path of ['members/_components/page-content.tsx', 'events/[id]/_components/participant-table.tsx']) {
        const source = await readFile(new URL(`../src/pages/admin/${path}`, import.meta.url), 'utf8');
        assert.match(source, /isExporting \? 'Menyiapkan…' : 'Expor'/);
        assert.doesNotMatch(source, /Ekspor Excel/);
    }
});

test('member sorting travels with list and export queries, with a mobile selector', async () => {
    const [service, filters] = await Promise.all([
        readFile(new URL('../src/services/member.ts', import.meta.url), 'utf8'),
        readFile(new URL('../src/pages/admin/members/_components/member-filters.tsx', import.meta.url), 'utf8'),
    ]);

    assert.match(service, /type MemberFilterQuery = Omit<MemberListQuery, 'page'>/);
    assert.match(filters, /data-test-id="members_select_sort"/);
    assert.match(filters, /Tanggal bergabung: terbaru/);
    assert.match(filters, /Nomor member: naik/);
    assert.match(filters, /Nama: A–Z/);
});
