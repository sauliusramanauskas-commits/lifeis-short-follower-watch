/* Tikri – PERŽIŪRA. Vienas konfigūracijos objektas: planų kainos ir ribos naudojamos VISUR (kainos, palyginimas, mokėjimo langas, trumpi tekstai).
   Kainoms keisti – užtenka pakeisti `price` (ir, jei reikia, `days`) vienoje eilutėje. Kainos nurodomos su PVM. */
window.TIKRI_CONFIG = {
  VAT_NOTE: 'su PVM',
  PLANS: {
    free:    { id: 'free',    name: 'Nemokamas', price: 0,    days: 30 },
    premium: { id: 'premium', name: 'Premium',   price: 6.99, days: 30, yearPrice: 52.99 },
    plus:    { id: 'plus',    name: 'Plus',      price: 13.99, days: 30, yearPrice: 105.99 }
  },
  YEARLY_DISCOUNT: 0.37, /* metinis planas: 12 mėn. kaina −37 % */
  LIMITS: { freeProfilesPerDay: 12, freeNewChatsPerDay: 5, contactUnlockMessages: 3, chatPhotoDays: 7 },
  SELLER: 'Pardavėjas: Saulius Ramanauskas, individuali veikla, PVM LT100015491519',
  BANK_DESCRIPTOR: 'TKR PASLAUGOS'
};

/* Zodiako suderinamumas – PRAMOGAI, ne mokslas. Sutampa su serverio API (dating-app/server/API.md, src/zodiac.ts): ženklo raktai anglų k., lygiai high/medium/low.
   Taisyklė pagal elementus (simetriška, deterministinė, be išimčių pagal ženklą):
     high   = tas pats elementas, Ugnis+Oras, Žemė+Vanduo      → „Puikiai deratė“
     medium = Ugnis+Žemė, Oras+Vanduo                          → „Gerai deratė“
     low    = Ugnis+Vanduo, Žemė+Oras                          → „Priešybės traukia“
   Lygis → fiksuotas % (rodoma ant kortelių): high 90, medium 65, low 40. Niekada nerodome „nesuderinami“. */
window.TIKRI_CONFIG.ZODIAC = (function () {
  'use strict';
  var V = '\uFE0E'; /* teksto, o ne spalvoto emoji variantas */
  var Z = {
    plusOnlyFilter: true, /* filtras „Tik suderinami ženklai“ (= tik high) – tik Plus plane; ženklas ir % ant kortelių matomi visiems */
    minCompat: 'high',    /* „Tik suderinami ženklai“ palieka tik šį lygį (serveris: zodiac_only=true → high). ≈ 70 % riba */
    NOTE: 'Zodiako suderinamumas – pramogai, ne mokslas.',
    ELEMENTS: { fire: 'Ugnis', earth: 'Žemė', air: 'Oras', water: 'Vanduo' },
    LEVELS: {
      high:   { pct: 90, label: 'Puikiai deratė',    rank: 0 },
      medium: { pct: 65, label: 'Gerai deratė',      rank: 1 },
      low:    { pct: 40, label: 'Priešybės traukia', rank: 2 }
    },
    /* end = paskutinė to ženklo diena (MMDD), tropinės datos; po 12-21 → Ožiaragis */
    SIGNS: [
      { id: 'capricorn',   name: 'Ožiaragis',   sym: '\u2651' + V, el: 'earth', end: 119 },
      { id: 'aquarius',    name: 'Vandenis',    sym: '\u2652' + V, el: 'air',   end: 218 },
      { id: 'pisces',      name: 'Žuvys',       sym: '\u2653' + V, el: 'water', end: 320 },
      { id: 'aries',       name: 'Avinas',      sym: '\u2648' + V, el: 'fire',  end: 419 },
      { id: 'taurus',      name: 'Jautis',      sym: '\u2649' + V, el: 'earth', end: 520 },
      { id: 'gemini',      name: 'Dvyniai',     sym: '\u264A' + V, el: 'air',   end: 620 },
      { id: 'cancer',      name: 'Vėžys',       sym: '\u264B' + V, el: 'water', end: 722 },
      { id: 'leo',         name: 'Liūtas',      sym: '\u264C' + V, el: 'fire',  end: 822 },
      { id: 'virgo',       name: 'Mergelė',     sym: '\u264D' + V, el: 'earth', end: 922 },
      { id: 'libra',       name: 'Svarstyklės', sym: '\u264E' + V, el: 'air',   end: 1022 },
      { id: 'scorpio',     name: 'Skorpionas',  sym: '\u264F' + V, el: 'water', end: 1121 },
      { id: 'sagittarius', name: 'Šaulys',      sym: '\u2650' + V, el: 'fire',  end: 1221 }
    ],
    TEXT: {
      same: { fire: 'Abu Ugnies ženklai – daug energijos ir aistros.', earth: 'Abu Žemės ženklai – stabilumas ir panašus požiūris į gyvenimą.',
        air: 'Abu Oro ženklai – lengvi pokalbiai ir daug idėjų.', water: 'Abu Vandens ženklai – gilus emocinis ryšys ir intuicija.' },
      complementary: { 'air+fire': 'Oras pakursto Ugnį – judrus, įkvepiantis duetas.', 'earth+water': 'Vanduo maitina Žemę – ramus ir jaukus ryšys.' },
      medium: 'Skirtingi elementai – reikės laiko suprasti vienas kitą, bet gali būti įdomu.',
      low: 'Priešingi elementai – daug skirtumų, tačiau kontrastai kartais traukia.'
    },
    byId: function (id) { for (var i = 0; i < Z.SIGNS.length; i++) if (Z.SIGNS[i].id === id) return Z.SIGNS[i]; return null; },
    indexOf: function (id) { for (var i = 0; i < Z.SIGNS.length; i++) if (Z.SIGNS[i].id === id) return i; return -1; },
    /* birth: 'YYYY-MM-DD' (arba 'MM-DD') → ženklo objektas arba null */
    signFor: function (birth) {
      var m = /(?:^|-)(\d{2})-(\d{2})$/.exec(String(birth || '')); if (!m) return null;
      var mo = +m[1], d = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      var md = mo * 100 + d;
      for (var i = 0; i < Z.SIGNS.length; i++) if (md <= Z.SIGNS[i].end) return Z.SIGNS[i];
      return Z.byId('capricorn');
    },
    /* → 'high' | 'medium' | 'low' | null  (zodiac_compat) */
    compat: function (a, b) {
      var A = Z.byId(a), B = Z.byId(b); if (!A || !B) return null;
      if (A.el === B.el) return 'high';
      var k = [A.el, B.el].sort().join('+');
      if (k === 'air+fire' || k === 'earth+water') return 'high';
      if (k === 'fire+water' || k === 'air+earth') return 'low';
      return 'medium'; /* fire+earth, air+water */
    },
    pct: function (level) { return level ? Z.LEVELS[level].pct : null; },
    label: function (level) { return level ? Z.LEVELS[level].label : ''; },
    explain: function (a, b) {
      var lv = Z.compat(a, b), A = Z.byId(a), B = Z.byId(b); if (!lv) return '';
      if (lv === 'high') return A.el === B.el ? Z.TEXT.same[A.el] : Z.TEXT.complementary[[A.el, B.el].sort().join('+')];
      return Z.TEXT[lv];
    },
    /* Plus „išsamus suderinamumas“: ženklai pagal lygį nurodytam ženklui */
    byLevel: function (id, level) { return Z.SIGNS.filter(function (s) { return s.id !== id && Z.compat(id, s.id) === level; }); }
  };
  return Z;
})();

/* ---- v5 (demo): patikra, „šiandien ✓“ (galiu susitikti), saugumas pokalbyje, profilio klausimai, balso demo. Visi duomenys netikri. ----
   Serverio laukai (žr. FEATURES_V5.md): verified, available_until, voice_url, prompts. */
window.TIKRI_CONFIG.V5 = {
  CHECKED_IDS: ['p1', 'p2', 'p3', 'p5', 'p7', 'p9', 'p10', 'p13', 'p14'],     /* demo profiliai su ženkleliu „Patikrinta“ */
  AVAILABLE_IDS: ['p1', 'p3', 'p4', 'p6', 'p9', 'p14', 'p16'],                /* demo profiliai, kurie šiandien gali susitikti */
  VOICE_IDS: ['p1', 'p3', 'p9'],                                              /* demo profiliai su balso prisistatymu */
  DURATIONS: [
    { id: '1h', label: '1 val.', en: '1 h', hours: 1 },
    { id: '3h', label: '3 val.', en: '3 h', hours: 3 },
    { id: 'midnight', label: 'Iki vidurnakčio', en: 'Until midnight', hours: 0 }
  ],
  PROMPT_MAX: 140,
  PROMPT_QUESTIONS: ['Mano idealus savaitgalis…', 'Negaliu gyventi be…', 'Pirmo pasimatymo idėja…', 'Geriausias vakaras – kai…', 'Mano keistas talentas…', 'Ieškau žmogaus, kuris…'],
  DEFAULT_PROMPTS: [
    { q: 'Mano idealus savaitgalis…', a: 'Lėtas rytas, turgus ir ilgas pasivaikščiojimas prie upės.' },
    { q: 'Pirmo pasimatymo idėja…', a: 'Kava su vaizdu ir pokalbis, kurio nenori baigti.' },
    { q: 'Mano keistas talentas…', a: 'Atpažįstu dainą iš pirmų trijų natų.' }
  ],
  /* Anglų kalbos tekstai (LT raktai lieka saugomi; rodomas vertimas). */
  EN: {
    Q: { 'Mano idealus savaitgalis…': 'My ideal weekend…', 'Negaliu gyventi be…': 'I cannot live without…', 'Pirmo pasimatymo idėja…': 'My first-date idea…', 'Geriausias vakaras – kai…': 'The best evening is when…', 'Mano keistas talentas…': 'My weird talent…', 'Ieškau žmogaus, kuris…': 'I am looking for someone who…' },
    DEFAULT_A: ['A slow morning, the market and a long walk by the river.', 'Coffee with a view and a conversation you do not want to end.', 'I can name a song from its first three notes.'],
    OPENERS: {
      'Mano idealus savaitgalis…': 'Your ideal weekend sounds great. What would this coming weekend look like?',
      'Negaliu gyventi be…': 'You wrote what you cannot live without. How did that become part of your everyday life?',
      'Pirmo pasimatymo idėja…': 'I like your first-date idea. When could we try it?',
      'Geriausias vakaras – kai…': 'Your best evening sounds lovely. When did one last happen?',
      'Mano keistas talentas…': 'A weird talent? Prove it – first question is on you.',
      'Ieškau žmogaus, kuris…': 'You wrote who you are looking for. What does that person look like through your eyes?'
    },
    FALLBACK: ['Hi! What is the best thing about your week so far?', 'Hi! What would be your perfect Sunday?', 'Hi! Coffee, tea or something else – and where?']
  },
  /* pirmų žinučių šablonai pagal kito žmogaus klausimą; {a} – trumpas jo/jos atsakymo fragmentas */
  OPENER_TEMPLATES: {
    'Mano idealus savaitgalis…': 'Tavo idealus savaitgalis – „{a}“ – skamba puikiai. Kaip atrodytų artimiausio savaitgalio versija?',
    'Negaliu gyventi be…': 'Parašei, kad negali gyventi be „{a}“. Kaip tai tapo tavo kasdienybės dalimi?',
    'Pirmo pasimatymo idėja…': 'Patiko tavo pirmo pasimatymo idėja: „{a}“. Kada galėtume išbandyti?',
    'Geriausias vakaras – kai…': 'Tavo geriausias vakaras – „{a}“. Kada paskutinį kartą toks nutiko?',
    'Mano keistas talentas…': 'Keistas talentas: „{a}“. Gali įrodyti – pirmas klausimas už tave?',
    'Ieškau žmogaus, kuris…': 'Rašai, kad ieškai žmogaus, kuris „{a}“. Kaip toks žmogus atrodo tavo akimis?'
  },
  /* Balso demo: trys švelnūs tonai (Web Audio, jokio įrašo). Dažniai Hz, trukmė s. */
  VOICE: { notes: [[392, 0.55], [494, 0.55], [587, 0.9]], total: 2.1 },
  /* Nuotraukos (API.md „Photos“): iki 6 (laukiančios + patvirtintos), 10 įkėlimų per valandą. Demo naudoja tą pačią DI nuotrauką su skirtingu iškirpimu. */
  PHOTOS: { MAX: 6, PER_HOUR: 10, PER_DAY: 20, CROPS: ['50% 15%', '15% 30%', '85% 30%', '50% 80%', '25% 65%', '75% 65%'] },
  /* Anti-spam demo ribos (API.md „Anti-spam“): rate_limited + reason like_velocity | first_message_velocity */
  RATE: {
    HOUR_MS: 3600000, DAY_MS: 86400000, NEW_ACCOUNT_MS: 86400000,          /* „naujas paskyra“ = pirmos 24 val. (NEW_ACCOUNT_HOURS) */
    NORMAL: { likesHour: 60, likesDay: 400, firstHour: 15, firstDay: 50 },
    NEW: { likesHour: 15, likesDay: 40, firstHour: 5, firstDay: 15 },
    PLAN_LIKES_DAY: { free: 30, premium: 150, plus: 400 }                  /* planų dienos kvota; Plus – neribota, bet ne daugiau nei 400/d. */
  }
};
