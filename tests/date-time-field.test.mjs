import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundle = await build({
    stdin: { contents: `export { TIME_OPTIONS, dateToValue, valueToDate, splitDateTime } from './src/components/molecules/date-time-field';`, resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'browser', format: 'esm',
});
const { TIME_OPTIONS, dateToValue, valueToDate, splitDateTime } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

test('time options run from 00:00 to 23:30 in 30-minute steps', () => {
    assert.equal(TIME_OPTIONS.length, 48);
    assert.equal(TIME_OPTIONS[0], '00:00');
    assert.equal(TIME_OPTIONS[1], '00:30');
    assert.equal(TIME_OPTIONS.at(-1), '23:30');
    assert.ok(TIME_OPTIONS.every((time) => /^([01]\d|2[0-3]):(00|30)$/.test(time)));
});

test('a date round-trips through the calendar without drifting a day', () => {
    for (const value of ['2026-10-31', '2026-01-01', '2026-12-31', '2028-02-29']) {
        assert.equal(dateToValue(valueToDate(value)), value);
    }
    assert.equal(valueToDate(''), undefined);
    assert.equal(valueToDate('31/10/2026'), undefined);
});

test('the stored wall-clock value splits into date and time, and tolerates an empty or off-grid one', () => {
    assert.deepEqual(splitDateTime('2026-10-31T23:59'), { date: '2026-10-31', time: '23:59' });
    assert.deepEqual(splitDateTime('2026-10-31T09:00'), { date: '2026-10-31', time: '09:00' });
    assert.deepEqual(splitDateTime(''), { date: '', time: '' });
});
