/* Krissty – krissty.lt · vanilla JS, no dependencies */
(function () {
  'use strict';
  var C = window.KRISSTY_CONFIG || {};
  var P = window.KRISSTY_PORTFOLIO || [];
  var LS = 'krissty-lang';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Translations (LT is read from the HTML; EN lives here) ---------- */
  var EN = {
    skip: 'Skip to content', navLabel: 'Main navigation',
    navServices: 'Services', navHow: 'How it works', navWork: 'Work', navContact: 'Contact',
    bookShort: 'Book', expTxt: 'years of experience<br>in photo & video', reelKicker: 'Video', reelNote: 'The video only loads after you press \u201cPlay\u201d.',
    revKicker: 'Reviews', revTitle: 'What clients say', crsKicker: 'Courses & certificates', crsTitle: 'Always learning', crsSub: 'Completed courses and course completion certificates.', pill1: 'Photo sessions', pill2: 'Filming & editing', book: 'Book now', seeWork: 'See my work', heroAlt: 'Kristina – Krissty',
    eyebrow: 'Photo · Video · Content',
    tagline: 'Moments you\u2019ll want to watch again.',
    lead: 'I\u2019m Kristina \u2013 a photographer, videographer and video editor with more than 20 years of experience in photography, video content creation and editing. I shoot, film and create content: from weddings and birthdays to corporate events, photo sessions and Reels for social media. You enjoy the moment \u2013 I make sure it lasts.',
    chipsLabel: 'Popular services', c1: 'Weddings', c2: 'Birthdays', c3: 'Corporate events', c4: 'Concerts', c5: 'Reels / TikTok', c6: 'Mustang shoots',
    where: '📍 Palanga · Marijampolė · Lithuania',
    servKicker: 'Services', servTitle: 'What I can create for you',
    servSub: 'From a single photo session to a full event film \u2013 with the same love for detail.',
    s1t: 'Photo sessions', s1d: 'Natural, lively shots \u2013 portraits, couples, families, products and cars. Yes, Mustang included.',
    s1a: 'Portrait', s1b: 'Couples', s1c: 'Family', s1e: 'Products', s1f: 'Cars',
    s2t: 'Event filming', s2d: 'Weddings, birthdays, corporate events, parties and concerts \u2013 I capture the key moments and the real atmosphere.',
    s2a: 'Weddings', s2b: 'Birthdays', s2c: 'Corporate', s2e: 'Parties', s2f: 'Concerts',
    s3t: 'Video editing', s3d: 'I turn raw footage into a story: an event film, a short highlight or a clip with music, titles and colour grading.',
    s3a: 'Event films', s3b: 'Highlights', s3c: 'Colour grading', s3e: 'Titles & music',
    s4t: 'Social media content', s4d: 'Reels, TikTok and other short vertical content for businesses or personal profiles \u2013 from idea to ready-to-post.',
    s4e: 'Content ideas', order: 'Book',
    other: 'Need something else? I create other digital content too \u2013 <a href="#kontaktai">drop me a line</a> and let\u2019s talk.',
    howKicker: 'How it works', howTitle: 'Simple, clear and stress-free',
    st1t: 'Get in touch', st1d: 'Fill in the request form or message me on Facebook: the occasion, date and place.',
    st2t: 'We talk details', st2d: 'I get back to you and we discuss the idea, style, duration and price together.',
    st3t: 'I shoot & film', st3d: 'I arrive at the agreed time and capture the moments naturally \u2013 you just be yourself.',
    st4t: 'You get the result', st4d: 'I select, retouch and edit \u2013 you receive finished photos and videos you\u2019ll love to share.',
    workKicker: 'Portfolio', workTitle: 'Work',
    workSub: 'The portfolio is growing \u2013 more photo sessions, events and videos are coming soon.',
    filterLabel: 'Filter work', phNote: 'Tiles marked \u201cPlaceholder\u201d are reserved for upcoming work, not real projects.',
    gwTitle: '🍀 Win a Ford Mustang GT photo session',
    gwText: 'Follow Krissty on Facebook \u2013 every time we reach a new follower milestone, one lucky follower wins a photo session with a Ford Mustang GT 5.0 and a short ride.',
    gwBtn: 'About the giveaway →',
    ctKicker: 'Booking', ctTitle: 'Tell me about your idea',
    ctSub: 'Fill in the form \u2013 your email app will open with a ready-made message. Just hit \u201cSend\u201d.',
    fName: 'Name', fContact: 'Email or phone', fService: 'Service', fDate: 'Date', optional: '(optional)', fMsg: 'Message',
    fMsgPh: 'E.g.: a birthday in Palanga, about 40 guests, we\u2019d love a short video clip and photos.',
    oPhoto: 'Photo session', oEvent: 'Event filming', oEditing: 'Video editing', oSocial: 'Social media content', oOther: 'Other',
    send: 'Send request', fine: 'This website stores none of your data \u2013 the message is sent from your own email.',
    sideLabel: 'Other contacts', fbTitle: 'Prefer Facebook?',
    fbText: 'Send a Messenger message \u2013 we\u2019ll copy your request text for you, just paste it.',
    msgBtn: 'Message on Messenger', directTitle: 'Direct contacts', callBtn: 'Call',
    footTag: 'Photo · Video · Social media content', footNav: 'Links', footGw: 'Mustang GT giveaway',
    bookSticky: 'Book a photo session or filming', close: 'Close'
  };
  // Strings used only from JS (both languages)
  var JS = {
    lt: {
      title: document.title, desc: '',
      all: 'Visi', cat_photo: 'Foto', cat_event: 'Renginiai', cat_video: 'Video', cat_social: 'Socialiniai tinklai',
      ph: 'Pavyzdys', phSoon: 'Netrukus',
      errName: 'Įrašykite savo vardą.', errContact: 'Įrašykite el. paštą arba telefono numerį.',
      subj: 'Užklausa', lName: 'Vardas', lContact: 'Kontaktai', lService: 'Paslauga', lDate: 'Data', lMsg: 'Žinutė',
      lNoDate: 'dar nežinoma', greet: 'Sveiki, Krissty!', bye: 'Ačiū!',
      sent: 'Atsidarė el. pašto programa? Jei ne – parašykite tiesiai adresu <a href="mailto:{e}">{e}</a> arba per <a href="{fb}" target="_blank" rel="noopener">Facebook</a>.',
      play: 'Paleisti vaizdo įrašą', verify: 'Patikrinti sertifikatą', completed: 'Baigtas kursas', reelDefault: 'Mano darbų santrauka',
      copied: 'Užklausos tekstas nukopijuotas – įklijuokite jį žinutėje.', email: 'El. paštas', phone: 'Telefonas', fb: 'Facebook'
    },
    en: {
      title: 'Krissty \u2013 photographer, videographer & content creator | Photo sessions, event filming',
      all: 'All', cat_photo: 'Photo', cat_event: 'Events', cat_video: 'Video', cat_social: 'Social media',
      ph: 'Placeholder', phSoon: 'Coming soon',
      errName: 'Please enter your name.', errContact: 'Please enter an email or phone number.',
      subj: 'Booking request', lName: 'Name', lContact: 'Contact', lService: 'Service', lDate: 'Date', lMsg: 'Message',
      lNoDate: 'not decided yet', greet: 'Hi Krissty!', bye: 'Thank you!',
      sent: 'Did your email app open? If not, write directly to <a href="mailto:{e}">{e}</a> or via <a href="{fb}" target="_blank" rel="noopener">Facebook</a>.',
      play: 'Play video', verify: 'Verify certificate', completed: 'Completed course', reelDefault: 'My showreel',
      copied: 'Request text copied \u2013 paste it into your message.', email: 'Email', phone: 'Phone', fb: 'Facebook'
    }
  };
  var metaDesc = $('meta[name="description"]');
  JS.lt.desc = metaDesc ? metaDesc.content : '';
  JS.en.desc = 'Krissty \u2013 photographer, videographer, video editor and digital content creator in Lithuania with 20+ years of experience. Wedding, birthday and corporate event filming, photo sessions, video editing, Reels and TikTok content.';

  // Capture LT from DOM
  var LT = {}, LTattr = {};
  $$('[data-i18n]').forEach(function (el) { var k = el.getAttribute('data-i18n'); if (!(k in LT)) LT[k] = el.innerHTML; });
  $$('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(';').forEach(function (p) {
      var a = p.split(':'); LTattr[a[1]] = el.getAttribute(a[0]);
    });
  });

  var lang = 'lt';
  function t(k) { return JS[lang][k]; }
  function getLang() {
    try { var s = localStorage.getItem(LS); if (s === 'lt' || s === 'en') return s; } catch (e) {}
    return C.defaultLang === 'en' ? 'en' : 'lt';
  }
  function setLang(l, save) {
    lang = l;
    var dict = l === 'en' ? EN : LT;
    $$('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n'); var v = dict[k];
      if (v != null && el.innerHTML !== v) el.innerHTML = v;
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (p) {
        var a = p.split(':'); var v = l === 'en' ? EN[a[1]] : LTattr[a[1]];
        if (v != null) el.setAttribute(a[0], v);
      });
    });
    document.documentElement.lang = l;
    document.title = t('title');
    if (metaDesc) metaDesc.content = t('desc');
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
    renderFilters(); renderGallery(); renderContacts(); renderReel(); renderCourses(); renderReviews();
    if (save) { try { localStorage.setItem(LS, l); } catch (e) {} }
  }
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------- Portfolio ---------- */
  var filter = 'all';
  var ICONS = {
    photo: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.8"/>',
    event: '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
    video: '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3.5v10l-6-3.5"/>',
    social: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="m10.5 9 4 3-4 3z"/>'
  };
  function L(o) { if (!o) return ''; if (typeof o !== 'object') return String(o); return o[lang] || o.lt || o.en || ''; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function renderFilters() {
    var box = $('#filters'); if (!box) return;
    var cats = []; P.forEach(function (it) { if (it.cat && cats.indexOf(it.cat) < 0) cats.push(it.cat); });
    box.innerHTML = ['all'].concat(cats).map(function (c) {
      return '<button type="button" data-f="' + c + '" aria-pressed="' + (c === filter) + '">' + esc(t(c === 'all' ? 'all' : 'cat_' + c) || c) + '</button>';
    }).join('');
    $$('button', box).forEach(function (b) {
      b.addEventListener('click', function () { filter = b.getAttribute('data-f'); renderFilters(); renderGallery(); });
    });
  }
  function renderGallery() {
    var g = $('#gallery'); if (!g) return;
    var items = P.filter(function (it) { return filter === 'all' || it.cat === filter; });
    var hasPh = false;
    g.innerHTML = items.map(function (it, i) {
      var cls = it.wide ? ' class="wide"' : '';
      if (it.placeholder || !it.src) {
        hasPh = true;
        return '<li' + cls + '><div class="ph" role="img" aria-label="' + esc(t('ph') + ': ' + L(it.label)) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[it.cat] || ICONS.photo) + '</svg><b>' + esc(L(it.label)) + '</b><small>' + esc(t('ph')) + ' · ' + esc(t('phSoon')) + '</small></div></li>';
      }
      var img = '<picture>' + (it.webp ? '<source srcset="' + esc(it.webp) + '" type="image/webp">' : '') +
        '<img src="' + esc(it.src) + '" alt="' + esc(L(it.alt)) + '" loading="lazy" decoding="async"></picture>';
      var cap = it.caption ? '<span class="cap">' + esc(L(it.caption)) + '</span>' : '';
      if (it.href) return '<li' + cls + '><a class="tile" href="' + esc(it.href) + '" target="_blank" rel="noopener">' + img + cap + '</a></li>';
      return '<li' + cls + '><button type="button" class="tile" data-i="' + P.indexOf(it) + '" aria-label="' + esc(L(it.alt)) + '">' + img + '</button>' + cap + '</li>';
    }).join('');
    var note = $('#phNote'); if (note) note.hidden = !hasPh;
    $$('button.tile', g).forEach(function (b) { b.addEventListener('click', function () { openLb(P[+b.getAttribute('data-i')]); }); });
  }
  var lb = $('#lb');
  function openLb(it) {
    if (!lb || typeof lb.showModal !== 'function') { window.open(it.full || it.src, '_blank'); return; }
    $('#lbImg').src = it.full || it.src; $('#lbImg').alt = L(it.alt); $('#lbCap').textContent = L(it.caption) || '';
    lb.showModal();
  }
  if (lb) {
    $('.x', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------- Video reel (click-to-load) ---------- */
  var R = C.reel || {};
  function parseVideo(u) {
    if (!u) return null; var m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)))
      return { kind: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1&playsinline=1' };
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      return { kind: 'iframe', src: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&dnt=1' };
    if (/(facebook\.com|fb\.watch)\//.test(u))
      return { kind: 'iframe', src: 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u) + '&show_text=false&autoplay=true' };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return { kind: 'video', src: u };
    return null;
  }
  var reelVideo = parseVideo(R.url), reelLoaded = false;
  function renderReel() {
    var sec = $('#reel'); if (!sec) return;
    if (!reelVideo) { sec.hidden = true; return; }
    sec.hidden = false;
    $('#h-reel').textContent = L(R.title) || t('reelDefault');
    var pl = $('#player'); pl.classList.toggle('vertical', !!R.vertical);
    if (reelLoaded) return;
    pl.innerHTML = '<button type="button" class="playbtn" aria-label="' + esc(t('play')) + '">' +
      (R.poster ? '<img src="' + esc(R.poster) + '" alt="" loading="lazy" decoding="async">' : '<span class="poster-fallback" aria-hidden="true"><img src="assets/img/clover.svg" alt="" width="64" height="64"></span>') +
      '<span class="pi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></button>';
    $('.playbtn', pl).addEventListener('click', loadReel);
  }
  function loadReel() {
    var pl = $('#player'); reelLoaded = true;
    if (reelVideo.kind === 'video') {
      pl.innerHTML = '<video controls playsinline autoplay preload="metadata"' + (R.poster ? ' poster="' + esc(R.poster) + '"' : '') + '><source src="' + esc(reelVideo.src) + '"></video>';
      var v = $('video', pl); if (v && v.play) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    } else {
      pl.innerHTML = '<iframe src="' + esc(reelVideo.src) + '" title="' + esc(L(R.title) || t('reelDefault')) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    }
  }

  /* ---------- Courses & reviews ---------- */
  var COURSES = window.KRISSTY_COURSES || [], REVIEWS = window.KRISSTY_REVIEWS || [];
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function renderCourses() {
    var sec = $('#kursai'); if (!sec) return;
    sec.hidden = !COURSES.length; if (!COURSES.length) return;
    $('#crslist').innerHTML = COURSES.map(function (c) {
      var meta = [c.provider, c.year].filter(Boolean).map(function (x) { return esc(String(x)); }).join(' · ');
      var u = safeUrl(c.url);
      return '<li class="crs rv in"><span class="crs-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m9 14.5-1.5 7 4.5-2.5 4.5 2.5-1.5-7"/></svg></span><div>' +
        '<small>' + esc(t('completed')) + '</small><h3>' + esc(L(c.title) || '') + '</h3>' + (meta ? '<p>' + meta + '</p>' : '') +
        (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t('verify')) + ' →</a>' : '') + '</div></li>';
    }).join('');
  }
  function renderReviews() {
    var sec = $('#atsiliepimai'); if (!sec) return;
    sec.hidden = !REVIEWS.length; if (!REVIEWS.length) return;
    $('#revlist').innerHTML = REVIEWS.map(function (r) {
      var u = safeUrl(r.url), src = r.source ? esc(r.source) : '';
      var meta = [u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + (src || 'Link') + '</a>' : src, r.date ? esc(r.date) : ''].filter(Boolean).join(' · ');
      return '<li class="rev rv in"><blockquote><p>' + esc(L(r.text) || '') + '</p></blockquote><p class="who"><b>' + esc(r.name || '') + '</b>' + (meta ? '<span>' + meta + '</span>' : '') + '</p></li>';
    }).join('');
  }

  /* ---------- Contacts ---------- */
  var fbUrl = C.facebookUrl || '#';
  var msgUrl = C.messengerUrl || fbUrl;
  $$('.js-fb').forEach(function (a) { a.href = fbUrl; });
  var telHref = (C.phone || '').replace(/[^\d+]/g, '');
  $$('.js-tel').forEach(function (a) {
    if (!telHref) { a.hidden = true; return; }
    a.href = 'tel:' + telHref; var s = $('.js-tel-txt', a); if (s) s.textContent = C.phoneDisplay || C.phone;
  });
  $$('.js-mail').forEach(function (a) {
    if (!C.email) { a.hidden = true; return; }
    a.href = 'mailto:' + C.email; var s = $('.js-mail-txt', a); if (s) s.textContent = C.email;
  });
  var SVG = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8V6.5c0-.8.2-1.3 1.4-1.3H17V2.1C16.6 2 15.5 2 14.3 2 11.8 2 10 3.5 10 6.3V8H7.5v3.4H10V22h4V11.4h2.8l.4-3.4z"/></svg>'
  };
  function renderContacts() {
    var ul = $('#clist'); if (!ul) return;
    var h = '';
    if (C.email) h += '<li><a href="mailto:' + esc(C.email) + '">' + SVG.mail + '<span><span class="sr">' + t('email') + ': </span>' + esc(C.email) + '</span></a></li>';
    if (C.phone) h += '<li><a href="tel:' + esc(telHref) + '">' + SVG.phone + '<span><span class="sr">' + t('phone') + ': </span>' + esc(C.phoneDisplay || C.phone) + '</span></a></li>';
    h += '<li><a href="' + esc(fbUrl) + '" target="_blank" rel="noopener">' + SVG.fb + '<span>Facebook · Lifeis Short</span></a></li>';
    ul.innerHTML = h;
  }

  /* ---------- Booking form → mailto ---------- */
  var form = $('#bookForm');
  var dateIn = $('#f-date');
  if (dateIn) { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); dateIn.min = d.toISOString().slice(0, 10); }
  function fieldErr(id, msg) {
    var el = $('#' + id), er = $('#e-' + id.replace('f-', ''));
    el.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (er) er.textContent = msg || '';
  }
  function collect() {
    var sel = $('#f-service');
    return {
      name: $('#f-name').value.trim(), contact: $('#f-contact').value.trim(),
      service: sel.options[sel.selectedIndex].text, date: dateIn.value, message: $('#f-msg').value.trim()
    };
  }
  function bodyText(v) {
    return [t('greet'), '',
      t('lName') + ': ' + v.name, t('lContact') + ': ' + v.contact, t('lService') + ': ' + v.service,
      t('lDate') + ': ' + (v.date || t('lNoDate')), '', t('lMsg') + ':', v.message || '-', '', t('bye')].join('\n');
  }
  function buildMailto(v) {
    var subj = t('subj') + ': ' + v.service + (v.date ? ' (' + v.date + ')' : '') + ' – ' + v.name;
    return 'mailto:' + encodeURIComponent(C.email || '').replace('%40', '@') +
      '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(bodyText(v));
  }
  window.KRISSTY_buildMailto = function () { return buildMailto(collect()); }; // used by tests
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = collect(), ok = true;
      fieldErr('f-name', v.name ? '' : t('errName')); if (!v.name) ok = false;
      fieldErr('f-contact', v.contact.length >= 5 ? '' : t('errContact')); if (v.contact.length < 5) ok = false;
      if (!ok) { var bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
      var href = buildMailto(v);
      form.setAttribute('data-mailto', href);
      var st = $('#status');
      st.innerHTML = t('sent').replace(/\{e\}/g, esc(C.email)).replace('{fb}', esc(fbUrl));
      st.hidden = false;
      window.location.href = href;
    });
    ['f-name', 'f-contact'].forEach(function (id) {
      $('#' + id).addEventListener('input', function () { if (this.getAttribute('aria-invalid') === 'true') fieldErr(id, ''); });
    });
  }
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () { var s = $('#f-service'); if (s) s.value = a.getAttribute('data-service'); });
  });
  var msgBtn = $('#msgBtn');
  if (msgBtn) msgBtn.addEventListener('click', function () {
    var v = collect(), txt = bodyText(v);
    var w = window.open(msgUrl, '_blank');
    if (w) { try { w.opener = null; } catch (e) {} } else window.location.href = msgUrl;
    if ((v.name || v.message) && navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(function () {
        var st = $('#status'); st.textContent = t('copied'); st.hidden = false;
      }, function () {});
    }
  });

  /* ---------- Header / sticky CTA / reveal ---------- */
  var top = $('#top'), sticky = $('#sticky'), hero = $('.hero'), contact = $('#kontaktai');
  function onScroll() {
    var y = window.scrollY || 0;
    top.classList.toggle('solid', y > 20);
    if (sticky && hero && contact) {
      var past = y > hero.offsetHeight - 80;
      var r = contact.getBoundingClientRect();
      var inContact = r.top < window.innerHeight && r.bottom > 0;
      sticky.classList.toggle('on', past && !inContact);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  setLang(getLang(), false);
})();
