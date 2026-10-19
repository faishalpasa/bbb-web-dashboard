import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from 'esbuild';

// Exercise the installed TS implementation without another test runtime or generated files.
const bundled = await build({
    stdin: {
        contents: `export * from './src/utils/permission'; export * from './src/utils/session-cache';
            export * from './src/constants/permission'; export * from './src/constants/route';
            export * from './src/utils/api'; export * from './src/utils/token';
            export { default as axios, AxiosError } from 'axios';
            export * from './src/utils/permission-tree'; export * from './src/components/molecules/permission-tree';
            export { createElement } from 'react'; export { renderToStaticMarkup } from 'react-dom/server';`,
        resolveDir: process.cwd(),
    },
    bundle: true, write: false, format: 'esm', platform: 'browser',
    define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example.test/api"' },
});
const { can, canAll, canAny, canVisitSection, landingRoute, SessionCache, SESSION_MAX_AGE_MS, PERMISSIONS: P, ROUTES: R,
    axiosClient, axios, AxiosError, setPermissionDeniedHandler, setUnauthorizedHandler, setSessionUpdatedHandler, setToken, currentToken, clearToken,
    togglePermission, togglePermissionGroup, canEnablePermission, permissionGroupState, PermissionTree, createElement, renderToStaticMarkup } =
    await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const session = (permissions = [], role = 'custom') => ({ user: { id: 'qa', role }, role: { id: 'qa-role', name: role, label: 'QA' }, permissions });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test('35 permission names exactly match the API contract catalog; no role-name grants', async () => {
    const contract = await readFile(new URL('../docs/contracts/admin-rbac.md', import.meta.url), 'utf8');
    const catalog = [...contract.matchAll(/^\| ([a-z]+(?:-[a-z]+)+) \|/gm)].map((match) => match[1]);
    assert.deepEqual(Object.values(P).sort(), catalog.sort());
    assert.equal(Object.keys(P).length, 35);
    assert.equal(can(session([], 'superadmin'), P.MEMBER_CREATE), false);
    assert.equal(can(null, P.MEMBER_VIEW), false);
    assert.equal(can({ permissions: undefined }, P.MEMBER_VIEW), false);
    assert.equal(can(session(['*', 'unknown']), P.MEMBER_VIEW), false);
});
test('view-only, partial and empty sessions choose permitted landings and sections', () => {
    const s = session([P.EVENT_VIEW, P.EVENT_PARTICIPANT_VIEW]);
    assert.equal(can(s, P.EVENT_UPDATE), false);
    assert.equal(canAll(s, [P.EVENT_VIEW, P.EVENT_PARTICIPANT_VIEW]), true);
    assert.equal(canAll(s, [P.EVENT_VIEW, P.EVENT_CREATE]), false);
    assert.equal(canAny(s, [P.EVENT_CREATE, P.EVENT_VIEW]), true);
    assert.equal(landingRoute(s), R.events);
    assert.equal(landingRoute(session()), R.noAccess);
    assert.equal(landingRoute(session([P.SETTING_VIEW])), R.settings);
    assert.equal(landingRoute(session([P.ROLE_VIEW])), R.roles);
    assert.equal(canVisitSection(s, R.members), false);
    assert.equal(canVisitSection(s, R.events), true);
});
test('session cache deduplicates concurrent guards and expires at 60 seconds', async () => {
    let now = 0, calls = 0;
    const request = deferred();
    const cache = new SessionCache(() => { calls++; return request.promise; }, () => now);
    const a = cache.get(), b = cache.get(true);
    assert.equal(a, b);
    request.resolve(session([P.EVENT_VIEW]));
    await a; await cache.get();
    assert.equal(calls, 1);
    now = SESSION_MAX_AGE_MS;
    await cache.get();
    assert.equal(calls, 2);
});
test('logout/new login wins over an in-flight session response', async () => {
    for (const next of [null, session([P.MEMBER_VIEW])]) {
        const request = deferred();
        const cache = new SessionCache(() => request.promise);
        const pending = cache.get();
        cache.replace(next);
        request.resolve(session([P.EVENT_VIEW]));
        assert.equal(await pending, next);
        assert.equal(await cache.get(), next);
    }
});
test('network failure preserves cache and permits retry; forced refresh sees revoked grants', async () => {
    let fail = true;
    const old = session([P.EVENT_CREATE, P.EVENT_VIEW]);
    const current = session([P.EVENT_VIEW]);
    const cache = new SessionCache(async () => { if (fail) throw Error('offline'); return current; });
    cache.replace(old);
    await assert.rejects(cache.get(true), /offline/);
    assert.equal(await cache.get(), old);
    fail = false;
    assert.equal(await cache.get(true), current);
    assert.equal(can(await cache.get(), P.EVENT_CREATE), false);
});

// Axios adapters keep these checks deterministic: no server, credentials, or mutations.
const refusal = (config, status, data = {}) => Promise.reject(new AxiosError('refused', 'ERR_BAD_RESPONSE', config, null,
    { config, status, statusText: 'Refused', headers: {}, data }));
test('permission 403 (including CSV) does not refresh token, log out, or replay a mutation', async () => {
    for (const blob of [false, true]) {
        let requests = 0, denied = 0, unauthorized = 0, refreshes = 0;
        setToken({ accessToken: 'qa-old', expiresAt: '2099-01-01' });
        setPermissionDeniedHandler(() => denied++);
        setUnauthorizedHandler(() => unauthorized++);
        axios.defaults.adapter = async () => { refreshes++; throw Error('unexpected refresh'); };
        axiosClient.defaults.adapter = (config) => {
            requests++;
            const data = { code: 'permission_denied', message: 'Ditolak' };
            return refusal(config, 403, blob ? new Blob([JSON.stringify(data)]) : data);
        };
        await assert.rejects(axiosClient.post('/admin/events', {}));
        assert.deepEqual([requests, denied, unauthorized, refreshes], [1, 1, 0, 0]);
        assert.equal(currentToken().accessToken, 'qa-old');
    }
});
test('successful JWT refresh updates permission session and retries only once', async () => {
    let requests = 0, refreshes = 0, updated;
    setToken({ accessToken: 'qa-old', expiresAt: '2099-01-01' });
    setSessionUpdatedHandler((s) => { updated = s; });
    const next = session([P.EVENT_VIEW]);
    axios.defaults.adapter = async (config) => {
        refreshes++;
        return { config, status: 200, headers: {}, data: { data: { ...next, token: { accessToken: 'qa-new', expiresAt: '2099-01-01' } } } };
    };
    axiosClient.defaults.adapter = (config) => {
        requests++;
        return requests === 1 ? refusal(config, 401) : Promise.resolve({ config, status: 200, headers: {}, data: { data: {} } });
    };
    await axiosClient.get('/admin/events');
    assert.deepEqual([requests, refreshes], [2, 1]);
    assert.equal(currentToken().accessToken, 'qa-new');
    assert.deepEqual(updated, next);
});
test('offline/5xx refresh does not log out; terminal 401 does', async () => {
    for (const status of [undefined, 503, 401]) {
        let unauthorized = 0, requests = 0;
        setToken({ accessToken: 'qa-old', expiresAt: '2099-01-01' });
        setUnauthorizedHandler(() => unauthorized++);
        axiosClient.defaults.adapter = (config) => { requests++; return refusal(config, 401); };
        axios.defaults.adapter = (config) => status ? refusal(config, status) : Promise.reject(new AxiosError('offline'));
        await assert.rejects(axiosClient.get('/admin/events'));
        assert.equal(requests, 1);
        assert.equal(unauthorized, status === 401 ? 1 : 0);
        assert.equal(currentToken() === null, status === 401);
    }
});
test('late failed refresh cannot remove another login', async () => {
    const pending = deferred();
    setToken({ accessToken: 'qa-old', expiresAt: '2099-01-01' });
    let calls = 0;
    axiosClient.defaults.adapter = (config) => ++calls === 1 ? refusal(config, 401) : Promise.resolve({ config, status: 200, headers: {}, data: {} });
    axios.defaults.adapter = async (config) => { await pending.promise; return refusal(config, 401); };
    const request = axiosClient.get('/admin/events');
    // Let the first 401 enter the refresh adapter.
    await new Promise((resolve) => setTimeout(resolve, 0));
    setToken({ accessToken: 'qa-another', expiresAt: '2099-01-01' });
    pending.resolve();
    await request;
    assert.equal(currentToken().accessToken, 'qa-another');
    clearToken();
});

const treeCatalog = [
    { id: 'mv', name: 'member-view', label: 'Member View', group: 'Member', requires: [], isAssignable: true },
    { id: 'mc', name: 'member-create', label: 'Member Create', group: 'Member', requires: ['member-view'], isAssignable: true },
    { id: 'mu', name: 'member-update', label: 'Member Update', group: 'Member', requires: ['member-view'], isAssignable: true },
    { id: 'ev', name: 'event-view', label: 'Event View', group: 'Kegiatan', requires: [], isAssignable: true },
    { id: 'ec', name: 'event-create', label: 'Event Create', group: 'Kegiatan', requires: ['event-view'], isAssignable: true },
    { id: 'ed', name: 'event-duplicate', label: 'Event Duplicate', group: 'Kegiatan', requires: ['event-view', 'event-create'], isAssignable: true },
    { id: 'pv', name: 'event-participant-view', label: 'Event Participant View', group: 'Peserta Kegiatan', requires: ['event-view'], isAssignable: true },
    { id: 'pc', name: 'event-participant-create', label: 'Event Participant Create', group: 'Peserta Kegiatan', requires: ['event-participant-view'], isAssignable: true },
];
test('module parent switch enables every child and OFF removes those children', () => {
    const selected = togglePermissionGroup(treeCatalog, [], 'Member', true);
    assert.deepEqual([...selected].sort(), ['mc', 'mu', 'mv']);
    assert.deepEqual(permissionGroupState(treeCatalog, selected, 'Member'), {checked: true, partial: false, count: 3, total: 3, disabled: false});
    assert.deepEqual(togglePermissionGroup(treeCatalog, selected, 'Member', false), []);
});
test('child switch adds View, shows partial state, and View OFF removes dependent actions', () => {
    const selected = togglePermission(treeCatalog, [], 'mc', true);
    assert.deepEqual(selected, ['mv', 'mc']);
    assert.equal(permissionGroupState(treeCatalog, selected, 'Member').partial, true);
    assert.equal(permissionGroupState(treeCatalog, selected, 'Member').checked, false);
    assert.deepEqual(togglePermission(treeCatalog, selected, 'mv', false), []);
});
test('cross-module and transitive dependencies are included and cascading revocation stays consistent', () => {
    const selected = togglePermissionGroup(treeCatalog, [], 'Peserta Kegiatan', true);
    assert.deepEqual(selected, ['ev', 'pv', 'pc']);
    assert.deepEqual(togglePermission(treeCatalog, selected, 'ev', false), []);
    const duplicate = togglePermission(treeCatalog, [], 'ed', true);
    assert.deepEqual(duplicate, ['ev', 'ec', 'ed']);
    assert.deepEqual(togglePermission(treeCatalog, duplicate, 'ec', false), ['ev']);
});
test('unassignable children cannot be enabled by parent or dependencies and existing locked grants are not silently stripped', () => {
    const restricted = treeCatalog.map((p) => ({...p, isAssignable: p.id !== 'mu'}));
    assert.deepEqual(togglePermissionGroup(restricted, [], 'Member', true), ['mv', 'mc']);
    assert.deepEqual(togglePermission(restricted, [], 'mu', true), []);
    assert.deepEqual(togglePermission(restricted, ['mu'], 'mu', false), ['mu']);
    const noView = treeCatalog.map((p) => ({...p, isAssignable: p.id !== 'mv'}));
    assert.equal(canEnablePermission(noView, 'mc'), false);
    assert.deepEqual(togglePermission(noView, [], 'mc', true), []);
});
test('missing, unknown and cyclic catalog dependencies fail closed; input selections are immutable', () => {
    const initial = ['ev'];
    togglePermission(treeCatalog, initial, 'mc', true);
    assert.deepEqual(initial, ['ev']);
    assert.deepEqual(togglePermission(treeCatalog, [], 'unknown', true), []);
    assert.equal(canEnablePermission(treeCatalog.filter((p) => p.id !== 'mv'), 'mc'), false);
    const cycle = [{...treeCatalog[0], requires:['member-create']}, treeCatalog[1]];
    assert.equal(canEnablePermission(cycle, 'mc'), false);
});
test('enabling a legacy selection repairs missing transitive View dependencies without duplicate IDs', () => {
    const selected = togglePermission(treeCatalog, ['pv', 'pc'], 'pc', true);
    assert.deepEqual([...selected].sort(), ['ev', 'pc', 'pv']);
    assert.equal(new Set(selected).size, selected.length);
});
test('tree renders accessible nested checkboxes, partial state and disabled out-of-scope children', () => {
    const html = renderToStaticMarkup(createElement(PermissionTree, {
        catalog: treeCatalog.map((p) => ({...p, isAssignable: p.id !== 'mu'})), selected:['mv'], disabled:false,
        onToggle: () => {}, onToggleGroup: () => {},
    }));
    assert.equal((html.match(/role="checkbox"/g) ?? []).length, treeCatalog.length + 3);
    assert.match(html, /aria-checked="mixed"/);
    assert.match(html, /aria-label="Member View"/);
    assert.match(html, /<button[^>]*aria-label="Member Update"[^>]*disabled=""|<button[^>]*disabled=""[^>]*aria-label="Member Update"/);
    assert.match(html, /Di luar izin akun Anda/);
    const readonly = renderToStaticMarkup(createElement(PermissionTree, {catalog:treeCatalog, selected:[], disabled:true, onToggle:()=>{}, onToggleGroup:()=>{}}));
    assert.equal((readonly.match(/role="checkbox"[^>]*disabled=""|disabled=""[^>]*role="checkbox"/g) ?? []).length, treeCatalog.length + 3);
});
