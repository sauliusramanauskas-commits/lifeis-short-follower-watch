'use strict';
const assert = require('assert');
require('../assets/sessions.js');
const Api = require('../assets/api.js');
let n = 0;
const T = async (name, fn) => { await fn(); n++; console.log('ok - ' + name); };
const rej = async (p, code) => { try { await p; } catch (e) { assert.strictEqual(e.code, code, 'tikėtasi ' + code + ', gauta ' + e.code); return e; } assert.fail('tikėtasi klaidos ' + code); };
(async () => {
  Api.demo.setNow(() => Date.UTC(2026, 9, 29, 10, 0, 0)); Api.reset();
  const D = Api.demo;
  await T('ISO savaitės etiketė ir Vilniaus offset', () => {
    assert.strictEqual(D.isoWeekLabel(Date.UTC(2026, 10, 3, 10)), '2026-W45 (2026-11-02)');
    assert.strictEqual(D.localIso(Date.UTC(2026, 6, 1, 10, 0, 0)), '2026-07-01T13:00:00+03:00');
    assert.strictEqual(D.localIso(Date.UTC(2026, 11, 1, 10, 0, 0)), '2026-12-01T12:00:00+02:00');
  });
  await T('support: tickets, reports, user, billing be jautrių laukų', async () => {
    Api.setIdentity('support');
    const t = await Api.get('/api/admin/support/tickets?status=open');
    assert(t.tickets.length >= 4 && t.tickets[0].user_id);
    const u = await Api.get('/api/admin/users/' + t.tickets[0].user_id);
    const b = await Api.get('/api/admin/users/' + t.tickets[0].user_id + '/billing');
    const blob = JSON.stringify([u, b]);
    for (const bad of ['email', 'birth', 'orientation', 'gender', 'show_me', 'lat', 'lon', 'card', 'stripe', 'inv_']) assert(!blob.toLowerCase().includes(bad), 'nutekėjo: ' + bad);
  });
  await T('support negali: audit-log, worktime, refund decision, user delete, chat (403 + support_denied)', async () => {
    Api.setIdentity('support');
    await rej(Api.get('/api/admin/audit-log'), 'forbidden');
    await rej(Api.get('/api/admin/worktime'), 'forbidden');
    await rej(Api.post('/api/admin/refunds/x/decision', { decision: 'approve' }), 'forbidden');
    await rej(Api.del('/api/admin/users/' + 'x', { confirm: 'DELETE' }), 'forbidden');
    await rej(Api.get('/api/conversations'), 'forbidden');
    await rej(Api.post('/api/admin/actions', { action: 'ban', target_user: 'x', reason_text: 'x'.repeat(20), ground_type: 'tos', ground: 'abc' }), 'not_found');
    Api.setIdentity('admin');
    const log = await Api.get('/api/admin/audit-log');
    assert(log.entries.filter((e) => e.action === 'support_denied').length >= 5);
  });
  await T('support: ban/restore uždrausta, suspend <= 30 d.', async () => {
    Api.setIdentity('support');
    const rep = (await Api.get('/api/admin/reports')).reports.find((r) => r.target_type === 'user');
    const base = { report_id: rep.id, reason_text: 'Pakartotinai siuntė sukčiavimo žinutes (žr. skundą).', ground_type: 'tos', ground: 'BS 4.2' };
    await rej(Api.post('/api/admin/actions', Object.assign({ action: 'ban' }, base)), 'forbidden');
    await rej(Api.post('/api/admin/actions', Object.assign({ action: 'suspend', suspend_days: 31 }, base)), 'forbidden');
    await rej(Api.post('/api/admin/actions', Object.assign({ action: 'suspend', suspend_days: 7 }, base, { reason_text: 'per trumpa' })), 'invalid_request');
    const ok = await Api.post('/api/admin/actions', Object.assign({ action: 'suspend', suspend_days: 30 }, base));
    assert.strictEqual(ok.action, 'suspend'); assert(ok.suspend_until);
    assert.strictEqual((await Api.get('/api/admin/users/' + rep.target_user_id)).suspended_until, ok.suspend_until);
  });
  await T('refund: support tik prašo; admin sprendžia; dublikatas -> conflict', async () => {
    Api.setIdentity('support');
    const uid = '01K9US' + '5'.padStart(20, '0'); // Aistė (turi apmokėjimą, bet ne atvirą prašymą)
    await rej(Api.post('/api/admin/refunds', { user_id: uid, reason: 'trumpa' }), 'invalid_request');
    await rej(Api.post('/api/admin/refunds', { user_id: uid, reason: 'Vartotojas nepasinaudojo paslauga.', amount_cents: 99999 }), 'invalid_request');
    const r = await Api.post('/api/admin/refunds', { user_id: uid, reason: 'Vartotojas nepasinaudojo paslauga.' });
    assert.strictEqual(r.state, 'requested');
    await rej(Api.post('/api/admin/refunds', { user_id: uid, reason: 'Vartotojas nepasinaudojo paslauga.' }), 'conflict');
    Api.setIdentity('admin');
    const d = await Api.post('/api/admin/refunds/' + r.id + '/decision', { decision: 'approve', note: 'ok' });
    assert.strictEqual(d.state, 'processed');
    await rej(Api.post('/api/admin/refunds/' + r.id + '/decision', { decision: 'reject' }), 'conflict');
  });
  await T('heartbeat: 12/min riba -> 429 ir neįrašoma', async () => {
    Api.setIdentity('support'); let t = Date.UTC(2026, 9, 29, 10, 30, 0); Api.demo.setNow(() => t);
    for (let i = 0; i < 12; i++) { t += 1000; assert.strictEqual((await Api.post('/api/admin/heartbeat')).ok, true); }
    await rej(Api.post('/api/admin/heartbeat'), 'rate_limited');
    t += 61000; assert.strictEqual((await Api.post('/api/admin/heartbeat')).idle_timeout_min, 5);
  });
  await T('worktime: dienos/savaitės/mėnesio grupavimas, sesija per vidurnaktį dalijama', async () => {
    Api.setIdentity('admin');
    const day = await Api.get('/api/admin/worktime?from=2026-10-01&to=2026-10-28&group=day');
    const wk = await Api.get('/api/admin/worktime?from=2026-10-01&to=2026-10-28&group=week');
    const mo = await Api.get('/api/admin/worktime?from=2026-10-01&to=2026-10-28&group=month');
    assert.strictEqual(day.timezone, 'Europe/Vilnius');
    assert(/^2026-10-\d\d$/.test(day.periods[0].period) && /^2026-W\d\d \(2026-\d\d-\d\d\)$/.test(wk.periods[0].period) && mo.periods.every((p) => p.period === '2026-10'));
    const sum = (r) => r.periods.reduce((a, p) => a + p.minutes, 0);
    assert(Math.abs(sum(day) - sum(wk)) < 0.5 && Math.abs(sum(day) - sum(mo)) < 0.5 && Math.abs(sum(day) - day.total_minutes) < 0.5);
    const cross = day.sessions.find((s) => s.start.slice(0, 10) !== s.end.slice(0, 10));
    assert(cross, 'nėra sesijos per vidurnaktį');
    const csv = await Api.request('GET', '/api/admin/worktime.csv?from=2026-10-01&to=2026-10-28&rows=summary');
    assert(csv.data.startsWith('period,staff_id,minutes,sessions,actions,tickets_handled,reports_handled\r\n'));
    assert(/attachment; filename="worktime_2026-10-01_2026-10-28_summary\.csv"/.test(csv.headers['content-disposition']));
    await rej(Api.get('/api/admin/worktime?from=2024-01-01&to=2026-10-28'), 'invalid_request');
  });
  await T('worktime/live: working kai paskutinis veiksmas <= 5 min', async () => {
    Api.setIdentity('support'); const t0 = Date.UTC(2026, 9, 29, 12, 0, 0); Api.demo.setNow(() => t0);
    await Api.post('/api/admin/heartbeat'); Api.setIdentity('admin');
    const sid = Api.demo.staff.support.id, st = (r) => r.staff.find((x) => x.staff_id === sid).status;
    Api.demo.setNow(() => t0 + 4 * 60000); assert.strictEqual(st(await Api.get('/api/admin/worktime/live')), 'working');
    Api.demo.setNow(() => t0 + 5 * 60000 + 1000); assert.strictEqual(st(await Api.get('/api/admin/worktime/live')), 'idle');
  });
  console.log('api.test.js: ' + n + ' testai praėjo');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
