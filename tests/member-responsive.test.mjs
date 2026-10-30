import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = (path) => readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');

// These guard the layout utilities; actual CSS geometry is checked in the browser.
test('member search uses the shared responsive panel with a mobile-only sort field', async () => {
    const filters = await source('pages/admin/members/_components/member-filters.tsx');
    assert.match(filters, /<ListFilterPanel/);
    assert.match(filters, /search=\{/);
    assert.doesNotMatch(filters, /className="col-span-2/);
    assert.match(filters, /lg:hidden/);
    assert.match(filters, /data-test-id="members_select_sort"/);
});

test('member header actions can wrap without expanding the mobile page', async () => {
    const page = await source('pages/admin/members/_components/page-content.tsx');
    assert.match(page, /flex w-full min-w-0 flex-wrap gap-2 sm:w-auto/);
    for (const action of ['MEMBER_CREATE', 'MEMBER_EXPORT']) {
        assert.ok(page.includes(`P.${action}`));
    }
});

test('member and event filters stick 24px from the top only on desktop', async () => {
    const panel = await source('components/molecules/list-filter-panel.tsx');
    const classes = panel.match(/<section\s+className="([^"]+)"/)[1].split(' ');
    for (const module of ['members', 'events']) {
        const name = module === 'members' ? 'member' : 'event';
        const filters = await source(`pages/admin/${module}/_components/${name}-filters.tsx`);
        assert.match(filters, /<ListFilterPanel/);
        for (const utility of ['bg-background', 'lg:sticky', 'lg:top-6', 'lg:z-20']) {
            assert.ok(classes.includes(utility), `${module}: ${utility}`);
        }
        assert.ok(!classes.includes('sticky'), 'mobile filters must scroll normally');
        assert.ok(!classes.includes('fixed'), 'filters must stay in document flow');
    }
});

test('sticky desktop filters mask the gutters only after reaching the sticky offset', async () => {
    const panel = await source('components/molecules/list-filter-panel.tsx');
    assert.match(panel, /new IntersectionObserver/);
    assert.match(panel, /rootMargin: '-24px 0px 0px 0px'/);
    assert.match(panel, /\{isStuck && \(/);
    assert.match(panel, /bg-background pointer-events-none absolute -inset-x-6 -top-6 bottom-0 -z-10/);
    assert.match(panel, /aria-hidden="true"/);
    assert.match(panel, /border-border bg-card grid/);
});

test('mobile and tablet filters use the shared dialog as a bottom sheet below 1024px', async () => {
    const panel = await source('components/molecules/list-filter-panel.tsx');
    assert.match(panel, /useMediaQuery\(1024\)/);
    assert.match(panel, /mobileUntil=\{1024\}/);
    assert.match(panel, /aria-expanded=\{isOpen\}/);
    assert.match(panel, /overflow-y-auto/);
    assert.match(panel, /safe-area-inset-bottom/);
    const dialog = await source('components/molecules/dialog.tsx');
    assert.match(dialog, /mobileUntil = 768/);
    assert.match(dialog, /useMediaQuery\(mobileUntil\)/);
    const events = await source('pages/admin/events/_components/event-filters.tsx');
    assert.match(events, /type="date"/);
    assert.match(events, /events_date_from_input/);
    assert.match(events, /events_date_to_input/);
});

test('shared create/edit member preferences wrap inside the card', async () => {
    const form = await source('components/molecules/member-form-sections.tsx');
    assert.match(form, /<fieldset className="grid min-w-0 gap-2"/);
    assert.match(form, /Preferensi kegiatan<\/legend>\s*<div className="flex flex-wrap gap-2">/);
    assert.match(form, /name="participationPreference"/);
});
