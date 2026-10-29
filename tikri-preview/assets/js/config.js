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
      var lv = Z.compat(a, b), A = Z.byId(a), B = Z.byId(b), X = Z.lang() === 'en' ? Z.TEXT_EN : Z.TEXT; if (!lv) return '';
      if (lv === 'high') return A.el === B.el ? X.same[A.el] : X.complementary[[A.el, B.el].sort().join('+')];
      return X[lv];
    },
    /* Plus „išsamus suderinamumas“: ženklai pagal lygį nurodytam ženklui */
    byLevel: function (id, level) { return Z.SIGNS.filter(function (s) { return s.id !== id && Z.compat(id, s.id) === level; }); }
  };
  /* ---- v7: anglų kalba (kopirašerio tekstai). Z.lang() nustatomas iš app.js; getter'iai leidžia visur naudoti sg.name, Z.NOTE, Z.label() ir pan. ---- */
  Z.lang = function () { return 'lt'; };
  function dual(obj, key, en) { var lt = obj[key]; Object.defineProperty(obj, key, { enumerable: true, configurable: true, get: function () { return Z.lang() === 'en' ? en : lt; } }); }
  dual(Z, 'NOTE', 'Just for fun – the stars don\'t decide for you.');
  var EN_EL = { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' };
  Object.keys(EN_EL).forEach(function (k) { dual(Z.ELEMENTS, k, EN_EL[k]); });
  var EN_LV = { high: 'A perfect match', medium: 'A good match', low: 'Opposites attract' };
  Object.keys(EN_LV).forEach(function (k) { dual(Z.LEVELS[k], 'label', EN_LV[k]); });
  var EN_SIGN = { capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces', aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius' };
  Z.SIGNS.forEach(function (sg) { dual(sg, 'name', EN_SIGN[sg.id]); });
  Z.TEXT_EN = {
    same: { fire: 'Two Fire signs – lots of energy and passion.', earth: 'Two Earth signs – stability and a similar outlook on life.', air: 'Two Air signs – easy conversation and plenty of ideas.', water: 'Two Water signs – a deep emotional bond and intuition.' },
    complementary: { 'air+fire': 'Air fuels Fire – a lively, inspiring duo.', 'earth+water': 'Water nourishes Earth – a calm, cosy connection.' },
    medium: 'Different elements – it takes time to understand each other, but it can be interesting.',
    low: 'Opposite elements – lots of differences, yet contrasts sometimes attract.'
  };
  Z.MUTUAL_EN = 'It\'s mutual! And the stars are on your side ✨';
  Z.PLUS_FILTER_EN = 'Matching signs only – with Plus';
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

/* ---- v7: anglų kalba likusiems ekranams. LT tekstai lieka data.js (jos nekeičiame); čia – EN atitikmenys, rodomi kai S.user.language = 'en'. ---- */
(function () {
  'use strict';
  var C = window.TIKRI_CONFIG;
  C.lang = function () { return 'lt'; };                                     /* app.js perrašo į tikrąją kalbą */
  function dual(obj, key, en) { var lt = obj[key]; Object.defineProperty(obj, key, { enumerable: true, configurable: true, get: function () { return C.lang() === 'en' ? en : lt; } }); }
  /* planų pavadinimai, PVM pastaba, pardavėjas – kainos nesikeičia, keičiasi tik žodžiai ir skaičių formatas (app.js fmt) */
  dual(C.PLANS.free, 'name', 'Free');
  dual(C, 'VAT_NOTE', 'incl. VAT');
  dual(C, 'SELLER', 'Seller: Saulius Ramanauskas, sole proprietor, VAT LT100015491519');
  C.ZODIAC.lang = function () { return C.lang(); };
  C.V7 = { EN: {
    INTERESTS: { 'Kava': 'Coffee', 'Žygiai': 'Hiking', 'Kinas': 'Cinema', 'Muzika': 'Music', 'Kelionės': 'Travel', 'Gaminimas': 'Cooking', 'Knygos': 'Books', 'Sportas': 'Sport',
      'Joga': 'Yoga', 'Fotografija': 'Photography', 'Menas': 'Art', 'Gamta': 'Nature', 'Šokiai': 'Dancing', 'Stalo žaidimai': 'Board games', 'Dviračiai': 'Cycling', 'Teatras': 'Theatre',
      'Gyvūnai': 'Animals', 'Technologijos': 'Technology', 'Sodininkystė': 'Gardening', 'Koncertai': 'Concerts' },
    GOAL: { 'draugystė': { pill: 'Friendship', looks: 'Looking for friendship', filter: 'Friendship' }, 'pažintys': { pill: 'Dating', looks: 'Looking to date', filter: 'Dating' },
      'santykiai': { pill: 'Relationship', looks: 'Looking for a relationship', filter: 'Relationship' } },
    PROFILES: {
      p1: { job: 'Educator', bio: "Mornings – coffee and a book by the window, evenings – yoga. I work with people, so I value quiet minutes. Looking for someone with whom it is fun both to laugh and to be silent.",
        a: ["A slow morning, the market, a long walk in Vingis Park and a dinner we cook together.", "Well-brewed coffee and at least one unread book on the nightstand."] },
      p2: { job: 'Urban planner', bio: "Weekends – the Curonian Spit or the forests of Dzūkija with a camera. By day I plan city spaces, in my free time I run from the city noise.",
        a: ["I wake up early, catch the sunrise by the sea, and in the evening – hot soup and a good conversation.", "A short hike with a thermos of tea. If we don't click – at least the forest is beautiful."] },
      p3: { job: 'Music producer', bio: "I play the ukulele (badly, but with love). I always know where the best concert of the evening is and I'm never late for the first song.",
        a: ["A small club, live music, friends nearby and nobody looking at their phones.", "I can name a song from its first three notes. Try me."] },
      p4: { job: 'Software developer', bio: "I code by day and bake bread by night. I own too many board games and too few shelves. Happy to teach you any game in 10 minutes.",
        a: ["Fresh bread, a movie marathon and a board-game night with friends.", "is not afraid to lose and can laugh at themselves too."] },
      p5: { job: 'Veterinarian', bio: "I have a dog called Bruknė and a balcony full of tomatoes. Looking for a serious relationship with someone for whom home is an important place, not just an address.",
        a: ["Bruknė's wagging tail and the first tomato of summer.", "The vegetable garden, the dog park and long lunches on the balcony."] },
      p6: { job: 'Physiotherapist', bio: "I've cycled around Lithuania – twice already. A third time – maybe together? In the evenings I listen to podcasts about travel stories.",
        a: ["An easy 20 km ride along the coast and ice cream at the end.", "I fix a bike without instructions in 7 minutes."] },
      p7: { job: 'Lawyer', bio: "I love theatre, long conversations and a good espresso. I can't stand lateness without a message, but I quickly forgive a good joke.",
        a: ["After the play we argue about the ending over a glass of wine.", "reads more than the headlines and has opinions, yet knows how to listen."] },
      p8: { job: 'Chef', bio: "I feel at home in the kitchen. Saturdays – the market, Sundays – long lunches with friends. Next summer – Georgia.",
        a: ["The market in the morning, three courses in the evening and someone to cook them for.", "Knives I sharpen myself and fresh spices."] },
      p9: { job: 'Gallery curator', bio: "I shoot on film and collect postcards from all my travels. I work in a gallery, so I know where the prettiest courtyards in Vilnius are hiding.",
        a: ["An exhibition, a roll of film and a latte in a courtyard you won't find on the map.", "I can tell which season a photo was taken in – from the light alone."] },
      p10: { job: 'Sound engineer', bio: "Vinyl, synthesizers and the occasional karaoke. Looking for someone with good taste in music, but not a snob – I like bad songs too, if they're fun.",
        a: ["I put on an old record and nobody wants to talk until the last track.", "A record shop, and each of us picks one album for the other."] },
      p11: { job: 'Dance coach', bio: "I dance salsa on Wednesdays. I'll teach you if you're not afraid of stepping on my toes. By day – training and a children's dance studio, evenings – peace and quiet.",
        a: ["A morning workout, brunch with friends and salsa in the evening.", "I can fall asleep anywhere, but I never miss the beat."] },
      p12: { job: 'Architect', bio: "I have a cat who thinks he is the boss here. I like quiet evenings, long walks and people who aren't afraid of silence.",
        a: ["A morning walk and the evening purr of the cat.", "enjoys calm, but isn't afraid of spontaneous trips either."] },
      p13: { job: 'Publishing editor', bio: "Book club organiser. If you've read something good – message me. If not yet – I'll suggest three you won't be able to put down.",
        a: ["A bookshop, a cosy corner in a café and a chat about what we are reading now.", "Swap books and meet again once we've read them."] },
      p14: { job: 'Product manager', bio: "Looking for a team for pub quizzes and someone for movie nights. I laugh well and lose even better at board games (it only looks that way).",
        a: ["A board-game café, someone shouts \"I told you so!\" and everyone laughs.", "I remember the rules of every game, but not where my keys are."] },
      p15: { job: 'Travel designer', bio: "I've visited 34 countries. Now I want a home that smells of cinnamon and where someone is waiting for me. I work at a company that creates journeys.",
        a: ["The sea, a sunrise, a long breakfast table and not a single plan.", "A passport that still has empty pages."] },
      p16: { job: 'Illustrator', bio: "Illustrator and game developer. I speak LT, EN and everyday drawings. Happy to share a corner of my workshop with someone curious.",
        a: ["enjoys creating, isn't afraid of failed attempts and admits they can't draw.", "Every table covered in paper, quiet music playing and the coffee gone cold."] }
    },
    MSG: {
      'Labas! Matau, kad tau irgi patinka koncertai.': "Hi! I see you like concerts too.",
      'Labas, Gabija! Taip, ypač maži, jaukūs klubai.': "Hi, Gabija! Yes, especially small, cosy clubs.",
      'Šį penktadienį vyksta akustinis vakaras senamiestyje. Gal žinai?': "There is an acoustic night in the Old Town this Friday. Did you know?",
      'Tavo nuotraukos iš Dzūkijos – nuostabios!': "Your photos from Dzūkija are wonderful!",
      'Ačiū! Ten rudenį ypač gražu. Ar esi buvęs(-usi) Marcinkonyse?': "Thanks! It's especially beautiful there in autumn. Have you been to Marcinkonys?",
      'Dar ne, bet noriu. Gal turi maršrutą?': "Not yet, but I'd like to. Do you have a route?",
      'Sveikas! Juostiniai fotoaparatai – tavo tema?': "Hello! Film cameras – your thing?",
      'Mano darbus rasi čia: www.egle-foto.lt arba parašyk +370 600 12345': "You can find my work here: www.egle-foto.lt or message me on +370 600 12345",
      'Štai vaizdas iš paskutinės kelionės po Dzūkiją.': "Here's a view from my latest trip around Dzūkija.",
      'Smagu, kad parašei!': "Nice that you wrote!",
      'Oho, įdomu. Papasakok daugiau!': "Oh, interesting. Tell me more!",
      'Gera mintis. O tu?': "Good idea. And you?",
      'Haha, sutinku 100 %.': "Haha, I agree 100%."
    },
    OPENERS: {
      'Kava': "Hi! I see we both love coffee. What is your favourite café in the city?",
      'Žygiai': "Hello! We both love hiking – which route in Lithuania is the most beautiful to you?",
      'Kinas': "Hi! Which film would you recommend lately if I only had one evening?",
      'Muzika': "Hi! What is on your headphones most often these days?",
      'Kelionės': "Hello! I see you like to travel – which trip stayed with you the most?",
      'Gaminimas': "Hi! What do you cook when you want to surprise someone?",
      'Knygos': "Hi! What book are you reading now? I am looking for a new recommendation.",
      'Sportas': "Hello! Which sport gets you going the most?",
      'Joga': "Hi! Yoga in the morning or in the evening – which team are you on?",
      'Fotografija': "Hi! What do you love photographing most – people, nature or the city?",
      'Menas': "Hello! What was the last exhibition you really enjoyed?",
      'Gamta': "Hi! Where in Lithuania do you go when you want to be in nature?",
      'Šokiai': "Hi! What kind of dancing do you do? I am still learning.",
      'Stalo žaidimai': "Hello! What is your favourite board game? I am looking for a new one.",
      'Dviračiai': "Hi! What is the most beautiful cycling route you have tried?",
      'Teatras': "Hello! Which play have you seen recently?",
      'Gyvūnai': "Hi! Do you have a pet? I would love to hear its name.",
      'Technologijos': "Hi! Which app or tool has made your life easier lately?",
      'Sodininkystė': "Hello! What did you grow this year? My tomatoes turned out pretty bad.",
      'Koncertai': "Hi! What is the best concert you have been to?",
      '_': "Hi! Your profile looks really interesting – what are you into right now?"
    }
  } };
})();
