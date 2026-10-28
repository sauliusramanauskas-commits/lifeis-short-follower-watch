/*
 * Darbo sesijų skaičiavimas (gryna funkcija, be šalutinio poveikio).
 *
 * computeSessions(events, idleMs = 5 * 60 * 1000)
 *   events  - veiksmų laikai: skaičiai (ms), Date, ISO eilutės arba objektai { at | ts | time }.
 *             Gali būti nerūšiuoti; funkcija nekeičia įvesties.
 *   idleMs  - maksimali leidžiama pauzė tarp veiksmų (numatyta 5 min).
 *
 * Taisyklė (API.md "Session rule"):
 *   sesija prasideda pirmu veiksmu ir tęsiasi, kol tarpas iki ankstesnio veiksmo yra <= idleMs
 *   (lygiai 5:00 dar tęsia, 5:00.001 jau skiria). Ilgesnis tarpas baigia sesiją PASKUTINIO veiksmo
 *   momentu (prastovos laikas neskaičiuojamas), o kitas veiksmas atidaro naują sesiją.
 *   Sesija su vienu veiksmu trunka 0.
 *
 * Grąžina: [{ start, end, ms, minutes, action_count }] (start/end - ms nuo epochos), chronologiškai.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TikriSessions = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function toMs(e) {
    if (e !== null && typeof e === 'object' && !(e instanceof Date)) {
      e = e.at !== undefined ? e.at : (e.ts !== undefined ? e.ts : e.time);
    }
    var ms = e instanceof Date ? e.getTime() : (typeof e === 'number' ? e : Date.parse(e));
    if (!Number.isFinite(ms)) throw new TypeError('computeSessions: neteisingas laikas: ' + e);
    return ms;
  }

  function computeSessions(events, idleMs) {
    if (idleMs === undefined || idleMs === null) idleMs = 5 * 60 * 1000;
    var times = (events || []).map(toMs).sort(function (a, b) { return a - b; });
    var out = [];
    var cur = null;
    for (var i = 0; i < times.length; i++) {
      var t = times[i];
      if (cur && t - cur.end <= idleMs) {
        cur.end = t;
        cur.action_count++;
      } else {
        if (cur) out.push(cur);
        cur = { start: t, end: t, action_count: 1 };
      }
    }
    if (cur) out.push(cur);
    return out.map(function (s) {
      var ms = s.end - s.start;
      return { start: s.start, end: s.end, ms: ms, minutes: Math.round(ms / 600) / 100, action_count: s.action_count };
    });
  }

  return { computeSessions: computeSessions, DEFAULT_IDLE_MS: 5 * 60 * 1000 };
});
