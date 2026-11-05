import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('one-off import route, entry and permission are retired without removing member operations', async () => {
    for (const file of ['router.tsx', 'constants/route.ts', 'constants/permission.ts', 'pages/admin/members/_components/page-content.tsx']) {
        const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
        assert.doesNotMatch(source, /memberImport|MEMBER_IMPORT_PREVIEW|Preview Masterlist|member-import-preview/);
    }
    for (const file of ['services/masterlist.ts', 'constants/masterlist.ts', 'types/masterlist.d.ts', 'pages/admin/members/import/index.tsx']) {
        await assert.rejects(access(new URL(`../src/${file}`, import.meta.url)), { code: 'ENOENT' });
    }
    const page = await readFile(new URL('../src/pages/admin/members/_components/page-content.tsx', import.meta.url), 'utf8');
    assert.match(page, /Tambah Member/);
    assert.match(page, /Expor/);
    assert.match(page, /<MemberFilters/);
});
