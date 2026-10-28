/* Bendros UI pagalbinės funkcijos (lietuviški tekstai, formatavimas Europe/Vilnius laiku). Jokio duomenų kreipimosi - tik per api.js. */
(function () {
  'use strict';
  var TZ = 'Europe/Vilnius';
  var dt = new Intl.DateTimeFormat('lt-LT', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  var tm = new Intl.DateTimeFormat('lt-LT', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var L = {
    category: { payment: 'Mokėjimai', profile_report: 'Profilio skundas', verification: 'Patikra', account_deletion: 'Paskyros ištrynimas', other: 'Kita' },
    ticketStatus: { open: 'Laukia atsakymo', answered: 'Atsakyta', closed: 'Uždaryta' },
    reportStatus: { open: 'Atvira', in_review: 'Peržiūrima', resolved: 'Išspręsta', dismissed: 'Atmesta' },
    reason: { csam: 'CSAM', minor: 'Nepilnametis', threat: 'Grasinimai', illegal: 'Neteisėtas turinys', harassment: 'Priekabiavimas', scam: 'Sukčiavimas', fake_profile: 'Netikras profilis', nudity: 'Nuogumas', spam: 'Šlamštas', other: 'Kita' },
    targetType: { user: 'Profilis', message: 'Žinutė', photo: 'Nuotrauka' },
    userState: { unverified: 'Nepatvirtintas', selfie_pending: 'Laukia veido patikros', verified: 'Patvirtintas', banned: 'Užblokuotas visam laikui' },
    refundState: { requested: 'Laukia sprendimo', approved: 'Patvirtintas', rejected: 'Atmestas', processed: 'Įvykdytas', failed: 'Nepavyko' },
    plan: { free: 'Nemokamas', premium: 'Premium', plus: 'Plus' },
    action: { warn: 'Įspėjimas', hide_content: 'Profilio paslėpimas', suspend: 'Blokavimas', dismiss: 'Skundo atmetimas', ban: 'Uždraudimas', restore: 'Atkūrimas' },
    audit: { ticket_view: 'Užklausos peržiūra', ticket_reply: 'Atsakymas į užklausą', ticket_close: 'Užklausos uždarymas', user_view: 'Vartotojo peržiūra', billing_view: 'Mokėjimų santraukos peržiūra', refund_request: 'Grąžinimo prašymas', refund_approve: 'Grąžinimo patvirtinimas', refund_reject: 'Grąžinimo atmetimas', refund_processed: 'Grąžinimas įvykdytas', refund_failed: 'Grąžinimas nepavyko', report_view: 'Skundo peržiūra', report_status: 'Skundo būsenos keitimas', action_warn: 'Įspėjimas', action_hide_content: 'Profilio paslėpimas', action_suspend: 'Blokavimas', action_dismiss: 'Skundo atmetimas', action_ban: 'Uždraudimas', action_restore: 'Atkūrimas', support_denied: 'Atmesta (trūksta teisių)', worktime_view: 'Darbo laiko ataskaita', worktime_export: 'Darbo laiko CSV', user_erase: 'Paskyros ištrynimas' },
    errors: { invalid_request: 'Neteisinga užklausa', unauthorized: 'Reikia prisijungti', forbidden: 'Neleidžiama', not_found: 'Nerasta', conflict: 'Konfliktas', rate_limited: 'Per dažnai – palaukite', internal: 'Vidinė klaida' }
  };
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDt(iso) { return iso ? dt.format(new Date(iso)) : '–'; }
  function fmtTime(iso) { return iso ? tm.format(new Date(iso)) : '–'; }
  function fmtLocalIso(s) { return s ? s.replace('T', ' ').slice(0, 16) : '–'; } // Vilniaus vietos ISO su offset -> "YYYY-MM-DD HH:MM"
  function fmtMoney(cents, cur) { return (cents / 100).toLocaleString('lt-LT', { style: 'currency', currency: (cur || 'eur').toUpperCase() }); }
  function fmtHours(min) { var m = Math.round(min), h = Math.floor(m / 60); return h + ' val. ' + String(m % 60).padStart(2, '0') + ' min'; }
  function shortId(id) { return id ? '…' + String(id).slice(-6) : '–'; }
  function badge(text, cls) { return '<span class="badge ' + (cls || '') + '">' + esc(text) + '</span>'; }
  function toast(msg, kind) {
    var host = document.getElementById('toasts'); if (!host) return;
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.setAttribute('role', kind === 'err' ? 'alert' : 'status'); t.textContent = msg; host.appendChild(t);
    setTimeout(function () { t.remove(); }, 5000);
  }
  var errHelp = { conflict: 'veiksmas jau atliktas arba šiuo metu negalimas (pvz., jau yra atviras prašymas šiam mokėjimui, užklausa uždaryta).', forbidden: 'šio veiksmo jūsų rolė atlikti negali.', rate_limited: 'per daug užklausų, bandykite po kelių sekundžių.', not_found: 'įrašas nerastas.' };
  /* Šakojamės pagal error.code (ne pagal tekstą); validacijos žinutę (invalid_request) rodome kaip API.md nurodo. */
  function errText(e) { return (L.errors[e.code] || 'Klaida') + ': ' + (e.code === 'invalid_request' ? e.message : (errHelp[e.code] || 'bandykite dar kartą.')); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  window.TikriUI = { L: L, esc: esc, fmtDt: fmtDt, fmtTime: fmtTime, fmtLocalIso: fmtLocalIso, fmtMoney: fmtMoney, fmtHours: fmtHours, shortId: shortId, badge: badge, toast: toast, errText: errText, $: $, $$: $$ };
})();
