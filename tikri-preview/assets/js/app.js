/* Tikri – PERŽIŪRA (statinė PWA). Jokio serverio; duomenys tik šioje naršyklėje (localStorage). */
(function () {
  'use strict';
  var D = window.TIKRI_DATA, I = window.TIKRI_ICONS;
  var LS = 'tikri-preview-v1';
  var BANDS = ['<1 km', '1–2 km', '2–5 km', '5–10 km', '10+ km'];
  var BAND_MAX = [1, 2, 5, 10, 999];
  var FREE_LIMIT = 12;
  var CONTACT_UNLOCK = 3; // po kiek žinučių iš abiejų pusių rodomos nuorodos/kontaktai

  var defaults = {
    onboarded: false,
    user: { name: '', birth: '', gender: '', seeking: [], interests: [], verified: false,
      consentTerms: false, consentSensitive: false, consentMarketing: false },
    premium: null, // null | 'premium' | 'plus' (tik demo)
    blocked: [], reported: [],
    filters: { ageMin: 18, ageMax: 60, band: 4, seek: 'visų', verifiedOnly: false, interests: [], onlineOnly: false, goal: '' },
    settings: { hideDistance: false, invisible: false, showAge: true, notifications: true },
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

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function byId(id) { for (var i = 0; i < D.profiles.length; i++) if (D.profiles[i].id === id) return D.profiles[i]; return null; }
  function bandIdx(p) { return Math.max(0, BANDS.indexOf(p.distLabel)); }
  function isPremium() { return !!S.premium; }
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

  // Pseudo-atsitiktinis maišymas juostos viduje: seed = (diena), kad tvarka neišduotų tikslaus atstumo.
  function seeded(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function shuffleIn(arr, seed) { var r = seeded(seed), a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Abstraktūs avatarai (generuojami, ne nuotraukos)
  var avN = 0;
  function avatar(p, variant) {
    var id = 'g' + (++avN), c = p.colors, h = 0, i;
    for (i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i) + (variant || 0) * 7) % 997;
    var cx = 20 + (h % 60), cy = 15 + ((h * 3) % 50), r1 = 28 + (h % 20), cx2 = 80 - (h % 50), cy2 = 70 + (h % 25);
    var initial = esc(p.name.charAt(0));
    return '<svg class="avsvg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Abstrakti iliustracija – ' + esc(p.name) + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<rect width="100" height="100" fill="url(#' + id + ')"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1 + '" fill="#fff" opacity=".18"/>' +
      '<circle cx="' + cx2 + '" cy="' + cy2 + '" r="' + (r1 - 6) + '" fill="#33212C" opacity=".08"/>' +
      '<path d="M0 ' + (78 - (h % 12)) + ' Q 50 ' + (60 + (h % 20)) + ' 100 ' + (82 - (h % 9)) + ' V100 H0z" fill="#fff" opacity=".16"/>' +
      (variant ? '' : '<text x="50" y="62" text-anchor="middle" font-size="34" font-weight="800" fill="#fff" font-family="system-ui,sans-serif" opacity=".95">' + initial + '</text>') +
      '</svg>';
  }
  function meAvatar() { return avatar({ id: 'me', name: S.user.name || 'Tu', colors: ['#F29A7E', '#5B3A55'] }); }

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
    openSheet('<h2>' + I.lock + ' ' + esc(what) + ' – Premium funkcija</h2><p class="muted">Ši funkcija yra Premium ir Plus planuose. Mokėti nebūtina – nemokama versija leidžia kurti profilį, ieškoti ir rašyti su ribomis.</p>' +
      '<a class="btn block" href="#/premium" data-action="close-sheet">Peržiūrėti planus</a><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Ne dabar</button>');
  }
  function sw(name, checked, disabled) {
    return '<label class="switch"><input type="checkbox" data-switch="' + name + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span></span></label>';
  }

  /* ---------- EKRANAI ---------- */
  function welcome() {
    return { tabs: false, html:
      '<section class="welcome">' + I.logo +
      '<h1 class="name">Tikri</h1>' +
      '<p class="slogan"><span>Tikri žmonės.</span><span>Tikri susitikimai.</span><span><b>Tavo privatumas – tavo.</b></span></p>' +
      '<p class="muted small">Patvirtinti profiliai, apytikslis atstumas vietoje tikslios vietos ir saugumo įrankiai pirmam pasimatymui.</p>' +
      '<a class="btn block" href="#/register/1" data-testid="start">Pradėti</a>' +
      (S.onboarded ? '<a class="btn ghost block" href="#/nearby">Tęsti kaip ' + esc(S.user.name || 'svečias') + '</a>' : '<button class="btn ghost block" data-action="demo-skip">Praleisti registraciją (demo)</button>') +
      '<p class="age-note"><b>18+</b> Tik pilnamečiams. Amžių patikrinsime registruojantis.</p>' +
      '</section>' };
  }

  function progress(n) { var h = '<div class="progress" aria-label="Žingsnis ' + n + ' iš 5">'; for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= n ? 'on' : '') + '"></i>'; return h + '</div>'; }
  function stepTop(n, title) { return '<div class="topbar"><a class="icon-btn" href="' + (n === 1 ? '#/welcome' : '#/register/' + (n - 1)) + '" aria-label="Atgal">' + I.back + '</a><h2>' + title + '</h2><span class="muted small">' + n + '/5</span></div>' + progress(n); }

  function register(m) {
    var n = +m[1], u = S.user, html = '';
    if (n === 1) {
      html = stepTop(1, 'Susipažinkime') +
        '<label class="field"><span>Vardas (rodomas profilyje)</span><input class="input" id="f-name" maxlength="30" autocomplete="given-name" value="' + esc(u.name) + '" placeholder="pvz. Rasa"></label>' +
        '<label class="field"><span>Gimimo data</span><input class="input" id="f-birth" type="date" value="' + esc(u.birth) + '" max="' + new Date().toISOString().slice(0, 10) + '"></label>' +
        '<p class="muted small">Tikri skirta tik 18+ metų žmonėms. Profilyje rodomas tik amžius metais, ne gimimo data.</p>' +
        '<div class="err" id="err" role="alert"></div>' +
        '<button class="btn block" data-action="step1">Toliau</button>';
    } else if (n === 2) {
      var g = function (v, l) { return '<button class="chip" data-gender="' + v + '" aria-pressed="' + (u.gender === v) + '">' + l + '</button>'; };
      var k = function (v, l) { return '<button class="chip" data-seek="' + v + '" aria-pressed="' + (u.seeking.indexOf(v) >= 0) + '">' + l + '</button>'; };
      html = stepTop(2, 'Apie tave') +
        '<h3>Aš esu</h3><div class="choice-grid">' + g('vyras', 'Vyras') + g('moteris', 'Moteris') + g('kita', 'Kita') + '</div>' +
        '<h3 style="margin-top:22px">Ieškau <span class="tag sage">neprivaloma</span></h3>' +
        '<p class="muted small">Gali pažymėti kelis. Tai jautrus duomuo (susijęs su orientacija), todėl jo nurodyti neprivalai – tada matysi visus.</p>' +
        '<div class="choice-grid">' + k('vyrų', 'Vyrų') + k('moterų', 'Moterų') + k('visų', 'Visų') + '</div>' +
        '<button class="btn ghost small" style="margin-top:10px" data-action="seek-none">Nenoriu nurodyti</button>' +
        '<div class="err" id="err" role="alert"></div>' +
        '<button class="btn block" data-action="step2">Toliau</button>';
    } else if (n === 3) {
      html = stepTop(3, 'Tavo interesai') +
        '<p class="muted">Pasirink bent 3. Pagal juos skaičiuojame atitikimą ir siūlome pokalbio pradžią.</p>' +
        '<div class="chips">' + D.INTERESTS.map(function (x) { return '<button class="chip" data-interest="' + esc(x) + '" aria-pressed="' + (u.interests.indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div>' +
        '<p class="small muted" style="margin-top:12px">Pasirinkta: <b id="icount">' + u.interests.length + '</b></p>' +
        '<div class="err" id="err" role="alert"></div>' +
        '<button class="btn block" data-action="step3">Toliau</button>';
    } else if (n === 4) {
      html = stepTop(4, 'Patvirtink profilį asmenuke') +
        '<div class="selfie-frame' + (u.verified ? ' done' : '') + '" id="selfie">' + (u.verified ? I.check.replace('width="24" height="24"', 'width="72" height="72"') : I.camera.replace('width="24" height="24"', 'width="64" height="64"')) + '</div>' +
        '<div class="card stack small">' +
        '<p><b>Kaip tai veikia?</b> Padarai vieną asmenukę. AI patikrina, ar tai gyvas žmogus ir ar veidas atitinka profilio nuotraukas. Patvirtinti profiliai gauna ženkliuką ' + I.verified + '.</p>' +
        '<p>Asmenukė nerodoma kitiems ir ištrinama iškart po patikros. Veido šablonų nesaugome.</p>' +
        '<p class="tag">Peržiūra</p><p class="muted">Šioje peržiūroje kamera neįjungiama – sėkmė tik imituojama.</p></div>' +
        '<p class="ok center" id="selfie-msg" role="status">' + (u.verified ? 'Profilis patvirtintas!' : '') + '</p>' +
        (u.verified ? '<a class="btn block" href="#/register/5">Toliau</a>' : '<button class="btn block" data-action="selfie">' + I.camera + ' Padaryti asmenukę</button><a class="btn ghost block" style="margin-top:8px" href="#/register/5">Patvirtinsiu vėliau</a>');
    } else {
      var sensText = u.seeking.length
        ? 'Aiškiai sutinku, kad Tikri tvarkytų mano <b>jautrius duomenis</b> – <b>ką ieškau (susiję su orientacija)</b> ir <b>apytikslę vietą</b> (tik atstumo juosta) – vien tam, kad galėčiau matyti žmones šalia ir būti matomas(-a). Šiuos duomenis šifruojame, neperduodame reklamai ir AI. Sutikimą galiu bet kada atšaukti nustatymuose (BDAR 9 str. 2 d. a p.).'
        : 'Aiškiai sutinku, kad Tikri tvarkytų mano <b>apytikslę vietą</b> (tik atstumo juosta), kad galėčiau matyti žmones šalia ir būti matomas(-a). Orientacijos nenurodžiau – jos netvarkome. Sutikimą galiu bet kada atšaukti nustatymuose (BDAR 9 str. 2 d. a p.).';
      html = stepTop(5, 'Sutikimai') +
        '<p class="muted small">Kiekvienas sutikimas atskiras. Jautrių duomenų sutikimas nėra „paslėptas“ taisyklėse.</p>' +
        '<label class="check"><input type="checkbox" id="c-terms"' + (u.consentTerms ? ' checked' : '') + '><span>Sutinku su <a href="#" data-action="terms">naudojimosi taisyklėmis</a> ir susipažinau su <a href="#" data-action="terms">privatumo politika</a>. Patvirtinu, kad man yra 18 ar daugiau metų.</span></label>' +
        '<label class="check sensitive"><input type="checkbox" id="c-sens"' + (u.consentSensitive ? ' checked' : '') + '><span>' + sensText + '</span></label>' +
        '<label class="check"><input type="checkbox" id="c-mkt"' + (u.consentMarketing ? ' checked' : '') + '><span><span class="tag sage">neprivaloma</span> Noriu gauti naujienas el. paštu (gali atsisakyti bet kada).</span></label>' +
        '<div class="err" id="err" role="alert"></div>' +
        '<button class="btn block" data-action="step5">Sukurti profilį</button>';
    }
    return { tabs: false, html: html };
  }

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
      return true;
    });
  }
  function activeFilterCount() {
    var f = S.filters, n = 0;
    if (f.ageMin !== 18 || f.ageMax !== 60) n++; if (f.band !== 4) n++; if (f.seek !== 'visų') n++;
    if (f.verifiedOnly) n++; if (f.interests.length) n++; if (isPremium() && (f.onlineOnly || f.goal)) n++;
    return n;
  }
  function pcard(p) {
    return '<a class="pcard" href="#/profile/' + p.id + '" data-testid="pcard"><span class="av">' + avatar(p) + '</span>' + (p.online ? '<span class="online-dot" title="Neseniai aktyvus(-i)"></span>' : '') +
      '<span class="meta"><span class="nm">' + esc(p.name) + ', ' + p.age + (p.verified ? I.verified : '') + '</span>' +
      '<span class="sub"><span>' + esc(p.distLabel) + '</span><span class="match">' + matchPct(p) + '% atitikimas</span></span></span></a>';
  }
  function nearby() {
    if (!S.user.consentSensitive) {
      return { tab: 'nearby', html: '<div class="topbar"><h1>Šalia tavęs</h1></div><div class="card stack"><h3>Paieška išjungta</h3><p class="muted">Atšaukei sutikimą tvarkyti apytikslę vietą, todėl šalia esančių žmonių nerodome ir tavęs niekas nemato.</p><a class="btn block" href="#/settings">Atnaujinti sutikimą</a></div>' };
    }
    var list = visibleProfiles(), day = Math.floor(Date.now() / 864e5), shown = 0, html = '';
    var limit = isPremium() ? Infinity : FREE_LIMIT, hiddenCount = 0;
    BANDS.forEach(function (b, bi) {
      var inBand = shuffleIn(list.filter(function (p) { return bandIdx(p) === bi; }), day * 7 + bi + 1);
      if (!inBand.length) return;
      var cards = '';
      inBand.forEach(function (p) { if (shown < limit) { cards += pcard(p); shown++; } else hiddenCount++; });
      if (cards) html += '<h2 class="band-title">' + esc(b) + '</h2><div class="grid">' + cards + '</div>';
    });
    if (!list.length) html = '<div class="card center stack"><p>Pagal pasirinktus filtrus nieko neradome.</p><button class="btn soft" data-action="reset-filters">Išvalyti filtrus</button></div>';
    if (hiddenCount) html += '<div class="grid" style="margin-top:12px"><div class="locked-card">' + I.lock + '<b>Dar ' + hiddenCount + ' ' + (hiddenCount === 1 ? 'žmogus' : 'žmonės') + ' šalia</b><span class="small">Nemokamai rodome iki ' + FREE_LIMIT + ' profilių per dieną. Premium – be ribų.</span><a class="btn small" href="#/premium">Plačiau apie Premium</a></div></div>';
    var fc = activeFilterCount();
    return { tab: 'nearby', html:
      '<div class="topbar"><h1>Šalia tavęs</h1><button class="icon-btn" data-action="filters" aria-label="Filtrai" data-testid="filters" style="position:relative">' + I.sliders + (fc ? '<span class="tabbar-badge" style="position:absolute;top:-2px;right:-2px;background:var(--brand);color:#fff;border-radius:99px;font-size:11px;font-weight:800;padding:1px 6px">' + fc + '</span>' : '') + '</button></div>' +
      '<div class="notice">' + I.shield + '<span>Rodome tik apytikslį atstumą juostomis. Juostos viduje tvarka sumaišyta, todėl niekas negali atspėti tikslios tavo vietos.' + (S.settings.hideDistance ? ' <b>Tavo atstumas kitiems paslėptas.</b>' : '') + '</span></div>' +
      html };
  }

  function filtersSheet() {
    var f = S.filters, prem = isPremium();
    var seekChip = function (v, l) { return '<button class="chip" data-fseek="' + v + '" aria-pressed="' + (f.seek === v) + '">' + l + '</button>'; };
    var bandChip = function (i) { return '<button class="chip" data-fband="' + i + '" aria-pressed="' + (f.band === i) + '">' + (i === 4 ? 'Visi' : 'iki ' + BANDS[i].replace('<', '').replace(/^.*–/, '')) + '</button>'; };
    var goal = function (v, l) { return '<button class="chip' + (prem ? '' : ' locked') + '" data-fgoal="' + v + '" aria-pressed="' + (prem && f.goal === v) + '">' + (prem ? '' : I.lock) + l + '</button>'; };
    openSheet(
      '<div class="row between"><h2 style="margin:0">Filtrai</h2><button class="icon-btn" data-action="close-sheet" aria-label="Uždaryti">' + I.close + '</button></div>' +
      '<section><h3>Amžius: <span id="age-lbl">' + f.ageMin + '–' + f.ageMax + '</span></h3>' +
      '<div class="range-row"><span class="small muted">nuo</span><input type="range" id="age-min" min="18" max="70" value="' + f.ageMin + '" aria-label="Amžius nuo"></div>' +
      '<div class="range-row"><span class="small muted">iki</span><input type="range" id="age-max" min="18" max="70" value="' + f.ageMax + '" aria-label="Amžius iki"></div></section>' +
      '<section><h3>Atstumas</h3><div class="chips">' + [0, 1, 2, 3, 4].map(bandChip).join('') + '</div><p class="tiny muted" style="margin-top:6px">Tik apytikslės juostos – tikslaus atstumo nėra.</p></section>' +
      '<section><h3>Ieško / rodyti</h3><div class="chips">' + seekChip('vyrų', 'Vyrus') + seekChip('moterų', 'Moteris') + seekChip('visų', 'Visus') + '</div></section>' +
      '<section><div class="switch-row"><span class="lbl">Tik patvirtinti profiliai<small>Su asmenukės patvirtinimu ' + I.verified + '</small></span>' + sw('f-verified', f.verifiedOnly) + '</div></section>' +
      '<section><h3>Interesai</h3><div class="chips">' + D.INTERESTS.map(function (x) { return '<button class="chip" data-finterest="' + esc(x) + '" aria-pressed="' + (f.interests.indexOf(x) >= 0) + '">' + esc(x) + '</button>'; }).join('') + '</div></section>' +
      '<section class="card"><h3>' + (prem ? '' : I.lock) + ' Išplėstiniai filtrai ' + (prem ? '<span class="tag sage">Aktyvu</span>' : '<span class="tag">Premium</span>') + '</h3>' +
      '<div class="switch-row"><span class="lbl">Tik neseniai aktyvūs</span>' + (prem ? sw('f-online', f.onlineOnly) : '<button class="chip locked" data-action="locked" data-what="Tik neseniai aktyvūs">' + I.lock + '</button>') + '</div>' +
      '<p class="small" style="margin:10px 0 6px"><b>Ko ieško</b></p><div class="chips">' + goal('draugystė', 'Draugystės') + goal('pažintys', 'Pažinčių') + goal('santykiai', 'Santykių') + '</div></section>' +
      '<div class="row" style="margin-top:16px"><button class="btn ghost" data-action="reset-filters">Išvalyti</button><button class="btn" style="flex:1" data-action="apply-filters" data-testid="apply-filters">Rodyti rezultatus</button></div>',
      function (el) {
        var mn = el.querySelector('#age-min'), mx = el.querySelector('#age-max'), lbl = el.querySelector('#age-lbl');
        function upd() { if (+mn.value > +mx.value) { if (this === mn) mx.value = mn.value; else mn.value = mx.value; } lbl.textContent = mn.value + '–' + mx.value; }
        mn.addEventListener('input', upd); mx.addEventListener('input', upd);
      });
    draft = clone(S.filters);
  }
  var draft = null;

  function profile(m) {
    var p = byId(m[1]);
    if (!p) return { tab: 'nearby', html: '<p>Profilis nerastas.</p><a href="#/nearby">Atgal</a>' };
    if (S.blocked.indexOf(p.id) >= 0) return { tab: 'nearby', html: '<div class="topbar"><a class="icon-btn" href="#/nearby" aria-label="Atgal">' + I.back + '</a><h2>Užblokuota</h2></div><div class="card stack"><p>Šį žmogų užblokavai. Jūs vienas kito nematote paieškoje ir pokalbiuose.</p><button class="btn soft" data-action="unblock" data-id="' + p.id + '">Atblokuoti</button></div>' };
    var sh = shared(p);
    var goalTxt = { 'draugystė': 'Ieško draugystės', 'pažintys': 'Ieško pažinčių', 'santykiai': 'Ieško santykių' }[p.goal];
    return { tab: 'nearby', html:
      '<div class="topbar"><a class="icon-btn" href="#/nearby" aria-label="Atgal">' + I.back + '</a><span style="flex:1"></span><span class="match">' + matchPct(p) + '% atitikimas</span></div>' +
      '<div class="photos">' + [0, 1, 2].map(function (v, i) { return '<div class="photo">' + avatar(p, v) + '<span class="cap">Nuotrauka ' + (i + 1) + '/3 · iliustracija</span></div>'; }).join('') + '</div>' +
      '<div class="pname">' + esc(p.name) + ', ' + p.age + (p.verified ? I.verified : '') + '</div>' +
      '<div class="facts"><span class="fact">' + I.near + esc(p.distLabel) + '</span><span class="fact">' + esc(goalTxt) + '</span>' + (p.verified ? '<span class="fact" style="color:var(--sage)">' + I.shield + 'Patvirtinta asmenuke</span>' : '<span class="fact">Dar nepatvirtinta</span>') + (p.online ? '<span class="fact">Neseniai aktyvus(-i)</span>' : '') + '</div>' +
      '<div class="card"><h3>Apie mane</h3><p style="margin:0">' + esc(p.bio) + '</p></div>' +
      '<div class="card" style="margin-top:12px"><h3>Interesai</h3><div class="chips">' + p.interests.map(function (x) { return '<span class="chip static' + (sh.indexOf(x) >= 0 ? ' shared' : '') + '">' + (sh.indexOf(x) >= 0 ? I.check.replace('width="24" height="24"', 'width="14" height="14"') : '') + esc(x) + '</span>'; }).join('') + '</div>' +
      (sh.length ? '<p class="small muted" style="margin:10px 0 0">Bendri interesai: ' + sh.length + '</p>' : '') + '</div>' +
      '<div class="actions"><button class="btn" data-action="write" data-id="' + p.id + '" data-testid="write">' + I.chat + ' Rašyti</button><button class="btn ghost" data-action="block" data-id="' + p.id + '">' + I.block + ' Blokuoti</button><button class="btn danger" data-action="report" data-id="' + p.id + '">' + I.flag + ' Pranešti</button></div>' +
      '<p class="tiny muted center" style="margin-top:14px">Niekada nesiųsk pinigų ir kodų žmonėms, kurių nepažįsti. Įtartina? Spausk „Pranešti“.</p>' };
  }

  function findChat(id) { for (var i = 0; i < S.chats.length; i++) if (S.chats[i].id === id) return S.chats[i]; return null; }
  function chats() {
    var list = S.chats.filter(function (c) { return S.blocked.indexOf(c.id) < 0 && byId(c.id); });
    var items = list.map(function (c) {
      var p = byId(c.id), last = c.messages[c.messages.length - 1];
      var lastTxt = last ? (last.from === 'me' ? 'Tu: ' : '') + maskText(last.text, c, true) : '<i>Naujas pokalbis – parašyk pirmas(-a)!</i>';
      return '<li><a href="#/chat/' + c.id + '" data-testid="chat-item"><span class="avatar-sm">' + avatar(p) + '</span><span class="txt"><b>' + esc(p.name) + '</b>' + (p.verified ? I.verified : '') + '<div class="last">' + lastTxt + '</div></span><span class="center"><span class="when">' + (last ? when(last.t) : '') + '</span><br>' + (c.unread ? '<span class="unread" aria-label="Neperskaityta"></span>' : '') + '</span></a></li>';
    }).join('');
    return { tab: 'chats', html: '<div class="topbar"><h1>Pokalbiai</h1></div>' +
      (isPremium() ? '' : '<div class="notice gold">' + I.info + '<span>Nemokamai – iki 5 naujų pokalbių per dieną. Esami pokalbiai be ribų.</span></div>') +
      (items ? '<ul class="clist">' + items + '</ul>' : '<div class="card center"><p>Kol kas pokalbių nėra.</p><a class="btn" href="#/nearby">Ieškoti šalia</a></div>') };
  }
  function counts(c) { var me = 0, them = 0; c.messages.forEach(function (m) { if (m.from === 'me') me++; else them++; }); return { me: me, them: them }; }
  function contactsUnlocked(c) { var k = counts(c); return k.me >= CONTACT_UNLOCK && k.them >= CONTACT_UNLOCK; }
  var CONTACT_RE = /((https?:\/\/|www\.)\S+|\b[\w-]+\.(lt|com|net|org|eu|io)\b\S*|\+?\d[\d\s-]{7,}\d|@[\w.]{3,})/gi;
  function maskText(text, c, plain) {
    var safe = esc(text);
    if (contactsUnlocked(c)) return safe;
    return safe.replace(CONTACT_RE, plain ? '[paslėpta]' : '<span class="hidden-link" title="Paslėpta saugumo sumetimais">' + 'nuoroda / kontaktas paslėptas' + '</span>');
  }
  function chat(m) {
    var p = byId(m[1]); if (!p) return { tab: 'chats', html: '<p>Pokalbis nerastas.</p>' };
    var c = findChat(p.id); if (!c) { c = { id: p.id, unread: false, messages: [] }; S.chats.unshift(c); }
    c.unread = false; save();
    var hasHidden = !contactsUnlocked(c) && c.messages.some(function (x) { CONTACT_RE.lastIndex = 0; return CONTACT_RE.test(x.text); });
    CONTACT_RE.lastIndex = 0;
    var k = counts(c);
    var msgs = c.messages.map(function (x) { return '<div class="msg ' + x.from + '">' + maskText(x.text, c) + '<span class="t">' + hhmm(x.t) + '</span></div>'; }).join('');
    return { tab: 'chats', noTabs: true, html:
      '<div class="topbar"><a class="icon-btn" href="#/chats" aria-label="Atgal">' + I.back + '</a><a href="#/profile/' + p.id + '" class="row" style="flex:1;text-decoration:none;color:inherit"><span class="avatar-sm" style="width:42px;height:42px">' + avatar(p) + '</span><span><b>' + esc(p.name) + '</b>' + (p.verified ? I.verified : '') + '<br><span class="tiny muted">' + esc(p.distLabel) + '</span></span></a><button class="icon-btn" data-action="report" data-id="' + p.id + '" aria-label="Pranešti">' + I.flag + '</button></div>' +
      '<div class="notice" style="margin-bottom:10px">' + I.shield + '<span>Kol abu neapsikeitėte bent ' + CONTACT_UNLOCK + ' žinutėmis, nuorodos, telefonai ir @vardai paslepiami' + (contactsUnlocked(c) ? ' – <b>dabar jau rodomi</b>.' : ' (jūs: ' + k.me + '/' + CONTACT_UNLOCK + ', ' + esc(p.name) + ': ' + k.them + '/' + CONTACT_UNLOCK + ').') + '</span></div>' +
      (hasHidden ? '<p class="tiny muted center">Šiame pokalbyje yra paslėptų nuorodų ar kontaktų. Niekada nesek nepažįstamų nuorodų.</p>' : '') +
      '<div class="conv" id="conv">' + (msgs || '<p class="muted center small" style="margin-top:30px">Dar nėra žinučių. Bendri interesai: ' + (shared(p).map(esc).join(', ') || 'nėra') + '.</p>') + '</div>' +
      '<div class="composer"><button class="ai-btn" data-action="ai-opener" data-id="' + p.id + '" data-testid="ai-opener">' + I.spark + ' Padėk pradėti pokalbį</button>' +
      '<form class="row" data-form="send" data-id="' + p.id + '"><label class="sr" for="msg-input">Žinutė</label><input class="input" id="msg-input" autocomplete="off" maxlength="500" placeholder="Rašyk žinutę…"><button class="send-btn" aria-label="Siųsti" type="submit">' + I.send + '</button></form>' +
      '<p class="tiny muted">Pokalbių nuotraukos automatiškai ištrinamos po 7 d. AI pasiūlymai naudoja tik interesus – ne žinutes.</p></div>',
      after: function () { window.scrollTo(0, document.body.scrollHeight); } };
  }

  function me() {
    var u = S.user, a = ageFrom(u.birth);
    var plan = S.premium === 'plus' ? 'Plus' : S.premium === 'premium' ? 'Premium' : 'Nemokamas';
    return { tab: 'me', html:
      '<div class="topbar"><h1>Mano profilis</h1><a class="icon-btn" href="#/settings" aria-label="Nustatymai" data-testid="settings-link">' + I.gear + '</a></div>' +
      '<div class="card row" style="gap:14px"><span class="avatar-sm" style="width:72px;height:72px">' + meAvatar() + '</span><div style="flex:1"><div class="pname" style="font-size:22px">' + esc(u.name || 'Tu') + (a ? ', ' + a : '') + (u.verified ? I.verified : '') + '</div>' +
      '<div class="small muted">' + (u.gender ? esc(u.gender.charAt(0).toUpperCase() + u.gender.slice(1)) : '') + (u.seeking.length ? ' · ieško: ' + esc(u.seeking.join(', ')) : ' · orientacija nenurodyta') + '</div>' +
      '<span class="tag ' + (S.premium ? 'sage' : '') + '" style="margin-top:6px">' + plan + ' planas</span></div></div>' +
      (u.verified ? '' : '<div class="notice warm" style="margin-top:12px">' + I.camera + '<span>Profilis dar nepatvirtintas. <a href="#/register/4">Patvirtinti asmenuke</a></span></div>') +
      '<div class="card" style="margin-top:12px"><h3>Interesai</h3><div class="chips">' + (u.interests.length ? u.interests.map(function (x) { return '<span class="chip static">' + esc(x) + '</span>'; }).join('') : '<span class="muted small">Nepasirinkta</span>') + '</div><a class="btn ghost small" style="margin-top:12px" href="#/register/3">Redaguoti</a></div>' +
      '<div class="card" style="margin-top:12px"><div class="row between"><h3 style="margin:0">' + I.eye + ' Kas peržiūrėjo tave</h3>' + (isPremium() ? '' : '<span class="tag">Premium</span>') + '</div>' +
      (isPremium() ? '<div class="row" style="margin-top:12px">' + ['p7', 'p13', 'p10'].map(function (id) { var p = byId(id); return '<a class="avatar-sm" href="#/profile/' + id + '" title="' + esc(p.name) + '">' + avatar(p) + '</a>'; }).join('') + '<span class="small muted">3 per pastarąją savaitę</span></div>'
        : '<p class="small muted" style="margin:10px 0">3 žmonės peržiūrėjo tavo profilį šią savaitę.</p><button class="btn soft small" data-action="locked" data-what="Kas peržiūrėjo tave">' + I.lock + ' Pamatyti</button>') + '</div>' +
      '<ul class="menu card" style="margin-top:12px;padding:0 14px">' +
      '<li><a href="#/safety" data-testid="safety-link">' + I.shield + '<span class="grow">Saugumas ir pasimatymai</span>' + (S.share ? '<span class="pulse"></span>' : '') + I.chevron + '</a></li>' +
      '<li><a href="#/premium">' + I.gem + '<span class="grow">Premium planai</span>' + I.chevron + '</a></li>' +
      '<li><a href="#/settings">' + I.gear + '<span class="grow">Nustatymai ir privatumas</span>' + I.chevron + '</a></li></ul>' };
  }

  function safety() {
    var sh = S.share, live = sh && sh.until > Date.now();
    if (sh && !live) { S.share = null; save(); }
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="Atgal">' + I.back + '</a><h1>Saugumas</h1></div>' +
      (live ? '<div class="card share-live stack" data-testid="share-live"><div class="row"><span class="pulse"></span><b>Dalijiesi vieta su ' + esc(sh.name) + '</b></div><p class="small" style="margin:0">' + esc(sh.name) + ' mato tavo vietą iki <b>' + hhmm(sh.until) + '</b>. Po to nuoroda nustoja veikti ir duomenys ištrinami. <span class="tag">Simuliacija</span></p><button class="btn sage block" data-action="share-stop">' + I.check + ' Esu saugi(-us) – baigti dalintis</button></div>'
        : '<div class="card stack"><h2>' + I.share + ' Pasidalink, kur esu, su draugu</h2><p class="muted small">Pirmam pasimatymui: sukursi laikiną nuorodą ir nusiųsi ją draugui. Tik jis matys tavo vietą ir tik ribotą laiką. Pasimatymo žmogus apie tai nesužino.</p>' +
          '<label class="field"><span>Draugo vardas</span><input class="input" id="s-name" maxlength="30" placeholder="pvz. Inga"></label>' +
          '<label class="field"><span>Kiek laiko dalintis</span><select class="input" id="s-dur"><option value="1">1 val.</option><option value="2" selected>2 val.</option><option value="3">3 val.</option><option value="4">4 val.</option></select></label>' +
          '<div class="err" id="err" role="alert"></div><button class="btn block" data-action="share-start" data-testid="share-start">Sukurti nuorodą ir pradėti</button><p class="tiny muted center" style="margin:0">Peržiūroje niekas nesiunčiama ir vieta nenaudojama.</p></div>') +
      '<div class="card" style="margin-top:12px"><div class="switch-row"><span class="lbl"><b>' + I.eyeOff + ' Nematomas režimas</b> ' + (isPremium() ? '' : '<span class="tag">Premium</span>') + '<small>Tavęs nesimato paieškoje „Šalia“ ir kiti nemato, kad peržiūrėjai jų profilį. Rašyti gali tik tiems, su kuriais jau kalbiesi.</small></span>' +
      (isPremium() ? sw('invisible', S.settings.invisible) : '<button class="chip locked" data-action="locked" data-what="Nematomas režimas" data-testid="invisible-locked">' + I.lock + '</button>') + '</div></div>' +
      '<div class="card" style="margin-top:12px"><h3>Patarimai pirmam pasimatymui</h3><ul class="small" style="padding-left:18px;line-height:1.6;margin:0 0 12px"><li>Susitik viešoje vietoje.</li><li>Pasakyk draugui, kur ir su kuo eini.</li><li>Pasirūpink savo transportu namo.</li><li>Nesiųsk pinigų ir nesidalink kodais.</li></ul><a class="btn danger block" href="tel:112">' + I.phone + ' Skubi pagalba: 112</a></div>' };
  }

  function premium() {
    var cur = S.premium;
    var li = function (t) { return '<li>' + I.check + '<span>' + t + '</span></li>'; };
    var row = function (n, a, b, c) { var f = function (v) { return v === true ? '<span class="yes">✓</span>' : v === false ? '<span class="no">—</span>' : v; }; return '<tr><td>' + n + '</td><td>' + f(a) + '</td><td>' + f(b) + '</td><td>' + f(c) + '</td></tr>'; };
    var btn = function (plan, label) { return cur === plan ? '<button class="btn sage block" disabled>Aktyvus (demo)</button>' : '<button class="btn block" data-action="buy" data-plan="' + plan + '" data-testid="buy-' + plan + '">' + label + '</button>'; };
    return { tab: 'premium', html:
      '<div class="topbar"><h1>' + I.gem + ' Premium</h1></div>' +
      '<p class="muted">Tikri veikia ir nemokamai. Mokami planai tiesiog nuima ribas ir prideda papildomų funkcijų.</p>' +
      (cur ? '<div class="notice">' + I.check + '<span>Aktyvus demo planas: <b>' + (cur === 'plus' ? 'Plus' : 'Premium') + '</b>. <button class="btn small ghost" data-action="cancel-sub" style="margin-left:6px">Atšaukti</button></span></div>' : '') +
      '<div class="plans">' +
      '<div class="plan"><h3>Nemokamas</h3><div class="price">0 €</div><ul>' + li('Profilis ir asmenukės patvirtinimas') + li('Paieška šalia – iki ' + FREE_LIMIT + ' profilių per dieną') + li('Pagrindiniai filtrai') + li('Pokalbiai – iki 5 naujų per dieną') + li('Visi saugumo įrankiai') + '</ul></div>' +
      '<div class="plan hl"><h3>Premium</h3><div class="price">4,99 € <small>/ 30 d.</small></div><ul>' + li('Neribota paieška ir visi filtrai') + li('Kas peržiūrėjo tave') + li('Nematomas režimas') + li('Jokių pokalbių ribų') + '</ul>' + btn('premium', 'Rinktis Premium') + '</div>' +
      '<div class="plan"><h3>Plus</h3><div class="price">9,99 € <small>/ 30 d.</small></div><ul>' + li('Viskas, kas yra Premium') + li('AI atitikimo pasiūlymai pagal interesus') + li('Profilio iškėlimas (boost) 1 kartą per savaitę') + li('Pirmenybė pagalbos tarnyboje') + '</ul>' + btn('plus', 'Rinktis Plus') + '</div>' +
      '</div>' +
      '<h2 style="margin-top:22px">Palyginimas</h2>' +
      '<table class="cmp"><thead><tr><th>Funkcija</th><th>Nemok.</th><th>Premium</th><th>Plus</th></tr></thead><tbody>' +
      row('Profilis, patvirtinimas', true, true, true) + row('Paieška šalia', 'iki ' + FREE_LIMIT + '/d.', 'be ribų', 'be ribų') + row('Išplėstiniai filtrai', false, true, true) +
      row('Nauji pokalbiai', '5/d.', 'be ribų', 'be ribų') + row('Kas peržiūrėjo tave', false, true, true) + row('Nematomas režimas', false, true, true) +
      row('AI atitikimo pasiūlymai', false, false, true) + row('Iškėlimas (boost)', false, false, '1/sav.') + row('Saugumo įrankiai', true, true, true) +
      '</tbody></table>' +
      '<div class="card small" style="margin-top:16px;line-height:1.55"><p><b>Kainos nurodytos su PVM.</b> Prenumerata atsinaujina kas 30 d., kol jos neatšauki.</p><p><b>Atšaukti gali bet kada</b> – nustatymuose, vienu paspaudimu. Planas veiks iki apmokėto laikotarpio pabaigos, papildomų mokesčių nėra.</p><p><b>Diskretiškai:</b> banko išraše matysi neutralų aprašą (pvz. „TKR PASLAUGOS“) – be žodžių „pažintys“ ar programėlės pavadinimo.</p><p style="margin:0" class="muted">Peržiūroje mokėjimai neveikia: mygtukai tik įjungia demo planą, kad galėtum išbandyti funkcijas.</p></div>' };
  }

  function settings() {
    var st = S.settings, u = S.user;
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="Atgal">' + I.back + '</a><h1>Nustatymai</h1></div>' +
      '<h3>Privatumas</h3><div class="card" style="padding:4px 16px">' +
      '<div class="switch-row"><span class="lbl">Slėpti mano atstumą<small>Kiti nematys net atstumo juostos.</small></span>' + sw('hideDistance', st.hideDistance) + '</div>' +
      '<div class="switch-row"><span class="lbl">Rodyti mano amžių</span>' + sw('showAge', st.showAge) + '</div>' +
      '<div class="switch-row"><span class="lbl">Nematomas režimas ' + (isPremium() ? '' : '<span class="tag">Premium</span>') + '<small>Valdoma skiltyje „Saugumas“.</small></span>' + (isPremium() ? sw('invisible', st.invisible) : '<a class="chip locked" href="#/safety">' + I.lock + '</a>') + '</div>' +
      '<div class="switch-row"><span class="lbl">Pranešimai</span>' + sw('notifications', st.notifications) + '</div></div>' +
      '<h3 style="margin-top:18px">Sutikimai</h3><div class="card" style="padding:4px 16px">' +
      '<div class="switch-row"><span class="lbl">Jautrūs duomenys (orientacija, apytikslė vieta)<small>Atšaukus – paieška „Šalia“ išjungiama ir šie duomenys ištrinami.</small></span>' + sw('consentSensitive', u.consentSensitive) + '</div>' +
      '<div class="switch-row"><span class="lbl">Naujienos el. paštu</span>' + sw('consentMarketing', u.consentMarketing) + '</div></div>' +
      '<h3 style="margin-top:18px">Prenumerata</h3><div class="card row between"><span>' + (S.premium ? (S.premium === 'plus' ? 'Plus' : 'Premium') + ' (demo)' : 'Nemokamas planas') + '</span>' + (S.premium ? '<button class="btn small ghost" data-action="cancel-sub">Atšaukti prenumeratą</button>' : '<a class="btn small soft" href="#/premium">Planai</a>') + '</div>' +
      '<h3 style="margin-top:18px">Tavo duomenys</h3><ul class="menu card" style="padding:0 14px">' +
      '<li><button data-action="export">' + I.download + '<span class="grow">Atsisiųsti mano duomenis (JSON)</span></button></li>' +
      '<li><button data-action="delete" class="danger" data-testid="delete">' + I.trash + '<span class="grow">Ištrinti paskyrą ir visus duomenis</span></button></li></ul>' +
      '<h3 style="margin-top:18px">Apie</h3><div class="card stack" data-testid="about"><div class="row">' + I.logo.replace('class="logo"', 'class="logo" width="40" height="40"') + '<div><b>Tikri</b> · peržiūra v0.1<br><span class="small muted">Tikri žmonės. Tikri susitikimai. Tavo privatumas – tavo.</span></div></div>' +
      '<p class="small" style="margin:0"><b>Privatumas trumpai:</b> tikslios vietos nesaugome, rodome tik atstumo juostas; jautrūs duomenys šifruojami ir tvarkomi tik su tavo aiškiu sutikimu; duomenys saugomi ES.</p>' +
      '<p class="seller" style="margin:0">Pardavėjas: Saulius Ramanauskas, individuali veikla, PVM LT100015491519</p>' +
      '<p class="tiny muted" style="margin:0">Tai peržiūra su netikrais duomenimis. Profiliai, žinutės ir mokėjimai – netikri. Duomenys saugomi tik šioje naršyklėje.</p></div>' };
  }

  var routes = [
    [/^welcome$/, welcome], [/^register\/([1-5])$/, register], [/^nearby$/, nearby], [/^profile\/(p\d+)$/, profile],
    [/^chats$/, chats], [/^chat\/(p\d+)$/, chat], [/^me$/, me], [/^safety$/, safety], [/^premium$/, premium], [/^settings$/, settings]
  ];
  function render() {
    closeSheet();
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) { location.replace('#/' + (S.onboarded ? 'nearby' : 'welcome')); return; }
    if (!S.onboarded && !/^(welcome|register)/.test(h)) { location.replace('#/welcome'); return; }
    var view = null;
    for (var i = 0; i < routes.length; i++) { var m = h.match(routes[i][0]); if (m) { view = routes[i][1](m); break; } }
    if (!view) { location.replace('#/' + (S.onboarded ? 'nearby' : 'welcome')); return; }
    app.innerHTML = view.html;
    var showTabs = view.tabs !== false && !view.noTabs;
    app.className = showTabs ? '' : 'no-tabs';
    tabbar.hidden = !showTabs;
    var links = tabbar.querySelectorAll('a');
    for (var j = 0; j < links.length; j++) { if (links[j].dataset.tab === view.tab) links[j].setAttribute('aria-current', 'page'); else links[j].removeAttribute('aria-current'); }
    var unread = S.chats.some(function (c) { return c.unread && S.blocked.indexOf(c.id) < 0; });
    tabbar.querySelector('[data-tab="chats"] .badge').hidden = !unread;
    window.scrollTo(0, 0);
    if (view.after) view.after();
    var h1 = app.querySelector('h1,h2'); document.title = (h1 ? h1.textContent.trim() + ' · ' : '') + 'Tikri – peržiūra';
  }

  function toggleArr(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function err(t) { var e = document.getElementById('err'); if (e) e.textContent = t; }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action],[data-gender],[data-seek],[data-interest],[data-fseek],[data-fband],[data-finterest],[data-fgoal]');
    if (!t) return;
    var a = t.dataset.action, u = S.user;
    if (a === 'close-sheet-bg') { if (e.target === t) closeSheet(); return; }
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
        openSheet('<h2>Taisyklės ir privatumas (santrauka)</h2><ul class="small" style="padding-left:18px;line-height:1.6"><li>Tik 18+ metų žmonės, vienas žmogus – viena paskyra.</li><li>Draudžiama apsimetinėti, priekabiauti, prašyti pinigų, siųsti nepageidaujamą intymų turinį.</li><li>Tiksli vieta nesaugoma – rodoma tik atstumo juosta.</li><li>Jautrūs duomenys tvarkomi tik su atskiru, aiškiu sutikimu ir saugomi ES.</li><li>Duomenis gali atsisiųsti arba ištrinti bet kada nustatymuose.</li></ul><p class="tiny muted">Peržiūra: pilni tekstai bus paskelbti prieš paleidimą.</p><button class="btn block" data-action="close-sheet">Supratau</button>'); break;
      case 'demo-skip':
        merge(S.user, { name: 'Svečias', birth: '1995-05-05', gender: 'kita', seeking: ['visų'], interests: ['Kava', 'Kelionės', 'Muzika', 'Knygos'], verified: true, consentTerms: true, consentSensitive: true });
        S.onboarded = true; save(); location.hash = '#/nearby'; break;
      case 'step1': {
        var name = document.getElementById('f-name').value.trim(), birth = document.getElementById('f-birth').value, age = ageFrom(birth);
        if (!name) return err('Įvesk vardą.');
        if (age === null) return err('Įvesk gimimo datą.');
        if (age < 18) return err('Atsiprašome – Tikri skirta tik 18 metų ir vyresniems žmonėms.');
        if (age > 100) return err('Patikrink gimimo datą.');
        u.name = name; u.birth = birth; save(); location.hash = '#/register/2'; break;
      }
      case 'seek-none': u.seeking = []; document.querySelectorAll('[data-seek]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); toast('Gerai – orientacijos nenurodysi, matysi visus.'); break;
      case 'step2': if (!u.gender) return err('Pasirink, kas esi.'); save(); location.hash = '#/register/3'; break;
      case 'step3': if (u.interests.length < 3) return err('Pasirink bent 3 interesus.'); save(); location.hash = '#/register/4'; break;
      case 'selfie': {
        var fr = document.getElementById('selfie'), msg = document.getElementById('selfie-msg');
        t.disabled = true; fr.classList.add('scanning'); msg.textContent = 'Tikriname… (imituojama)';
        setTimeout(function () { u.verified = true; save(); render(); toast('Profilis patvirtintas ✓'); }, 1400); break;
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
        S.filters = draft; save(); render(); break;
      }
      case 'reset-filters': S.filters = clone(defaults.filters); save(); render(); break;
      case 'locked': premiumNudge(t.dataset.what || 'Ši funkcija'); break;
      case 'write': location.hash = '#/chat/' + t.dataset.id; break;
      case 'block': {
        var bp = byId(t.dataset.id);
        openSheet('<h2>Blokuoti ' + esc(bp.name) + '?</h2><p class="muted">Jūs nebematysite vienas kito paieškoje, pokalbiuose ir peržiūrose. ' + esc(bp.name) + ' apie tai nebus informuotas(-a).</p><button class="btn block" data-action="block-yes" data-id="' + bp.id + '" data-testid="block-yes">Blokuoti</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      }
      case 'block-yes': if (S.blocked.indexOf(t.dataset.id) < 0) S.blocked.push(t.dataset.id); save(); closeSheet(); toast('Užblokuota.'); location.hash = '#/nearby'; break;
      case 'unblock': S.blocked = S.blocked.filter(function (x) { return x !== t.dataset.id; }); save(); render(); toast('Atblokuota.'); break;
      case 'report': {
        var rp = byId(t.dataset.id), reasons = ['Netikras profilis / apsimetinėjimas', 'Nepilnametis(-ė)', 'Įžeidinėjimas ar priekabiavimas', 'Sukčiavimas, prašo pinigų', 'Nepageidaujamas intymus turinys', 'Kita'];
        openSheet('<h2>Pranešti apie ' + esc(rp.name) + '</h2><p class="muted small">Pranešimą peržiūri žmogus iš moderatorių komandos. Apie sprendimą informuosime. ' + esc(rp.name) + ' nesužinos, kas pranešė.</p>' +
          reasons.map(function (r, i) { return '<label class="check"><input type="radio" name="reason" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + r + '</span></label>'; }).join('') +
          '<label class="check"><input type="checkbox" id="r-block" checked><span>Taip pat užblokuoti</span></label>' +
          '<button class="btn danger block" data-action="report-yes" data-id="' + rp.id + '" data-testid="report-yes">Siųsti pranešimą</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
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
      case 'buy': {
        var plan = t.dataset.plan, price = plan === 'plus' ? '9,99 €' : '4,99 €';
        openSheet('<h2>' + (plan === 'plus' ? 'Plus' : 'Premium') + ' – ' + price + ' / 30 d.</h2><p class="muted small">Kaina su PVM. Atsinaujina kas 30 d., atšaukti gali bet kada. Banko išraše – neutralus aprašas „TKR PASLAUGOS“.</p><div class="notice gold">' + I.info + '<span>Tai peržiūra – tikro mokėjimo nėra. Galime įjungti demo planą, kad išbandytum funkcijas.</span></div><button class="btn block" data-action="demo-activate" data-plan="' + plan + '" data-testid="demo-activate">Įjungti demo planą (be mokėjimo)</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      }
      case 'demo-activate': S.premium = t.dataset.plan; save(); closeSheet(); render(); toast('Demo planas įjungtas.'); break;
      case 'cancel-sub': S.premium = null; S.settings.invisible = false; S.filters.onlineOnly = false; S.filters.goal = ''; save(); render(); toast('Prenumerata atšaukta.'); break;
      case 'export': {
        var blob = new Blob([JSON.stringify({ pastaba: 'Tikri peržiūra – duomenys tik šioje naršyklėje', duomenys: S }, null, 2)], { type: 'application/json' });
        var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = 'tikri-mano-duomenys.json'; document.body.appendChild(aEl); aEl.click(); aEl.remove(); toast('Duomenų failas paruoštas.'); break;
      }
      case 'delete':
        openSheet('<h2>Ištrinti paskyrą?</h2><p class="muted">Ištrinsime profilį, nuotraukas, pokalbius, sutikimus ir vietos duomenis. Aktyvi prenumerata bus atšaukta. To atšaukti negalima.</p><button class="btn danger block" data-action="delete-yes" data-testid="delete-yes">' + I.trash + ' Taip, ištrinti viską</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">Atšaukti</button>'); break;
      case 'delete-yes': try { localStorage.removeItem(LS); } catch (x) { /* */ } S = clone(defaults); S.chats = clone(D.chats); closeSheet(); location.hash = '#/welcome'; toast('Paskyra ir duomenys ištrinti.'); break;
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.switch) return;
    var k = t.dataset.switch;
    if (k === 'f-verified' || k === 'f-online') return; // taikoma paspaudus „Rodyti rezultatus“
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
    var c = findChat(f.dataset.id); c.messages.push({ from: 'me', text: txt, t: Date.now() }); save(); render();
    var id = f.dataset.id;
    setTimeout(function () {
      var cc = findChat(id); if (!cc || S.blocked.indexOf(id) >= 0) return;
      cc.messages.push({ from: 'them', text: D.replies[cc.messages.length % D.replies.length], t: Date.now() });
      if (location.hash !== '#/chat/' + id) cc.unread = true;
      save(); if (location.hash === '#/chat/' + id || location.hash === '#/chats') render();
    }, 1200);
  });

  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* peržiūra veikia ir be SW */ });
  }
})();
