#!/usr/bin/env node
// Lifeis Short follower watch — static + API server (no deps).
const http = require('http');
const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(__dirname, '..');
const ROOT = process.env.DATA_DIR || APP_ROOT;
const STATE = path.join(ROOT, 'state.json');
const HISTORY = path.join(ROOT, 'history.jsonl');
const SHOT = path.join(ROOT, 'screenshots', 'milestone-666.png');
const PUBLIC = path.join(__dirname, 'public');
const PORT = parseInt(process.env.PORT || '5566', 10);
const HOST = process.env.HOST || '0.0.0.0';
const INGEST_SECRET = process.env.INGEST_SECRET || '';

if (!fs.existsSync(HISTORY)) fs.writeFileSync(HISTORY, '');
if (!fs.existsSync(path.dirname(SHOT))) fs.mkdirSync(path.dirname(SHOT), { recursive: true });

function readState() { return JSON.parse(fs.readFileSync(STATE, 'utf8')); }

function status() {
  const s = readState();
  const target = Number(s.targetFollowers) || 666;
  const base = Number(s.baselineFollowers) || 0;
  const cur = s.lastFollowers == null ? null : Number(s.lastFollowers);
  const remaining = cur == null ? null : Math.max(0, target - cur);
  const progressPct = cur == null ? 0 : Math.min(100, Math.round((cur / target) * 10000) / 100);
  const span = target - base;
  const progressFromBaselinePct = cur == null || span <= 0 ? 0
    : Math.max(0, Math.min(100, Math.round(((cur - base) / span) * 10000) / 100));
  return {
    profileName: s.profileName, profileUrl: s.profileUrl, shareUrl: s.shareUrl || null,
    current: cur, target, baseline: base, remaining,
    progressPct, progressFromBaselinePct,
    lastCheckedAt: s.lastCheckedAt || null, hitTargetAt: s.hitTargetAt || null,
    hit: !!s.hitTargetAt || (cur != null && cur >= target),
    milestoneScreenshot: fs.existsSync(SHOT),
    serverTime: new Date().toISOString(),
  };
}

function history() {
  if (!fs.existsSync(HISTORY)) fs.writeFileSync(HISTORY, '');
  return fs.readFileSync(HISTORY, 'utf8').split('\n').filter(l => l.trim()).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj, null, 2));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/api/status') return json(res, 200, status());
    if (p === '/api/history') return json(res, 200, history());
    if (p === '/api/milestone-screenshot') {
      if (!fs.existsSync(SHOT)) return json(res, 404, { error: 'milestone screenshot not found' });
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
      return fs.createReadStream(SHOT).pipe(res);
    }
    if (p === '/api/ingest' && req.method === 'POST') {
      if (!INGEST_SECRET) return json(res, 503, { error: 'INGEST_SECRET not configured' });
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.headers['x-ingest-secret'] || '');
      if (token !== INGEST_SECRET) return json(res, 401, { error: 'unauthorized' });
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString('utf8') || '{}');
      if (body.state && typeof body.state === 'object') {
        fs.writeFileSync(STATE, JSON.stringify(body.state, null, 2) + '\n');
      }
      if (Array.isArray(body.historyAppend)) {
        const lines = body.historyAppend.map(o => JSON.stringify(o)).join('\n') + '\n';
        fs.appendFileSync(HISTORY, lines);
      } else if (typeof body.historyLine === 'string' && body.historyLine.trim()) {
        fs.appendFileSync(HISTORY, body.historyLine.trim() + '\n');
      }
      if (body.milestoneScreenshotBase64) {
        fs.writeFileSync(SHOT, Buffer.from(body.milestoneScreenshotBase64, 'base64'));
      }
      return json(res, 200, { ok: true, status: status() });
    }
    if (p === '/healthz') return json(res, 200, { ok: true });
    const file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : p));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
      return json(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
}).listen(PORT, HOST, () => console.log(`Follower watch on http://${HOST}:${PORT}`));
