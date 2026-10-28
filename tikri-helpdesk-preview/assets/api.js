/*
 * Tikri pagalbos tarnyba - DUOMENŲ PRIEIGA (vienintelis modulis, kuris "kalba" su serveriu).
 *
 * DEMO: vietoj tikro serverio čia veikia netikras backend'as, laikomas localStorage (arba atmintyje).
 * Visi keliai ir laukų pavadinimai sutampa su /workspace/dating-app/server/API.md, todėl vėliau
 * pakanka pakeisti `request()` vidų į fetch(API_BASE + path, { headers: { Authorization: 'Bearer ...' } }).
 *
 * Naudojimas:
 *   TikriApi.setIdentity('support' | 'admin');
 *   const r = await TikriApi.get('/api/admin/support/tickets?status=open');
 *   await TikriApi.post('/api/admin/heartbeat');
 * Klaidos: išmetamas ApiError { status, code, message } (code pagal API.md lentelę).
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TikriApi = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var Sessions = root.TikriSessions || (typeof require === 'function' ? require('./sessions.js') : null);

  // ------------------------------------------------------------------ konfigūracija (kaip serverio env)
  var TZ = 'Europe/Vilnius';
  var STORE_KEY = 'tikri_helpdesk_demo_v1';
  var CFG = { IDLE_TIMEOUT_MIN: 5, HEARTBEATS_PER_MINUTE: 12, SUPPORT_MAX_SUSPEND_DAYS: 30, latencyMs: typeof window !== 'undefined' ? 40 : 0 };
  var DAY = 86400000, MIN = 60000;
  var nowFn = function () { return Date.now(); };

  // ------------------------------------------------------------------ identitetai (demo; tikrame serveryje - JWT app_metadata.role)
  var pad = function (n, w) { return String(n).padStart(w || 2, '0'); };
  var mkId = function (p, n) { return '01K9' + p + String(n).padStart(20, '0'); };
  var STAFF = { support: { id: mkId('ST', 1), role: 'support', aal: 'aal2' }, support2: { id: mkId('ST', 2), role: 'support', aal: 'aal2' }, admin: { id: mkId('ST', 3), role: 'admin', aal: 'aal2' } };
  var STAFF_NAMES = {}; STAFF_NAMES[STAFF.support.id] = 'Rasa K.'; STAFF_NAMES[STAFF.support2.id] = 'Tomas V.'; STAFF_NAMES[STAFF.admin.id] = 'Savininkas';
  var identity = STAFF.support;
  function setIdentity(name) { if (!STAFF[name]) throw new Error('nežinomas identitetas: ' + name); identity = STAFF[name]; }

  // ------------------------------------------------------------------ klaidos
  var STATUS = { invalid_request: 400, unauthorized: 401, forbidden: 403, not_found: 404, conflict: 409, rate_limited: 429, internal: 500 };
  /** API.md: kūnas visada { error: { code, message } }; 429 rate_limited papildomai turi Retry-After antraštę (sekundėmis). */
  function ApiError(code, message, headers) {
    var e = new Error(message); e.name = 'ApiError'; e.code = code; e.status = STATUS[code] || 400; e.headers = headers || {};
    e.body = { error: { code: code, message: message } };
    return e;
  }
  var bad = function (m) { return ApiError('invalid_request', m); };

  // ------------------------------------------------------------------ Europe/Vilnius laiko pagalbinės
  var dtf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  function vParts(ms) {
    var o = {}, parts = dtf.formatToParts(new Date(ms));
    for (var i = 0; i < parts.length; i++) o[parts[i].type] = parts[i].value;
    var y = +o.year, m = +o.month, d = +o.day, h = +o.hour % 24, mi = +o.minute, s = +o.second;
    var off = Math.round((Date.UTC(y, m - 1, d, h, mi, s) - Math.floor(ms / 1000) * 1000) / MIN);
    return { y: y, m: m, d: d, h: h, mi: mi, s: s, off: off };
  }
  function startOfVDay(y, m, d) {
    var base = Date.UTC(y, m - 1, d);
    for (var off = 0; off <= 4; off++) {
      var c = base - off * 3600000, p = vParts(c);
      if (p.y === y && p.m === m && p.d === d && p.h === 0 && p.mi === 0) return c;
    }
    throw new Error('startOfVDay');
  }
  function nextDayStart(ms) { var p = vParts(ms), n = new Date(Date.UTC(p.y, p.m - 1, p.d + 1)); return startOfVDay(n.getUTCFullYear(), n.getUTCMonth() + 1, n.getUTCDate()); }
  function dayKey(ms) { var p = vParts(ms); return p.y + '-' + pad(p.m) + '-' + pad(p.d); }
  function parseDay(s, name) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) throw bad(name + ': tikimasi YYYY-MM-DD');
    var y = +m[1], mo = +m[2], d = +m[3], t = new Date(Date.UTC(y, mo - 1, d));
    if (t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) throw bad(name + ': neteisinga data');
    return { y: y, m: mo, d: d };
  }
  function localIso(ms) {
    var p = vParts(ms), sign = p.off < 0 ? '-' : '+', a = Math.abs(p.off);
    return p.y + '-' + pad(p.m) + '-' + pad(p.d) + 'T' + pad(p.h) + ':' + pad(p.mi) + ':' + pad(p.s) + sign + pad(Math.floor(a / 60)) + ':' + pad(a % 60);
  }
  function isoWeekLabel(ms) {
    var p = vParts(ms), date = Date.UTC(p.y, p.m - 1, p.d), dn = (new Date(date).getUTCDay() + 6) % 7;
    var monday = date - dn * DAY, thursday = new Date(monday + 3 * DAY), wy = thursday.getUTCFullYear();
    var jan4 = Date.UTC(wy, 0, 4), w1 = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY;
    var week = 1 + Math.round((monday - w1) / (7 * DAY)), md = new Date(monday);
    return wy + '-W' + pad(week) + ' (' + md.getUTCFullYear() + '-' + pad(md.getUTCMonth() + 1) + '-' + pad(md.getUTCDate()) + ')';
  }
  function periodKey(ms, group) {
    if (group === 'day') return dayKey(ms);
    if (group === 'month') return dayKey(ms).slice(0, 7);
    return isoWeekLabel(ms);
  }
  var iso = function (ms) { return ms === null || ms === undefined ? null : new Date(ms).toISOString(); };
  var mins = function (ms) { return Math.round(ms / 600) / 100; };

  // ------------------------------------------------------------------ saugykla
  var mem = null;
  function storage() {
    try { if (typeof localStorage !== 'undefined' && localStorage) { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; } } catch (e) { /* privatus režimas */ }
    return { getItem: function () { return mem; }, setItem: function (k, v) { mem = v; }, removeItem: function () { mem = null; } };
  }
  var store = storage();
  function load() {
    var raw = store.getItem(STORE_KEY), db = null;
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || db.v !== 1) { db = seed(nowFn()); save(db); }
    return db;
  }
  function save(db) { store.setItem(STORE_KEY, JSON.stringify(db)); }
  function reset() { store.removeItem(STORE_KEY); mem = null; save(seed(nowFn())); }

  // ------------------------------------------------------------------ pradiniai (netikri) duomenys
  function rngFor(seedN) { var a = seedN >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function genBlock(rng, from, to, out) {
    var t = from;
    while (t < to) {
      out.push(Math.round(t));
      var step = (60 + Math.floor(rng() * 190)) * 1000;
      if (rng() < 0.1) step = (6 + rng() * 9) * MIN; // retkarčiais >5 min pauzė -> nauja sesija
      t += step;
    }
  }
  function seedActivity(now) {
    var act = {}, rng = rngFor(20261029);
    act[STAFF.support.id] = []; act[STAFF.support2.id] = []; act[STAFF.admin.id] = [];
    var tp = vParts(now);
    for (var k = 40; k >= 1; k--) {
      var u = new Date(Date.UTC(tp.y, tp.m - 1, tp.d - k)), y = u.getUTCFullYear(), m = u.getUTCMonth() + 1, d = u.getUTCDate(), dow = u.getUTCDay();
      var s0 = startOfVDay(y, m, d), H = function (h, mi) { return s0 + h * 3600000 + (mi || 0) * MIN; };
      if (dow >= 1 && dow <= 5) {
        genBlock(rng, H(8, 30 + Math.floor(rng() * 20)), H(12, Math.floor(rng() * 20)), act[STAFF.support.id]);
        genBlock(rng, H(12, 45), H(16, 20 + Math.floor(rng() * 30)), act[STAFF.support.id]);
        if (dow !== 3) { genBlock(rng, H(10), H(13, 40), act[STAFF.support2.id]); genBlock(rng, H(14, 20), H(17, 30), act[STAFF.support2.id]); }
        if (dow === 1 || dow === 4) genBlock(rng, H(18, 10), H(18, 50), act[STAFF.admin.id]);
      } else if (dow === 6 && k % 2 === 0) {
        genBlock(rng, H(11), H(14, 15), act[STAFF.support2.id]);
      }
      if (k === 6) genBlock(rng, H(23, 30), H(23, 59) + 26 * MIN, act[STAFF.support2.id]); // sesija per vidurnaktį
    }
    genBlock(rng, now - 3 * 3600000, now - 12 * MIN, act[STAFF.support.id]);
    genBlock(rng, now - 150 * MIN, now - 47 * MIN, act[STAFF.support2.id]);
    genBlock(rng, now - 5 * 3600000, now - 4.6 * 3600000, act[STAFF.admin.id]);
    Object.keys(act).forEach(function (id) { act[id] = act[id].filter(function (t) { return t < now - 10 * 1000; }).sort(function (a, b) { return a - b; }); });
    return act;
  }
  function seed(now) {
    var U = function (n) { return mkId('US', n); }, T = function (n) { return mkId('TK', n); }, R = function (n) { return mkId('RP', n); }, F = function (n) { return mkId('RF', n); }, C = function (n) { return mkId('CV', n); };
    var ago = function (min) { return now - min * MIN; };
    var users = {};
    [[1, 'Ieva', 'verified', 400], [2, 'Mantas', 'verified', 300], [3, 'Greta', 'selfie_pending', 20], [4, 'Darius', 'verified', 250], [5, 'Aistė', 'verified', 120], [6, 'Lukas', 'verified', 90], [7, 'Monika', 'verified', 60], [8, 'Tadas', 'unverified', 5]]
      .forEach(function (u) { users[U(u[0])] = { id: U(u[0]), state: u[2], deleted: false, suspended_until: null, created_at: ago(u[3] * 1440), profile: { display_name: u[1], hidden_by_moderation: false } }; });
    var bill = {};
    var pay = function (uid, plan, interval, cents, daysAgo, inv) { bill[uid] = { plan: plan, billing_interval: interval, status: 'active', current_period_end: ago(-(interval === 'year' ? 300 : 25) * 1440), cancel_at_period_end: false, founder: plan === 'plus', last_payment: { amount_cents: cents, currency: 'eur', paid_at: ago(daysAgo * 1440) }, last_invoice_id: inv }; };
    pay(U(1), 'premium', '30d', 699, 5, 'inv_1'); pay(U(3), 'plus', 'year', 10599, 12, 'inv_3'); pay(U(5), 'premium', '30d', 699, 20, 'inv_5'); pay(U(7), 'plus', '30d', 1399, 2, 'inv_7');
    var tickets = [
      { id: T(1), category: 'payment', subject: 'Du kartus nuskaitė mokėjimą už Premium', status: 'open', created_at: ago(190), user_id: U(1), msgs: [['user', 'Sveiki, šį mėnesį už Premium nuskaitė 6,99 € du kartus. Prašau grąžinti vieną mokėjimą.', 190]] },
      { id: T(2), category: 'profile_report', subject: 'Prašau patikrinti įtartiną profilį „Karina“', status: 'open', created_at: ago(95), user_id: U(2), msgs: [['user', 'Profilis rašo visiems tą patį ir prašo pinigų. Prašau patikrinti.', 95]] },
      { id: T(3), category: 'verification', subject: 'Jau 3 dienas laukiu veido patikros rezultato', status: 'open', created_at: ago(1300), user_id: U(3), msgs: [['user', 'Atlikau veido patikrą, bet būsena vis „laukiama“. Ką daryti?', 1300]] },
      { id: T(4), category: 'account_deletion', subject: 'Noriu ištrinti paskyrą', status: 'open', created_at: ago(40), user_id: U(4), msgs: [['user', 'Prašau ištrinti mano paskyrą ir visus duomenis.', 40]] },
      { id: T(5), category: 'other', subject: 'Kaip pakeisti programėlės kalbą?', status: 'answered', created_at: ago(2900), user_id: U(5), msgs: [['user', 'Norėčiau programėlę turėti angliškai.', 2900], ['staff', 'Sveiki! Nustatymuose → Kalba pasirinkite English.', 2850]] },
      { id: T(6), category: 'payment', subject: 'Nepavyksta atšaukti prenumeratos', status: 'open', created_at: ago(20), user_id: U(7), msgs: [['user', 'Portale nerandu atšaukimo mygtuko, o rytoj vėl nuskaitys. Pagalba!', 20]] },
      { id: T(7), category: 'other', subject: 'Ačiū už pagalbą', status: 'closed', created_at: ago(8000), user_id: U(8), msgs: [['user', 'Viskas veikia, ačiū.', 8000], ['staff', 'Džiaugiamės! Uždarome užklausą.', 7990]] }
    ].map(function (t, i) {
      return { id: t.id, category: t.category, subject: t.subject, status: t.status, created_at: iso(t.created_at), updated_at: iso(t.created_at), closed_at: t.status === 'closed' ? iso(t.created_at + 10 * MIN) : null, user_id: t.user_id, assigned_to: t.status === 'open' ? null : STAFF.support2.id,
        messages: t.msgs.map(function (m, j) { return { id: mkId('MS', i * 10 + j + 1), from: m[0], author_id: m[0] === 'user' ? t.user_id : STAFF.support2.id, body: m[1], created_at: iso(ago(m[2])) }; }) };
    });
    var rep = function (n, o) { var sla = o.sla; return Object.assign({ id: R(n), source: 'user', reporter_id: U(8 - (n % 3)), has_notifier_contact: false, details: null, evidence: null, priority: 'normal', status: 'open', created_at: iso(ago(o.age)), sla_due_at: iso(ago(o.age) + (o.priority === 'urgent' ? 24 : 72) * 3600000), resolved_at: null, outcome: null, prior_actions: [] }, o, { sla: undefined }); };
    var reports = [
      rep(1, { age: 300, target_type: 'message', target_id: C(1) + ':7', target_user_id: U(6), reason: 'harassment', details: 'Po atsisakymo tęsia įžeidinėjimus ir grasina.',
        evidence: [
          { seq: 5, sender: U(6), kind: 'text', body: 'Kodėl neatsakai? Aš tau per geras?', at: iso(ago(420)) },
          { seq: 6, sender: U(2), kind: 'text', body: 'Atsiprašau, nenoriu toliau bendrauti.', at: iso(ago(410)) },
          { seq: 7, sender: U(6), kind: 'text', body: 'Tu dar pasigailėsi, aš tave surasiu. Mano numeris: ***', at: iso(ago(400)) }] }),
      rep(2, { age: 160, target_type: 'user', target_id: U(8), target_user_id: U(8), reason: 'fake_profile', details: 'Nuotraukos atrodo paimtos iš interneto, aprašyme – svetimas vardas.' }),
      rep(3, { age: 55, target_type: 'user', target_id: U(2), target_user_id: U(2), reason: 'scam', details: 'Prašo „paskolinti“ pinigų jau antrame pranešime.', prior_actions: [{ id: mkId('AC', 9), action: 'warn', created_at: iso(ago(20000)) }] }),
      rep(4, { age: 25 * 60, priority: 'urgent', target_type: 'user', target_id: U(4), target_user_id: U(4), reason: 'threat', details: 'Pasakojo, kad pakenks kitam vartotojui.' }),
      rep(5, { age: 90, source: 'auto', target_type: 'message', target_id: C(2) + ':3', target_user_id: U(7), reason: 'spam', details: 'Automatinis pranešimas: tas pats tekstas išsiųstas 4 skirtingiems žmonėms.',
        evidence: [
          { seq: 2, sender: U(7), kind: 'text', body: 'Labas! Užeik į mano kanalą, rasi daugiau: ***', at: iso(ago(100)) },
          { seq: 3, sender: U(7), kind: 'text', body: 'Labas! Užeik į mano kanalą, rasi daugiau: ***', at: iso(ago(95)) }] }),
      rep(6, { age: 4000, target_type: 'photo', target_id: mkId('PH', 1), target_user_id: U(5), reason: 'nudity', status: 'resolved', resolved_at: iso(ago(3900)), outcome: 'hide_content',
        evidence: { photo_id: mkId('PH', 1), status: 'rejected', mime: 'image/jpeg', size_bytes: 482113, sha256: 'a3f1c0de5b7e49c2a1d8e6f03b94c7d2e5f60a1b8c93d4e7f2a6b5c0d1e8f934', uploaded_at: iso(ago(4100)), note: 'Paslėpta moderavimo (demo: vaizdas nerodomas).' } }),
      rep(7, { age: 200, target_type: 'photo', target_id: mkId('PH', 2), target_user_id: U(4), reason: 'fake_profile', details: 'Nuotrauka atrodo kaip žinomo žmogaus nuotrauka iš žurnalo.',
        evidence: { photo_id: mkId('PH', 2), status: 'approved', mime: 'image/webp', size_bytes: 215876, sha256: '7be2d4a90c1f36e85a0b9d7c4e2f1a63b5d8c0e9f47a2b13c6d5e8f0a9b7c412', uploaded_at: iso(ago(30000)), note: null } })
    ];
    var refunds = [
      { id: F(1), user_id: U(1), amount_cents: 699, currency: 'eur', reason: 'Dvigubas nuskaitymas už tą patį laikotarpį (žr. užklausą).', ticket_id: T(1), state: 'requested', requested_by: STAFF.support.id, requested_at: iso(ago(150)), decided_at: null, decision_note: null, payment_ref: 'inv_1' },
      { id: F(2), user_id: U(7), amount_cents: 1399, currency: 'eur', reason: 'Vartotojas negalėjo atšaukti prenumeratos prieš atnaujinimą.', ticket_id: T(6), state: 'requested', requested_by: STAFF.support2.id, requested_at: iso(ago(12)), decided_at: null, decision_note: null, payment_ref: 'inv_7' },
      { id: F(3), user_id: U(5), amount_cents: 699, currency: 'eur', reason: 'Netyčinis pirkimas, vartotojas parašė per 10 min.', ticket_id: null, state: 'processed', requested_by: STAFF.support2.id, requested_at: iso(ago(9000)), decided_at: iso(ago(8800)), decision_note: 'Gerai.', payment_ref: 'inv_old1' },
      { id: F(4), user_id: U(3), amount_cents: 10599, currency: 'eur', reason: 'Prašo pilno metinio plano grąžinimo po 11 mėnesių naudojimo.', ticket_id: null, state: 'rejected', requested_by: STAFF.support.id, requested_at: iso(ago(15000)), decided_at: iso(ago(14900)), decision_note: 'Per vėlu, naudotas visą laikotarpį.', payment_ref: 'inv_old2' }
    ];
    var audit = [], A = function (min, actor, action, target, detail) { audit.push({ actor: actor, action: action, target: target || null, detail: detail || null, at: ago(min) }); };
    A(9000, STAFF.support2.id, 'refund_request', U(5), F(3)); A(8800, STAFF.admin.id, 'refund_approve', U(5), F(3)); A(8800, STAFF.admin.id, 'refund_processed', U(5), F(3));
    A(7990, STAFF.support2.id, 'ticket_reply', T(7), null); A(7985, STAFF.support2.id, 'ticket_close', T(7), null);
    A(2850, STAFF.support2.id, 'ticket_view', T(5), null); A(2850, STAFF.support2.id, 'ticket_reply', T(5), null);
    A(1500, STAFF.support.id, 'report_view', R(3), null); A(1495, STAFF.support.id, 'user_view', U(2), null); A(900, STAFF.admin.id, 'worktime_view', null, '2026-09-29..2026-10-28');
    A(150, STAFF.support.id, 'ticket_view', T(1), null); A(149, STAFF.support.id, 'billing_view', U(1), null); A(148, STAFF.support.id, 'refund_request', U(1), F(1));
    A(60, STAFF.support2.id, 'support_denied', null, 'GET /api/admin/audit-log'); A(12, STAFF.support2.id, 'refund_request', U(7), F(2));
    return { v: 1, created_at: now, users: users, billing: bill, tickets: tickets, reports: reports, actions: [], refunds: refunds, audit: audit, activity: seedActivity(now), hb: {}, seq: 100 };
  }

  // ------------------------------------------------------------------ teisių tikrinimas
  var LEVEL = { support: ['support', 'admin'], any: ['support', 'moderator', 'admin'], admin: ['admin'] };
  function requireStaff(level) {
    if (!LEVEL[level].includes(identity.role)) throw ApiError('forbidden', 'Staff role required');
    if (identity.aal !== 'aal2') throw ApiError('forbidden', 'Multi-factor authentication required');
  }
  function audit(db, action, target, detail, at) { db.audit.push({ actor: identity.id, action: action, target: target || null, detail: detail || null, at: at === undefined ? nowFn() : at }); }
  function newId(db, prefix) { db.seq++; return mkId(prefix, db.seq); }
  function vText(v, name, min, max) { if (typeof v !== 'string') throw bad(name + ': būtina eilutė'); var s = v.trim(); if (s.length < min || s.length > max) throw bad(name + ': ilgis turi būti ' + min + '–' + max + ' simbolių'); return s; }
  function vEnum(v, name, list) { if (!list.includes(v)) throw bad(name + ': ' + list.join('|')); return v; }
  function noUnknown(body, allowed) { Object.keys(body || {}).forEach(function (k) { if (!allowed.includes(k)) throw bad('nežinomas laukas: ' + k); }); }
  function ticketOut(t) { return { id: t.id, category: t.category, subject: t.subject, status: t.status, created_at: t.created_at, updated_at: t.updated_at, closed_at: t.closed_at, user_id: t.user_id, assigned_to: t.assigned_to }; }
  function refundOut(r) { return { id: r.id, user_id: r.user_id, amount_cents: r.amount_cents, currency: r.currency, reason: r.reason, ticket_id: r.ticket_id, state: r.state, requested_by: r.requested_by, requested_at: r.requested_at, decided_at: r.decided_at, decision_note: r.decision_note }; }
  var TICKET_CATEGORIES = ['payment', 'profile_report', 'verification', 'account_deletion', 'other'];

  // ------------------------------------------------------------------ maršrutai
  var routes = [];
  function route(method, re, level, fn) { routes.push({ method: method, re: re, level: level, fn: fn }); }

  route('GET', /^\/api\/me$/, null, function () { return { id: identity.id, state: 'verified', has_profile: false, suspended_until: null, staff_role: identity.role, plan: { plan: 'free', billing_interval: null, status: 'none', current_period_end: null, cancel_at_period_end: false, features: {} }, created_at: iso(nowFn() - 400 * DAY) }; });

  // --- darbo laikas
  route('POST', /^\/api\/admin\/heartbeat$/, 'support', function (db) {
    var now = nowFn(), list = (db.hb[identity.id] || []).filter(function (t) { return now - t < MIN; });
    if (list.length >= CFG.HEARTBEATS_PER_MINUTE) { db.hb[identity.id] = list; throw ApiError('rate_limited', 'Too many heartbeats', { 'retry-after': '5' }); }
    list.push(now); db.hb[identity.id] = list;
    return { ok: true, server_time: iso(now), idle_timeout_min: CFG.IDLE_TIMEOUT_MIN };
  });

  // --- užklausos (tickets)
  route('GET', /^\/api\/admin\/support\/tickets$/, 'support', function (db, m, q) {
    var status = q.status || 'open'; vEnum(status, 'status', ['open', 'answered', 'closed', 'all']);
    if (q.category) vEnum(q.category, 'category', TICKET_CATEGORIES);
    return { tickets: db.tickets.filter(function (t) { return (status === 'all' || t.status === status) && (!q.category || t.category === q.category); }).sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).slice(0, 100).map(ticketOut) };
  });
  route('GET', /^\/api\/admin\/support\/tickets\/([^/]+)$/, 'support', function (db, m) {
    var t = db.tickets.find(function (x) { return x.id === m[1]; }); if (!t) throw ApiError('not_found', 'Ticket not found');
    audit(db, 'ticket_view', t.id);
    return Object.assign(ticketOut(t), { messages: t.messages.map(function (x) { return { id: x.id, from: x.from, author_id: x.author_id, body: x.body, created_at: x.created_at }; }) });
  });
  route('POST', /^\/api\/admin\/support\/tickets\/([^/]+)\/reply$/, 'support', function (db, m, q, body) {
    noUnknown(body, ['body']); var text = vText(body && body.body, 'body', 1, 4000);
    var t = db.tickets.find(function (x) { return x.id === m[1]; }); if (!t) throw ApiError('not_found', 'Ticket not found');
    if (t.status === 'closed') throw ApiError('conflict', 'Ticket is closed');
    var id = newId(db, 'MS'), at = iso(nowFn());
    t.messages.push({ id: id, from: 'staff', author_id: identity.id, body: text, created_at: at });
    t.status = 'answered'; t.updated_at = at; if (!t.assigned_to) t.assigned_to = identity.id;
    audit(db, 'ticket_reply', t.id);
    return { _status: 201, id: id, ticket_id: t.id, status: 'answered' };
  });
  route('POST', /^\/api\/admin\/support\/tickets\/([^/]+)\/close$/, 'support', function (db, m) {
    var t = db.tickets.find(function (x) { return x.id === m[1]; }); if (!t) throw ApiError('not_found', 'Ticket not found');
    t.status = 'closed'; t.closed_at = t.updated_at = iso(nowFn()); audit(db, 'ticket_close', t.id);
    return { id: t.id, status: 'closed' };
  });

  // --- vartotojas / mokėjimų santrauka (be el. pašto, gimimo datos, jautrių laukų, vietos, kortelių)
  route('GET', /^\/api\/admin\/users\/([^/]+)\/billing$/, 'support', function (db, m) {
    var u = db.users[m[1]]; if (!u) throw ApiError('not_found', 'User not found');
    var b = db.billing[u.id] || null, rf = db.refunds.filter(function (r) { return r.user_id === u.id; }).sort(function (a, c) { return a.requested_at < c.requested_at ? 1 : -1; }).slice(0, 5);
    audit(db, 'billing_view', u.id);
    return { user_id: u.id, plan: b ? b.plan : 'free', billing_interval: b ? b.billing_interval : null, status: b ? b.status : 'none', current_period_end: b ? iso(b.current_period_end) : null, cancel_at_period_end: b ? b.cancel_at_period_end : false, founder: b ? b.founder : false,
      last_payment: b ? { amount_cents: b.last_payment.amount_cents, currency: b.last_payment.currency, paid_at: iso(b.last_payment.paid_at) } : null,
      refund: rf[0] ? { state: rf[0].state } : null,
      refunds: rf.map(function (r) { return { id: r.id, state: r.state, amount_cents: r.amount_cents, currency: r.currency, requested_at: r.requested_at, decided_at: r.decided_at }; }) };
  });
  route('GET', /^\/api\/admin\/users\/([^/]+)$/, 'support', function (db, m) {
    var u = db.users[m[1]]; if (!u) throw ApiError('not_found', 'User not found');
    audit(db, 'user_view', u.id);
    return { id: u.id, state: u.state, deleted: u.deleted, suspended_until: iso(u.suspended_until), created_at: iso(u.created_at), profile: u.deleted ? null : { display_name: u.profile.display_name, hidden_by_moderation: u.profile.hidden_by_moderation },
      reports_about_user: db.reports.filter(function (r) { return r.target_user_id === u.id; }).length, open_tickets: db.tickets.filter(function (t) { return t.user_id === u.id && t.status !== 'closed'; }).length };
  });
  route('DELETE', /^\/api\/admin\/users\/([^/]+)$/, 'admin', function (db, m, q, body) {
    if (!body || body.confirm !== 'DELETE') throw bad('confirm: "DELETE"');
    var u = db.users[m[1]]; if (!u) throw ApiError('not_found', 'User not found');
    u.deleted = true; u.profile = null; audit(db, 'user_erase', u.id);
    return { deleted: true, external_deletion_pending: false };
  });

  // --- grąžinimai (support tik PRAŠO; sprendžia tik admin su MFA)
  route('POST', /^\/api\/admin\/refunds$/, 'support', function (db, m, q, body) {
    noUnknown(body, ['user_id', 'reason', 'amount_cents', 'ticket_id']);
    var uid = vText(body && body.user_id, 'user_id', 3, 64), reason = vText(body.reason, 'reason', 10, 1000);
    var u = db.users[uid]; if (!u) throw ApiError('not_found', 'User not found');
    var tid = body.ticket_id === undefined || body.ticket_id === null || body.ticket_id === '' ? null : String(body.ticket_id);
    if (tid && !db.tickets.some(function (t) { return t.id === tid; })) throw ApiError('not_found', 'Ticket not found');
    var b = db.billing[uid]; if (!b || !b.last_payment) throw ApiError('conflict', 'No payment on record for this user');
    var amount = body.amount_cents === undefined || body.amount_cents === null || body.amount_cents === '' ? b.last_payment.amount_cents : Number(body.amount_cents);
    if (!Number.isInteger(amount) || amount < 1 || amount > b.last_payment.amount_cents) throw bad('amount_cents: 1–' + b.last_payment.amount_cents + ' (ne daugiau už paskutinį mokėjimą)');
    if (db.refunds.some(function (r) { return r.payment_ref === b.last_invoice_id && ['requested', 'approved', 'processed'].includes(r.state); })) throw ApiError('conflict', 'A refund request already exists for this payment');
    var r = { id: newId(db, 'RF'), user_id: uid, amount_cents: amount, currency: b.last_payment.currency, reason: reason, ticket_id: tid, state: 'requested', requested_by: identity.id, requested_at: iso(nowFn()), decided_at: null, decision_note: null, payment_ref: b.last_invoice_id };
    db.refunds.push(r); audit(db, 'refund_request', uid, r.id);
    return { _status: 201, id: r.id, user_id: uid, amount_cents: amount, currency: r.currency, state: 'requested', requested_at: r.requested_at };
  });
  route('GET', /^\/api\/admin\/refunds$/, 'support', function (db, m, q) {
    var state = q.state || 'requested'; vEnum(state, 'state', ['requested', 'approved', 'rejected', 'processed', 'failed', 'all']);
    return { refunds: db.refunds.filter(function (r) { return (state === 'all' || r.state === state) && (!q.requested_by || r.requested_by === q.requested_by); }).sort(function (a, b) { return a.requested_at < b.requested_at ? -1 : 1; }).slice(0, 100).map(refundOut) };
  });
  route('POST', /^\/api\/admin\/refunds\/([^/]+)\/decision$/, 'admin', function (db, m, q, body) {
    noUnknown(body, ['decision', 'note']); var decision = vEnum(body && body.decision, 'decision', ['approve', 'reject']);
    var note = body.note === undefined || body.note === null || body.note === '' ? null : vText(body.note, 'note', 1, 500);
    var r = db.refunds.find(function (x) { return x.id === m[1]; }); if (!r) throw ApiError('not_found', 'Refund request not found');
    if (r.requested_by === identity.id) throw ApiError('forbidden', 'A refund must be approved by a different admin than the requester');
    if (!(r.state === 'requested' || (r.state === 'failed' && decision === 'approve'))) throw ApiError('conflict', 'Refund request already decided');
    r.decided_at = iso(nowFn()); r.decision_note = note;
    if (decision === 'reject') { r.state = 'rejected'; audit(db, 'refund_reject', r.user_id, r.id); return refundOut(r); }
    r.state = 'approved'; audit(db, 'refund_approve', r.user_id, r.id);
    r.state = 'processed'; audit(db, 'refund_processed', r.user_id, r.id); // demo: "refund provider" stub visada sėkmingas
    return refundOut(r);
  });

  // --- skundai ir veiksmai
  route('GET', /^\/api\/admin\/reports$/, 'any', function (db, m, q) {
    var status = q.status || 'open'; vEnum(status, 'status', ['open', 'in_review', 'resolved', 'dismissed', 'all']);
    if (q.priority) vEnum(q.priority, 'priority', ['urgent', 'normal']);
    var now = nowFn();
    var list = db.reports.filter(function (r) { return (status === 'all' || r.status === status) && (!q.priority || r.priority === q.priority); })
      .sort(function (a, b) { return (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1) || (a.sla_due_at < b.sla_due_at ? -1 : 1); }).slice(0, 50);
    return { reports: list.map(function (r) { return { id: r.id, source: r.source, target_type: r.target_type, target_id: r.target_id, target_user_id: r.target_user_id, target_display_name: (db.users[r.target_user_id] && db.users[r.target_user_id].profile) ? db.users[r.target_user_id].profile.display_name : null, reason: r.reason, priority: r.priority, status: r.status, created_at: r.created_at, sla_due_at: r.sla_due_at, overdue: r.status === 'open' && Date.parse(r.sla_due_at) < now }; }) };
  });
  route('GET', /^\/api\/admin\/reports\/([^/]+)$/, 'any', function (db, m) {
    var r = db.reports.find(function (x) { return x.id === m[1]; }); if (!r) throw ApiError('not_found', 'Report not found');
    audit(db, 'report_view', r.id);
    return { id: r.id, source: r.source, reporter_id: r.reporter_id, has_notifier_contact: r.has_notifier_contact, target_type: r.target_type, target_id: r.target_id, target_user_id: r.target_user_id, reason: r.reason, details: r.details, evidence: r.evidence, priority: r.priority, status: r.status, created_at: r.created_at, sla_due_at: r.sla_due_at, resolved_at: r.resolved_at, outcome: r.outcome,
      prior_actions: r.prior_actions.concat(db.actions.filter(function (a) { return a.target_user === r.target_user_id; }).map(function (a) { return { id: a.id, action: a.action, created_at: a.created_at }; })) };
  });
  route('PATCH', /^\/api\/admin\/reports\/([^/]+)$/, 'any', function (db, m, q, body) {
    noUnknown(body, ['status']); var status = vEnum(body && body.status, 'status', ['open', 'in_review']);
    var r = db.reports.find(function (x) { return x.id === m[1] && (x.status === 'open' || x.status === 'in_review'); }); if (!r) throw ApiError('not_found', 'Open report not found');
    r.status = status; audit(db, 'report_status', r.id, status);
    return { id: r.id, status: status };
  });
  route('POST', /^\/api\/admin\/actions$/, 'any', function (db, m, q, body) {
    body = body || {}; noUnknown(body, ['report_id', 'target_user', 'action', 'reason_text', 'ground_type', 'ground', 'automated', 'suspend_days']);
    var action = vEnum(body.action, 'action', ['dismiss', 'warn', 'hide_content', 'suspend', 'ban', 'restore']);
    var report = null; if (body.report_id !== undefined) { report = db.reports.find(function (x) { return x.id === body.report_id; }); if (!report) throw ApiError('not_found', 'Report not found'); }
    var target = body.target_user !== undefined ? body.target_user : (report && report.target_user_id); if (!target) throw bad('target_user: required (the report has no target user)');
    if (action === 'dismiss' && !report) throw bad('dismiss requires report_id');
    var u = db.users[target]; if (!u) throw ApiError('not_found', 'User not found');
    if (target === identity.id) throw ApiError('forbidden', 'Staff cannot act on their own account');
    var reasonText = vText(body.reason_text, 'reason_text', 20, 2000), groundType = vEnum(body.ground_type, 'ground_type', ['law', 'tos']), ground = vText(body.ground, 'ground', 3, 300);
    var days = null;
    if (action === 'suspend') { days = Number(body.suspend_days); if (!Number.isInteger(days) || days < 1 || days > 365) throw bad('suspend_days: 1–365'); }
    if (identity.role === 'support') {
      if (action === 'ban' || action === 'restore') throw ApiError('forbidden', "Support cannot use the '" + action + "' action; escalate to a moderator or admin");
      if (days && days > CFG.SUPPORT_MAX_SUSPEND_DAYS) throw ApiError('forbidden', 'Support may suspend for at most ' + CFG.SUPPORT_MAX_SUSPEND_DAYS + ' days');
    }
    var now = nowFn(), until = days ? now + days * DAY : null, id = newId(db, 'AC');
    if (action === 'suspend') u.suspended_until = until;
    if (action === 'hide_content' && u.profile) u.profile.hidden_by_moderation = true;
    if (action === 'ban') u.state = 'banned';
    if (action === 'restore') { u.state = 'verified'; u.suspended_until = null; if (u.profile) u.profile.hidden_by_moderation = false; }
    if (report) { report.status = action === 'dismiss' ? 'dismissed' : 'resolved'; report.resolved_at = iso(now); report.outcome = action === 'dismiss' ? 'no_action' : action; }
    db.actions.push({ id: id, report_id: report ? report.id : null, target_user: target, actor_id: identity.id, action: action, created_at: iso(now) });
    audit(db, 'action_' + action, target, id);
    return { _status: 201, id: id, action: action, statement_of_reasons: { facts_and_circumstances: reasonText, ground_type: groundType, ground: ground, automated_decision: !!body.automated, redress: 'Galite pateikti apeliaciją per 6 mėn. (DSA 20 str.).' }, suspend_until: iso(until), created_at: iso(now), appeal_status: 'none' };
  });
  route('GET', /^\/api\/admin\/audit-log$/, 'admin', function (db) {
    return { entries: db.audit.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 200).map(function (e) { return { actor: e.actor, action: e.action, target: e.target, detail: e.detail, at: iso(e.at) }; }) };
  });

  // --- darbo laiko ataskaitos (tik admin)
  function parseWorktimeQuery(q) {
    var now = nowFn(), group = q.group || 'day'; vEnum(group, 'group', ['day', 'week', 'month']);
    var tp = vParts(now), today = tp.y + '-' + pad(tp.m) + '-' + pad(tp.d), t30 = new Date(Date.UTC(tp.y, tp.m - 1, tp.d - 29));
    var from = q.from || (t30.getUTCFullYear() + '-' + pad(t30.getUTCMonth() + 1) + '-' + pad(t30.getUTCDate())), to = q.to || today;
    var f = parseDay(from, 'from'), t = parseDay(to, 'to');
    var fromMs = startOfVDay(f.y, f.m, f.d), toMs = nextDayStart(startOfVDay(t.y, t.m, t.d));
    if (toMs <= fromMs) throw bad('to turi būti >= from');
    if ((toMs - fromMs) / DAY > 401) throw bad('intervalas ne ilgesnis nei 400 dienų');
    return { staffId: q.staff_id || null, from: from, to: to, group: group, fromMs: fromMs, toMs: toMs };
  }
  function buildReport(db, q) {
    var idleMs = CFG.IDLE_TIMEOUT_MIN * MIN, all = [], buckets = {}, perStaff = {}, total = 0;
    Object.keys(db.activity).forEach(function (sid) {
      if (q.staffId && q.staffId !== sid) return;
      Sessions.computeSessions(db.activity[sid], idleMs).forEach(function (s) { s.staff_id = sid; all.push(s); });
    });
    var roleOf = function (sid) { return sid === STAFF.admin.id ? 'admin' : 'support'; };
    var bucket = function (period, sid) { var k = period + '|' + sid; return buckets[k] || (buckets[k] = { period: period, staff_id: sid, ms: 0, sessions: {}, actions: 0, tickets: {}, reports: {} }); };
    var list = [];
    all.sort(function (a, b) { return a.start - b.start; }).forEach(function (s) {
      if (s.end < q.fromMs || s.start >= q.toMs) return;
      var sid = s.staff_id, key = sid + '@' + s.start, counted = false, a = s.start;
      list.push({ id: 'WS' + sid.slice(-4) + '_' + s.start, staff_id: sid, role: roleOf(sid), start: localIso(s.start), end: localIso(s.end), start_utc: iso(s.start), end_utc: iso(s.end), minutes: s.minutes, action_count: s.action_count });
      while (a < s.end || (a === s.end && s.start === s.end)) { // sesija dalijama per Vilniaus vidurnaktį
        var dayEnd = nextDayStart(a), b = Math.min(s.end, dayEnd);
        if (a >= q.fromMs && a < q.toMs) {
          var bk = bucket(periodKey(a, q.group), sid); bk.ms += b - a; bk.sessions[key] = 1;
          if (!counted) { bk.actions += s.action_count; counted = true; }
          total += b - a;
        }
        if (b >= s.end) break; a = b;
      }
    });
    db.audit.forEach(function (e) { if (e.actor && (!q.staffId || q.staffId === e.actor) && (e.action === 'ticket_reply' || e.action === 'ticket_close') && e.at >= q.fromMs && e.at < q.toMs) bucket(periodKey(e.at, q.group), e.actor).tickets[e.target] = 1; });
    db.actions.forEach(function (a) { var at = Date.parse(a.created_at); if (a.report_id && (!q.staffId || q.staffId === a.actor_id) && at >= q.fromMs && at < q.toMs) bucket(periodKey(at, q.group), a.actor_id).reports[a.report_id] = 1; });
    var periods = Object.keys(buckets).map(function (k) { return buckets[k]; }).filter(function (b) { return b.ms > 0 || Object.keys(b.tickets).length || Object.keys(b.reports).length; })
      .sort(function (x, y) { return x.period === y.period ? (x.staff_id < y.staff_id ? -1 : 1) : (x.period < y.period ? -1 : 1); });
    periods.forEach(function (b) {
      var p = perStaff[b.staff_id] || (perStaff[b.staff_id] = { staff_id: b.staff_id, role: roleOf(b.staff_id), ms: 0, sessions: {}, actions: 0, tickets: {}, reports: {} });
      p.ms += b.ms; p.actions += b.actions; Object.assign(p.sessions, b.sessions); Object.assign(p.tickets, b.tickets); Object.assign(p.reports, b.reports);
    });
    return { timezone: TZ, staff_id: q.staffId, from: q.from, to: q.to, group: q.group, idle_timeout_min: CFG.IDLE_TIMEOUT_MIN, total_minutes: mins(total), total_seconds: Math.round(total / 1000), sessions_count: list.length,
      periods: periods.map(function (b) { return { period: b.period, staff_id: b.staff_id, minutes: mins(b.ms), seconds: Math.round(b.ms / 1000), sessions: Object.keys(b.sessions).length, actions: b.actions, tickets_handled: Object.keys(b.tickets).length, reports_handled: Object.keys(b.reports).length }; }),
      per_staff: Object.keys(perStaff).map(function (k) { var p = perStaff[k]; return { staff_id: p.staff_id, role: p.role, minutes: mins(p.ms), seconds: Math.round(p.ms / 1000), sessions: Object.keys(p.sessions).length, actions: p.actions, tickets_handled: Object.keys(p.tickets).length, reports_handled: Object.keys(p.reports).length }; }),
      sessions: list };
  }
  route('GET', /^\/api\/admin\/worktime$/, 'admin', function (db, m, q) {
    var qq = parseWorktimeQuery(q), rep = buildReport(db, qq); audit(db, 'worktime_view', qq.staffId, qq.from + '..' + qq.to); return rep;
  });
  var csvCell = function (v) { var s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  route('GET', /^\/api\/admin\/worktime\.csv$/, 'admin', function (db, m, q) {
    var qq = parseWorktimeQuery(q), rows = q.rows || 'summary'; vEnum(rows, 'rows', ['summary', 'sessions']);
    var rep = buildReport(db, qq), lines = [];
    if (rows === 'summary') {
      lines.push('period,staff_id,minutes,sessions,actions,tickets_handled,reports_handled');
      rep.periods.forEach(function (p) { lines.push([p.period, p.staff_id, p.minutes.toFixed(2), p.sessions, p.actions, p.tickets_handled, p.reports_handled].map(csvCell).join(',')); });
    } else {
      lines.push('staff_id,role,session_start,session_end,minutes,actions');
      rep.sessions.forEach(function (s) { lines.push([s.staff_id, s.role, s.start, s.end, s.minutes.toFixed(2), s.action_count].map(csvCell).join(',')); });
    }
    audit(db, 'worktime_export', qq.staffId, qq.from + '..' + qq.to + ' ' + rows);
    return { _csv: lines.join('\r\n') + '\r\n', _headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="worktime_' + qq.from + '_' + qq.to + '_' + rows + '.csv"' } };
  });
  route('GET', /^\/api\/admin\/worktime\/live$/, 'admin', function (db) {
    var now = nowFn(), idle = CFG.IDLE_TIMEOUT_MIN * MIN, staff = [];
    Object.keys(db.activity).forEach(function (sid) {
      var ev = db.activity[sid]; if (!ev.length || now - ev[ev.length - 1] > DAY) return;
      var ss = Sessions.computeSessions(ev.slice(-600), idle), s = ss[ss.length - 1], working = now - s.end <= idle;
      staff.push({ staff_id: sid, role: sid === STAFF.admin.id ? 'admin' : 'support', status: working ? 'working' : 'idle', last_activity_at: iso(s.end), session_started_at: working ? iso(s.start) : null, session_minutes: working ? s.minutes : null, idle_for_s: working ? 0 : Math.round((now - s.end) / 1000) });
    });
    return { now: iso(now), idle_timeout_min: CFG.IDLE_TIMEOUT_MIN, staff: staff.sort(function (a, b) { return a.last_activity_at < b.last_activity_at ? 1 : -1; }) };
  });

  // ------------------------------------------------------------------ pagrindinis įėjimas
  var SUPPORT_PREFIXES = ['/api/me', '/api/consents', '/api/support', '/api/admin', '/api/reports/mine'];
  function parseUrl(url) {
    var i = url.indexOf('?'), path = i < 0 ? url : url.slice(0, i), q = {};
    if (i >= 0) url.slice(i + 1).split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return { path: path, q: q };
  }
  function handle(method, url, body) {
    var u = parseUrl(url), db = load(), now = nowFn(), staffNow = identity.role === 'support' || identity.role === 'admin';
    try {
      if (staffNow && u.path.indexOf('/api/admin/') === 0 && u.path.indexOf('/api/admin/worktime') !== 0) { (db.activity[identity.id] || (db.activity[identity.id] = [])).push(now); } // kiekviena /api/admin/* užklausa = aktyvumas, IŠSKYRUS /api/admin/worktime* (API.md)
      if (identity.role === 'support' && !SUPPORT_PREFIXES.some(function (p) { return u.path === p || u.path.indexOf(p + '/') === 0; })) { audit(db, 'support_denied', null, method + ' ' + u.path); throw ApiError('forbidden', 'Support accounts cannot use this endpoint'); }
      for (var i = 0; i < routes.length; i++) {
        var r = routes[i], m = r.method === method && r.re.exec(u.path);
        if (!m) continue;
        if (r.level) {
          try { requireStaff(r.level); } catch (e) { if (e.code === 'forbidden' && identity.role === 'support') audit(db, 'support_denied', null, method + ' ' + u.path); throw e; }
        }
        var out = r.fn(db, m, u.q, body);
        return { out: out };
      }
      throw ApiError('not_found', 'Not found');
    } finally { save(db); }
  }
  var sleep = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };

  /** Visada grąžina { status, headers, data }; klaidos atveju išmeta ApiError. (Vėliau: fetch + Authorization: Bearer.) */
  function request(method, url, body) {
    return (CFG.latencyMs ? sleep(CFG.latencyMs) : Promise.resolve()).then(function () {
      var res;
      try { res = handle(method.toUpperCase(), url, body === undefined ? undefined : JSON.parse(JSON.stringify(body))); } catch (e) { if (e.name === 'ApiError') throw e; throw ApiError('internal', String(e && e.message || e)); }
      var out = res.out, status = out && out._status || 200;
      if (out && out._csv !== undefined) return { status: 200, headers: out._headers, data: out._csv };
      if (out && out._status) { out = Object.assign({}, out); delete out._status; }
      return { status: status, headers: { 'content-type': 'application/json' }, data: JSON.parse(JSON.stringify(out)) };
    });
  }
  var unwrap = function (p) { return p.then(function (r) { return r.data; }); };

  // ------------------------------------------------------------------ aktyvumo signalas (heartbeat)
  var lastBeatAt = 0;
  /** POST /api/admin/heartbeat. 429 (rate_limited) tyliai praleidžiamas - atmestas signalas neįrašomas. */
  function heartbeat() {
    lastBeatAt = nowFn();
    return request('POST', '/api/admin/heartbeat').then(function (r) {
      if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('tikri:heartbeat', { detail: r.data }));
      return r.data;
    }, function (e) { if (e.code === 'rate_limited') return null; throw e; });
  }
  /** Tikrame UI: signalas realiai sąveikai (click, key, scroll) ne dažniau kaip kas 30 s. */
  function attachHeartbeat() {
    if (typeof document === 'undefined') return;
    var fn = function () { if (nowFn() - lastBeatAt >= 30000) heartbeat().catch(function () {}); };
    ['click', 'keydown', 'scroll'].forEach(function (ev) { document.addEventListener(ev, fn, { capture: true, passive: true }); });
  }

  return {
    request: request, heartbeat: heartbeat, attachHeartbeat: attachHeartbeat, setIdentity: setIdentity, reset: reset, ApiError: ApiError,
    get: function (u) { return unwrap(request('GET', u)); }, post: function (u, b) { return unwrap(request('POST', u, b)); },
    patch: function (u, b) { return unwrap(request('PATCH', u, b)); }, del: function (u, b) { return unwrap(request('DELETE', u, b)); },
    config: CFG, STORE_KEY: STORE_KEY, TZ: TZ,
    demo: { staffNames: STAFF_NAMES, staff: STAFF, currentStaffId: function () { return identity.id; }, setNow: function (fn) { nowFn = fn || function () { return Date.now(); }; }, vParts: vParts, startOfVDay: startOfVDay, isoWeekLabel: isoWeekLabel, localIso: localIso }
  };
});
