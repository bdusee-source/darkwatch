# DARKWATCH — Real Data Integration Guide

This guide walks you through wiring DARKWATCH up to live intel feeds using
Vercel as your backend proxy. End-to-end setup takes about 20–30 minutes.

---

## Overview

```
Browser (React app)
  ↓  fetch("/api/hibp?...")          ← same origin, no CORS issue
Vercel Serverless Function (/api/hibp.js)
  ↓  fetch("https://haveibeenpwned.com/api/v3/...")   ← API key injected server-side
HIBP API
```

Your API keys **never leave the server**. The browser only ever talks to `/api/*`
on your own domain.

---

## Step 1 — Project structure

Add the following files to your existing DARKWATCH project:

```
your-project/
├── api/                          ← NEW: Vercel serverless functions
│   ├── hibp.js
│   ├── otx.js
│   ├── urlhaus.js
│   ├── phishtank.js
│   ├── flare.js
│   ├── darkowl.js
│   └── cybersixgill.js
├── src/
│   └── hooks/
│       └── useIntelFeeds.js      ← REPLACE existing file
├── vercel.json                   ← NEW
├── .env.example                  ← NEW (template — do not fill in real keys)
├── .env.local                    ← NEW (real keys — gitignored)
└── ...existing files
```

---

## Step 2 — Install Vercel CLI

```bash
npm install -g vercel
```

---

## Step 3 — Get your API keys

### Have I Been Pwned (HIBP)
1. Go to https://haveibeenpwned.com/API/Key
2. Subscribe (starts at ~$3.50/month for a personal key)
3. Copy the key — it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### AlienVault OTX
1. Go to https://otx.alienvault.com and create a free account
2. Go to your profile → API Integration
3. Copy the OTX Key (64-character hex string)

### PhishTank (optional)
1. Go to https://www.phishtank.com/register.php and register
2. Go to https://www.phishtank.com/api_info.php to request an app key
3. Works without a key at reduced rate limits

### URLhaus
- No key required. The proxy works out of the box.

### Flare
1. Contact Flare at https://flare.io to request a trial or licence
2. You'll receive an API key and a Tenant ID from their onboarding team

### DarkOwl
1. Contact DarkOwl at https://www.darkowl.com/contact
2. You'll receive an API key and API secret from their team

### Cybersixgill
1. Contact Cybersixgill at https://www.cybersixgill.com/contact
2. You'll receive a Client ID and Client Secret for OAuth2

---

## Step 4 — Configure environment variables locally

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the keys you have:

```env
HIBP_API_KEY=your_hibp_key_here
OTX_API_KEY=your_otx_key_here
PHISHTANK_API_KEY=your_phishtank_key_here
FLARE_API_KEY=your_flare_key_here
FLARE_TENANT_ID=your_flare_tenant_id
DARKOWL_API_KEY=your_darkowl_key_here
DARKOWL_API_SECRET=your_darkowl_secret_here
CYBERSIXGILL_CLIENT_ID=your_c6g_client_id
CYBERSIXGILL_CLIENT_SECRET=your_c6g_secret_here
ALLOWED_ORIGIN=*
```

Leave any keys you don't have blank — that feed will be skipped automatically.

---

## Step 5 — Test locally

```bash
vercel dev
```

This starts a local server at http://localhost:3000 that runs both your React
app AND the serverless functions. Open the app, enter a brand name, go to
Intel Feeds, and verify the feeds show "running" then "ok:N" status.

To test a proxy directly:

```bash
# Test HIBP
curl "http://localhost:3000/api/hibp?type=domain&domain=adobe.com"

# Test OTX
curl "http://localhost:3000/api/otx?type=search&q=acme+breach"

# Test URLhaus (no key needed)
curl "http://localhost:3000/api/urlhaus?type=host&value=malware.example.com"
```

---

## Step 6 — Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- Link to an existing project or create a new one
- Accept the default settings for a Vite/CRA React app

After deploying, set your environment variables in the Vercel dashboard:

1. Go to https://vercel.com/dashboard → your project
2. Click **Settings** → **Environment Variables**
3. Add each variable from `.env.example` with your real values
4. Set **Environment** to `Production` (and `Preview` if you want it in PR deploys)
5. Click **Save**
6. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

---

## Step 7 — Lock down CORS (production)

Once deployed, restrict the API proxies to your own domain:

In Vercel dashboard → Environment Variables:
```
ALLOWED_ORIGIN = https://your-darkwatch-domain.vercel.app
```

Redeploy after saving.

---

## Step 8 — Wire up useIntelFeeds in App.jsx

The updated `useIntelFeeds` hook now requires `paidFeedConfig` as a second
argument. Update the call site in `App.jsx`:

```jsx
// Before (simulated):
const { intelStatus, intelResults, runAllFeeds } = useIntelFeeds(intelConfig, brand, domains);

// After (real data):
const { intelStatus, intelResults, runAllFeeds } = useIntelFeeds(
  intelConfig,
  paidFeedConfig,   // ← add this
  brand,
  domains,
  ips,
  keywords,
);
```

---

## Feed status indicators

After `runAllFeeds()` is called, `intelStatus` will contain one of these
values per feed:

| Status | Meaning |
|--------|---------|
| `"running"` | Request in flight |
| `"ok:N"` | Completed — N results returned |
| `"error"` | Request failed (check browser console for detail) |
| *(absent)* | Feed is disabled or has no API key |

---

## Rate limits reference

| Feed | Free limit | Notes |
|------|-----------|-------|
| HIBP | 10 req/min (personal key) | Throttle domains list to ≤5 per sweep |
| OTX | 1,000 req/day | Plenty for hourly sweeps |
| URLhaus | ~1 req/sec | No hard limit but be polite |
| PhishTank | ~100 req/day anonymous | Higher with key |
| Flare | Contractual | Contact Flare for your tier |
| DarkOwl | Contractual | Contact DarkOwl for your tier |
| Cybersixgill | Contractual | Contact C6G for your tier |

The proxies do **not** implement client-side rate limiting. If you scan
frequently and have many domains, consider adding a delay between requests
inside the feed query functions.

---

## Troubleshooting

**"HIBP_API_KEY not configured" in the browser console**
→ The environment variable is missing or not yet applied. Redeploy after
  adding it in the Vercel dashboard.

**Feed returns 0 results but no error**
→ Normal — it means the queried domains/brand returned no hits in that feed.

**CORS errors on `/api/*`**
→ Ensure `ALLOWED_ORIGIN` is set correctly. During development use `*`.

**OTX returns indicators with score 0**
→ The normaliser filters these out as clean indicators. This is correct behaviour.

**DarkOwl returns 401**
→ HMAC signing uses the server clock. Ensure your Vercel function's system
  time is in sync (it always is on Vercel — if you see this, your secret key
  is likely wrong).

**Cybersixgill token expires mid-session**
→ The hook caches the token and refreshes it 60 seconds before expiry.
  If you see 401s, restart the dev server to clear the in-memory cache.
