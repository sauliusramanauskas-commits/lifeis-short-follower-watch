/* Tikri – PERŽIŪRA (statinė PWA). Jokio serverio; duomenys tik šioje naršyklėje (localStorage). */
(function () {
  'use strict';
  var D = window.TIKRI_DATA, I = window.TIKRI_ICONS, C = window.TIKRI_CONFIG, PL = C.PLANS, LIM = C.LIMITS, Z = C.ZODIAC;
  var LS = 'tikri-preview-v2';
  var BANDS = ['<1 km', '1–2 km', '2–5 km', '5–10 km', '10+ km'];
  var FREE_LIMIT = LIM.freeProfilesPerDay;
  var CONTACT_UNLOCK = LIM.contactUnlockMessages; // po kiek žinučių iš abiejų pusių rodomos nuorodos/kontaktai
  var STEPS = 6;
  var ME_PHOTO = 'assets/img/me.webp';

  var defaults = {
    onboarded: false,
    user: { name: '', birth: '', gender: '', seeking: [], interests: [], verified: false, photo: false,
      consentTerms: false, consentSensitive: false, consentMarketing: false },
    premium: null, // null | 'premium' | 'plus' (tik demo)
    blocked: [], reported: [], likes: [], matches: [], swiped: {}, history: [], view: 'swipe',
    filters: { ageMin: 18, ageMax: 60, band: 4, seek: 'visų', verifiedOnly: false, interests: [], onlineOnly: false, goal: '', zodiacOnly: false },
    settings: { hideDistance: false, invisible: false, showAge: true, show_zodiac: true, notifications: true },
    chats: null, share: null, openerIdx: {}
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(a, b) { for (var k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; }
  function load() { try { return merge(clone(defaults), JSON.parse(localStorage.getItem(LS)) || {}); } catch (e) { return clone(defaults); } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* privatus režimas */ } }
  var S = load();
  if (!S.chats) { S.chats = clone(D.chats); }

  var app = document.getElementById('app');
  var tabbar = document.getElementById('tabbar');
  var sheetRoot = document.getElementById('sheet-root');
  var matchRoot = document.getElementById('match-root');

  /* ---------- pagalbinės ---------- */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function byId(id) { for (var i = 0; i < D.profiles.length; i++) if (D.profiles[i].id === id) return D.profiles[i]; return null; }
  function bandIdx(p) { return Math.max(0, BANDS.indexOf(p.distLabel)); }
  function isPremium() { return !!S.premium; }
  function isPlus() { return S.premium === 'plus'; }
  /* ---------- Zodiakas (pramogai) ---------- */
  function mySign() { return Z.signFor(S.user.birth); }
  function theirSign(p) { return p.show_zodiac && p.zodiac ? Z.byId(p.zodiac) : null; } /* null, jei paslėpė (show_zodiac: false) */
  function zodCompat(p) { var m = mySign(), t = theirSign(p); return m && t ? Z.compat(m.id, t.id) : null; } /* zodiac_compat: high | medium | low | null */
  function zodPct(p) { return Z.pct(zodCompat(p)); }
  function zodRank(p) { var c = zodCompat(p); return c ? Z.LEVELS[c].rank : 3; }
  function zodAllowed() { return !Z.plusOnlyFilter || isPlus(); }
  function zodFilterOn() { return zodAllowed() && S.filters.zodiacOnly && !!mySign(); }
  function zsym(sg) { return '<span class="zsym" aria-hidden="true">' + sg.sym + '</span>'; }
  function zchip(p) {
    var sg = theirSign(p); if (!sg) return '';
    var c = zodCompat(p), pc = Z.pct(c);
    return '<span class="zchip" data-testid="zchip" data-sign="' + sg.id + '"' + (c ? ' data-zcompat="' + c + '" data-zscore="' + pc + '"' : '') + '>' + zsym(sg) + '<span class="zn">' + esc(sg.name) + '</span>' + (c ? '<span class="zp">Zodiakas ' + pc + '%</span>' : '') + '</span>';
  }
  function eur(n) { return n ? n.toFixed(2).replace('.', ',') + ' €' : '0 €'; }
  function yearly() { return S.billing === 'year'; }
  function perMonth(n) { return (Math.round(n / 12 * 100) / 100); }
  function planLabel(id) { return PL[id] ? PL[id].name : ''; }
  function ageFrom(birth) {
    if (!birth) return null; var b = new Date(birth + 'T00:00:00'); if (isNaN(b)) return null;
    var n = new Date(), a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  function shared(p) { var mine = S.user.interests || []; return p.interests.filter(function (x) { return mine.indexOf(x) >= 0; }); }
  function matchPct(p) {
    var mine = S.user.interests || []; if (!mine.length) return 50;
    var s = shared(p).length, j = 0, i;
    for (i = 0; i < p.id.length; i++) j += p.id.charCodeAt(i);
    return Math.min(97, 38 + Math.round(55 * s / Math.min(mine.length, p.interests.length)) + (j % 7));
  }
  function hhmm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function when(t) { var diff = Date.now() - t; if (diff < 864e5) return hhmm(t); if (diff < 2 * 864e5) return 'vakar'; return Math.floor(diff / 864e5) + ' d.'; }
  function ic(name, size) { return I.svg(name, size); }
  function seeded(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function shuffleIn(arr, seed) { var r = seeded(seed), a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function src(f) { return 'assets/img/' + f + '.webp'; }
  function photo(p, i) { return '<img class="ph" src="' + src(p.photos[i || 0]) + '" alt="DI sugeneruota išgalvoto asmens nuotrauka – ' + esc(p.name) + '" loading="lazy" decoding="async" draggable="false">'; }
  var AI = '<span class="ai-tag">DI sugeneruota</span>';
  function meAvatar(cls) {
    return '<span class="avatar ' + (cls || '') + '">' + (S.user.photo ? '<img class="ph" src="' + ME_PHOTO + '" alt="Mano profilio nuotrauka (DI sugeneruotas pavyzdys)">' : '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--grad);color:var(--on-accent);font-weight:800;font-size:28px">' + esc((S.user.name || 'T').charAt(0).toUpperCase()) + '</span>') + '</span>';
  }
  function hydrate(root) {
    (root || document).querySelectorAll('img.ph:not(.in)').forEach(function (im) {
      if (im.complete) im.classList.add('in'); else { im.addEventListener('load', function () { im.classList.add('in'); }); im.addEventListener('error', function () { im.classList.add('in'); }); }
    });
  }
  function toast(msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function openSheet(html, onMount) {
    sheetRoot.innerHTML = '<div class="overlay" data-action="close-sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div></div>';
    if (onMount) onMount(sheetRoot.querySelector('.sheet'));
  }
  function closeSheet() { sheetRoot.innerHTML = ''; }
  function premiumNudge(what) {
    openSheet('<h2>' + esc(what) + ' – Premium funkcija</h2><p class="muted" style="margin-bottom:24px">Ši funkcija yra Premium ir Plus planuose. Mokėti nebūtina – nemokama versija leidžia kurti profilį, ieškoti ir rašyti su ribomis.</p>' +
      '<a class="btn block" href="#/premium" data-action="close-sheet">Peržiūrėti planus</a><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Ne dabar</button>');
  }
  function sw(name, checked, disabled) {
    return '<label class="switch"><input type="checkbox" data-switch="' + name + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span></span></label>';
  }
  function verifiedBadge(p) { return p.verified ? I.verified : ''; }
  function ensureChat(id) { var c = findChat(id); if (!c) { c = { id: id, unread: false, messages: [] }; S.chats.unshift(c); } return c; }
  function findChat(id) { for (var i = 0; i < S.chats.length; i++) if (S.chats[i].id === id) return S.chats[i]; return null; }

  /* ---------- Sveiki / registracija ---------- */
  function welcome() {
    var cp = function (id, cls) { var p = byId(id); return '<div class="pc ' + cls + '">' + skelImg(photo(p)) + '</div>'; };
    return { tabs: false, html:
      '<section class="welcome">' +
      '<div class="collage">' + cp('p13', 'c2') + cp('p3', 'c1') + cp('p2', 'c3') + '<span class="heart-b">' + I.fill('heart', 24) + '</span></div>' +
      '<div class="brand">' + I.logo + 'Tikri</div>' +
      '<h1><span>Tikri žmonės.</span><span>Tikri susitikimai.</span><span class="acc">Tavo privatumas – tavo.</span></h1>' +
      '<p class="lead">Patvirtinti profiliai, apytikslis atstumas vietoje tikslios vietos ir saugumo įrankiai pirmam pasimatymui.</p>' +
      '<a class="btn block" href="#/register/1" data-testid="start">Pradėti ' + ic('arrow') + '</a>' +
      (S.onboarded ? '<a class="textlink center" href="#/nearby">Tęsti kaip ' + esc(S.user.name || 'svečias') + '</a>' : '<button class="textlink" data-action="demo-skip">Praleisti registraciją (demo)</button>') +
      '<p class="age-note"><b>18+</b>Tik pilnamečiams. Amžių patikrinsime registruojantis.</p>' +
      '</section>' };
  }
  function skelImg(imgHtml) { return '<span class="skel" style="position:absolute;inset:0"></span>' + imgHtml; }

  function obShell(n, title, sub, body, foot) {
    return '<div class="ob"><div class="ob-top"><a class="icon-btn" href="' + (n === 1 ? '#/welcome' : '#/register/' + (n - 1)) + '" aria-label="Atgal">' + I.back + '</a>' +
      '<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="' + STEPS + '" aria-valuenow="' + n + '" aria-label="Žingsnis ' + n + ' iš ' + STEPS + '"><i style="width:' + ((n - 1) / STEPS * 100) + '%" data-to="' + (n / STEPS * 100) + '"></i></div><span class="step">' + n + '/' + STEPS + '</span></div>' +
      '<h1 class="ob-h">' + title + '</h1>' + (sub ? '<p class="ob-sub">' + sub + '</p>' : '') +
      '<div class="ob-body">' + body + '</div><div class="ob-foot"><div class="err" id="err" role="alert"></div>' + foot + '</div></div>';
  }

  var LT_MONTHS = ['sausis','vasaris','kovas','balandis','gegužė','birželis','liepa','rugpjūtis','rugsėjis','spalis','lapkritis','gruodis'];
  function daysIn(y, m) { return (y && m) ? new Date(+y, +m, 0).getDate() : 31; }
  function dayOpts(y, m, sel) { var h = '<option value="">Diena</option>', n = daysIn(y, m); for (var d = 1; d <= n; d++) h += '<option value="' + d + '"' + (+sel === d ? ' selected' : '') + '>' + d + '</option>'; return h; }
  function dobPicker(birth) {
    var p = (birth || '').split('-'), by = p[0] || '', bm = p[1] ? +p[1] : '', bd = p[2] ? +p[2] : '';
    var top = new Date().getFullYear() - 18, yo = '<option value="">Metai</option>', mo = '<option value="">Mėnuo</option>';
    for (var y = top; y >= top - 82; y--) yo += '<option value="' + y + '"' + (+by === y ? ' selected' : '') + '>' + y + '</option>';
    for (var i = 1; i <= 12; i++) mo += '<option value="' + i + '"' + (bm === i ? ' selected' : '') + '>' + LT_MONTHS[i - 1] + '</option>';
    return '<div class="field"><span>Gimimo data</span><div class="dob" role="group" aria-label="Gimimo data">' +
      '<select class="input" id="f-by" aria-label="Metai">' + yo + '</select>' +
      '<select class="input" id="f-bm" aria-label="Mėnuo">' + mo + '</select>' +
      '<select class="input" id="f-bd" aria-label="Diena">' + dayOpts(by, bm, bd) + '</select></div></div>';
  }
  function dobValue() {
    var y = document.getElementById('f-by').value, m = document.getElementById('f-bm').value, d = document.getElementById('f-bd').value;
    if (!y || !m || !d) return '';
    return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
  }
  document.addEventListener('change', function (e) {
    var id = e.target && e.target.id;
    if (id === 'f-by' || id === 'f-bm' || id === 'f-bd') { var er = document.getElementById('err'); if (er) er.textContent = ''; }
    if (id === 'f-by' || id === 'f-bm') {
      var y = document.getElementById('f-by').value, m = document.getElementById('f-bm').value, bd = document.getElementById('f-bd');
      var keep = Math.min(+bd.value || 0, daysIn(y, m)); bd.innerHTML = dayOpts(y, m, keep);
      if (id === 'f-by' && y && !m) document.getElementById('f-bm').focus();
      if (id === 'f-bm' && m && !bd.value) bd.focus();
    }
  });

  function register(m) {
    var n = +m[1], u = S.user, html = '';
    if (n === 1) {
      html = obShell(1, 'Susipažinkime', 'Kaip tave vadinti ir kada gimei?',
        '<label class="field"><span>Vardas (rodomas profilyje)</span><input class="input" id="f-name" maxlength="30" autocomplete="given-name" value="' + esc(u.name) + '" placeholder="pvz. Rasa"></label>' +
        dobPicker(u.birth) +
        '<p class="muted small">Tikri skirta tik 18+ metų žmonėms. Profilyje rodomas tik amžius metais ir zodiako ženklas, ne gimimo data.</p>',
        '<button class="btn block" data-action="step1">Toliau</button>');
    } else if (n === 2) {
      var g = function (v, l) { return '<button class="chip" data-gender="' + v + '" aria-pressed="' + (u.gender === v) + '">' + l + '</button>'; };
      var k = function (v, l) { return '<button class="chip" data-seek="' + v + '" aria-pressed="' + (u.seeking.indexOf(v) >= 0) + '">' + l + '</button>'; };
      html = obShell(2, 'Apie tave', '',
        '<h3>Aš esu</h3><div class="choice-grid">' + g('vyras', 'Vyras') + g('moteris', 'Moteris') + g('kita', 'Kita') + '</div>' +
        '<h3 style="margin-top:32px">Ieškau <span class="tag sage">neprivaloma</span></h3>' +
        '<p class="muted small" style="margin-bottom:16px">Gali pažymėti kelis. Tai jautrus duomuo (susijęs su orientacija), todėl jo nurodyti neprivalai – tada matysi visus.</p>' +
        '<div class="choice-grid">' + k('vyrų', 'Vyrų') + k('moterų', 'Moterų') + k('visų', 'Visų') + '</div>' +
        '<button class="btn ghost small" style="margin-top:16px" data-action="seek-none">Nenoriu nurodyti</button>',
        '<button class="btn block" data-action="step2">Toliau</button>');
    } else if (n === 3) {
      html = obShell(3, 'Tavo interesai', 'Pasirink bent 3. Pagal juos skaičiuojame atitikimą ir siūlome pokalbio pradžią.',
        '<div class="chips">' + D.INTERESTS.map(function (x) { return '<button class="chip" data-interest="' + esc(x) + '" aria-pressed="' + (u.interests.indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<p class="small muted" style="margin-top:16px">Pasirinkta: <b id="icount" style="color:var(--text)">' + u.interests.length + '</b></p>',
        '<button class="btn block" data-action="step3">Toliau</button>');
    } else if (n === 4) {
      html = obShell(4, 'Pridėk nuotrauką', 'Profiliai su aiškia nuotrauka sulaukia daugiau dėmesio.',
        (u.photo ? '<div class="photo-slot photo-main"><span class="skel" style="position:absolute;inset:0"></span><img class="ph" src="' + ME_PHOTO + '" alt="Pavyzdinė DI sugeneruota nuotrauka">' + AI + '</div>'
          : '<button class="photo-slot photo-main empty-s" data-action="photo-upload" data-testid="photo-upload">' + ic('upload') + 'Pasirink nuotrauką</button>') +
        '<div class="mini-slots"><div class="photo-slot">' + ic('plus') + '</div><div class="photo-slot">' + ic('plus') + '</div><div class="photo-slot">' + ic('plus') + '</div></div>' +
        '<div class="tips"><div>' + ic('check') + '<span>Aiškiai matomas veidas, geras apšvietimas.</span></div><div>' + ic('check') + '<span>Tik tu vienas(-a) – be kitų žmonių ir be kontaktų ant nuotraukos.</span></div><div>' + ic('shield') + '<span>Nuotraukas peržiūri moderatoriai. Netinkamos nepaskelbiamos.</span></div></div>' +
        '<div class="notice">' + ic('info') + '<span>Peržiūra: įkėlimas imituojamas – naudojame pavyzdinę DI sugeneruotą nuotrauką. Jokių failų niekur nesiunčiame.</span></div>',
        (u.photo ? '<button class="btn block" data-action="step4">Toliau</button>' : '<button class="btn block" data-action="photo-upload">' + ic('upload') + ' Įkelti nuotrauką</button><a class="textlink center" href="#/register/5">Pridėsiu vėliau</a>'));
    } else if (n === 5) {
      html = obShell(5, 'Patvirtink, kad tai tu', 'Padaryk vieną asmenukę – patvirtinti profiliai gauna ženkliuką ' + I.verified + '.',
        '<div class="selfie-stage' + (u.verified ? ' done' : '') + '" id="selfie-stage"><div class="selfie-frame' + (u.verified ? ' done' : '') + '" id="selfie"><span class="sil">' + ic('face') + '</span><img class="ph in" src="' + ME_PHOTO + '" alt=""><span class="scan"></span><span class="okb">' + ic('check') + '</span></div>' +
        '<svg class="ring-prog" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="50" rx="49" ry="49" pathLength="1000" vector-effect="non-scaling-stroke"/></svg><div class="corners"><i></i><i></i><i></i><i></i></div></div>' +
        '<p class="hint-pill ok" id="selfie-msg" role="status">' + (u.verified ? 'Profilis patvirtintas!' : '') + '</p>' +
        '<div class="card stack small" style="margin-top:16px"><p><b>Kaip tai veikia?</b> AI patikrina, ar tai gyvas žmogus ir ar veidas atitinka profilio nuotraukas. Asmenukė nerodoma kitiems ir ištrinama iškart po patikros. Veido šablonų nesaugome.</p>' +
        '<p><span class="tag">Peržiūra</span> <span class="muted">Šioje peržiūroje kamera neįjungiama – sėkmė tik imituojama.</span></p></div>',
        (u.verified ? '<a class="btn block" href="#/register/6">Toliau</a>' : '<button class="btn block" data-action="selfie">' + ic('camera') + ' Padaryti asmenukę</button><a class="textlink center" href="#/register/6">Patvirtinsiu vėliau</a>'));
    } else {
      var sensText = u.seeking.length
        ? 'Aiškiai sutinku, kad Tikri tvarkytų mano <b>jautrius duomenis</b> – <b>ką ieškau (susiję su orientacija)</b> ir <b>apytikslę vietą</b> (tik atstumo juosta) – vien tam, kad galėčiau matyti žmones šalia ir būti matomas(-a). Šiuos duomenis šifruojame, neperduodame reklamai ir AI. Sutikimą galiu bet kada atšaukti nustatymuose (BDAR 9 str. 2 d. a p.).'
        : 'Aiškiai sutinku, kad Tikri tvarkytų mano <b>apytikslę vietą</b> (tik atstumo juosta), kad galėčiau matyti žmones šalia ir būti matomas(-a). Orientacijos nenurodžiau – jos netvarkome. Sutikimą galiu bet kada atšaukti nustatymuose (BDAR 9 str. 2 d. a p.).';
      html = obShell(6, 'Sutikimai', 'Kiekvienas sutikimas atskiras. Jautrių duomenų sutikimas nėra „paslėptas“ taisyklėse.',
        '<label class="check"><input type="checkbox" id="c-terms"' + (u.consentTerms ? ' checked' : '') + '><span>Sutinku su <a href="#" data-action="terms">naudojimosi taisyklėmis</a> ir susipažinau su <a href="#" data-action="terms">privatumo politika</a>. Patvirtinu, kad man yra 18 ar daugiau metų.</span></label>' +
        '<label class="check sensitive"><input type="checkbox" id="c-sens"' + (u.consentSensitive ? ' checked' : '') + '><span>' + sensText + '</span></label>' +
        '<label class="check"><input type="checkbox" id="c-mkt"' + (u.consentMarketing ? ' checked' : '') + '><span><span class="tag sage">neprivaloma</span> Noriu gauti naujienas el. paštu (gali atsisakyti bet kada).</span></label>',
        '<button class="btn block" data-action="step5">Sukurti profilį</button>');
    }
    return { tabs: false, html: html, after: function () { var b = app.querySelector('.pbar i'); if (b) requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.width = b.dataset.to + '%'; }); }); } };
  }

  /* ---------- Šalia ---------- */
  function visibleProfiles() {
    var f = S.filters, prem = isPremium();
    return D.profiles.filter(function (p) {
      if (S.blocked.indexOf(p.id) >= 0) return false;
      if (p.age < f.ageMin || p.age > f.ageMax) return false;
      if (bandIdx(p) > f.band) return false;
      if (f.seek === 'vyrų' && p.gender !== 'vyras') return false;
      if (f.seek === 'moterų' && p.gender !== 'moteris') return false;
      if (f.verifiedOnly && !p.verified) return false;
      if (f.interests.length && !p.interests.some(function (x) { return f.interests.indexOf(x) >= 0; })) return false;
      if (prem && f.onlineOnly && !p.online) return false;
      if (prem && f.goal && p.goal !== f.goal) return false;
      if (zodFilterOn() && zodCompat(p) !== Z.minCompat) return false;
      return true;
    });
  }
  function activeFilterCount() {
    var f = S.filters, n = 0;
    if (f.ageMin !== 18 || f.ageMax !== 60) n++; if (f.band !== 4) n++; if (f.seek !== 'visų') n++;
    if (f.verifiedOnly) n++; if (f.interests.length) n++; if (isPremium() && (f.onlineOnly || f.goal)) n++;
    if (zodAllowed() && f.zodiacOnly) n++;
    return n;
  }
  // Tvarka: pagal atstumo juostas, tada pagal zodiako lygį, grupės viduje – sumaišyta (seed = diena), kad tvarka neišduotų tikslaus atstumo.
  function deck() {
    var list = visibleProfiles(), day = Math.floor(Date.now() / 864e5), shown = 0, hidden = 0;
    var limit = isPremium() ? Infinity : FREE_LIMIT, bands = [];
    BANDS.forEach(function (b, bi) {
      var inBand = shuffleIn(list.filter(function (p) { return bandIdx(p) === bi; }), day * 7 + bi + 1), items = [];
      inBand.sort(function (a, b) { return zodRank(a) - zodRank(b); }); /* kaip serveryje: juosta → zodiac_compat (high, medium, low, null) → sumaišyta (stabilus rikiavimas) */
      inBand.forEach(function (p) { if (shown < limit) { items.push(p); shown++; } else hidden++; });
      if (items.length) bands.push({ band: b, items: items });
    });
    return { bands: bands, hidden: hidden, total: list.length };
  }
  function pcard(p) {
    return '<a class="pcard" href="#/profile/' + p.id + '" data-testid="pcard"><span class="skel"></span>' + photo(p) + AI + (p.online ? '<span class="dot-online" title="Neseniai aktyvus(-i)"></span>' : '') + '<span class="shade"></span>' +
      '<span class="meta"><span class="nm">' + esc(p.name) + ', ' + p.age + verifiedBadge(p) + '</span>' +
      '<span class="sub"><span class="band">' + ic('near') + esc(p.distLabel) + '</span><span class="match-pct">' + matchPct(p) + '%</span></span>' + zchip(p) + '</span></a>';
  }
  function swCard(p, pos) {
    var sh = shared(p), goalTxt = { 'draugystė': 'Draugystė', 'pažintys': 'Pažintys', 'santykiai': 'Santykiai' }[p.goal];
    var photos = p.photos.map(function (f, i) { return '<div class="pw' + (i === 0 ? ' on' : '') + '"><span class="skel"></span>' + photo(p, i).replace('loading="lazy"', 'loading="eager"') + '</div>'; }).join('');
    var bars = p.photos.length > 1 ? '<div class="bars">' + p.photos.map(function (f, i) { return '<i class="' + (i === 0 ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '';
    var chips = (sh.length ? sh : p.interests).slice(0, 3).map(function (x) { return '<span class="pill' + (sh.indexOf(x) >= 0 ? ' hot' : '') + '">' + esc(x) + '</span>'; }).join('');
    return '<article class="scard' + (pos === 0 ? ' top' : ' n' + pos) + '" data-id="' + p.id + '" data-photo="0" data-testid="scard" aria-label="' + esc(p.name) + ', ' + p.age + '">' +
      '<div class="sc-photos">' + photos + '</div><div class="shade"></div>' + bars + AI +
      '<span class="stamp like">PATINKA</span><span class="stamp pass">PRALEISTI</span>' +
      '<div class="sc-info"><div class="sc-name">' + esc(p.name) + ' <span class="age">' + p.age + '</span>' + verifiedBadge(p) + '</div>' +
      '<div class="sc-meta"><span class="pill">' + ic('near', 14) + esc(p.distLabel) + '</span><span class="pill">' + esc(goalTxt) + '</span><span class="pill hot">' + matchPct(p) + '% atitikimas</span>' + zchip(p) + '</div>' +
      '<div class="sc-bio">' + esc(p.bio) + '</div><div class="sc-meta">' + chips + '</div></div></article>';
  }
  function stackList() { var d = deck(), all = []; d.bands.forEach(function (b) { all = all.concat(b.items); }); return { list: all.filter(function (p) { return !S.swiped[p.id]; }), hidden: d.hidden, total: all.length }; }
  function stageInner() {
    var s = stackList();
    if (!s.list.length) {
      var none = s.total === 0;
      return '<div class="empty"><div class="orb">' + ic(none ? 'sliders' : 'heart') + '</div>' +
        '<h2>' + (none ? 'Nieko neradome' : 'Šiandien viskas!') + '</h2>' +
        '<p>' + (none ? 'Pagal pasirinktus filtrus šalia nieko nėra. Pabandyk praplėsti paiešką.' : 'Peržiūrėjai visus šalia esančius žmones. Sugrįžk vėliau arba peržiūrėk dar kartą.') + '</p>' +
        (none ? '<button class="btn soft" data-action="reset-filters">Išvalyti filtrus</button>' : '<button class="btn soft" data-action="restart-deck" data-testid="restart-deck">' + ic('undo', 18) + ' Peržiūrėti iš naujo</button>') +
        (s.hidden ? '<p class="tiny">Dar ' + s.hidden + ' ' + (s.hidden === 1 ? 'žmogus' : 'žmonės') + ' šalia – Premium be ribų. <a class="link" href="#/premium">Plačiau</a></p>' : '') + '</div>';
    }
    return s.list.slice(0, 3).map(function (p, i) { return swCard(p, i); }).reverse().join('');
  }
  function nearby() {
    if (!S.user.consentSensitive) {
      return { tab: 'nearby', html: '<div class="topbar"><h1>Šalia tavęs</h1></div><div class="card stack"><h3>Paieška išjungta</h3><p class="muted">Atšaukei sutikimą tvarkyti apytikslę vietą, todėl šalia esančių žmonių nerodome ir tavęs niekas nemato.</p><a class="btn block" href="#/settings">Atnaujinti sutikimą</a></div>' };
    }
    var fc = activeFilterCount(), mode = S.view === 'grid' ? 'grid' : 'swipe';
    var head = '<div class="topbar"><div class="grow"><h1>Šalia tavęs</h1><span class="sub">Atstumas – tik apytikslėmis juostomis</span></div>' +
      '<button class="icon-btn" data-action="filters" aria-label="Filtrai" data-testid="filters">' + I.sliders + (fc ? '<span style="position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;border-radius:99px;background:var(--grad);color:var(--on-accent);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px">' + fc + '</span>' : '') + '</button></div>' +
      '<div class="seg" role="group" aria-label="Rodymo būdas"><button data-view="swipe" aria-pressed="' + (mode === 'swipe') + '" data-testid="view-swipe">' + ic('layers', 16) + 'Kortelės</button><button data-view="grid" aria-pressed="' + (mode === 'grid') + '" data-testid="view-grid">' + ic('grid', 16) + 'Tinklelis</button></div>';
    var skel = '<div class="topbar"><div class="grow"><h1>Šalia tavęs</h1></div></div>' + (mode === 'grid' ? '<div class="sk-grid"><div class="skel-box"></div><div class="skel-box"></div><div class="skel-box"></div><div class="skel-box"></div></div>' : '<div class="sk-card skel-box" style="height:60dvh"></div>');
    if (mode === 'swipe') {
      return { tab: 'nearby', mode: 'swipe', skel: skel, key: 'near', html: head +
        '<div class="stage" id="stage" data-testid="stage">' + stageInner() + '</div>' +
        '<div class="sw-ctrl" id="sw-ctrl"><button class="rbtn sm" data-action="undo" data-testid="btn-undo" aria-label="Atšaukti paskutinį">' + ic('undo') + '</button>' +
        '<button class="rbtn pass" data-action="swipe-pass" data-testid="btn-pass" aria-label="Praleisti">' + ic('close') + '</button>' +
        '<button class="rbtn like" data-action="swipe-like" data-testid="btn-like" aria-label="Patinka">' + ic('heart') + '</button>' +
        '<button class="rbtn sm" data-action="swipe-info" data-testid="btn-info" aria-label="Atidaryti profilį">' + ic('info') + '</button></div>' };
    }
    var d = deck(), html = '';
    d.bands.forEach(function (b) { html += '<h2 class="band-title">' + esc(b.band) + '</h2><div class="grid">' + b.items.map(pcard).join('') + '</div>'; });
    if (!d.total) html = '<div class="empty"><div class="orb">' + ic('sliders') + '</div><h2>Nieko neradome</h2><p>Pagal pasirinktus filtrus šalia nieko nėra. Pabandyk praplėsti paiešką.</p><button class="btn soft" data-action="reset-filters">Išvalyti filtrus</button></div>';
    if (d.hidden) html += '<div class="grid" style="margin-top:12px"><div class="locked-card">' + ic('lock', 24) + '<b>Dar ' + d.hidden + ' ' + (d.hidden === 1 ? 'žmogus' : 'žmonės') + ' šalia</b><span class="small">Nemokamai rodome iki ' + FREE_LIMIT + ' profilių per dieną. Premium – be ribų.</span><a class="btn small" href="#/premium">Plačiau apie Premium</a></div></div>';
    return { tab: 'nearby', skel: skel, key: 'near-grid', html: head +
      '<div class="notice">' + ic('shield') + '<span>Rodome tik apytikslį atstumą juostomis. Juostos viduje tvarka sumaišyta, todėl niekas negali atspėti tikslios tavo vietos.' + (S.settings.hideDistance ? ' <b>Tavo atstumas kitiems paslėptas.</b>' : '') + '</span></div>' + html };
  }

  function filtersSheet() {
    var f = S.filters, prem = isPremium();
    var seekChip = function (v, l) { return '<button class="chip" data-fseek="' + v + '" aria-pressed="' + (f.seek === v) + '">' + l + '</button>'; };
    var bandChip = function (i) { return '<button class="chip" data-fband="' + i + '" aria-pressed="' + (f.band === i) + '">' + (i === 4 ? 'Visi' : 'iki ' + BANDS[i].replace('<', '').replace(/^.*–/, '')) + '</button>'; };
    var goal = function (v, l) { return '<button class="chip' + (prem ? '' : ' locked') + '" data-fgoal="' + v + '" aria-pressed="' + (prem && f.goal === v) + '">' + (prem ? '' : ic('lock', 14)) + l + '</button>'; };
    openSheet(
      '<div class="row between"><h2 style="margin:0">Filtrai</h2><button class="icon-btn" data-action="close-sheet" aria-label="Uždaryti">' + I.close + '</button></div>' +
      '<section><h3>Amžius: <span id="age-lbl" style="color:var(--accent-hi)">' + f.ageMin + '–' + f.ageMax + '</span></h3>' +
      '<div class="range-row"><span class="small muted">nuo</span><input type="range" id="age-min" min="18" max="70" value="' + f.ageMin + '" aria-label="Amžius nuo"></div>' +
      '<div class="range-row"><span class="small muted">iki</span><input type="range" id="age-max" min="18" max="70" value="' + f.ageMax + '" aria-label="Amžius iki"></div></section>' +
      '<section><h3>Atstumas</h3><div class="chips">' + [0, 1, 2, 3, 4].map(bandChip).join('') + '</div><p class="tiny muted" style="margin-top:8px">Tik apytikslės juostos – tikslaus atstumo nėra.</p></section>' +
      '<section><h3>Ieško / rodyti</h3><div class="chips">' + seekChip('vyrų', 'Vyrus') + seekChip('moterų', 'Moteris') + seekChip('visų', 'Visus') + '</div></section>' +
      '<section><div class="switch-row"><span class="lbl">Tik patvirtinti profiliai<small>Su asmenukės patvirtinimu ' + I.verified + '</small></span>' + sw('f-verified', f.verifiedOnly) + '</div></section>' +
      '<section><h3>Interesai</h3><div class="chips">' + D.INTERESTS.map(function (x) { return '<button class="chip" data-finterest="' + esc(x) + '" aria-pressed="' + (f.interests.indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div></section>' +
      zodiacFilterSection() +
      '<section class="card" style="margin-top:24px"><div class="row between"><h3 style="margin:0">Išplėstiniai filtrai</h3>' + (prem ? '<span class="tag sage">Aktyvu</span>' : '<span class="tag">Premium</span>') + '</div>' +
      '<div class="switch-row"><span class="lbl">Tik neseniai aktyvūs</span>' + (prem ? sw('f-online', f.onlineOnly) : '<button class="chip locked" data-action="locked" data-what="Tik neseniai aktyvūs">' + ic('lock', 14) + '</button>') + '</div>' +
      '<p class="small" style="margin:8px 0"><b>Ko ieško</b></p><div class="chips">' + goal('draugystė', 'Draugystės') + goal('pažintys', 'Pažinčių') + goal('santykiai', 'Santykių') + '</div></section>' +
      '<div class="row" style="margin-top:24px"><button class="btn ghost" data-action="reset-filters">Išvalyti</button><button class="btn" style="flex:1" data-action="apply-filters" data-testid="apply-filters">Rodyti rezultatus</button></div>',
      function (el) {
        var mn = el.querySelector('#age-min'), mx = el.querySelector('#age-max'), lbl = el.querySelector('#age-lbl');
        function upd() { if (+mn.value > +mx.value) { if (this === mn) mx.value = mn.value; else mn.value = mx.value; } lbl.textContent = mn.value + '–' + mx.value; }
        mn.addEventListener('input', upd); mx.addEventListener('input', upd);
      });
    draft = clone(S.filters);
  }
  var draft = null;
  function zodiacFilterSection() {
    var f = S.filters, ok = zodAllowed(), m = mySign();
    var row = function (name, on, label, sub, lockedLabel, tid) {
      return '<div class="switch-row"><span class="lbl">' + (ok ? label : lockedLabel) + '<small>' + sub + '</small></span>' +
        (ok ? sw(name, on) : '<a class="chip locked" href="#/premium" data-testid="' + tid + '" aria-label="' + esc(lockedLabel) + '">' + ic('lock', 14) + '</a>') + '</div>';
    };
    return '<section class="card zfilter" style="margin-top:24px" data-testid="zodiac-filter"><div class="row between"><h3 style="margin:0">Zodiakas' + (m ? ' · ' + zsym(m) + esc(m.name) : '') + '</h3>' + (ok ? '<span class="tag sage">Plus</span>' : '<span class="tag gold">Plus</span>') + '</div>' +
      row('f-zodiac', f.zodiacOnly, 'Tik suderinami ženklai', 'Rodyti tik „' + Z.label('high') + '“ ženklus (' + Z.pct('high') + ' %). Paslėpę ženklą nerodomi.', 'Tik suderinami ženklai – su Plus', 'zodiac-locked') +
      '<p class="tiny muted" style="margin:8px 0 0">' + esc(Z.NOTE) + '</p></section>';
  }

  /* ---------- Profilis ---------- */
  function zodiacBlock(p) {
    var m = mySign(), t = theirSign(p);
    var side = function (sg, who) { return '<div class="zside"><span class="zbig">' + sg.sym + '</span><b>' + esc(sg.name) + '</b><small>' + esc(who) + ' · ' + Z.ELEMENTS[sg.el] + '</small></div>'; };
    var h = '<div class="sect"><h3>Zodiakas</h3><div class="zcard" data-testid="zodiac-card">';
    if (!t) return h + '<p class="zexp" data-testid="zodiac-explain">' + esc(p.name) + ' nerodo savo zodiako ženklo.</p><p class="tiny faint znote">' + esc(Z.NOTE) + '</p></div></div>';
    if (!m) return h + '<div class="zpair">' + side(t, p.name) + '</div><p class="zexp" data-testid="zodiac-explain">Gimimo datos nėra – suderinamumo neskaičiuojame.</p><p class="tiny faint znote">' + esc(Z.NOTE) + '</p></div></div>';
    var c = Z.compat(m.id, t.id);
    h += '<div class="zpair">' + side(m, 'Tu') + '<div class="zmid"><span class="zpct" data-testid="zodiac-pct">' + Z.pct(c) + '%</span><small>Zodiakas</small></div>' + side(t, p.name) + '</div>' +
      '<p class="zlabel" data-testid="zodiac-label">' + esc(Z.label(c)) + '</p>' +
      '<p class="zexp" data-testid="zodiac-explain">' + esc(Z.explain(m.id, t.id)) + '</p>';
    if (isPlus()) {
      var names = function (lv) { return Z.byLevel(m.id, lv).map(function (x) { return esc(x.name); }).join(', '); };
      h += '<p class="zmore" data-testid="zodiac-plus">' + ic('spark', 16) + '<span><b>Išsamiau:</b> tavo elementas – ' + Z.ELEMENTS[m.el] + ', ' + esc(p.name) + ' – ' + Z.ELEMENTS[t.el] + '.<br>' + esc(Z.label('high')) + ': ' + names('high') + '.<br>' + esc(Z.label('medium')) + ': ' + names('medium') + '.<br>' + esc(Z.label('low')) + ': ' + names('low') + '.</span></p>';
    } else {
      h += '<a class="zmore locked" href="#/premium" data-testid="zodiac-plus-locked">' + ic('lock', 16) + '<span>Išsamus zodiako suderinamumas – su Plus</span></a>';
    }
    return h + '<p class="tiny faint znote">' + esc(Z.NOTE) + '</p></div></div>';
  }

  function profile(m) {
    var p = byId(m[1]);
    if (!p) return { tab: 'nearby', html: '<p>Profilis nerastas.</p><a href="#/nearby">Atgal</a>' };
    if (S.blocked.indexOf(p.id) >= 0) return { tab: 'nearby', html: '<div class="topbar"><a class="icon-btn" href="#/nearby" aria-label="Atgal">' + I.back + '</a><h2>Užblokuota</h2></div><div class="card stack"><p>Šį žmogų užblokavai. Jūs vienas kito nematote paieškoje ir pokalbiuose.</p><button class="btn soft" data-action="unblock" data-id="' + p.id + '">Atblokuoti</button></div>' };
    var sh = shared(p), liked = S.likes.indexOf(p.id) >= 0;
    var goalTxt = { 'draugystė': 'Ieško draugystės', 'pažintys': 'Ieško pažinčių', 'santykiai': 'Ieško santykių' }[p.goal];
    var slides = p.photos.map(function (f, i) { return '<div class="car-slide"><span class="skel"></span>' + photo(p, i).replace('loading="lazy"', i ? 'loading="lazy"' : 'loading="eager"') + '</div>'; }).join('');
    var dots = p.photos.length > 1 ? '<div class="dots" data-testid="dots">' + p.photos.map(function (f, i) { return '<i class="' + (i === 0 ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '';
    var prompt = function (pr) { return '<div class="prompt"><div class="q">' + esc(pr[0]) + '</div><div class="a">' + esc(pr[1]) + '</div></div>'; };
    return { tab: 'nearby', noTabs: true, html:
      '<div class="pro"><div class="carousel"><div class="car-track" data-testid="carousel">' + slides + '</div>' +
      '<div class="nav"><a class="icon-btn glass" href="#/nearby" aria-label="Atgal">' + I.back + '</a><span class="pill hot" style="background:rgba(10,7,14,.5)">' + matchPct(p) + '% atitikimas</span></div>' + dots + AI + '</div>' +
      '<div class="pbody"><div class="pname">' + esc(p.name) + ' <span class="age">' + p.age + '</span>' + verifiedBadge(p) + '</div>' +
      '<div class="pjob">' + esc(p.job) + '</div>' +
      '<div class="facts"><span class="fact">' + ic('near') + esc(p.distLabel) + '</span><span class="fact">' + ic('heart') + esc(goalTxt) + '</span>' + (p.verified ? '<span class="fact ok-f">' + ic('shield') + 'Patvirtinta asmenuke</span>' : '<span class="fact">Dar nepatvirtinta</span>') + (p.online ? '<span class="fact"><span class="dot-online" style="width:8px;height:8px"></span>Neseniai aktyvus(-i)</span>' : '') + '</div>' +
      '<div class="sect"><h3>Apie mane</h3><p class="bio-t">' + esc(p.bio) + '</p></div>' +
      zodiacBlock(p) +
      prompt(p.prompts[0]) +
      '<div class="sect"><h3>Interesai</h3><div class="chips">' + p.interests.map(function (x) { return '<span class="chip static' + (sh.indexOf(x) >= 0 ? ' shared' : '') + '">' + (sh.indexOf(x) >= 0 ? ic('check', 14) : '') + esc(x) + '</span>'; }).join('') + '</div>' +
      (sh.length ? '<p class="small muted" style="margin-top:12px">Bendri interesai: ' + sh.length + '</p>' : '') + '</div>' +
      prompt(p.prompts[1]) +
      '<div class="second-row"><button class="btn ghost" data-action="block" data-id="' + p.id + '">' + ic('block', 18) + ' Blokuoti</button><button class="btn danger" data-action="report" data-id="' + p.id + '">' + ic('flag', 18) + ' Pranešti</button></div>' +
      '<p class="tiny faint center" style="margin-top:24px">Niekada nesiųsk pinigų ir kodų žmonėms, kurių nepažįsti. Įtartina? Spausk „Pranešti“.</p><div class="spacer-cta"></div></div></div>' +
      '<div class="cta-bar"><button class="rbtn" data-action="like" data-id="' + p.id + '" data-testid="profile-like" aria-label="Patinka" aria-pressed="' + liked + '" style="' + (liked ? 'color:var(--accent-hi)' : '') + '">' + (liked ? I.fill('heart') : ic('heart')) + '</button>' +
      '<button class="btn" data-action="write" data-id="' + p.id + '" data-testid="write">' + ic('chat', 20) + ' Rašyti</button></div>' };
  }

  /* ---------- Pokalbiai ---------- */
  function maskText(text, c, plain) {
    var safe = esc(text);
    if (contactsUnlocked(c)) return safe;
    return safe.replace(CONTACT_RE, plain ? '[paslėpta]' : '<span class="hidden-link" title="Paslėpta saugumo sumetimais">' + ic('lock', 12) + 'nuoroda / kontaktas paslėptas</span>');
  }
  function chats() {
    var list = S.chats.filter(function (c) { return S.blocked.indexOf(c.id) < 0 && byId(c.id); });
    var items = list.map(function (c) {
      var p = byId(c.id), last = c.messages[c.messages.length - 1];
      var lastTxt = last ? (last.from === 'me' ? 'Tu: ' : '') + maskText(last.text, c, true) : '<i>Naujas pokalbis – parašyk pirmas(-a)!</i>';
      return '<li class="' + (c.unread ? 'un' : '') + '"><a href="#/chat/' + c.id + '" data-testid="chat-item"><span class="avatar"><span class="skel" style="position:absolute;inset:0"></span>' + photo(p) + '</span><span class="txt"><b>' + esc(p.name) + '</b>' + verifiedBadge(p) + '<div class="last">' + lastTxt + '</div></span><span class="end"><span class="when">' + (last ? when(last.t) : '') + '</span>' + (c.unread ? '<span class="unread" aria-label="Neperskaityta"></span>' : '') + '</span></a></li>';
    }).join('');
    var ms = S.matches.filter(function (id) { return S.blocked.indexOf(id) < 0 && byId(id); });
    var stories = ms.length ? '<h3 class="eyebrow" style="margin-bottom:8px">Abipusis susidomėjimas</h3><div class="stories" data-testid="matches">' + ms.map(function (id) { var p = byId(id); return '<a href="#/chat/' + id + '"><span class="avatar lg ring"><span class="skel" style="position:absolute;inset:0"></span>' + photo(p) + '</span>' + esc(p.name) + '</a>'; }).join('') + '</div>' : '';
    return { tab: 'chats', key: 'chats', skel: '<div class="topbar"><h1>Pokalbiai</h1></div><div class="sk-list">' + '<div class="sk-row skel-box"></div>'.repeat(4) + '</div>', html: '<div class="topbar"><h1>Pokalbiai</h1></div>' + stories +
      (isPremium() ? '' : '<div class="notice gold">' + ic('info') + '<span>Nemokamai – iki ' + LIM.freeNewChatsPerDay + ' naujų pokalbių per dieną. Esami pokalbiai be ribų.</span></div>') +
      (items ? '<ul class="clist" style="margin-top:16px">' + items + '</ul>' : '<div class="empty" style="height:auto;padding:48px 0"><div class="orb">' + ic('chat') + '</div><h2>Kol kas pokalbių nėra</h2><p>Pažymėk, kas tau patinka – abipusis susidomėjimas atvers pokalbį.</p><a class="btn" href="#/nearby">Ieškoti šalia</a></div>') };
  }
  function counts(c) { var me = 0, them = 0; c.messages.forEach(function (m) { if (m.from === 'me') me++; else them++; }); return { me: me, them: them }; }
  function contactsUnlocked(c) { var k = counts(c); return k.me >= CONTACT_UNLOCK && k.them >= CONTACT_UNLOCK; }
  var CONTACT_RE = /((https?:\/\/|www\.)\S+|\b[\w-]+\.(lt|com|net|org|eu|io)\b\S*|\+?\d[\d\s-]{7,}\d|@[\w.]{3,})/gi;
  function convHtml(c, p, typing) {
    var lastMe = -1, i;
    c.messages.forEach(function (x, idx) { if (x.from === 'me') lastMe = idx; });
    var laterThem = function (idx) { for (var j = idx + 1; j < c.messages.length; j++) if (c.messages[j].from === 'them') return true; return false; };
    var h = c.messages.length ? '<div class="day">Šiandien</div>' : '';
    c.messages.forEach(function (x, idx) {
      var read = x.from === 'me' && (x.r || laterThem(idx));
      h += '<div class="msg ' + x.from + '">' + maskText(x.text, c) + '<span class="meta' + (read ? ' read' : '') + '">' + hhmm(x.t) + (x.from === 'me' ? (read ? ic('checks') : ic('check')) + '<span class="sr">' + (read ? 'Perskaityta' : 'Pristatyta') + '</span>' : '') + (x.from === 'me' && idx === lastMe ? ' <span>' + (read ? 'Perskaityta' : 'Pristatyta') + '</span>' : '') + '</span></div>';
    });
    if (!c.messages.length) h = '<div class="empty" style="height:auto;margin:auto;padding:24px"><div class="orb">' + ic('spark') + '</div><h2>Pasisveikink</h2><p>Bendri interesai: ' + (shared(p).map(esc).join(', ') || 'nėra') + '. Pabandyk pokalbio pradžią iš DI.</p></div>';
    if (typing) h += '<div class="typing" data-testid="typing" aria-label="' + esc(p.name) + ' rašo"><i></i><i></i><i></i></div>';
    return h;
  }
  function noteHtml(c, p) {
    var k = counts(c), un = contactsUnlocked(c);
    var bar = function (n) { var h = ''; for (var i = 0; i < CONTACT_UNLOCK; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return h; };
    return ic('shield', 20) + '<span>Kol abu neapsikeitėte bent ' + CONTACT_UNLOCK + ' žinutėmis, nuorodos, telefonai ir @vardai paslepiami' + (un ? ' – <b>dabar jau rodomi</b>.' : ' (jūs: ' + k.me + '/' + CONTACT_UNLOCK + ', ' + esc(p.name) + ': ' + k.them + '/' + CONTACT_UNLOCK + ').') + '</span>';
  }
  var typingFor = null;
  function chat(m) {
    var p = byId(m[1]); if (!p) return { tab: 'chats', html: '<p>Pokalbis nerastas.</p>' };
    var c = ensureChat(p.id);
    c.unread = false; save();
    var hasHidden = !contactsUnlocked(c) && c.messages.some(function (x) { CONTACT_RE.lastIndex = 0; return CONTACT_RE.test(x.text); });
    CONTACT_RE.lastIndex = 0;
    return { tab: 'chats', noTabs: true, chat: true, html:
      '<div class="chat-head"><a class="icon-btn" href="#/chats" aria-label="Atgal">' + I.back + '</a><a href="#/profile/' + p.id + '" class="who"><span class="avatar sm"><span class="skel" style="position:absolute;inset:0"></span>' + photo(p) + '</span><span><b>' + esc(p.name) + '</b>' + verifiedBadge(p) + '<span class="st">' + (p.online ? '<span class="dot-online"></span>Neseniai aktyvus(-i) · ' : '') + esc(p.distLabel) + '</span></span></a><button class="icon-btn" data-action="report" data-id="' + p.id + '" aria-label="Pranešti">' + I.flag + '</button></div>' +
      '<div class="conv" id="conv"><div class="safe-note" id="safe-note">' + noteHtml(c, p) + '</div>' + (hasHidden ? '<p class="tiny faint center" id="hid-note">Šiame pokalbyje yra paslėptų nuorodų ar kontaktų. Niekada nesek nepažįstamų nuorodų.</p>' : '') + '<div id="msgs" style="display:contents">' + convHtml(c, p, typingFor === p.id) + '</div></div>' +
      '<div class="composer"><button class="ai-btn" data-action="ai-opener" data-id="' + p.id + '" data-testid="ai-opener">' + ic('spark', 16) + ' Padėk pradėti pokalbį</button>' +
      '<form data-form="send" data-id="' + p.id + '"><label class="sr" for="msg-input">Žinutė</label><button type="button" class="icon-btn" data-action="attach" aria-label="Pridėti nuotrauką">' + ic('image') + '</button><input class="input" id="msg-input" autocomplete="off" maxlength="500" placeholder="Rašyk žinutę…"><button class="send-btn" aria-label="Siųsti" type="submit">' + ic('send') + '</button></form>' +
      '<p class="tiny">Pokalbių nuotraukos automatiškai ištrinamos po ' + LIM.chatPhotoDays + ' d. AI pasiūlymai naudoja tik interesus – ne žinutes.</p></div>',
      after: function () { var cv = document.getElementById('conv'); if (cv) { cv.style.scrollBehavior = 'auto'; cv.scrollTop = cv.scrollHeight; cv.style.scrollBehavior = ''; } } };
  }
  function refreshChat(id) {
    var p = byId(id), c = findChat(id), msgs = document.getElementById('msgs');
    if (!msgs || location.hash !== '#/chat/' + id || !c) return;
    msgs.innerHTML = convHtml(c, p, typingFor === id);
    var n = document.getElementById('safe-note'); if (n) n.innerHTML = noteHtml(c, p);
    var cv = document.getElementById('conv'); cv.scrollTop = cv.scrollHeight;
  }

  /* ---------- Mano profilis ---------- */
  function me() {
    var u = S.user, a = ageFrom(u.birth), prem = isPremium();
    var plan = S.premium ? planLabel(S.premium) : PL.free.name;
    var viewers = ['p7', 'p13', 'p10'].map(function (id) { var p = byId(id); return '<a class="avatar sm" href="' + (prem ? '#/profile/' + id : '#/premium') + '" title="' + (prem ? esc(p.name) : '') + '">' + photo(p) + '</a>'; }).join('');
    return { tab: 'me', html:
      '<div class="topbar"><h1>Mano profilis</h1><a class="icon-btn" href="#/settings" aria-label="Nustatymai" data-testid="settings-link">' + I.gear + '</a></div>' +
      '<div class="me-hero">' + meAvatar('lg ring') + '<div class="nm">' + esc(u.name || 'Tu') + (a ? ', ' + a : '') + (u.verified ? I.verified : '') + '</div>' +
      '<div class="small muted" style="margin:4px 0 12px">' + (u.gender ? esc(u.gender.charAt(0).toUpperCase() + u.gender.slice(1)) : '') + (u.seeking.length ? ' · ieško: ' + esc(u.seeking.join(', ')) : ' · orientacija nenurodyta') + '</div>' +
      '<span class="tag ' + (S.premium ? 'gold' : '') + '">' + esc(plan) + ' planas</span></div>' +
      (u.verified ? '' : '<div class="notice" style="margin-top:16px">' + ic('camera') + '<span>Profilis dar nepatvirtintas. <a class="link" href="#/register/5">Patvirtinti asmenuke</a></span></div>') +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">Interesai</h3><div class="chips">' + (u.interests.length ? u.interests.map(function (x) { return '<span class="chip static">' + esc(x) + '</span>'; }).join('') : '<span class="muted small">Nepasirinkta</span>') + '</div><a class="btn ghost small" style="margin-top:16px" href="#/register/3">Redaguoti</a></div>' +
      (mySign() ? '<div class="card zme" style="margin-top:16px" data-testid="my-sign"><div class="row" style="gap:16px"><span class="zbig">' + mySign().sym + '</span><div><h3 style="margin:0">Mano zodiako ženklas</h3><div class="zme-n" data-testid="my-sign-name">' + esc(mySign().name) + ' <span class="muted small">· ' + Z.ELEMENTS[mySign().el] + '</span></div></div></div><p class="small muted" style="margin:12px 0 0">Apskaičiuota automatiškai iš gimimo datos. ' + (S.settings.show_zodiac ? 'Kiti mato tavo ženklą.' : 'Tavo ženklo kiti nemato (galima keisti nustatymuose).') + ' ' + esc(Z.NOTE) + '</p></div>' : '') +
      '<div class="card" style="margin-top:16px"><div class="row between"><h3>' + ic('eye', 18) + ' Kas peržiūrėjo tave</h3>' + (prem ? '' : '<span class="tag">Premium</span>') + '</div>' +
      '<div class="row" style="margin-top:16px;gap:12px"><span class="row' + (prem ? '' : ' blur-row') + '" style="gap:12px">' + viewers + '</span><span class="small muted">3 per pastarąją savaitę</span></div>' +
      (prem ? '' : '<button class="btn soft small" style="margin-top:16px" data-action="locked" data-what="Kas peržiūrėjo tave">' + ic('lock', 16) + ' Pamatyti</button>') + '</div>' +
      '<ul class="menu" style="margin-top:16px">' +
      '<li><a href="#/safety" data-testid="safety-link">' + I.shield + '<span class="grow">Saugumas ir pasimatymai</span>' + (S.share ? '<span class="pulse"></span>' : '') + '<span class="chev">' + I.chevron + '</span></a></li>' +
      '<li><a href="#/premium">' + I.gem + '<span class="grow">Premium planai</span><span class="chev">' + I.chevron + '</span></a></li>' +
      '<li><a href="#/settings">' + I.gear + '<span class="grow">Nustatymai ir privatumas</span><span class="chev">' + I.chevron + '</span></a></li></ul>' };
  }

  function safety() {
    var sh = S.share, live = sh && sh.until > Date.now();
    if (sh && !live) { S.share = null; save(); }
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="Atgal">' + I.back + '</a><h1>Saugumas</h1></div>' +
      (live ? '<div class="card share-live stack" data-testid="share-live"><div class="row"><span class="pulse"></span><b>Dalijiesi vieta su ' + esc(sh.name) + '</b></div><p class="small" style="margin:0">' + esc(sh.name) + ' mato tavo vietą iki <b>' + hhmm(sh.until) + '</b>. Po to nuoroda nustoja veikti ir duomenys ištrinami. <span class="tag">Simuliacija</span></p><button class="btn sage block" data-action="share-stop">' + ic('check', 18) + ' Esu saugi(-us) – baigti dalintis</button></div>'
        : '<div class="card stack"><h2>' + ic('share', 22) + ' Pasidalink, kur esu, su draugu</h2><p class="muted small">Pirmam pasimatymui: sukursi laikiną nuorodą ir nusiųsi ją draugui. Tik jis matys tavo vietą ir tik ribotą laiką. Pasimatymo žmogus apie tai nesužino.</p>' +
          '<label class="field"><span>Draugo vardas</span><input class="input" id="s-name" maxlength="30" placeholder="pvz. Inga"></label>' +
          '<label class="field"><span>Kiek laiko dalintis</span><select class="input" id="s-dur"><option value="1">1 val.</option><option value="2" selected>2 val.</option><option value="3">3 val.</option><option value="4">4 val.</option></select></label>' +
          '<div class="err" id="err" role="alert"></div><button class="btn block" data-action="share-start" data-testid="share-start">Sukurti nuorodą ir pradėti</button><p class="tiny muted center" style="margin:0">Peržiūroje niekas nesiunčiama ir vieta nenaudojama.</p></div>') +
      '<div class="card" style="margin-top:16px"><div class="switch-row" style="padding:0"><span class="lbl"><b>' + ic('eyeOff', 18) + ' Nematomas režimas</b> ' + (isPremium() ? '' : '<span class="tag">Premium</span>') + '<small>Tavęs nesimato paieškoje „Šalia“ ir kiti nemato, kad peržiūrėjai jų profilį. Rašyti gali tik tiems, su kuriais jau kalbiesi.</small></span>' +
      (isPremium() ? sw('invisible', S.settings.invisible) : '<button class="chip locked" data-action="locked" data-what="Nematomas režimas" data-testid="invisible-locked">' + ic('lock', 14) + '</button>') + '</div></div>' +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">Patarimai pirmam pasimatymui</h3><ul class="small" style="padding-left:18px;line-height:1.8;margin:0 0 16px;color:var(--muted)"><li>Susitik viešoje vietoje.</li><li>Pasakyk draugui, kur ir su kuo eini.</li><li>Pasirūpink savo transportu namo.</li><li>Nesiųsk pinigų ir nesidalink kodais.</li></ul><a class="btn danger block" href="tel:112">' + ic('phone', 18) + ' Skubi pagalba: 112</a></div>' };
  }

  /* ---------- Premium ---------- */
  function premium() {
    var cur = S.premium;
    var li = function (t) { return '<li>' + ic('check', 18) + '<span>' + t + '</span></li>'; };
    var cell = function (v, pl) { return '<td' + (pl ? ' class="plus"' : '') + '>' + (v === true ? '<span class="yes">' + ic('check', 18) + '</span>' : v === false ? '<span class="no">—</span>' : v) + '</td>'; };
    var row = function (n, a, b, c) { return '<tr><td>' + n + '</td>' + cell(a) + cell(b) + cell(c, true) + '</tr>'; };
    var btn = function (plan, label) { return cur === plan ? '<button class="btn sage block" disabled>Aktyvus (demo)</button>' : '<button class="btn block' + (plan === 'premium' ? ' ghost' : '') + '" data-action="buy" data-plan="' + plan + '" data-testid="buy-' + plan + '">' + label + '</button>'; };
    var yr = yearly();
    var per = function (id) {
      var pl = PL[id];
      if (!yr) return eur(pl.price) + ' <small>/ ' + pl.days + ' d.</small>';
      var save = Math.round((pl.price * 12 - pl.yearPrice) * 100) / 100;
      return eur(pl.yearPrice) + ' <small>/ metams</small><span class="yr-note">' + eur(perMonth(pl.yearPrice)) + ' per mėn.</span>';
    };
    var badge = function (id) { if (!yr) return ''; var pl = PL[id]; return ' <span class="pill hot" data-testid="save-' + id + '">Sutaupai ' + eur(Math.round((pl.price * 12 - pl.yearPrice) * 100) / 100) + '</span>'; };
    return { tab: 'premium', html:
      '<div class="topbar"><div class="grow"><span class="eyebrow">Tikri ' + esc(PL.premium.name) + '</span><h1>Daugiau galimybių</h1></div></div>' +
      '<p class="muted">Tikri veikia ir nemokamai. Mokami planai tiesiog nuima ribas ir prideda papildomų funkcijų.</p>' +
      (cur ? '<div class="notice" style="margin-top:16px">' + ic('check') + '<span>Aktyvus demo planas: <b>' + planLabel(cur) + '</b>. <button class="link" data-action="cancel-sub">Atšaukti</button></span></div>' : '') +
      '<div class="billing" role="group" aria-label="Apmokėjimo laikotarpis"><div class="seg"><button data-action="billing" data-b="month" aria-pressed="' + !yr + '" data-testid="bill-month">Kas mėnesį</button><button data-action="billing" data-b="year" aria-pressed="' + yr + '" data-testid="bill-year">Metams</button></div>' + '' + '</div>' +
      '<div class="plans">' +
      '<div class="plan"><div class="nm"><h3>' + PL.free.name + '</h3></div><div class="price">' + eur(0) + '</div><ul>' + li('Profilis ir asmenukės patvirtinimas') + li('Paieška šalia – iki ' + FREE_LIMIT + ' profilių per dieną') + li('Pagrindiniai filtrai') + li('Pokalbiai – iki ' + LIM.freeNewChatsPerDay + ' naujų per dieną') + li('Visi saugumo įrankiai') + '</ul></div>' +
      '<div class="plan"><div class="nm"><h3>' + PL.premium.name + '</h3>' + badge('premium') + '</div><div class="price">' + per('premium') + '</div><ul>' + li('Neribota paieška ir visi filtrai') + li('Kas peržiūrėjo tave') + li('Nematomas režimas') + li('Jokių pokalbių ribų') + '</ul>' + btn('premium', 'Rinktis ' + PL.premium.name) + '</div>' +
      '<div class="plan hl"><span class="ribbon">Daugiausia galimybių</span><div class="nm"><h3>' + PL.plus.name + '</h3>' + badge('plus') + '</div><div class="price">' + per('plus') + '</div><ul>' + li('Viskas, kas yra ' + PL.premium.name) + li('AI atitikimo pasiūlymai pagal interesus') + li('Išsamus zodiako suderinamumas ir filtras pagal ženklą') + li('Profilio iškėlimas (boost) 1 kartą per savaitę') + li('Pirmenybė pagalbos tarnyboje') + '</ul>' + btn('plus', 'Rinktis ' + PL.plus.name) + '</div>' +
      '</div>' +
      '<h2 style="margin:40px 0 16px">Palyginimas</h2>' +
      '<div class="cmp-wrap"><table class="cmp"><thead><tr><th>Funkcija</th><th>Nemok.</th><th>' + PL.premium.name + '</th><th class="plus">' + PL.plus.name + '</th></tr></thead><tbody>' +
      row('Profilis, patvirtinimas', true, true, true) + row('Paieška šalia', 'iki ' + FREE_LIMIT + '/d.', 'be ribų', 'be ribų') + row('Išplėstiniai filtrai', false, true, true) +
      row('Nauji pokalbiai', LIM.freeNewChatsPerDay + '/d.', 'be ribų', 'be ribų') + row('Kas peržiūrėjo tave', false, true, true) + row('Nematomas režimas', false, true, true) +
      row('AI atitikimo pasiūlymai', false, false, true) + row('Zodiako filtras', false, false, true) + row('Iškėlimas (boost)', false, false, '1/sav.') + row('Saugumo įrankiai', true, true, true) +
      '</tbody></table></div>' +
      '<div class="card terms"><p><b>Kainos nurodytos ' + C.VAT_NOTE.replace('su PVM', 'su PVM') + '.</b> Prenumerata atsinaujina ' + (yr ? 'kas 12 mėn.' : 'kas ' + PL.premium.days + ' d.') + ', kol jos neatšauki.</p>' + (yr ? '<p><b>Mokama vieną kartą metams.</b> Per 14 dienų gali atsisakyti ir atgausi pinigus. Prenumeratą gali atšaukti bet kada vienu paspaudimu.</p>' : '') + '<p><b>Atšaukti gali bet kada</b> – nustatymuose, vienu paspaudimu. Planas veiks iki apmokėto laikotarpio pabaigos, papildomų mokesčių nėra.</p><p><b>Diskretiškai:</b> banko išraše matysi neutralų aprašą (pvz. „' + C.BANK_DESCRIPTOR + '“) – be žodžių „pažintys“ ar programėlės pavadinimo.</p><p class="faint">Peržiūroje mokėjimai neveikia: mygtukai tik įjungia demo planą, kad galėtum išbandyti funkcijas.</p></div>' };
  }

  function settings() {
    var st = S.settings, u = S.user;
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="Atgal">' + I.back + '</a><h1>Nustatymai</h1></div>' +
      '<h3 class="eyebrow" style="margin-bottom:8px">Privatumas</h3><div class="card" style="padding:0 16px">' +
      '<div class="switch-row"><span class="lbl">Slėpti mano atstumą<small>Kiti nematys net atstumo juostos.</small></span>' + sw('hideDistance', st.hideDistance) + '</div>' +
      '<div class="switch-row"><span class="lbl">Rodyti mano amžių</span>' + sw('showAge', st.showAge) + '</div>' +
      '<div class="switch-row"><span class="lbl">Rodyti mano zodiako ženklą<small>Išjungus kiti nemato tavo ženklo, bet tu matai jų.</small></span>' + sw('show_zodiac', st.show_zodiac) + '</div>' +
      '<div class="switch-row"><span class="lbl">Nematomas režimas ' + (isPremium() ? '' : '<span class="tag">Premium</span>') + '<small>Valdoma skiltyje „Saugumas“.</small></span>' + (isPremium() ? sw('invisible', st.invisible) : '<a class="chip locked" href="#/safety">' + ic('lock', 14) + '</a>') + '</div>' +
      '<div class="switch-row"><span class="lbl">Pranešimai</span>' + sw('notifications', st.notifications) + '</div></div>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">Sutikimai</h3><div class="card" style="padding:0 16px">' +
      '<div class="switch-row"><span class="lbl">Jautrūs duomenys (orientacija, apytikslė vieta)<small>Atšaukus – paieška „Šalia“ išjungiama ir šie duomenys ištrinami.</small></span>' + sw('consentSensitive', u.consentSensitive) + '</div>' +
      '<div class="switch-row"><span class="lbl">Naujienos el. paštu</span>' + sw('consentMarketing', u.consentMarketing) + '</div></div>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">Prenumerata</h3><div class="card row between"><span>' + (S.premium ? planLabel(S.premium) + ' (demo)' : PL.free.name + ' planas') + '</span>' + (S.premium ? '<button class="btn small ghost" data-action="cancel-sub">Atšaukti prenumeratą</button>' : '<a class="btn small soft" href="#/premium">Planai</a>') + '</div>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">Tavo duomenys</h3><ul class="menu">' +
      '<li><button data-action="export">' + I.download + '<span class="grow">Atsisiųsti mano duomenis (JSON)</span></button></li>' +
      '<li><button data-action="delete" class="danger" data-testid="delete">' + I.trash + '<span class="grow">Ištrinti paskyrą ir visus duomenis</span></button></li></ul>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">Apie</h3><div class="card stack" data-testid="about"><div class="row" style="gap:16px">' + I.logo.replace('class="logo"', 'class="logo" width="48" height="48"') + '<div><b>Tikri</b> · peržiūra v0.2<br><span class="small muted">Tikri žmonės. Tikri susitikimai. Tavo privatumas – tavo.</span></div></div>' +
      '<p class="small" style="margin:0"><b>Privatumas trumpai:</b> tikslios vietos nesaugome, rodome tik atstumo juostas; jautrūs duomenys šifruojami ir tvarkomi tik su tavo aiškiu sutikimu; duomenys saugomi ES.</p>' +
      '<p class="seller" style="margin:0">' + esc(C.SELLER) + '</p>' +
      '<p class="tiny muted" style="margin:0">Tai peržiūra su netikrais duomenimis. Profiliai, žinutės ir mokėjimai – netikri. Nuotraukos – DI sugeneruoti išgalvoti suaugę žmonės. Duomenys saugomi tik šioje naršyklėje.</p></div>' };
  }

  /* ---------- Maršrutai ---------- */
  var TABS = [['nearby', '#/nearby', 'near', 'Šalia'], ['chats', '#/chats', 'chat', 'Pokalbiai'], ['premium', '#/premium', 'gem', 'Premium'], ['me', '#/me', 'user', 'Profilis']];
  tabbar.innerHTML = TABS.map(function (t) { return '<a href="' + t[1] + '" data-tab="' + t[0] + '">' + (t[0] === 'chats' ? '<span class="badge" hidden></span>' : '') + ic(t[2], 24) + t[3] + '</a>'; }).join('');
  var routes = [
    [/^welcome$/, welcome], [/^register\/([1-6])$/, register], [/^nearby$/, nearby], [/^profile\/(p\d+)$/, profile],
    [/^chats$/, chats], [/^chat\/(p\d+)$/, chat], [/^me$/, me], [/^safety$/, safety], [/^premium$/, premium], [/^settings$/, settings]
  ];
  var seenSkel = {}, renderToken = 0;
  function mount(view) {
    app.innerHTML = view.html;
    var showTabs = view.tabs !== false && !view.noTabs;
    app.className = (showTabs ? '' : 'no-tabs') + (view.chat ? ' chat-page' : '');
    document.body.dataset.mode = view.mode || (view.chat ? 'chat' : '');
    tabbar.hidden = !showTabs;
    var links = tabbar.querySelectorAll('a');
    for (var j = 0; j < links.length; j++) { if (links[j].dataset.tab === view.tab) links[j].setAttribute('aria-current', 'page'); else links[j].removeAttribute('aria-current'); }
    updateBadge();
    hydrate(app);
    if (view.after) view.after();
    var h1 = app.querySelector('h1,h2'); document.title = (h1 ? h1.textContent.trim() + ' · ' : '') + 'Tikri – peržiūra';
  }
  function updateBadge() {
    var unread = S.chats.some(function (c) { return c.unread && S.blocked.indexOf(c.id) < 0; });
    tabbar.querySelector('[data-tab="chats"] .badge').hidden = !unread;
  }
  function render() {
    closeSheet(); matchRoot.innerHTML = '';
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) { location.replace('#/' + (S.onboarded ? 'nearby' : 'welcome')); return; }
    if (!S.onboarded && !/^(welcome|register)/.test(h)) { location.replace('#/welcome'); return; }
    var view = null;
    for (var i = 0; i < routes.length; i++) { var m = h.match(routes[i][0]); if (m) { view = routes[i][1](m); break; } }
    if (!view) { location.replace('#/' + (S.onboarded ? 'nearby' : 'welcome')); return; }
    var token = ++renderToken;
    window.scrollTo(0, 0);
    if (view.skel && !seenSkel[view.key]) {
      seenSkel[view.key] = true;
      mount({ html: view.skel, tab: view.tab, mode: view.mode });
      setTimeout(function () { if (token === renderToken) mount(view); }, 520);
      return;
    }
    mount(view);
  }

  function toggleArr(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function err(t) { var e = document.getElementById('err'); if (e) e.textContent = t; }

  /* ---------- Kortelių krūva: vilkimas, mygtukai, sutapimas ---------- */
  var busy = false;
  function stageEl() { return document.getElementById('stage'); }
  function topCard() { var s = stageEl(); return s ? s.querySelector('.scard.top') : null; }
  function setStamps(card, dx) {
    var k = Math.min(1, Math.abs(dx) / 90);
    card.querySelector('.stamp.like').style.opacity = dx > 0 ? k : 0;
    card.querySelector('.stamp.pass').style.opacity = dx < 0 ? k : 0;
  }
  function advanceStage() {
    var s = stageEl(); if (!s) return;
    var top = s.querySelector('.scard.top'); if (top) top.remove();
    var n1 = s.querySelector('.scard.n1'), n2 = s.querySelector('.scard.n2');
    if (n1) { n1.classList.remove('n1'); n1.classList.add('top'); }
    if (n2) { n2.classList.remove('n2'); n2.classList.add('n1'); }
    var st = stackList(), have = s.querySelectorAll('.scard').length;
    if (!st.list.length) { s.innerHTML = stageInner(); hydrate(s); return; }
    if (have < 3 && st.list[have]) { s.insertAdjacentHTML('afterbegin', swCard(st.list[have], have)); hydrate(s); }
  }
  function commitSwipe(id, dir) {
    S.swiped[id] = dir; S.history.push({ id: id, dir: dir });
    var p = byId(id), matched = false;
    if (dir === 'like') {
      if (S.likes.indexOf(id) < 0) S.likes.push(id);
      if (p.likesMe && S.matches.indexOf(id) < 0) { S.matches.push(id); ensureChat(id); matched = true; }
    }
    save();
    advanceStage();
    if (matched) showMatch(p);
  }
  function flyTop(dir) {
    var card = topCard(); if (!card || busy) return;
    busy = true;
    setStamps(card, dir === 'like' ? 120 : -120);
    card.classList.remove('dragging'); card.classList.add('fly');
    var sgn = dir === 'like' ? 1 : -1;
    requestAnimationFrame(function () { card.style.transform = 'translate(' + (sgn * 520) + 'px,-40px) rotate(' + (sgn * 26) + 'deg)'; card.style.opacity = '0'; });
    setTimeout(function () { busy = false; commitSwipe(card.dataset.id, dir); }, 330);
  }
  function zodiacMatch(p) {
    var m = mySign(), t = theirSign(p); if (!m || !t) return '';
    var c = Z.compat(m.id, t.id);
    return '<div class="zmatch" data-testid="match-zodiac"><span class="zm-s">' + zsym(m) + esc(m.name) + '</span><span class="zm-plus">+</span><span class="zm-s">' + zsym(t) + esc(t.name) + '</span><b>Zodiakas ' + Z.pct(c) + '% · ' + esc(Z.label(c)) + '</b></div><div class="zm-note">' + esc(Z.NOTE) + '</div>';
  }
  function showMatch(p) {
    matchRoot.innerHTML = '<div class="match-screen" role="dialog" aria-modal="true" aria-label="Abipusis susidomėjimas" data-testid="match-screen">' +
      '<div class="match-pair"><div class="match-photo a">' + (S.user.photo ? '<img class="ph in" src="' + ME_PHOTO + '" alt="">' : '') + '</div><div class="match-photo b"><img class="ph in" src="' + src(p.photos[0]) + '" alt="DI sugeneruota nuotrauka – ' + esc(p.name) + '"></div><span class="match-heart">' + ic('heart') + '</span></div>' +
      '<h1>Abipusis susidomėjimas!</h1>' + zodiacMatch(p) + '<p>Jūs su ' + esc(p.name) + ' vienas kitu susidomėjote. Pradėkite pokalbį – nuorodos ir kontaktai atsiras po ' + CONTACT_UNLOCK + ' žinučių iš abiejų pusių.</p>' +
      '<div class="actions"><button class="btn block" data-action="match-write" data-id="' + p.id + '" data-testid="match-write">' + ic('chat', 20) + ' Parašyti žinutę</button><button class="btn ghost block" data-action="match-close" data-testid="match-close">Tęsti naršymą</button></div></div>';
  }
  var drag = null;
  document.addEventListener('pointerdown', function (e) {
    var card = e.target.closest ? e.target.closest('.scard.top') : null;
    if (!card || busy || e.button > 0) return;
    drag = { card: card, x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: Date.now(), moved: false, id: e.pointerId };
    card.classList.add('dragging');
    try { card.setPointerCapture(e.pointerId); } catch (x) { /* */ }
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y;
    if (Math.abs(drag.dx) > 6 || Math.abs(drag.dy) > 6) drag.moved = true;
    drag.card.style.transform = 'translate(' + drag.dx + 'px,' + (drag.dy * 0.35) + 'px) rotate(' + (drag.dx / 16) + 'deg)';
    setStamps(drag.card, drag.dx);
    var n1 = stageEl().querySelector('.scard.n1');
    if (n1) { var k = Math.min(1, Math.abs(drag.dx) / 140); n1.style.transform = 'scale(' + (0.95 + 0.05 * k) + ') translateY(' + (14 - 14 * k) + 'px)'; n1.style.filter = 'brightness(' + (0.7 + 0.3 * k) + ')'; }
  });
  function endDrag(e, cancel) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null; var card = d.card;
    card.classList.remove('dragging');
    var n1 = stageEl() && stageEl().querySelector('.scard.n1'); if (n1) { n1.style.transform = ''; n1.style.filter = ''; }
    var dt = Math.max(1, Date.now() - d.t), vx = Math.abs(d.dx) / dt;
    if (!cancel && d.moved && (Math.abs(d.dx) > 110 || (vx > 0.6 && Math.abs(d.dx) > 40))) { flyTop(d.dx > 0 ? 'like' : 'pass'); return; }
    card.style.transform = ''; setStamps(card, 0);
    if (!cancel && !d.moved) {
      var r = card.getBoundingClientRect(), rx = (e.clientX - r.left) / r.width, ry = (e.clientY - r.top) / r.height;
      var p = byId(card.dataset.id);
      if (ry < 0.6 && p.photos.length > 1 && (rx < 0.33 || rx > 0.67)) {
        var i = +card.dataset.photo + (rx > 0.5 ? 1 : -1); i = (i + p.photos.length) % p.photos.length; card.dataset.photo = i;
        card.querySelectorAll('.pw').forEach(function (w, k) { w.classList.toggle('on', k === i); });
        card.querySelectorAll('.bars i').forEach(function (b, k) { b.classList.toggle('on', k === i); });
      } else location.hash = '#/profile/' + p.id;
    }
  }
  document.addEventListener('pointerup', function (e) { endDrag(e, false); });
  document.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  document.addEventListener('scroll', function (e) {
    var t = e.target; if (!t.classList || !t.classList.contains('car-track')) return;
    var i = Math.round(t.scrollLeft / t.clientWidth), ds = t.parentNode.querySelectorAll('.dots i');
    ds.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeSheet(); matchRoot.innerHTML = ''; }
    if (stageEl() && !sheetRoot.innerHTML && !matchRoot.innerHTML && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      if (e.key === 'ArrowRight') flyTop('like'); else if (e.key === 'ArrowLeft') flyTop('pass');
    }
  });

  /* ---------- Paspaudimai ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action],[data-gender],[data-seek],[data-interest],[data-fseek],[data-fband],[data-finterest],[data-fgoal],[data-view]');
    if (!t) return;
    var a = t.dataset.action, u = S.user;
    if (a === 'close-sheet-bg') { if (e.target === t) closeSheet(); return; }
    if (t.dataset.view) { S.view = t.dataset.view; save(); render(); return; }
    if (t.dataset.gender) { u.gender = t.dataset.gender; document.querySelectorAll('[data-gender]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); return; }
    if (t.dataset.seek) {
      var v = t.dataset.seek;
      if (v === 'visų') u.seeking = u.seeking.indexOf('visų') >= 0 ? [] : ['visų'];
      else { u.seeking = u.seeking.filter(function (x) { return x !== 'visų'; }); toggleArr(u.seeking, v); }
      document.querySelectorAll('[data-seek]').forEach(function (b) { b.setAttribute('aria-pressed', u.seeking.indexOf(b.dataset.seek) >= 0); }); return;
    }
    if (t.dataset.interest) { toggleArr(u.interests, t.dataset.interest); t.setAttribute('aria-pressed', u.interests.indexOf(t.dataset.interest) >= 0); document.getElementById('icount').textContent = u.interests.length; return; }
    if (t.dataset.fseek) { draft.seek = t.dataset.fseek; document.querySelectorAll('[data-fseek]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); return; }
    if (t.dataset.fband) { draft.band = +t.dataset.fband; document.querySelectorAll('[data-fband]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); return; }
    if (t.dataset.finterest) { toggleArr(draft.interests, t.dataset.finterest); t.setAttribute('aria-pressed', draft.interests.indexOf(t.dataset.finterest) >= 0); return; }
    if (t.dataset.fgoal) { if (!isPremium()) { premiumNudge('Filtras „Ko ieško“'); return; } draft.goal = draft.goal === t.dataset.fgoal ? '' : t.dataset.fgoal; document.querySelectorAll('[data-fgoal]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.fgoal === draft.goal); }); return; }

    switch (a) {
      case 'close-sheet': closeSheet(); break;
      case 'terms': e.preventDefault();
        openSheet('<h2>Taisyklės ir privatumas (santrauka)</h2><ul class="small" style="padding-left:18px;line-height:1.8;margin:16px 0;color:var(--muted)"><li>Tik 18+ metų žmonės, vienas žmogus – viena paskyra.</li><li>Draudžiama apsimetinėti, priekabiauti, prašyti pinigų, siųsti nepageidaujamą intymų turinį.</li><li>Tiksli vieta nesaugoma – rodoma tik atstumo juosta.</li><li>Jautrūs duomenys tvarkomi tik su atskiru, aiškiu sutikimu ir saugomi ES.</li><li>Duomenis gali atsisiųsti arba ištrinti bet kada nustatymuose.</li></ul><p class="tiny muted" style="margin-bottom:24px">Peržiūra: pilni tekstai bus paskelbti prieš paleidimą.</p><button class="btn block" data-action="close-sheet">Supratau</button>'); break;
      case 'demo-skip':
        merge(S.user, { name: 'Svečias', birth: '1995-05-05', gender: 'kita', seeking: ['visų'], interests: ['Kava', 'Kelionės', 'Muzika', 'Knygos'], verified: true, photo: true, consentTerms: true, consentSensitive: true });
        S.onboarded = true; save(); location.hash = '#/nearby'; break;
      case 'step1': {
        var name = document.getElementById('f-name').value.trim(), birth = dobValue(), age = ageFrom(birth);
        if (!name) return err('Įvesk vardą.');
        if (age === null) return err('Įvesk gimimo datą.');
        if (age < 18) return err('Atsiprašome – Tikri skirta tik 18 metų ir vyresniems žmonėms.');
        if (age > 100) return err('Patikrink gimimo datą.');
        u.name = name; u.birth = birth; save(); location.hash = '#/register/2'; break;
      }
      case 'seek-none': u.seeking = []; document.querySelectorAll('[data-seek]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); toast('Gerai – orientacijos nenurodysi, matysi visus.'); break;
      case 'step2': if (!u.gender) return err('Pasirink, kas esi.'); save(); location.hash = '#/register/3'; break;
      case 'step3': if (u.interests.length < 3) return err('Pasirink bent 3 interesus.'); save(); location.hash = '#/register/4'; break;
      case 'photo-upload': {
        t.disabled = true; t.innerHTML = ic('clock', 18) + ' Keliama…';
        setTimeout(function () { u.photo = true; save(); render(); toast('Nuotrauka įkelta (imitacija).'); }, 700); break;
      }
      case 'step4': save(); location.hash = '#/register/5'; break;
      case 'selfie': {
        var fr = document.getElementById('selfie'), stg = document.getElementById('selfie-stage'), msg = document.getElementById('selfie-msg');
        t.disabled = true; fr.classList.add('scanning'); stg.classList.add('scanning'); msg.className = 'hint-pill muted'; msg.textContent = 'Tikriname… (imituojama)';
        setTimeout(function () {
          u.verified = true; save(); fr.classList.remove('scanning'); stg.classList.remove('scanning'); fr.classList.add('done'); stg.classList.add('done');
          msg.className = 'hint-pill ok'; msg.textContent = 'Profilis patvirtintas!';
          t.outerHTML = '<a class="btn block" href="#/register/6">Toliau</a>';
          var sk = document.querySelector('.ob-foot .textlink'); if (sk) sk.remove();
          toast('Profilis patvirtintas');
        }, 2100); break;
      }
      case 'step5': {
        var ct = document.getElementById('c-terms').checked, cs = document.getElementById('c-sens').checked;
        u.consentMarketing = document.getElementById('c-mkt').checked;
        if (!ct) return err('Reikia sutikti su taisyklėmis.');
        if (!cs) return err('Be šio sutikimo negalime rodyti žmonių šalia. Jį galėsi atšaukti bet kada.');
        u.consentTerms = true; u.consentSensitive = true;
        if (!u.seeking.length) S.filters.seek = 'visų';
        else if (u.seeking.length === 1) S.filters.seek = u.seeking[0];
        S.onboarded = true; save(); location.hash = '#/nearby'; toast('Sveiki atvykę į Tikri!'); break;
      }
      case 'filters': filtersSheet(); break;
      case 'apply-filters': {
        draft.ageMin = +document.getElementById('age-min').value; draft.ageMax = +document.getElementById('age-max').value;
        var vs = document.querySelector('[data-switch="f-verified"]'); draft.verifiedOnly = vs.checked;
        var os = document.querySelector('[data-switch="f-online"]'); if (os) draft.onlineOnly = os.checked;
        var zs = document.querySelector('[data-switch="f-zodiac"]'); if (zs && zodAllowed()) draft.zodiacOnly = zs.checked;
        S.filters = draft; save(); render(); break;
      }
      case 'reset-filters': S.filters = clone(defaults.filters); save(); render(); break;
      case 'locked': premiumNudge(t.dataset.what || 'Ši funkcija'); break;
      case 'swipe-like': flyTop('like'); break;
      case 'swipe-pass': flyTop('pass'); break;
      case 'swipe-info': { var tc = topCard(); if (tc) location.hash = '#/profile/' + tc.dataset.id; break; }
      case 'undo': {
        var hst = S.history.pop(); if (!hst) { toast('Nėra ką atšaukti.'); break; }
        delete S.swiped[hst.id]; if (hst.dir === 'like') S.likes = S.likes.filter(function (x) { return x !== hst.id; });
        save(); var stg2 = stageEl(); if (stg2) { stg2.innerHTML = stageInner(); hydrate(stg2); } break;
      }
      case 'restart-deck': S.swiped = {}; S.history = []; save(); render(); break;
      case 'like': {
        var id = t.dataset.id, pr = byId(id);
        if (S.likes.indexOf(id) >= 0) { S.likes = S.likes.filter(function (x) { return x !== id; }); save(); render(); toast('Patiktukas atšauktas.'); break; }
        S.likes.push(id); var mt = pr.likesMe && S.matches.indexOf(id) < 0; if (mt) { S.matches.push(id); ensureChat(id); } save();
        t.setAttribute('aria-pressed', 'true'); t.style.color = 'var(--accent-hi)'; t.innerHTML = I.fill('heart');
        if (mt) showMatch(pr); else toast('Pažymėta. Jei ' + pr.name + ' taip pat susidomės – gausite pranešimą.'); break;
      }
      case 'match-close': matchRoot.innerHTML = ''; break;
      case 'match-write': matchRoot.innerHTML = ''; location.hash = '#/chat/' + t.dataset.id; break;
      case 'write': location.hash = '#/chat/' + t.dataset.id; break;
      case 'attach': toast('Peržiūroje nuotraukų siuntimas išjungtas. Tikroje programėlėje pokalbių nuotraukos ištrinamos po ' + LIM.chatPhotoDays + ' d.'); break;
      case 'block': {
        var bp = byId(t.dataset.id);
        openSheet('<h2>Blokuoti ' + esc(bp.name) + '?</h2><p class="muted" style="margin-bottom:24px">Jūs nebematysite vienas kito paieškoje, pokalbiuose ir peržiūrose. ' + esc(bp.name) + ' apie tai nebus informuotas(-a).</p><button class="btn block" data-action="block-yes" data-id="' + bp.id + '" data-testid="block-yes">Blokuoti</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      }
      case 'block-yes': if (S.blocked.indexOf(t.dataset.id) < 0) S.blocked.push(t.dataset.id); save(); closeSheet(); toast('Užblokuota.'); location.hash = '#/nearby'; break;
      case 'unblock': S.blocked = S.blocked.filter(function (x) { return x !== t.dataset.id; }); save(); render(); toast('Atblokuota.'); break;
      case 'report': {
        var rp = byId(t.dataset.id), reasons = ['Netikras profilis / apsimetinėjimas', 'Nepilnametis(-ė)', 'Įžeidinėjimas ar priekabiavimas', 'Sukčiavimas, prašo pinigų', 'Nepageidaujamas intymus turinys', 'Kita'];
        openSheet('<h2>Pranešti apie ' + esc(rp.name) + '</h2><p class="muted small" style="margin-bottom:16px">Pranešimą peržiūri žmogus iš moderatorių komandos. Apie sprendimą informuosime. ' + esc(rp.name) + ' nesužinos, kas pranešė.</p>' +
          reasons.map(function (r, i) { return '<label class="check"><input type="radio" name="reason" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + r + '</span></label>'; }).join('') +
          '<label class="check"><input type="checkbox" id="r-block" checked><span>Taip pat užblokuoti</span></label>' +
          '<button class="btn danger block" style="margin-top:16px" data-action="report-yes" data-id="' + rp.id + '" data-testid="report-yes">Siųsti pranešimą</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      }
      case 'report-yes': {
        S.reported.push(t.dataset.id);
        var alsoBlock = document.getElementById('r-block').checked;
        if (alsoBlock && S.blocked.indexOf(t.dataset.id) < 0) S.blocked.push(t.dataset.id);
        save(); closeSheet(); toast('Ačiū. Pranešimas gautas (peržiūra – niekur nesiunčiama).');
        if (alsoBlock) location.hash = '#/nearby'; break;
      }
      case 'ai-opener': {
        var op = byId(t.dataset.id), shr = shared(op), pool = [];
        (shr.length ? shr : op.interests).forEach(function (x) { pool = pool.concat(D.openers[x] || []); });
        if (!pool.length) pool = D.openers._;
        var idx = (S.openerIdx[op.id] || 0) % pool.length; S.openerIdx[op.id] = idx + 1; save();
        var inp = document.getElementById('msg-input'); inp.value = pool[idx]; inp.focus();
        toast(shr.length ? 'Pasiūlymas pagal bendrą interesą. Gali redaguoti.' : 'Bendrų interesų nėra – pasiūlymas pagal jo/jos interesus.'); break;
      }
      case 'share-start': {
        var sn = document.getElementById('s-name').value.trim(); if (!sn) return err('Įvesk draugo vardą.');
        S.share = { name: sn, until: Date.now() + (+document.getElementById('s-dur').value) * 36e5 }; save(); render(); toast('Nuoroda sukurta (simuliacija).'); break;
      }
      case 'share-stop': S.share = null; save(); render(); toast('Dalijimasis baigtas, duomenys ištrinti.'); break;
      case 'billing': S.billing = t.dataset.b; save(); render(); break;
      case 'buy': {
        var plan = t.dataset.plan, pp = PL[plan], yb = yearly();
        openSheet('<h2>' + pp.name + ' – ' + (yb ? eur(pp.yearPrice) + ' / metams' : eur(pp.price) + ' / ' + pp.days + ' d.') + '</h2><p class="muted small" style="margin:8px 0 16px">Kaina su PVM. ' + (yb ? 'Mokama vieną kartą metams. Per 14 dienų gali atsisakyti ir atgausi pinigus. ' : 'Atsinaujina kas ' + pp.days + ' d., ') + 'Atšaukti gali bet kada vienu paspaudimu. Banko išraše – neutralus aprašas „' + C.BANK_DESCRIPTOR + '“.</p><div class="notice gold" style="margin-bottom:24px">' + ic('info') + '<span>Tai peržiūra – tikro mokėjimo nėra. Galime įjungti demo planą, kad išbandytum funkcijas.</span></div><button class="btn block" data-action="demo-activate" data-plan="' + plan + '" data-testid="demo-activate">Įjungti demo planą (be mokėjimo)</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      }
      case 'demo-activate': S.premium = t.dataset.plan; if (S.premium !== 'plus') { S.filters.zodiacOnly = false; } save(); closeSheet(); render(); toast('Demo planas įjungtas.'); break;
      case 'cancel-sub': S.premium = null; S.settings.invisible = false; S.filters.onlineOnly = false; S.filters.goal = ''; S.filters.zodiacOnly = false; save(); render(); toast('Prenumerata atšaukta.'); break;
      case 'export': {
        var blob = new Blob([JSON.stringify({ pastaba: 'Tikri peržiūra – duomenys tik šioje naršyklėje', duomenys: S }, null, 2)], { type: 'application/json' });
        var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'tikri-mano-duomenys.json'; document.body.appendChild(aEl); aEl.click(); aEl.remove(); toast('Duomenų failas paruoštas.'); break;
      }
      case 'delete':
        openSheet('<h2>Ištrinti paskyrą?</h2><p class="muted" style="margin:8px 0 24px">Ištrinsime profilį, nuotraukas, pokalbius, sutikimus ir vietos duomenis. Aktyvi prenumerata bus atšaukta. To atšaukti negalima.</p><button class="btn danger block" data-action="delete-yes" data-testid="delete-yes">' + ic('trash', 18) + ' Taip, ištrinti viską</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      case 'delete-yes': try { localStorage.removeItem(LS); } catch (x) { /* */ } S = clone(defaults); S.chats = clone(D.chats); closeSheet(); location.hash = '#/welcome'; toast('Paskyra ir duomenys ištrinti.'); break;
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.switch) return;
    var k = t.dataset.switch;
    if (k === 'f-verified' || k === 'f-online' || k === 'f-zodiac') return; // taikoma paspaudus „Rodyti rezultatus“
    if (k === 'consentSensitive' || k === 'consentMarketing') {
      S.user[k] = t.checked;
      if (k === 'consentSensitive') toast(t.checked ? 'Sutikimas suteiktas – paieška įjungta.' : 'Sutikimas atšauktas – paieška išjungta.');
    } else if (k === 'invisible') {
      if (!isPremium()) { t.checked = false; premiumNudge('Nematomas režimas'); return; }
      S.settings.invisible = t.checked; toast(t.checked ? 'Nematomas režimas įjungtas.' : 'Nematomas režimas išjungtas.');
    } else { S.settings[k] = t.checked; }
    save();
  });

  document.addEventListener('submit', function (e) {
    var f = e.target; if (f.dataset.form !== 'send') return; e.preventDefault();
    var inp = f.querySelector('input'), txt = inp.value.trim(); if (!txt) return;
    var id = f.dataset.id, c = findChat(id), msg = { from: 'me', text: txt, t: Date.now(), r: false };
    c.messages.push(msg); save(); inp.value = ''; refreshChat(id);
    var hn = document.getElementById('hid-note'); if (hn && contactsUnlocked(c)) hn.remove();
    setTimeout(function () { msg.r = true; typingFor = id; save(); refreshChat(id); }, 650);
    setTimeout(function () {
      typingFor = null;
      var cc = findChat(id); if (!cc || S.blocked.indexOf(id) >= 0) return;
      cc.messages.push({ from: 'them', text: D.replies[cc.messages.length % D.replies.length], t: Date.now() });
      if (location.hash !== '#/chat/' + id) { cc.unread = true; updateBadge(); }
      save(); refreshChat(id); if (location.hash === '#/chats') render();
    }, 2300);
  });

  window.addEventListener('hashchange', render);
  render();

  // Pradinis ekranas (splash) – tik trumpam
  var splash = document.getElementById('splash');
  if (splash) { setTimeout(function () { splash.classList.add('out'); setTimeout(function () { splash.remove(); }, 520); }, 900); }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* peržiūra veikia ir be SW */ });
  }
})();
