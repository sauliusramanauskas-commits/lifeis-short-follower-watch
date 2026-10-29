/* Tikri – PERŽIŪRA (statinė PWA). Jokio serverio; duomenys tik šioje naršyklėje (localStorage). */ /* v9: Nematomas režimas = nemokamas nustatymas (invisible), Incognito tik Plus; planų sąrašai iš C.FEATURES · v8: EN-redakcija (Incognito mode, apostrofai, slogan) · v7: visi ekranai – LT/EN per T() ir config.js V7 */
(function () {
  'use strict';
  var D = window.TIKRI_DATA, I = window.TIKRI_ICONS, C = window.TIKRI_CONFIG, PL = C.PLANS, LIM = C.LIMITS, Z = C.ZODIAC, V5 = C.V5;
  var LS = 'tikri-preview-v2';
  var BANDS = ['<1 km', '1–2 km', '2–5 km', '5–10 km', '10+ km'];
  var FREE_LIMIT = LIM.freeProfilesPerDay;
  var CONTACT_UNLOCK = LIM.contactUnlockMessages; // po kiek žinučių iš abiejų pusių rodomos nuorodos/kontaktai
  var STEPS = 6;
  var ME_PHOTO = 'assets/img/me.webp';

  var defaults = {
    onboarded: false,
    user: { name: '', birth: '', gender: '', show_me: [], language: 'lt', interests: [], verified: false, checked: false, photo: false, prompts: null, photos: [], photosInit: false,
      consentTerms: false, consentSensitive: false, consentMarketing: false },
    premium: null, // null | 'premium' | 'plus' (tik demo)
    blocked: [], reported: [], likes: [], matches: [], swiped: {}, history: [], view: 'swipe',
    filters: { ageMin: 18, ageMax: 60, band: 4, seek: 'visų', verifiedOnly: false, interests: [], onlineOnly: false, goal: '', zodiacOnly: false, checkedOnly: false, freeToday: false },
    settings: { hideDistance: false, invisible: false, showAge: true, show_zodiac: true, notifications: true, incognito: false },
    chats: null, share: null, openerIdx: {}, available: null, rate: { likes: [], first: [], photos: [] }
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(a, b) { for (var k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; }
  function load() { try { return merge(clone(defaults), JSON.parse(localStorage.getItem(LS)) || {}); } catch (e) { return clone(defaults); } }
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* privatus režimas */ } }
  var S = load();
  if (!S.chats) { S.chats = clone(D.chats); }

  /* ---------- v5: privatūs laukai (gender, show_me, language) ir demo būsenos ---------- */
  /* Reikšmės pagal serverio API.md (GET /api/config -> matching): gender_options vyras|moteris|kita, show_me_options + „visi“ */
  var GENDER = { vyras: { lt: 'Vyras', en: 'Man', sel: 'vyras' }, moteris: { lt: 'Moteris', en: 'Woman', sel: 'moteris' }, kita: { lt: 'Kita', en: 'Other', sel: 'kita' } };
  var SHOW = { vyras: { lt: 'Vyrus', en: 'Men', sel: 'vyrų' }, moteris: { lt: 'Moteris', en: 'Women', sel: 'moterų' }, visi: { lt: 'Visus', en: 'Everyone', sel: 'visų' } };
  var LEG_G = { man: 'vyras', woman: 'moteris', other: 'kita' }, LEG_S = { men: 'vyras', women: 'moteris', everyone: 'visi' };
  function normG(x) { return GENDER[x] ? x : (LEG_G[x] || keyBySel(GENDER, x)); }
  function normS(x) { return SHOW[x] ? x : (LEG_S[x] || keyBySel(SHOW, x)); }
  function T(lt, en) { return lang() === 'en' ? en : lt; }
  function keyBySel(map, sel) { for (var k in map) if (map[k].sel === sel) return k; return ''; }
  function lang() { return S.user.language === 'en' ? 'en' : 'lt'; }
  C.lang = lang;                                                                              /* config.js getteriai (planų pavadinimai, PVM, zodiakas) */
  var E7 = C.V7.EN;
  function intT(x) { return lang() === 'en' ? (E7.INTERESTS[x] || x) : x; }
  function goalT(g, kind) { return lang() === 'en' ? E7.GOAL[g][kind] : ({ pill: { 'draugystė': 'Draugystė', 'pažintys': 'Pažintys', 'santykiai': 'Santykiai' }, looks: { 'draugystė': 'Ieško draugystės', 'pažintys': 'Ieško pažinčių', 'santykiai': 'Ieško santykių' }, filter: { 'draugystė': 'Draugystės', 'pažintys': 'Pažinčių', 'santykiai': 'Santykių' } })[kind][g]; }
  function pbio(p) { return lang() === 'en' && E7.PROFILES[p.id] ? E7.PROFILES[p.id].bio : p.bio; }
  function pjob(p) { return lang() === 'en' && E7.PROFILES[p.id] ? E7.PROFILES[p.id].job : p.job; }
  function pans(p, i) { if (lang() === 'en' && E7.PROFILES[p.id]) return E7.PROFILES[p.id].a[i]; var fx = C.V7.LT_FIX[p.id]; return fx && fx[i] ? fx[i] : p.prompts[i][1]; }
  function dispName(n) { return n === 'Svečias' ? T('Svečias', 'Guest') : n; }
  function openersFor(x) { return lang() === 'en' ? [E7.OPENERS[x] || E7.OPENERS._] : (D.openers[x] || []); }
  function tx(text) { return lang() === 'en' && E7.MSG[text] ? E7.MSG[text] : text; }
  function ensureV5() {
    var u = S.user, old;
    if (u.gender) u.gender = normG(u.gender);                                                /* senesni formatai → vyras|moteris|kita */
    old = (u.show_me && u.show_me.length) ? u.show_me : (u.seeking || []); delete u.seeking;
    u.show_me = old.map(normS).filter(Boolean); if (u.show_me.indexOf('visi') >= 0) u.show_me = ['visi'];
    if (!Array.isArray(u.photos)) u.photos = [];
    if (!S.rate) S.rate = { likes: [], first: [], photos: [] };
    if (!S.created) S.created = Date.now();                                                   /* paskyros amžius – naujos paskyros ribos griežtesnės */
    if (S.settings.incognito === undefined) S.settings.incognito = false;
    if (u.language !== 'en') u.language = 'lt';
    if (!u.prompts || u.prompts.length !== 3) u.prompts = clone(V5.DEFAULT_PROMPTS);
    if (S.available && !(S.available.until > Date.now())) S.available = null;                /* ženklelis pasibaigė */
    var pc = null, i;
    for (i = 0; i < S.chats.length; i++) if (S.chats[i].id === 'p2') pc = S.chats[i];
    if (pc && !pc.messages.some(function (m) { return m.img; })) pc.messages.push({ from: 'them', img: 'p2b', text: 'Štai vaizdas iš paskutinės kelionės po Dzūkiją.', t: Date.now() - 1000 * 60 * 90 });
  }
  ensureV5(); save();

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
  /* v9: funkcijų vėliavėlės iš config.js (kaip /api/me plan.features) */
  function feat(k) { return C.FEATURES.has(S.premium || 'free', k); }
  function invisibleCtl(on) { return feat('invisible_mode') ? sw('invisible', on) : '<button class="chip locked" data-action="locked" data-what="' + C.FEATURES.label('invisible_mode') + '" data-testid="invisible-locked">' + ic('lock', 14) + '</button>'; }
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
    return '<span class="zchip" data-testid="zchip" data-sign="' + sg.id + '"' + (c ? ' data-zcompat="' + c + '" data-zscore="' + pc + '"' : '') + '>' + zsym(sg) + '<span class="zn">' + esc(sg.name) + '</span>' + (c ? '<span class="zp">' + T('Zodiakas ', 'Zodiac ') + pc + '%</span>' : '') + '</span>';
  }
  function eur(n) { return lang() === 'en' ? (n ? '€' + n.toFixed(2) : '€0') : (n ? n.toFixed(2).replace('.', ',') + ' €' : '0 €'); }
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
  function when(t) { var diff = Date.now() - t; if (diff < 864e5) return hhmm(t); if (diff < 2 * 864e5) return T('vakar', 'yesterday'); return Math.floor(diff / 864e5) + T(' d.', ' d ago'); }
  function ic(name, size) { return I.svg(name, size); }
  function seeded(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function shuffleIn(arr, seed) { var r = seeded(seed), a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function src(f) { return 'assets/img/' + f + '.webp'; }
  function photo(p, i) { return '<img class="ph" src="' + src(p.photos[i || 0]) + '" alt="' + T('DI sugeneruota išgalvoto asmens nuotrauka – ', 'AI-generated photo of a fictional person – ') + esc(p.name) + '" loading="lazy" decoding="async" draggable="false">'; }
  var AI = { toString: function () { return '<span class="ai-tag">' + T('DI sugeneruota', 'AI-generated') + '</span>'; } };
  function meAvatar(cls) {
    return '<span class="avatar ' + (cls || '') + '">' + (S.user.photo ? '<img class="ph" src="' + ME_PHOTO + '" alt="' + T('Mano profilio nuotrauka (DI sugeneruotas pavyzdys)', 'My profile photo (AI-generated sample)') + '">' : '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--grad);color:var(--on-accent);font-weight:800;font-size:28px">' + esc((S.user.name || 'T').charAt(0).toUpperCase()) + '</span>') + '</span>';
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
    openSheet('<h2>' + esc(what) + T(' – Premium funkcija', ' – a Premium feature') + '</h2><p class="muted" style="margin-bottom:24px">' + T('Ši funkcija yra Premium ir Plus planuose. Mokėti nebūtina – nemokama versija leidžia kurti profilį, ieškoti ir rašyti su ribomis.', 'This feature is part of the Premium and Plus plans. Paying is optional – the free version lets you create a profile, search and chat within limits.') + '</p>' +
      '<a class="btn block" href="#/premium" data-action="close-sheet">' + T('Peržiūrėti planus', 'See plans') + '</a><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">' + T('Ne dabar', 'Not now') + '</button>');
  }
  function sw(name, checked, disabled) {
    return '<label class="switch"><input type="checkbox" data-switch="' + name + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span></span></label>';
  }
  function verifiedBadge(p) { return p.verified ? I.verified : ''; }

  /* ---------- v5: „Patikrinta“, „Šiandien ✓“, balsas, klausimai ---------- */
  function isChecked(p) { return V5.CHECKED_IDS.indexOf(p.id) >= 0; }
  function isFreeToday(p) { return V5.AVAILABLE_IDS.indexOf(p.id) >= 0; }
  function checkedBadge() { return '<span class="bdg ok" data-testid="checked-badge">' + ic('shield', 12) + T('Patikrinta', 'Verified') + '</span>'; }
  function freeBadge() { return '<span class="bdg free" data-testid="free-badge" title="' + T('Šiandien galiu susitikti', 'Free to meet today') + '"><i></i>' + T('Šiandien ✓', 'Today ✓') + '</span>'; }
  function badgesHtml(p) { var h = (isChecked(p) ? checkedBadge() : '') + (isFreeToday(p) ? freeBadge() : ''); return h ? '<span class="bdgs">' + h + '</span>' : ''; }
  var ICON_MORE = '<svg class="ico" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';
  var ICON_PLAY = '<svg class="ico" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>';
  var ICON_PAUSE = '<svg class="ico" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';
  function availLeft() { var a = S.available; if (a && a.until > Date.now()) return a; if (a) { S.available = null; save(); } return null; }
  function setAvail(opt) {
    var d = null, until;
    V5.DURATIONS.forEach(function (x) { if (x.id === opt) d = x; }); if (!d) d = V5.DURATIONS[0];
    if (d.id === 'midnight') { var m = new Date(); m.setHours(24, 0, 0, 0); until = m.getTime(); } else until = Date.now() + d.hours * 36e5;
    S.available = { opt: d.id, until: until }; save();
  }
  function durLabel(d) { return T(d.label, d.en); }
  function leftText(until) {
    var mins = Math.max(1, Math.ceil((until - Date.now()) / 6e4)), h = Math.floor(mins / 60), m = mins % 60;
    return mins >= 60 ? T('liko ~' + h + ' val. ' + (m ? m + ' min.' : ''), '~' + h + ' h ' + (m ? m + ' min' : '') + ' left') : T('liko ~' + mins + ' min.', '~' + mins + ' min left');
  }
  function availCard() {
    var a = availLeft();
    return '<div class="card availcard' + (a ? ' on' : '') + '" id="avail-card" data-testid="avail-card" style="margin-top:16px"><div class="switch-row" style="padding:0"><span class="lbl"><b>' + ic('clock', 18) + ' ' + T('Šiandien galiu susitikti', 'Free to meet today') + '</b>' +
      '<small data-testid="avail-status">' + (a ? T('Aktyvu iki ', 'Active until ') + hhmm(a.until) + ' · ' + leftText(a.until) : T('Parodyk, kad šiandien gali susitikti. Ženklelis pats dings, kai baigsis laikas.', 'Show that you can meet today. The badge disappears by itself when the time runs out.')) + '</small></span>' + sw('available', !!a) + '</div>' +
      (a ? '<div class="chips" style="margin-top:16px" role="group" aria-label="' + T('Kiek laiko', 'For how long') + '">' + V5.DURATIONS.map(function (d) { return '<button class="chip" data-action="avail-opt" data-opt="' + d.id + '" data-testid="avail-' + d.id + '" aria-pressed="' + (a.opt === d.id) + '">' + durLabel(d) + '</button>'; }).join('') + '</div>' : '') +
      '<p class="tiny muted" style="margin:16px 0 0">' + T('Kiti mato tik ženklelį „Šiandien ✓“ – ne vietos ir ne tikslaus laiko. Pasirinkimas išsaugomas tik šioje naršyklėje.', 'Others only see the “Today ✓” badge – not your location or exact time. Your choice is saved only in this browser.') + '</p></div>';
  }
  function verifyCard() {
    var ok = S.user.checked;
    return '<div class="card vcard' + (ok ? ' ok' : '') + '" data-testid="verify-card" style="margin-top:16px"><div class="row between"><h3>' + ic('shield', 18) + ' ' + T('Patikra', 'Verification') + '</h3>' + (ok ? '<span class="tag sage">' + T('Patikrinta', 'Verified') + '</span>' : '<span class="tag">' + T('Nemokama', 'Free') + '</span>') + '</div>' +
      '<p class="small muted" style="margin:8px 0 16px">' + (ok ? T('Tavo profilis turi ženklelį „Patikrinta“. Kiti gali rodyti tik patikrintus profilius.', 'Your profile has the “Verified” badge. Others can choose to see only verified profiles.') : T('Gauk ženklelį „Patikrinta“ – 4 trumpi žingsniai. Nuotrauka ištrinama iškart po patikros.', 'Get the “Verified” badge – 4 short steps. The photo is deleted right after the check.')) + '</p>' +
      '<a class="btn small ' + (ok ? 'ghost' : '') + ' block" href="#/verify" data-testid="verify-link">' + (ok ? T('Peržiūrėti žingsnius', 'View the steps') : T('Pradėti patikrą (demo)', 'Start verification (demo)')) + '</a></div>';
  }
  function qT(q) { return lang() === 'en' ? (V5.EN.Q[q] || q) : q; }
  function ansT(i, a) { return (lang() === 'en' && a === V5.DEFAULT_PROMPTS[i].a) ? V5.EN.DEFAULT_A[i] : a; }
  function promptsCard() {
    var ps = S.user.prompts;
    var rows = ps.map(function (x, i) {
      var av = ansT(i, x.a);
      return '<div class="pedit"><label class="sr" for="pq-' + i + '">' + T('Klausimas ', 'Question ') + (i + 1) + '</label><select class="input pq" id="pq-' + i + '" data-testid="pq-' + i + '">' +
        V5.PROMPT_QUESTIONS.map(function (q) { return '<option value="' + esc(q) + '"' + (q === x.q ? ' selected' : '') + '>' + esc(qT(q)) + '</option>'; }).join('') + '</select>' +
        '<label class="sr" for="pa-' + i + '">' + T('Atsakymas ', 'Answer ') + (i + 1) + '</label><textarea class="input pa" id="pa-' + i + '" data-testid="pa-' + i + '" rows="2" maxlength="' + V5.PROMPT_MAX + '" placeholder="' + T('Parašyk trumpai…', 'Keep it short…') + '">' + esc(av) + '</textarea>' +
        '<span class="tiny faint pcount" data-for="pa-' + i + '">' + av.length + '/' + V5.PROMPT_MAX + '</span></div>';
    }).join('');
    return '<div class="card" data-testid="prompts-card" style="margin-top:16px"><div class="row between"><h3>' + ic('chat', 18) + ' ' + T('Mano atsakymai', 'My answers') + '</h3><span class="tag sage">' + T('3 klausimai', '3 questions') + '</span></div>' +
      '<p class="small muted" style="margin:8px 0 16px">' + T('Pasirink klausimus ir atsakyk savais žodžiais. Pagal juos kiti gaus pirmos žinutės idėjų.', 'Pick questions and answer in your own words. Others get first-message ideas based on them.') + '</p>' + rows +
      '<div class="err" id="err" role="alert"></div><button class="btn small block" data-action="save-prompts" data-testid="save-prompts">' + T('Išsaugoti atsakymus', 'Save answers') + '</button></div>';
  }
  var VBARS = [6, 10, 16, 9, 20, 14, 8, 18, 24, 12, 7, 15, 21, 10, 6, 13, 19, 9, 5, 11, 17, 8, 12, 6];
  function voiceCard(tid, title, sub) {
    return '<div class="voice" data-state="idle" data-testid="' + tid + '"><button class="vplay" data-action="voice-play" aria-label="' + T('Groti demo signalą', 'Play the demo tone') + '" data-testid="' + tid + '-play">' + ICON_PLAY + '</button>' +
      '<div class="vmain"><b>' + esc(title) + '</b><span class="vbars" aria-hidden="true">' + VBARS.map(function (h) { return '<i style="height:' + h + 'px"></i>'; }).join('') + '</span><small>' + esc(sub) + '</small></div><span class="vtime">0:02</span></div>';
  }
  var audio = { ctx: null, stopFn: null, el: null, raf: 0, plays: 0 };
  window.__tikriAudio = { plays: 0, active: false };
  function voiceReset(el) {
    if (!el) return; el.dataset.state = 'idle';
    var b = el.querySelector('.vplay'); if (b) b.innerHTML = ICON_PLAY;
    el.querySelectorAll('.vbars i').forEach(function (i) { i.classList.remove('on'); });
  }
  function stopVoice() {
    if (audio.raf) cancelAnimationFrame(audio.raf); audio.raf = 0;
    if (audio.stopFn) { try { audio.stopFn(); } catch (e) { /* */ } audio.stopFn = null; }
    voiceReset(audio.el); audio.el = null; window.__tikriAudio.active = false;
  }
  function playVoice(el) {
    if (audio.el === el) { stopVoice(); return; }
    stopVoice();
    var AC = window.AudioContext || window.webkitAudioContext, total = V5.VOICE.total * 1000;
    if (AC) {
      try {
        var ctx = audio.ctx || (audio.ctx = new AC()); if (ctx.state === 'suspended') ctx.resume();
        var at = ctx.currentTime + 0.05, oscs = [];
        V5.VOICE.notes.forEach(function (n) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = n[0];
          g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.16, at + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, at + n[1]);
          o.connect(g); g.connect(ctx.destination); o.start(at); o.stop(at + n[1] + 0.03); oscs.push(o); at += n[1] * 0.9;
        });
        audio.stopFn = function () { oscs.forEach(function (o) { try { o.stop(); } catch (e) { /* */ } }); };
      } catch (e) { toast(T('Garsas šiame įrenginyje neleidžiamas.', 'Sound isn\'t allowed on this device.')); }
    } else toast(T('Garsas šioje naršyklėje nepalaikomas.', 'Sound isn\'t supported in this browser.'));
    audio.el = el; audio.plays++; window.__tikriAudio.plays = audio.plays; window.__tikriAudio.active = true;
    el.dataset.state = 'playing'; el.querySelector('.vplay').innerHTML = ICON_PAUSE;
    var bars = el.querySelectorAll('.vbars i'), t0 = performance.now();
    (function tick(now) {
      var k = Math.min(1, (now - t0) / total), n = Math.round(k * bars.length);
      bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
      if (k >= 1) { stopVoice(); return; }
      audio.raf = requestAnimationFrame(tick);
    })(t0);
  }
  function snippet(a) { var t = String(a).split(/[.,;!?]/)[0].trim(); if (t.length > 46) t = t.slice(0, 43).replace(/\s+\S*$/, '') + '…'; return t.charAt(0).toLowerCase() + t.slice(1); }
  function suggestOpeners(p) {
    var out = [];
    var en = lang() === 'en';
    p.prompts.forEach(function (pr) { var tpl = en ? V5.EN.OPENERS[pr[0]] : V5.OPENER_TEMPLATES[pr[0]]; if (tpl) out.push(tpl.replace('{a}', snippet(pr[1]))); });
    var shr = shared(p), it = (shr.length ? shr : p.interests)[0];
    out.push(en ? V5.EN.FALLBACK[(it || '').length % V5.EN.FALLBACK.length] : (D.openers[it] || D.openers._)[0]);
    return out.slice(0, 3);
  }
  function suggestHtml(p) {
    return '<div class="sugg" data-testid="opener-suggest"><div class="sugg-h">' + ic('spark', 16) + T('Pirmos žinutės idėjos pagal ' + esc(p.name) + ' atsakymus', 'First-message ideas based on ' + esc(p.name) + '\'s answers') + '</div>' +
      suggestOpeners(p).map(function (t, i) { return '<button class="sugg-i" data-action="pick-opener" data-id="' + p.id + '" data-i="' + i + '" data-testid="opener-' + i + '">' + esc(t) + '</button>'; }).join('') + '</div>';
  }
  var pendingDraft = {};

  /* ---------- v5: nuotraukos (iki 6), Incognito, rate_limited ---------- */
  function myPhotos() {
    var u = S.user;
    if (!u.photosInit) { u.photosInit = true; if (u.photo && !u.photos.length) u.photos = [{ id: 'ph0', status: 'approved', v: 0 }]; }
    return u.photos;
  }
  function photosCard() {
    var ps = myPhotos(), max = V5.PHOTOS.MAX, firstOk = -1;
    ps.forEach(function (x, i) { if (firstOk < 0 && x.status === 'approved') firstOk = i; });
    var tiles = ps.map(function (x, i) {
      var cr = V5.PHOTOS.CROPS[x.v % V5.PHOTOS.CROPS.length];
      return '<div class="ptile' + (x.status === 'pending' ? ' pend' : '') + '" data-testid="my-photo" data-status="' + x.status + '"><img class="ph in" src="' + ME_PHOTO + '" style="object-position:' + cr + '" alt="' + esc(T('Mano nuotrauka ', 'My photo ') + (i + 1) + T(' (DI sugeneruotas pavyzdys)', ' (AI-generated sample)')) + '">' +
        (i === firstOk ? '<span class="pmain">' + T('Pagrindinė', 'Main') + '</span>' : '') +
        (x.status === 'pending' ? '<span class="bdg pendb" data-testid="pending-badge">' + ic('clock', 12) + T('Laukia patikrinimo', 'Pending review') + '</span>' : '') +
        '<button class="pdel" data-action="photo-del" data-i="' + i + '" data-testid="photo-del" aria-label="' + T('Ištrinti nuotrauką', 'Delete photo') + '">' + ic('close', 14) + '</button></div>';
    }).join('');
    var add = ps.length < max ? '<button class="ptile padd" data-action="photo-add" data-testid="photo-add">' + ic('plus', 22) + '<span>' + T('Pridėti', 'Add') + '</span></button>' : '';
    var pend = ps.some(function (x) { return x.status === 'pending'; });
    return '<div class="card" data-testid="photos-card" style="margin-top:16px"><div class="row between"><h3>' + ic('image', 18) + ' ' + T('Mano nuotraukos', 'My photos') + '</h3><span class="tag" data-testid="photo-count">' + ps.length + '/' + max + '</span></div>' +
      '<div class="pgrid" style="margin-top:16px">' + tiles + add + '</div>' +
      '<p class="tiny muted" style="margin:16px 0 0" data-testid="photo-note">' + (pend ? T('Naujos nuotraukos pirmiausia peržiūrimos. Ženklelį „Laukia patikrinimo“ matai tik tu – kiti mato tik patvirtintas nuotraukas.', 'New photos are reviewed first. Only you see the “Pending review” badge – others only see approved photos.') : T('Iki ' + max + ' nuotraukų. Naujos nuotraukos pirmiausia peržiūrimos; kol laukia, jas mato tik tu.', 'Up to ' + max + ' photos. New photos are reviewed first; while pending, only you can see them.')) + '</p></div>';
  }
  function incognitoCard() {
    var on = !!S.settings.incognito, plus = feat('incognito_mode');
    return '<div class="card" data-testid="incognito-card" style="margin-top:16px"><div class="switch-row" style="padding:0"><span class="lbl"><b>' + ic('eyeOff', 18) + ' Incognito ' + (plus ? '' : '<span class="tag gold">Plus</span>') + '</b>' +
      '<small data-testid="incognito-desc">' + C.FEATURES.note('incognito_mode') + '</small></span>' + sw('incognito', on) + '</div>' +
      (on ? '<p class="tiny muted" style="margin:12px 0 0" data-testid="incognito-on">' + T('Įjungta. Kai pamėgsti žmogų, jis gali pamatyti tavo profilį. Jei Plus baigsis, nustatymas liks įjungtas, bet pakartotinai įjungti be Plus negalėsi.', 'On. When you like someone, they can see your profile. If Plus ends the setting stays on, but you cannot turn it back on without Plus.') + '</p>' : '') + '</div>';
  }
  /* rate_limited (API.md „Anti-spam“): valandos ir dienos ribos, griežtesnės pirmas 24 val.; dienos patiktukų kvota pagal planą */
  function acctNew() { return S.created ? Date.now() - S.created < V5.RATE.NEW_ACCOUNT_MS : true; }
  function rateLimits() {
    var R = V5.RATE, t = acctNew() ? R.NEW : R.NORMAL, plan = S.premium || 'free', pd = R.PLAN_LIKES_DAY[plan] || R.PLAN_LIKES_DAY.free;
    return { newAccount: acctNew(), plan: plan, planLikesDay: pd, accountLikesDay: t.likesDay, likesHour: t.likesHour, likesDay: Math.min(t.likesDay, pd),
      firstHour: t.firstHour, firstDay: t.firstDay, photosHour: V5.PHOTOS.PER_HOUR, photosDay: V5.PHOTOS.PER_DAY };
  }
  window.__tikriRate = rateLimits;                                                           /* derinimui / testams: kokios ribos dabar galioja */
  function rateCheck(list) {
    var R = V5.RATE, L = rateLimits(), now = Date.now(), arr = (S.rate[list] || []).filter(function (x) { return now - x < R.DAY_MS; });
    S.rate[list] = arr;
    var hr = arr.filter(function (x) { return now - x < R.HOUR_MS; });
    var h = list === 'likes' ? L.likesHour : list === 'first' ? L.firstHour : L.photosHour, d = list === 'likes' ? L.likesDay : list === 'first' ? L.firstDay : L.photosDay;
    var reason = list === 'likes' ? 'like_velocity' : list === 'first' ? 'first_message_velocity' : 'photos';
    if (hr.length >= h) return { list: list, reason: reason, scope: 'hour', limit: h, retry: Math.max(1, Math.ceil((hr[0] + R.HOUR_MS - now) / 1000)) };
    if (arr.length >= d) return { list: list, reason: (list === 'likes' && L.planLikesDay < L.accountLikesDay) ? null : reason, scope: 'day', limit: d, plan: L.plan, retry: Math.max(1, Math.ceil((arr[0] + R.DAY_MS - now) / 1000)) };
    return null;
  }
  function rateText(r) {
    var n = r.limit;
    if (r.list === 'likes') {
      if (r.scope === 'hour') return [T('Per trumpą laiką davei daug patiktukų. Pailsėk kelias minutes – tada vėl galėsi.', 'You\'ve liked a lot of people in a short time. Take a short break and you can carry on.')];
      if (!r.reason) return [T('Šiandienos patiktukų limitas (' + n + ') pasiektas. Nauji patiktukai atsiras po paros' + (r.plan === 'plus' ? '.' : '; daugiau per dieną – Premium ir Plus planuose.'), 'You have used today\'s likes (' + n + '). More will be available in 24 hours' + (r.plan === 'plus' ? '.' : '; Premium and Plus include more per day.'))];
      return [T('Šiandien davei labai daug patiktukų. Pailsėk – vėl galėsi po paros.', 'You\'ve liked a lot of people today. Take a rest – you can carry on in a day.')];
    }
    if (r.list === 'first') return [r.scope === 'hour'
      ? T('Per daug naujų pokalbių per trumpą laiką. Esamuose pokalbiuose rašyti gali toliau – pirmas žinutes siųsk šiek tiek lėčiau.', 'That\'s a lot of new conversations in a short time. You can keep chatting in existing ones – just send first messages a bit slower.')
      : T('Šiandien pradėjai daug naujų pokalbių. Esamuose pokalbiuose rašyti gali toliau, o naujus pradėsi vėliau.', 'You\'ve started many new conversations today. You can keep chatting in existing ones and start new ones a little later.')];
    return [r.scope === 'hour' ? T('Per daug nuotraukų įkelta per valandą. Pabandyk šiek tiek vėliau.', 'You\'ve uploaded a lot of photos this hour. Please try again a little later.') : T('Šiandien įkelta daug nuotraukų. Pabandyk vėliau.', 'You\'ve uploaded many photos today. Please try again later.')];
  }
  function rateWaitText(s) {
    if (s >= 7200) { var h = Math.ceil(s / 3600); return T('Pabandyk vėl po ~' + h + ' val.', 'Try again in ~' + h + ' h.'); }
    var m = Math.max(1, Math.ceil(s / 60)); return T('Pabandyk vėl po ~' + m + ' min.', 'Try again in ~' + m + ' min.');
  }
  function rateSheet(r) {
    var code = 'rate_limited' + (r.reason ? ' · reason: ' + r.reason : '') + ' · scope: ' + (r.reason ? r.scope : 'likes_per_day (' + r.plan + ': ' + r.limit + ')') + ' · Retry-After: ' + r.retry + ' s';
    var up = (!r.reason && r.plan !== 'plus') ? '<a class="btn block" href="#/premium" data-action="close-sheet" data-testid="rate-upgrade" style="margin-bottom:8px">' + T('Peržiūrėti planus', 'See plans') + '</a>' : '';
    openSheet('<div class="row between"><h2 style="margin:0">' + T('Lėtinam tempą', 'Let\'s slow down a little') + '</h2><button class="icon-btn" data-action="close-sheet" aria-label="' + T('Uždaryti', 'Close') + '">' + I.close + '</button></div>' +
      '<p style="margin:12px 0 8px" data-testid="rate-msg">' + esc(rateText(r)[0]) + '</p>' +
      '<p class="muted small" style="margin:0 0 8px" data-testid="rate-wait">' + rateWaitText(r.retry) + '</p>' +
      '<p class="tiny faint" style="margin:0 0 24px" data-testid="rate-code">' + code + '</p>' + up +
      '<button class="btn ' + (up ? 'ghost ' : '') + 'block" data-action="close-sheet" data-testid="rate-ok">' + T('Gerai', 'OK') + '</button>');
  }
  function likeBlocked() { var r = rateCheck('likes'); if (r) { rateSheet(r); return true; } return false; }
  function plusSheet() {
    openSheet('<div class="row between"><h2 style="margin:0">' + T('Incognito – tik su Plus', 'Incognito needs Plus') + '</h2><button class="icon-btn" data-action="close-sheet" aria-label="' + T('Uždaryti', 'Close') + '">' + I.close + '</button></div>' +
      '<p class="muted" style="margin:12px 0 8px">' + C.FEATURES.note('incognito_mode') + '. ' + T('Šis režimas yra Plus plane. Mokėti nebūtina – nemokama versija veikia kaip anksčiau.', 'This mode is part of the Plus plan. Paying is optional – the free version works as before.') + '</p>' +
      '<p class="tiny faint" data-testid="plan-code" style="margin:0 0 24px">plan_required · required_plan: plus · current_plan: ' + (S.premium || 'free') + '</p>' +
      '<a class="btn block" href="#/premium" data-action="close-sheet" data-testid="incognito-upgrade">' + T('Peržiūrėti Plus', 'See Plus') + '</a><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">' + T('Ne dabar', 'Not now') + '</button>');
  }
  function photoHtml(x, idx, cid) {
    return '<div class="pimg' + (x.shown ? ' shown' : '') + '" data-testid="chat-photo" data-i="' + idx + '"><span class="skel" style="position:absolute;inset:0"></span><img class="ph in" src="' + src(x.img) + '" alt="' + T('DI sugeneruota pokalbio nuotrauka', 'AI-generated chat photo') + '" draggable="false">' +
      '<div class="pveil"><span class="pv-t">' + ic('eyeOff', 22) + T('Neryškinta nuotrauka', 'Blurred photo') + '</span><button class="btn small" data-action="photo-show" data-id="' + cid + '" data-i="' + idx + '" data-testid="photo-show">' + T('Rodyti', 'Show') + '</button></div>' +
      '<button class="phide" data-action="photo-hide" data-id="' + cid + '" data-i="' + idx + '" aria-label="' + T('Paslėpti nuotrauką', 'Hide photo') + '">' + ic('eyeOff', 16) + ' ' + T('Paslėpti', 'Hide') + '</button></div>';
  }
  function copyText(t, done) {
    function fb() { var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* */ } ta.remove(); done(ok); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, fb); else fb();
  }
  function dateText() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
    if (lang() === 'en') return 'Date with ' + (g('d-who') || '(name)') + ' (we met on Tikri)\nPlace: ' + (g('d-place') || '(add a place)') + '\nTime: ' + (g('d-day') || 'Today') + ' ' + (g('d-time') || '19:00') +
      '\nI will message you when I arrive and when I get home. If I do not reply within an hour after the date – please call me.';
    return 'Pasimatymas su ' + (g('d-who') || '(vardas)') + ' (susipažinome per Tikri)\nVieta: ' + (g('d-place') || '(įrašyk vietą)') + '\nLaikas: ' + (g('d-day') || 'Šiandien') + ' ' + (g('d-time') || '19:00') +
      '\nParašysiu, kai ateisiu ir kai grįšiu namo. Jei per valandą po pasimatymo neatsakysiu – paskambink man.';
  }
  function dateSheet(p) {
    openSheet('<div class="row between"><h2 style="margin:0">' + T('Pasidalink pasimatymu su draugu', 'Share your date with a friend') + '</h2><button class="icon-btn" data-action="close-sheet" aria-label="' + T('Uždaryti', 'Close') + '">' + I.close + '</button></div>' +
      '<p class="muted small" style="margin:8px 0 16px">' + T('Paruošk trumpą tekstą ir nusiųsk jį draugui. Peržiūroje niekas nesiunčiama – tekstas lieka tavo įrenginyje.', 'Prepare a short text and send it to a friend. Nothing is sent in this preview – the text stays on your device.') + '</p>' +
      '<label class="field"><span>' + T('Vieta', 'Place') + '</span><input class="input" id="d-place" data-testid="d-place" maxlength="70" placeholder="' + T('pvz. kavinė „Tiltas“, Gedimino pr.', 'e.g. Tiltas café, Gedimino pr.') + '"></label>' +
      '<div class="two"><label class="field"><span>' + T('Diena', 'Day') + '</span><select class="input" id="d-day" data-testid="d-day"><option>' + T('Šiandien', 'Today') + '</option><option>' + T('Rytoj', 'Tomorrow') + '</option></select></label>' +
      '<label class="field"><span>' + T('Laikas', 'Time') + '</span><input class="input" id="d-time" data-testid="d-time" type="time" value="19:00"></label></div>' +
      '<label class="field"><span>' + T('Su kuo', 'With whom') + '</span><input class="input" id="d-who" data-testid="d-who" maxlength="40" value="' + esc(p.name) + '"></label>' +
      '<div class="dprev"><div class="eyebrow">' + T('Tekstas draugui', 'Text for your friend') + '</div><pre id="d-text" data-testid="date-text"></pre></div>' +
      '<div class="err" id="err" role="alert"></div>' +
      '<div class="row" style="gap:8px"><button class="btn ghost" style="flex:1" data-action="date-copy" data-testid="date-copy">' + T('Kopijuoti', 'Copy') + '</button><button class="btn" style="flex:1" data-action="date-share" data-testid="date-share">' + ic('share', 18) + ' ' + T('Dalintis', 'Share') + '</button></div>',
      function (el) {
        var out = el.querySelector('#d-text');
        function upd() { out.textContent = dateText(); }
        el.addEventListener('input', upd); el.addEventListener('change', upd); upd();
      });
  }
  function ensureChat(id) { var c = findChat(id); if (!c) { c = { id: id, unread: false, messages: [] }; S.chats.unshift(c); } return c; }
  function findChat(id) { for (var i = 0; i < S.chats.length; i++) if (S.chats[i].id === id) return S.chats[i]; return null; }

  /* ---------- Sveiki / registracija ---------- */
  function welcome() {
    var cp = function (id, cls) { var p = byId(id); return '<div class="pc ' + cls + '">' + skelImg(photo(p)) + '</div>'; };
    return { tabs: false, html:
      '<section class="welcome">' +
      '<div class="collage">' + cp('p13', 'c2') + cp('p3', 'c1') + cp('p2', 'c3') + '<span class="heart-b">' + I.fill('heart', 24) + '</span></div>' +
      '<div class="brand">' + I.logo + 'Tikri</div>' +
      '<h1>' + T('<span>Tikri žmonės.</span><span>Tikri susitikimai.</span><span class="acc">Tavo privatumas – tavo.</span>', '<span>Real people.</span><span>Real dates.</span><span class="acc">Your privacy, your call.</span>') + '</h1>' +
      '<p class="lead">' + T('Patvirtinti profiliai, apytikslis atstumas vietoje tikslios vietos ir saugumo įrankiai pirmam pasimatymui.', 'Verified profiles, approximate distance instead of an exact location, and safety tools for a first date.') + '</p>' +
      '<a class="btn block" href="#/register/1" data-testid="start">' + T('Pradėti', 'Get started') + ' ' + ic('arrow') + '</a>' +
      (S.onboarded ? '<a class="textlink center" href="#/nearby">' + T('Tęsti kaip ', 'Continue as ') + esc(S.user.name ? dispName(S.user.name) : T('svečias', 'guest')) + '</a>' : '<button class="textlink" data-action="demo-skip">' + T('Praleisti registraciją (demo)', 'Skip sign-up (demo)') + '</button>') +
      '<div class="center" style="margin-top:8px"><button class="textlink" data-lang="' + (lang() === 'en' ? 'lt' : 'en') + '" data-testid="welcome-lang">' + (lang() === 'en' ? 'Lietuvių' : 'English') + '</button></div>' +
      '<p class="age-note"><b>18+</b>' + T('Tik pilnamečiams. Amžių patikrinsime registruojantis.', 'Adults only. We will check your age when you sign up.') + '</p>' +
      '</section>' };
  }
  function skelImg(imgHtml) { return '<span class="skel" style="position:absolute;inset:0"></span>' + imgHtml; }

  function obShell(n, title, sub, body, foot) {
    return '<div class="ob"><div class="ob-top"><a class="icon-btn" href="' + (n === 1 ? '#/welcome' : '#/register/' + (n - 1)) + '" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a>' +
      '<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="' + STEPS + '" aria-valuenow="' + n + '" aria-label="' + T('Žingsnis ' + n + ' iš ' + STEPS, 'Step ' + n + ' of ' + STEPS) + '"><i style="width:' + ((n - 1) / STEPS * 100) + '%" data-to="' + (n / STEPS * 100) + '"></i></div><span class="step">' + n + '/' + STEPS + '</span></div>' +
      '<h1 class="ob-h">' + title + '</h1>' + (sub ? '<p class="ob-sub">' + sub + '</p>' : '') +
      '<div class="ob-body">' + body + '</div><div class="ob-foot"><div class="err" id="err" role="alert"></div>' + foot + '</div></div>';
  }

  var LT_MONTHS = ['sausis','vasaris','kovas','balandis','gegužė','birželis','liepa','rugpjūtis','rugsėjis','spalis','lapkritis','gruodis'];
  var EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function daysIn(y, m) { return (y && m) ? new Date(+y, +m, 0).getDate() : 31; }
  function dayOpts(y, m, sel) { var h = '<option value="">' + T('Diena', 'Day') + '</option>', n = daysIn(y, m); for (var d = 1; d <= n; d++) h += '<option value="' + d + '"' + (+sel === d ? ' selected' : '') + '>' + d + '</option>'; return h; }
  function dobPicker(birth) {
    var p = (birth || '').split('-'), by = p[0] || '', bm = p[1] ? +p[1] : '', bd = p[2] ? +p[2] : '';
    var top = new Date().getFullYear() - 18, yo = '<option value="">' + T('Metai', 'Year') + '</option>', mo = '<option value="">' + T('Mėnuo', 'Month') + '</option>';
    for (var y = top; y >= top - 82; y--) yo += '<option value="' + y + '"' + (+by === y ? ' selected' : '') + '>' + y + '</option>';
    for (var i = 1; i <= 12; i++) mo += '<option value="' + i + '"' + (bm === i ? ' selected' : '') + '>' + (lang() === 'en' ? EN_MONTHS : LT_MONTHS)[i - 1] + '</option>';
    return '<div class="field"><span>' + T('Gimimo data', 'Date of birth') + '</span><div class="dob" role="group" aria-label="' + T('Gimimo data', 'Date of birth') + '">' +
      '<select class="input" id="f-by" aria-label="' + T('Metai', 'Year') + '">' + yo + '</select>' +
      '<select class="input" id="f-bm" aria-label="' + T('Mėnuo', 'Month') + '">' + mo + '</select>' +
      '<select class="input" id="f-bd" aria-label="' + T('Diena', 'Day') + '">' + dayOpts(by, bm, bd) + '</select></div></div>';
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
      html = obShell(1, T('Susipažinkime', 'Let\'s get to know you'), T('Kaip tave vadinti ir kada gimei?', 'What should we call you, and when were you born?'),
        '<label class="field">' + T('<span>Vardas (rodomas profilyje)</span>', '<span>Name (shown on your profile)</span>') + '<input class="input" id="f-name" maxlength="30" autocomplete="given-name" value="' + esc(u.name) + '" placeholder="' + T('pvz. Rasa', 'e.g. Rasa') + '"></label>' +
        dobPicker(u.birth) +
        '<p class="muted small">' + T('Tikri skirta tik 18+ metų žmonėms. Profilyje rodomas tik amžius metais ir zodiako ženklas, ne gimimo data.', 'Tikri is only for people aged 18+. Your profile shows only your age in years and your zodiac sign, not your date of birth.') + '</p>',
        '<button class="btn block" data-action="step1">' + T('Toliau', 'Next') + '</button>');
    } else if (n === 2) {
      var L = lang(), en = L === 'en';
      var g = function (key) { return '<button class="chip" data-gender="' + GENDER[key].sel + '" aria-pressed="' + (u.gender === key) + '">' + GENDER[key][L] + '</button>'; };
      var k = function (key) { return '<button class="chip" data-seek="' + SHOW[key].sel + '" aria-pressed="' + (u.show_me.indexOf(key) >= 0) + '">' + SHOW[key][L] + '</button>'; };
      var lg = function (v, l) { return '<button class="chip" data-lang="' + v + '" aria-pressed="' + (u.language === v) + '">' + l + '</button>'; };
      html = obShell(2, en ? 'About you' : 'Apie tave', '',
        '<h3>' + (en ? 'I am' : 'Aš esu') + '</h3><div class="choice-grid">' + g('vyras') + g('moteris') + g('kita') + '</div>' +
        '<h3 style="margin-top:32px">' + (en ? 'Show me' : 'Noriu matyti') + ' <span class="tag sage">' + (en ? 'optional' : 'neprivaloma') + '</span></h3>' +
        '<p class="muted small" style="margin-bottom:16px">' + (en ? 'You can pick several. This is sensitive data, so you do not have to answer – then you will see everyone.' : 'Gali pažymėti kelis. Tai jautrus duomuo (susijęs su orientacija), todėl jo nurodyti neprivalai – tada matysi visus.') + '</p>' +
        '<div class="choice-grid">' + k('vyras') + k('moteris') + k('visi') + '</div>' +
        '<button class="btn ghost small" style="margin-top:16px" data-action="seek-none">' + (en ? 'Prefer not to say' : 'Nenoriu nurodyti') + '</button>' +
        '<h3 style="margin-top:32px">Kalba · Language</h3><div class="chips">' + lg('lt', 'Lietuvių') + lg('en', 'English') + '</div>' +
        '<div class="notice" style="margin-top:24px" data-testid="private-note">' + ic('lock', 18) + '<span>' + privateNote() + '</span></div>',
        '<button class="btn block" data-action="step2">' + (en ? 'Next' : 'Toliau') + '</button>');
    } else if (n === 3) {
      html = obShell(3, T('Tavo interesai', 'Your interests'), T('Pasirink bent 3. Pagal juos skaičiuojame atitikimą ir siūlome pokalbio pradžią.', 'Pick at least 3. We use them to calculate your match and to suggest conversation starters.'),
        '<div class="chips">' + D.INTERESTS.map(function (x) { return '<button class="chip" data-interest="' + esc(x) + '" aria-pressed="' + (u.interests.indexOf(x) >= 0) + '">' + esc(intT(x)) + '</button>'; }).join('') + '</div>' +
        '<p class="small muted" style="margin-top:16px">' + T('Pasirinkta: <b id="icount"', 'Selected: <b id="icount"') + ' style="color:var(--text)">' + u.interests.length + '</b></p>',
        '<button class="btn block" data-action="step3">' + T('Toliau', 'Next') + '</button>');
    } else if (n === 4) {
      html = obShell(4, T('Pridėk nuotrauką', 'Add a photo'), T('Profiliai su aiškia nuotrauka sulaukia daugiau dėmesio.', 'Profiles with a clear photo get more attention.'),
        (u.photo ? '<div class="photo-slot photo-main"><span class="skel" style="position:absolute;inset:0"></span><img class="ph" src="' + ME_PHOTO + '" alt="' + T('Pavyzdinė DI sugeneruota nuotrauka', 'Sample AI-generated photo') + '">' + AI + '</div>'
          : '<button class="photo-slot photo-main empty-s" data-action="photo-upload" data-testid="photo-upload">' + ic('upload') + T('Pasirink nuotrauką</button>', 'Choose a photo</button>')) +
        '<div class="mini-slots"><div class="photo-slot">' + ic('plus') + '</div><div class="photo-slot">' + ic('plus') + '</div><div class="photo-slot">' + ic('plus') + '</div></div>' +
        '<div class="tips"><div>' + ic('check') + T('<span>Aiškiai matomas veidas, geras apšvietimas.</span>', '<span>Your face clearly visible, good lighting.</span>') + '</div><div>' + ic('check') + T('<span>Tik tu vienas(-a) – be kitų žmonių ir be kontaktų ant nuotraukos.</span>', '<span>Just you – no other people and no contact details in the photo.</span>') + '</div><div>' + ic('shield') + T('<span>Nuotraukas peržiūri moderatoriai. Netinkamos nepaskelbiamos.</span>', '<span>Moderators review photos. Unsuitable ones are not published.</span>') + '</div></div>' +
        '<div class="notice">' + ic('info') + T('<span>Peržiūra: įkėlimas imituojamas – naudojame pavyzdinę DI sugeneruotą nuotrauką. Jokių failų niekur nesiunčiame.</span>', '<span>Preview: the upload is simulated – we use a sample AI-generated photo. No files are sent anywhere.</span>') + '</div>',
        (u.photo ? '<button class="btn block" data-action="step4">' + T('Toliau', 'Next') + '</button>' : '<button class="btn block" data-action="photo-upload">' + ic('upload') + T(' Įkelti nuotrauką</button>', ' Upload a photo</button>') + '<a class="textlink center" ' + T('href="#/register/5">Pridėsiu vėliau</a>', 'href="#/register/5">I\'ll add it later</a>')));
    } else if (n === 5) {
      html = obShell(5, T('Patvirtink, kad tai tu', 'Confirm it\'s you'), T('Padaryk vieną asmenukę – patvirtinti profiliai gauna ženkliuką ', 'Take one selfie – verified profiles get the badge ') + I.verified + '.',
        '<div class="selfie-stage' + (u.verified ? ' done' : '') + '" id="selfie-stage"><div class="selfie-frame' + (u.verified ? ' done' : '') + '" id="selfie"><span class="sil">' + ic('face') + '</span><img class="ph in" src="' + ME_PHOTO + '" alt=""><span class="scan"></span><span class="okb">' + ic('check') + '</span></div>' +
        '<svg class="ring-prog" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="50" rx="49" ry="49" pathLength="1000" vector-effect="non-scaling-stroke"/></svg><div class="corners"><i></i><i></i><i></i><i></i></div></div>' +
        '<p class="hint-pill ok" id="selfie-msg" role="status">' + (u.verified ? T('Profilis patvirtintas!', 'Profile verified!') : '') + '</p>' +
        '<div class="card stack small" style="margin-top:16px">' + T('<p><b>Kaip tai veikia?</b> AI patikrina, ar tai gyvas žmogus ir ar veidas atitinka profilio nuotraukas. Asmenukė nerodoma kitiems ir ištrinama iškart po patikros. Veido šablonų nesaugome.</p>', '<p><b>How does it work?</b> AI checks that you are a real person and that your face matches your profile photos. The selfie is never shown to others and is deleted right after the check. We do not store face templates.</p>') +
        '<p>' + T('<span class="tag">Peržiūra</span> <span class="muted">Šioje peržiūroje kamera neįjungiama – sėkmė tik imituojama.</span>', '<span class="tag">Preview</span> <span class="muted">The camera is not turned on in this preview – success is only simulated.</span>') + '</p></div>',
        (u.verified ? '<a class="btn block" href="#/register/6">' + T('Toliau', 'Next') + '</a>' : '<button class="btn block" data-action="selfie">' + ic('camera') + T(' Padaryti asmenukę</button><a class="textlink center" href="#/register/6">Patvirtinsiu vėliau</a>', ' Take a selfie</button><a class="textlink center" href="#/register/6">I\'ll verify later</a>')));
    } else {
      var sensText = u.show_me.length
        ? T('Aiškiai sutinku, kad Tikri tvarkytų mano <b>jautrius duomenis</b> – <b>ką ieškau (susiję su orientacija)</b> ir <b>apytikslę vietą</b> (tik atstumo juosta) – vien tam, kad galėčiau matyti žmones šalia ir būti matomas(-a). Šiuos duomenis šifruojame, neperduodame reklamai ir AI. Sutikimą galiu bet kada atšaukti nustatymuose (BDAR 9 str. 2 d. a p.).', 'I explicitly consent to Tikri processing my <b>sensitive data</b> – <b>who I am looking for (related to orientation)</b> and my <b>approximate location</b> (distance band only) – solely so that I can see people nearby and be seen. We encrypt this data and do not pass it on for advertising or AI. I can withdraw consent at any time in settings (GDPR Art. 9(2)(a)).')
        : T('Aiškiai sutinku, kad Tikri tvarkytų mano <b>apytikslę vietą</b> (tik atstumo juosta), kad galėčiau matyti žmones šalia ir būti matomas(-a). Orientacijos nenurodžiau – jos netvarkome. Sutikimą galiu bet kada atšaukti nustatymuose (BDAR 9 str. 2 d. a p.).', 'I explicitly consent to Tikri processing my <b>approximate location</b> (distance band only) so that I can see people nearby and be seen. I did not state any orientation – we do not process it. I can withdraw consent at any time in settings (GDPR Art. 9(2)(a)).');
      html = obShell(6, T('Sutikimai', 'Consents'), T('Kiekvienas sutikimas atskiras. Jautrių duomenų sutikimas nėra „paslėptas“ taisyklėse.', 'Each consent is separate. Consent to sensitive data is not “hidden” in the terms.'),
        '<label class="check"><input type="checkbox" id="c-terms"' + (u.consentTerms ? ' checked' : '') + '>' + T('<span>Sutinku su <a href="#" data-action="terms">naudojimosi taisyklėmis</a> ir susipažinau su <a href="#" data-action="terms">privatumo politika</a>. Patvirtinu, kad man yra 18 ar daugiau metų.</span>', '<span>I agree to the <a href="#" data-action="terms">terms of use</a> and have read the <a href="#" data-action="terms">privacy policy</a>. I confirm that I am 18 or older.</span>') + '</label>' +
        '<label class="check sensitive"><input type="checkbox" id="c-sens"' + (u.consentSensitive ? ' checked' : '') + '><span>' + sensText + '</span></label>' +
        '<label class="check"><input type="checkbox" id="c-mkt"' + (u.consentMarketing ? ' checked' : '') + '>' + T('<span><span class="tag sage">neprivaloma</span> Noriu gauti naujienas el. paštu (gali atsisakyti bet kada).</span>', '<span><span class="tag sage">optional</span> Send me news by email – unsubscribe any time.</span>') + '</label>',
        '<button class="btn block" data-action="step5">' + T('Sukurti profilį', 'Create profile') + '</button>');
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
      if (f.checkedOnly && !isChecked(p)) return false;
      if (f.freeToday && !isFreeToday(p)) return false;
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
    if (f.checkedOnly) n++; if (f.freeToday) n++;
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
    return '<a class="pcard" href="#/profile/' + p.id + '" data-testid="pcard"><span class="skel"></span>' + photo(p) + AI + (p.online ? '<span class="dot-online" title="' + T('Neseniai aktyvus(-i)', 'Recently active') + '"></span>' : '') + badgesHtml(p) + '<span class="shade"></span>' +
      '<span class="meta"><span class="nm">' + esc(p.name) + ', ' + p.age + verifiedBadge(p) + '</span>' +
      '<span class="sub"><span class="band">' + ic('near') + esc(p.distLabel) + '</span><span class="match-pct">' + matchPct(p) + '%</span></span>' + zchip(p) + '</span></a>';
  }
  function swCard(p, pos) {
    var sh = shared(p), goalTxt = goalT(p.goal, 'pill');
    var photos = p.photos.map(function (f, i) { return '<div class="pw' + (i === 0 ? ' on' : '') + '"><span class="skel"></span>' + photo(p, i).replace('loading="lazy"', 'loading="eager"') + '</div>'; }).join('');
    var bars = p.photos.length > 1 ? '<div class="bars">' + p.photos.map(function (f, i) { return '<i class="' + (i === 0 ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '';
    var chips = (sh.length ? sh : p.interests).slice(0, 3).map(function (x) { return '<span class="pill' + (sh.indexOf(x) >= 0 ? ' hot' : '') + '">' + esc(intT(x)) + '</span>'; }).join('');
    return '<article class="scard' + (pos === 0 ? ' top' : ' n' + pos) + '" data-id="' + p.id + '" data-photo="0" data-testid="scard" aria-label="' + esc(p.name) + ', ' + p.age + '">' +
      '<div class="sc-photos">' + photos + '</div><div class="shade"></div>' + bars + AI +
      '<span class="stamp like">' + T('PATINKA', 'LIKE') + '</span><span class="stamp pass">' + T('PRALEISTI', 'PASS') + '</span>' +
      '<div class="sc-info"><div class="sc-name">' + esc(p.name) + ' <span class="age">' + p.age + '</span>' + verifiedBadge(p) + '</div>' +
      '<div class="sc-meta"><span class="pill">' + ic('near', 14) + esc(p.distLabel) + '</span><span class="pill">' + esc(goalTxt) + '</span><span class="pill hot">' + matchPct(p) + T('% atitikimas', '% match') + '</span>' + zchip(p) + '</div>' + (isChecked(p) || isFreeToday(p) ? '<div class="sc-meta sc-bdgs">' + (isChecked(p) ? checkedBadge() : '') + (isFreeToday(p) ? freeBadge(p) : '') + '</div>' : '') +
      '<div class="sc-bio">' + esc(pbio(p)) + '</div><div class="sc-meta">' + chips + '</div></div></article>';
  }
  function stackList() { var d = deck(), all = []; d.bands.forEach(function (b) { all = all.concat(b.items); }); return { list: all.filter(function (p) { return !S.swiped[p.id]; }), hidden: d.hidden, total: all.length }; }
  function stageInner() {
    var s = stackList();
    if (!s.list.length) {
      var none = s.total === 0;
      return '<div class="empty"><div class="orb">' + ic(none ? 'sliders' : 'heart') + '</div>' +
        '<h2>' + (none ? T('Nieko neradome', 'No one found') : T('Šiandien viskas!', 'That\'s all for today!')) + '</h2>' +
        '<p>' + (none ? T('Pagal pasirinktus filtrus šalia nieko nėra. Pabandyk praplėsti paiešką.', 'No one nearby matches your filters. Try widening your search.') : T('Peržiūrėjai visus šalia esančius žmones. Sugrįžk vėliau arba peržiūrėk dar kartą.', 'You\'ve seen everyone nearby. Come back later or go through them again.')) + '</p>' +
        (none ? '<button class="btn soft" data-action="reset-filters">' + T('Išvalyti filtrus', 'Clear filters') + '</button>' : '<button class="btn soft" data-action="restart-deck" data-testid="restart-deck">' + ic('undo', 18) + ' ' + T('Peržiūrėti iš naujo', 'Review again') + '</button>') +
        (s.hidden ? '<p class="tiny">' + T('Dar ' + s.hidden + ' ' + (s.hidden === 1 ? 'žmogus' : 'žmonės') + ' šalia – Premium be ribų. ', 'Another ' + s.hidden + ' ' + (s.hidden === 1 ? 'person' : 'people') + ' nearby – Premium has no limits. ') + '<a class="link" href="#/premium">' + T('Plačiau', 'More') + '</a></p>' : '') + '</div>';
    }
    return s.list.slice(0, 3).map(function (p, i) { return swCard(p, i); }).reverse().join('');
  }
  function nearby() {
    if (!S.user.consentSensitive) {
      return { tab: 'nearby', html: '<div class="topbar"><h1>' + T('Šalia tavęs', 'Nearby') + '</h1></div><div class="card stack"><h3>' + T('Paieška išjungta', 'Search is off') + '</h3><p class="muted">' + T('Atšaukei sutikimą tvarkyti apytikslę vietą, todėl šalia esančių žmonių nerodome ir tavęs niekas nemato.', 'You withdrew consent to process your approximate location, so we don\'t show people nearby and no one can see you.') + '</p><a class="btn block" href="#/settings">' + T('Atnaujinti sutikimą', 'Renew consent') + '</a></div>' };
    }
    var fc = activeFilterCount(), mode = S.view === 'grid' ? 'grid' : 'swipe';
    var head = '<div class="topbar"><div class="grow"><h1>' + T('Šalia tavęs', 'Nearby') + '</h1><span class="sub">' + T('Atstumas – tik apytikslėmis juostomis', 'Distance – in approximate bands only') + '</span></div>' +
      '<button class="icon-btn" data-action="filters" aria-label="' + T('Filtrai', 'Filters') + '" data-testid="filters">' + I.sliders + (fc ? '<span style="position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;border-radius:99px;background:var(--grad);color:var(--on-accent);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px">' + fc + '</span>' : '') + '</button></div>' +
      '<div class="seg" role="group" aria-label="' + T('Rodymo būdas', 'View mode') + '"><button data-view="swipe" aria-pressed="' + (mode === 'swipe') + '" data-testid="view-swipe">' + ic('layers', 16) + T('Kortelės', 'Cards') + '</button><button data-view="grid" aria-pressed="' + (mode === 'grid') + '" data-testid="view-grid">' + ic('grid', 16) + T('Tinklelis', 'Grid') + '</button></div>';
    var skel = '<div class="topbar"><div class="grow"><h1>' + T('Šalia tavęs', 'Nearby') + '</h1></div></div>' + (mode === 'grid' ? '<div class="sk-grid"><div class="skel-box"></div><div class="skel-box"></div><div class="skel-box"></div><div class="skel-box"></div></div>' : '<div class="sk-card skel-box" style="height:60dvh"></div>');
    if (mode === 'swipe') {
      return { tab: 'nearby', mode: 'swipe', skel: skel, key: 'near', html: head +
        '<div class="stage" id="stage" data-testid="stage">' + stageInner() + '</div>' +
        '<div class="sw-ctrl" id="sw-ctrl"><button class="rbtn sm" data-action="undo" data-testid="btn-undo" aria-label="' + T('Atšaukti paskutinį', 'Undo') + '">' + ic('undo') + '</button>' +
        '<button class="rbtn pass" data-action="swipe-pass" data-testid="btn-pass" aria-label="' + T('Praleisti', 'Pass') + '">' + ic('close') + '</button>' +
        '<button class="rbtn like" data-action="swipe-like" data-testid="btn-like" aria-label="' + T('Patinka', 'Like') + '">' + ic('heart') + '</button>' +
        '<button class="rbtn sm" data-action="swipe-info" data-testid="btn-info" aria-label="' + T('Atidaryti profilį', 'Open profile') + '">' + ic('info') + '</button></div>' };
    }
    var d = deck(), html = '';
    d.bands.forEach(function (b) { html += '<h2 class="band-title">' + esc(b.band) + '</h2><div class="grid">' + b.items.map(pcard).join('') + '</div>'; });
    if (!d.total) html = '<div class="empty"><div class="orb">' + ic('sliders') + '</div><h2>' + T('Nieko neradome', 'No one found') + '</h2><p>' + T('Pagal pasirinktus filtrus šalia nieko nėra. Pabandyk praplėsti paiešką.', 'No one nearby matches your filters. Try widening your search.') + '</p><button class="btn soft" data-action="reset-filters">' + T('Išvalyti filtrus', 'Clear filters') + '</button></div>';
    if (d.hidden) html += '<div class="grid" style="margin-top:12px"><div class="locked-card">' + ic('lock', 24) + '<b>' + T('Dar ' + d.hidden + ' ' + (d.hidden === 1 ? 'žmogus' : 'žmonės') + ' šalia', 'Another ' + d.hidden + ' ' + (d.hidden === 1 ? 'person' : 'people') + ' nearby') + '</b><span class="small">' + T('Nemokamai rodome iki ' + FREE_LIMIT + ' profilių per dieną. Premium – be ribų.', 'On the free plan you see up to ' + FREE_LIMIT + ' profiles a day. Premium has no limits.') + '</span><a class="btn small" href="#/premium">' + T('Plačiau apie Premium', 'More about Premium') + '</a></div></div>';
    return { tab: 'nearby', skel: skel, key: 'near-grid', html: head +
      '<div class="notice">' + ic('shield') + '<span>' + T('Rodome tik apytikslį atstumą juostomis. Juostos viduje tvarka sumaišyta, todėl niekas negali atspėti tikslios tavo vietos.', 'We only show an approximate distance in bands. Within a band the order is shuffled, so no one can guess your exact location.') + (S.settings.hideDistance ? ' <b>' + T('Tavo atstumas kitiems paslėptas.', 'Your distance is hidden from others.') + '</b>' : '') + '</span></div>' + html };
  }

  function filtersSheet() {
    var f = S.filters, prem = isPremium();
    var seekChip = function (v, l) { return '<button class="chip" data-fseek="' + v + '" aria-pressed="' + (f.seek === v) + '">' + l + '</button>'; };
    var bandChip = function (i) { return '<button class="chip" data-fband="' + i + '" aria-pressed="' + (f.band === i) + '">' + (i === 4 ? T('Visi', 'All') : T('iki ', 'up to ') + BANDS[i].replace('<', '').replace(/^.*–/, '')) + '</button>'; };
    var goal = function (v, l) { return '<button class="chip' + (prem ? '' : ' locked') + '" data-fgoal="' + v + '" aria-pressed="' + (prem && f.goal === v) + '">' + (prem ? '' : ic('lock', 14)) + l + '</button>'; };
    openSheet(
      '<div class="row between"><h2 style="margin:0">' + T('Filtrai', 'Filters') + '</h2><button class="icon-btn" data-action="close-sheet" aria-label="' + T('Uždaryti', 'Close') + '">' + I.close + '</button></div>' +
      '<section><h3>' + T('Amžius: ', 'Age: ') + '<span id="age-lbl" style="color:var(--accent-hi)">' + f.ageMin + '–' + f.ageMax + '</span></h3>' +
      '<div class="range-row"><span class="small muted">' + T('nuo', 'from') + '</span><input type="range" id="age-min" min="18" max="70" value="' + f.ageMin + '" aria-label="' + T('Amžius nuo', 'Age from') + '"></div>' +
      '<div class="range-row"><span class="small muted">' + T('iki', 'to') + '</span><input type="range" id="age-max" min="18" max="70" value="' + f.ageMax + '" aria-label="' + T('Amžius iki', 'Age to') + '"></div></section>' +
      '<section><h3>' + T('Atstumas', 'Distance') + '</h3><div class="chips">' + [0, 1, 2, 3, 4].map(bandChip).join('') + '</div><p class="tiny muted" style="margin-top:8px">' + T('Tik apytikslės juostos – tikslaus atstumo nėra.', 'Approximate bands only – no exact distance.') + '</p></section>' +
      '<section><h3>' + T('Noriu matyti', 'Show me') + '</h3><div class="chips">' + seekChip('vyrų', T('Vyrus', 'Men')) + seekChip('moterų', T('Moteris', 'Women')) + seekChip('visų', T('Visus', 'Everyone')) + '</div></section>' +
      '<section><div class="switch-row"><span class="lbl">' + T('Tik patvirtinti profiliai', 'Verified profiles only') + '<small>' + T('Su asmenukės patvirtinimu ', 'With selfie verification ') + I.verified + '</small></span>' + sw('f-verified', f.verifiedOnly) + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Tik patikrinti', 'Verified only') + '<small>' + T('Su ženkleliu „Patikrinta“ · nemokama', 'With the “Verified” badge · free') + '</small></span>' + sw('f-checked', f.checkedOnly) + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Gali susitikti šiandien', 'Free to meet today') + '<small>' + T('Kas šiandien pažymėjo „Šiandien ✓“ · nemokama', 'Who marked “Today ✓” today · free') + '</small></span>' + sw('f-today', f.freeToday) + '</div></section>' +
      '<section><h3>' + T('Interesai', 'Interests') + '</h3><div class="chips">' + D.INTERESTS.map(function (x) { return '<button class="chip" data-finterest="' + esc(x) + '" aria-pressed="' + (f.interests.indexOf(x) >= 0) + '">' + esc(intT(x)) + '</button>'; }).join('') + '</div></section>' +
      zodiacFilterSection() +
      '<section class="card" style="margin-top:24px"><div class="row between"><h3 style="margin:0">' + T('Išplėstiniai filtrai', 'Advanced filters') + '</h3>' + (prem ? '<span class="tag sage">' + T('Aktyvu', 'Active') + '</span>' : '<span class="tag">Premium</span>') + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Tik neseniai aktyvūs', 'Recently active only') + '</span>' + (prem ? sw('f-online', f.onlineOnly) : '<button class="chip locked" data-action="locked" data-what="' + T('Tik neseniai aktyvūs', 'Recently active only') + '">' + ic('lock', 14) + '</button>') + '</div>' +
      '<p class="small" style="margin:8px 0"><b>' + T('Ko ieško', 'Looking for') + '</b></p><div class="chips">' + goal('draugystė', goalT('draugystė', 'filter')) + goal('pažintys', goalT('pažintys', 'filter')) + goal('santykiai', goalT('santykiai', 'filter')) + '</div></section>' +
      '<div class="row" style="margin-top:24px"><button class="btn ghost" data-action="reset-filters">' + T('Išvalyti', 'Clear') + '</button><button class="btn" style="flex:1" data-action="apply-filters" data-testid="apply-filters">' + T('Rodyti rezultatus', 'Show results') + '</button></div>',
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
    return '<section class="card zfilter" style="margin-top:24px" data-testid="zodiac-filter"><div class="row between"><h3 style="margin:0">' + T('Zodiakas', 'Zodiac') + (m ? ' · ' + zsym(m) + esc(m.name) : '') + '</h3>' + (ok ? '<span class="tag sage">Plus</span>' : '<span class="tag gold">Plus</span>') + '</div>' +
      row('f-zodiac', f.zodiacOnly, T('Tik suderinami ženklai', 'Matching signs only'), T('Rodyti tik „' + Z.label('high') + '“ ženklus (' + Z.pct('high') + ' %). Paslėpę ženklą nerodomi.', 'Show only “' + Z.label('high') + '” signs (' + Z.pct('high') + '%). People who hide their sign are not shown.'), T('Tik suderinami ženklai – su Plus', C.ZODIAC.PLUS_FILTER_EN), 'zodiac-locked') +
      '<p class="tiny muted" style="margin:8px 0 0">' + esc(Z.NOTE) + '</p></section>';
  }

  /* ---------- Profilis ---------- */
  function zodiacBlock(p) {
    var m = mySign(), t = theirSign(p);
    var side = function (sg, who) { return '<div class="zside"><span class="zbig">' + sg.sym + '</span><b>' + esc(sg.name) + '</b><small>' + esc(who) + ' · ' + Z.ELEMENTS[sg.el] + '</small></div>'; };
    var h = '<div class="sect"><h3>' + T('Zodiakas', 'Zodiac') + '</h3><div class="zcard" data-testid="zodiac-card">';
    if (!t) return h + '<p class="zexp" data-testid="zodiac-explain">' + esc(p.name) + T(' nerodo savo zodiako ženklo.', ' does not show their zodiac sign.') + '</p><p class="tiny faint znote">' + esc(Z.NOTE) + '</p></div></div>';
    if (!m) return h + '<div class="zpair">' + side(t, p.name) + '</div><p class="zexp" data-testid="zodiac-explain">' + T('Gimimo datos nėra – suderinamumo neskaičiuojame.', 'No date of birth – we do not calculate compatibility.') + '</p><p class="tiny faint znote">' + esc(Z.NOTE) + '</p></div></div>';
    var c = Z.compat(m.id, t.id);
    h += '<div class="zpair">' + side(m, T('Tu', 'You')) + '<div class="zmid"><span class="zpct" data-testid="zodiac-pct">' + Z.pct(c) + '%</span><small>' + T('Zodiakas', 'Zodiac') + '</small></div>' + side(t, p.name) + '</div>' +
      '<p class="zlabel" data-testid="zodiac-label">' + esc(Z.label(c)) + '</p>' +
      '<p class="zexp" data-testid="zodiac-explain">' + esc(Z.explain(m.id, t.id)) + '</p>';
    if (isPlus()) {
      var names = function (lv) { return Z.byLevel(m.id, lv).map(function (x) { return esc(x.name); }).join(', '); };
      h += '<p class="zmore" data-testid="zodiac-plus">' + ic('spark', 16) + '<span><b>' + T('Išsamiau:', 'In detail:') + '</b> ' + T('tavo elementas – ', 'your element – ') + Z.ELEMENTS[m.el] + ', ' + esc(p.name) + ' – ' + Z.ELEMENTS[t.el] + '.<br>' + esc(Z.label('high')) + ': ' + names('high') + '.<br>' + esc(Z.label('medium')) + ': ' + names('medium') + '.<br>' + esc(Z.label('low')) + ': ' + names('low') + '.</span></p>';
    } else {
      h += '<a class="zmore locked" href="#/premium" data-testid="zodiac-plus-locked">' + ic('lock', 16) + '<span>' + T('Išsamus zodiako suderinamumas – su Plus', 'Detailed zodiac compatibility – with Plus') + '</span></a>';
    }
    return h + '<p class="tiny faint znote">' + esc(Z.NOTE) + '</p></div></div>';
  }

  function profile(m) {
    var p = byId(m[1]);
    if (!p) return { tab: 'nearby', html: '<p>' + T('Profilis nerastas.', 'Profile not found.') + '</p><a href="#/nearby">' + T('Atgal', 'Back') + '</a>' };
    if (S.blocked.indexOf(p.id) >= 0) return { tab: 'nearby', html: '<div class="topbar"><a class="icon-btn" href="#/nearby" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a><h2>' + T('Užblokuota', 'Blocked') + '</h2></div><div class="card stack"><p>' + T('Šį žmogų užblokavai. Jūs vienas kito nematote paieškoje ir pokalbiuose.', 'You blocked this person. You can no longer see each other in search or chats.') + '</p><button class="btn soft" data-action="unblock" data-id="' + p.id + '">' + T('Atblokuoti', 'Unblock') + '</button></div>' };
    var sh = shared(p), liked = S.likes.indexOf(p.id) >= 0;
    var goalTxt = goalT(p.goal, 'looks');
    var slides = p.photos.map(function (f, i) { return '<div class="car-slide"><span class="skel"></span>' + photo(p, i).replace('loading="lazy"', i ? 'loading="lazy"' : 'loading="eager"') + '</div>'; }).join('');
    var dots = p.photos.length > 1 ? '<div class="dots" data-testid="dots">' + p.photos.map(function (f, i) { return '<i class="' + (i === 0 ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '';
    var prompt = function (pr, i) { return '<div class="prompt"><div class="q">' + esc(qT(pr[0])) + '</div><div class="a">' + esc(pans(p, i)) + '</div></div>'; };
    return { tab: 'nearby', noTabs: true, html:
      '<div class="pro"><div class="carousel"><div class="car-track" data-testid="carousel">' + slides + '</div>' +
      '<div class="nav"><a class="icon-btn glass" href="#/nearby" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a><span class="pill hot" style="background:rgba(10,7,14,.5)">' + matchPct(p) + T('% atitikimas', '% match') + '</span></div>' + dots + AI + '</div>' +
      '<div class="pbody"><div class="pname">' + esc(p.name) + ' <span class="age">' + p.age + '</span>' + verifiedBadge(p) + '</div>' +
      '<div class="pjob">' + esc(pjob(p)) + '</div>' +
      '<div class="facts"><span class="fact">' + ic('near') + esc(p.distLabel) + '</span><span class="fact">' + ic('heart') + esc(goalTxt) + '</span>' + (p.verified ? '<span class="fact ok-f">' + ic('shield') + T('Patvirtinta asmenuke', 'Selfie-verified') + '</span>' : '<span class="fact">' + T('Dar nepatvirtinta', 'Not verified yet') + '</span>') + (isChecked(p) ? '<span class="fact chk" data-testid="checked-badge">' + ic('shield') + T('Patikrinta', 'Verified') + '</span>' : '') + (isFreeToday(p) ? '<span class="fact frs" data-testid="free-badge"><i class="fdot"></i>' + T('Šiandien ✓', 'Today ✓') + '</span>' : '') + (p.online ? '<span class="fact"><span class="dot-online" style="width:8px;height:8px"></span>' + T('Neseniai aktyvus(-i)', 'Recently active') + '</span>' : '') + '</div>' +
      '<div class="sect"><h3>' + T('Apie mane', 'About me') + '</h3><p class="bio-t">' + esc(pbio(p)) + '</p></div>' +
      (V5.VOICE_IDS.indexOf(p.id) >= 0 ? '<div class="sect"><h3>' + T('Balso prisistatymas (demo)', 'Voice intro (demo)') + '</h3>' + voiceCard('voice-' + p.id, T('Balso prisistatymas (demo)', 'Voice intro (demo)'), T('Demo tonų signalas – ne tikras balso įrašas', 'Demo tone – not a real voice recording')) + '</div>' : '') +
      zodiacBlock(p) +
      prompt(p.prompts[0], 0) +
      '<div class="sect"><h3>' + T('Interesai', 'Interests') + '</h3><div class="chips">' + p.interests.map(function (x) { return '<span class="chip static' + (sh.indexOf(x) >= 0 ? ' shared' : '') + '">' + (sh.indexOf(x) >= 0 ? ic('check', 14) : '') + esc(intT(x)) + '</span>'; }).join('') + '</div>' +
      (sh.length ? '<p class="small muted" style="margin-top:12px">' + T('Bendri interesai: ', 'Shared interests: ') + sh.length + '</p>' : '') + '</div>' +
      prompt(p.prompts[1], 1) +
      '<div class="second-row"><button class="btn ghost" data-action="block" data-id="' + p.id + '">' + ic('block', 18) + ' ' + T('Blokuoti', 'Block') + '</button><button class="btn danger" data-action="report" data-id="' + p.id + '">' + ic('flag', 18) + ' ' + T('Pranešti', 'Report') + '</button></div>' +
      '<p class="tiny faint center" style="margin-top:24px">' + T('Niekada nesiųsk pinigų ir kodų žmonėms, kurių nepažįsti. Įtartina? Spausk „Pranešti“.', 'Never send money or codes to people you don\'t know. Something suspicious? Tap “Report”.') + '</p><div class="spacer-cta"></div></div></div>' +
      '<div class="cta-bar"><button class="rbtn" data-action="like" data-id="' + p.id + '" data-testid="profile-like" aria-label="' + T('Patinka', 'Like') + '" aria-pressed="' + liked + '" style="' + (liked ? 'color:var(--accent-hi)' : '') + '">' + (liked ? I.fill('heart') : ic('heart')) + '</button>' +
      '<button class="btn" data-action="write" data-id="' + p.id + '" data-testid="write">' + ic('chat', 20) + ' ' + T('Rašyti', 'Message') + '</button></div>' };
  }

  /* ---------- Pokalbiai ---------- */
  function maskText(text, c, plain) {
    var safe = esc(tx(text));
    if (contactsUnlocked(c)) return safe;
    return safe.replace(CONTACT_RE, plain ? T('[paslėpta]', '[hidden]') : '<span class="hidden-link" title="' + T('Paslėpta saugumo sumetimais', 'Hidden for safety') + '">' + ic('lock', 12) + T('nuoroda / kontaktas paslėptas', 'link / contact hidden') + '</span>');
  }
  function chats() {
    var list = S.chats.filter(function (c) { return S.blocked.indexOf(c.id) < 0 && byId(c.id); });
    var items = list.map(function (c) {
      var p = byId(c.id), last = c.messages[c.messages.length - 1];
      var lastTxt = last ? (last.from === 'me' ? T('Tu: ', 'You: ') : '') + (last.img ? T('Nuotrauka', 'Photo') + (last.text ? ' · ' : '') : '') + (last.text ? maskText(last.text, c, true) : '') : '<i>' + T('Naujas pokalbis – parašyk pirmas(-a)!', 'New chat – write first!') + '</i>';
      return '<li class="' + (c.unread ? 'un' : '') + '"><a href="#/chat/' + c.id + '" data-testid="chat-item"><span class="avatar"><span class="skel" style="position:absolute;inset:0"></span>' + photo(p) + '</span><span class="txt"><b>' + esc(p.name) + '</b>' + verifiedBadge(p) + '<div class="last">' + lastTxt + '</div></span><span class="end"><span class="when">' + (last ? when(last.t) : '') + '</span>' + (c.unread ? '<span class="unread" aria-label="' + T('Neperskaityta', 'Unread') + '"></span>' : '') + '</span></a></li>';
    }).join('');
    var ms = S.matches.filter(function (id) { return S.blocked.indexOf(id) < 0 && byId(id); });
    var stories = ms.length ? '<h3 class="eyebrow" style="margin-bottom:8px">' + T('Abipusis susidomėjimas', 'It\'s mutual') + '</h3><div class="stories" data-testid="matches">' + ms.map(function (id) { var p = byId(id); return '<a href="#/chat/' + id + '"><span class="avatar lg ring"><span class="skel" style="position:absolute;inset:0"></span>' + photo(p) + '</span>' + esc(p.name) + '</a>'; }).join('') + '</div>' : '';
    return { tab: 'chats', key: 'chats', skel: '<div class="topbar"><h1>' + T('Pokalbiai', 'Chats') + '</h1></div><div class="sk-list">' + '<div class="sk-row skel-box"></div>'.repeat(4) + '</div>', html: '<div class="topbar"><h1>' + T('Pokalbiai', 'Chats') + '</h1></div>' + stories +
      (isPremium() ? '' : '<div class="notice gold">' + ic('info') + '<span>' + T('Nemokamai – iki ' + LIM.freeNewChatsPerDay + ' naujų pokalbių per dieną. Esami pokalbiai be ribų.', 'Free – up to ' + LIM.freeNewChatsPerDay + ' new chats a day. Existing chats have no limits.') + '</span></div>') +
      (items ? '<ul class="clist" style="margin-top:16px">' + items + '</ul>' : '<div class="empty" style="height:auto;padding:48px 0"><div class="orb">' + ic('chat') + '</div><h2>' + T('Kol kas pokalbių nėra', 'No chats yet') + '</h2><p>' + T('Pažymėk, kas tau patinka – abipusis susidomėjimas atvers pokalbį.', 'Like the people you fancy – a mutual like opens a chat.') + '</p><a class="btn" href="#/nearby">' + T('Ieškoti šalia', 'Find people nearby') + '</a></div>') };
  }
  function counts(c) { var me = 0, them = 0; c.messages.forEach(function (m) { if (m.img) return; if (m.from === 'me') me++; else them++; }); return { me: me, them: them }; }
  function contactsUnlocked(c) { var k = counts(c); return k.me >= CONTACT_UNLOCK && k.them >= CONTACT_UNLOCK; }
  var CONTACT_RE = /((https?:\/\/|www\.)\S+|\b[\w-]+\.(lt|com|net|org|eu|io)\b\S*|\+?\d[\d\s-]{7,}\d|@[\w.]{3,})/gi;
  function convHtml(c, p, typing) {
    var lastMe = -1, i;
    c.messages.forEach(function (x, idx) { if (x.from === 'me') lastMe = idx; });
    var laterThem = function (idx) { for (var j = idx + 1; j < c.messages.length; j++) if (c.messages[j].from === 'them') return true; return false; };
    var h = c.messages.length ? '<div class="day">' + T('Šiandien', 'Today') + '</div>' : '';
    c.messages.forEach(function (x, idx) {
      var read = x.from === 'me' && (x.r || laterThem(idx));
      h += '<div class="msg ' + x.from + (x.img ? ' pic' : '') + '">' + (x.img ? photoHtml(x, idx, c.id) : '') + (x.text ? (x.img ? '<div class="cap">' + maskText(x.text, c) + '</div>' : maskText(x.text, c)) : '') + '<span class="meta' + (read ? ' read' : '') + '">' + hhmm(x.t) + (x.from === 'me' ? (read ? ic('checks') : ic('check')) + '<span class="sr">' + (read ? T('Perskaityta', 'Read') : T('Pristatyta', 'Delivered')) + '</span>' : '') + (x.from === 'me' && idx === lastMe ? ' <span>' + (read ? T('Perskaityta', 'Read') : T('Pristatyta', 'Delivered')) + '</span>' : '') + '</span></div>';
    });
    if (!c.messages.length) h = '<div class="empty" style="height:auto;margin:auto;padding:24px"><div class="orb">' + ic('spark') + '</div><h2>' + T('Pasisveikink', 'Say hello') + '</h2><p>' + T('Bendri interesai: ', 'Shared interests: ') + (shared(p).map(function (x) { return esc(intT(x)); }).join(', ') || T('nėra', 'none')) + T('. Pabandyk pokalbio pradžią iš DI.', '. Try an AI conversation starter.') + '</p></div>' + suggestHtml(p);
    if (typing) h += '<div class="typing" data-testid="typing" aria-label="' + esc(p.name) + T(' rašo', ' is typing') + '"><i></i><i></i><i></i></div>';
    return h;
  }
  function noteHtml(c, p) {
    var k = counts(c), un = contactsUnlocked(c);
    var bar = function (n) { var h = ''; for (var i = 0; i < CONTACT_UNLOCK; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return h; };
    return ic('shield', 20) + '<span>' + T('Kol abu neapsikeitėte bent ' + CONTACT_UNLOCK + ' žinutėmis, nuorodos, telefonai ir @vardai paslepiami', 'Until you have both sent at least ' + CONTACT_UNLOCK + ' messages, links, phone numbers and @handles are hidden') + (un ? T(' – <b>dabar jau rodomi</b>.', ' – <b>now shown</b>.') : T(' (jūs: ', ' (you: ') + k.me + '/' + CONTACT_UNLOCK + ', ' + esc(p.name) + ': ' + k.them + '/' + CONTACT_UNLOCK + ').') + '</span>';
  }
  var typingFor = null;
  function chat(m) {
    var p = byId(m[1]); if (!p) return { tab: 'chats', html: '<p>' + T('Pokalbis nerastas.', 'Chat not found.') + '</p>' };
    var c = ensureChat(p.id);
    c.unread = false; save();
    var hasHidden = !contactsUnlocked(c) && c.messages.some(function (x) { CONTACT_RE.lastIndex = 0; return CONTACT_RE.test(x.text); });
    CONTACT_RE.lastIndex = 0;
    return { tab: 'chats', noTabs: true, chat: true, html:
      '<div class="chat-head"><a class="icon-btn" href="#/chats" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a><a href="#/profile/' + p.id + '" class="who"><span class="avatar sm"><span class="skel" style="position:absolute;inset:0"></span>' + photo(p) + '</span><span><b>' + esc(p.name) + '</b>' + verifiedBadge(p) + '<span class="st">' + (p.online ? '<span class="dot-online"></span>' + T('Neseniai aktyvus(-i)', 'Recently active') + ' · ' : '') + esc(p.distLabel) + '</span></span></a><button class="icon-btn" data-action="chat-menu" data-id="' + p.id + '" aria-label="' + T('Pokalbio meniu', 'Chat menu') + '" data-testid="chat-menu">' + ICON_MORE + '</button><button class="icon-btn" data-action="report" data-id="' + p.id + '" aria-label="' + T('Pranešti', 'Report') + '">' + I.flag + '</button></div>' +
      '<div class="conv" id="conv"><div class="safe-note" id="safe-note">' + noteHtml(c, p) + '</div>' + (hasHidden ? '<p class="tiny faint center" id="hid-note">' + T('Šiame pokalbyje yra paslėptų nuorodų ar kontaktų. Niekada nesek nepažįstamų nuorodų.', 'This chat has hidden links or contacts. Never follow links from people you don\'t know.') + '</p>' : '') + '<div id="msgs" style="display:contents">' + convHtml(c, p, typingFor === p.id) + '</div></div>' +
      '<div class="composer"><button class="ai-btn" data-action="ai-opener" data-id="' + p.id + '" data-testid="ai-opener">' + ic('spark', 16) + ' ' + T('Padėk pradėti pokalbį', 'Help me start the chat') + '</button>' +
      '<form data-form="send" data-id="' + p.id + '"><label class="sr" for="msg-input">' + T('Žinutė', 'Message') + '</label><button type="button" class="icon-btn" data-action="attach" aria-label="' + T('Pridėti nuotrauką', 'Add a photo') + '">' + ic('image') + '</button><input class="input" id="msg-input" autocomplete="off" maxlength="500" placeholder="' + T('Rašyk žinutę…', 'Write a message…') + '"><button class="send-btn" aria-label="' + T('Siųsti', 'Send') + '" type="submit">' + ic('send') + '</button></form>' +
      '<p class="tiny">' + T('Pokalbių nuotraukos automatiškai ištrinamos po ' + LIM.chatPhotoDays + ' d. AI pasiūlymai naudoja tik interesus – ne žinutes. Nuotraukos pokalbyje neryškios, kol paspausi „Rodyti“.', 'Chat photos are deleted automatically after ' + LIM.chatPhotoDays + ' days. AI suggestions use only interests – not messages. Photos in chat are blurred until you tap “Show”.') + '</p></div>',
      after: function () { var dr = pendingDraft[p.id], inp0 = document.getElementById('msg-input'); if (dr && inp0) { inp0.value = dr; delete pendingDraft[p.id]; }
        var cv = document.getElementById('conv'); if (cv) { cv.style.scrollBehavior = 'auto'; cv.scrollTop = cv.scrollHeight; cv.style.scrollBehavior = ''; } } };
  }
  function refreshChat(id) {
    var p = byId(id), c = findChat(id), msgs = document.getElementById('msgs');
    if (!msgs || location.hash !== '#/chat/' + id || !c) return;
    msgs.innerHTML = convHtml(c, p, typingFor === id);
    var n = document.getElementById('safe-note'); if (n) n.innerHTML = noteHtml(c, p);
    var cv = document.getElementById('conv'); cv.scrollTop = cv.scrollHeight;
  }

  /* ---------- Mano profilis ---------- */
  function prefsLine() {
    var u = S.user, L = lang(), g = GENDER[u.gender], sm = u.show_me.map(function (k) { return SHOW[k] ? SHOW[k][L] : ''; }).join(', ');
    return esc((g ? g[L] : '') + (u.show_me.length ? ' · ' + (L === 'en' ? 'Show me: ' : 'Noriu matyti: ') + sm : ' · ' + (L === 'en' ? 'no preference' : 'nenurodyta')));
  }
  function privateNote() { return lang() === 'en' ? 'These choices are private and never shown on your profile.' : 'Šie pasirinkimai privatūs ir niekada nerodomi tavo profilyje.'; }
  function me() {
    var u = S.user, a = ageFrom(u.birth), prem = isPremium();
    var plan = S.premium ? planLabel(S.premium) : PL.free.name;
    var viewers = ['p7', 'p13', 'p10'].map(function (id) { var p = byId(id); return '<a class="avatar sm" href="' + (prem ? '#/profile/' + id : '#/premium') + '" title="' + (prem ? esc(p.name) : '') + '">' + photo(p) + '</a>'; }).join('');
    return { tab: 'me', html:
      '<div class="topbar"><h1>' + T('Mano profilis', 'My profile') + '</h1><a class="icon-btn" href="#/settings" aria-label="' + T('Nustatymai', 'Settings') + '" data-testid="settings-link">' + I.gear + '</a></div>' +
      '<div class="me-hero">' + meAvatar('lg ring') + '<div class="nm">' + esc(u.name ? dispName(u.name) : T('Tu', 'You')) + (a ? ', ' + a : '') + (u.verified ? I.verified : '') + '</div>' +
      '<div class="small muted" style="margin:4px 0 12px" data-testid="private-prefs">' + ic('lock', 13) + ' ' + prefsLine() + '</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap;justify-content:center"><span class="tag ' + (S.premium ? 'gold' : '') + '">' + esc(plan) + T(' planas', ' plan') + '</span>' + (u.checked ? checkedBadge() : '') + (availLeft() ? '<span class="bdg free" data-testid="my-free-badge"><i></i>' + T('Šiandien ✓', 'Today ✓') + '</span>' : '') + (S.settings.incognito ? '<span class="tag" data-testid="my-incognito">Incognito</span>' : '') + '</div>' +
      '<p class="tiny faint" style="margin:12px 0 0" data-testid="private-note">' + privateNote() + '</p>' +
      '<div class="chips" style="justify-content:center;margin-top:12px" role="group" aria-label="Kalba / Language"><button class="chip" data-lang="lt" data-testid="lang-lt" aria-pressed="' + (lang() === 'lt') + '">Lietuvių</button><button class="chip" data-lang="en" data-testid="lang-en" aria-pressed="' + (lang() === 'en') + '">English</button></div></div>' +
      photosCard() + incognitoCard() + availCard() + verifyCard() +
      (u.verified ? '' : '<div class="notice" style="margin-top:16px">' + ic('camera') + '<span>' + T('Profilis dar nepatvirtintas. ', 'Your profile is not verified yet. ') + '<a class="link" href="#/register/5">' + T('Patvirtinti asmenuke', 'Verify with a selfie') + '</a></span></div>') +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">' + T('Interesai', 'Interests') + '</h3><div class="chips">' + (u.interests.length ? u.interests.map(function (x) { return '<span class="chip static">' + esc(intT(x)) + '</span>'; }).join('') : '<span class="muted small">' + T('Nepasirinkta', 'None selected') + '</span>') + '</div><a class="btn ghost small" style="margin-top:16px" href="#/register/3">' + T('Redaguoti', 'Edit') + '</a></div>' +
      (mySign() ? '<div class="card zme" style="margin-top:16px" data-testid="my-sign"><div class="row" style="gap:16px"><span class="zbig">' + mySign().sym + '</span><div><h3 style="margin:0">' + T('Mano zodiako ženklas', 'My zodiac sign') + '</h3><div class="zme-n" data-testid="my-sign-name">' + esc(mySign().name) + ' <span class="muted small">· ' + Z.ELEMENTS[mySign().el] + '</span></div></div></div><p class="small muted" style="margin:12px 0 0">' + T('Apskaičiuota automatiškai iš gimimo datos. ', 'Calculated automatically from your date of birth. ') + (S.settings.show_zodiac ? T('Kiti mato tavo ženklą.', 'Others can see your sign.') : T('Tavo ženklo kiti nemato (galima keisti nustatymuose).', 'Others cannot see your sign (you can change this in settings).')) + ' ' + esc(Z.NOTE) + '</p></div>' : '') +
      promptsCard() +
      '<div class="card" style="margin-top:16px" data-testid="voice-card"><h3 style="margin-bottom:12px">' + ic('spark', 18) + ' ' + T('Balso prisistatymas (demo)', 'Voice intro (demo)') + '</h3>' + voiceCard('voice-me', T('Balso prisistatymas (demo)', 'Voice intro (demo)'), T('Vietos rezervas: čia bus tavo balso įrašas (voice_url). Dabar – tonų signalas.', 'Placeholder: your voice recording (voice_url) will go here. For now – a demo tone.')) + '</div>' +
      '<div class="card" style="margin-top:16px"><div class="row between"><h3>' + ic('eye', 18) + ' ' + T('Kas peržiūrėjo tave', 'Who viewed you') + '</h3>' + (prem ? '' : '<span class="tag">Premium</span>') + '</div>' +
      '<div class="row" style="margin-top:16px;gap:12px"><span class="row' + (prem ? '' : ' blur-row') + '" style="gap:12px">' + viewers + '</span><span class="small muted">' + T('3 per pastarąją savaitę', '3 in the past week') + '</span></div>' +
      (prem ? '' : '<button class="btn soft small" style="margin-top:16px" data-action="locked" data-what="' + T('Kas peržiūrėjo tave', 'Who viewed you') + '">' + ic('lock', 16) + ' ' + T('Pamatyti', 'View') + '</button>') + '</div>' +
      '<ul class="menu" style="margin-top:16px">' +
      '<li><a href="#/safety" data-testid="safety-link">' + I.shield + '<span class="grow">' + T('Saugumas ir pasimatymai', 'Safety and dating') + '</span>' + (S.share ? '<span class="pulse"></span>' : '') + '<span class="chev">' + I.chevron + '</span></a></li>' +
      '<li><a href="#/premium">' + I.gem + '<span class="grow">' + T('Premium planai', 'Premium plans') + '</span><span class="chev">' + I.chevron + '</span></a></li>' +
      '<li><a href="#/settings">' + I.gear + '<span class="grow">' + T('Nustatymai ir privatumas', 'Settings and privacy') + '</span><span class="chev">' + I.chevron + '</span></a></li></ul>' };
  }

  function safety() {
    var sh = S.share, live = sh && sh.until > Date.now();
    if (sh && !live) { S.share = null; save(); }
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a><h1>' + T('Saugumas', 'Safety') + '</h1></div>' +
      (live ? '<div class="card share-live stack" data-testid="share-live"><div class="row"><span class="pulse"></span><b>' + T('Dalijiesi vieta su ', 'You are sharing your location with ') + esc(sh.name) + '</b></div><p class="small" style="margin:0">' + esc(sh.name) + T(' mato tavo vietą iki ', ' can see your location until ') + '<b>' + hhmm(sh.until) + '</b>' + T('. Po to nuoroda nustoja veikti ir duomenys ištrinami. ', '. After that the link stops working and the data is deleted. ') + '<span class="tag">' + T('Simuliacija', 'Simulation') + '</span></p><button class="btn sage block" data-action="share-stop">' + ic('check', 18) + ' ' + T('Esu saugi(-us) – baigti dalintis', 'I\'m safe – stop sharing') + '</button></div>'
        : '<div class="card stack"><h2>' + ic('share', 22) + ' ' + T('Pasidalink, kur esu, su draugu', 'Share where I am with a friend') + '</h2><p class="muted small">' + T('Pirmam pasimatymui: sukursi laikiną nuorodą ir nusiųsi ją draugui. Tik jis matys tavo vietą ir tik ribotą laiką. Pasimatymo žmogus apie tai nesužino.', 'For a first date: you create a temporary link and send it to a friend. Only they will see your location, and only for a limited time. The person you are meeting will not know.') + '</p>' +
          '<label class="field"><span>' + T('Draugo vardas', 'Friend\'s name') + '</span><input class="input" id="s-name" maxlength="30" placeholder="' + T('pvz. Inga', 'e.g. Anna') + '"></label>' +
          '<label class="field"><span>' + T('Kiek laiko dalintis', 'How long to share') + '</span><select class="input" id="s-dur"><option value="1">1 ' + T('val.', 'h') + '</option><option value="2" selected>2 ' + T('val.', 'h') + '</option><option value="3">3 ' + T('val.', 'h') + '</option><option value="4">4 ' + T('val.', 'h') + '</option></select></label>' +
          '<div class="err" id="err" role="alert"></div><button class="btn block" data-action="share-start" data-testid="share-start">' + T('Sukurti nuorodą ir pradėti', 'Create the link and start') + '</button><p class="tiny muted center" style="margin:0">' + T('Peržiūroje niekas nesiunčiama ir vieta nenaudojama.', 'In this preview nothing is sent and no location is used.') + '</p></div>') +
      '<div class="card" style="margin-top:16px" data-testid="invisible-card"><div class="switch-row" style="padding:0"><span class="lbl"><b>' + ic('eyeOff', 18) + ' ' + C.FEATURES.label('invisible_mode') + '</b>' + (feat('invisible_mode') ? '' : ' <span class="tag">' + planLabel(C.FEATURES.MIN_PLAN.invisible_mode) + '</span>') + '<small data-testid="invisible-desc">' + C.FEATURES.note('invisible_mode') + '</small></span>' +
      invisibleCtl(S.settings.invisible) + '</div></div>' +
      '<div class="card" style="margin-top:16px"><h3 style="margin-bottom:12px">' + T('Patarimai pirmam pasimatymui', 'Tips for a first date') + '</h3><ul class="small" style="padding-left:18px;line-height:1.8;margin:0 0 16px;color:var(--muted)"><li>' + T('Susitik viešoje vietoje.', 'Meet in a public place.') + '</li><li>' + T('Pasakyk draugui, kur ir su kuo eini.', 'Tell a friend where you are going and with whom.') + '</li><li>' + T('Pasirūpink savo transportu namo.', 'Arrange your own way home.') + '</li><li>' + T('Nesiųsk pinigų ir nesidalink kodais.', 'Never send money or share codes.') + '</li></ul><a class="btn danger block" href="tel:112">' + ic('phone', 18) + ' ' + T('Skubi pagalba: 112', 'Emergency: 112') + '</a></div>' };
  }

  /* ---------- Patikra (demo, be kameros) ---------- */
  var vstep = 1;
  function verify() {
    var s = vstep;
    var VT = lang() === 'lt' ? [
      ['Kaip tai veikia', 'Patikra užtrunka apie minutę. Palyginame, ar profilio nuotrauka atitinka gyvą žmogų, ir pridedame ženklelį „Patikrinta“.', ['Nenaudojame tavo vardo ar gimimo datos.', 'Veido šablonų nesaugome.', 'Nuotrauka ištrinama iškart po patikros.']],
      ['Pasiruošk', 'Kad patikra pavyktų iš pirmo karto:', ['Būk šviesioje vietoje, veidas gerai matomas.', 'Be akinių nuo saulės ir kepurės.', 'Kadre – tik tu.']],
      ['Nuotrauka (demo)', 'Tikroje programėlėje čia atsidarytų kamera. Šioje peržiūroje kamera neįjungiama ir jokia nuotrauka nedaroma – paspaudi mygtuką, o patikrą imituojame.', ['Nuotrauka naudojama tik palyginimui.', 'Po patikros ji ištrinama.']],
      ['Patikrinta!', 'Tavo profilis dabar turi ženklelį „Patikrinta“.', ['Nuotrauka ištrinta iškart po patikros.', 'Demo: jokia nuotrauka nebuvo daryta ar išsaugota.', 'Ženklelį gali pašalinti bet kada.']]
    ] : [
      ['How it works', 'The check takes about a minute. We compare your profile photo with a live person and add the “Verified” badge.', ['We do not use your name or date of birth.', 'We do not store face templates.', 'The photo is deleted right after the check.']],
      ['Get ready', 'To get it right the first time:', ['Stand somewhere well lit, face clearly visible.', 'No sunglasses or hat.', 'Only you in the frame.']],
      ['Photo (demo)', 'In the real app the camera would open here. This preview never turns the camera on and takes no photo – you press the button and we simulate the check.', ['The photo is only used for the comparison.', 'It is deleted after the check.']],
      ['Verified!', 'Your profile now has the “Verified” badge.', ['The photo was deleted right after the check.', 'Demo: no photo was taken or saved.', 'You can remove the badge at any time.']]
    ];
    var Tt = VT[s - 1];
    var dots = [1, 2, 3, 4].map(function (n) { return '<i class="' + (n < s ? 'done' : n === s ? 'on' : '') + '">' + (n < s ? ic('check', 14) : n) + '</i>'; }).join('<b></b>');
    var foot = s < 3 ? '<button class="btn block" data-action="verify-next" data-testid="verify-next">' + T('Toliau', 'Next') + '</button>'
      : s === 3 ? '<button class="btn block" data-action="verify-run" data-testid="verify-run">' + ic('camera', 20) + ' ' + T('Imituoti nuotrauką ir patikrą', 'Simulate the photo and check') + '</button><div class="vprog" id="vprog" hidden><i></i></div><p class="tiny muted center" id="vmsg" role="status" hidden>' + T('Tikriname… (imituojama)', 'Checking… (simulated)') + '</p>'
      : '<a class="btn block" href="#/me" data-testid="verify-done">' + T('Grįžti į profilį', 'Back to profile') + '</a><button class="btn ghost block" style="margin-top:8px" data-action="verify-reset" data-testid="verify-reset">' + T('Pašalinti ženklelį (demo)', 'Remove the badge (demo)') + '</button>';
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a><h1>' + T('Patikra', 'Verification') + '</h1></div>' +
      '<div class="vsteps" role="img" aria-label="' + T('Žingsnis ' + s + ' iš 4', 'Step ' + s + ' of 4') + '" data-testid="verify-steps">' + dots + '</div>' +
      '<div class="card stack vbody" data-testid="verify-step" data-step="' + s + '">' + (s === 4 ? '<div class="vok">' + ic('shield', 36) + '</div>' : '') + '<h2>' + Tt[0] + '</h2><p class="muted">' + Tt[1] + '</p><ul class="vlist">' + Tt[2].map(function (x) { return '<li>' + ic('check', 16) + '<span>' + x + '</span></li>'; }).join('') + '</ul></div>' +
      (s === 3 || s === 2 ? '<div class="notice" style="margin-top:16px" data-testid="verify-privacy">' + ic('trash', 18) + '<span><b>' + T('Nuotrauka ištrinama iškart po patikros.', 'The photo is deleted right after the check.') + '</b> ' + T('Kiti jos niekada nemato.', 'Others never see it.') + '</span></div>' : '') +
      '<div class="vfoot">' + foot + (s > 1 && s < 4 ? '<button class="btn ghost block" style="margin-top:8px" data-action="verify-prev">' + T('Atgal', 'Back') + '</button>' : '') + '</div>' };
  }

  /* ---------- Premium ---------- */
  function premium() {
    var cur = S.premium;
    var li = function (t) { return '<li>' + ic('check', 18) + '<span>' + t + '</span></li>'; };
    var perkLis = function (plan) { return C.FEATURES.perks(plan).map(function (k) { return li(C.FEATURES.label(k)); }).join(''); };
    var cell = function (v, pl) { return '<td' + (pl ? ' class="plus"' : '') + '>' + (v === true ? '<span class="yes">' + ic('check', 18) + '</span>' : v === false ? '<span class="no">—</span>' : v) + '</td>'; };
    var row = function (n, a, b, c) { return '<tr><td>' + n + '</td>' + cell(a) + cell(b) + cell(c, true) + '</tr>'; };
    var paidRows = function () { var F = C.FEATURES; return F.paid().map(function (k) { return row(F.label(k), F.has('free', k), F.has('premium', k), F.has('plus', k)); }).join(''); };
    var btn = function (plan, label) { return cur === plan ? '<button class="btn sage block" disabled>' + T('Aktyvus (demo)', 'Active (demo)') + '</button>' : '<button class="btn block' + (plan === 'premium' ? ' ghost' : '') + '" data-action="buy" data-plan="' + plan + '" data-testid="buy-' + plan + '">' + label + '</button>'; };
    var yr = yearly();
    var per = function (id) {
      var pl = PL[id];
      if (!yr) return eur(pl.price) + ' <small>/ ' + pl.days + T(' d.', ' days') + '</small>';
      var save = Math.round((pl.price * 12 - pl.yearPrice) * 100) / 100;
      return eur(pl.yearPrice) + ' <small>/ ' + T('metams', 'year') + '</small><span class="yr-note">' + eur(perMonth(pl.yearPrice)) + T(' per mėn.', ' per month') + '</span>';
    };
    var badge = function (id) { if (!yr) return ''; var pl = PL[id]; return ' <span class="pill hot" data-testid="save-' + id + '">' + T('Sutaupai ', 'You save ') + eur(Math.round((pl.price * 12 - pl.yearPrice) * 100) / 100) + '</span>'; };
    return { tab: 'premium', html:
      '<div class="topbar"><div class="grow"><span class="eyebrow">Tikri ' + esc(PL.premium.name) + '</span><h1>' + T('Daugiau galimybių', 'Get more') + '</h1></div></div>' +
      '<p class="muted">' + T('Tikri veikia ir nemokamai. Mokami planai tiesiog nuima ribas ir prideda papildomų funkcijų.', 'Tikri works for free too. Paid plans simply remove limits and add extra features.') + '</p>' +
      (cur ? '<div class="notice" style="margin-top:16px">' + ic('check') + '<span>' + T('Aktyvus demo planas: ', 'Active demo plan: ') + '<b>' + planLabel(cur) + '</b>. <button class="link" data-action="cancel-sub">' + T('Atšaukti', 'Cancel') + '</button></span></div>' : '') +
      '<div class="billing" role="group" aria-label="' + T('Apmokėjimo laikotarpis', 'Billing period') + '"><div class="seg"><button data-action="billing" data-b="month" aria-pressed="' + !yr + '" data-testid="bill-month">' + T('Kas mėnesį', 'Monthly') + '</button><button data-action="billing" data-b="year" aria-pressed="' + yr + '" data-testid="bill-year">' + T('Metams', 'Yearly') + '</button></div>' + '' + '</div>' +
      '<div class="plans">' +
      '<div class="plan"><div class="nm"><h3>' + PL.free.name + '</h3></div><div class="price">' + eur(0) + '</div><ul>' + li(T('Profilis ir asmenukės patvirtinimas', 'Profile and selfie verification')) + li(T('Paieška šalia – iki ' + FREE_LIMIT + ' profilių per dieną', 'Nearby search – up to ' + FREE_LIMIT + ' profiles a day')) + li(T('Pagrindiniai filtrai', 'Basic filters')) + li(T('Pokalbiai – iki ' + LIM.freeNewChatsPerDay + ' naujų per dieną', 'Chats – up to ' + LIM.freeNewChatsPerDay + ' new ones a day')) + li(T('Visi saugumo įrankiai', 'All safety tools')) + '</ul></div>' +
      '<div class="plan"><div class="nm"><h3>' + PL.premium.name + '</h3>' + badge('premium') + '</div><div class="price">' + per('premium') + '</div><ul>' + li(T('Neribota paieška ir visi filtrai', 'Unlimited search and all filters')) + li(T('Kas peržiūrėjo tave', 'Who viewed you')) + perkLis('premium') + li(T('Jokių pokalbių ribų', 'No chat limits')) + '</ul>' + btn('premium', T('Rinktis ', 'Choose ') + PL.premium.name) + '</div>' +
      '<div class="plan hl"><span class="ribbon">' + T('Daugiausia galimybių', 'Get the most') + '</span><div class="nm"><h3>' + PL.plus.name + '</h3>' + badge('plus') + '</div><div class="price">' + per('plus') + '</div><ul>' + li(T('Viskas, kas yra ' + PL.premium.name, 'Everything in ' + PL.premium.name)) + li(T('AI atitikimo pasiūlymai pagal interesus', 'AI match suggestions based on interests')) + li(T('Išsamus zodiako suderinamumas ir filtras pagal ženklą', 'Detailed zodiac compatibility and a filter by sign')) + li(T('Profilio iškėlimas (boost) 1 kartą per savaitę', 'Profile boost once a week')) + li(T('Pirmenybė pagalbos tarnyboje', 'Priority support')) + perkLis('plus') + '</ul>' + btn('plus', T('Rinktis ', 'Choose ') + PL.plus.name) + '</div>' +
      '</div>' +
      '<h2 style="margin:40px 0 16px">' + T('Palyginimas', 'Comparison') + '</h2>' +
      '<div class="cmp-wrap"><table class="cmp"><thead><tr><th>' + T('Funkcija', 'Feature') + '</th><th>' + T('Nemok.', 'Free') + '</th><th>' + PL.premium.name + '</th><th class="plus">' + PL.plus.name + '</th></tr></thead><tbody>' +
      row(T('Profilis, patvirtinimas', 'Profile, verification'), true, true, true) + row(T('Paieška šalia', 'Nearby search'), T('iki ' + FREE_LIMIT + '/d.', 'up to ' + FREE_LIMIT + '/day'), T('be ribų', 'unlimited'), T('be ribų', 'unlimited')) + row(T('Išplėstiniai filtrai', 'Advanced filters'), false, true, true) +
      row(T('Nauji pokalbiai', 'New chats'), T(LIM.freeNewChatsPerDay + '/d.', LIM.freeNewChatsPerDay + '/day'), T('be ribų', 'unlimited'), T('be ribų', 'unlimited')) + row(T('Kas peržiūrėjo tave', 'Who viewed you'), false, true, true) + paidRows() +
      row(T('AI atitikimo pasiūlymai', 'AI match suggestions'), false, false, true) + row(T('Zodiako filtras', 'Zodiac filter'), false, false, true) + row(T('Iškėlimas (boost)', 'Boost'), false, false, T('1/sav.', '1/week')) + row(T('Saugumo įrankiai', 'Safety tools'), true, true, true) +
      '</tbody></table></div>' +
      '<div class="card terms"><p><b>' + T('Kainos nurodytos ' + C.VAT_NOTE + '.', 'Prices are shown ' + C.VAT_NOTE + '.') + '</b> ' + T('Prenumerata atsinaujina ' + (yr ? 'kas 12 mėn.' : 'kas ' + PL.premium.days + ' d.') + ', kol jos neatšauki.', 'The subscription renews ' + (yr ? 'every 12 months' : 'every ' + PL.premium.days + ' days') + ' until you cancel it.') + '</p>' + (yr ? '<p><b>' + T('Mokama vieną kartą metams.', 'Paid once a year.') + '</b> ' + T('Per 14 dienų gali atsisakyti ir atgausi pinigus. Prenumeratą gali atšaukti bet kada vienu paspaudimu.', 'Within 14 days you can withdraw and get your money back. You can cancel the subscription at any time with one tap.') + '</p>' : '') + '<p><b>' + T('Atšaukti gali bet kada', 'Cancel any time') + '</b> ' + T('– nustatymuose, vienu paspaudimu. Planas veiks iki apmokėto laikotarpio pabaigos, papildomų mokesčių nėra.', '– in settings, with one tap. The plan stays active until the end of the paid period, with no extra fees.') + '</p><p><b>' + T('Diskretiškai:', 'Discreet:') + '</b> ' + T('banko išraše matysi neutralų aprašą (pvz. „' + C.BANK_DESCRIPTOR + '“) – be žodžių „pažintys“ ar programėlės pavadinimo.', 'your bank statement will show a neutral descriptor (e.g. “' + C.BANK_DESCRIPTOR + '”) – without the word “dating” or the app name.') + '</p><p class="faint">' + T('Peržiūroje mokėjimai neveikia: mygtukai tik įjungia demo planą, kad galėtum išbandyti funkcijas.', 'Payments do not work in this preview: the buttons only switch on a demo plan so you can try the features.') + '</p></div>' };
  }

  function settings() {
    var st = S.settings, u = S.user;
    return { tab: 'me', html:
      '<div class="topbar"><a class="icon-btn" href="#/me" aria-label="' + T('Atgal', 'Back') + '">' + I.back + '</a><h1>' + T('Nustatymai', 'Settings') + '</h1></div>' +
      '<h3 class="eyebrow" style="margin-bottom:8px">' + T('Privatumas', 'Privacy') + '</h3><div class="card" style="padding:0 16px">' +
      '<div class="switch-row"><span class="lbl">' + T('Slėpti mano atstumą', 'Hide my distance') + '<small>' + T('Kiti nematys net atstumo juostos.', 'Others will not even see the distance band.') + '</small></span>' + sw('hideDistance', st.hideDistance) + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Rodyti mano amžių', 'Show my age') + '</span>' + sw('showAge', st.showAge) + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Rodyti mano zodiako ženklą', 'Show my zodiac sign') + '<small>' + T('Išjungus kiti nemato tavo ženklo, bet tu matai jų.', 'If off, others cannot see your sign, but you can see theirs.') + '</small></span>' + sw('show_zodiac', st.show_zodiac) + '</div>' +
      '<div class="switch-row" data-testid="invisible-row"><span class="lbl">' + C.FEATURES.label('invisible_mode') + '<small>' + C.FEATURES.note('invisible_mode') + '</small></span>' + invisibleCtl(st.invisible) + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Pranešimai', 'Notifications') + '</span>' + sw('notifications', st.notifications) + '</div></div>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">' + T('Sutikimai', 'Consents') + '</h3><div class="card" style="padding:0 16px">' +
      '<div class="switch-row"><span class="lbl">' + T('Jautrūs duomenys (orientacija, apytikslė vieta)', 'Sensitive data (orientation, approximate location)') + '<small>' + T('Atšaukus – paieška „Šalia“ išjungiama ir šie duomenys ištrinami.', 'If withdrawn, “Nearby” search is turned off and this data is deleted.') + '</small></span>' + sw('consentSensitive', u.consentSensitive) + '</div>' +
      '<div class="switch-row"><span class="lbl">' + T('Naujienos el. paštu', 'News by email') + '</span>' + sw('consentMarketing', u.consentMarketing) + '</div></div>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">' + T('Prenumerata', 'Subscription') + '</h3><div class="card row between"><span>' + (S.premium ? planLabel(S.premium) + ' (demo)' : PL.free.name + T(' planas', ' plan')) + '</span>' + (S.premium ? '<button class="btn small ghost" data-action="cancel-sub">' + T('Atšaukti prenumeratą', 'Cancel subscription') + '</button>' : '<a class="btn small soft" href="#/premium">' + T('Planai', 'Plans') + '</a>') + '</div>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">' + T('Tavo duomenys', 'Your data') + '</h3><ul class="menu">' +
      '<li><button data-action="export">' + I.download + '<span class="grow">' + T('Atsisiųsti mano duomenis (JSON)', 'Download my data (JSON)') + '</span></button></li>' +
      '<li><button data-action="delete" class="danger" data-testid="delete">' + I.trash + '<span class="grow">' + T('Ištrinti paskyrą ir visus duomenis', 'Delete account and all data') + '</span></button></li></ul>' +
      '<h3 class="eyebrow" style="margin:32px 0 8px">' + T('Apie', 'About') + '</h3><div class="card stack" data-testid="about"><div class="row" style="gap:16px">' + I.logo.replace('class="logo"', 'class="logo" width="48" height="48"') + '<div><b>Tikri</b> · ' + T('peržiūra', 'preview') + ' v0.2<br><span class="small muted">' + T('Tikri žmonės. Tikri susitikimai. Tavo privatumas – tavo.', 'Real people. Real dates. Your privacy, your call.') + '</span></div></div>' +
      '<p class="small" style="margin:0"><b>' + T('Privatumas trumpai:', 'Privacy in short:') + '</b> ' + T('tikslios vietos nesaugome, rodome tik atstumo juostas; jautrūs duomenys šifruojami ir tvarkomi tik su tavo aiškiu sutikimu; duomenys saugomi ES.', 'we do not store your exact location, only distance bands; sensitive data is encrypted and processed only with your explicit consent; data is stored in the EU.') + '</p>' +
      '<p class="seller" style="margin:0">' + esc(C.SELLER) + '</p>' +
      '<p class="tiny muted" style="margin:0">' + T('Tai peržiūra su netikrais duomenimis. Profiliai, žinutės ir mokėjimai – netikri. Nuotraukos – DI sugeneruoti išgalvoti suaugę žmonės. Duomenys saugomi tik šioje naršyklėje.', 'This is a preview with fake data. Profiles, messages and payments are not real. Photos are AI-generated fictional adults. Data is stored only in this browser.') + '</p></div>' };
  }

  /* ---------- Maršrutai ---------- */
  function tabs() { return [['nearby', '#/nearby', 'near', T('Šalia', 'Nearby')], ['chats', '#/chats', 'chat', T('Pokalbiai', 'Chats')], ['premium', '#/premium', 'gem', 'Premium'], ['me', '#/me', 'user', T('Profilis', 'Profile')]]; }
  function buildTabbar() { tabbar.setAttribute('aria-label', T('Pagrindinis meniu', 'Main menu')); tabbar.innerHTML = tabs().map(function (t) { return '<a href="' + t[1] + '" data-tab="' + t[0] + '">' + (t[0] === 'chats' ? '<span class="badge" hidden></span>' : '') + ic(t[2], 24) + t[3] + '</a>'; }).join(''); }
  function applyLang() {
    document.documentElement.lang = lang();
    var pb = document.querySelector('.preview-badge'); if (pb) pb.textContent = T('PERŽIŪRA – netikri duomenys', 'PREVIEW – fake data');
    var sp = document.querySelector('.splash-sub'); if (sp) sp.textContent = T('Tikri žmonės. Tikri susitikimai.', 'Real people. Real dates. Your privacy, your call.');
    buildTabbar();
  }
  buildTabbar();
  var routes = [
    [/^welcome$/, welcome], [/^register\/([1-6])$/, register], [/^nearby$/, nearby], [/^profile\/(p\d+)$/, profile],
    [/^chats$/, chats], [/^chat\/(p\d+)$/, chat], [/^me$/, me], [/^safety$/, safety], [/^premium$/, premium], [/^settings$/, settings], [/^verify$/, verify]
  ];
  var seenSkel = {}, renderToken = 0;
  function mount(view) {
    applyLang();
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
    var h1 = app.querySelector('h1,h2'); document.title = (h1 ? h1.textContent.trim() + ' · ' : '') + T('Tikri – peržiūra', 'Tikri – preview');
  }
  function updateBadge() {
    var unread = S.chats.some(function (c) { return c.unread && S.blocked.indexOf(c.id) < 0; });
    tabbar.querySelector('[data-tab="chats"] .badge').hidden = !unread;
  }
  function render() {
    closeSheet(); matchRoot.innerHTML = ''; stopVoice();
    var h = location.hash.replace(/^#\/?/, '');
    if (h !== 'verify') vstep = 1;
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
      if (S.likes.indexOf(id) < 0) { S.likes.push(id); S.rate.likes.push(Date.now()); }
      if (p.likesMe && S.matches.indexOf(id) < 0) { S.matches.push(id); ensureChat(id); matched = true; }
    }
    save();
    advanceStage();
    if (matched) showMatch(p);
  }
  function flyTop(dir) {
    var card = topCard(); if (!card || busy) return;
    if (dir === 'like' && likeBlocked()) { card.classList.remove('dragging'); card.style.transform = ''; setStamps(card, 0); return; }
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
    return '<div class="zmatch" data-testid="match-zodiac"><span class="zm-s">' + zsym(m) + esc(m.name) + '</span><span class="zm-plus">+</span><span class="zm-s">' + zsym(t) + esc(t.name) + '</span><b>' + T('Zodiakas ', 'Zodiac ') + Z.pct(c) + '% · ' + esc(Z.label(c)) + '</b></div><div class="zm-note">' + esc(Z.NOTE) + '</div>';
  }
  function showMatch(p) {
    matchRoot.innerHTML = '<div class="match-screen" role="dialog" aria-modal="true" aria-label="' + T('Abipusis susidomėjimas', 'It\'s mutual') + '" data-testid="match-screen">' +
      '<div class="match-pair"><div class="match-photo a">' + (S.user.photo ? '<img class="ph in" src="' + ME_PHOTO + '" alt="">' : '') + '</div><div class="match-photo b"><img class="ph in" src="' + src(p.photos[0]) + '" alt="' + T('DI sugeneruota nuotrauka – ', 'AI-generated photo – ') + esc(p.name) + '"></div><span class="match-heart">' + ic('heart') + '</span></div>' +
      '<h1>' + (lang() === 'en' && zodiacMatch(p) ? esc(Z.MUTUAL_EN) : T('Abipusis susidomėjimas!', 'It\'s mutual!')) + '</h1>' + zodiacMatch(p) + '<p>' + T('Jūs su ' + esc(p.name) + ' vienas kitu susidomėjote. Pradėkite pokalbį – nuorodos ir kontaktai atsiras po ' + CONTACT_UNLOCK + ' žinučių iš abiejų pusių.', 'You and ' + esc(p.name) + ' are interested in each other. Start a chat – links and contacts will appear after ' + CONTACT_UNLOCK + ' messages from both sides.') + '</p>' + suggestHtml(p) +
      '<div class="actions"><button class="btn block" data-action="match-write" data-id="' + p.id + '" data-testid="match-write">' + ic('chat', 20) + ' ' + T('Parašyti žinutę', 'Send a message') + '</button><button class="btn ghost block" data-action="match-close" data-testid="match-close">' + T('Tęsti naršymą', 'Keep browsing') + '</button></div></div>';
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
    var t = e.target.closest('[data-action],[data-gender],[data-seek],[data-interest],[data-fseek],[data-fband],[data-finterest],[data-fgoal],[data-view],[data-lang]');
    if (!t) return;
    var a = t.dataset.action, u = S.user;
    if (a === 'close-sheet-bg') { if (e.target === t) closeSheet(); return; }
    if (t.dataset.view) { S.view = t.dataset.view; save(); render(); return; }
    if (t.dataset.lang) { u.language = t.dataset.lang === 'en' ? 'en' : 'lt'; save(); render(); return; }
    if (t.dataset.gender) { u.gender = keyBySel(GENDER, t.dataset.gender); document.querySelectorAll('[data-gender]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); return; }
    if (t.dataset.seek) {
      var key = keyBySel(SHOW, t.dataset.seek);
      if (key === 'visi') u.show_me = u.show_me.indexOf('visi') >= 0 ? [] : ['visi'];
      else { u.show_me = u.show_me.filter(function (x) { return x !== 'visi'; }); toggleArr(u.show_me, key); }
      document.querySelectorAll('[data-seek]').forEach(function (b) { b.setAttribute('aria-pressed', u.show_me.indexOf(keyBySel(SHOW, b.dataset.seek)) >= 0); }); return;
    }
    if (t.dataset.interest) { toggleArr(u.interests, t.dataset.interest); t.setAttribute('aria-pressed', u.interests.indexOf(t.dataset.interest) >= 0); document.getElementById('icount').textContent = u.interests.length; return; }
    if (t.dataset.fseek) { draft.seek = t.dataset.fseek; document.querySelectorAll('[data-fseek]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); return; }
    if (t.dataset.fband) { draft.band = +t.dataset.fband; document.querySelectorAll('[data-fband]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); return; }
    if (t.dataset.finterest) { toggleArr(draft.interests, t.dataset.finterest); t.setAttribute('aria-pressed', draft.interests.indexOf(t.dataset.finterest) >= 0); return; }
    if (t.dataset.fgoal) { if (!isPremium()) { premiumNudge(T('Filtras „Ko ieško“', 'The “Looking for” filter')); return; } draft.goal = draft.goal === t.dataset.fgoal ? '' : t.dataset.fgoal; document.querySelectorAll('[data-fgoal]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.fgoal === draft.goal); }); return; }

    switch (a) {
      case 'close-sheet': closeSheet(); break;
      case 'terms': e.preventDefault();
        openSheet('<h2>' + T('Taisyklės ir privatumas (santrauka)', 'Rules and privacy (summary)') + '</h2><ul class="small" style="padding-left:18px;line-height:1.8;margin:16px 0;color:var(--muted)"><li>' + T('Tik 18+ metų žmonės, vienas žmogus – viena paskyra.', 'Only people aged 18+, one person – one account.') + '</li><li>' + T('Draudžiama apsimetinėti, priekabiauti, prašyti pinigų, siųsti nepageidaujamą intymų turinį.', 'No impersonation, harassment, asking for money or sending unwanted intimate content.') + '</li><li>' + T('Tiksli vieta nesaugoma – rodoma tik atstumo juosta.', 'Your exact location is not stored – only a distance band is shown.') + '</li><li>' + T('Jautrūs duomenys tvarkomi tik su atskiru, aiškiu sutikimu ir saugomi ES.', 'Sensitive data is processed only with separate, explicit consent and stored in the EU.') + '</li><li>' + T('Duomenis gali atsisiųsti arba ištrinti bet kada nustatymuose.', 'You can download or delete your data at any time in settings.') + '</li></ul><p class="tiny muted" style="margin-bottom:24px">' + T('Peržiūra: pilni tekstai bus paskelbti prieš paleidimą.', 'Preview: the full texts will be published before launch.') + '</p><button class="btn block" data-action="close-sheet">' + T('Supratau', 'Got it') + '</button>'); break;
      case 'demo-skip':
        merge(S.user, { name: 'Svečias', birth: '1995-05-05', gender: 'kita', show_me: ['visi'], language: lang(), interests: ['Kava', 'Kelionės', 'Muzika', 'Knygos'], verified: true, photo: true, consentTerms: true, consentSensitive: true });
        S.onboarded = true; save(); location.hash = '#/nearby'; break;
      case 'step1': {
        var name = document.getElementById('f-name').value.trim(), birth = dobValue(), age = ageFrom(birth);
        if (!name) return err(T('Įvesk vardą.', 'Enter your name.'));
        if (age === null) return err(T('Įvesk gimimo datą.', 'Enter your date of birth.'));
        if (age < 18) return err(T('Atsiprašome – Tikri skirta tik 18 metų ir vyresniems žmonėms.', 'Sorry – Tikri is only for people aged 18 and over.'));
        if (age > 100) return err(T('Patikrink gimimo datą.', 'Check your date of birth.'));
        u.name = name; u.birth = birth; save(); location.hash = '#/register/2'; break;
      }
      case 'seek-none': u.show_me = []; document.querySelectorAll('[data-seek]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); toast(T('Gerai – orientacijos nenurodysi, matysi visus.', 'OK – you won\'t state an orientation and will see everyone.')); break;
      case 'step2': if (!u.gender) return err(lang() === 'en' ? 'Choose who you are.' : 'Pasirink, kas esi.'); save(); location.hash = '#/register/3'; break;
      case 'step3': if (u.interests.length < 3) return err(T('Pasirink bent 3 interesus.', 'Pick at least 3 interests.')); save(); location.hash = '#/register/4'; break;
      case 'photo-upload': {
        t.disabled = true; t.innerHTML = ic('clock', 18) + ' ' + T('Keliama…', 'Uploading…');
        setTimeout(function () { u.photo = true; save(); render(); toast(T('Nuotrauka įkelta (imitacija).', 'Photo uploaded (simulated).')); }, 700); break;
      }
      case 'step4': save(); location.hash = '#/register/5'; break;
      case 'selfie': {
        var fr = document.getElementById('selfie'), stg = document.getElementById('selfie-stage'), msg = document.getElementById('selfie-msg');
        t.disabled = true; fr.classList.add('scanning'); stg.classList.add('scanning'); msg.className = 'hint-pill muted'; msg.textContent = T('Tikriname… (imituojama)', 'Checking… (simulated)');
        setTimeout(function () {
          u.verified = true; save(); fr.classList.remove('scanning'); stg.classList.remove('scanning'); fr.classList.add('done'); stg.classList.add('done');
          msg.className = 'hint-pill ok'; msg.textContent = T('Profilis patvirtintas!', 'Profile verified!');
          t.outerHTML = '<a class="btn block" href="#/register/6">' + T('Toliau', 'Next') + '</a>';
          var sk = document.querySelector('.ob-foot .textlink'); if (sk) sk.remove();
          toast(T('Profilis patvirtintas', 'Profile verified'));
        }, 2100); break;
      }
      case 'step5': {
        var ct = document.getElementById('c-terms').checked, cs = document.getElementById('c-sens').checked;
        u.consentMarketing = document.getElementById('c-mkt').checked;
        if (!ct) return err(T('Reikia sutikti su taisyklėmis.', 'You need to accept the rules.'));
        if (!cs) return err(T('Be šio sutikimo negalime rodyti žmonių šalia. Jį galėsi atšaukti bet kada.', 'Without this consent we can\'t show people nearby. You can withdraw it at any time.'));
        u.consentTerms = true; u.consentSensitive = true;
        if (!u.show_me.length) S.filters.seek = 'visų';
        else if (u.show_me.length === 1) S.filters.seek = SHOW[u.show_me[0]].sel;
        S.onboarded = true; save(); location.hash = '#/nearby'; toast(T('Sveiki atvykę į Tikri!', 'Welcome to Tikri!')); break;
      }
      case 'avail-opt': setAvail(t.dataset.opt); render(); toast(T('Atnaujinta: ', 'Updated: ') + durLabel(V5.DURATIONS.filter(function (d) { return d.id === t.dataset.opt; })[0])); break;
      case 'save-prompts': {
        var np = [], bad = false;
        [0, 1, 2].forEach(function (i) { var q = document.getElementById('pq-' + i).value, an = document.getElementById('pa-' + i).value.trim(); if (!an) bad = true; np.push({ q: q, a: an.slice(0, V5.PROMPT_MAX) }); });
        if (bad) return err(T('Atsakyk į visus tris klausimus.', 'Please answer all three questions.'));
        var qs = np.map(function (x) { return x.q; }); if (qs.some(function (x, i) { return qs.indexOf(x) !== i; })) return err(T('Kiekvienas klausimas turi būti skirtingas.', 'Each question must be different.'));
        u.prompts = np; save(); toast(T('Atsakymai išsaugoti.', 'Answers saved.')); break;
      }
      case 'voice-play': playVoice(t.closest('.voice')); break;
      case 'pick-opener': {
        var po = byId(t.dataset.id), txt = suggestOpeners(po)[+t.dataset.i];
        matchRoot.innerHTML = ''; pendingDraft[po.id] = txt;
        if (location.hash === '#/chat/' + po.id) { var mi = document.getElementById('msg-input'); if (mi) { mi.value = txt; delete pendingDraft[po.id]; mi.focus(); } } else location.hash = '#/chat/' + po.id;
        break;
      }
      case 'photo-show': case 'photo-hide': {
        var pc2 = findChat(t.dataset.id), pm = pc2 && pc2.messages[+t.dataset.i];
        if (pm) { pm.shown = a === 'photo-show'; save(); var box = t.closest('.pimg'); if (box) box.classList.toggle('shown', pm.shown); }
        break;
      }
      case 'chat-menu': {
        var cm = byId(t.dataset.id);
        openSheet('<div class="row between"><h2 style="margin:0">' + T('Pokalbio meniu', 'Chat menu') + '</h2><button class="icon-btn" data-action="close-sheet" aria-label="' + T('Uždaryti', 'Close') + '">' + I.close + '</button></div>' +
          '<div class="menu-list" style="margin-top:16px">' +
          '<button class="menu-i" data-action="date-share-open" data-id="' + cm.id + '" data-testid="menu-date">' + ic('share', 20) + '<span><b>' + T('Pasidalink pasimatymu su draugu', 'Share your date with a friend') + '</b><small>' + T('Vieta, laikas ir su kuo – paruošiame tekstą', 'Place, time and who with – we prepare the text') + '</small></span></button>' +
          '<button class="menu-i" data-action="report" data-id="' + cm.id + '" data-testid="menu-report">' + ic('flag', 20) + '<span><b>' + T('Pranešti', 'Report') + '</b><small>' + T('Moderatorių komanda peržiūri pranešimą', 'Our moderators review the report') + '</small></span></button>' +
          '<button class="menu-i danger" data-action="block" data-id="' + cm.id + '" data-testid="menu-block">' + ic('block', 20) + '<span><b>' + T('Blokuoti', 'Block') + '</b><small>' + T(esc(cm.name) + ' nebematys tavęs ir nebegalės rašyti', esc(cm.name) + ' will no longer see you or be able to write to you') + '</small></span></button></div>');
        break;
      }
      case 'date-share-open': dateSheet(byId(t.dataset.id)); break;
      case 'date-copy': copyText(dateText(), function (ok) { toast(ok ? T('Tekstas nukopijuotas.', 'Text copied.') : T('Nepavyko nukopijuoti – pažymėk tekstą ir nukopijuok ranka.', 'Could not copy – select the text and copy it by hand.')); }); break;
      case 'date-share': {
        var dt = dateText();
        if (navigator.share) navigator.share({ text: dt }).catch(function () { /* atšaukta */ });
        else copyText(dt, function (ok) { toast(ok ? T('Dalijimasis nepalaikomas – tekstas nukopijuotas.', 'Sharing isn\'t supported – text copied.') : T('Nepavyko nukopijuoti.', 'Could not copy.')); });
        break;
      }
      case 'photo-add': {
        var ps = myPhotos(), mx = V5.PHOTOS.MAX;
        if (ps.length >= mx) { toast(T('Daugiausia ' + mx + ' nuotraukų (laukiančios + patvirtintos).', 'Up to ' + mx + ' photos (pending + approved).')); break; }
        var rp2 = rateCheck('photos'); if (rp2) { rateSheet(rp2); break; }
        S.rate.photos.push(Date.now()); ps.push({ id: 'ph' + Date.now(), status: 'pending', v: ps.length }); save(); render();
        toast(T('Nuotrauka įkelta (imitacija) – laukia patikrinimo.', 'Photo added (simulated) – pending review.')); break;
      }
      case 'photo-del': { var ps3 = myPhotos(); ps3.splice(+t.dataset.i, 1); u.photo = ps3.some(function (x) { return x.status === 'approved'; }); save(); render(); toast(T('Nuotrauka pašalinta.', 'Photo removed.')); break; }
      case 'verify-next': vstep = Math.min(4, vstep + 1); render(); break;
      case 'verify-prev': vstep = Math.max(1, vstep - 1); render(); break;
      case 'verify-run': {
        t.disabled = true; var pg = document.getElementById('vprog'), vm = document.getElementById('vmsg'); if (pg) pg.hidden = false; if (vm) vm.hidden = false;
        setTimeout(function () { u.checked = true; vstep = 4; save(); if (location.hash === '#/verify') render(); toast(T('Patikrinta (demo). Nuotrauka ištrinta.', 'Verified (demo). Photo deleted.')); }, 1800); break;
      }
      case 'verify-reset': u.checked = false; vstep = 1; save(); render(); toast(T('Ženklelis pašalintas.', 'Badge removed.')); break;
      case 'filters': filtersSheet(); break;
      case 'apply-filters': {
        draft.ageMin = +document.getElementById('age-min').value; draft.ageMax = +document.getElementById('age-max').value;
        var vs = document.querySelector('[data-switch="f-verified"]'); draft.verifiedOnly = vs.checked;
        draft.checkedOnly = document.querySelector('[data-switch="f-checked"]').checked; draft.freeToday = document.querySelector('[data-switch="f-today"]').checked;
        var os = document.querySelector('[data-switch="f-online"]'); if (os) draft.onlineOnly = os.checked;
        var zs = document.querySelector('[data-switch="f-zodiac"]'); if (zs && zodAllowed()) draft.zodiacOnly = zs.checked;
        S.filters = draft; save(); render(); break;
      }
      case 'reset-filters': S.filters = clone(defaults.filters); save(); render(); break;
      case 'locked': premiumNudge(t.dataset.what || T('Ši funkcija', 'This feature')); break;
      case 'swipe-like': flyTop('like'); break;
      case 'swipe-pass': flyTop('pass'); break;
      case 'swipe-info': { var tc = topCard(); if (tc) location.hash = '#/profile/' + tc.dataset.id; break; }
      case 'undo': {
        var hst = S.history.pop(); if (!hst) { toast(T('Nėra ką atšaukti.', 'Nothing to undo.')); break; }
        delete S.swiped[hst.id]; if (hst.dir === 'like') S.likes = S.likes.filter(function (x) { return x !== hst.id; });
        save(); var stg2 = stageEl(); if (stg2) { stg2.innerHTML = stageInner(); hydrate(stg2); } break;
      }
      case 'restart-deck': S.swiped = {}; S.history = []; save(); render(); break;
      case 'like': {
        var id = t.dataset.id, pr = byId(id);
        if (S.likes.indexOf(id) >= 0) { S.likes = S.likes.filter(function (x) { return x !== id; }); save(); render(); toast(T('Patiktukas atšauktas.', 'Like removed.')); break; }
        if (likeBlocked()) break;
        S.likes.push(id); S.rate.likes.push(Date.now()); var mt = pr.likesMe && S.matches.indexOf(id) < 0; if (mt) { S.matches.push(id); ensureChat(id); } save();
        t.setAttribute('aria-pressed', 'true'); t.style.color = 'var(--accent-hi)'; t.innerHTML = I.fill('heart');
        if (mt) showMatch(pr); else toast(T('Pažymėta. Jei ' + pr.name + ' taip pat susidomės – gausite pranešimą.', 'Liked. If ' + pr.name + ' is interested too – you will get a notification.')); break;
      }
      case 'match-close': matchRoot.innerHTML = ''; break;
      case 'match-write': matchRoot.innerHTML = ''; location.hash = '#/chat/' + t.dataset.id; break;
      case 'write': location.hash = '#/chat/' + t.dataset.id; break;
      case 'attach': toast(T('Peržiūroje nuotraukų siuntimas išjungtas. Tikroje programėlėje pokalbių nuotraukos ištrinamos po ' + LIM.chatPhotoDays + ' d.', 'Sending photos is turned off in the preview. In the real app, chat photos are deleted after ' + LIM.chatPhotoDays + ' days.')); break;
      case 'block': {
        var bp = byId(t.dataset.id);
        openSheet('<h2>' + T('Blokuoti ' + esc(bp.name) + '?', 'Block ' + esc(bp.name) + '?') + '</h2><p class="muted" style="margin-bottom:24px">' + T('Jūs nebematysite vienas kito paieškoje, pokalbiuose ir peržiūrose. ' + esc(bp.name) + ' apie tai nebus informuotas(-a).', 'You will no longer see each other in search, chats or previews. ' + esc(bp.name) + ' will not be notified.') + '</p><button class="btn block" data-action="block-yes" data-id="' + bp.id + '" data-testid="block-yes">' + T('Blokuoti', 'Block') + '</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">' + T('Atšaukti', 'Cancel') + '</button>'); break;
      }
      case 'block-yes': if (S.blocked.indexOf(t.dataset.id) < 0) S.blocked.push(t.dataset.id); save(); closeSheet(); toast(T('Užblokuota.', 'Blocked.')); location.hash = '#/nearby'; break;
      case 'unblock': S.blocked = S.blocked.filter(function (x) { return x !== t.dataset.id; }); save(); render(); toast(T('Atblokuota.', 'Unblocked.')); break;
      case 'report': {
        var rp = byId(t.dataset.id), reasons = lang() === 'en' ? ['Fake profile / impersonation', 'Underage', 'Insults or harassment', 'Scam, asks for money', 'Unwanted intimate content', 'Other'] : ['Netikras profilis / apsimetinėjimas', 'Nepilnametis(-ė)', 'Įžeidinėjimas ar priekabiavimas', 'Sukčiavimas, prašo pinigų', 'Nepageidaujamas intymus turinys', 'Kita'];
        openSheet('<h2>' + T('Pranešti apie ' + esc(rp.name), 'Report ' + esc(rp.name)) + '</h2><p class="muted small" style="margin-bottom:16px">' + T('Pranešimą peržiūri žmogus iš moderatorių komandos. Apie sprendimą informuosime. ' + esc(rp.name) + ' nesužinos, kas pranešė.', 'A person from our moderation team reviews every report. We will tell you the outcome. ' + esc(rp.name) + ' will not know who reported.') + '</p>' +
          reasons.map(function (r, i) { return '<label class="check"><input type="radio" name="reason" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + r + '</span></label>'; }).join('') +
          '<label class="check"><input type="checkbox" id="r-block" checked><span>' + T('Taip pat užblokuoti', 'Also block') + '</span></label>' +
          '<button class="btn danger block" style="margin-top:16px" data-action="report-yes" data-id="' + rp.id + '" data-testid="report-yes">' + T('Siųsti pranešimą', 'Send report') + '</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">' + T('Atšaukti', 'Cancel') + '</button>'); break;
      }
      case 'report-yes': {
        S.reported.push(t.dataset.id);
        var alsoBlock = document.getElementById('r-block').checked;
        if (alsoBlock && S.blocked.indexOf(t.dataset.id) < 0) S.blocked.push(t.dataset.id);
        save(); closeSheet(); toast(T('Ačiū. Pranešimas gautas (peržiūra – niekur nesiunčiama).', 'Thank you. Report received (preview – nothing is sent).'));
        if (alsoBlock) location.hash = '#/nearby'; break;
      }
      case 'ai-opener': {
        var op = byId(t.dataset.id), shr = shared(op), pool = [];
        (shr.length ? shr : op.interests).forEach(function (x) { pool = pool.concat(openersFor(x)); });
        if (!pool.length) pool = openersFor('_');
        var idx = (S.openerIdx[op.id] || 0) % pool.length; S.openerIdx[op.id] = idx + 1; save();
        var inp = document.getElementById('msg-input'); inp.value = pool[idx]; inp.focus();
        toast(shr.length ? T('Pasiūlymas pagal bendrą interesą. Gali redaguoti.', 'Suggestion based on a shared interest. You can edit it.') : T('Bendrų interesų nėra – pasiūlymas pagal jo/jos interesus.', 'No shared interests – suggestion based on their interests.')); break;
      }
      case 'share-start': {
        var sn = document.getElementById('s-name').value.trim(); if (!sn) return err(T('Įvesk draugo vardą.', 'Enter your friend\'s name.'));
        S.share = { name: sn, until: Date.now() + (+document.getElementById('s-dur').value) * 36e5 }; save(); render(); toast(T('Nuoroda sukurta (simuliacija).', 'Link created (simulation).')); break;
      }
      case 'share-stop': S.share = null; save(); render(); toast(T('Dalijimasis baigtas, duomenys ištrinti.', 'Sharing stopped, data deleted.')); break;
      case 'billing': S.billing = t.dataset.b; save(); render(); break;
      case 'buy': {
        var plan = t.dataset.plan, pp = PL[plan], yb = yearly();
        openSheet('<h2>' + pp.name + ' – ' + (yb ? eur(pp.yearPrice) + ' / ' + T('metams', 'year') : eur(pp.price) + ' / ' + pp.days + T(' d.', ' days')) + '</h2><p class="muted small" style="margin:8px 0 16px">' + T('Kaina su PVM. ', 'Price incl. VAT. ') + (yb ? T('Mokama vieną kartą metams. Per 14 dienų gali atsisakyti ir atgausi pinigus. ', 'Paid once a year. Within 14 days you can withdraw and get your money back. ') : T('Atsinaujina kas ' + pp.days + ' d., ', 'Renews every ' + pp.days + ' days. ')) + T('Atšaukti gali bet kada vienu paspaudimu. Banko išraše – neutralus aprašas „' + C.BANK_DESCRIPTOR + '“.', 'You can cancel at any time with one tap. Your bank statement shows a neutral descriptor “' + C.BANK_DESCRIPTOR + '”.') + '</p><div class="notice gold" style="margin-bottom:24px">' + ic('info') + '<span>' + T('Tai peržiūra – tikro mokėjimo nėra. Galime įjungti demo planą, kad išbandytum funkcijas.', 'This is a preview – there is no real payment. We can switch on a demo plan so you can try the features.') + '</span></div><button class="btn block" data-action="demo-activate" data-plan="' + plan + '" data-testid="demo-activate">' + T('Įjungti demo planą (be mokėjimo)', 'Switch on the demo plan (no payment)') + '</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">' + T('Atšaukti', 'Cancel') + '</button>'); break;
      }
      case 'demo-activate': S.premium = t.dataset.plan; if (S.premium !== 'plus') { S.filters.zodiacOnly = false; } save(); closeSheet(); render(); toast(T('Demo planas įjungtas.', 'Demo plan switched on.')); break;
      case 'cancel-sub': S.premium = null; S.filters.onlineOnly = false; S.filters.goal = ''; S.filters.zodiacOnly = false; save(); render(); toast(T('Prenumerata atšaukta.', 'Subscription cancelled.')); break;
      case 'export': {
        var blob = new Blob([JSON.stringify(lang() === 'en' ? { note: 'Tikri preview – data only in this browser', data: S } : { pastaba: 'Tikri peržiūra – duomenys tik šioje naršyklėje', duomenys: S }, null, 2)], { type: 'application/json' });
        var aEl = document.createElement('a'); aEl.href = URL.createObjectURL(blob); aEl.download = T('tikri-mano-duomenys.json', 'tikri-my-data.json'); document.body.appendChild(aEl); aEl.click(); aEl.remove(); toast(T('Duomenų failas paruoštas.', 'Data file ready.')); break;
      }
      case 'delete':
        openSheet('<h2>' + T('Ištrinti paskyrą?', 'Delete account?') + '</h2><p class="muted" style="margin:8px 0 24px">' + T('Ištrinsime profilį, nuotraukas, pokalbius, sutikimus ir vietos duomenis. Aktyvi prenumerata bus atšaukta. To atšaukti negalima.', 'We will delete your profile, photos, chats, consents and location data. An active subscription will be cancelled. This cannot be undone.') + '</p><button class="btn danger block" data-action="delete-yes" data-testid="delete-yes">' + ic('trash', 18) + ' ' + T('Taip, ištrinti viską', 'Yes, delete everything') + '</button><button class="btn ghost block" style="margin-top:8px" data-action="close-sheet">' + T('Atšaukti', 'Cancel') + '</button>'); break;
      case 'delete-yes': try { localStorage.removeItem(LS); } catch (x) { /* */ } S = clone(defaults); S.chats = clone(D.chats); ensureV5(); closeSheet(); location.hash = '#/welcome'; toast(T('Paskyra ir duomenys ištrinti.', 'Account and data deleted.')); break;
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.switch) return;
    var k = t.dataset.switch;
    if (k === 'f-verified' || k === 'f-online' || k === 'f-zodiac' || k === 'f-checked' || k === 'f-today') return; // taikoma paspaudus „Rodyti rezultatus“
    if (k === 'incognito') {
      if (t.checked && !feat('incognito_mode')) { t.checked = false; plusSheet(); return; }
      S.settings.incognito = t.checked; save(); render(); toast(t.checked ? T('Incognito įjungtas.', 'Incognito is on.') : T('Incognito išjungtas.', 'Incognito is off.')); return;
    }
    if (k === 'available') { if (t.checked) setAvail('1h'); else S.available = null; save(); render(); toast(t.checked ? T('Pažymėjai „Šiandien galiu susitikti“ 1 val.', 'You marked “Free to meet today” for 1 h') : T('Ženklelis „Šiandien ✓“ pašalintas.', 'The “Today ✓” badge was removed.')); return; }
    if (k === 'consentSensitive' || k === 'consentMarketing') {
      S.user[k] = t.checked;
      if (k === 'consentSensitive') toast(t.checked ? T('Sutikimas suteiktas – paieška įjungta.', 'Consent given – search is on.') : T('Sutikimas atšauktas – paieška išjungta.', 'Consent withdrawn – search is off.'));
    } else if (k === 'invisible') {
      if (!feat('invisible_mode')) { t.checked = false; premiumNudge(C.FEATURES.label('invisible_mode')); return; }
      S.settings.invisible = t.checked; toast(t.checked ? T('Nematomas režimas įjungtas – tave mato tik tavo poros.', 'Your profile is hidden – only your matches can see you.') : T('Nematomas režimas išjungtas.', 'Your profile is visible again.'));
    } else { S.settings[k] = t.checked; }
    save();
  });

  document.addEventListener('input', function (e) {
    var t = e.target; if (!t || !t.classList || !t.classList.contains('pa')) return;
    var c = document.querySelector('.pcount[data-for="' + t.id + '"]'); if (c) c.textContent = t.value.length + '/' + V5.PROMPT_MAX;
  });

  document.addEventListener('submit', function (e) {
    var f = e.target; if (f.dataset.form !== 'send') return; e.preventDefault();
    var inp = f.querySelector('input'), txt = inp.value.trim(); if (!txt) return;
    var id = f.dataset.id, c = findChat(id), msg = { from: 'me', text: txt, t: Date.now(), r: false };
    if (!c.messages.some(function (m) { return m.from === 'me'; })) {
      var rw = rateCheck('first'); if (rw) { rateSheet(rw); return; }
      S.rate.first.push(Date.now());
    }
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
