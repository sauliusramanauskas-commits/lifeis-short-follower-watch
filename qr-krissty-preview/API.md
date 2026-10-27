# qr.krissty.lt – redirect server API (draft v0.1)

Owner: Programer Ethical HACKER (redirect server, Stripe, security).
Frontend (generator, account, stats UI): Web Programer.

## Stack
- Cloudflare Worker on `qr.krissty.lt` (redirects + API), Cloudflare D1 (SQLite) for data.
- Auth: Supabase Auth JWT (frontend login). Worker verifies the JWT on every /api call.
- Payments: Stripe Checkout + Billing Portal; Worker receives Stripe webhooks.
- Secrets (Worker env only, never in frontend or git): SUPABASE_JWT_SECRET, STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET, SAFE_BROWSING_KEY, IP_HASH_SALT.

## Public redirect
`GET https://qr.krissty.lt/{slug}`  (slug: 7 chars, base62, random, not guessable from id)
- active -> 302 to target_url (Cache-Control: no-store so edits apply immediately)
- password set -> small password page (POST form, rate-limited 5/min/IP)
- expired / scan limit reached / blocked -> friendly page, no redirect
- subscription lapsed -> keeps redirecting during 30-day grace, then "paused" page (never someone else's link)
- unknown slug -> 404 page
Each hit logs a scan (see Privacy).

## API (JSON, `Authorization: Bearer <supabase jwt>`)
| Method | Path | Body / notes |
|---|---|---|
| GET | /api/codes | list my codes |
| POST | /api/codes | {type:"url"\|"links"\|"vcard"\|"wifi"\|"pdf", target_url?, title, links_page?, password?, expires_at?, max_scans?} -> {id, slug, short_url} |
| GET | /api/codes/{id} | one code |
| PATCH | /api/codes/{id} | change target_url, title, password, expires_at, max_scans, paused |
| DELETE | /api/codes/{id} | soft delete (slug never reused) |
| GET | /api/codes/{id}/stats?from&to | {total, by_day[], by_country[], by_device[], by_os[]} |
| POST | /api/billing/checkout | {plan:"pro_month"\|"pro_year"\|"business_month"\|"business_year"} -> {url} (Stripe Checkout) |
| POST | /api/billing/portal | -> {url} (Stripe portal: cancel / change card, one click) |
| GET | /api/me | {plan, status, period_end, grace_until, limits:{dynamic_codes, scans_month}} |
| POST | /stripe/webhook | Stripe only; signature verified with STRIPE_WEBHOOK_SECRET |

Errors: {error:{code, message}} with 400/401/403/404/409/429.
Every POST that creates something accepts header `Idempotency-Key` (uuid) so a retry never makes a duplicate.

## Plans (limits enforced server-side; prices from Finance)
- free: static QR unlimited (generated in the browser, no server), 1 dynamic code, stats 7 days
- pro: N dynamic codes, full stats, password/expiry
- business: more codes, team, custom domain (later)
Over limit -> 403 `plan_limit`.

## Security
- Every target_url: http(s) only, no javascript:/data:, max 2048 chars, checked with Google Safe Browsing
  on create/update and re-checked daily; flagged -> code blocked + owner emailed.
- Rate limits: create/update 30/h per user, redirect password tries 5/min per IP.
- Codes belong to user_id; every /api query filters by the JWT's user id (no IDOR).
- Stripe webhook is the only thing that changes plan/status (frontend can't set plan).
- CORS: only https://qr.krissty.lt.
- Security headers on all pages (CSP, HSTS, X-Content-Type-Options, frame-ancestors 'none').

## Privacy (GDPR)
Scan row: code_id, ts, country (from Cloudflare), device/os/browser (parsed UA), referrer host,
ip_hash = SHA-256(ip + daily-rotating salt) only for unique-scan counting. No raw IPs stored.
Scans kept 24 months, then aggregated.

## Data model (D1)
users(id, email, stripe_customer_id, plan, status, period_end, grace_until)
codes(id, user_id, slug UNIQUE, type, title, target_url, links_page_json, password_hash,
      expires_at, max_scans, scan_count, paused, blocked, created_at, updated_at, deleted_at)
scans(id, code_id, ts, country, device, os, browser, referrer, ip_hash)

## First migration
Krissty business card: code type "links" with Facebook / Instagram / YouTube, slug reserved `krissty`
-> https://qr.krissty.lt/krissty. Reprint the card before 2026-11-19 (GetQR period end).
