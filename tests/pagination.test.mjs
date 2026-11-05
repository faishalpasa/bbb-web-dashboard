import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from 'esbuild';

globalThis.window = { innerWidth: 1360, location: { href: 'http://localhost:5174/members' } };

const bundle = await build({
    stdin: { contents: `export * from './src/utils/pagination'; export * from './src/components/molecules/table-pagination'; export {ListFilterPanel} from './src/components/molecules/list-filter-panel';
        export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: 'esm', platform: 'browser',
});
const { paginationEntries, paginateItems, TablePagination, ListFilterPanel, createElement, renderToStaticMarkup } =
    await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

test('small tables show all numbers and no previous/next controls', () => {
    assert.deepEqual(paginationEntries(1, 1), [1]);
    assert.deepEqual(paginationEntries(2, 3), [1, 2, 3]);
    assert.deepEqual(paginationEntries(7, 7), [1, 2, 3, 4, 5, 6, 7]);
});

test('filter panel only renders inline filters on desktop and a collapsed trigger on mobile and tablet', () => {
    const props = {search: createElement('input', {'data-test-id': 'search'}), title: 'Filter', hasActiveFilter: true, 'data-test-id': 'filters'};
    for (const width of [360, 390, 768, 1023, 1024, 1360]) {
        globalThis.window.innerWidth = width;
        const html = renderToStaticMarkup(createElement(ListFilterPanel, props, createElement('span', null, 'Inline filter fixture')));
        assert.match(html, /data-test-id="search"/);
        if (width >= 1024) {
            assert.match(html, /Inline filter fixture/);
            assert.match(html, /lg:sticky lg:top-6/);
            assert.doesNotMatch(html, /filters_button_open/);
        } else {
            assert.match(html, /filters_button_open/);
            assert.match(html, /aria-expanded="false"/);
            assert.doesNotMatch(html, /Inline filter fixture/);
        }
    }
    globalThis.window.innerWidth = 1360;
});
test('large tables keep first last active and nearby pages with bounded ellipses', () => {
    assert.deepEqual(paginationEntries(1, 200), [1, 2, 3, 4, 'end-ellipsis', 200]);
    assert.deepEqual(paginationEntries(100, 200), [1, 'start-ellipsis', 99, 100, 101, 'end-ellipsis', 200]);
    assert.deepEqual(paginationEntries(200, 200), [1, 'start-ellipsis', 197, 198, 199, 200]);
    for (let current = 1; current <= 200; current++) {
        const entries = paginationEntries(current, 200);
        assert.ok(entries.length <= 7);
        assert.ok(entries.includes(current));
        assert.equal(entries[0], 1);
        assert.equal(entries.at(-1), 200);
        assert.equal(new Set(entries).size, entries.length);
    }
});
test('renders shadcn composition with accessible active page and 44px button targets', () => {
    const html = renderToStaticMarkup(createElement(TablePagination, { currentPage: 2, lastPage: 3, total: 61, perPage: 25, onPageChange: () => {}, onPerPageChange: () => {}, 'data-test-id': 'test_pagination' }));
    assert.match(html, /<nav aria-label="Halaman tabel"/);
    assert.match(html, /<ul/);
    assert.equal((html.match(/<button/g) ?? []).length, 5);
    assert.match(html, /aria-current="page"/);
    assert.match(html, /aria-label="Halaman 2"/);
    assert.match(html, /size-11/);
    assert.doesNotMatch(html, /Sebelumnya|Berikutnya|<a /);
    assert.match(html, /Tampilkan/);
    assert.match(html, /Jumlah baris per halaman/);
    assert.match(html, /dari 61 total data/);
    assert.doesNotMatch(html, /Halaman pertama|Halaman terakhir/);
    assert.match(html, /Halaman sebelumnya/);
    assert.match(html, /Halaman berikutnya/);
});
test('loading disables all numbers and current page remains non-actionable', () => {
    const html = renderToStaticMarkup(createElement(TablePagination, { currentPage: 2, lastPage: 3, total: 61, perPage: 25, isLoading: true, onPageChange: () => {}, onPerPageChange: () => {}, 'data-test-id': 'loading' }));
    assert.equal((html.match(/disabled=""/g) ?? []).length, 6);
});
test('tables without custom page sizes retain their original size options', () => {
    const html = renderToStaticMarkup(createElement(TablePagination, {currentPage: 1, lastPage: 1, total: 0, perPage: 25, onPageChange() {}, onPerPageChange() {}, 'data-test-id': 'unchanged'}));
    assert.deepEqual([...html.matchAll(/<option value="(\d+)"/g)].map(([, size]) => Number(size)), [10, 20, 25, 50, 100]);
});
test('client collections keep exact order and identity across pages with no duplicates or omissions', () => {
    const records = Array.from({ length: 61 }, (_, id) => ({ id }));
    const pages = [1, 2, 3].map((page) => paginateItems(records, page));
    assert.deepEqual(pages.map((page) => page.items.length), [25, 25, 11]);
    assert.deepEqual(pages.flatMap((page) => page.items), records);
    assert.equal(pages[1].items[0], records[25]);
    assert.equal(paginateItems(records, 9).page, 3);
    assert.equal(paginateItems([], 9).page, 1);
    assert.deepEqual(paginateItems([], 9).items, []);
    assert.deepEqual(records.map((row) => row.id), Array.from({ length: 61 }, (_, id) => id));
    assert.equal(paginateItems(records, 2, 10).items[0].id, 10);
});

test('mobile keeps current first last and at most five entries, with no wide page-number strip', () => {
    for (let page = 1; page <= 200; page++) {
        const entries = paginationEntries(page, 200, true);
        assert.ok(entries.length <= 5);
        assert.ok(entries.includes(page));
        assert.equal(entries[0], 1);
        assert.equal(entries.at(-1), 200);
    }
});
test('all dashboard tables and equivalent mobile lists share numbered pagination', async () => {
    for (const path of [
        'members/_components/member-table.tsx', 'events/_components/event-table.tsx',
        'events/[id]/_components/participant-table.tsx', 'audit-logs/_components/page-content.tsx',
        'admins/_components/page-content.tsx',
        'members/[id]/_components/member-history.tsx', 'roles/_components/page-content.tsx',
        'exit-requests/_components/page-content.tsx',
    ]) {
        const source = await readFile(new URL(`../src/pages/admin/${path}`, import.meta.url), 'utf8');
        assert.match(source, /<TablePagination\s/, path);
        assert.doesNotMatch(source, /Sebelumnya|Berikutnya/, path);
    }
});
