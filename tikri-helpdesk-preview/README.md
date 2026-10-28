# Tikri pagalbos tarnyba – statinis DEMO

Netikri duomenys, jokio serverio. UI lietuvių kalba. `index.html` – pagalbos darbuotojo skydelis, `admin.html` – savininko puslapis.

* `assets/api.js` – **vienintelis** duomenų modulis (netikras backend'as localStorage). Keliai ir laukai kaip `server/API.md`.
  Vėliau pakeiskite `request()` vidų į `fetch(API_BASE + path, { headers: { Authorization: 'Bearer …' } })`.
* `assets/sessions.js` – `computeSessions(events, idleMs = 5 min)` (gryna funkcija). Testai: `node tests/sessions.test.js`, `node tests/api.test.js`.
* Naršyklinis testas: `python3 /workspace/tikri-helpdesk-test.py` (Playwright, ekrano nuotraukos į `shots/`).
* Abu puslapiai dalijasi localStorage: veiksmai `index.html` pasirodo `admin.html` („Dirba dabar“, sesijos, auditas).
