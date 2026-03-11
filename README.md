# DARKWATCH Intelligence Platform

> **Defensive use only.** Intelligence gathered by DARKWATCH is intended exclusively for protective security operations. Results do not constitute legal evidence and must not be used offensively.

DARKWATCH is a brand and infrastructure threat-monitoring dashboard. It continuously sweeps dark-web forums, paste sites, credential markets, Telegram channels, ransomware blogs, and open-source intelligence feeds to surface mentions, leaks, and attacks targeting your organisation — before they become incidents.

---

## Table of Contents

- [Features](#features)
- [What's New in v2.0](#whats-new-in-v20)
- [Getting Started](#getting-started)
- [Signal Types](#signal-types)
- [Source Types](#source-types)
- [Intel Feeds](#intel-feeds)
- [Notifications](#notifications)
- [Import / Export](#import--export)
- [Results & Triage](#results--triage)
- [Architecture](#architecture)
- [Configuration Reference](#configuration-reference)
- [Accessibility](#accessibility)
- [FAQ](#faq)
- [License](#license)

---

## Features

- **Persistent configuration** — all settings auto-save to `localStorage`. Your setup survives page refreshes and browser restarts.
- **Import / Export** — download your full configuration as a versioned JSON file; restore or share it with one click.
- **Bulk tag import** — paste comma- or newline-separated lists into any signal field.
- **Input validation** — IPs (CIDR), ASNs, domains, email patterns, ticker symbols, and E.164 phone numbers are validated before entry.
- **Search & sort** — full-text search plus sort by newest, oldest, or severity across the live threat feed.
- **Threat detail modal** — click any finding to open a full detail panel with source attribution, description, and triage controls.
- **Triage workflow** — mark findings as *Open*, *Investigating*, *False Positive*, or *Resolved* with inline status badges.
- **Trend sparkline** — live SVG chart showing threat volume over the last 20 scan cycles.
- **Masked secrets** — API keys, tokens, and webhook URLs are hidden by default with a reveal toggle.
- **Keyboard accessible** — all interactive elements support keyboard navigation; modal closes on `Escape`.
- **Mobile responsive** — collapsible sidebar with hamburger menu and dark overlay on screens < 768 px.
- **Custom hooks** — state refactored into `useMonitoringConfig` and `useAlertConfig` for maintainability.

---

## What's New in v2.0

| # | Improvement | Details |
|---|-------------|---------|
| 1 | **Persist config to localStorage** | Saves on every field change under key `darkwatch_config_v1`. Loads automatically on mount. |
| 2 | **Import / Export config** | Export as `darkwatch-config.json`; import with file picker. Validated against `_darkwatch: true` sentinel. |
| 3 | **Bulk tag import** | Every tag field has a ⇥ Bulk button opening a textarea for batch entry. |
| 4 | **Input validation** | Per-field regex/URL validators with inline error messages and comma-key shortcut. |
| 5 | **Search & sort** | Real-time search across title, type, source, description. Sort by newest / oldest / severity. |
| 6 | **Threat detail modal** | Full-screen overlay with description, metadata, and triage controls. Escape to close. |
| 7 | **Triage workflow** | Four statuses: Open, Investigating, False Positive, Resolved. Badges on threat cards. |
| 8 | **Trend sparkline** | 20-cycle SVG line chart with directional indicator (↑ red / ↓ green / → grey). |
| 9 | **Custom hooks** | `useMonitoringConfig` and `useAlertConfig` replace 25+ inline `useState` declarations. |
| 10 | **Masked API keys** | `MaskedInput` component with 👁 reveal toggle on all sensitive notification fields. |
| 11 | **Keyboard accessibility** | `aria-label`, `aria-pressed`, `aria-current`, `aria-modal`, `role="dialog"` throughout. |
| 12 | **Mobile responsive** | CSS media queries, fixed sidebar with CSS class toggling, hamburger button, overlay. |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A React 18 project (Vite or Create React App)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/darkwatch.git
cd darkwatch

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Usage

1. Open the **Scanner** tab (default view on load).
2. Enter your **Primary brand name** — this is the only required field.
3. Optionally expand the signal sections to add domains, IPs, personnel, keywords, and more.
4. Under **Scan Configuration**, select source types and enable at least one alert channel.
5. Click **Activate Monitoring** — DARKWATCH begins sweeping immediately and navigates to the Results screen.
6. Use the **search bar**, **filters**, and **sort** dropdown to navigate findings. Click any threat card to open the detail panel and triage the finding.

> **Tip:** Your configuration saves automatically. Close and reopen the browser — your setup is still there.

---

## Signal Types

### Brand Identity

| Field | Format | Purpose |
|-------|--------|---------|
| Primary brand name | Free text | Core search term. **Required.** |
| Industry / sector | Free text | Scopes detection to sector-specific threat actors. |
| Stock ticker symbols | 1–5 uppercase letters | Financial impersonation and market chatter. |
| Legal entity names | Free text | Holding companies and subsidiaries. |

### Digital Infrastructure

| Field | Format | Purpose |
|-------|--------|---------|
| Domains & subdomains | `acme.com` or `*.acme.com` | Typosquatting, phishing kits, impersonating sites. |
| Corporate email domains | `@acme.com` | Credential leak matching. |
| IP ranges / CIDR | `203.0.113.0/24` | Exploit forum mentions of your address space. |
| ASN numbers | `AS12345` | BGP hijack chatter and ASN-level targeting. |
| SSL certificate domains | `*.acme.com` | Lookalike certificate detection. |

### People & Personnel

> Ensure your organisation's privacy and data policies permit personnel monitoring before adding names.

| Field | Purpose |
|-------|---------|
| Executives & VIPs | Doxxing, impersonation, physical threat chatter. |
| Key employees | Credential leaks, targeted phishing. |
| Contractors & third parties | Supply-chain risk and third-party breaches. |

### Products & IP

| Field | Purpose |
|-------|---------|
| Product names | Counterfeit software, brand abuse. |
| Internal project codenames | Insider leak detection — these should never appear externally. |
| Trademarks & patents | IP theft monitoring. |
| Source code identifiers | Leaked or cloned code on paste sites and GitHub. |

### Keywords & Exclusions

Use **monitor keywords** for phrases unlikely to appear in standard searches (e.g. `"acme breach"`).

Use **exclusion keywords** to suppress false positives (e.g. `"acme cartoon"` to filter Looney Tunes references).

---

## Source Types

| Source | Coverage |
|--------|----------|
| Hacker Forums | XSS, Exploit.in, RaidForums mirrors, and similar underground forums. |
| Paste Sites | Pastebin, Ghostbin, and other public paste services. |
| Marketplaces | Dark-web shops selling stolen data, credentials, and access. |
| Telegram | Public and semi-public Telegram channels. |
| IRC | Legacy IRC networks used by some threat communities. |
| Combo Lists | Large credential combo lists. |
| Stealer Logs | RedLine, Vidar, and other infostealer output files. |
| Ransomware Blogs | Victim-shaming leak sites operated by ransomware groups. |

---

## Intel Feeds

### Free feeds

| Feed | Covers | API key |
|------|--------|---------|
| [Have I Been Pwned](https://haveibeenpwned.com/API/Key) | Email and domain exposure in known breaches. | Required (free tier available) |
| [URLhaus](https://urlhaus.abuse.ch) | Malicious URLs and phishing domains. | Not required |
| [PhishTank](https://www.phishtank.com) | Community-verified phishing URLs. | Optional (higher rate limits with key) |
| [AlienVault OTX](https://otx.alienvault.com) | IOCs, malware hashes, threat actor TTPs. | Required (free) |

### Paid feeds

| Feed | Speciality |
|------|-----------|
| Recorded Future | Predictive intelligence, dark-web actor tracking. |
| DarkOwl | Dark-web crawling at scale, stealer log ingestion. |
| Flare | Illicit community monitoring, data leak detection. |
| Intel 471 | Underground forum infiltration, threat actor profiling. |
| Cybersixgill | Real-time dark-web stream, automated IOC extraction. |

---

## Notifications

DARKWATCH supports four delivery channels. All require a backend proxy for live delivery — test sends are simulated client-side.

### Email
- Recipients (comma-separated)
- Subject prefix (default: `[DARKWATCH]`)
- Minimum severity threshold
- Daily digest mode

### Slack
- Incoming webhook URL *(masked)*
- Channel override
- Bot display name
- Minimum severity threshold

### Webhook (SIEM / SOAR)
- Endpoint URL
- Bearer token *(masked)*
- HTTP method (POST / PUT)
- Minimum severity threshold

### SMS
- Phone numbers in E.164 format *(validated)*
- Provider: Twilio, AWS SNS, or Vonage
- Account SID / API key *(masked)*
- Auth token / secret *(masked)*
- Minimum severity threshold (Critical recommended to avoid alert fatigue)

---

## Import / Export

### Exporting

Click **↓ Export config** on the Setup screen. A file named `darkwatch-config.json` is downloaded.

### Importing

Click **↑ Import config**, select a `darkwatch-config.json` file, and all fields populate immediately.

### Config file structure

```json
{
  "_darkwatch": true,
  "version": 1,
  "brand": "Acme Corporation",
  "industry": "Financial Services",
  "stockTickers": ["ACME"],
  "legalEntities": ["Acme Holdings Ltd"],
  "domains": ["acme.com", "acme.io"],
  "emails": ["@acme.com"],
  "ips": ["203.0.113.0/24"],
  "asns": ["AS12345"],
  "certs": ["*.acme.com"],
  "vips": ["Jane Smith, CEO"],
  "employees": [],
  "contractors": [],
  "products": ["AcmePay"],
  "projects": ["Project Nighthawk"],
  "trademarks": ["AcmePay™"],
  "sourcePaths": ["acme-internal-sdk"],
  "socials": ["@acmecorp"],
  "appNames": ["Acme Mobile"],
  "suppliers": [],
  "cloudServices": ["GitHub org/acme"],
  "keywords": ["acme breach"],
  "excludeKeywords": ["acme cartoon"],
  "monitorSources": ["forums", "paste", "markets", "telegram"]
}
```

> ⚠️ **Security:** The config file contains API keys in plaintext. Do not commit it to version control or share it publicly.

---

## Results & Triage

### Risk score

| Score | Label | Action |
|-------|-------|--------|
| 0–2 | Minimal | Review weekly. |
| 3–4 | Low | Schedule analyst review within the week. |
| 5–6 | Moderate | Assign to SOC within 24 hours. |
| 7–8 | High | Escalate immediately; notify CISO. |
| 9–10 | Critical | Activate incident response procedures. |

### Triage statuses

| Status | Badge colour | Meaning |
|--------|-------------|---------|
| Open | — | Unreviewed (default). |
| Investigating | Amber | Analyst is actively reviewing. |
| False Positive | Green | Confirmed false alarm. |
| Resolved | Blue | Remediated or acknowledged. |

> Triage statuses are stored in React state and are not persisted to `localStorage`. Export a config snapshot before resetting if you need a record.

### Trend sparkline

The line chart next to the scan metadata shows threat volume over the last 20 scan cycles. Requires at least 2 completed cycles to appear.

| Indicator | Colour | Meaning |
|-----------|--------|---------|
| ↑ | Red | Increasing threat activity |
| ↓ | Green | Decreasing threat activity |
| → | Grey | No change |

---

## Architecture

```
src/
├── App.jsx                    # Root component — layout, routing, state composition
├── data/
│   └── constants.js           # SEVERITY_CONFIG and other shared constants
├── utils/
│   └── helpers.js             # calcRisk() and utility functions
├── hooks/
│   ├── useIntelFeeds.js       # Intel feed connections (HIBP, OTX, etc.)
│   └── useScanEngine.js       # Scan loop, result aggregation, timing
├── components/
│   ├── RiskBar.jsx            # Top status bar
│   ├── ThreatCard.jsx         # Individual finding card
│   └── UI.jsx                 # StatBox, TagInput, ScanSection, SimpleInput, ToggleGroup, TerminalText
└── screens/
    ├── DocScreen.jsx          # Documentation (this file)
    ├── ReportScreen.jsx       # Exportable PDF report
    ├── ContactScreen.jsx      # Emergency contacts
    └── IntelFeedsScreen.jsx   # Feed configuration UI
```

### Custom hooks (v2.0)

**`useMonitoringConfig`** — owns all 22+ signal fields, auto-saves to and auto-loads from `localStorage`.

**`useAlertConfig`** — owns notification channel state, `updateNotif`, `testChannel`, `updateIntel`, and `updatePaidFeed` callbacks.

### State persistence

| Key | Storage | Contents |
|-----|---------|----------|
| `darkwatch_config_v1` | `localStorage` | All signal fields and monitor source selection |
| Triage map | React state | `uid → status` — session only |
| Threat history | React state | Last 20 scan-cycle counts for sparkline |

---

## Configuration Reference

### Input validation rules

| Field type | Validation | Example valid input |
|------------|------------|---------------------|
| Domain | `/^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/i` | `acme.com`, `*.acme.io` |
| Email domain | `/^@?[a-z0-9.-]+\.[a-z]{2,}$/i` | `@acme.com`, `acme.com` |
| IP / CIDR | `/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/` | `10.0.0.0/8`, `203.0.113.1` |
| ASN | `/^AS\d+$/i` | `AS12345` |
| Phone (E.164) | `/^\+\d{7,15}$/` | `+442071234567` |
| Ticker | `/^[A-Z]{1,5}$/` | `ACME`, `GOOGL` |
| Free text | Any non-empty string | — |

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` or `,` in tag input | Submit current value |
| `Escape` | Close threat detail modal |
| `Tab` | Navigate between interactive elements |

---

## Accessibility

DARKWATCH v2.0 includes the following accessibility improvements:

- `aria-label` on all icon-only buttons (×, 👁, ☰, +)
- `aria-pressed` on toggle switches
- `aria-current="page"` on active sidebar and doc nav items
- `aria-modal="true"` and `role="dialog"` on the threat detail modal
- `aria-disabled` on the disabled Activate Monitoring button
- `aria-expanded` on FAQ accordion items
- Keyboard-dismissible modal (`Escape` key)
- Print stylesheet hides all chrome for clean output

---

## FAQ

**Why aren't I seeing any threats after activating?**
DARKWATCH uses a simulated scan engine by default. Real findings require live API keys in the Intel Feeds tab. The simulated engine generates representative findings after one or two scan cycles — wait up to 60 seconds.

**My configuration disappeared after a browser update.**
Some browser updates clear `localStorage`. Always export your config before updating. Re-import from the Setup screen to restore.

**Can I monitor multiple brands simultaneously?**
Not in the current version. Export your current config, click Reset & reconfigure, set up the new brand, and import the old config later to switch back.

**What does marking a finding as False Positive do?**
It assigns a green badge in the current session. The scan engine is not updated — the same finding may be re-surfaced on the next cycle.

**Are my API keys safe?**
Keys are stored in React state and in `localStorage` on your device only. They are never transmitted to any DARKWATCH server. The exported config JSON contains keys in plaintext — protect it accordingly.

**How do I clear all data and start fresh?**
Click **Reset & reconfigure** on the Results screen. To also clear `localStorage`, open DevTools → Application → Local Storage and delete the `darkwatch_config_v1` key.

---

## License

DARKWATCH is provided for defensive security research purposes. Usage is subject to your organisation's acceptable-use policy and applicable law. The authors accept no liability for misuse.
