# DARKWATCH Intelligence Enterprise

> **Advanced Darkweb Threat Intelligence Platform**  
> Continuous brand surveillance across darkweb forums, credential markets, paste sites, and threat actor channels.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat&logo=vite)
![License](https://img.shields.io/badge/License-Private-red?style=flat)
![Deployment](https://img.shields.io/badge/Deployed-GitHub%20Pages-222?style=flat&logo=github)

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Intel Feeds](#intel-feeds)
- [Alert Channels](#alert-channels)
- [Reporting Module](#reporting-module)
- [Threat Types & Severity](#threat-types--severity)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Overview

DARKWATCH Intelligence Enterprise is a React-based brand surveillance platform that monitors darkweb sources for threats targeting your organisation. It continuously scans hacker forums, credential dump repositories, paste sites, darknet marketplaces, and Telegram threat actor channels — surfacing signals ranked by severity in a live threat feed.

The platform is designed for **corporate security teams, threat intelligence analysts, brand protection officers, and CISOs** who need continuous visibility into darkweb exposure without manual monitoring.

---

## Live Demo

🔴 **[https://bdusee-source.github.io/darkwatch/](https://bdusee-source.github.io/darkwatch/)**

> The live demo runs in simulated mode with a 30-second rescan cycle. Enter a brand name, activate monitoring, and the threat feed populates in real time.

---

## Features

| Feature | Description |
|---|---|
| **Continuous Monitoring** | Auto-rescans all configured sources on a timed cycle — no manual triggers needed |
| **Live Threat Feed** | Threat cards surface in real time with severity ratings, source attribution, and context |
| **Risk Bar** | Colour-coded risk level bar (Low → Critical) pinned to the top of every screen |
| **8-Section Profile** | Brand identity, digital infrastructure, personnel, products, social media, supply chain, keywords, and scan config |
| **Intel Feeds** | Live API integrations: URLhaus, PhishTank, AlienVault OTX, HaveIBeenPwned |
| **Commercial Feed Config** | Configuration UI for Recorded Future, DarkOwl, Flare, Intel 471, Cybersixgill |
| **Alert Channels** | Email, Slack, Webhook, and SMS notification configuration |
| **Reports Module** | Executive (board-level) and Operational (analyst) report generation with PDF export |
| **Threat Context** | Full context modal per finding: urgency, response actions, assessment indicators, external resources |
| **Emergency Contact** | Sophos Incident Response contact module with regional phone numbers |
| **In-App Docs** | Full searchable documentation covering every feature, field, and threat type |

---

## Tech Stack

- **Framework:** React 19.2
- **Build Tool:** Vite 7.3
- **Styling:** Inline styles (no CSS framework dependency)
- **Font:** Courier New / monospace (terminal aesthetic)
- **APIs:** URLhaus, PhishTank, AlienVault OTX, HaveIBeenPwned (v3)
- **Deployment:** GitHub Pages via `gh-pages`

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/bdusee-source/darkwatch.git
cd darkwatch

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

> This builds the app and pushes the `dist/` folder to the `gh-pages` branch automatically.

---

## Project Structure

```
darkwatch/
├── public/               # Static assets
├── src/
│   └── App.jsx           # Main application (all components)
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration (base: '/darkwatch/')
├── package.json
└── README.md
```

> **Note:** All components currently live in `App.jsx`. See [Roadmap](#roadmap) for planned refactoring into separate component files.

---

## Configuration

### Surveillance Profile

DARKWATCH uses **8 input sections** to build your monitoring profile. The more fields you populate, the higher your detection coverage.

| Section | Key Fields |
|---|---|
| **1 · Brand Identity** | Primary brand name *(required)*, industry, stock tickers, legal entity names |
| **2 · Digital Infrastructure** | Domains, email domains, IP ranges, ASN numbers, SSL certificate domains |
| **3 · People & Personnel** | VIP/executives, key employees, contractors |
| **4 · Products & IP** | Product names, project codenames, trademarks, source code identifiers |
| **5 · Social Media** | Social handles, app/product names |
| **6 · Supply Chain** | Key suppliers, cloud services and SaaS platforms |
| **7 · Keywords** | Custom monitoring terms, exclusion keywords |
| **8 · Scan Config** | Source type toggles, alert channel configuration |

### Source Types

Toggle which source categories are included in each scan cycle:

- Hacker Forums
- Paste Sites
- Darknet Marketplaces
- Telegram Threat Channels
- IRC Channels
- Credential Combo Lists
- Stealer Log Repositories
- Ransomware Group Blogs

---

## Intel Feeds

### Open Source Feeds (Live API)

These feeds query live APIs during each scan cycle. Results appear in the threat feed with a **◉ LIVE** badge.

| Feed | Requires API Key | Notes |
|---|---|---|
| **URLhaus (abuse.ch)** | No | CORS-friendly; works on GitHub Pages |
| **PhishTank** | Optional | Rate-limited without key; CORS may block on GitHub Pages |
| **AlienVault OTX** | Optional | Public pulses work without key |
| **HaveIBeenPwned** | Yes (paid for commercial) | Requires server-side proxy on GitHub Pages |

> **CORS Note:** HIBP and PhishTank require server-side proxying when deployed to GitHub Pages. URLhaus and OTX work directly from the browser.

### Commercial Feeds (Backend Required)

Configuration UI is provided for the following commercial platforms. Credentials are stored in UI state and intended for a backend integration — they are **never transmitted directly from the browser**.

- Recorded Future
- DarkOwl Vision
- Flare
- Intel 471
- Cybersixgill

---

## Alert Channels

Configure up to four independent notification channels in **Section 8 · Scan Configuration**. Each channel has its own minimum severity threshold.

### Email
- Recipients (comma-separated)
- Subject line prefix for inbox filtering
- Daily digest mode (bundle all alerts into one summary)
- Minimum severity: Critical / High / Medium / Low

### Slack
- Incoming webhook URL
- Target channel (e.g. `#security-alerts`)
- Bot display name
- Minimum severity threshold

### Webhook
- HTTPS endpoint URL
- Bearer token authentication
- HTTP method (POST or PUT)
- JSON payload format:
```json
{
  "severity": "critical",
  "type": "data_leak",
  "source": "BreachForums",
  "content": "...",
  "detectedAt": 1234567890000,
  "brand": "Acme Corporation"
}
```

### SMS
- E.164 format phone numbers (e.g. `+442071234567`)
- Provider: Twilio / AWS SNS / Vonage
- API credentials per provider
- Recommended for **Critical severity only**

> **Simulation mode:** The ▶ TEST button simulates delivery only. A backend integration is required for live notifications.

---

## Reporting Module

Navigate to the **Reports** tab to generate structured threat intelligence reports.

### Report Types

| Type | Audience | Contents |
|---|---|---|
| **Executive Report** | Board, C-suite | Risk posture, KPI metrics, severity breakdown, board recommendations |
| **Operational Report** | SOC analysts, security managers | Full findings log, threat type breakdown, source rankings, analyst action queue |

### Reporting Periods

| Period | Use Case |
|---|---|
| **Weekly (7 days)** | Routine security team stand-ups |
| **Monthly (30 days)** | Management reporting cycle |
| **Quarterly (90 days)** | Board packs and executive briefings |

### Exporting

Click **PRINT / EXPORT PDF** after generating a report. In the browser print dialog, select **Save as PDF** as the destination.

---

## Threat Types & Severity

### Threat Types

| Type | Default Severity | Description |
|---|---|---|
| Data Leak | Critical | Organisational data posted or being sold |
| Credential Exposure | High | Employee credentials in stealer logs or combo lists |
| Sale Listing | Critical | Data, access, or source code being sold |
| Phishing Kit | Critical | Fake login portal harvesting credentials |
| Doxxing | Critical | Personal information of VIP or employee posted publicly |
| Exploit Listing | High | Vulnerability in your systems being traded |
| Typosquat | High | Domain similar to yours registered for impersonation |
| Impersonation | High | Fake social media account posing as your brand |
| Counterfeit | High | Fake versions of your products being sold |
| Mention | Medium | Brand referenced in threat actor context |

### Severity Levels & Response Matrix

| Level | Score | Risk Bar | Response Time |
|---|---|---|---|
| **CRITICAL** | 7.5–10 | 🔴 Pulsing red | Immediate — within 1 hour |
| **HIGH** | 5.0–7.4 | 🟠 Orange | Same day — within 4 hours |
| **MEDIUM** | 2.5–4.9 | 🟡 Amber | Within 24–48 hours |
| **LOW** | 0–2.4 | 🟢 Green | Weekly review cycle |

### Risk Score Calculation

```
score = min(10, Σ(finding_weights) × 0.4)

Weights: Critical = 4 | High = 2 | Medium = 1 | Low = 0.25
```

---

## Deployment

The app is deployed to GitHub Pages using the `gh-pages` package.

### Setup (one-time)

1. Ensure `vite.config.js` has `base: '/darkwatch/'`
2. Ensure `package.json` has the deploy scripts:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### Deploy

```bash
npm run deploy
```

### GitHub Pages Settings

Go to **Settings → Pages** in your repository and set the source branch to `gh-pages`.

Live URL: `https://bdusee-source.github.io/darkwatch/`

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **CORS on GitHub Pages** | HIBP and PhishTank require a backend proxy when deployed to GitHub Pages |
| **Alert delivery** | Alert channels are UI-configured only — live delivery requires a backend integration |
| **Simulated threats** | The threat pool uses templated simulated findings; production deployment requires live feed backend |
| **Single-file architecture** | All components are in `App.jsx` — refactoring into separate files is planned |
| **No persistence** | Findings and profile configuration are in-memory only — a page refresh clears all data |
| **No authentication** | The app has no login/auth layer in its current form |

---

## Roadmap

- [ ] **Component refactoring** — Split `App.jsx` into separate component files (`ReportScreen`, `DocScreen`, `ContactScreen`, `IntelFeedsScreen`)
- [ ] **Backend proxy** — Node.js / Cloudflare Worker to proxy HIBP and PhishTank API calls
- [ ] **Live alert delivery** — Backend integration for Email, Slack, Webhook, and SMS channels
- [ ] **Profile persistence** — Save surveillance profile to `localStorage` or a backend
- [ ] **`useMemo` / `useCallback` optimisation** — Prevent unnecessary re-renders on `ThreatCard` and `entities`
- [ ] **`@media print` styles** — Improve PDF export quality for reports
- [ ] **Authentication** — User login and profile management
- [ ] **Static data extraction** — Move `DOCS`, `THREAT_POOL`, and `THREAT_CONTEXT` to separate data files

---

## Disclaimer

> DARKWATCH Intelligence Enterprise is a **defensive security tool**. All intelligence is gathered from publicly accessible sources for protective purposes only. The platform does not purchase data, interact with threat actors, or facilitate any illegal activity. Results are for threat awareness and do not constitute legal evidence.
>
> Do not attempt to access `.onion` sources directly or contact threat actors. Engage qualified incident response professionals for confirmed breaches.

---

*Built with React + Vite · Deployed on GitHub Pages*
