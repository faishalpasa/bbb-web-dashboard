import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const bundle = await build({
    stdin: {
        contents: `export * from './src/utils/whatsapp'; export * from './src/constants/phone-countries'; export { formatWhatsapp } from './src/utils/string';
`,
        resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'esm',
    alias: { '@': './src' },
});
const w = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

test('Indonesian numbers keep working as before, typed local, with 62 or with +62', () => {
    assert.equal(w.composeWhatsapp('ID', '0812-3456-7890'), '6281234567890');
    assert.equal(w.composeWhatsapp('ID', '81234567890'), '6281234567890');
    assert.equal(w.composeWhatsapp('ID', '6281234567890'), '6281234567890');
    assert.equal(w.composeWhatsapp('ID', '+62 812 3456 7890'), '6281234567890');
});

test('another country gets its own code, without the local trunk zero', () => {
    assert.equal(w.composeWhatsapp('DE', '0177 8162 1395'), '4917781621395');
    assert.equal(w.composeWhatsapp('DE', '177 8162 1395'), '4917781621395');
    assert.equal(w.composeWhatsapp('SG', '9123 4567'), '6591234567');
    assert.equal(w.composeWhatsapp('US', '(415) 555-2671'), '14155552671');
});

test('a number typed with its own code ignores the chosen country', () => {
    assert.equal(w.composeWhatsapp('ID', '+49 177 8162 1395'), '4917781621395');
    assert.equal(w.composeWhatsapp('ID', '0049 177 8162 1395'), '4917781621395');
});

test('empty input stays empty so the required message shows', () => {
    assert.equal(w.composeWhatsapp('ID', ''), '');
    assert.equal(w.composeWhatsapp('DE', '  '), '');
});

test('validation: Indonesian mobile only, other countries 8 to 15 digits, never an Indonesian non-mobile', () => {
    for (const ok of ['6281234567890', '4917781621395', '14155552671', '6591234567']) assert.equal(w.isValidWhatsapp(ok), true, ok);
    for (const bad of ['622155512345', '62812345', '1234567', '1234567890123456', '0123456789', '49177abc1234', ''])
        assert.equal(w.isValidWhatsapp(bad), false, bad);
});

test('a stored number splits back into country and number, longest code first', () => {
    assert.deepEqual(w.splitWhatsapp('6281234567890'), { iso: 'ID', national: '81234567890' });
    assert.deepEqual(w.splitWhatsapp('4917781621395'), { iso: 'DE', national: '17781621395' });
    assert.deepEqual(w.splitWhatsapp('14155552671'), { iso: 'US', national: '4155552671' });
    assert.deepEqual(w.splitWhatsapp('8801712345678'), { iso: 'BD', national: '1712345678' });
    assert.deepEqual(w.splitWhatsapp('081234567890'), { iso: 'ID', national: '81234567890' });
    assert.deepEqual(w.splitWhatsapp(''), { iso: 'ID', national: '' });
});

test('opening a stored number and saving it again changes nothing, with no extra 0 in front', () => {
    for (const stored of ['6281234567890', '6285877643194', '4917781621395', '14155552671', '8801712345678', '60123456789']) {
        const { iso, national } = w.splitWhatsapp(stored);
        assert.doesNotMatch(national, /^0/, stored);
        assert.equal(w.composeWhatsapp(iso, national), stored);
    }
});

test('every country has a unique entry, an Indonesian name and a flag; Indonesia is listed first', () => {
    const options = w.phoneCountryOptions();
    assert.equal(options[0].iso, 'ID');
    assert.equal(new Set(options.map((option) => option.iso)).size, options.length);
    assert.equal(options.find((option) => option.iso === 'DE').name, 'Jerman');
    assert.equal(w.flagOf('ID'), '🇮🇩');
    for (const option of options) assert.match(option.dial, /^[1-9]\d{0,2}$/);
});

test('the table shows an Indonesian number as 0812-… and another country with its code', () => {
    assert.equal(w.formatWhatsapp('6281234567890'), '0812-3456-7890');
    assert.equal(w.formatWhatsapp('4917781621395'), '+49 17781621395');
    assert.equal(w.formatWhatsapp('14155552671'), '+1 4155552671');
});
