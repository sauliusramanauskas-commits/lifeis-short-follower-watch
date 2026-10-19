#!/usr/bin/env node
// Usage: node record_check.js --followers N [--ts ISO]
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const STATE = path.join(DIR, 'state.json');
const HISTORY = path.join(DIR, 'history.jsonl');

const args = process.argv.slice(2);
const get = k => { const i = args.indexOf(k); if (i >= 0) return args[i + 1];
  const eq = args.find(a => a.startsWith(k + '=')); return eq ? eq.split('=')[1] : undefined; };
const n = Number(get('--followers'));
if (!Number.isInteger(n) || n < 0) { console.error('Usage: node record_check.js --followers N [--ts ISO]'); process.exit(2); }

function berlinIso(d) {
  // ISO with Europe/Berlin offset, e.g. 2026-10-19T16:55:57+02:00
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(d).map(p => [p.type, p.value]));
  const local = Date.UTC(+parts.year, parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const off = Math.round((local - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const sign = off >= 0 ? '+' : '-', a = Math.abs(off);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${String(a / 60 | 0).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}
const tsArg = get('--ts');
const ts = tsArg ? tsArg : berlinIso(new Date());

const state = JSON.parse(fs.readFileSync(STATE, 'utf8'));
const target = Number(state.targetFollowers) || 666;
state.lastFollowers = n;
state.lastCheckedAt = ts;
let justHit = false;
if (n >= target && !state.hitTargetAt) { state.hitTargetAt = ts; justHit = true; }

fs.appendFileSync(HISTORY, JSON.stringify({ ts, followers: n }) + '\n');
const tmp = STATE + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
fs.renameSync(tmp, STATE);

console.log(JSON.stringify({ ok: true, ts, followers: n, target, remaining: Math.max(0, target - n),
  hitTargetAt: state.hitTargetAt, justHit }));
if (justHit) process.exitCode = 0;
