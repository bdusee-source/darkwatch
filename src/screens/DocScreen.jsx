import { useState } from "react";

const DOCS = [
  {
    section: "Getting Started",
    icon: "◉",
    articles: [
      {
        title: "What is DARKWATCH?",
        content: `DARKWATCH Intelligence Enterprise is a continuous brand surveillance platform that monitors darkweb forums, credential markets, paste sites, darknet marketplaces, and Telegram threat actor channels for signals targeting your organisation.

It surfaces threat findings ranked by severity in a live feed, allowing your security team to detect exposure and respond before an incident escalates.`,
      },
      {
        title: "Quick Start Guide",
        content: `1. Go to the Scanner tab
2. Enter your primary brand name in Section 1 (required)
3. Add your domains, IPs, personnel, and keywords in Sections 2–7
4. Choose which source types to monitor in Section 8
5. Click "ACTIVATE CONTINUOUS MONITORING"

The platform will run an initial sweep and continue rescanning every 30 seconds. Findings appear in the live threat feed in real time.`,
      },
    ],
  },
  {
    section: "Surveillance Profile",
    icon: "◈",
    articles: [
      {
        title: "Section 1 — Brand Identity",
        content: `The primary brand name is the only required field. It is used as the core search term across all monitored sources.

Additional fields:
- Industry / sector: Improves correlation with sector-specific threat actor activity
- Stock tickers: Detects market manipulation and pump-dump discussions
- Legal entity names: Catches references to subsidiaries and holding companies`,
      },
      {
        title: "Section 2 — Digital Infrastructure",
        content: `Monitor your internet-facing assets:
- Domains & subdomains: Detect typosquatting, phishing kits, and impersonation sites
- Corporate email domains: Identify credential leaks matching your email pattern
- IP ranges / CIDR blocks: Flag exploit listings targeting your network
- ASN numbers: Network-level monitoring for BGP hijacking and route leaks
- SSL certificate domains: Detect certificate theft enabling MITM attacks`,
      },
      {
        title: "Section 3 — People & Personnel",
        content: `Monitor individuals associated with your organisation:
- VIP / Executive targets: C-suite and board members monitored for doxxing, credential exposure, and physical threat signals
- Key employees: Staff with elevated access — high-value credential targets
- Contractors & third parties: External personnel with system access — insider threat vector`,
      },
      {
        title: "Section 4 — Products & IP",
        content: `Protect your intellectual property:
- Product names: Monitor for counterfeiting, piracy, and unauthorised resale
- Internal project codenames: Detect leaks of confidential development names
- Trademarks & patents: Identify infringement and unauthorised use
- Source code identifiers: Detect leaked repositories or code fragments`,
      },
      {
        title: "Sections 5–7 — Social, Supply Chain & Keywords",
        content: `Section 5 — Social Media:
Monitor social handles for impersonation accounts and fake apps.

Section 6 — Supply Chain:
Monitor key suppliers and cloud platforms. A compromised supplier is a common attack vector for lateral movement into your network.

Section 7 — Custom Keywords:
Add internal jargon, codenames, or product identifiers that would only appear externally in the context of a leak. Use exclusion keywords to suppress false positives.`,
      },
    ],
  },
  {
    section: "Threat Types",
    icon: "⚑",
    articles: [
      {
        title: "Data Leak",
        content: `Severity: Critical
A dataset containing your organisational data has been posted or is being traded. This may include customer records, employee data, internal documents, or system credentials.

Response: Identify scope, notify legal counsel, assess GDPR 72-hour notification obligation, begin forensic investigation.`,
      },
      {
        title: "Credential Exposure",
        content: `Severity: High
Employee or system credentials matching your organisation were found in stealer logs or combo lists. These are actively used in credential stuffing and account takeover attacks.

Response: Force immediate password resets, revoke session tokens, enforce MFA on all affected accounts.`,
      },
      {
        title: "Phishing Kit",
        content: `Severity: Critical
An active phishing kit mimicking your brand, domain, or login portal has been detected. It is harvesting credentials in real time.

Response: Submit takedown to hosting provider and domain registrar. Notify customers via official channels.`,
      },
      {
        title: "Doxxing",
        content: `Severity: Critical
Personal information belonging to an executive or VIP has been publicly posted. Direct personal safety risk.

Response: Notify the individual privately and immediately. Brief physical security if applicable. Contact the hosting platform for urgent removal.`,
      },
      {
        title: "Exploit Listing",
        content: `Severity: High
A vulnerability in your systems or infrastructure is being actively traded. Exploitation may be imminent.

Response: Identify the affected system, apply patches or compensating controls immediately, increase monitoring for exploitation indicators.`,
      },
      {
        title: "Typosquat",
        content: `Severity: High
A domain visually similar to your real domain has been registered, likely for phishing or traffic hijacking.

Response: Document registration details, submit UDRP complaint, monitor for MX record configuration.`,
      },
    ],
  },
  {
    section: "Severity & Risk Scoring",
    icon: "▲",
    articles: [
      {
        title: "Severity Levels",
        content: `CRITICAL (score 7.5–10): Immediate action required within 1 hour. Engage incident response.
HIGH (score 5.0–7.4): Investigate same day within 4 hours.
MEDIUM (score 2.5–4.9): Review and respond within 24–48 hours.
LOW (score 0–2.4): Include in weekly review cycle.`,
      },
      {
        title: "Risk Score Calculation",
        content: `The overall risk score is calculated from all active findings:

score = min(10, Σ(finding weights) × 0.4)

Weights per finding:
- Critical = 4 points
- High = 2 points
- Medium = 1 point
- Low = 0.25 points

The score drives the risk bar colour: green (Low) → amber (Medium) → orange (High) → red (Critical, pulsing).`,
      },
    ],
  },
  {
    section: "Intel Feeds",
    icon: "◉",
    articles: [
      {
        title: "Open Source Feeds",
        content: `Four live API feeds are integrated:

URLhaus (abuse.ch): Malicious URL and malware distribution feed. No API key required. Works in browser.

AlienVault OTX: Domain and IP threat indicators from the Open Threat Exchange. Works without a key; add a key for higher rate limits.

PhishTank: Community-verified phishing URL database. Optional API key improves rate limits.

HaveIBeenPwned: Corporate email breach detection. Requires a paid API key. Needs a backend proxy on GitHub Pages.`,
      },
      {
        title: "CORS Limitations on GitHub Pages",
        content: `When deployed to GitHub Pages, browser security restrictions (CORS) block some API calls:

URLhaus: ✅ Works directly
AlienVault OTX: ✅ Works directly
PhishTank: ⚠ May be blocked
HaveIBeenPwned: ❌ Requires server proxy

To use HIBP on GitHub Pages, deploy a serverless proxy function (Vercel Functions, Netlify Functions, or Cloudflare Workers) that calls the HIBP API server-side and forwards the response.`,
      },
    ],
  },
  {
    section: "Reports",
    icon: "◎",
    articles: [
      {
        title: "Executive Report",
        content: `Designed for board-level and C-suite briefings.

Contains:
- Current risk posture and score
- KPI summary (critical, high, medium, low counts)
- Board-level recommendations with urgency guidance

Best used for: Weekly security updates to leadership, board packs, quarterly risk reviews.`,
      },
      {
        title: "Operational Report",
        content: `Designed for SOC analysts and security managers.

Contains:
- Full findings log with source, type, severity, and timestamp
- Detailed context per finding
- Analyst action queue

Best used for: Daily security standups, incident investigation, analyst handover.`,
      },
      {
        title: "Exporting to PDF",
        content: `Click "PRINT / EXPORT PDF" after generating a report. In the browser print dialog, select "Save as PDF" as the destination.

Tips for clean PDF output:
- Use Chrome or Edge for best results
- Set margins to "None" or "Minimum" in the print dialog
- Disable "Headers and footers" in the print dialog
- The UI chrome (tabs, header) is automatically hidden in print mode`,
      },
    ],
  },
  {
    section: "Alert Channels",
    icon: "◈",
    articles: [
      {
        title: "Configuring Alerts",
        content: `Four notification channels are available:

Email: Send alerts to one or more recipients. Supports daily digest mode to bundle all findings into a single summary.

Slack: Post findings to a Slack channel via incoming webhook. Configure the bot name and minimum severity threshold.

Webhook: POST or PUT findings to any HTTPS endpoint (SIEM, SOAR, custom backend). Supports bearer token authentication.

SMS: Send critical alerts via Twilio, AWS SNS, or Vonage. Recommended for Critical severity only due to per-message cost.`,
      },
      {
        title: "Severity Thresholds",
        content: `Each alert channel has its own minimum severity threshold:

- Recommended email threshold: High (receive Critical + High findings)
- Recommended Slack threshold: High  
- Recommended webhook threshold: Medium or High (for SIEM ingestion)
- Recommended SMS threshold: Critical only

Setting all channels to "Low" will generate high alert volume including routine findings.`,
      },
      {
        title: "Simulation Mode",
        content: `The ▶ TEST button on each channel simulates delivery only. No real alert is sent.

Live alert delivery requires a backend integration. The current frontend-only architecture stores channel configuration in memory but does not transmit alerts directly from the browser (email and SMS require server-side sending).

For production deployments, connect a backend proxy that receives webhook calls from the platform and dispatches to the configured channels.`,
      },
    ],
  },
];

export function DocScreen() {
  const [search, setSearch]         = useState("");
  const [openArticle, setOpenArticle] = useState(null);

  const filtered = search.trim()
    ? DOCS.map((s) => ({ ...s, articles: s.articles.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase())) })).filter((s) => s.articles.length > 0)
    : DOCS;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ff9500", letterSpacing: "0.12em", marginBottom: 10 }}>◎ DOCUMENTATION</div>
        <input
          placeholder="Search documentation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "9px 12px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
        />
      </div>

      {filtered.map((section) => (
        <div key={section.section} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#ff9500" }}>{section.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em" }}>{section.section.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {section.articles.map((article) => {
              const key = `${section.section}::${article.title}`;
              const isOpen = openArticle === key;
              return (
                <div key={article.title} style={{ border: `1px solid ${isOpen ? "rgba(255,149,0,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, overflow: "hidden", transition: "border-color 0.2s" }}>
                  <div onClick={() => setOpenArticle(isOpen ? null : key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", background: isOpen ? "rgba(255,149,0,0.06)" : "rgba(255,255,255,0.02)", userSelect: "none" }}>
                    <span style={{ fontSize: 11, color: isOpen ? "#ff9500" : "rgba(255,255,255,0.75)", fontWeight: isOpen ? 700 : 400 }}>{article.title}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "12px 14px 14px", borderTop: "1px solid rgba(255,149,0,0.12)", background: "rgba(0,0,0,0.1)" }}>
                      {article.content.split("\n\n").map((para, i) => (
                        <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, margin: i === 0 ? 0 : "10px 0 0", whiteSpace: "pre-line" }}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>No articles matching "{search}"</div>
      )}
    </div>
  );
}
