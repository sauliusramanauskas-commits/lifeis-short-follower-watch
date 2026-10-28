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
