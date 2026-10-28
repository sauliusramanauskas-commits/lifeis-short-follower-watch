'use strict';
const assert = require('assert');
const { computeSessions } = require('../assets/sessions.js');
const MIN = 60000, T0 = Date.UTC(2026, 9, 29, 8, 0, 0);
let n = 0;
function t(name, fn) { fn(); n++; console.log('ok - ' + name); }

t('tuščias sąrašas -> nėra sesijų', () => assert.deepStrictEqual(computeSessions([]), []));
t('vienas veiksmas -> sesija, trunkanti 0', () => {
  const s = computeSessions([T0]);
  assert.strictEqual(s.length, 1); assert.strictEqual(s[0].ms, 0); assert.strictEqual(s[0].action_count, 1);
});
t('veiksmai kas <=5 min -> viena sesija', () => {
  const s = computeSessions([T0, T0 + 2 * MIN, T0 + 6 * MIN, T0 + 11 * MIN]);
  assert.strictEqual(s.length, 1); assert.strictEqual(s[0].minutes, 11); assert.strictEqual(s[0].action_count, 4);
});
t('lygiai 5:00 tęsia, 5:00.001 skiria', () => {
  assert.strictEqual(computeSessions([T0, T0 + 5 * MIN]).length, 1);
  assert.strictEqual(computeSessions([T0, T0 + 5 * MIN + 1]).length, 2);
});
t('ilgesnė pauzė: sesija baigiasi paskutiniu veiksmu, prastova neskaičiuojama', () => {
  const s = computeSessions([T0, T0 + 3 * MIN, T0 + 3 * MIN + 6 * MIN + 1, T0 + 20 * MIN]);
  assert.strictEqual(s.length, 3);
  assert.strictEqual(s[0].minutes, 3); assert.strictEqual(s[1].ms, 0);
});
t('pavyzdys: 08:00, 08:04, 08:20, 08:22 -> 4 min + 2 min = 6 min', () => {
  const s = computeSessions([T0, T0 + 4 * MIN, T0 + 20 * MIN, T0 + 22 * MIN]);
  assert.strictEqual(s.length, 2);
  assert.strictEqual(s[0].end, T0 + 4 * MIN); assert.strictEqual(s[1].start, T0 + 20 * MIN);
  assert.strictEqual(s.reduce((a, x) => a + x.minutes, 0), 6);
});
t('nerūšiuoti įvesties duomenys, ISO eilutės, objektai ir Date', () => {
  const s = computeSessions([{ at: new Date(T0 + 2 * MIN).toISOString() }, new Date(T0), T0 + 1 * MIN]);
  assert.strictEqual(s.length, 1); assert.strictEqual(s[0].minutes, 2);
});
t('pritaikomas kitas idleMs; įvestis nekeičiama', () => {
  const ev = [T0 + 3 * MIN, T0];
  assert.strictEqual(computeSessions(ev, 2 * MIN).length, 2);
  assert.deepStrictEqual(ev, [T0 + 3 * MIN, T0]);
});
console.log('sessions.test.js: ' + n + ' testai praėjo');
