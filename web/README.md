# Lifeis Short · Road to 666 — follower watch dashboard

Dark single-page dashboard + tiny API (Node, no dependencies) for watching the
Facebook profile **Lifeis Short** (https://www.facebook.com/people/Lifeis-Short/100013159621667/)
climb toward **666** followers.

## Run
```bash
cd /workspace/fb-follower-watch/web
node server.js                       # http://127.0.0.1:5566
# background:
nohup node server.js > server.log 2>&1 &
# options: PORT=5566 HOST=0.0.0.0 node server.js
```

## Data (in /workspace/fb-follower-watch)
| File | Role |
|---|---|
| `state.json` | Source of truth (profileName, profileUrl, targetFollowers, baselineFollowers, lastFollowers, lastCheckedAt, hitTargetAt) |
| `history.jsonl` | One `{"ts","followers"}` JSON object per line (created empty if missing) |
| `screenshots/milestone-666.png` | Milestone screenshot shown in the celebration panel |

## Record a check
```bash
node /workspace/fb-follower-watch/record_check.js --followers 661
node /workspace/fb-follower-watch/record_check.js --followers 661 --ts 2026-10-19T18:00:00+02:00
```
Appends to `history.jsonl`, updates `lastFollowers`/`lastCheckedAt` in `state.json`
(atomic write), and sets `hitTargetAt` the first time N >= target (never overwritten).
Timestamps default to Europe/Berlin ISO with offset.

## API
- `GET /api/status` → `{ current, target, remaining, progressPct, progressFromBaselinePct, baseline, lastCheckedAt, hitTargetAt, hit, milestoneScreenshot, profileName, profileUrl, ... }`
- `GET /api/history` → array of `{ ts, followers }`
- `GET /api/milestone-screenshot` → PNG, or 404 if missing
- `GET /healthz` → `{ ok: true }`

## UI
Big live count, progress bar to 666, "X until 666", last checked (Berlin time),
history chart + table, Facebook profile link, auto-refresh every 20 s, and a
confetti celebration panel with the milestone screenshot once `hitTargetAt` is set.
The dashboard never contacts Facebook; counts come only from `record_check.js`.
