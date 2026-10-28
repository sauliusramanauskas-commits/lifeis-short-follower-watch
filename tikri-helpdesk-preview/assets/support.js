/* Pagalbos darbuotojo (support) skydelis. Visi duomenys - tik per TikriApi (assets/api.js). */
(function () {
  'use strict';
  var A = window.TikriApi, U = window.TikriUI, L = U.L, esc = U.esc, $ = U.$, $$ = U.$$;
  A.setIdentity('support');
  var state = { tab: 'tickets', tStatus: 'open', rStatus: 'open', ticketId: null, reportId: null, busy: false };
  var beats = 0;

  window.addEventListener('tikri:heartbeat', function (e) { beats++; $('#hb').textContent = U.fmtTime(e.detail.server_time); $('#hbn').textContent = beats; });
  A.attachHeartbeat(); // click/key/scroll -> POST /api/admin/heartbeat (ne dažniau kaip kas 30 s)

  /** Kiekvienas darbuotojo veiksmas: pirma POST /api/admin/heartbeat, tada pats veiksmas; klaidos -> pranešimas. */
  async function act(fn) {
    try { await A.heartbeat(); return await fn(); }
    catch (e) { if (e && e.name === 'ApiError') { U.toast(U.errText(e), 'err'); return undefined; } throw e; }
  }

  // ------------------------------------------------------------------ dialogas
  function formDialog(o) {
    return new Promise(function (resolve) {
      var dlg = $('#dlg'), form = $('#dlg-form');
      form.innerHTML = '<h3>' + esc(o.title) + '</h3>' + (o.intro ? '<p class="hint">' + o.intro + '</p>' : '') +
        o.fields.map(function (f) {
          var id = 'f_' + f.name, req = f.required === false ? '' : ' required', c;
          if (f.type === 'textarea') c = '<textarea id="' + id + '" name="' + f.name + '"' + req + ' minlength="' + (f.min || 0) + '" maxlength="' + (f.max || 2000) + '">' + esc(f.value || '') + '</textarea>';
          else if (f.type === 'select') c = '<select id="' + id + '" name="' + f.name + '">' + f.options.map(function (op) { return '<option value="' + esc(op[0]) + '">' + esc(op[1]) + '</option>'; }).join('') + '</select>';
          else c = '<input id="' + id + '" name="' + f.name + '" type="' + (f.type || 'text') + '"' + req + (f.min !== undefined ? ' min="' + f.min + '"' : '') + (f.max !== undefined ? ' max="' + f.max + '"' : '') + ' value="' + esc(f.value === undefined ? '' : f.value) + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') + '>';
          return '<label for="' + id + '">' + esc(f.label) + '</label>' + c + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '');
        }).join('') +
        '<div class="row"><button type="submit" class="btn primary" data-testid="dlg-submit">' + esc(o.submit || 'Pateikti') + '</button><button type="button" class="btn" data-testid="dlg-cancel" id="dlg-cancel">Atšaukti</button></div>';
      var done = false;
      function finish(v) { if (done) return; done = true; if (dlg.open) dlg.close(); resolve(v); }
      form.onsubmit = function (ev) { ev.preventDefault(); if (!form.reportValidity()) return; var v = {}; o.fields.forEach(function (f) { v[f.name] = form.elements[f.name].value; }); finish(v); };
      $('#dlg-cancel').onclick = function () { finish(null); };
      dlg.oncancel = function () { finish(null); };
      dlg.showModal();
    });
  }

  // ------------------------------------------------------------------ skirtukai
  function showTab(tab) {
    state.tab = tab;
    $$('nav.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); });
    ['tickets', 'reports', 'refunds'].forEach(function (t) { $('#view-' + t).hidden = t !== tab; });
    if (tab === 'tickets') loadTickets(); if (tab === 'reports') loadReports(); if (tab === 'refunds') loadRefunds();
  }
  $$('nav.tabs button').forEach(function (b) { b.onclick = function () { act(function () { showTab(b.dataset.tab); }); }; });

  // ------------------------------------------------------------------ UŽKLAUSOS
  function chipsBind(sel, key, reload) {
    $$(sel + ' .chip').forEach(function (c) { c.onclick = function () { state[key] = c.dataset.status; $$(sel + ' .chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); }); act(reload); }; });
  }
  chipsBind('#ticket-filters', 'tStatus', function () { return loadTickets(); });
  chipsBind('#report-filters', 'rStatus', function () { return loadReports(); });

  async function loadTickets() {
    var r = await A.get('/api/admin/support/tickets?status=' + state.tStatus);
    var ul = $('#ticket-list');
    ul.innerHTML = r.tickets.length ? r.tickets.map(function (t) {
      return '<li tabindex="0" data-testid="ticket-row" data-id="' + t.id + '"' + (t.id === state.ticketId ? ' aria-current="true"' : '') + '><div class="t">' + esc(t.subject) + '</div><div class="m">' +
        U.badge(L.ticketStatus[t.status], t.status) + '<span>' + esc(L.category[t.category]) + '</span><span>' + U.fmtDt(t.created_at) + '</span><span>vartotojas ' + U.shortId(t.user_id) + '</span></div></li>';
    }).join('') : '<div class="empty">Užklausų nėra.</div>';
    $$('li', ul).forEach(function (li) { var go = function () { act(function () { return openTicket(li.dataset.id); }); }; li.onclick = go; li.onkeydown = function (e) { if (e.key === 'Enter') go(); }; });
  }

  async function openTicket(id) {
    state.ticketId = id;
    var t = await A.get('/api/admin/support/tickets/' + id);
    $$('#ticket-list li').forEach(function (li) { li.toggleAttribute('aria-current', li.dataset.id === id); });
    var box = $('#ticket-detail');
    box.innerHTML = '<div class="card" data-testid="ticket-detail"><h2>' + esc(t.subject) + '</h2><div class="row" style="margin:0 0 6px">' + U.badge(L.ticketStatus[t.status], t.status) + '<span class="hint">' + esc(L.category[t.category]) + ' · sukurta ' + U.fmtDt(t.created_at) + '</span></div>' +
      (t.category === 'account_deletion' ? '<div class="notice" style="margin:8px 0">Paskyros ištrynimo užklausa yra tik prašymas: pagalbos darbuotojas paskyrų <b>netrina</b>. Nurodykite vartotojui naudoti „Ištrinti paskyrą“ programėlėje arba palaukti administratoriaus.</div>' : '') +
      '<div class="msgs">' + t.messages.map(function (m) { return '<div class="msg ' + (m.from === 'staff' ? 'staff' : '') + '" data-testid="ticket-msg"><small>' + (m.from === 'staff' ? 'Pagalba' : 'Vartotojas') + ' · ' + U.fmtDt(m.created_at) + '</small>' + esc(m.body) + '</div>'; }).join('') + '</div>' +
      (t.status === 'closed' ? '<p class="hint">Užklausa uždaryta – atsakyti nebegalima.</p>' :
        '<label for="reply-text">Jūsų atsakymas</label><textarea id="reply-text" data-testid="reply-text" maxlength="4000" placeholder="Rašykite atsakymą vartotojui…"></textarea><div class="row"><button class="btn primary" id="reply-send" data-testid="reply-send">Atsakyti</button><button class="btn" id="ticket-close" data-testid="ticket-close">Uždaryti užklausą</button></div>') + '</div>' +
      '<div class="card" id="user-card" data-testid="user-card"><div class="empty">Kraunama vartotojo santrauka…</div></div>';
    var send = $('#reply-send');
    if (send) {
      send.onclick = function () { act(async function () {
        var body = $('#reply-text').value.trim(); if (!body) { U.toast('Parašykite atsakymą.', 'err'); return; }
        await A.post('/api/admin/support/tickets/' + id + '/reply', { body: body });
        U.toast('Atsakymas išsiųstas.', 'ok'); await openTicket(id); await loadTickets();
      }); };
      $('#ticket-close').onclick = function () { act(async function () { await A.post('/api/admin/support/tickets/' + id + '/close'); U.toast('Užklausa uždaryta.', 'ok'); await openTicket(id); await loadTickets(); }); };
    }
    await renderUserCard(t.user_id, t.id);
  }

  async function renderUserCard(userId, ticketId) {
    var u = await A.get('/api/admin/users/' + userId), b = await A.get('/api/admin/users/' + userId + '/billing');
    var susp = u.suspended_until && Date.parse(u.suspended_until) > Date.now();
    var canRefund = !!b.last_payment;
    $('#user-card').innerHTML = '<h3>Vartotojas ' + esc(u.profile ? u.profile.display_name : '(ištrintas)') + ' <span class="hint">' + U.shortId(u.id) + '</span></h3>' +
      '<dl class="kv"><dt>Būsena</dt><dd>' + esc(L.userState[u.state] || u.state) + (susp ? ' ' + U.badge('Užblokuotas iki ' + U.fmtDt(u.suspended_until), 'err') : '') + (u.profile && u.profile.hidden_by_moderation ? ' ' + U.badge('Profilis paslėptas', 'in_review') : '') + '</dd>' +
      '<dt>Registruotas</dt><dd>' + U.fmtDt(u.created_at) + '</dd><dt>Skundų dėl vartotojo</dt><dd>' + u.reports_about_user + '</dd><dt>Atviros užklausos</dt><dd>' + u.open_tickets + '</dd>' +
      '<dt>Planas</dt><dd>' + esc(L.plan[b.plan] || b.plan) + (b.billing_interval ? ' (' + esc(b.billing_interval) + ')' : '') + (b.founder ? ' · įkūrėjo kaina' : '') + '</dd>' +
      '<dt>Paskutinis mokėjimas</dt><dd>' + (b.last_payment ? U.fmtMoney(b.last_payment.amount_cents, b.last_payment.currency) + ' · ' + U.fmtDt(b.last_payment.paid_at) : 'nėra') + '</dd>' +
      '<dt>Grąžinimas</dt><dd>' + (b.refund ? esc(L.refundState[b.refund.state] || b.refund.state) : 'nepateikta') + '</dd></dl>' +
      '<div class="row"><button class="btn danger" id="block-open" data-testid="block-open">Blokuoti profilį (iki 30 d.)</button>' +
      '<button class="btn primary" id="refund-open" data-testid="refund-open"' + (canRefund ? '' : ' disabled') + '>Prašyti grąžinimo</button></div>' +
      '<div class="row"><button class="btn forbid" disabled title="Tik administratorius">Patvirtinti grąžinimą (tik administratorius)</button><button class="btn forbid" disabled title="Tik administratorius">Ištrinti paskyrą (tik administratorius)</button></div>' +
      '<p class="hint">Kortelės duomenų, el. pašto, jautrių profilio duomenų ir vietos čia nėra ir būti negali.</p>';
    $('#block-open').onclick = function () { act(function () { return blockDialog({ target_user: u.id, name: u.profile && u.profile.display_name, onDone: function () { return openTicket(ticketId); } }); }); };
    $('#refund-open').onclick = function () { act(function () { return refundDialog(u.id, b, ticketId); }); };
  }

  async function refundDialog(userId, b, ticketId) {
    var max = b.last_payment.amount_cents;
    var v = await formDialog({ title: 'Prašymas grąžinti pinigus', intro: 'Tai tik <b>prašymas</b>: pinigus grąžinti gali tik administratorius jį patvirtinęs. Daugiausia: ' + U.fmtMoney(max, b.last_payment.currency) + '.',
      fields: [{ name: 'reason', label: 'Priežastis (10–1000 simb.)', type: 'textarea', min: 10, max: 1000 }, { name: 'amount_cents', label: 'Suma centais (nebūtina; numatyta – visas paskutinis mokėjimas)', type: 'number', min: 1, max: max, required: false, placeholder: String(max) }], submit: 'Pateikti prašymą' });
    if (!v) return;
    var body = { user_id: userId, reason: v.reason.trim() }; if (v.amount_cents) body.amount_cents = Number(v.amount_cents); if (ticketId) body.ticket_id = ticketId;
    var r = await A.post('/api/admin/refunds', body);
    U.toast('Grąžinimo prašymas pateiktas (' + U.fmtMoney(r.amount_cents, r.currency) + '). Laukia administratoriaus.', 'ok');
    await renderUserCard(userId, ticketId);
  }

  /** "Blokuoti" = POST /api/admin/actions { action:'suspend', suspend_days <= 30 }. */
  async function blockDialog(o) {
    var v = await formDialog({ title: 'Blokuoti profilį' + (o.name ? ' „' + o.name + '“' : ''), intro: 'Laikinas blokavimas (suspend) – ne ilgiau kaip 30 dienų. Vartotojas gaus sprendimo pagrindimą (DSA 17 str.). Visam laikui uždrausti gali tik moderatorius ar administratorius.',
      fields: [{ name: 'suspend_days', label: 'Dienų skaičius (1–30)', type: 'number', min: 1, max: 30, value: 7 },
        { name: 'reason_text', label: 'Konkretūs faktai ir aplinkybės (min. 20 simb.)', type: 'textarea', min: 20, max: 2000 },
        { name: 'ground_type', label: 'Pagrindo tipas', type: 'select', options: [['tos', 'Naudojimo sąlygos (tos)'], ['law', 'Įstatymas (law)']] },
        { name: 'ground', label: 'Konkretus pagrindas (pvz., „Sąlygų 4.2 p.“)', type: 'text', min: 3, max: 300, value: 'Naudojimo sąlygų 4.2 p.' }], submit: 'Blokuoti' });
    if (!v) return;
    var days = Number(v.suspend_days); if (!(days >= 1 && days <= 30)) { U.toast('Dienų skaičius turi būti 1–30.', 'err'); return; }
    var body = { action: 'suspend', target_user: o.target_user, suspend_days: days, reason_text: v.reason_text.trim(), ground_type: v.ground_type, ground: v.ground.trim() };
    if (o.report_id) body.report_id = o.report_id;
    var r = await A.post('/api/admin/actions', body);
    U.toast('Profilis užblokuotas iki ' + U.fmtDt(r.suspend_until) + '.', 'ok');
    if (o.onDone) await o.onDone();
  }

  // ------------------------------------------------------------------ SKUNDAI
  async function loadReports() {
    var r = await A.get('/api/admin/reports?status=' + state.rStatus), ul = $('#report-list');
    ul.innerHTML = r.reports.length ? r.reports.map(function (x) {
      return '<li tabindex="0" data-testid="report-row" data-id="' + x.id + '"' + (x.id === state.reportId ? ' aria-current="true"' : '') + '><div class="t">' + esc(L.targetType[x.target_type]) + ': ' + esc(L.reason[x.reason] || x.reason) + '</div><div class="m">' +
        (x.priority === 'urgent' ? U.badge('Skubus', 'urgent') : '') + (x.overdue ? U.badge('Pavėluota', 'err') : '') + U.badge(L.reportStatus[x.status], x.status) + '<span>iki ' + U.fmtDt(x.sla_due_at) + '</span><span>vartotojas ' + (x.target_display_name ? esc(x.target_display_name) + ' ' : '') + U.shortId(x.target_user_id) + '</span></div></li>';
    }).join('') : '<div class="empty">Skundų nėra.</div>';
    $$('li', ul).forEach(function (li) { var go = function () { act(function () { return openReport(li.dataset.id); }); }; li.onclick = go; li.onkeydown = function (e) { if (e.key === 'Enter') go(); }; });
  }

  async function openReport(id) {
    state.reportId = id;
    var r = await A.get('/api/admin/reports/' + id);
    $$('#report-list li').forEach(function (li) { li.toggleAttribute('aria-current', li.dataset.id === id); });
    var open = r.status === 'open' || r.status === 'in_review', ev = '';
    /* API.md „Helpdesk response shapes“: evidence = null (vartotojo skundas) | [{seq,sender,kind,body,at}] (žinutė, iki 5) | {photo_id,status,mime,size_bytes,sha256,uploaded_at,note} (nuotrauka) */
    if (Array.isArray(r.evidence)) {
      ev = '<h3>Pokalbio įrodymai (tik skundžiama žinutė ir ankstesnės, iki 5)</h3><div class="evidence" data-testid="report-evidence">' + r.evidence.map(function (m) { return '<div class="e"><small class="hint">#' + m.seq + ' · ' + (m.sender === r.target_user_id ? 'Skundžiamasis' : 'Kitas dalyvis') + ' · ' + esc(m.kind) + ' · ' + U.fmtDt(m.at) + '</small><br>' + esc(m.body) + '</div>'; }).join('') + '</div>';
    } else if (r.evidence && typeof r.evidence === 'object') {
      var p = r.evidence;
      ev = '<h3>Nuotraukos duomenys</h3><dl class="kv" data-testid="report-photo-evidence"><dt>Nuotrauka</dt><dd>' + U.shortId(p.photo_id) + '</dd><dt>Būsena</dt><dd>' + esc(p.status) + '</dd><dt>Formatas / dydis</dt><dd>' + esc(p.mime) + ' · ' + Math.round(p.size_bytes / 1024) + ' KB</dd><dt>SHA-256</dt><dd style="word-break:break-all">' + esc(p.sha256) + '</dd><dt>Įkelta</dt><dd>' + U.fmtDt(p.uploaded_at) + '</dd>' + (p.note ? '<dt>Pastaba</dt><dd>' + esc(p.note) + '</dd>' : '') + '</dl><div class="row"><button class="btn" id="show-photo" data-testid="show-photo">Rodyti nuotrauką</button><span class="hint">Nuotrauka įkeliama tik paspaudus; peržiūra įrašoma į auditą.</span></div><div id="photo-box" data-testid="photo-box"></div>';
    } else ev = '<p class="hint">Pokalbiai šio skundo įrodymuose nepateikti, todėl nerodomi.</p>';
    $('#report-detail').innerHTML = '<div class="card" data-testid="report-detail"><h2>' + esc(L.targetType[r.target_type]) + ': ' + esc(L.reason[r.reason] || r.reason) + '</h2><div class="row" style="margin:0 0 6px">' + (r.priority === 'urgent' ? U.badge('Skubus (24 val.)', 'urgent') : U.badge('Įprastas (72 val.)')) + U.badge(L.reportStatus[r.status], r.status) + '<span class="hint">' + (r.source === 'auto' ? 'automatinis' : r.source === 'notice' ? 'DSA pranešimas' : 'vartotojo skundas') + ' · gauta ' + U.fmtDt(r.created_at) + ' · sprendimas iki ' + U.fmtDt(r.sla_due_at) + '</span></div>' +
      (r.details ? '<p>' + esc(r.details) + '</p>' : '') + ev +
      '<dl class="kv"><dt>Skundžiamas vartotojas</dt><dd>' + U.shortId(r.target_user_id) + '</dd><dt>Ankstesni veiksmai</dt><dd>' + (r.prior_actions.length ? r.prior_actions.map(function (a) { return esc(L.action[a.action] || a.action) + ' (' + U.fmtDt(a.created_at) + ')'; }).join('; ') : 'nėra') + '</dd>' + (r.outcome ? '<dt>Rezultatas</dt><dd>' + esc(L.action[r.outcome] || r.outcome) + '</dd>' : '') + '</dl>' +
      (open ? '<div class="row"><button class="btn" id="r-review" data-testid="r-review"' + (r.status === 'in_review' ? ' disabled' : '') + '>Pažymėti „Peržiūrima“</button><button class="btn" id="r-warn" data-testid="r-warn">Įspėti</button><button class="btn" id="r-hide" data-testid="r-hide">Paslėpti profilį</button><button class="btn danger" id="r-block" data-testid="r-block">Blokuoti (iki 30 d.)</button><button class="btn" id="r-dismiss" data-testid="r-dismiss">Atmesti skundą</button></div>' : '') +
      '<div class="row"><button class="btn forbid" disabled title="Tik moderatorius / administratorius">Uždrausti visam laikui (ne jums)</button></div></div>';
    if ($('#show-photo')) $('#show-photo').onclick = function () {
      act(async function () {
        var img = await A.getImageUrl('/api/photos/' + r.evidence.photo_id);
        $('#photo-box').innerHTML = '<img data-testid="report-photo-img" alt="Skundžiama nuotrauka" style="max-width:260px;max-height:340px;border-radius:8px;border:1px solid #e5e7eb" src="' + img.url + '">';
        $('#show-photo').disabled = true;
      });
    };
    if (!open) return;
    var reload = async function () { await openReport(id); await loadReports(); };
    $('#r-review').onclick = function () { act(async function () { await A.patch('/api/admin/reports/' + id, { status: 'in_review' }); U.toast('Skundas pažymėtas „Peržiūrima“.', 'ok'); await reload(); }); };
    $('#r-block').onclick = function () { act(function () { return blockDialog({ target_user: r.target_user_id, report_id: id, onDone: reload }); }); };
    [['r-warn', 'warn', 'Įspėti vartotoją'], ['r-hide', 'hide_content', 'Paslėpti profilį'], ['r-dismiss', 'dismiss', 'Atmesti skundą']].forEach(function (a) {
      $('#' + a[0]).onclick = function () { act(async function () {
        var v = await formDialog({ title: a[2], intro: 'Sprendimo pagrindimas bus išsiųstas vartotojui (DSA 17 str.).', fields: [{ name: 'reason_text', label: 'Konkretūs faktai ir aplinkybės (min. 20 simb.)', type: 'textarea', min: 20, max: 2000 }, { name: 'ground_type', label: 'Pagrindo tipas', type: 'select', options: [['tos', 'Naudojimo sąlygos (tos)'], ['law', 'Įstatymas (law)']] }, { name: 'ground', label: 'Konkretus pagrindas', type: 'text', min: 3, max: 300, value: 'Naudojimo sąlygų 4.2 p.' }], submit: 'Patvirtinti' });
        if (!v) return;
        await A.post('/api/admin/actions', { action: a[1], report_id: id, target_user: r.target_user_id, reason_text: v.reason_text.trim(), ground_type: v.ground_type, ground: v.ground.trim() });
        U.toast('Veiksmas atliktas: ' + L.action[a[1]] + '.', 'ok'); await reload();
      }); };
    });
  }

  // ------------------------------------------------------------------ GRĄŽINIMAI (tik mano prašymai)
  async function loadRefunds() {
    var r = await A.get('/api/admin/refunds?state=all&requested_by=' + encodeURIComponent(A.demo.currentStaffId()));
    var mine = r.refunds.slice().sort(function (a, b) { return a.requested_at < b.requested_at ? 1 : -1; });
    $('#refund-table tbody').innerHTML = mine.length ? mine.map(function (x) {
      return '<tr data-testid="refund-row"><td>' + U.fmtDt(x.requested_at) + '</td><td>' + U.shortId(x.user_id) + '</td><td>' + U.fmtMoney(x.amount_cents, x.currency) + '</td><td>' + esc(x.reason) + (x.decision_note ? '<div class="hint">Administratoriaus pastaba: ' + esc(x.decision_note) + '</div>' : '') + '</td><td>' + (x.ticket_id ? U.shortId(x.ticket_id) : '–') + '</td><td>' + U.badge(L.refundState[x.state] || x.state, x.state === 'processed' ? 'ok' : x.state === 'rejected' ? 'err' : 'open') + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="empty">Prašymų nėra.</td></tr>';
  }

  $('#reset-demo').onclick = function () { A.reset(); location.reload(); };
  act(function () { return loadTickets(); });
})();
