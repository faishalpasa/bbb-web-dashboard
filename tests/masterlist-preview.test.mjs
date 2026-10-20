import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({
    stdin: { contents: `export * from './src/services/masterlist'; export * from './src/constants/masterlist';
        export * from './src/constants/permission'; export * from './src/utils/permission'; export * from './src/utils/api';
        export { AxiosError } from 'axios';`, resolveDir: process.cwd() },
    bundle: true, write: false, format: 'esm', platform: 'browser',
    define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example.test/api"' },
});
const { postMasterlistPreview, getMasterlistPreview, MASTERLIST_FIELDS, masterlistStatusLabel, PERMISSIONS: P, can, canAll, axiosClient, AxiosError } =
    await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

test('member create/export does not imply preview and both grants are needed', () => {
    assert.equal(can({ permissions: [P.MEMBER_CREATE, P.MEMBER_EXPORT] }, P.MEMBER_IMPORT_PREVIEW), false);
    assert.equal(canAll({ permissions: [P.MEMBER_IMPORT_PREVIEW] }, [P.MEMBER_VIEW, P.MEMBER_IMPORT_PREVIEW]), false);
    assert.equal(canAll({ permissions: [P.MEMBER_VIEW, P.MEMBER_IMPORT_PREVIEW] }, [P.MEMBER_VIEW, P.MEMBER_IMPORT_PREVIEW]), true);
});

test('upload uses multipart mapping and never invokes an import/confirm endpoint', async () => {
    const calls = [];
    axiosClient.defaults.adapter = async (config) => {
        calls.push(config);
        return { data: { data: { import_id: 'synthetic', can_import: false } }, status: 201, statusText: 'Created', headers: {}, config };
    };
    const file = new File(['Email,Nama\na@example.test,Ibu QA'], 'synthetic.csv', { type: 'text/csv' });
    const response = await postMasterlistPreview(file, { email: 'Email', name: 'Nama', joined_at: null });
    assert.equal(calls[0].url, '/admin/member-import-previews');
    assert.equal(calls[0].method, 'post');
    assert.ok(calls[0].data instanceof FormData);
    assert.equal(calls[0].data.get('file').name, 'synthetic.csv');
    assert.equal(calls[0].data.get('mapping[email]'), 'Email');
    assert.equal(calls[0].data.get('mapping[joined_at]'), '');
    assert.equal(calls[0].data.get('perPage'), '25');
    assert.equal(response.data.can_import, false);
    assert.equal(calls.length, 1);
});

test('read pages use encoded identity and page query through the shared transport', async () => {
    axiosClient.defaults.adapter = async (config) => {
        assert.equal(config.url, '/admin/member-import-previews/id%2Funsafe');
        assert.deepEqual(config.params, { page: 6, perPage: 25 });
        return { data: { data: { rows: [], meta: { currentPage: 6 } } }, status: 200, statusText: 'OK', headers: {}, config };
    };
    assert.equal((await getMasterlistPreview('id/unsafe', 6)).data.meta.currentPage, 6);
});

test('validation errors stay typed and preserve per field errors', async () => {
    axiosClient.defaults.adapter = async (config) => {
        throw new AxiosError('bad input', 'ERR_BAD_REQUEST', config, undefined, {
            data: { message: 'File invalid.', errors: { file: ['Maksimal 10 MB.'] } },
            status: 422, statusText: 'Unprocessable', headers: {}, config,
        });
    };
    await assert.rejects(postMasterlistPreview(new File(['bad'], 'synthetic.csv'), {}), (error) => {
        assert.equal(error.status, false);
        assert.equal(error.httpStatus, 422);
        assert.deepEqual(error.data.errors.file, ['Maksimal 10 MB.']);
        return true;
    });
});

test('mapping catalog has no write protected member number status consent or verified fields', () => {
    const names = MASTERLIST_FIELDS.map((field) => field.value);
    assert.equal(names.length, 14);
    assert.equal(new Set(names).size, 14);
    for (const forbidden of ['member_number', 'consented_at', 'rules_version', 'status', 'email_verified_at']) assert.equal(names.includes(forbidden), false);
});

test('accepted profile notes are not relabeled valid and identity conflicts remain skipped', () => {
    const policy = { review_policy: 'approved_deferred_profile_v1' };
    assert.equal(masterlistStatusLabel({ status: 'warning', provenance: policy }), 'Diterima dengan catatan');
    assert.equal(masterlistStatusLabel({ status: 'invalid', provenance: policy }), 'Tidak valid / skip');
    assert.equal(masterlistStatusLabel({ status: 'warning', provenance: {} }), 'Perlu review');
    assert.equal(masterlistStatusLabel({ status: 'valid', provenance: {} }), 'Valid');
});

test('dashboard route and entry are gated by dedicated permission; no active confirm control', async () => {
    const router = await readFile(new URL('../src/router.tsx', import.meta.url), 'utf8');
    assert.match(router, /path: ROUTES.memberImport,[\s\S]*?requirePermission\(P.MEMBER_VIEW, P.MEMBER_IMPORT_PREVIEW\)/);
    const page = await readFile(new URL('../src/pages/admin/members/import/_components/page-content.tsx', import.meta.url), 'utf8');
    assert.match(page, /Import belum tersedia/);
    assert.doesNotMatch(page, /dangerouslySetInnerHTML|localStorage|postMasterlistImport/);
    const detail = await readFile(new URL('../src/pages/admin/members/import/_components/row-detail.tsx', import.meta.url), 'utf8');
    assert.doesNotMatch(detail, /dangerouslySetInnerHTML|innerHTML|localStorage/);
});
