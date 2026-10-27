/* Tikri – PERŽIŪRA. Visi duomenys netikri, sugalvoti demonstracijai. */
window.TIKRI_DATA = (function () {
  'use strict';
  var INTERESTS = ['Kava', 'Žygiai', 'Kinas', 'Muzika', 'Kelionės', 'Gaminimas', 'Knygos', 'Sportas',
    'Joga', 'Fotografija', 'Menas', 'Gamta', 'Šokiai', 'Stalo žaidimai', 'Dviračiai', 'Teatras',
    'Gyvūnai', 'Technologijos', 'Sodininkystė', 'Koncertai'];

  // dist: tik demonstracinis skaičius filtrui; rodoma TIK juosta (distLabel): <1 km, 1–2 km, 2–5 km, 5–10 km, 10+ km.
  var P = [
    ['p1', 'Austėja', 27, 'moteris', 1, '1–2 km', true, true, 'santykiai', ['Kava', 'Knygos', 'Joga', 'Kelionės'], 'Rytais – kava ir knyga, vakarais – joga. Ieškau žmogaus, su kuriuo smagu ir tylėti.', ['#F6A38E', '#E2725B']],
    ['p2', 'Mantas', 31, 'vyras', 2, '1–2 km', true, false, 'santykiai', ['Žygiai', 'Fotografija', 'Gamta', 'Kava'], 'Savaitgaliais – Kuršių nerija arba Dzūkijos miškai su fotoaparatu.', ['#8FB9A8', '#4F7F6E']],
    ['p3', 'Gabija', 25, 'moteris', 0.6, '<1 km', true, true, 'pažintys', ['Muzika', 'Koncertai', 'Šokiai', 'Menas'], 'Groju ukulele (prastai, bet su meile). Visada žinau, kur geriausias vakaro koncertas.', ['#F7C59F', '#E08E45']],
    ['p4', 'Lukas', 29, 'vyras', 4, '2–5 km', true, true, 'draugystė', ['Stalo žaidimai', 'Technologijos', 'Kinas', 'Gaminimas'], 'Programuoju dieną, kepu duoną naktį. Turiu per daug stalo žaidimų.', ['#A3B4F2', '#5B6CC4']],
    ['p5', 'Ieva', 33, 'moteris', 3, '2–5 km', true, false, 'santykiai', ['Sodininkystė', 'Gyvūnai', 'Gaminimas', 'Gamta'], 'Turiu šunį Bruknę ir balkoną, pilną pomidorų. Ieškau rimtų santykių.', ['#C9A7E8', '#8B5FBF']],
    ['p6', 'Dovydas', 26, 'vyras', 5, '2–5 km', false, true, 'pažintys', ['Sportas', 'Dviračiai', 'Kelionės', 'Muzika'], 'Dviračiu aplink Lietuvą – jau du kartus. Trečią kartą – gal kartu?', ['#9AD0EC', '#3E8FBF']],
    ['p7', 'Rūta', 30, 'moteris', 2, '1–2 km', true, false, 'santykiai', ['Teatras', 'Knygos', 'Kinas', 'Kava'], 'Mėgstu teatrą, ilgus pokalbius ir gerą espresso. Netoleruoju vėlavimo be žinutės.', ['#F2A7B8', '#C4546E']],
    ['p8', 'Jonas', 35, 'vyras', 8, '5–10 km', true, false, 'santykiai', ['Gaminimas', 'Kelionės', 'Gamta', 'Knygos'], 'Virtuvėje jaučiuosi kaip namie. Kitą vasarą – Gruzija.', ['#E8C48A', '#B0843A']],
    ['p9', 'Eglė', 28, 'moteris', 4, '2–5 km', true, true, 'draugystė', ['Fotografija', 'Menas', 'Kelionės', 'Kava'], 'Fotografuoju juostiniu fotoaparatu ir kolekcionuoju atvirukus.', ['#B5E0C8', '#5FA382']],
    ['p10', 'Tomas', 32, 'vyras', 0.8, '<1 km', true, false, 'santykiai', ['Muzika', 'Koncertai', 'Kinas', 'Technologijos'], 'Vinilai, sintezatoriai ir kartais karaoke. Ieškau žmogaus su gera muzikos skoniu.', ['#F4B183', '#D9683A']],
    ['p11', 'Kotryna', 24, 'moteris', 14, '10+ km', false, false, 'pažintys', ['Šokiai', 'Sportas', 'Joga', 'Muzika'], 'Šoku salsą trečiadieniais. Mokysiu, jei nebijai užminti ant kojos.', ['#F7A8D0', '#C2508E']],
    ['p12', 'Paulius', 37, 'vyras', 3, '2–5 km', true, false, 'santykiai', ['Gyvūnai', 'Žygiai', 'Gamta', 'Dviračiai'], 'Turiu katiną, kuris mano, kad jis čia šeimininkas. Mėgstu ramius vakarus.', ['#A8D5BA', '#4C8C66']],
    ['p13', 'Miglė', 29, 'moteris', 5, '2–5 km', true, true, 'santykiai', ['Knygos', 'Teatras', 'Menas', 'Sodininkystė'], 'Knygų klubo organizatorė. Jei perskaitei ką nors gero – parašyk.', ['#D7B8F3', '#9364C9']],
    ['p14', 'Karolis', 27, 'vyras', 2, '1–2 km', true, true, 'pažintys', ['Stalo žaidimai', 'Kava', 'Kinas', 'Žygiai'], 'Ieškau komandos protmūšiams ir žmogaus filmų vakarams.', ['#9FC7F5', '#4A7CC9']],
    ['p15', 'Aistė', 34, 'moteris', 8, '5–10 km', true, false, 'santykiai', ['Kelionės', 'Joga', 'Gaminimas', 'Fotografija'], 'Aplankiau 34 šalis. Dabar noriu namų, kuriuose kvepia cinamonu.', ['#F9C784', '#E0893A']],
    ['p16', 'Ari', 26, 'kita', 3, '2–5 km', true, true, 'draugystė', ['Menas', 'Technologijos', 'Muzika', 'Gyvūnai'], 'Iliustruotoja/-as ir žaidimų kūrėja/-as. Kalbu LT, EN ir emoji.', ['#B8E1E0', '#4E9E9B']]
  ];
  var profiles = P.map(function (r) {
    return { id: r[0], name: r[1], age: r[2], gender: r[3], dist: r[4], distLabel: r[5], verified: r[6],
      online: r[7], goal: r[8], interests: r[9], bio: r[10], colors: r[11] };
  });

  var now = Date.now();
  var chats = [
    { id: 'p3', unread: true, messages: [
      { from: 'them', text: 'Labas! Matau, kad tau irgi patinka koncertai 🎶', t: now - 1000 * 60 * 42 },
      { from: 'me', text: 'Labas, Gabija! Taip, ypač maži, jaukūs klubai.', t: now - 1000 * 60 * 38 },
      { from: 'them', text: 'Šį penktadienį vyksta akustinis vakaras senamiestyje. Gal žinai?', t: now - 1000 * 60 * 12 }
    ] },
    { id: 'p2', unread: false, messages: [
      { from: 'me', text: 'Tavo nuotraukos iš Dzūkijos – nuostabios!', t: now - 1000 * 60 * 60 * 5 },
      { from: 'them', text: 'Ačiū! Ten rudenį ypač gražu. Ar esi buvęs(-usi) Marcinkonyse?', t: now - 1000 * 60 * 60 * 4 }
    ] },
    { id: 'p9', unread: false, messages: [
      { from: 'them', text: 'Sveikas! Juostiniai fotoaparatai – tavo tema?', t: now - 1000 * 60 * 60 * 26 },
      { from: 'them', text: 'Mano darbus rasi čia: www.egle-foto.lt arba parašyk +370 600 12345', t: now - 1000 * 60 * 60 * 25 }
    ] },
    { id: 'p14', unread: false, messages: [] }
  ];

  var openers = {
    'Kava': ['Labas! Matau, kad abu mėgstame kavą ☕ Kokia tavo mėgstamiausia kavinė mieste?'],
    'Žygiai': ['Sveiki! Abu mėgstame žygius – koks maršrutas Lietuvoje tau gražiausias?'],
    'Kinas': ['Labas! Kokį filmą pastaruoju metu rekomenduotum, jei turėčiau tik vieną vakarą?'],
    'Muzika': ['Labas! Kas dabar dažniausiai skamba tavo ausinėse? 🎧'],
    'Kelionės': ['Sveiki! Matau, kad mėgsti keliauti – kuri kelionė labiausiai įsiminė?'],
    'Gaminimas': ['Labas! Kokį patiekalą gamini, kai nori ką nors nustebinti?'],
    'Knygos': ['Labas! Kokią knygą skaitai dabar? Ieškau naujos rekomendacijos 📚'],
    'Sportas': ['Sveiki! Koks sportas tave labiausiai užveda?'],
    'Joga': ['Labas! Joga ryte ar vakare – kuri tavo komanda? 🧘'],
    'Fotografija': ['Labas! Ką mėgsti fotografuoti labiausiai – žmones, gamtą ar miestą?'],
    'Menas': ['Sveiki! Kokia paskutinė paroda, kuri tau tikrai patiko?'],
    'Gamta': ['Labas! Kur Lietuvoje eini, kai nori pabūti gamtoje?'],
    'Šokiai': ['Labas! Kokius šokius šoki? Aš dar tik mokausi 💃'],
    'Stalo žaidimai': ['Sveiki! Koks tavo mėgstamiausias stalo žaidimas? Ieškau naujo 🎲'],
    'Dviračiai': ['Labas! Koks gražiausias dviračių maršrutas, kurį esi išbandęs(-iusi)?'],
    'Teatras': ['Sveiki! Kokį spektaklį pastaruoju metu matei?'],
    'Gyvūnai': ['Labas! Ar turi augintinį? Labai noriu išgirsti jo vardą 🐾'],
    'Technologijos': ['Labas! Kokia programėlė ar įrankis tau pastaruoju metu palengvino gyvenimą?'],
    'Sodininkystė': ['Sveiki! Ką šiemet užsiauginai? Mano pomidorai – visai nekokie 🍅'],
    'Koncertai': ['Labas! Koks geriausias koncertas, kuriame esi buvęs(-usi)?'],
    '_': ['Labas! Tavo profilis pasirodė labai įdomus – kuo dabar gyveni?']
  };

  var replies = ['Smagu, kad parašei! 😊', 'Oho, įdomu. Papasakok daugiau!', 'Gera mintis. O tu?', 'Haha, sutinku 100 %.'];

  return { INTERESTS: INTERESTS, profiles: profiles, chats: chats, openers: openers, replies: replies };
})();
