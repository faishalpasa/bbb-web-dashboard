import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = (path) => readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');

// These guard the layout utilities; actual CSS geometry is checked in the browser.
test('member search spans two columns only from the two-column breakpoint', async () => {
    const filters = await source('pages/admin/members/_components/member-filters.tsx');
    assert.match(filters, /grid grid-cols-1/);
    assert.match(filters, /grid min-w-0 gap-1\.5 sm:col-span-2 lg:col-span-1/);
    assert.doesNotMatch(filters, /className="col-span-2/);
    assert.match(filters, /lg:grid-cols-\[minmax\(0,2fr\)_repeat\(4,minmax\(0,1fr\)\)\]/);
    assert.match(filters, /<div className="grid min-w-0 gap-1\.5">/);
});

test('member header actions can wrap without expanding the mobile page', async () => {
    const page = await source('pages/admin/members/_components/page-content.tsx');
    assert.match(page, /flex w-full min-w-0 flex-wrap gap-2 sm:w-auto/);
    for (const action of ['MEMBER_CREATE', 'MEMBER_EXPORT']) {
        assert.ok(page.includes(`P.${action}`));
    }
});

test('shared create/edit member preferences wrap inside the card', async () => {
    const form = await source('components/molecules/member-form-sections.tsx');
    assert.match(form, /<fieldset className="grid min-w-0 gap-2"/);
    assert.match(form, /Preferensi kegiatan<\/legend>\s*<div className="flex flex-wrap gap-2">/);
    assert.match(form, /name="participationPreference"/);
});
