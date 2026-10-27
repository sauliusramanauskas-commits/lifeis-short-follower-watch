/* Tikri – PERŽIŪRA. Visi duomenys netikri, sugalvoti demonstracijai. Nuotraukos – DI sugeneruoti išgalvoti suaugę žmonės (ne realūs asmenys). */
window.TIKRI_DATA = (function () {
  'use strict';
  var INTERESTS = ['Kava', 'Žygiai', 'Kinas', 'Muzika', 'Kelionės', 'Gaminimas', 'Knygos', 'Sportas',
    'Joga', 'Fotografija', 'Menas', 'Gamta', 'Šokiai', 'Stalo žaidimai', 'Dviračiai', 'Teatras',
    'Gyvūnai', 'Technologijos', 'Sodininkystė', 'Koncertai'];

  // dist: tik demonstracinis skaičius filtrui; rodoma TIKRI juosta (distLabel): <1 km, 1–2 km, 2–5 km, 5–10 km, 10+ km.
  // r: [id, vardas, amžius, lytis, dist, juosta, patvirtintas, neseniai aktyvus, tikslas, interesai, bio, nuotraukos, profesija, patinka man(demo), raginimai]
  var P = [
    ['p1', 'Austėja', 29, 'moteris', 1, '1–2 km', true, true, 'santykiai', ['Kava', 'Knygos', 'Joga', 'Kelionės'],
      'Rytais – kava ir knyga prie lango, vakarais – joga. Dirbu su žmonėmis, todėl vertinu tylias minutes. Ieškau žmogaus, su kuriuo smagu ir juoktis, ir tylėti.',
      ['p1', 'p1b', 'p1c'], 'Edukologė', true,
      [['Mano idealus savaitgalis…', 'Lėtas rytas, turgus, ilgas pasivaikščiojimas Vingio parke ir vakarienė, kurią gaminame kartu.'], ['Negaliu gyventi be…', 'Gerai išvirtos kavos ir bent vienos neperskaitytos knygos ant naktinio stalelio.']]],
    ['p2', 'Mantas', 33, 'vyras', 2, '1–2 km', true, false, 'santykiai', ['Žygiai', 'Fotografija', 'Gamta', 'Kava'],
      'Savaitgaliais – Kuršių nerija arba Dzūkijos miškai su fotoaparatu. Dieną planuoju miesto erdves, o laisvalaikiu bėgu nuo miesto triukšmo.',
      ['p2', 'p2b', 'p2c'], 'Urbanistas', false,
      [['Mano idealus savaitgalis…', 'Pabundu anksti, spėju pamatyti saulėtekį prie jūros, o vakare – karšta sriuba ir geras pokalbis.'], ['Pirmo pasimatymo idėja…', 'Trumpas žygis su termosu arbatos. Jei nesusikalbėsim – bent miškas gražus.']]],
    ['p3', 'Gabija', 28, 'moteris', 0.6, '<1 km', true, true, 'pažintys', ['Muzika', 'Koncertai', 'Šokiai', 'Menas'],
      'Groju ukulele (prastai, bet su meile). Visada žinau, kur geriausias vakaro koncertas, ir niekada nevėluoju į pirmą dainą.',
      ['p3'], 'Muzikos prodiuserė', true,
      [['Geriausias vakaras – kai…', 'Mažas klubas, gyva muzika, draugai šalia ir niekas nežiūri į telefonus.'], ['Mano keistas talentas…', 'Atpažįstu dainą iš pirmų trijų natų. Išbandyk mane.']]],
    ['p4', 'Lukas', 31, 'vyras', 4, '2–5 km', true, true, 'draugystė', ['Stalo žaidimai', 'Technologijos', 'Kinas', 'Gaminimas'],
      'Programuoju dieną, kepu duoną naktį. Turiu per daug stalo žaidimų ir per mažai lentynų. Mielai išmokysiu bet kurį žaidimą per 10 minučių.',
      ['p4'], 'Programuotojas', false,
      [['Mano idealus savaitgalis…', 'Šviežia duona, filmų maratonas ir stalo žaidimų vakaras su draugais.'], ['Ieškau žmogaus, kuris…', 'nebijo pralaimėti ir dar moka juoktis iš savęs.']]],
    ['p5', 'Ieva', 35, 'moteris', 3, '2–5 km', true, false, 'santykiai', ['Sodininkystė', 'Gyvūnai', 'Gaminimas', 'Gamta'],
      'Turiu šunį Bruknę ir balkoną, pilną pomidorų. Ieškau rimtų santykių su žmogumi, kuriam namai yra svarbi vieta, ne tik adresas.',
      ['p5'], 'Veterinarijos gydytoja', false,
      [['Negaliu gyventi be…', 'Bruknės uodegos vizgesio ir pirmo vasaros pomidoro.'], ['Mano idealus savaitgalis…', 'Daržas, šunų parkas ir ilgi pietūs ant balkono.']]],
    ['p6', 'Dovydas', 29, 'vyras', 5, '2–5 km', false, true, 'pažintys', ['Sportas', 'Dviračiai', 'Kelionės', 'Muzika'],
      'Dviračiu aplink Lietuvą – jau du kartus. Trečią kartą – gal kartu? Vakarais klausausi podcastų apie kelionės istorijas.',
      ['p6'], 'Fizioterapeutas', true,
      [['Pirmo pasimatymo idėja…', 'Lengva 20 km pavažiavimas pajūriu ir ledai pabaigoje.'], ['Mano keistas talentas…', 'Pataisau dviratį be instrukcijų per 7 minutes.']]],
    ['p7', 'Rūta', 32, 'moteris', 2, '1–2 km', true, false, 'santykiai', ['Teatras', 'Knygos', 'Kinas', 'Kava'],
      'Mėgstu teatrą, ilgus pokalbius ir gerą espresso. Netoleruoju vėlavimo be žinutės, bet greitai atleidžiu už gerą anekdotą.',
      ['p7'], 'Teisininkė', false,
      [['Geriausias vakaras – kai…', 'Po spektaklio ilgai ginčijamės dėl pabaigos prie vyno taurės.'], ['Ieškau žmogaus, kuris…', 'skaito ne tik antraštes ir turi nuomonę, bet moka ir išklausyti.']]],
    ['p8', 'Jonas', 41, 'vyras', 8, '5–10 km', true, false, 'santykiai', ['Gaminimas', 'Kelionės', 'Gamta', 'Knygos'],
      'Virtuvėje jaučiuosi kaip namie. Šeštadieniais – turgus, sekmadieniais – ilgi pietūs su draugais. Kitą vasarą – Gruzija.',
      ['p8'], 'Šefas', false,
      [['Mano idealus savaitgalis…', 'Turgus ryte, trys patiekalai vakare ir kažkas, kam galiu juos paruošti.'], ['Negaliu gyventi be…', 'Peilių, kuriuos pats galandu, ir šviežių prieskonių.']]],
    ['p9', 'Eglė', 30, 'moteris', 4, '2–5 km', true, true, 'draugystė', ['Fotografija', 'Menas', 'Kelionės', 'Kava'],
      'Fotografuoju juostiniu fotoaparatu ir kolekcionuoju atvirukus iš visų kelionių. Dirbu galerijoje, todėl žinau, kur Vilniuje slepiasi gražiausi kiemeliai.',
      ['p9', 'p9b', 'p9c'], 'Galerijos kuratorė', true,
      [['Mano idealus savaitgalis…', 'Paroda, filmuko ritinėlis ir latte kiemelyje, kurio nerasi žemėlapyje.'], ['Mano keistas talentas…', 'Pasakau, kuriuo metų laiku padaryta nuotrauka – vien iš šviesos.']]],
    ['p10', 'Tomas', 34, 'vyras', 0.8, '<1 km', true, false, 'santykiai', ['Muzika', 'Koncertai', 'Kinas', 'Technologijos'],
      'Vinilai, sintezatoriai ir kartais karaoke. Ieškau žmogaus su geru muzikos skoniu, bet ne snobo – mėgstu ir blogas dainas, jei jos smagios.',
      ['p10'], 'Garso inžinierius', false,
      [['Geriausias vakaras – kai…', 'Pasuku seną plokštelę ir niekas nenori kalbėti iki paskutinio takelio.'], ['Pirmo pasimatymo idėja…', 'Plokštelių parduotuvė ir kiekvienas parenka vieną albumą kitam.']]],
    ['p11', 'Kotryna', 28, 'moteris', 14, '10+ km', false, false, 'pažintys', ['Šokiai', 'Sportas', 'Joga', 'Muzika'],
      'Šoku salsą trečiadieniais. Mokysiu, jei nebijai užminti ant kojos. Dienomis – treniruotės ir vaikų šokių studija, vakarais – ramybė.',
      ['p11'], 'Šokių trenerė', true,
      [['Mano idealus savaitgalis…', 'Rytinė treniruotė, brunch su draugais ir vakare – salsa.'], ['Mano keistas talentas…', 'Galiu užmigti bet kur, bet niekada nepraleidžiu ritmo.']]],
    ['p12', 'Paulius', 41, 'vyras', 3, '2–5 km', true, false, 'santykiai', ['Gyvūnai', 'Žygiai', 'Gamta', 'Dviračiai'],
      'Turiu katiną, kuris mano, kad jis čia šeimininkas. Mėgstu ramius vakarus, ilgus pasivaikščiojimus ir žmones, kurie nebijo tylos.',
      ['p12', 'p12b'], 'Architektas', false,
      [['Negaliu gyventi be…', 'Rytinio pasivaikščiojimo ir vakarinio katino murkimo.'], ['Ieškau žmogaus, kuris…', 'mėgsta ramybę, bet nebijo ir spontaniškų išvykų.']]],
    ['p13', 'Miglė', 31, 'moteris', 5, '2–5 km', true, true, 'santykiai', ['Knygos', 'Teatras', 'Menas', 'Sodininkystė'],
      'Knygų klubo organizatorė. Jei perskaitei ką nors gero – parašyk. Jei dar nieko – pasiūlysiu tris, nuo kurių neatsitrauksi.',
      ['p13'], 'Leidyklos redaktorė', true,
      [['Mano idealus savaitgalis…', 'Knygynas, jaukus kampas kavinėje ir pokalbis apie tai, ką dabar skaitome.'], ['Pirmo pasimatymo idėja…', 'Pasikeisti knygomis ir susitikti vėl, kai perskaitysime.']]],
    ['p14', 'Karolis', 28, 'vyras', 2, '1–2 km', true, true, 'pažintys', ['Stalo žaidimai', 'Kava', 'Kinas', 'Žygiai'],
      'Ieškau komandos protmūšiams ir žmogaus filmų vakarams. Gerai juokiuosi ir dar geriau pralaimiu stalo žaidimuose (tai tik atrodo).',
      ['p14'], 'Produktų vadovas', true,
      [['Geriausias vakaras – kai…', 'Žaidimų kavinė, kažkas šaukia „aš sakiau!“, ir visi juokiasi.'], ['Mano keistas talentas…', 'Prisimenu kiekvieno žaidimo taisykles, bet ne savo raktų vietą.']]],
    ['p15', 'Aistė', 39, 'moteris', 8, '5–10 km', true, false, 'santykiai', ['Kelionės', 'Joga', 'Gaminimas', 'Fotografija'],
      'Aplankiau 34 šalis. Dabar noriu namų, kuriuose kvepia cinamonu ir kuriuose kas nors manęs laukia. Dirbu keliones kuriančioje įmonėje.',
      ['p15'], 'Kelionių dizainerė', false,
      [['Mano idealus savaitgalis…', 'Jūra, saulėtekis, ilgas pusryčių stalas ir nė vieno plano.'], ['Negaliu gyventi be…', 'Paso, kuris dar turi laisvų puslapių.']]],
    ['p16', 'Ari', 29, 'kita', 3, '2–5 km', true, true, 'draugystė', ['Menas', 'Technologijos', 'Muzika', 'Gyvūnai'],
      'Iliustruotoja/-as ir žaidimų kūrėja/-as. Kalbu LT, EN ir kasdienybės piešiniais. Mielai dalinsiuosi dirbtuvių kampeliu su kuo nors smalsiu.',
      ['p16'], 'Iliustruotojas/-a', false,
      [['Ieškau žmogaus, kuris…', 'mėgsta kurti, nebijo nesėkmingų bandymų ir pripažįsta, kad nemoka piešti.'], ['Geriausias vakaras – kai…', 'Visi stalai užversti popieriais, groja tyli muzika, o kava atšalo.']]]
  ];
  var profiles = P.map(function (r) {
    return { id: r[0], name: r[1], age: r[2], gender: r[3], dist: r[4], distLabel: r[5], verified: r[6],
      online: r[7], goal: r[8], interests: r[9], bio: r[10], photos: r[11], job: r[12], likesMe: r[13], prompts: r[14] };
  });

  var now = Date.now();
  var chats = [
    { id: 'p3', unread: true, messages: [
      { from: 'them', text: 'Labas! Matau, kad tau irgi patinka koncertai.', t: now - 1000 * 60 * 42 },
      { from: 'me', text: 'Labas, Gabija! Taip, ypač maži, jaukūs klubai.', t: now - 1000 * 60 * 38 },
      { from: 'them', text: 'Šį penktadienį vyksta akustinis vakaras senamiestyje. Gal žinai?', t: now - 1000 * 60 * 12 }
    ] },
    { id: 'p2', unread: false, messages: [
      { from: 'me', text: 'Tavo nuotraukos iš Dzūkijos – nuostabios!', t: now - 1000 * 60 * 60 * 5 },
      { from: 'them', text: 'Ačiū! Ten rudenį ypač gražu. Ar esi buvęs(-usi) Marcinkonyse?', t: now - 1000 * 60 * 60 * 4 },
      { from: 'me', text: 'Dar ne, bet noriu. Gal turi maršrutą?', t: now - 1000 * 60 * 60 * 3 }
    ] },
    { id: 'p9', unread: false, messages: [
      { from: 'them', text: 'Sveikas! Juostiniai fotoaparatai – tavo tema?', t: now - 1000 * 60 * 60 * 26 },
      { from: 'them', text: 'Mano darbus rasi čia: www.egle-foto.lt arba parašyk +370 600 12345', t: now - 1000 * 60 * 60 * 25 }
    ] },
    { id: 'p14', unread: false, messages: [] }
  ];

  var openers = {
    'Kava': ['Labas! Matau, kad abu mėgstame kavą. Kokia tavo mėgstamiausia kavinė mieste?'],
    'Žygiai': ['Sveiki! Abu mėgstame žygius – koks maršrutas Lietuvoje tau gražiausias?'],
    'Kinas': ['Labas! Kokį filmą pastaruoju metu rekomenduotum, jei turėčiau tik vieną vakarą?'],
    'Muzika': ['Labas! Kas dabar dažniausiai skamba tavo ausinėse?'],
    'Kelionės': ['Sveiki! Matau, kad mėgsti keliauti – kuri kelionė labiausiai įsiminė?'],
    'Gaminimas': ['Labas! Kokį patiekalą gamini, kai nori ką nors nustebinti?'],
    'Knygos': ['Labas! Kokią knygą skaitai dabar? Ieškau naujos rekomendacijos.'],
    'Sportas': ['Sveiki! Koks sportas tave labiausiai užveda?'],
    'Joga': ['Labas! Joga ryte ar vakare – kuri tavo komanda?'],
    'Fotografija': ['Labas! Ką mėgsti fotografuoti labiausiai – žmones, gamtą ar miestą?'],
    'Menas': ['Sveiki! Kokia paskutinė paroda, kuri tau tikrai patiko?'],
    'Gamta': ['Labas! Kur Lietuvoje eini, kai nori pabūti gamtoje?'],
    'Šokiai': ['Labas! Kokius šokius šoki? Aš dar tik mokausi.'],
    'Stalo žaidimai': ['Sveiki! Koks tavo mėgstamiausias stalo žaidimas? Ieškau naujo.'],
    'Dviračiai': ['Labas! Koks gražiausias dviračių maršrutas, kurį esi išbandęs(-iusi)?'],
    'Teatras': ['Sveiki! Kokį spektaklį pastaruoju metu matei?'],
    'Gyvūnai': ['Labas! Ar turi augintinį? Labai noriu išgirsti jo vardą.'],
    'Technologijos': ['Labas! Kokia programėlė ar įrankis tau pastaruoju metu palengvino gyvenimą?'],
    'Sodininkystė': ['Sveiki! Ką šiemet užsiauginai? Mano pomidorai – visai nekokie.'],
    'Koncertai': ['Labas! Koks geriausias koncertas, kuriame esi buvęs(-usi)?'],
    '_': ['Labas! Tavo profilis pasirodė labai įdomus – kuo dabar gyveni?']
  };

  var replies = ['Smagu, kad parašei!', 'Oho, įdomu. Papasakok daugiau!', 'Gera mintis. O tu?', 'Haha, sutinku 100 %.'];

  return { INTERESTS: INTERESTS, profiles: profiles, chats: chats, openers: openers, replies: replies };
})();
