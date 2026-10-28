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
  await T('API.md „Helpdesk response shapes“: klaida, heartbeat, actions, evidence, reports, refunds, sessions', async () => {
    Api.demo.setNow(() => Date.UTC(2026, 9, 29, 14, 0, 0)); Api.reset(); Api.setIdentity('support');
    // klaidų kūnas ir Retry-After
    const e404 = await rej(Api.get('/api/admin/support/tickets/nera'), 'not_found');
    assert.deepStrictEqual(Object.keys(e404.body), ['error']); assert.deepStrictEqual(Object.keys(e404.body.error).sort(), ['code', 'message']);
    let t = Date.UTC(2026, 9, 29, 14, 0, 0); Api.demo.setNow(() => t);
    for (let i = 0; i < 12; i++) { t += 1000; const hb = await Api.post('/api/admin/heartbeat'); assert.deepStrictEqual(Object.keys(hb).sort(), ['idle_timeout_min', 'ok', 'server_time']); }
    const e429 = await rej(Api.post('/api/admin/heartbeat'), 'rate_limited');
    assert.strictEqual(e429.status, 429); assert(Number(e429.headers['retry-after']) > 0); assert.deepStrictEqual(Object.keys(e429.body.error).sort(), ['code', 'message']);
    t += 61000;
    // reports: sąrašas su target_display_name, evidence trys formos
    const list = (await Api.get('/api/admin/reports?status=all')).reports;
    assert(list.every((r) => 'target_display_name' in r) && list.some((r) => typeof r.target_display_name === 'string'));
    const full = async (type, pred) => Api.get('/api/admin/reports/' + list.find((r) => r.target_type === type && (!pred || pred(r))).id);
    assert.strictEqual((await full('user')).evidence, null);
    const m = (await full('message')).evidence;
    assert(Array.isArray(m) && m.length >= 1 && m.length <= 5);
    m.forEach((x) => assert.deepStrictEqual(Object.keys(x).sort(), ['at', 'body', 'kind', 'sender', 'seq']));
    const ph = (await full('photo', (r) => r.status === 'open')).evidence;
    assert.deepStrictEqual(Object.keys(ph).sort(), ['mime', 'note', 'photo_id', 'sha256', 'size_bytes', 'status', 'uploaded_at']);
    // actions: 201 ir forma; support riba 30 d.
    const rep = list.find((r) => r.target_type === 'user' && r.status === 'open');
    const a = await Api.request('POST', '/api/admin/actions', { action: 'suspend', report_id: rep.id, suspend_days: 7, reason_text: 'Pakartotiniai apgaulės bandymai pagal skundą.', ground_type: 'tos', ground: 'Taisyklių 4.2 p.' });
    assert.strictEqual(a.status, 201);
    assert.deepStrictEqual(Object.keys(a.data).sort(), ['action', 'appeal_status', 'created_at', 'id', 'statement_of_reasons', 'suspend_until']);
    assert.deepStrictEqual(Object.keys(a.data.statement_of_reasons).sort(), ['automated_decision', 'facts_and_circumstances', 'ground', 'ground_type', 'redress']);
    await rej(Api.post('/api/admin/actions', { action: 'suspend', target_user: list[0].target_user_id, suspend_days: 31, reason_text: 'Per ilgas laikotarpis, bandymas.', ground_type: 'tos', ground: 'Taisyklės' }), 'forbidden');
    // refunds requested_by
    const mine = (await Api.get('/api/admin/refunds?state=all&requested_by=' + Api.demo.staff.support.id)).refunds;
    assert(mine.length >= 1 && mine.every((r) => r.requested_by === Api.demo.staff.support.id));
    assert((await Api.get('/api/admin/refunds?state=all')).refunds.length > mine.length);
    // sesijos: id, start/end (Vilnius), *_utc
    Api.setIdentity('admin');
    const w = await Api.get('/api/admin/worktime?from=2026-10-01&to=2026-10-28');
    const s0 = w.sessions[0];
    assert.deepStrictEqual(Object.keys(s0).sort(), ['action_count', 'end', 'end_utc', 'id', 'minutes', 'role', 'staff_id', 'start', 'start_utc']);
    assert(/[+-]\d\d:\d\d$/.test(s0.start) && /Z$/.test(s0.start_utc) && Date.parse(s0.start) === Date.parse(s0.start_utc));
  });
  await T('darbo laikrodis: /api/admin/worktime* NEskaičiuojamas, kitos /api/admin/* skaičiuojamos', async () => {
    Api.demo.setNow(() => Date.UTC(2026, 9, 29, 16, 0, 0)); Api.reset();
    const sid = Api.demo.staff.support.id, live = async () => { Api.setIdentity('admin'); return (await Api.get('/api/admin/worktime/live')).staff.find((x) => x.staff_id === sid); };
    const t0 = Date.UTC(2026, 9, 29, 16, 0, 0), before = await live();
    Api.demo.setNow(() => t0 + 10 * 60000); // admin skaito ataskaitas: support aktyvumo nekeičia
    await Api.get('/api/admin/worktime?from=2026-10-01&to=2026-10-28'); await Api.request('GET', '/api/admin/worktime.csv?from=2026-10-01&to=2026-10-28');
    const after = await live(); assert.strictEqual(after.last_activity_at, before.last_activity_at); assert.strictEqual(after.status, 'idle');
    const adm = (await Api.get('/api/admin/worktime/live')).staff.find((x) => x.staff_id === Api.demo.staff.admin.id);
    assert(!adm || adm.last_activity_at !== new Date(t0 + 10 * 60000).toISOString(), 'worktime* užklausos pateko į aktyvumą');
    Api.setIdentity('support'); await Api.get('/api/admin/support/tickets'); // paprasta /api/admin/* užklausa
    assert.strictEqual((await live()).status, 'working');
  });
  console.log('api.test.js: ' + n + ' testai praėjo');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
