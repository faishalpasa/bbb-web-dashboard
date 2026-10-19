import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({
    stdin: { contents: `export * from './src/utils/registration-form'; export * from './src/constants/registration-form';
        export * from './src/components/molecules/registration-form-builder'; export * from './src/components/molecules/registration-form-preview';
        export { createElement } from 'react'; export { renderToStaticMarkup } from 'react-dom/server';`, resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'browser', format: 'esm',
});
const {
    cloneRegistrationDefinition, reorderRegistrationFields, registrationPayload, validateRegistrationDefinition,
    registrationServerErrors, newRegistrationField, REGISTRATION_FORM_LIMITS: LIMITS,
    RegistrationFormBuilder, RegistrationFormPreview, createElement, renderToStaticMarkup,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

const field = (id, type = 'input') => ({ id, type, label: `Pertanyaan ${id}`, required: false,
    options: type === 'select' || type === 'radio' ? [{ id: `opt-${id}`, label: 'Pilihan A' }] : [] });
const definition = () => ({ version: 3, fields: [field('a'), field('b', 'radio'), field('c', 'textarea')] });
const builder = (extra = {}) => ({ definition: definition(), errors: {}, available: true, lockedAt: null, readOnly: false, requiresReload: false,
    addField() {}, removeField() {}, updateField() {}, setType() {}, addOption() {}, updateOption() {}, removeOption() {}, reorder() {}, ...extra });
const markup = (props = {}) => renderToStaticMarkup(createElement(RegistrationFormBuilder, { builder: builder(), ...props }));
const buttons = (html) => [...html.matchAll(/<button\b[^>]*>/g)].map(([tag]) => tag);

test('limits match the approved API constraints and new questions remain optional', () => {
    assert.deepEqual(LIMITS, { fields: 30, label: 255, input: 255, textarea: 5000, options: 50 });
    const input = newRegistrationField();
    assert.match(input.id, /^[0-9a-f-]{36}$/);
    assert.equal(input.required, false);
    assert.deepEqual(input.options, []);
});

test('drag reorder moves question IDs together with type, required flag and choice IDs without mutation', () => {
    const source = definition();
    source.fields[1].required = true;
    const before = JSON.stringify(source);
    const next = reorderRegistrationFields(source.fields, 'b', 'a');
    assert.deepEqual(next.map((item) => item.id), ['b', 'a', 'c']);
    assert.equal(next[0].required, true);
    assert.equal(next[0].options[0].id, 'opt-b');
    assert.equal(JSON.stringify(source), before);
    assert.deepEqual(reorderRegistrationFields(next, 'b', 'c').map((item) => item.id), ['a', 'c', 'b']);
});

test('cancelled or foreign drag targets and same-position drops do not change order', () => {
    const items = definition().fields;
    for (const [from, to] of [['unknown', 'a'], ['a', 'unknown'], ['b', 'b']]) {
        assert.equal(reorderRegistrationFields(items, from, to), items);
    }
});

test('payload trims labels preserves exact version and IDs and never sends presentation lockedAt', () => {
    const source = { ...definition(), lockedAt: '2026-10-19T00:00:00Z' };
    source.fields[1].label = '  Buku  ';
    source.fields[1].options[0].label = '  Fiksi  ';
    source.fields[0].options = [{ id: 'stale', label: 'Not an Input option' }];
    const next = registrationPayload(source);
    assert.deepEqual(Object.keys(next), ['version', 'fields']);
    assert.equal(next.version, 3);
    assert.equal(next.fields[1].id, 'b');
    assert.equal(next.fields[1].options[0].label, 'Fiksi');
    assert.deepEqual(next.fields[0].options, []);
    assert.equal(source.fields[1].label, '  Buku  ');
});

test('clone detaches field and choice objects from the loaded event', () => {
    const source = definition();
    const copy = cloneRegistrationDefinition(source);
    copy.fields[1].options[0].label = 'Changed';
    copy.fields.reverse();
    assert.equal(source.fields[1].options[0].label, 'Pilihan A');
    assert.equal(source.fields[0].id, 'a');
});

test('empty custom forms are valid but configured blank questions and choices are not', () => {
    assert.deepEqual(validateRegistrationDefinition({ version: 1, fields: [] }), {});
    const form = definition();
    form.fields[0].label = '  ';
    form.fields[1].options[0].label = '';
    const errors = validateRegistrationDefinition(form);
    assert.equal(errors['field.a.label'], 'Label pertanyaan harus diisi.');
    assert.equal(errors['option.opt-b.label'], 'Label pilihan harus diisi.');
    form.fields[1].options = [];
    assert.equal(validateRegistrationDefinition(form)['field.b.options'], 'Tambahkan minimal satu pilihan.');
});

test('boundary limits accept 30 fields and 50 choices; overflowing content has stable field errors', () => {
    const form = { version: 1, fields: Array.from({ length: 30 }, (_, i) => field(String(i))) };
    form.fields[0].label = 'a'.repeat(255);
    form.fields[1].type = 'select';
    form.fields[1].options = Array.from({ length: 50 }, (_, i) => ({ id: `o-${i}`, label: 'a'.repeat(255) }));
    assert.deepEqual(validateRegistrationDefinition(form), {});
    form.fields.push(field('31'));
    form.fields[0].label += 'a';
    form.fields[1].options.push({ id: 'overflow', label: 'a'.repeat(256) });
    const errors = validateRegistrationDefinition(form);
    assert.ok(errors.form);
    assert.ok(errors['field.0.label']);
    assert.ok(errors['field.1.options']);
    assert.ok(errors['option.overflow.label']);
});

test('server array-index errors bind to submitted IDs rather than the current reordered draft', () => {
    const submitted = definition();
    const current = reorderRegistrationFields(submitted.fields, 'b', 'a');
    const errors = registrationServerErrors({
        'registrationForm.fields.1.label': ['Label salah'],
        'registrationForm.fields.1.options.0.label': ['Pilihan salah'],
        'registrationForm.fields.1.options.0.id': ['ID pilihan salah'],
        'registrationForm.version': ['Muat ulang'],
        title: ['Judul salah'],
    }, submitted);
    assert.equal(current[0].id, 'b');
    assert.equal(errors['field.b.label'], 'Label salah');
    assert.equal(errors['option.opt-b.label'], 'Pilihan salah');
    assert.equal(errors['option.opt-b.id'], 'ID pilihan salah');
    assert.equal(errors.form, 'Muat ulang');
    assert.equal(Object.keys(errors).length, 4);
});

test('system Name and Email remain pinned outside the sortable questions with no destructive controls', () => {
    const html = markup();
    assert.ok(html.includes('registration_system_name'));
    assert.ok(html.includes('registration_system_email'));
    assert.ok(html.indexOf('registration_system_email') < html.indexOf('registration_drag_a'));
    const handles = buttons(html).filter((tag) => tag.includes('registration_drag_'));
    assert.equal(handles.length, 3);
    assert.ok(handles.every((tag) => tag.includes('type="button"')));
    assert.ok(!html.includes('registration_remove_name'));
    assert.ok(html.includes('aria-label="Geser pertanyaan 1"'));
});

test('locked and saving states disable drag handles, editing and add/delete controls', () => {
    for (const props of [{ builder: builder({ lockedAt: '2026-10-19T00:00:00Z', readOnly: true }) }, { disabled: true }]) {
        const html = markup(props);
        const controls = buttons(html).filter((tag) => /registration_(drag_|up_|down_|remove_|add_)/.test(tag));
        assert.ok(controls.length > 0);
        assert.ok(controls.every((tag) => tag.includes('disabled=""')));
    }
    assert.ok(markup({ builder: builder({ lockedAt: '2026-10-19T00:00:00Z', readOnly: true }) }).includes('registration_form_locked'));
});

test('conflict and legacy API states explain read-only behavior and provide explicit reload instead of automatic retry', () => {
    const conflict = markup({ builder: builder({ readOnly: true, requiresReload: true, errors: { form: 'Form sudah berubah.' } }) });
    assert.ok(conflict.includes('registration_form_reload'));
    assert.ok(conflict.includes('perubahan lokal di halaman ini akan dibuang'));
    assert.ok(conflict.includes('Form sudah berubah.'));
    const legacy = markup({ builder: builder({ available: false, readOnly: true }) });
    assert.ok(legacy.includes('registration_form_unavailable'));
});

test('preview renders all four types read-only and escapes question and option copy', () => {
    const form = { version: 1, fields: ['input', 'textarea', 'select', 'radio'].map((type) => field(type, type)) };
    form.fields[0].label = '<img src=x onerror=alert(1)>';
    form.fields[2].options[0].label = '<script>alert(1)</script>';
    const html = renderToStaticMarkup(createElement(RegistrationFormPreview, { definition: form }));
    assert.ok(html.includes('<fieldset disabled=""'));
    assert.ok(html.includes('<textarea'));
    assert.ok(html.includes('<select'));
    assert.ok(html.includes('type="radio"'));
    assert.ok(html.includes('&lt;img'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
});
