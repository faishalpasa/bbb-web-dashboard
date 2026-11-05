import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { build } from 'esbuild';

// Run the real bridge with a minimal hook scheduler and notifier spy; no backend/DOM writes.
const bundle = await build({
    entryPoints: ['src/components/molecules/feedback-toast.tsx'],
    bundle: true, write: false, format: 'esm', platform: 'browser',
    plugins: [{ name: 'feedback-spies', setup(builder) {
        builder.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'spy' }));
        builder.onResolve({ filter: /^@\/components\/ui\/toast$/ }, () => ({ path: 'notifier', namespace: 'spy' }));
        builder.onLoad({ filter: /.*/, namespace: 'spy' }, ({ path }) => ({ contents: path === 'hooks' ? `
            export const useRef = initial => { const state = globalThis.__feedbackTest; const slot = state.cursor++; return state.refs[slot] ??= { current: initial }; };
            export const useEffect = (effect, deps) => {
                const state = globalThis.__feedbackTest;
                const changed = !state.deps || deps.some((d, i) => !Object.is(d, state.deps[i]));
                state.deps = deps;
                if (changed || state.strictReplay) state.effects.push(effect);
            };` : `export const toast = {
                add: options => { globalThis.__feedbackTest.added.push(options); return 'toast-' + globalThis.__feedbackTest.added.length; },
                close: id => globalThis.__feedbackTest.closed.push(id)
            };` }));
    } }],
});

const reset = () => (globalThis.__feedbackTest = { cursor: 0, refs: [], effects: [], added: [], closed: [], strictReplay: false });
reset();
const { FeedbackToast } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const render = (message, revision, tone = 'error') => {
    const s = globalThis.__feedbackTest;
    s.cursor = 0;
    const count = s.added.length;
    assert.equal(FeedbackToast({ children: message, revision, tone, 'data-test-id': 'qa_feedback' }), null);
    // React's render must remain side-effect free.
    const pending = s.effects.splice(0);
    assert.equal(s.added.length, count);
    pending.forEach(effect => effect());
};

test('backend error is emitted only after commit, plain text and high priority', () => {
    const s = reset();
    render('<script>untrusted response</script>');
    assert.equal(s.added.length, 1);
    assert.equal(s.added[0].title, '<script>untrusted response</script>');
    assert.equal(s.added[0].type, 'error');
    assert.equal(s.added[0].priority, 'high');
});

test('rerender and strict-effect replay do not duplicate a notice', () => {
    const s = reset(), notice = {};
    render('Tersalin', notice, 'success');
    render('Tersalin', notice, 'success');
    s.strictReplay = true;
    render('Tersalin', notice, 'success');
    assert.equal(s.added.length, 1);
});

test('copying again replays identical success with a new notice revision', () => {
    const s = reset();
    render('Tersalin', {}, 'success');
    render('Tersalin', {}, 'success');
    assert.equal(s.added.length, 2);
    assert.deepEqual(s.closed, ['toast-1']);
});

test('cleared state allows retrying the same error and empty messages are ignored', () => {
    const s = reset();
    render(null);
    render('Gagal');
    render(null);
    render('Gagal');
    assert.equal(s.added.length, 2);
});

test('tone changes replay feedback; toast remains across page unmount/navigation', () => {
    const s = reset();
    render('Selesai', undefined, 'success');
    render('Selesai');
    assert.equal(s.added.length, 2);
    assert.equal(s.effects.length, 0);
});

test('global toaster mounts once outside router; dark bottom-center clears mobile safe area', async () => {
    const main = await readFile('src/main.tsx', 'utf8');
    const ui = await readFile('src/components/ui/toast.tsx', 'utf8');
    assert.equal(main.match(/<Toaster\s*\/>/g)?.length, 1);
    assert.match(ui, /inset-x-4 bottom-\[calc\(env\(safe-area-inset-bottom,0px\)\+1rem\)\]/);
    assert.match(ui, /z-\[100\]/);
    assert.match(ui, /bg-toast text-toast-foreground/);
    assert.match(ui, /size-11/);
    assert.doesNotMatch(ui, /dangerouslySetInnerHTML/);
});

test('toast interactions do not dismiss either desktop dialogs or mobile sheets', async () => {
    const dialog = await readFile('src/components/molecules/dialog.tsx', 'utf8');
    assert.match(dialog, /closest\('\[data-slot="toast-viewport"\]'\).*event.preventDefault\(\)/);
    assert.equal(dialog.match(/onInteractOutside=\{keepDialogForToast\}/g)?.length, 2);
});

test('attendance success belongs only to the mutation, not list loading', async () => {
    const source = await readFile('src/pages/admin/events/[id]/_context.tsx', 'utf8');
    const toggle = source.slice(source.indexOf('const toggleAttendance'), source.indexOf('const copyText'));
    assert.match(toggle, /putParticipantAttendance[\s\S]*Kehadiran peserta diperbarui/);
    assert.doesNotMatch(source.slice(0, source.indexOf('const toggleAttendance')), /Kehadiran peserta diperbarui/);
});
