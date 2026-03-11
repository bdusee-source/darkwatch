import { useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "overview",
    icon: "⬡",
    label: "Overview",
    content: <OverviewSection />,
  },
  {
    id: "quickstart",
    icon: "▶",
    label: "Quick Start",
    content: <QuickStartSection />,
  },
  {
    id: "signals",
    icon: "◈",
    label: "Signal Types",
    content: <SignalsSection />,
  },
  {
    id: "config",
    icon: "⚙",
    label: "Configuration",
    content: <ConfigSection />,
  },
  {
    id: "results",
    icon: "▦",
    label: "Results & Triage",
    content: <ResultsSection />,
  },
  {
    id: "intel",
    icon: "◉",
    label: "Intel Feeds",
    content: <IntelSection />,
  },
  {
    id: "notifications",
    icon: "⚑",
    label: "Notifications",
    content: <NotificationsSection />,
  },
  {
    id: "import-export",
    icon: "↕",
    label: "Import / Export",
    content: <ImportExportSection />,
  },
  {
    id: "validation",
    icon: "✓",
    label: "Input Validation",
    content: <ValidationSection />,
  },
  {
    id: "accessibility",
    icon: "◎",
    label: "Accessibility",
    content: <AccessibilitySection />,
  },
  {
    id: "faq",
    icon: "?",
    label: "FAQ",
    content: <FaqSection />,
  },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function DocH1({ children }) {
  return <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.4px" }}>{children}</h1>;
}
function DocH2({ children }) {
  return <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: "28px 0 10px", borderBottom: "1px solid #1e293b", paddingBottom: 8 }}>{children}</h2>;
}
function DocH3({ children }) {
  return <h3 style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", margin: "20px 0 8px" }}>{children}</h3>;
}
function DocP({ children }) {
  return <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: "0 0 14px" }}>{children}</p>;
}
function DocCode({ children }) {
  return <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: "#0d1117", border: "1px solid #1e293b", borderRadius: 5, padding: "1px 6px", color: "#fb923c" }}>{children}</code>;
}
function DocNote({ children, type = "info" }) {
  const colors = { info: "#3b82f6", warn: "#f59e0b", danger: "#ef4444", success: "#22c55e" };
  const c = colors[type];
  return (
    <div style={{ padding: "10px 14px", background: `${c}0d`, border: `1px solid ${c}25`, borderLeft: `3px solid ${c}`, borderRadius: 8, marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.65 }}>{children}</p>
    </div>
  );
}
function DocTable({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 20 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: "#0d1117", color: "#64748b", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #1e293b" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #0f172a" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "9px 12px", color: j === 0 ? "#e2e8f0" : "#64748b", fontFamily: j === 0 ? "'JetBrains Mono', monospace" : "inherit", fontSize: j === 0 ? 12 : 13, verticalAlign: "top" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function StepList({ steps }) {
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: "0 0 20px", counterReset: "steps" }}>
      {steps.map((s, i) => (
        <li key={i} style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
          <div style={{ paddingTop: 3, fontSize: 14, color: "#94a3b8", lineHeight: 1.65 }}>{s}</div>
        </li>
      ))}
    </ol>
  );
}
function Pill({ label, color = "#f97316" }) {
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}35`, color, marginRight: 5, marginBottom: 4 }}>{label}</span>;
}

// ─── Sections ────────────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div>
      <DocH1>DARKWATCH Intelligence Platform</DocH1>
      <p style={{ fontSize: 13, color: "#475569", margin: "0 0 24px" }}>Version 2.0 · Defensive use only</p>

      <DocP>
        DARKWATCH is a brand and infrastructure threat-monitoring dashboard. It continuously sweeps dark-web forums, paste sites, credential markets, Telegram channels, ransomware blogs, and open-source intelligence feeds to surface mentions, leaks, and attacks targeting your organisation — before they become incidents.
      </DocP>

      <DocNote type="warn">
        <strong style={{ color: "#fbbf24" }}>Defensive use only.</strong> Intelligence gathered by DARKWATCH is intended exclusively for protective security operations. Results do not constitute legal evidence and must not be used offensively.
      </DocNote>

      <DocH2>What's new in v2.0</DocH2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { icon: "💾", title: "Persistent config", desc: "All settings auto-save to localStorage. Your configuration survives page refreshes and browser restarts." },
          { icon: "↕", title: "Import / Export", desc: "Download your entire setup as a versioned JSON file and share or restore it instantly." },
          { icon: "⇥", title: "Bulk import", desc: "Paste comma- or newline-separated lists into any tag field — no more one-at-a-time entry." },
          { icon: "✓", title: "Input validation", desc: "Fields validate IPs (CIDR), ASNs, domains, email patterns, phone numbers, and ticker symbols before accepting input." },
          { icon: "⌕", title: "Search & sort", desc: "Full-text search across the threat feed plus sort by recency or severity." },
          { icon: "◫", title: "Threat detail modal", desc: "Click any threat card to open a full detail panel. Close with Escape or click outside." },
          { icon: "⚑", title: "Triage workflow", desc: "Mark findings as Investigating, False Positive, or Resolved. Status badges appear inline on cards." },
          { icon: "↗", title: "Trend sparkline", desc: "Live SVG chart showing threat volume across the last 20 scan cycles." },
          { icon: "🏗", title: "Refactored hooks", desc: "State split into useMonitoringConfig and useAlertConfig custom hooks for maintainability." },
          { icon: "🙈", title: "Masked secrets", desc: "API keys, tokens, and webhook URLs are hidden by default with a toggle to reveal." },
          { icon: "⌨", title: "Keyboard accessible", desc: "All interactive elements support keyboard navigation. Modal closes on Escape." },
          { icon: "📱", title: "Mobile responsive", desc: "Sidebar collapses on small screens with a hamburger menu and dark overlay." },
        ].map((f) => (
          <div key={f.title} style={{ padding: "14px 16px", background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10 }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <DocH2>Architecture</DocH2>
      <DocP>DARKWATCH is a single-page React application. It ships with no backend — all scanning is simulated client-side. To enable live threat intelligence you must supply API keys for the supported feeds (HIBP, URLhaus, PhishTank, OTX, and optional paid providers).</DocP>

      <DocTable
        headers={["Layer", "Technology", "Notes"]}
        rows={[
          ["UI", "React 18 + inline styles", "No CSS framework dependency"],
          ["State", "useState / useCallback / useMemo", "Split into custom hooks in v2.0"],
          ["Persistence", "localStorage", "Key: darkwatch_config_v1"],
          ["Fonts", "Inter + JetBrains Mono", "Loaded from Google Fonts"],
          ["Scan engine", "useScanEngine hook", "Simulated; wire to real API for production"],
          ["Intel feeds", "useIntelFeeds hook", "HIBP, URLhaus, PhishTank, OTX"],
        ]}
      />
    </div>
  );
}

function QuickStartSection() {
  return (
    <div>
      <DocH1>Quick Start</DocH1>
      <DocP>Get monitoring in under two minutes.</DocP>

      <StepList steps={[
        <span>Open the <strong style={{ color: "#f1f5f9" }}>Scanner</strong> tab (default view).</span>,
        <span>Enter your <strong style={{ color: "#f1f5f9" }}>Primary brand name</strong> in the Brand Identity section. This is the only required field.</span>,
        <span>Optionally expand the other sections and add domains, IPs, personnel, keywords, and so on to sharpen detection coverage.</span>,
        <span>Under <strong style={{ color: "#f1f5f9" }}>Scan Configuration</strong>, choose which source types to monitor and enable at least one alert channel.</span>,
        <span>Click <strong style={{ color: "#f97316" }}>Activate Monitoring</strong>. DARKWATCH will begin sweeping immediately and take you to the Results screen.</span>,
        <span>On the Results screen, use the <strong style={{ color: "#f1f5f9" }}>search bar</strong>, <strong style={{ color: "#f1f5f9" }}>filters</strong>, and <strong style={{ color: "#f1f5f9" }}>sort</strong> to navigate findings. Click any threat card to open the detail panel and set a triage status.</span>,
      ]} />

      <DocNote type="success">
        Your configuration is saved automatically. If you close the browser and return, all your signals and settings will still be there.
      </DocNote>

      <DocH2>Returning users — restoring a saved config</DocH2>
      <StepList steps={[
        "On the Setup screen, click ↑ Import config.",
        "Select a darkwatch-config.json file exported from a previous session.",
        "All fields are populated instantly. Review and click Activate Monitoring.",
      ]} />
    </div>
  );
}

function SignalsSection() {
  return (
    <div>
      <DocH1>Signal Types</DocH1>
      <DocP>A <em>signal</em> is any piece of identifying information you give DARKWATCH to monitor. The more signals you configure, the more precisely the engine can match and de-duplicate findings.</DocP>

      <DocH2>Brand Identity</DocH2>
      <DocTable
        headers={["Field", "Format", "Purpose"]}
        rows={[
          ["Primary brand name", "Free text", "Core search term used across all sources. Required."],
          ["Industry / sector", "Free text", "Scopes correlation to sector-specific threat actor groups."],
          ["Stock ticker symbols", "1–5 uppercase letters, e.g. ACME", "Monitors financial impersonation and market manipulation chatter."],
          ["Legal entity names", "Free text", "Catches mentions of holding companies and subsidiaries."],
        ]}
      />

      <DocH2>Digital Infrastructure</DocH2>
      <DocTable
        headers={["Field", "Format", "Purpose"]}
        rows={[
          ["Domains & subdomains", "acme.com or *.acme.com", "Typosquatting, phishing kits, impersonating sites."],
          ["Corporate email domains", "@acme.com", "Credential leak matching against your email pattern."],
          ["IP ranges / CIDR", "203.0.113.0/24", "Scans for mentions of your address space on exploit forums."],
          ["ASN numbers", "AS12345", "Monitors BGP hijack chatter and ASN-level targeting."],
          ["SSL certificate domains", "*.acme.com", "Certificates issued for lookalike domains."],
        ]}
      />

      <DocH2>People & Personnel</DocH2>
      <DocNote type="warn">Executive and employee monitoring is for <strong style={{ color: "#fbbf24" }}>defensive purposes only</strong>. Ensure your organisation's privacy and data policies permit this before adding personnel.</DocNote>
      <DocTable
        headers={["Field", "Format", "Purpose"]}
        rows={[
          ["Executives & VIPs", "Full name, title", "Doxxing, impersonation, physical threat chatter."],
          ["Key employees", "Email or full name", "Credential leaks, targeted phishing."],
          ["Contractors & third parties", "Company or individual name", "Supply-chain risk and third-party breaches."],
        ]}
      />

      <DocH2>Products & IP</DocH2>
      <DocTable
        headers={["Field", "Format", "Purpose"]}
        rows={[
          ["Product names", "Free text", "Counterfeits, cracked software, brand abuse."],
          ["Internal project codenames", "Free text", "Detect insider leaks — these should never appear externally."],
          ["Trademarks & patents", "Free text inc. ™ / ®", "Brand abuse and IP theft monitoring."],
          ["Source code identifiers", "Repo names, package IDs", "Leaked or cloned source code on paste sites and GitHub."],
        ]}
      />

      <DocH2>Keywords & Exclusions</DocH2>
      <DocP>Use <strong style={{ color: "#f1f5f9" }}>monitor keywords</strong> to catch phrases that wouldn't appear in standard brand searches — for example <DocCode>"acme breach"</DocCode> or <DocCode>"acme credentials"</DocCode>.</DocP>
      <DocP>Use <strong style={{ color: "#f1f5f9" }}>exclusion keywords</strong> to suppress false positives. For example, adding <DocCode>acme cartoon</DocCode> prevents hits from Looney Tunes references swamping your feed.</DocP>
    </div>
  );
}

function ConfigSection() {
  return (
    <div>
      <DocH1>Configuration</DocH1>

      <DocH2>Coverage bar</DocH2>
      <DocP>The orange progress bar at the top of the Setup screen reflects your total configured signal count. It fills up to a maximum of 20 signals. More signals means higher detection fidelity — aim to fill it completely for comprehensive coverage.</DocP>

      <DocH2>Source types</DocH2>
      <DocTable
        headers={["Source", "What it covers"]}
        rows={[
          ["Hacker Forums", "XSS, Exploit.in, RaidForums mirrors, and similar underground forums."],
          ["Paste Sites", "Pastebin, Ghostbin, and other public paste services."],
          ["Marketplaces", "Dark-web shops selling stolen data, credentials, and access."],
          ["Telegram", "Public and semi-public Telegram channels used by threat actors."],
          ["IRC", "Legacy IRC networks still used by some threat communities."],
          ["Combo Lists", "Large credential combo lists circulated in the underground."],
          ["Stealer Logs", "Output files from infostealers like RedLine and Vidar."],
          ["Ransomware Blogs", "Victim-shaming leak sites operated by ransomware groups."],
        ]}
      />

      <DocH2>Persistent storage</DocH2>
      <DocP>All configuration is automatically saved to <DocCode>localStorage</DocCode> under the key <DocCode>darkwatch_config_v1</DocCode> every time any field changes. No manual save step is required. To clear stored config, use the browser's DevTools Application → Local Storage panel, or click <strong style={{ color: "#f1f5f9" }}>Reset & reconfigure</strong> on the Results screen.</DocP>

      <DocNote type="info">
        Configuration is stored per browser origin. If you access DARKWATCH from a different browser, device, or incognito window, use the Export / Import workflow to transfer your setup.
      </DocNote>
    </div>
  );
}

function ResultsSection() {
  return (
    <div>
      <DocH1>Results & Triage</DocH1>

      <DocH2>Risk score</DocH2>
      <DocP>The risk score (0–10) is calculated from the number and severity of active findings. It is recalculated after every scan cycle.</DocP>
      <DocTable
        headers={["Score", "Label", "Recommended action"]}
        rows={[
          ["0–2", "Minimal", "Review findings weekly."],
          ["3–4", "Low", "Schedule analyst review within the week."],
          ["5–6", "Moderate", "Assign to SOC within 24 hours."],
          ["7–8", "High", "Escalate immediately; notify CISO."],
          ["9–10", "Critical", "Activate incident response procedures."],
        ]}
      />

      <DocH2>Search</DocH2>
      <DocP>The search bar at the top of the feed performs a real-time full-text search across threat <strong style={{ color: "#f1f5f9" }}>title</strong>, <strong style={{ color: "#f1f5f9" }}>type</strong>, <strong style={{ color: "#f1f5f9" }}>source</strong>, and <strong style={{ color: "#f1f5f9" }}>description</strong> fields. The results list updates instantly as you type.</DocP>

      <DocH2>Filters</DocH2>
      <DocP>The filter pills narrow the feed by severity level or threat type. Filters and search can be combined — only results that match both the active filter and the search query are shown.</DocP>

      <DocH2>Sort order</DocH2>
      <DocTable
        headers={["Option", "Behaviour"]}
        rows={[
          ["Newest first", "Most recently detected threats appear at the top (default)."],
          ["Oldest first", "Reverse chronological — useful for reviewing a backlog."],
          ["Severity", "Critical findings appear first, then High, Medium, Low."],
        ]}
      />

      <DocH2>Threat detail modal</DocH2>
      <DocP>Click any threat card to open the detail panel. The panel shows the full description, source attribution, detection timestamp, and the triage control. Close it by pressing <DocCode>Escape</DocCode>, clicking the × button, or clicking the dark overlay behind the panel.</DocP>

      <DocH2>Triage workflow</DocH2>
      <DocP>Every finding can be assigned one of four triage statuses. Set the status inside the threat detail modal.</DocP>
      <DocTable
        headers={["Status", "Meaning", "Badge colour"]}
        rows={[
          ["Open", "Unreviewed (default). No badge shown.", "—"],
          ["Investigating", "An analyst is actively investigating this finding.", "Amber"],
          ["False Positive", "Confirmed as a false alarm. Will still appear in the feed until the next reset.", "Green"],
          ["Resolved", "Finding has been remediated or acknowledged.", "Blue"],
        ]}
      />
      <DocNote type="info">Triage statuses are stored in React state only and are not persisted across sessions. Use the Export feature to capture a snapshot of your feed before resetting.</DocNote>

      <DocH2>Trend sparkline</DocH2>
      <DocP>The small line chart next to the scan metadata shows threat volume across the last 20 scan cycles. An upward-pointing arrow (↑, red) indicates increasing threat activity. A downward arrow (↓, green) means the feed is quietening. A flat arrow (→, grey) indicates no change.</DocP>
    </div>
  );
}

function IntelSection() {
  return (
    <div>
      <DocH1>Intel Feeds</DocH1>
      <DocP>The Intel Feeds tab configures connections to open and commercial threat intelligence sources. Findings from these feeds are merged into the main threat feed and tagged with their origin.</DocP>

      <DocH2>Free feeds</DocH2>
      <DocTable
        headers={["Feed", "Covers", "API key required"]}
        rows={[
          ["Have I Been Pwned (HIBP)", "Email and domain exposure in known data breaches.", "Yes — free tier available at haveibeenpwned.com/API/Key"],
          ["URLhaus", "Malicious URLs and phishing domains.", "No"],
          ["PhishTank", "Community-verified phishing URLs.", "Optional — higher rate limits with key"],
          ["AlienVault OTX", "Indicators of compromise, malware hashes, threat actor TTPs.", "Yes — free at otx.alienvault.com"],
        ]}
      />

      <DocH2>Paid feeds</DocH2>
      <DocTable
        headers={["Feed", "Speciality"]}
        rows={[
          ["Recorded Future", "Predictive intelligence, dark-web actor tracking."],
          ["DarkOwl", "Dark-web crawling at scale, stealer log ingestion."],
          ["Flare", "Illicit community monitoring, data leak detection."],
          ["Intel 471", "Underground forum infiltration, threat actor profiling."],
          ["Cybersixgill", "Real-time dark-web stream, automated IOC extraction."],
        ]}
      />
      <DocNote type="warn">Paid feed credentials are masked by default. Click the 👁 icon to reveal a field. Never share your config export file publicly as it contains plaintext secrets.</DocNote>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <DocH1>Notifications</DocH1>
      <DocP>DARKWATCH supports four alert delivery channels. Enable each channel in the Scan Configuration section and configure its settings below.</DocP>

      <DocNote type="info">
        <strong style={{ color: "#93c5fd" }}>Simulation mode:</strong> Without a backend integration, all test sends produce simulated alerts only. Live delivery requires a server-side proxy to forward payloads.
      </DocNote>

      <DocH2>Email</DocH2>
      <DocTable
        headers={["Setting", "Description"]}
        rows={[
          ["Recipients", "Comma-separated list of email addresses to notify."],
          ["Subject prefix", "Prepended to every alert subject line. Default: [DARKWATCH]."],
          ["Minimum severity", "Only findings at this severity or above trigger an alert."],
          ["Daily digest", "Instead of per-alert emails, bundle all findings into one daily summary."],
        ]}
      />

      <DocH2>Slack</DocH2>
      <DocTable
        headers={["Setting", "Description"]}
        rows={[
          ["Webhook URL", "Incoming webhook URL from your Slack app. Masked by default."],
          ["Channel", "Override the webhook's default channel. Include the #."],
          ["Bot name", "Display name for the bot in Slack. Default: DARKWATCH."],
          ["Minimum severity", "Severity threshold for Slack alerts."],
        ]}
      />

      <DocH2>Webhook (SIEM / SOAR)</DocH2>
      <DocTable
        headers={["Setting", "Description"]}
        rows={[
          ["Endpoint URL", "Your SIEM or SOAR ingest endpoint."],
          ["Bearer token", "Authorization header value. Masked by default."],
          ["HTTP method", "POST or PUT. Default: POST."],
          ["Minimum severity", "Only findings at this level or above are forwarded."],
        ]}
      />

      <DocH2>SMS</DocH2>
      <DocTable
        headers={["Setting", "Description"]}
        rows={[
          ["Phone numbers", "E.164 format (e.g. +442071234567), comma-separated."],
          ["Provider", "Twilio, AWS SNS, or Vonage."],
          ["Account SID / API key", "Provider account identifier. Masked by default."],
          ["Auth token / secret", "Provider authentication credential. Masked by default."],
          ["Minimum severity", "Critical is recommended for SMS to avoid alert fatigue."],
        ]}
      />

      <DocH2>Testing a channel</DocH2>
      <StepList steps={[
        "Enable the channel by toggling it on.",
        "Fill in all required fields.",
        "Click the Test button on the right side of the channel header.",
        "A simulated alert is sent. A ✓ Sent confirmation appears if the payload was accepted.",
      ]} />
    </div>
  );
}

function ImportExportSection() {
  return (
    <div>
      <DocH1>Import / Export</DocH1>
      <DocP>The Import / Export bar at the top of the Setup screen lets you back up, restore, and share your monitoring configuration.</DocP>

      <DocH2>Exporting your config</DocH2>
      <StepList steps={[
        "Click ↓ Export config on the Setup screen.",
        "A file named darkwatch-config.json is downloaded to your default downloads folder.",
        "The JSON file includes all configured signals, source selections, and alert channel settings (including API keys in plaintext — keep the file secure).",
      ]} />

      <DocH2>Importing a config</DocH2>
      <StepList steps={[
        "Click ↑ Import config on the Setup screen.",
        "Select a darkwatch-config.json file.",
        "All fields are populated immediately. A green ✓ confirmation appears.",
        "Review the imported signals, then click Activate Monitoring.",
      ]} />

      <DocNote type="warn">
        Importing overwrites all current setup fields. If you want to merge configs, export first, merge the JSON files manually, then re-import.
      </DocNote>

      <DocH2>Config file format</DocH2>
      <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94a3b8", lineHeight: 1.8, marginBottom: 20, overflowX: "auto" }}>
        {`{
  "_darkwatch": true,
  "version": 1,
  "brand": "Acme Corporation",
  "industry": "Financial Services",
  "domains": ["acme.com", "acme.io"],
  "ips": ["203.0.113.0/24"],
  "vips": ["Jane Smith, CEO"],
  "keywords": ["acme breach", "acme credentials"],
  "monitorSources": ["forums", "paste", "markets"],
  ...
}`}
      </div>
      <DocNote type="danger">The config file contains API keys and auth tokens in plaintext. Treat it with the same care as a password file. Do not commit it to version control or share it publicly.</DocNote>
    </div>
  );
}

function ValidationSection() {
  return (
    <div>
      <DocH1>Input Validation</DocH1>
      <DocP>DARKWATCH validates tag values before adding them to any field. If a value doesn't match the expected format, an inline error message is shown and the tag is not added.</DocP>

      <DocH2>Validation rules by field</DocH2>
      <DocTable
        headers={["Field type", "Expected format", "Examples"]}
        rows={[
          ["Domain", "hostname.tld or *.hostname.tld", "acme.com, *.acme.com, acme.co.uk"],
          ["Email domain", "@domain.tld or domain.tld", "@acme.com, acme.com"],
          ["IP / CIDR", "x.x.x.x or x.x.x.x/prefix", "203.0.113.1, 10.0.0.0/8"],
          ["ASN", "AS followed by digits", "AS12345, AS64512"],
          ["Phone (SMS)", "E.164 — + then 7–15 digits", "+442071234567, +14155552671"],
          ["Ticker symbol", "1–5 uppercase letters", "ACME, MSFT, GOOGL"],
          ["All other fields", "Any non-empty string", "—"],
        ]}
      />

      <DocH2>Bulk import validation</DocH2>
      <DocP>When using the bulk import textarea, each item in the pasted list is validated individually. Items that fail validation are silently skipped. Items that are already in the tag list are also skipped (no duplicates). A count of successfully imported items is not shown — invalid items do not cause an error message for the whole batch; only invalid single entries in the regular input field show an error.</DocP>

      <DocH2>Keyboard shortcut</DocH2>
      <DocP>In the single-entry input, pressing <DocCode>Enter</DocCode> or <DocCode>,</DocCode> (comma) submits the current value. This lets you type multiple tags in quick succession without reaching for the + button.</DocP>
    </div>
  );
}

function AccessibilitySection() {
  return (
    <div>
      <DocH1>Accessibility</DocH1>
      <DocP>DARKWATCH v2.0 improves keyboard and screen-reader support throughout the interface.</DocP>

      <DocH2>Keyboard navigation</DocH2>
      <DocTable
        headers={["Element", "Keyboard behaviour"]}
        rows={[
          ["Sidebar tabs", "Tab to focus, Enter to activate."],
          ["Toggle switches (notification channels)", "Tab to focus, Enter to toggle on/off."],
          ["Tag input fields", "Enter or , to add the current value."],
          ["+ button (tag input)", "Tab to focus, Enter to submit."],
          ["Threat detail modal", "Escape to close."],
          ["Triage buttons (inside modal)", "Tab between options, Enter to select."],
          ["Filter pills (results screen)", "Tab between pills, Enter to activate."],
        ]}
      />

      <DocH2>ARIA attributes</DocH2>
      <DocP>Key interactive elements carry ARIA attributes to support screen readers:</DocP>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {["aria-label", "aria-pressed", "aria-current", "aria-modal", "aria-disabled", "role=\"dialog\"", "role=\"button\""].map((a) => (
          <Pill key={a} label={a} color="#3b82f6" />
        ))}
      </div>

      <DocH2>Mobile layout</DocH2>
      <DocP>On screens narrower than 768 px, the sidebar slides off-screen and a hamburger (☰) button appears in the top-left corner. Tapping the button opens the sidebar with a dark overlay; tapping the overlay or selecting a tab closes it again.</DocP>

      <DocNote type="info">Print styles hide the sidebar, mobile button, and all interactive controls so that printed reports are clean.</DocNote>
    </div>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: "Why aren't I seeing any threats after activating?",
      a: "DARKWATCH uses a simulated scan engine by default. Real findings require live API keys in the Intel Feeds tab. The simulated engine generates representative findings after one or two scan cycles — wait up to 60 seconds after activation.",
    },
    {
      q: "My configuration disappeared after a browser update.",
      a: "Some browser updates clear localStorage for security reasons. Always export your config before updating. The exported JSON file can be re-imported instantly from the Setup screen.",
    },
    {
      q: "Can I monitor multiple brands simultaneously?",
      a: "The current version monitors one primary brand per session. To switch brands, use Export config to save your current setup, click Reset & reconfigure, then set up the new brand. Import the old config later to restore.",
    },
    {
      q: "What does 'False Positive' do to a finding?",
      a: "Marking a finding as False Positive assigns it a green badge. It remains visible in the feed for the current session. On the next scan cycle, the scan engine may re-surface the same finding — triage status is not fedback to the scan engine in the current version.",
    },
    {
      q: "Why is the trend sparkline not showing?",
      a: "The sparkline requires at least two completed scan cycles to render. It will appear automatically after the second sweep completes.",
    },
    {
      q: "Are my API keys safe?",
      a: "API keys are stored in React state (in-memory) and in localStorage on your device. They are never transmitted to any DARKWATCH server. However, if you export your config, the JSON file contains keys in plaintext — protect this file accordingly.",
    },
    {
      q: "The mobile sidebar isn't closing.",
      a: "Tap the dark overlay behind the sidebar, or select any tab inside the sidebar. If the overlay isn't visible, scroll up — it covers the full viewport height.",
    },
    {
      q: "How do I clear all data and start fresh?",
      a: "Click Reset & reconfigure on the Results screen, or go to Setup → scroll down → activate monitoring with a new brand name. To also clear localStorage, open browser DevTools → Application → Local Storage and delete the darkwatch_config_v1 key.",
    },
  ];

  return (
    <div>
      <DocH1>Frequently Asked Questions</DocH1>
      <div style={{ marginTop: 20 }}>
        {faqs.map((f, i) => (
          <FaqItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #1e293b", marginBottom: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: open ? "#f97316" : "#e2e8f0", lineHeight: 1.4 }}>{q}</span>
        <span style={{ fontSize: 18, color: "#475569", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "0 0 16px", fontSize: 14, color: "#94a3b8", lineHeight: 1.75, animation: "slideDown 0.15s ease" }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main DocScreen ───────────────────────────────────────────────────────────

export function DocScreen() {
  const [activeSection, setActiveSection] = useState("overview");
  const current = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 120px)" }}>

      {/* Doc sidebar */}
      <nav style={{ width: 200, flexShrink: 0, paddingRight: 24, borderRight: "1px solid #1e293b", marginRight: 36 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Documentation</div>
        {SECTIONS.map((s) => {
          const active = s.id === activeSection;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              aria-current={active ? "page" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, cursor: "pointer", border: "none", textAlign: "left", marginBottom: 1, background: active ? "rgba(249,115,22,0.08)" : "transparent", color: active ? "#fb923c" : "#64748b", fontWeight: active ? 600 : 400, fontSize: 13, transition: "all 0.15s" }}
            >
              <span style={{ fontSize: 11, width: 14, textAlign: "center", flexShrink: 0, opacity: 0.8 }}>{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* Doc content */}
      <div style={{ flex: 1, maxWidth: 720, paddingBottom: 60, animation: "fadeIn 0.15s ease" }} key={activeSection}>
        {current?.content}
      </div>
    </div>
  );
}
