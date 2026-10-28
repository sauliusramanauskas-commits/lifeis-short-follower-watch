/* Administratoriaus (savininko) puslapis. Visi duomenys - tik per TikriApi (assets/api.js). */
(function () {
  'use strict';
  var A = window.TikriApi, U = window.TikriUI, L = U.L, esc = U.esc, $ = U.$, $$ = U.$$;
  A.setIdentity('admin');
  var names = A.demo.staffNames, nm = function (id) { return names[id] || U.shortId(id); };
  var group = 'day', ymd = new Intl.DateTimeFormat('en-CA', { timeZone: A.TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  var staffLoaded = false;

  A.attachHeartbeat();
  async function act(fn) {
    try { await A.heartbeat(); return await fn(); }
    catch (e) { if (e && e.name === 'ApiError') { U.toast(U.errText(e), 'err'); return undefined; } throw e; }
  }
  var todayStr = function () { return ymd.format(new Date()); };
  function shiftDay(s, d) { var p = s.split('-').map(Number), t = new Date(Date.UTC(p[0], p[1] - 1, p[2] + d)); return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0'); }
  function weekStart(s) { var p = s.split('-').map(Number), dn = (new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay() + 6) % 7; return shiftDay(s, -dn); }
  var qs = function (o) { return Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&'); };
  function filters() { return { staff_id: $('#f-staff').value, from: $('#f-from').value, to: $('#f-to').value, group: group }; }

  // ---------------------------------------------------------- "Dirba dabar"
  async function loadLive() {
    var r = await A.get('/api/admin/worktime/live'), support = r.staff.filter(function (s) { return s.role === 'support'; }), working = support.filter(function (s) { return s.status === 'working'; });
    $('#live').innerHTML = '<span class="live-title" data-testid="live-indicator" data-working="' + (working.length ? 'yes' : 'no') + '"><span class="dot ' + (working.length ? 'on' : '') + '"></span>' + (working.length ? 'Dirba dabar: ' + working.map(function (s) { return esc(nm(s.staff_id)); }).join(', ') : 'Dabar niekas nedirba') + '</span>' +
      r.staff.map(function (s) {
        return '<span class="pill" data-testid="live-staff" data-status="' + s.status + '"><span class="dot ' + (s.status === 'working' ? 'on' : '') + '"></span><b>' + esc(nm(s.staff_id)) + '</b> (' + esc(s.role) + ') · ' +
          (s.status === 'working' ? 'dirba ' + s.session_minutes.toFixed(0) + ' min. (sesija nuo ' + U.fmtTime(s.session_started_at) + ')' : 'neaktyvus ' + Math.max(1, Math.round(s.idle_for_s / 60)) + ' min. (paskutinis veiksmas ' + U.fmtDt(s.last_activity_at) + ')') + '</span>';
      }).join('') +
      '<span class="hint">Dirba = paskutinis veiksmas ne senesnis nei ' + r.idle_timeout_min + ' min. · <button class="btn" id="live-refresh" type="button">Atnaujinti</button></span>';
    $('#live-refresh').onclick = function () { act(loadLive); };
  }

  // ---------------------------------------------------------- suvestinės (šiandien / savaitė / mėnuo)
  async function loadStats() {
    var t = todayStr(), sid = $('#f-staff').value;
    var defs = [['Šiandien', 'day', t, t], ['Ši savaitė (nuo pirmadienio)', 'week', weekStart(t), t], ['Šis mėnuo', 'month', t.slice(0, 8) + '01', t]];
    var res = await Promise.all(defs.map(function (d) { return A.get('/api/admin/worktime?' + qs({ staff_id: sid, from: d[2], to: d[3], group: d[1] })); }));
    $('#stats').innerHTML = res.map(function (r, i) {
      return '<div class="stat" data-testid="stat-' + defs[i][1] + '"><div class="l">' + defs[i][0] + '</div><div class="v">' + U.fmtHours(r.total_minutes) + '</div><div class="l">' + r.sessions_count + ' sesij. · ' + defs[i][2] + (defs[i][2] === defs[i][3] ? '' : ' … ' + defs[i][3]) + '</div></div>';
    }).join('');
  }

  // ---------------------------------------------------------- ataskaita
  async function loadReport() {
    var f = filters(), r = await A.get('/api/admin/worktime?' + qs(f));
    if (!staffLoaded && !f.staff_id) { staffLoaded = true; r.per_staff.forEach(function (p) { var o = document.createElement('option'); o.value = p.staff_id; o.textContent = nm(p.staff_id) + ' (' + p.role + ')'; $('#f-staff').appendChild(o); }); }
    $('#total-line').textContent = 'Iš viso: ' + U.fmtHours(r.total_minutes) + ' (' + r.total_minutes.toFixed(2) + ' min.), ' + r.sessions_count + ' sesijų · ' + r.from + ' … ' + r.to + ' · zona ' + r.timezone + ' · prastova > ' + r.idle_timeout_min + ' min. neskaičiuojama';
    var max = Math.max.apply(null, r.periods.map(function (p) { return p.minutes; }).concat([1]));
    $('#periods tbody').innerHTML = r.periods.length ? r.periods.slice().reverse().map(function (p) {
      return '<tr data-testid="period-row"><td>' + esc(p.period) + '</td><td>' + esc(nm(p.staff_id)) + '</td><td class="num">' + U.fmtHours(p.minutes) + '</td><td><span class="bar" style="width:' + Math.round(p.minutes / max * 140) + 'px"></span></td><td class="num">' + p.sessions + '</td><td class="num">' + p.actions + '</td><td class="num">' + p.tickets_handled + '</td><td class="num">' + p.reports_handled + '</td></tr>';
    }).join('') : '<tr><td colspan="8" class="empty">Šiame laikotarpyje nėra duomenų.</td></tr>';
    $('#perstaff tbody').innerHTML = r.per_staff.map(function (p) { return '<tr><td>' + esc(nm(p.staff_id)) + '</td><td>' + esc(p.role) + '</td><td class="num">' + U.fmtHours(p.minutes) + '</td><td class="num">' + p.sessions + '</td><td class="num">' + p.actions + '</td><td class="num">' + p.tickets_handled + '</td><td class="num">' + p.reports_handled + '</td></tr>'; }).join('');
    $('#sessions tbody').innerHTML = r.sessions.slice().reverse().slice(0, 60).map(function (s) {
      return '<tr data-testid="session-row"><td>' + esc(nm(s.staff_id)) + '</td><td>' + U.fmtLocalIso(s.start) + '</td><td>' + U.fmtLocalIso(s.end) + '</td><td class="num">' + s.minutes.toFixed(2) + '</td><td class="num">' + s.action_count + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="empty">Sesijų nėra.</td></tr>';
  }

  // ---------------------------------------------------------- CSV
  async function downloadCsv(rows) {
    var r = await A.request('GET', '/api/admin/worktime.csv?' + qs({ staff_id: $('#f-staff').value, from: $('#f-from').value, to: $('#f-to').value, group: group, rows: rows }));
    var fn = (/filename="([^"]+)"/.exec(r.headers['content-disposition']) || [])[1] || 'worktime.csv';
    var blob = new Blob(['\ufeff' + r.data], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    U.toast('Atsisiųsta: ' + fn, 'ok'); await loadAudit();
  }

  // ---------------------------------------------------------- grąžinimai
  async function loadRefunds() {
    var r = await A.get('/api/admin/refunds?state=requested'), me = A.demo.currentStaffId();
    $('#refunds tbody').innerHTML = r.refunds.length ? r.refunds.map(function (x) {
      var own = x.requested_by === me;
      return '<tr data-testid="refund-row" data-id="' + x.id + '"><td>' + U.fmtDt(x.requested_at) + '</td><td>' + U.shortId(x.user_id) + '</td><td>' + U.fmtMoney(x.amount_cents, x.currency) + '</td><td>' + esc(x.reason) + (x.ticket_id ? '<div class="hint">užklausa ' + U.shortId(x.ticket_id) + '</div>' : '') + '</td><td>' + esc(nm(x.requested_by)) + '</td>' +
        '<td><input type="text" maxlength="500" placeholder="Pastaba (nebūtina)" aria-label="Pastaba" data-note></td><td style="white-space:nowrap">' +
        (own ? '<span class="hint">Savo prašymo spręsti negalima</span>' : '<button class="btn ok" data-approve>Patvirtinti</button> <button class="btn danger" data-reject>Atmesti</button>') + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty" data-testid="no-refunds">Laukiančių prašymų nėra.</td></tr>';
    $$('#refunds tr[data-id]').forEach(function (tr) {
      ['approve', 'reject'].forEach(function (d) {
        var b = tr.querySelector('[data-' + d + ']'); if (!b) return;
        b.onclick = function () { act(async function () {
          var note = tr.querySelector('[data-note]').value.trim(), body = { decision: d }; if (note) body.note = note;
          var res = await A.post('/api/admin/refunds/' + tr.dataset.id + '/decision', body);
          U.toast(d === 'approve' ? 'Grąžinimas patvirtintas ir įvykdytas (' + U.fmtMoney(res.amount_cents, res.currency) + ').' : 'Grąžinimo prašymas atmestas.', 'ok');
          await loadRefunds(); await loadAudit();
        }); };
      });
    });
  }

  // ---------------------------------------------------------- audito žurnalas
  async function loadAudit() {
    var r = await A.get('/api/admin/audit-log');
    $('#audit tbody').innerHTML = r.entries.slice(0, 80).map(function (e) {
      return '<tr data-testid="audit-row"><td>' + U.fmtDt(e.at) + '</td><td>' + esc(nm(e.actor)) + '</td><td>' + esc(L.audit[e.action] || e.action) + ' <span class="hint">' + esc(e.action) + '</span></td><td>' + (e.target ? U.shortId(e.target) : '–') + '</td><td>' + esc(e.detail || '') + '</td></tr>';
    }).join('');
  }

  async function loadAll() { await loadLive(); await loadStats(); await loadReport(); await loadRefunds(); await loadAudit(); }

  $('#f-from').value = shiftDay(todayStr(), -29); $('#f-to').value = todayStr();
  $$('#f-group button').forEach(function (b) { b.onclick = function () { group = b.dataset.g; $$('#f-group button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); act(loadReport); }; });
  $('#btn-refresh').onclick = function () { act(loadAll); };
  ['f-staff', 'f-from', 'f-to'].forEach(function (id) { $('#' + id).onchange = function () { act(async function () { await loadStats(); await loadReport(); }); }; });
  $('#csv-summary').onclick = function () { act(function () { return downloadCsv('summary'); }); };
  $('#csv-sessions').onclick = function () { act(function () { return downloadCsv('sessions'); }); };
  $('#reset-demo').onclick = function () { A.reset(); location.reload(); };
  // darbuotojo skydelis (kitas skirtukas) rašo į tą pačią localStorage -> atnaujinti "Dirba dabar" be papildomų užklausų
  var t = null; window.addEventListener('storage', function (e) { if (e.key !== A.STORE_KEY) return; clearTimeout(t); t = setTimeout(function () { loadLive().catch(function () {}); }, 300); });
  act(loadAll);
})();
