import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const RESCAN_INTERVAL_MS = 30000; // 30s demo cycle (production: hourly)

const THREAT_POOL = [
  { id: 1,  type: "data_leak",     severity: "critical", source: "RaidForums Mirror",        content: "Database dump containing customer records allegedly from {BRAND} internal systems. 2.3M records including emails and hashed passwords.", tor: "raidmirr3x...onion" },
  { id: 2,  type: "mention",       severity: "high",     source: "BlackHat Forum #darkops",   content: "{BRAND} API keys circulating in thread. Multiple actors discussing exploitation windows before patch cycle.", tor: "bhf44xop...onion" },
  { id: 3,  type: "sale",          severity: "critical", source: "Empire Marketplace Clone",  content: "Seller offering alleged {BRAND} internal source code. Claims stolen via supply chain compromise. Price: 12 BTC.", tor: "emp1re9k...onion" },
  { id: 4,  type: "mention",       severity: "medium",   source: "Telegram: LeakedDB",        content: "Thread discussing {BRAND} security posture and potential attack vectors. 340 members viewing.", tor: "t.me/leakeddb" },
  { id: 5,  type: "credential",    severity: "high",     source: "Stealer Log Aggregator",    content: "47 corporate credentials matching @{BRAND_DOMAIN} detected in fresh stealer log batch.", tor: "stealerx7...onion" },
  { id: 6,  type: "doxxing",       severity: "critical", source: "Doxbin",                    content: "Personal information posted for {VIP}. Includes home address, phone, family members listed.", tor: "doxb1n9x...onion" },
  { id: 7,  type: "credential",    severity: "high",     source: "Combo List Exchange",       content: "{VIP} email found in credential stuffing list. Password hash included. Active trading thread.", tor: "combxch4...onion" },
  { id: 8,  type: "mention",       severity: "medium",   source: "XSS Forum",                 content: "Discussion thread referencing {VIP} LinkedIn patterns. Social engineering preparation suspected.", tor: "xss3r9fx...onion" },
  { id: 9,  type: "mention",       severity: "high",     source: "Exploit.in",                content: "Internal codename '{PROJECT}' referenced in conversation about upcoming coordinated attack campaign.", tor: "exploitin8...onion" },
  { id: 10, type: "data_leak",     severity: "medium",   source: "Paste Site (TOR)",          content: "Configuration fragment mentioning '{PROJECT}' infrastructure endpoints. Likely insider or contractor leak.", tor: "pastemirr...onion" },
  { id: 11, type: "phishing",      severity: "critical", source: "PhishTank TOR Mirror",      content: "Active phishing kit mimicking {DOMAIN} login portal. Hosted on bulletproof infra. 1,200 victims captured in 48h.", tor: "phishx9k...onion" },
  { id: 12, type: "typosquat",     severity: "high",     source: "Domain Squatter Exchange",  content: "Typosquatted domain based on '{DOMAIN}' registered and listed for sale. MX records configured for spear-phishing.", tor: "squat4x7...onion" },
  { id: 13, type: "exploit",       severity: "high",     source: "0day.today Mirror",         content: "IP range {IP_RANGE} flagged in active exploitation thread. Unpatched RCE vector being traded for $4,200.", tor: "0daymir...onion" },
  { id: 14, type: "counterfeit",   severity: "high",     source: "Darknet Markets (Hydra)",   content: "Counterfeit versions of '{PRODUCT}' being sold at 70% discount. Listings across 3 marketplaces.", tor: "hydramir...onion" },
  { id: 15, type: "mention",       severity: "medium",   source: "IRC #secops",               content: "Keyword '{KEYWORD}' surfaced in coordinated threat actor channel. Context: upcoming breach announcement.", tor: "irc.dark...onion" },
  { id: 16, type: "impersonation", severity: "high",     source: "Telegram Actor Network",    content: "Fake {SOCIAL_HANDLE} account with 4.2K followers spreading malicious links impersonating official brand comms.", tor: "tg-mon...onion" },
  { id: 17, type: "data_leak",     severity: "critical", source: "BreachForums",              content: "SSL certificate private key allegedly for {CERT_DOMAIN} posted publicly. If valid, enables full MITM interception.", tor: "bforumx9...onion" },
  { id: 18, type: "mention",       severity: "medium",   source: "Supply Chain Intel Feed",   content: "Threat actor discussing compromise of {SUPPLIER} as stepping stone into {BRAND} network. Lateral movement planned.", tor: "scif3x...onion" },
  { id: 19, type: "credential",    severity: "critical", source: "RussianMarket",             content: "Fresh corporate cookie stealer session for {BRAND_DOMAIN} SSO portal — active session token, expires in 4h.", tor: "russmkt9...onion" },
  { id: 20, type: "sale",          severity: "high",     source: "BreachForums (new)",        content: "Claimed admin VPN credentials for {BRAND} corporate network. Seller has 94% positive reputation, 12 prior sales.", tor: "bf2024x...onion" },
  { id: 21, type: "mention",       severity: "medium",   source: "Telegram: DarkIntel",       content: "{BRAND} mentioned in threat actor group as potential Q4 campaign target. No specific timeline confirmed.", tor: "t.me/darkintel" },
  { id: 22, type: "data_leak",     severity: "high",     source: "AlphaBay Resurrection",     content: "Partial employee directory for {BRAND} posted as proof-of-access. 340 entries with roles and internal IDs.", tor: "albay7x...onion" },
  { id: 23, type: "exploit",       severity: "critical", source: "Exploit.in Premium",        content: "0-day exploit for {BRAND_DOMAIN} public-facing authentication endpoint. PoC code attached. No patch available.", tor: "explt9k...onion" },
  { id: 24, type: "phishing",      severity: "high",     source: "PhishLabs TOR Feed",        content: "New phishing campaign targeting {BRAND} customers via SMS (smishing). Kit includes real-time credential relay.", tor: "phishlb...onion" },
  { id: 25, type: "mention",       severity: "low",      source: "Forum: CrackingPro",        content: "{BRAND} account checkers circulating in low-tier cracking community. Low sophistication but high volume.", tor: "crackp4...onion" },
];

const THREAT_TYPES = {
  data_leak:     { label: "Data Leak",           color: "#ff2d55" },
  mention:       { label: "Mention",             color: "#ff9500" },
  sale:          { label: "Sale Listing",        color: "#ff2d55" },
  credential:    { label: "Credential Exposure", color: "#ff6b35" },
  doxxing:       { label: "Doxxing",             color: "#ff2d55" },
  phishing:      { label: "Phishing Kit",        color: "#ff2d55" },
  typosquat:     { label: "Typosquat",           color: "#ff6b35" },
  exploit:       { label: "Exploit Listing",     color: "#ff6b35" },
  counterfeit:   { label: "Counterfeit",         color: "#ff9500" },
  impersonation: { label: "Impersonation",       color: "#ff6b35" },
};

const SEVERITY_CONFIG = {
  critical: { color: "#ff2d55", bg: "rgba(255,45,85,0.12)",  label: "CRITICAL", weight: 4 },
  high:     { color: "#ff6b35", bg: "rgba(255,107,53,0.12)", label: "HIGH",     weight: 2 },
  medium:   { color: "#ff9500", bg: "rgba(255,149,0,0.12)",  label: "MEDIUM",   weight: 1 },
  low:      { color: "#30d158", bg: "rgba(48,209,88,0.08)",  label: "LOW",      weight: 0.25 },
};

// ─── Risk level calculation ───────────────────────────────────────────────────
function calcRisk(results) {
  if (!results.length) return { level: "NONE", color: "#30d158", bg: "rgba(48,209,88,0.08)", score: 0, label: "NO THREATS DETECTED", sublabel: "Monitoring active — no signals found", gradient: "#30d158, #30d158" };
  const score = Math.min(10, results.reduce((acc, r) => acc + (SEVERITY_CONFIG[r.severity]?.weight || 0), 0) * 0.4);
  if (score >= 7.5) return { level: "CRITICAL", color: "#ff2d55", bg: "rgba(255,45,85,0.15)", score: score.toFixed(1), label: "CRITICAL RISK — IMMEDIATE ACTION REQUIRED", sublabel: "Active threats detected. Engage incident response now.", gradient: "#ff0040, #ff2d55, #ff6b35", pulse: true };
  if (score >= 5)   return { level: "HIGH",     color: "#ff6b35", bg: "rgba(255,107,53,0.12)", score: score.toFixed(1), label: "HIGH RISK — INVESTIGATE NOW",              sublabel: "Significant threat signals require urgent analyst review.", gradient: "#ff6b35, #ff9500", pulse: false };
  if (score >= 2.5) return { level: "MEDIUM",   color: "#ff9500", bg: "rgba(255,149,0,0.10)", score: score.toFixed(1), label: "MEDIUM RISK — MONITOR CLOSELY",            sublabel: "Threat activity detected. Review and monitor signals.", gradient: "#ff9500, #ffcc00", pulse: false };
  return                     { level: "LOW",     color: "#30d158", bg: "rgba(48,209,88,0.08)", score: score.toFixed(1), label: "LOW RISK — ROUTINE MONITORING",            sublabel: "Minimal threat signals. Continue standard monitoring.", gradient: "#30d158, #34c759", pulse: false };
}

const SCAN_PHASES = [
  "Routing through TOR exit nodes...",
  "Querying hacker forums...",
  "Sweeping credential dump repositories...",
  "Scanning paste sites...",
  "Checking darknet marketplaces...",
  "Probing Telegram threat channels...",
  "Cross-referencing stealer logs...",
  "Checking ransomware group blogs...",
  "Correlating supply chain signals...",
  "Aggregating & scoring results...",
];

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

// ─── Shared components ────────────────────────────────────────────────────────
function TerminalText({ text, speed = 22 }) {
  const [d, setD] = useState("");
  useEffect(() => {
    setD(""); let i = 0;
    const t = setInterval(() => { if (i < text.length) setD(text.slice(0, ++i)); else clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span>{d}<span style={{ animation: "blink 1s infinite" }}>█</span></span>;
}

const THREAT_CONTEXT = {
  data_leak:     { icon: "◈", urgency: "Immediate containment required", description: "A dataset containing your organisational data has been posted or is actively being traded. This may include customer records, employee data, internal documents, or system credentials.", actions: ["Identify the scope and type of data exposed", "Notify legal counsel and assess regulatory notification obligations (GDPR 72h clock)", "Preserve evidence and begin forensic investigation", "Notify affected individuals if PII is involved", "Engage Sophos Incident Response if breach is confirmed"], indicators: ["Volume of records", "Presence of PII or financial data", "Seller reputation and proof-of-access claims", "Whether data is already being redistributed"], resources: [{ label: "NCSC Data Breach Guidance", url: "https://www.ncsc.gov.uk/collection/data-breaches" }, { label: "ICO Breach Reporting", url: "https://ico.org.uk/for-organisations/report-a-breach/" }, { label: "Sophos Incident Response", url: "https://www.sophos.com/en-us/products/incident-response-services/emergency-response" }] },
  credential:    { icon: "⚑", urgency: "Force password resets immediately", description: "Employee or system credentials matching your organisation have been found in stealer logs or credential combo lists. These are actively used in credential stuffing and account takeover attacks.", actions: ["Identify all affected accounts from the exposed credential patterns", "Force immediate password resets for all identified accounts", "Revoke and reissue active session tokens and API keys", "Audit MFA coverage — enforce MFA on all affected accounts", "Monitor affected accounts for suspicious login activity"], indicators: ["Number of credentials exposed", "Whether hashes or plaintext passwords are included", "Whether session tokens are included (higher urgency)", "Age of credentials — fresh stealer logs are more dangerous"], resources: [{ label: "HaveIBeenPwned", url: "https://haveibeenpwned.com" }, { label: "CISA Credential Stuffing Guide", url: "https://www.cisa.gov/sites/default/files/publications/CISA_MS-ISAC_Ransomware%20Guide_S508C.pdf" }, { label: "Sophos Incident Response", url: "https://www.sophos.com/en-us/products/incident-response-services/emergency-response" }] },
  phishing:      { icon: "◉", urgency: "Takedown request required immediately", description: "An active phishing kit mimicking your brand, domain, or login portal has been detected. It is harvesting credentials from your customers or employees in real time.", actions: ["Submit a takedown request to the hosting provider and domain registrar", "Notify your customer base via official channels to warn them of the fake site", "Report to your national cybercrime reporting centre (e.g. Action Fraud, IC3)", "Monitor for new phishing domains using similar naming patterns", "Review inbound traffic for users who may have submitted credentials"], indicators: ["Whether the kit is actively harvesting credentials", "Number of victims already captured", "Quality of impersonation (SSL cert, visual similarity)", "Whether MX records are configured for credential relay"], resources: [{ label: "NCSC Suspicious Email Reporting", url: "https://www.ncsc.gov.uk/section/about-ncsc/report-scam-website" }, { label: "Google Safe Browsing Report", url: "https://safebrowsing.google.com/safebrowsing/report_phish/" }, { label: "PhishTank", url: "https://www.phishtank.com" }] },
  doxxing:       { icon: "⚠", urgency: "Notify the individual immediately", description: "Personal information belonging to an executive or VIP has been publicly posted. This poses a direct personal safety risk and may be used to facilitate targeted attacks, fraud, or harassment.", actions: ["Notify the affected individual privately and immediately", "Brief personal security / physical security team if applicable", "Contact the hosting platform to request urgent removal", "Assess whether the posted information is accurate and current", "Brief legal counsel — consider injunctive relief options"], indicators: ["Accuracy and currency of the posted information", "Whether family member details are included", "Whether physical location data is present", "Whether the post includes threats or call to action"], resources: [{ label: "Doxbin Takedown Request", url: "https://doxbin.com/contact" }, { label: "NCSC Personal Cyber Threats", url: "https://www.ncsc.gov.uk/section/information-for/individuals-families" }, { label: "Sophos Incident Response", url: "https://www.sophos.com/en-us/products/incident-response-services/emergency-response" }] },
  sale:          { icon: "◈", urgency: "Verify authenticity and engage IR", description: "A threat actor is actively selling data, access, or credentials claimed to be from your organisation. Whether the claim is legitimate or fraudulent, this represents a reputational and security risk.", actions: ["Assess the credibility of the seller and any proof-of-access claims", "Cross-reference claimed data types against known internal systems", "Engage incident response to investigate potential breach vectors", "Do not attempt to contact or negotiate with the threat actor directly", "Monitor for the listing being sold — post-sale redistribution escalates exposure"], indicators: ["Seller reputation score and transaction history", "Nature of proof-of-access provided", "Price point — low prices suggest faster redistribution", "Whether the listing has been live for an extended period"], resources: [{ label: "CISA Ransomware & Extortion Guide", url: "https://www.cisa.gov/stopransomware/ransomware-guide" }, { label: "Sophos Incident Response", url: "https://www.sophos.com/en-us/products/incident-response-services/emergency-response" }] },
  exploit:       { icon: "▲", urgency: "Emergency patching required", description: "A vulnerability in your systems or infrastructure is being actively traded or discussed. This is a pre-breach signal — exploitation may be imminent or already underway.", actions: ["Identify the affected system or endpoint from available details", "Apply available patches or mitigations immediately", "If no patch is available, implement compensating controls (WAF, network segmentation)", "Increase monitoring on the affected system for exploitation indicators", "Engage your vulnerability management team and CISO immediately"], indicators: ["Whether a PoC exploit is included", "CVSS score and exploitability rating of the vulnerability", "Whether the vulnerability is in an internet-facing system", "Price of the exploit listing — lower prices indicate wider distribution"], resources: [{ label: "NIST NVD Vulnerability Database", url: "https://nvd.nist.gov" }, { label: "CISA Known Exploited Vulnerabilities", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" }, { label: "Sophos Incident Response", url: "https://www.sophos.com/en-us/products/incident-response-services/emergency-response" }] },
  typosquat:     { icon: "◎", urgency: "Submit takedown within 24 hours", description: "A domain visually similar to your real domain has been registered, likely for phishing, brand impersonation, or traffic hijacking. Threat actors often register these in bulk before activating them.", actions: ["Document the domain registration details (WHOIS, registrar, creation date)", "Submit a UDRP (Uniform Domain-Name Dispute-Resolution Policy) complaint", "Report to the domain registrar for abuse policy violation", "Monitor the domain for activation — watch for MX record configuration", "Consider proactively registering similar typosquat variants of your domain"], indicators: ["Whether MX records are already configured (phishing ready)", "Whether the domain resolves to an active website", "Whether SSL certificates have been issued", "How closely the domain mimics your real domain"], resources: [{ label: "ICANN UDRP Filing", url: "https://www.icann.org/resources/pages/udrp-2012-02-25-en" }, { label: "Nominet Dispute Resolution (UK)", url: "https://www.nominet.uk/disputes/" }, { label: "WHOIS Lookup", url: "https://lookup.icann.org" }] },
  counterfeit:   { icon: "◎", urgency: "Engage brand protection team", description: "Counterfeit versions of your products are being manufactured or sold, impacting brand trust, revenue, and potentially customer safety.", actions: ["Document listings with screenshots and URLs as evidence", "Submit takedown requests to each marketplace", "Engage a specialist brand protection or anti-counterfeiting service", "Notify your legal team to assess trademark enforcement options", "Monitor for reappearance under new seller accounts"], indicators: ["Number of active listings and marketplaces involved", "Quality of counterfeits — higher quality suggests organised operation", "Whether the listing uses your official product imagery", "Volume and pricing — indicators of production scale"], resources: [{ label: "EUIPO Anti-Counterfeiting", url: "https://www.euipo.europa.eu/en/ip-enforcement" }, { label: "Amazon Brand Registry", url: "https://brandregistry.amazon.com" }, { label: "IPO Brand Protection", url: "https://www.gov.uk/guidance/ipo-brand-protection" }] },
  impersonation: { icon: "◉", urgency: "Report and request takedown", description: "A fake account impersonating your brand on social media is active, spreading malicious links or disinformation, and potentially defrauding your customers.", actions: ["Report the account to the platform using their impersonation reporting process", "Post a warning on your official account alerting followers to the fake", "Submit evidence of brand ownership to support the takedown request", "Monitor for new impersonation accounts appearing after takedown", "Review whether any customers have been defrauded or misled"], indicators: ["Number of followers — higher follower counts indicate greater reach", "Whether the account is verified or has been active for a long time", "Whether malicious links or financial fraud is involved", "Whether the account is targeting specific customers or geographies"], resources: [{ label: "Twitter/X Impersonation Report", url: "https://help.twitter.com/en/rules-and-policies/twitter-impersonation-policy" }, { label: "LinkedIn Brand Protection", url: "https://www.linkedin.com/help/linkedin/answer/a1340381" }, { label: "Meta Brand Rights", url: "https://www.facebook.com/help/1735443093393986" }] },
  mention:       { icon: "◈", urgency: "Monitor and assess intent", description: "Your brand, assets, or personnel have been referenced in a threat actor context. This ranges from passive discussion to active attack planning and should be assessed for escalation risk.", actions: ["Read the full thread context to assess intent and actor sophistication", "Determine whether this is passive discussion or active planning", "Identify the threat actor group and their known TTPs if possible", "Increase monitoring frequency on mentioned assets", "Brief the security team — escalate to IR if planning indicators are present"], indicators: ["Whether specific attack vectors or timelines are mentioned", "Reputation and history of the threat actors involved", "Number of participants in the discussion", "Whether supporting resources (tools, exploits) are being shared"], resources: [{ label: "MITRE ATT&CK Framework", url: "https://attack.mitre.org" }, { label: "Threat Intelligence Sharing — MISP", url: "https://www.misp-project.org" }, { label: "Sophos Threat Intelligence", url: "https://www.sophos.com/en-us/threat-center" }] },
};

function ContextModal({ result, entities, onClose }) {
  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const type = THREAT_TYPES[result.type] || { label: result.type, color: "#ff9500" };
  const ctx = THREAT_CONTEXT[result.type] || THREAT_CONTEXT.mention;
  let content = result.content;
  entities.brands.forEach(b => { content = content.replace(/{BRAND}/g, b).replace(/{BRAND_DOMAIN}/g, b.toLowerCase().replace(/\s/g, "") + ".com"); });
  if (entities.vips[0])      content = content.replace(/{VIP}/g, entities.vips[0]);
  if (entities.projects[0])  content = content.replace(/{PROJECT}/g, entities.projects[0]);
  if (entities.products[0])  content = content.replace(/{PRODUCT}/g, entities.products[0]);
  if (entities.keywords[0])  content = content.replace(/{KEYWORD}/g, entities.keywords[0]);
  if (entities.socials[0])   content = content.replace(/{SOCIAL_HANDLE}/g, entities.socials[0]);
  if (entities.domains[0])   content = content.replace(/{DOMAIN}/g, entities.domains[0]);
  if (entities.ips[0])       content = content.replace(/{IP_RANGE}/g, entities.ips[0]);
  if (entities.certs[0])     content = content.replace(/{CERT_DOMAIN}/g, entities.certs[0]);
  if (entities.suppliers[0]) content = content.replace(/{SUPPLIER}/g, entities.suppliers[0]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, maxHeight: "85vh", overflowY: "auto", background: "#0d0f14", border: `1px solid ${sev.color}44`, borderTop: `3px solid ${sev.color}`, borderRadius: 10, boxShadow: `0 0 60px ${sev.color}22` }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${sev.color}22`, background: sev.bg }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: sev.color, background: `${sev.color}22`, padding: "2px 7px", borderRadius: 3 }}>{sev.label}</span>
                <span style={{ fontSize: 9, color: type.color, letterSpacing: "0.08em" }}>{type.label.toUpperCase()}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>· {timeAgo(result.detectedAt)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{type.label} — {result.source}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.48)", fontFamily: "monospace" }}>{result.tor}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", width: 28, height: 28, borderRadius: 5, cursor: "pointer", fontSize: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "18px 20px" }}>
          {/* Finding content */}
          <div style={{ marginBottom: 18, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7 }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 6 }}>◈ FINDING DETAIL</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, margin: 0 }}>{content}</p>
          </div>

          {/* Urgency banner */}
          <div style={{ marginBottom: 18, padding: "10px 14px", background: `${sev.color}12`, border: `1px solid ${sev.color}33`, borderLeft: `3px solid ${sev.color}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: sev.color }}>{ctx.icon}</span>
            <div>
              <div style={{ fontSize: 9, color: sev.color, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 2 }}>RECOMMENDED URGENCY</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{ctx.urgency}</div>
            </div>
          </div>

          {/* Threat context */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 8 }}>◈ THREAT CONTEXT</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: 0 }}>{ctx.description}</p>
          </div>

          {/* Recommended actions */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 8 }}>◈ RECOMMENDED RESPONSE ACTIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ctx.actions.map((action, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${sev.color}20`, border: `1px solid ${sev.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: sev.color, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment indicators */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 8 }}>◈ ASSESSMENT INDICATORS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ctx.indicators.map((ind, i) => (
                <span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 4, lineHeight: 1.5 }}>→ {ind}</span>
              ))}
            </div>
          </div>

          {/* External resources */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 8 }}>◈ EXTERNAL RESOURCES & REPORTING LINKS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ctx.resources.map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.18)", borderRadius: 5, textDecoration: "none", transition: "background 0.15s" }}>
                  <span style={{ fontSize: 11, color: "#ff9500", fontWeight: 600 }}>{res.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,149,0,0.55)" }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 20px 14px" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>⚠ Intelligence is provided for defensive awareness only. Do not attempt to access .onion sources directly or contact threat actors. Engage qualified incident response professionals for confirmed breaches.</p>
        </div>
      </div>
    </div>
  );
}

function ThreatCard({ result, entities, isNew }) {
  const [showContext, setShowContext] = useState(false);
  const sev = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const type = THREAT_TYPES[result.type] || { label: result.type, color: "#ff9500" };
  let content = result.content;
  entities.brands.forEach(b => { content = content.replace(/{BRAND}/g, b).replace(/{BRAND_DOMAIN}/g, b.toLowerCase().replace(/\s/g, "") + ".com"); });
  if (entities.vips[0])      content = content.replace(/{VIP}/g, entities.vips[0]);
  if (entities.projects[0])  content = content.replace(/{PROJECT}/g, entities.projects[0]);
  if (entities.products[0])  content = content.replace(/{PRODUCT}/g, entities.products[0]);
  if (entities.keywords[0])  content = content.replace(/{KEYWORD}/g, entities.keywords[0]);
  if (entities.socials[0])   content = content.replace(/{SOCIAL_HANDLE}/g, entities.socials[0]);
  if (entities.domains[0])   content = content.replace(/{DOMAIN}/g, entities.domains[0]);
  if (entities.ips[0])       content = content.replace(/{IP_RANGE}/g, entities.ips[0]);
  if (entities.certs[0])     content = content.replace(/{CERT_DOMAIN}/g, entities.certs[0]);
  if (entities.suppliers[0]) content = content.replace(/{SUPPLIER}/g, entities.suppliers[0]);
  return (
    <>
      {showContext && <ContextModal result={result} entities={entities} onClose={() => setShowContext(false)} />}
      <div style={{
        background: sev.bg, border: `1px solid ${sev.color}33`, borderLeft: `3px solid ${sev.color}`,
        borderRadius: 6, padding: "14px 16px", marginBottom: 8, position: "relative",
        animation: isNew ? "slideIn 0.4s ease, threatPulse 3s ease-in-out infinite" : result.severity === "critical" ? "threatPulse 3s ease-in-out infinite" : "none",
        transition: "opacity 0.3s",
      }}>
        {isNew && <span style={{ position: "absolute", top: 8, right: 10, fontSize: 8, color: sev.color, background: `${sev.color}22`, padding: "1px 6px", borderRadius: 3, letterSpacing: "0.1em", animation: "blink 1.5s infinite" }}>NEW</span>}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: sev.color, background: `${sev.color}22`, padding: "2px 6px", borderRadius: 3 }}>{sev.label}</span>
            <span style={{ fontSize: 9, color: type.color, letterSpacing: "0.08em" }}>{type.label.toUpperCase()}</span>
            {result.real
              ? <span style={{ fontSize: 8, color: "#30d158", background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.3)", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.08em" }}>◉ LIVE</span>
              : <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.08em" }}>◎ SIMULATED</span>
            }
          </div>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", flexShrink: 0, marginLeft: 30 }}>{timeAgo(result.detectedAt)}</span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, margin: "0 0 9px" }}>{content}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 9, color: "rgba(255,149,0,0.6)" }}>◈ {result.source}</span>
            {result.feedSource && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>via {result.feedSource}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.48)" }}>{result.tor}</span>
            {result.real && result.contextUrl
              ? <a href={result.contextUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "3px 10px", borderRadius: 4, background: `${sev.color}15`, border: `1px solid ${sev.color}44`, color: sev.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textDecoration: "none", flexShrink: 0 }}>◎ VIEW SOURCE ↗</a>
              : <button onClick={() => setShowContext(true)} style={{ padding: "3px 10px", borderRadius: 4, cursor: "pointer", background: `${sev.color}15`, border: `1px solid ${sev.color}44`, color: sev.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0 }}>◎ VIEW CONTEXT →</button>
            }
          </div>
        </div>
      </div>
    </>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: "-1px" }}>{value}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TagInput({ label, sublabel, placeholder, tags, onAdd, onRemove, tagColor = "#ff9500", icon = "◈" }) {
  const [val, setVal] = useState("");
  const add = () => { const t = val.trim(); if (t && !tags.includes(t)) { onAdd(t); setVal(""); } };
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: tagColor, letterSpacing: "0.13em", marginBottom: 3 }}>{icon} {label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 6, lineHeight: 1.5 }}>{sublabel}</div>}
      <div style={{ display: "flex", gap: 7, marginBottom: 6 }}>
        <input style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 11px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button onClick={add} style={{ background: `${tagColor}22`, border: `1px solid ${tagColor}44`, color: tagColor, padding: "0 12px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>+</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {tags.map(t => <span key={t} style={{ background: `${tagColor}14`, border: `1px solid ${tagColor}33`, color: tagColor, padding: "2px 8px", borderRadius: 4, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>{t}<span onClick={() => onRemove(t)} style={{ cursor: "pointer", opacity: 0.5 }}>✕</span></span>)}
        {!tags.length && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>None added</span>}
      </div>
    </div>
  );
}

function ScanSection({ title, badge, badgeColor = "#ff9500", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 7, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", cursor: "pointer", background: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.07em" }}>{title}</span>
          {badge !== undefined && <span style={{ fontSize: 8, background: badge > 0 ? `${badgeColor}22` : "rgba(255,255,255,0.06)", color: badge > 0 ? badgeColor : "rgba(255,255,255,0.55)", padding: "1px 6px", borderRadius: 9, border: `1px solid ${badge > 0 ? badgeColor+"44" : "rgba(255,255,255,0.07)"}` }}>{badge} added</span>}
        </div>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
      </div>
      {open && <div style={{ padding: "14px 14px 2px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>{children}</div>}
    </div>
  );
}

function SimpleInput({ label, sublabel, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 3 }}>◈ {label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 6, lineHeight: 1.5 }}>{sublabel}</div>}
      <input style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 11px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function ToggleGroup({ label, sublabel, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 3 }}>◈ {label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 6, lineHeight: 1.5 }}>{sublabel}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {options.map(opt => { const active = selected.includes(opt.value); return <button key={opt.value} onClick={() => onToggle(opt.value)} style={{ padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, border: `1px solid ${active ? "rgba(255,149,0,0.5)" : "rgba(255,255,255,0.1)"}`, background: active ? "rgba(255,149,0,0.15)" : "rgba(255,255,255,0.03)", color: active ? "#ff9500" : "rgba(255,255,255,0.7)", transition: "all 0.15s" }}>{opt.label}</button>; })}
      </div>
    </div>
  );
}

// ─── Risk Bar (pinned top) ────────────────────────────────────────────────────
function RiskBar({ risk, isMonitoring, brand, lastScanTime, nextScanIn, scanCycle }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const segments = [
    { label: "LOW",      color: "#30d158", pct: 25 },
    { label: "MEDIUM",   color: "#ff9500", pct: 25 },
    { label: "HIGH",     color: "#ff6b35", pct: 25 },
    { label: "CRITICAL", color: "#ff2d55", pct: 25 },
  ];
  const levelIdx = { NONE: 0, LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }[risk.level] ?? 0;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: `${risk.bg}`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${risk.color}44` }}>
      {/* Animated scan line when monitoring */}
      {isMonitoring && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", background: `linear-gradient(90deg, transparent 0%, ${risk.color}18 50%, transparent 100%)`, animation: "scanLine 3s ease-in-out infinite", pointerEvents: "none" }} />
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 22px" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* Left: status dot + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 10, height: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: isMonitoring ? risk.color : "rgba(255,255,255,0.5)", boxShadow: isMonitoring ? `0 0 8px ${risk.color}` : "none" }} />
              {isMonitoring && risk.pulse && <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${risk.color}`, animation: "ping 1.5s infinite" }} />}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: risk.color, letterSpacing: "0.08em" }}>{risk.label}</div>
              {brand && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>{brand.toUpperCase()}</div>}
            </div>
          </div>

          {/* Center: color bar */}
          <div style={{ flex: 1, minWidth: 140, maxWidth: 280 }}>
            <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 4, overflow: "hidden" }}>
              {segments.map((seg, i) => (
                <div key={i} style={{ flex: 1, background: i <= levelIdx ? seg.color : `${seg.color}28`, transition: "background 0.6s ease", borderRadius: i === 0 ? "4px 0 0 4px" : i === 3 ? "0 4px 4px 0" : 0 }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              {segments.map((seg, i) => (
                <span key={i} style={{ fontSize: 7, color: i <= levelIdx ? seg.color : "rgba(255,255,255,0.5)", letterSpacing: "0.08em", flex: 1, textAlign: "center" }}>{seg.label}</span>
              ))}
            </div>
          </div>

          {/* Right: monitoring status */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {isMonitoring ? (
              <div>
                <div style={{ fontSize: 9, color: risk.color, letterSpacing: "0.12em", fontWeight: 700 }}>
                  ◉ CONTINUOUS MONITORING ACTIVE
                </div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                  Cycle #{scanCycle} · Next rescan in {nextScanIn}s · Last: {lastScanTime || "—"}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>◯ MONITORING INACTIVE</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Docs data ────────────────────────────────────────────────────────────────
const DOCS = [
  {
    id: "overview", icon: "◉", label: "Overview",
    title: "What is DARKWATCH?",
    intro: "Darkwatch Intelligence Enterprise is a brand surveillance intelligence platform designed to monitor the darkweb, threat actor forums, paste sites, credential markets, and underground channels for any signals that could harm your organization.",
    sections: [
      { heading: "How It Works", body: "DARKWATCH continuously crawls monitored sources — from TOR-hosted hacker forums and credential dump repositories to Telegram threat actor channels and darknet marketplaces. It matches content against your configured surveillance profile and surfaces threats ranked by severity. The platform operates around the clock, injecting new findings in real time without requiring manual intervention." },
      { heading: "Platform Features at a Glance", options: [
        { name: "◉ Scanner", desc: "Configure your surveillance profile across 8 input categories and activate continuous darkweb monitoring. Threat cards surface live as new signals are detected." },
        { name: "▲ Risk Bar", desc: "A colour-coded bar pinned to the top of every screen shows your live risk posture — from green (Low) through amber and orange to red (Critical) — updated in real time." },
        { name: "↺ Continuous Mode", desc: "The engine rescans all configured sources automatically on a timed cycle. No manual scans required. New findings are injected into the live feed and marked as NEW." },
        { name: "◎ Reports", desc: "Generate Executive or Operational reports on a weekly, monthly, or quarterly schedule. Export to PDF for board packs, management reporting, and security team briefings." },
        { name: "◎ Docs", desc: "Full in-app documentation covering every feature, input field, threat type, severity level, and best practice guide — searchable and always up to date." },
      ]},
      { heading: "The 4-Step Workflow", steps: [
        { label: "Configure Profile", desc: "Define your brand, digital assets, people, and intelligence targets across 8 input sections. The more signals you add, the higher your detection coverage." },
        { label: "Activate Continuous Monitoring", desc: "DARKWATCH routes through TOR circuits and continuously queries all enabled source types, re-scanning on a regular cycle and injecting new findings in real time." },
        { label: "Review Live Threats", desc: "Threat cards surface live as they are detected with severity ratings, source attribution, and full context. The risk bar at the top always reflects your current exposure." },
        { label: "Generate Reports", desc: "At any time, navigate to the Reports tab to generate an Executive or Operational report covering the last 7, 30, or 90 days of intelligence." },
      ]},
      { heading: "Who Should Use This", body: "DARKWATCH is designed for corporate security teams, threat intelligence analysts, brand protection officers, and executives responsible for organisational risk. The Reports module produces two distinct output types: board-ready executive summaries for leadership, and detailed operational reports with analyst action queues for the security team. It is a defensive tool — all intelligence is gathered for protective purposes only." },
    ]
  },

  {
    id: "quickstart", icon: "▶", label: "Quick Start",
    title: "Getting Started in 5 Minutes",
    intro: "Follow this guide to activate continuous monitoring, understand the risk bar, and generate your first report.",
    sections: [
      { heading: "Step 1 — Configure Your Profile", body: "Navigate to the Scanner tab. Enter your Primary Brand Name (required) and expand the sections relevant to your organisation. Add domains, VIPs, products, and keywords to maximise detection coverage.", tip: "Aim for 10+ configured signals for comprehensive coverage. The completeness bar at the top of the Scanner updates in real time." },
      { heading: "Step 2 — Activate Continuous Monitoring", body: "Click ACTIVATE CONTINUOUS MONITORING. DARKWATCH immediately runs a full initial scan across all configured source types, then schedules automatic rescans on a continuous cycle. You do not need to manually trigger scans." },
      { heading: "Step 3 — Watch the Risk Bar", body: "The colour bar pinned to the very top of the screen reflects your live risk level: GREEN (Low) → AMBER (Medium) → ORANGE (High) → RED (Critical). It recalculates after every scan cycle and is visible regardless of which tab you are on.", tip: "On Critical level, the status dot pulses and a scan-line animation sweeps across the bar to signal urgency. Check this bar first whenever you open the application." },
      { heading: "Step 4 — Review Live Threat Feed", body: "New threat cards slide into the top of the feed as they are detected each cycle. A flashing NEW badge marks findings from the current cycle — it fades after 8 seconds. Use the filter tabs to narrow results by severity (Critical, High, Medium) or threat type (Data Leak, Credential, Phishing, etc.)." },
      { heading: "Step 5 — Generate a Report", body: "Navigate to the Reports tab. Select your Report Type (Executive or Operational) and Reporting Period (Weekly, Monthly, or Quarterly). Click Generate Report. The report renders in-app and can be printed or exported as a PDF." },
      { heading: "Step 6 — Configure Alert Channels", body: "In Section 8 · Scan Configuration, enable one or more alert channels — Email, Slack, Webhook, or SMS. Toggle each channel on and fill in the required fields (recipient addresses, webhook URL, phone numbers, etc.). Set the minimum severity threshold per channel to control which findings trigger notifications. Click ▶ TEST on each channel to verify delivery before activating monitoring.", tip: "Configure at least two channels for redundancy. Restrict SMS to Critical severity only to avoid alert fatigue and unnecessary costs." },
      { heading: "Step 7 — Activate Monitoring", body: "Click ACTIVATE CONTINUOUS MONITORING. DARKWATCH runs a full initial scan, then rescans automatically on a timed cycle. Any finding that meets your configured severity thresholds will be dispatched to your enabled alert channels in real time.", tip: "Changes to your profile or notification settings take effect on the next scan cycle automatically after resuming." },
    ]
  },

  {
    id: "risk-bar", icon: "▲", label: "Risk Bar",
    title: "The Risk Level Bar Explained",
    intro: "The colour bar pinned to the top of every screen gives you an immediate, at-a-glance view of your organisation's current threat exposure based on all active signals.",
    sections: [
      { heading: "What the Risk Bar Shows", body: "The bar displays four colour-coded segments: LOW (green), MEDIUM (amber), HIGH (orange), and CRITICAL (red). Segments illuminate from left to right as your risk score rises. The currently active level's segment glows fully; lower segments remain at reduced opacity." },
      { heading: "Risk Level Definitions", options: [
        { name: "CRITICAL — Red, pulsing", desc: "One or more critical-severity findings are active. The status dot pulses and the bar animates a scan-line sweep. Immediate incident response engagement required." },
        { name: "HIGH — Orange", desc: "High-severity findings detected requiring same-day analyst investigation. No immediate crisis, but elevated and accelerating exposure." },
        { name: "MEDIUM — Amber", desc: "Moderate threat signals active. Assign for analyst review within 24–48 hours. Monitor closely for escalation to High." },
        { name: "LOW — Green", desc: "Minimal threat signals detected. Routine monitoring posture. Continue standard security operations." },
        { name: "NONE — Green (inactive)", desc: "No threat signals found in the current monitoring cycle. Monitoring is operational and active." },
      ]},
      { heading: "How the Score is Calculated", body: "The threat score (0–10) is a weighted sum of all active findings. Critical findings contribute 4 points each, High 2 points, Medium 1 point, and Low 0.25 points. The total is multiplied by 0.4 and capped at 10, then rounded to one decimal place. Scores of 7.5 or above trigger Critical level; 5.0–7.4 trigger High; 2.5–4.9 trigger Medium; below 2.5 trigger Low." },
      { heading: "Monitoring Status Indicators", body: "The right side of the bar shows the monitoring status: current scan cycle number, time remaining until the next rescan, and the timestamp of the last completed scan. When monitoring is paused, the bar shows MONITORING INACTIVE in grey. When active, it shows CONTINUOUS MONITORING ACTIVE in the current risk colour." },
      { heading: "Visibility Across Tabs", body: "The risk bar is fixed to the top of the viewport and remains visible on all three tabs — Scanner, Reports, and Docs. This ensures you are always aware of your risk posture even while browsing documentation or generating reports." },
    ]
  },

  {
    id: "continuous", icon: "↺", label: "Continuous Mode",
    title: "Continuous Monitoring Mode",
    intro: "DARKWATCH operates in continuous monitoring mode — it never stops watching. Unlike a one-time scan, the engine re-queries all configured sources on a timed cycle and surfaces new threats in real time as they appear.",
    sections: [
      { heading: "How Continuous Mode Works", body: "Once activated, DARKWATCH immediately runs a full initial sweep across all configured source types. It then schedules an automatic rescan at the configured interval. Each cycle queries the same sources, compares findings against your profile, and injects newly detected signals into the live feed. New findings are marked with a flashing NEW badge and sorted to the top of the threat feed." },
      { heading: "Live Feed Behaviour", body: "New threat cards animate into view at the top of the results feed as they are detected mid-cycle. The NEW badge is displayed for 8 seconds before fading. The risk bar score recalculates immediately when new findings are injected, so the bar may shift levels between formal scan cycle completions if a critical signal is detected." },
      { heading: "Scan Cycle Timing", options: [
        { name: "Demo mode (current)", desc: "30-second rescan cycle for live demonstration purposes. New findings are injected during each cycle to simulate real-time detection." },
        { name: "Standard — production", desc: "Hourly rescan cycle covering all primary source types. Recommended default for most deployments." },
        { name: "Deep — production", desc: "4-hour rescan cycle covering all indexed sources including archival paste sites, niche forums, and secondary marketplaces." },
        { name: "Continuous 24/7 — enterprise", desc: "Near-real-time event-driven monitoring. Alerts fire as soon as new signals match your configured profile, without waiting for a cycle boundary." },
      ]},
      { heading: "Pausing & Resuming", body: "Use the PAUSE button in the application header to halt scanning at any time. All existing findings are preserved in the feed. Use the RESUME MONITORING button on the results screen or in the header to restart scanning. The engine resumes from the current profile — no reconfiguration is needed." },
      { heading: "Profile Changes Mid-Cycle", body: "If you modify your surveillance profile while monitoring is active, click ⚙ Config from the results view to return to the setup screen. Changes take effect on the next scan cycle after you re-activate monitoring." },
      { tip: "The scan cycle counter in the risk bar shows how many full cycles have been completed since monitoring was activated. Use this to calibrate how much data has been gathered relative to your expected coverage." },
    ]
  },

  {
    id: "reports", icon: "◎", label: "Reports",
    title: "Reporting Module",
    intro: "The Reports tab lets you generate structured threat intelligence reports from your current findings — tailored either for board-level executives or for the operational security team, across weekly, monthly, or quarterly periods.",
    sections: [
      { heading: "Accessing the Reports Module", body: "Click the Reports tab in the top navigation bar. Reports are generated from the live threat findings in the current monitoring session. For best results, activate continuous monitoring from the Scanner tab and allow at least one full scan cycle to complete before generating a report." },
      { heading: "Report Configuration", body: "Two settings control what is generated: Report Type (Executive or Operational) and Reporting Period (Weekly, Monthly, or Quarterly). Select your options using the radio cards in the Report Configuration panel, then click the Generate button." },
      { heading: "Report Types", options: [
        { name: "Executive Report", desc: "Designed for board members, C-suite, and non-technical leadership. Contains: branded cover page with organisation name and period range, current risk posture callout, Key Risk Indicators (4 KPI metrics with prior-period comparison), severity breakdown with proportional bars, and board-level prioritised recommendations (Immediate / This Week / This Month / Ongoing). Marked CONFIDENTIAL — FOR BOARD AND C-SUITE USE ONLY." },
        { name: "Operational Report", desc: "Designed for SOC analysts, security managers, and technical teams. Contains: summary stats header, threat classification breakdown by type with percentages, top intelligence sources ranked by signal volume, full findings log (up to 30 entries with severity, type, source, content, and detection time), and a prioritised analyst action item queue with ticket IDs, owners, and deadlines. Marked RESTRICTED — SECURITY OPERATIONS USE ONLY." },
      ]},
      { heading: "Reporting Periods", options: [
        { name: "Weekly — last 7 days", desc: "Tactical reporting cycle. Recommended for routine security team stand-ups and weekly threat briefings. Reflects the most recent 7 days of monitoring data." },
        { name: "Monthly — last 30 days", desc: "Operational reporting cycle. Suitable for management reporting, monthly security reviews, and trend analysis. Reflects the past 30 days of monitoring." },
        { name: "Quarterly — last 90 days", desc: "Strategic reporting cycle. Designed for board packs, executive briefings, and quarterly business reviews. Provides the broadest view of threat trends and risk posture over time." },
      ]},
      { heading: "Generating and Exporting", body: "Click the Generate Report button. A brief generation animation plays while the report is compiled. The rendered report appears below the configuration panel. Click PRINT / EXPORT PDF to open the browser's native print dialog — select 'Save as PDF' as the destination for a formatted PDF export." },
      { tip: "For quarterly executive reports destined for board packs, generate immediately after a deep scan cycle to ensure maximum signal coverage. Use the Operational report in the same session to prepare the accompanying analyst briefing." },
      { heading: "Executive Report Sections in Detail", tips: [
        { title: "Cover Page", body: "Includes the Darkwatch Intelligence Enterprise branding, classification marking (CONFIDENTIAL), organisation name, reporting period range, and generation date." },
        { title: "Executive Summary", body: "Two-paragraph narrative summary of the period's findings, overall threat score, risk level, and period-over-period trend direction (increase or decrease). Written in plain language for non-technical readers." },
        { title: "Key Risk Indicators", body: "Four KPI metric cards showing: Critical Findings, High Severity findings, Total Signals for the period, and total configured signals. Each card includes a comparison to the prior period." },
        { title: "Threat Severity Breakdown", body: "Four-row breakdown (Critical, High, Medium, Low) with finding counts, proportional bar charts, and a one-line description of the expected response action for each level." },
        { title: "Board-Level Recommendations", body: "Time-prioritised action items (Immediate, This Week, This Month, Ongoing) auto-generated from the current findings. Only recommendations relevant to active finding types are shown — if no critical findings exist, the Immediate action is suppressed." },
      ]},
      { heading: "Operational Report Sections in Detail", tips: [
        { title: "Summary Header", body: "Five metric boxes (Critical, High, Medium, Low, Total) with the current threat score and level, scan cycle number, and last scan timestamp." },
        { title: "Threat Classification Breakdown", body: "Per-type breakdown showing count and percentage of total for each threat type detected (Data Leak, Credential Exposure, Phishing Kit, etc.) with proportional colour bars." },
        { title: "Top Intelligence Sources", body: "Ranked list of the top 5 darkweb sources by signal volume for the period, with proportional bars showing relative contribution." },
        { title: "Full Findings Log", body: "Tabular log of up to 30 findings showing Severity, Type, Source, Finding summary (truncated to 100 characters), and detection timestamp. If more than 30 findings exist, a note indicates the total count for the full export." },
        { title: "Analyst Action Item Queue", body: "Auto-generated ticket queue with IDs (IR-01, CR-02, etc.), priority levels (P0–P3), assigned owner role (IR Team, SOC L2, Legal/SOC, Brand, SOC L1), response deadline, action title, and detailed instruction text. Tickets are only generated for finding types present in the current data." },
      ]},
    ]
  },

  {
    id: "input-fields", icon: "◈", label: "Input Fields",
    title: "Understanding All Input Fields",
    intro: "DARKWATCH uses 8 input sections to build your surveillance profile. Each section targets a different attack surface. The more fields you populate, the higher your detection coverage and the more relevant your report findings will be.",
    sections: [
      { heading: "1 · Brand Identity", fields: [
        { name: "Primary Brand Name", required: true,  desc: "Your main organisation name as it appears publicly. This is the most critical field — it anchors all brand-level searches across every source.", example: "Acme Corporation" },
        { name: "Industry / Sector",  required: false, desc: "Your business sector. Helps correlate sector-specific threat campaigns (e.g. financial sector attacks, healthcare ransomware waves).", example: "Financial Services" },
        { name: "Stock Ticker Symbols", required: false, desc: "For publicly traded companies. Used to detect market manipulation schemes and coordinated short attack discussions.", example: "ACME, NYSE:ACM" },
        { name: "Legal Entity Names", required: false, desc: "Subsidiaries, holding companies, and registered legal names that may appear in leaks independently from your main brand.", example: "Acme Holdings Ltd, Acme EU GmbH" },
      ]},
      { heading: "2 · Digital Infrastructure", fields: [
        { name: "Domains & Subdomains",         required: false, desc: "All public-facing web properties. Used to detect typosquatting, phishing kits, and unauthorised impersonation of your web presence.", example: "acme.com, api.acme.com, login.acme.com" },
        { name: "Corporate Email Domains",      required: false, desc: "Your email domain(s). Matched against stealer logs and combo lists to detect employee credential breaches.", example: "@acme.com, @acme-corp.com" },
        { name: "IP Ranges / CIDR Blocks",      required: false, desc: "Your IP address space. Flagged when exploit listings or active scanning activity targets your network ranges.", example: "203.0.113.0/24, 198.51.100.5" },
        { name: "ASN Numbers",                  required: false, desc: "Autonomous System Numbers identifying your network infrastructure for network-level threat correlation.", example: "AS12345" },
        { name: "SSL / TLS Certificate Domains",required: false, desc: "Domains covered by your SSL certificates. Detects certificate theft or misissuance enabling man-in-the-middle attacks.", example: "*.acme.com, secure.acme.com" },
      ]},
      { heading: "3 · People & Personnel", fields: [
        { name: "VIP / Executive Targets",   required: false, desc: "CEO, CTO, board members, CISO. Monitored for doxxing, credential exposure, physical threat discussions, and social engineering setups.", example: "Jane Smith CEO, John Doe CTO" },
        { name: "Key Employee Identifiers",  required: false, desc: "Employees with elevated system access. Their credentials are high-value targets for attackers seeking privileged entry.", example: "j.smith@acme.com, IT admin team" },
        { name: "Contractors & Third Parties",required: false, desc: "External personnel with access to your systems. Commonly exploited as a softer entry point via insider threat vectors.", example: "Dev Agency XYZ, contractor@partner.com" },
      ]},
      { heading: "4–8 · Additional Sections", body: "Sections 4 through 8 cover Products & IP (product names, codenames, trademarks, source code), Social Media & Brand Channels (handles, app names), Supply Chain & Third-Party Risk (vendors, cloud services), Custom Keywords & Exclusions (bespoke monitoring terms and false positive suppression), and Scan Configuration (source types and fully configurable alert channels). Each configured signal increases your detection coverage and the relevance of generated reports." },
      { heading: "8 · Scan Configuration — Alert Channels", fields: [
        { name: "Source Types to Monitor", required: false, desc: "Toggle which darkweb and threat intelligence source categories DARKWATCH queries during each scan cycle. Options include Hacker Forums, Paste Sites, Marketplaces, Telegram, IRC, Combo Lists, Stealer Logs, and Ransomware Blogs.", example: "Forums, Paste Sites, Marketplaces (default)" },
        { name: "Email — Recipients", required: false, desc: "Comma-separated list of email addresses that will receive alert notifications. Each address receives the full finding details including severity, type, source, and content.", example: "soc@company.com, ciso@company.com" },
        { name: "Email — Subject Prefix", required: false, desc: "A prefix prepended to the subject line of every alert email, making it easy to filter and route messages in your inbox or email security gateway.", example: "[DARKWATCH]" },
        { name: "Email — Minimum Severity", required: false, desc: "Only findings at or above this severity level will trigger an email alert. Set to High by default to avoid alert fatigue from medium and low signals.", example: "High (default)" },
        { name: "Email — Daily Digest", required: false, desc: "When enabled, all alerts are bundled into a single daily summary email rather than firing one email per finding. Recommended for high-volume monitoring environments.", example: "Off (default)" },
        { name: "Slack — Webhook URL", required: false, desc: "The incoming webhook URL generated from your Slack App configuration. Findings are posted as formatted message cards to the specified channel.", example: "https://hooks.slack.com/services/T.../B.../" },
        { name: "Slack — Channel", required: false, desc: "The Slack channel name where alerts will be posted. Must include the # prefix. The webhook must have permission to post to this channel.", example: "#security-alerts" },
        { name: "Slack — Bot Display Name", required: false, desc: "The display name shown as the sender of Slack messages. Customise this to match your team's naming conventions.", example: "DARKWATCH" },
        { name: "Webhook — Endpoint URL", required: false, desc: "A HTTPS endpoint that will receive a JSON POST (or PUT) payload for each qualifying finding. Use this to integrate with a SIEM, SOAR, Jira, ServiceNow, or any custom automation pipeline.", example: "https://siem.company.com/api/alerts" },
        { name: "Webhook — Secret / Bearer Token", required: false, desc: "An authorisation token sent in the HTTP Authorization header with each webhook request. Used to authenticate the request at the receiving endpoint.", example: "Bearer sk-abc123..." },
        { name: "Webhook — HTTP Method", required: false, desc: "The HTTP method used when delivering the webhook payload. POST is standard for most SIEM and SOAR integrations; select PUT if your endpoint requires it.", example: "POST (default)" },
        { name: "SMS — Phone Numbers", required: false, desc: "Comma-separated recipient phone numbers in E.164 international format. Each number receives a concise SMS with the severity level, threat type, and a short content summary.", example: "+442071234567, +14155552671" },
        { name: "SMS — Provider", required: false, desc: "The SMS delivery provider to use. Supported options are Twilio, AWS SNS, and Vonage. Each provider requires its own API credentials configured below.", example: "Twilio (default)" },
        { name: "SMS — Account SID / API Key", required: false, desc: "The Account SID (Twilio), Access Key ID (AWS SNS), or API Key (Vonage) used to authenticate with the selected SMS provider.", example: "ACxxxxxxxxxxxxxxxx" },
        { name: "SMS — Auth Token / Secret", required: false, desc: "The corresponding authentication secret for the selected SMS provider. Stored securely and never displayed in plain text after entry.", example: "your_auth_token" },
      ]},
    ]
  },

  {
    id: "alert-channels", icon: "◈", label: "Alert Channels",
    title: "Configuring Alert Channels",
    intro: "Darkwatch Intelligence Enterprise supports four notification channels — Email, Slack, Webhook, and SMS. Each channel can be independently enabled, configured, and tested from Section 8 of the Scanner profile. Alerts fire automatically when a new finding meets or exceeds the minimum severity threshold you configure per channel.",
    sections: [
      { heading: "Accessing Channel Configuration", body: "Navigate to the Scanner tab and expand Section 8 · Scan Configuration. Each alert channel is displayed as a card with a toggle switch. Click anywhere on the card header to enable or disable the channel. When enabled, the configuration fields expand below the header. Changes take effect immediately — no restart or re-activation required." },
      { heading: "Channel Overview", options: [
        { name: "✉ Email", desc: "Sends an alert email to one or more recipients for each qualifying finding. Supports a subject line prefix for easy inbox filtering and an optional daily digest mode that bundles all alerts into a single summary email. Best for SOC analysts and security managers who monitor email continuously." },
        { name: "◈ Slack", desc: "Posts formatted alert cards to a Slack channel via an incoming webhook. Each card includes severity, threat type, source, and finding content. Best for teams using Slack as their primary security operations communication tool." },
        { name: "⚡ Webhook", desc: "Delivers a structured JSON payload to any HTTPS endpoint for each qualifying finding. Designed for SIEM, SOAR, ticketing systems (Jira, ServiceNow), and custom automation pipelines. Supports POST and PUT methods with bearer token authentication." },
        { name: "◉ SMS", desc: "Sends a concise SMS to one or more phone numbers via Twilio, AWS SNS, or Vonage. Due to per-message costs and the risk of alert fatigue, SMS is recommended for Critical findings only. Each message includes severity, threat type, and a short content summary." },
      ]},
      { heading: "Minimum Severity Threshold", body: "Every channel has an independent minimum severity setting. Only findings at or above the selected level will trigger an alert on that channel. This allows you to configure different alert strategies per channel — for example, sending all High and above findings to Slack for analyst awareness, while restricting SMS to Critical findings only to avoid unnecessary interruptions." },
      { heading: "Email Configuration", tips: [
        { title: "Recipients", body: "Enter one or more email addresses separated by commas. All recipients receive the same alert content. Use a team distribution list (e.g. soc@company.com) for broad coverage, or individual addresses for targeted notification." },
        { title: "Subject Line Prefix", body: "A prefix such as [DARKWATCH] or [ALERT] is prepended to every email subject. Use this to create inbox rules or filters that route DARKWATCH alerts to a dedicated folder or ticketing queue automatically." },
        { title: "Daily Digest Mode", body: "When enabled, all alerts during a 24-hour period are bundled into a single daily summary email delivered at a fixed time. Recommended for medium-severity monitoring where real-time individual emails would create noise. Disable for Critical-level channels to ensure immediate notification." },
      ]},
      { heading: "Slack Configuration", tips: [
        { title: "Creating an Incoming Webhook", body: "In Slack, go to your workspace App Directory and create or configure an Incoming Webhooks app. Select the target channel and copy the webhook URL generated. Paste this into the Webhook URL field in DARKWATCH." },
        { title: "Channel naming", body: "The channel name must include the # prefix (e.g. #security-alerts). The Slack app associated with your webhook must have permission to post to this channel. If posting fails, check the app's channel permissions in your Slack workspace settings." },
        { title: "Bot Display Name", body: "Customise the bot name to distinguish DARKWATCH alerts from other automated messages in the channel. Names like DARKWATCH or DIE-Alert are useful when multiple monitoring tools post to the same channel." },
      ]},
      { heading: "Webhook Configuration", tips: [
        { title: "Endpoint requirements", body: "The endpoint must accept HTTPS requests and return a 2xx status code. HTTP (non-TLS) endpoints are not supported. Ensure your endpoint can handle the expected volume — in high-signal environments, multiple alerts may fire per scan cycle." },
        { title: "JSON payload format", body: "Each webhook delivery contains a JSON object with the following fields: severity, type, source, content, detectedAt (Unix timestamp in milliseconds), and brand. Parse this structure in your SIEM or automation tool to create enriched tickets or correlation rules." },
        { title: "Authentication", body: "Enter a Bearer token or API key in the Secret field. DARKWATCH sends this value in the HTTP Authorization header as 'Bearer <token>'. Validate this token on your receiving endpoint to reject unauthorised requests." },
        { title: "SIEM & SOAR integration", body: "Map the webhook payload fields to your SIEM schema. The severity field (critical / high / medium / low) maps directly to standard SIEM severity levels. Use the type field to route findings to specific playbooks in your SOAR platform." },
      ]},
      { heading: "SMS Configuration", tips: [
        { title: "Phone number format", body: "All numbers must be in E.164 format — a + sign followed by the country code and subscriber number with no spaces or dashes (e.g. +442071234567 for a UK number, +14155552671 for a US number). Invalid formats will silently fail delivery." },
        { title: "Choosing a provider", body: "Twilio is the most widely used option and recommended for most deployments. AWS SNS is preferred if your organisation already uses AWS infrastructure. Vonage (formerly Nexmo) is a strong alternative with good European coverage." },
        { title: "Credentials", body: "For Twilio, enter your Account SID and Auth Token from the Twilio Console. For AWS SNS, enter your Access Key ID and Secret Access Key. For Vonage, enter your API Key and API Secret. All credentials are masked after entry." },
        { title: "Severity recommendation", body: "Restrict SMS to Critical severity only. Medium and High findings are better handled by email or Slack to avoid alert fatigue and unnecessary SMS costs. SMS should be reserved for situations requiring immediate human attention regardless of time zone or working hours." },
      ]},
      { heading: "Testing Channels", body: "Each enabled channel has a ▶ TEST button in the card header. In the current version, the test is simulated — it confirms the UI flow and configuration are set up correctly, but no real alert is delivered. A SIMULATED confirmation appears after the test completes. A backend integration is required to enable live delivery. All configuration settings are saved and ready for when a backend is connected." },
      { tip: "Configure at least two channels for redundancy. If email delivery is delayed during a high-severity incident, a Slack or SMS alert ensures the team is notified immediately. A webhook integration additionally ensures your SIEM captures the event regardless of whether a human reads the alert in time." },
    ]
  },

  {
    title: "Threat Type Reference",
    intro: "Every finding in DARKWATCH is classified by threat type. Understanding each type helps you prioritise your response correctly and interpret both the live feed and report findings accurately.",
    sections: [
      { heading: "Threat Type Definitions", threats: [
        { type: "Data Leak",           severity: "critical", color: "#ff2d55", desc: "A dataset containing your organisational data (customer records, internal documents, employee info) has been posted or is being sold. Requires immediate containment and legal notification assessment." },
        { type: "Credential Exposure", severity: "high",     color: "#ff6b35", desc: "Employee or system credentials matching your domain have been found in stealer logs or combo lists. Affected accounts must be locked and passwords reset immediately." },
        { type: "Sale Listing",        severity: "critical", color: "#ff2d55", desc: "A threat actor is actively selling data, access, source code, or credentials claimed to be from your organisation. The listing itself confirms a breach has occurred or is imminent." },
        { type: "Mention",             severity: "medium",   color: "#ff9500", desc: "Your brand, personnel, or assets have been referenced in a threat actor context. Ranges from passive discussion to active attack planning. Context determines urgency." },
        { type: "Phishing Kit",        severity: "critical", color: "#ff2d55", desc: "A fake version of your website or login portal is live and actively harvesting victim credentials. Requires immediate domain takedown request and customer advisory." },
        { type: "Typosquat",           severity: "high",     color: "#ff6b35", desc: "A domain visually similar to yours has been registered, configured for phishing or brand impersonation. Submit for UDRP takedown and monitor for customer complaints." },
        { type: "Exploit Listing",     severity: "high",     color: "#ff6b35", desc: "A vulnerability in your systems or IP range is being traded. If specific to your infrastructure, treat as a pre-breach signal and prioritise patching immediately." },
        { type: "Doxxing",             severity: "critical", color: "#ff2d55", desc: "Personal information of a VIP or employee has been publicly posted. Notify the affected individual immediately, review physical security, and escalate to legal." },
        { type: "Counterfeit",         severity: "high",     color: "#ff6b35", desc: "Fake versions of your physical or digital products are being manufactured or sold, impacting brand trust and creating customer safety risks." },
        { type: "Impersonation",       severity: "high",     color: "#ff6b35", desc: "A fake account posing as your brand or an executive is active on social media or messaging platforms, used to defraud customers or conduct social engineering." },
      ]},
      { heading: "How Threat Types Affect Reports", body: "In the Operational Report, findings are grouped and charted by threat type with percentage breakdowns. The analyst action queue auto-generates specific ticket types based on which threat types are present — for example, a Phishing Kit finding triggers a PH-series takedown ticket, while Data Leak findings trigger a DL-series impact assessment ticket. In the Executive Report, the board recommendations reference threat types in plain language without technical jargon." },
    ]
  },

  {
    id: "severity", icon: "▲", label: "Severity Levels",
    title: "Severity Level Guide",
    intro: "DARKWATCH rates every finding on a four-tier severity scale. Each level drives a different risk bar state, a different report section emphasis, and a different recommended response timeline.",
    sections: [
      { heading: "Severity Definitions & Response Matrix", severities: [
        { level: "CRITICAL", color: "#ff2d55", bg: "rgba(255,45,85,0.12)", response: "Immediate — within 1 hour", score: "9–10", actions: ["Engage incident response team", "Notify legal and executive leadership", "Begin containment procedures", "Assess regulatory notification requirements", "Preserve evidence for forensics"] },
        { level: "HIGH",     color: "#ff6b35", bg: "rgba(255,107,53,0.12)", response: "Same day — within 4 hours", score: "7–8", actions: ["Assign to senior security analyst", "Verify finding authenticity", "Initiate investigation workflow", "Notify relevant business owners"] },
        { level: "MEDIUM",   color: "#ff9500", bg: "rgba(255,149,0,0.12)", response: "Within 24–48 hours", score: "4–6", actions: ["Log in threat intelligence platform", "Assign for investigation", "Increase monitoring frequency", "Assess potential impact scope"] },
        { level: "LOW",      color: "#30d158", bg: "rgba(48,209,88,0.08)", response: "Weekly review cycle", score: "1–3", actions: ["Add to threat log", "Review in weekly security briefing", "No immediate action required"] },
      ]},
      { heading: "Severity in the Live Feed", body: "In the live threat feed, each card is colour-coded by severity. Critical findings have a pulsing red glow animation (threatPulse) that draws immediate attention. NEW badges on freshly injected findings are also coloured to match their severity level." },
      { heading: "Severity in Reports", body: "The Executive Report shows severity as KPI counts and a proportional breakdown bar. The Operational Report shows a per-severity count header and uses severity to drive the analyst action queue priority levels: Critical maps to P0 (immediate), High to P1 (same day), Medium to P2 (48 hours), and Low to P3 (weekly)." },
    ]
  },

  {
    id: "best-practices", icon: "★", label: "Best Practices",
    title: "Best Practices & Recommendations",
    intro: "Follow these guidelines to get maximum value from DARKWATCH — from profile configuration through to reporting cadence.",
    sections: [
      { heading: "Profile Configuration", tips: [
        { title: "Start with brand name and top domain", body: "Run an initial monitoring cycle with just these two fields. Review baseline results, then progressively add more signals each cycle to increase coverage without overwhelming the initial triage." },
        { title: "Add all domain variants", body: "Include regional TLDs (.co.uk, .de), product subdomains, and legacy domains you no longer actively use. Attackers target all of them, especially abandoned domains with no active monitoring." },
        { title: "Prioritise VIP coverage", body: "Executive doxxing and credential exposure are among the most operationally damaging threats. Add all C-suite names and email formats to the VIP section for maximum coverage." },
        { title: "Rotate project codenames in", body: "Each time a new internal project begins, add its codename to DARKWATCH immediately. Early detection of codename leaks often uncovers insider threats before full damage occurs." },
        { title: "Use exclusion keywords aggressively", body: "If your brand name is a common word or shares a name with another organisation, add exclusion terms from your first session to prevent false positive fatigue." },
      ]},
      { heading: "Reporting Best Practices", tips: [
        { title: "Match report type to audience", body: "Always use the Executive Report for board packs, investor briefings, and C-suite updates. Use the Operational Report for security team stand-ups, weekly analyst briefings, and incident documentation." },
        { title: "Run a deep scan before quarterly reports", body: "For quarterly board reports, allow a full scan cycle to complete immediately before generating the report. This ensures the findings reflect the most current intelligence available." },
        { title: "Generate both report types simultaneously", body: "For major reporting events (monthly management meetings, quarterly board packs), generate both the Executive and Operational reports in the same session. They complement each other — the executive summary and the detailed analyst queue together provide the full picture." },
        { title: "Use the weekly report for incident tracking", body: "During an active incident, generate a weekly Operational Report daily to track how the threat profile changes as your team responds. The period range and findings log provide a paper trail." },
        { title: "Archive PDF exports", body: "Use the Print / Export PDF feature to save each report at generation time. Build an archive of weekly, monthly, and quarterly reports to support trend analysis, board reporting history, and compliance audit trails." },
      ]},
      { heading: "Operational Workflow", tips: [
        { title: "Keep monitoring running continuously", body: "The 30-second demo cycle demonstrates real-time capability. In production, continuous mode ensures threat actors cannot operate in the window between manual scans — darkweb posts can appear and be acted on within hours." },
        { title: "Configure redundant alert channels", body: "Enable at least two notification channels so that if one delivery method fails during an incident, another ensures the team is notified. A recommended baseline is Email + Slack for day-to-day operations and SMS (Critical only) for out-of-hours coverage." },
        { title: "Tune severity thresholds per channel", body: "Set different minimum severity levels per channel to match the urgency profile of each medium. Slack can handle High and above for ambient analyst awareness; SMS should be restricted to Critical only; webhooks to your SIEM should receive all severities for full logging." },
        { title: "Treat Critical findings as active incidents", body: "Every CRITICAL finding should automatically trigger your incident response runbook. Speed of response is often the difference between containment and full breach." },
        { title: "Integrate the Operational Report with your SIEM", body: "The action item queue in the Operational Report maps directly to incident ticket structures. Use the ticket IDs (IR-01, CR-02, etc.) as reference numbers when logging findings in your SIEM or SOAR." },
        { title: "Brief the board quarterly with the Executive Report", body: "Schedule a standing agenda item to present the Quarterly Executive Report at each board meeting. The risk score trend, KPI metrics, and board recommendations provide the structure for a 5-minute threat briefing." },
      ]},
    ]
  },

  {
    id: "faq", icon: "?", label: "FAQ",
    title: "Frequently Asked Questions",
    intro: "Answers to the most common questions about DARKWATCH, the reporting module, continuous monitoring, and darkweb brand surveillance.",
    sections: [
      { heading: "General Questions", faqs: [
        { q: "Is DARKWATCH accessing illegal content?", a: "No. DARKWATCH indexes publicly accessible content on monitored sources for defensive threat intelligence purposes. It does not purchase data, interact with threat actors, or facilitate any illegal activity. All intelligence gathering is passive and observational." },
        { q: "How fresh is the data?", a: "In continuous mode, new intelligence is surfaced within the current scan cycle — 30 seconds in demo mode, hourly in production. The timestamp on each threat card shows exactly when the signal was detected. The risk bar and report findings always reflect the most recently completed scan cycle." },
        { q: "How do I pause monitoring?", a: "Click the PAUSE button in the application header. This halts all active scans and disables the rescan countdown. All existing findings and your profile configuration are preserved. Click RESUME MONITORING to restart from where you left off." },
        { q: "Can DARKWATCH remove darkweb content?", a: "No — DARKWATCH is an intelligence platform, not a takedown service. For content removal, engage a specialist brand protection or digital takedown service. DARKWATCH provides the intelligence needed to initiate those processes." },
        { q: "Do I need scan data to generate a report?", a: "The report module works best with active scan data. If no monitoring has been run, the report will render with empty findings. A banner in the Reports tab warns you if no data is available and directs you to activate monitoring first." },
      ]},
      { heading: "Reports Questions", faqs: [
        { q: "What is the difference between the Executive and Operational reports?", a: "The Executive Report is designed for non-technical board members and C-suite — it shows risk posture, KPI metrics, and plain-language board recommendations. The Operational Report is for security analysts — it shows full findings, per-type breakdowns, source rankings, and a prioritised analyst action queue with ticket IDs and deadlines." },
        { q: "What does the reporting period affect?", a: "The period label, date range, and trend comparisons in the report header all reflect the selected period (7, 30, or 90 days). Trend comparison values are modelled relative to the period length. In production, the period would filter findings by actual detection timestamp." },
        { q: "How do I export a report as PDF?", a: "Once a report is generated, click the PRINT / EXPORT PDF button in the report action bar. This opens the browser's native print dialog. Select 'Save as PDF' as the printer destination. Set margins to Minimal or None for the cleanest output." },
        { q: "Are report findings the same as the live feed?", a: "Yes — reports are generated from the same findings currently displayed in the live threat feed. The Executive Report aggregates them into KPIs and narrative summaries. The Operational Report lists them in a tabular log. Both reflect the findings from the current monitoring session." },
        { q: "Can I generate multiple report types in one session?", a: "Yes. Use the Report Type selector to switch between Executive and Operational, and re-generate as many times as needed. Each generation reflects the same underlying findings at the time of generation." },
      ]},
      { heading: "Alert Channel Questions", faqs: [
        { q: "How do I enable an alert channel?", a: "Navigate to the Scanner tab and expand Section 8 · Scan Configuration. Each channel (Email, Slack, Webhook, SMS) is displayed as a card. Click anywhere on the card header to toggle it on — the configuration fields will expand below. Fill in the required details and click ▶ TEST to verify delivery." },
        { q: "Can I set different severity thresholds per channel?", a: "Yes. Each channel has its own independent minimum severity selector (Critical, High, Medium, Low). This lets you configure Slack to receive High and above for ongoing analyst awareness, while SMS only fires for Critical findings to avoid alert fatigue." },
        { q: "What format does the webhook payload use?", a: "Each webhook delivery is a JSON object containing: severity, type, source, content, detectedAt (Unix timestamp in milliseconds), and brand. You can map these fields directly to your SIEM schema or use them to trigger SOAR playbooks." },
        { q: "Which SMS providers are supported?", a: "DARKWATCH supports Twilio, AWS SNS, and Vonage. All require API credentials (Account SID + Auth Token for Twilio, Access Key + Secret for AWS SNS, API Key + Secret for Vonage). Phone numbers must be in E.164 format (e.g. +442071234567)." },
        { q: "How do I test that my channel configuration is working?", a: "Each enabled channel has a ▶ TEST button in the card header. Note that in the current version, the test is simulated only — no real alert is delivered. A SIMULATED confirmation appears to confirm the UI flow is working. A backend integration is required for live delivery. Your configuration settings are saved and ready for when that integration is added." },
        { q: "What is daily digest mode for email?", a: "When digest mode is enabled on the Email channel, all alerts during a 24-hour window are bundled into a single summary email rather than sending one email per finding. This is recommended for medium-severity monitoring to reduce inbox noise. Disable it for Critical-level channels to ensure immediate notification." },
      ]},
      { heading: "Technical Questions", faqs: [
        { q: "What is a stealer log?", a: "Output from information-stealing malware (Redline, Raccoon, Vidar). When malware infects an employee's machine, it harvests saved passwords, browser cookies, and autofill data, then uploads it to a C2 server. These logs are sold or traded on darkweb markets and are a primary source of corporate credential exposure." },
        { q: "What is a combo list?", a: "A text file containing username:password pairs compiled from multiple previous breaches. Used in credential stuffing attacks — automated login attempts against your services using breached credentials from other sites." },
        { q: "What does .onion mean in source references?", a: ".onion is the domain suffix for TOR hidden services — websites only accessible through the TOR network. The .onion addresses shown in threat cards are truncated for display; they represent the source location of detected content." },
        { q: "What is typosquatting?", a: "The registration of domains visually similar to your real domain — exploiting common typos, homoglyph substitution, or added prefixes/suffixes. Used for phishing, brand impersonation, and traffic hijacking." },
      ]},
    ]
  },
];

// ─── Report Screen ────────────────────────────────────────────────────────────
function ReportScreen({ results, brand, entities, risk, scanCycle, lastScanTime, totalConfigured }) {
  const [reportType, setReportType]       = useState("executive"); // executive | operational
  const [reportPeriod, setReportPeriod]   = useState("weekly");    // weekly | monthly | quarterly
  const [generating, setGenerating]       = useState(false);
  const [generated, setGenerated]         = useState(false);
  const [printMode, setPrintMode]         = useState(false);
  const reportRef = useRef(null);

  const now = new Date();
  const periodLabel = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" }[reportPeriod];
  const periodRange = {
    weekly:    `${new Date(now - 7*864e5).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${now.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`,
    monthly:   `${new Date(now - 30*864e5).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${now.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`,
    quarterly: `${new Date(now - 90*864e5).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${now.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}`,
  }[reportPeriod];

  const critical = results.filter(r => r.severity === "critical");
  const high      = results.filter(r => r.severity === "high");
  const medium    = results.filter(r => r.severity === "medium");
  const low       = results.filter(r => r.severity === "low");

  // Simulated trend data for period
  const trendMultiplier = { weekly: 1, monthly: 3.2, quarterly: 9.7 }[reportPeriod];
  const prevCritical = Math.max(0, Math.round(critical.length * trendMultiplier * 0.72));
  const prevHigh     = Math.max(0, Math.round(high.length  * trendMultiplier * 0.85));
  const totalPeriod  = Math.round(results.length * trendMultiplier);
  const trend        = results.length > 0 ? ((results.length - prevCritical) / Math.max(1, prevCritical) * 100).toFixed(0) : 0;
  const trendUp      = Number(trend) > 0;

  // By-type breakdown
  const byType = Object.entries(
    results.reduce((acc, r) => { acc[r.type] = (acc[r.type]||0)+1; return acc; }, {})
  ).sort((a,b) => b[1]-a[1]);

  // Top sources
  const bySrc = Object.entries(
    results.reduce((acc, r) => { acc[r.source] = (acc[r.source]||0)+1; return acc; }, {})
  ).sort((a,b) => b[1]-a[1]).slice(0,5);

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => { window.print(); setTimeout(() => setPrintMode(false), 500); }, 100);
  };

  const noData = results.length === 0;

  // ── Shared style tokens ──
  const S = {
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 10, color: "#ff9500", letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid rgba(255,149,0,0.15)", display: "flex", alignItems: "center", gap: 8 },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "14px 16px" },
    label: { fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 },
    value: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" },
    body: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 },
  };

  const severityBar = (count, total, color) => (
    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${total ? (count/total*100) : 0}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
    </div>
  );

  // ── EXECUTIVE REPORT ──────────────────────────────────────────────────────
  const ExecutiveReport = () => (
    <div ref={reportRef} id="report-content">
      {/* Cover */}
      <div style={{ marginBottom: 32, padding: "28px 28px 24px", background: "linear-gradient(135deg, rgba(255,45,85,0.08) 0%, rgba(255,149,0,0.06) 100%)", border: "1px solid rgba(255,149,0,0.15)", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.6)", letterSpacing: "0.2em", marginBottom: 6 }}>DARKWATCH INTELLIGENCE ENTERPRISE — CONFIDENTIAL</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ff9500, #ff2d55)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Executive Threat Intelligence Report
            </h2>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{periodLabel} Summary · {periodRange}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>ORGANIZATION</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{brand || "—"}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Generated</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{now.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
        </div>
        {/* Risk posture highlight */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: `${risk.color}12`, border: `1px solid ${risk.color}33`, borderLeft: `4px solid ${risk.color}`, borderRadius: 7 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: `${risk.color}bb`, letterSpacing: "0.15em", marginBottom: 2 }}>CURRENT RISK POSTURE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: risk.color }}>{risk.level} RISK</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{risk.sublabel}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: risk.color, lineHeight: 1 }}>{risk.score}</div>
            <div style={{ fontSize: 8, color: `${risk.color}88` }}>THREAT SCORE / 10</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Executive Summary</div>
        <div style={{ ...S.card, lineHeight: 1 }}>
          <p style={S.body}>
            During the {periodLabel.toLowerCase()} reporting period ({periodRange}), DARKWATCH detected <strong style={{color:"#fff"}}>{totalPeriod} threat signals</strong> across monitored darkweb sources relating to <strong style={{color:"#fff"}}>{brand || "your organization"}</strong>. Of these, <strong style={{color:"#ff2d55"}}>{critical.length} were classified as Critical</strong> severity, requiring immediate executive attention.
          </p>
          <p style={{...S.body, marginTop: 10}}>
            The organization's overall threat score stands at <strong style={{color: risk.color}}>{risk.score}/10 ({risk.level})</strong>, representing a <strong style={{color: trendUp ? "#ff2d55" : "#30d158"}}>{trendUp ? "▲" : "▼"} {Math.abs(trend)}% {trendUp ? "increase" : "decrease"}</strong> compared to the previous {reportPeriod} period. {critical.length > 0 ? `The presence of ${critical.length} critical finding${critical.length > 1 ? "s" : ""} — including active data exposure and credential compromise — demands prioritised board-level response.` : "No critical findings were detected during this period, indicating a stable threat posture."}
          </p>
        </div>
      </div>

      {/* KPI metrics */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Key Risk Indicators</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Critical Findings",  value: critical.length, color: "#ff2d55", delta: `vs ${prevCritical} prior period` },
            { label: "High Severity",       value: high.length,     color: "#ff6b35", delta: `vs ${prevHigh} prior period` },
            { label: "Total Signals",       value: totalPeriod,     color: "rgba(255,255,255,0.6)", delta: `${periodLabel} total` },
            { label: "Sources Monitored",   value: totalConfigured, color: "#ff9500", delta: "configured signals" },
          ].map((m,i) => (
            <div key={i} style={{ ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: m.color, letterSpacing: "-1px" }}>{m.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "4px 0 2px" }}>{m.label}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.52)" }}>{m.delta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat breakdown */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Threat Severity Breakdown</div>
        <div style={S.card}>
          {[
            { label: "CRITICAL", count: critical.length, color: "#ff2d55", desc: "Requires immediate incident response engagement" },
            { label: "HIGH",     count: high.length,     color: "#ff6b35", desc: "Requires same-day analyst investigation" },
            { label: "MEDIUM",   count: medium.length,   color: "#ff9500", desc: "Requires review within 24–48 hours" },
            { label: "LOW",      count: low.length,      color: "#30d158", desc: "Scheduled for weekly review cycle" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{ width: 64, fontSize: 9, fontWeight: 700, color: row.color, letterSpacing: "0.08em", textAlign: "right" }}>{row.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: row.color, width: 28, textAlign: "center" }}>{row.count}</div>
              {severityBar(row.count, results.length, row.color)}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", width: 240, flexShrink: 0 }}>{row.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Board recommendations */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Board-Level Recommendations</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            critical.length > 0 && { priority: "IMMEDIATE", color: "#ff2d55", action: "Activate Incident Response", detail: `${critical.length} critical threat${critical.length>1?"s":""} require immediate IR team engagement. Brief CISO and legal counsel within 24 hours.` },
            high.length > 0     && { priority: "THIS WEEK",  color: "#ff6b35", action: "Credential Security Audit",   detail: `${high.length} high-severity findings include credential exposure signals. Mandate password resets for affected accounts and review MFA coverage.` },
            medium.length > 0   && { priority: "THIS MONTH", color: "#ff9500", action: "Threat Landscape Review",     detail: `Review medium-severity findings with the security team. Assess whether current security investments address the identified threat vectors.` },
            { priority: "ONGOING", color: "#30d158", action: "Continuous Monitoring Posture",  detail: `Maintain DARKWATCH continuous monitoring. Ensure executive dashboard is reviewed at each board meeting. Schedule next formal threat review.` },
          ].filter(Boolean).map((rec, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "13px 16px", background: `${rec.color}0d`, border: `1px solid ${rec.color}28`, borderLeft: `3px solid ${rec.color}`, borderRadius: 6 }}>
              <div style={{ width: 80, flexShrink: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: rec.color, letterSpacing: "0.1em" }}>{rec.priority}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{rec.action}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{rec.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5 }}>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.7 }}>
          CONFIDENTIAL — FOR BOARD AND C-SUITE USE ONLY. This report contains sensitive threat intelligence gathered by Darkwatch Intelligence Enterprise for defensive security purposes. Distribution outside of authorised recipients is prohibited. Data sourced from monitored darkweb and threat intelligence feeds. Findings are for awareness and risk management purposes and do not constitute legal evidence. Generated: {now.toLocaleString()}.
        </p>
      </div>
    </div>
  );

  // ── OPERATIONAL REPORT ────────────────────────────────────────────────────
  const OperationalReport = () => (
    <div ref={reportRef} id="report-content">
      {/* Header */}
      <div style={{ marginBottom: 28, padding: "22px 24px 20px", background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.18)", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,107,53,0.7)", letterSpacing: "0.2em", marginBottom: 5 }}>DARKWATCH INTELLIGENCE ENTERPRISE — SECURITY OPERATIONS</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 3px", letterSpacing: "-0.4px", color: "#fff" }}>Operational Threat Intelligence Report</h2>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{periodLabel} Summary · {periodRange} · {brand || "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: risk.color, lineHeight: 1 }}>{risk.score}</div>
            <div style={{ fontSize: 8, color: `${risk.color}88`, letterSpacing:"0.1em" }}>THREAT SCORE</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: risk.color, marginTop: 3 }}>{risk.level}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Critical", val: critical.length, color: "#ff2d55" },
            { label: "High",     val: high.length,     color: "#ff6b35" },
            { label: "Medium",   val: medium.length,   color: "#ff9500" },
            { label: "Low",      val: low.length,      color: "#30d158" },
            { label: "Total",    val: results.length,  color: "rgba(255,255,255,0.5)" },
          ].map((s,i) => (
            <div key={i} style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: `1px solid ${s.color}33`, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat type breakdown */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Threat Classification Breakdown</div>
        <div style={S.card}>
          {byType.length > 0 ? byType.map(([type, count], i) => {
            const cfg = THREAT_TYPES[type] || { label: type, color: "#ff9500" };
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < byType.length-1 ? 10 : 0 }}>
                <div style={{ width: 130, fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count/results.length)*100}%`, background: cfg.color, borderRadius: 3 }} />
                </div>
                <div style={{ width: 24, fontSize: 11, fontWeight: 700, color: cfg.color, textAlign: "right" }}>{count}</div>
                <div style={{ width: 36, fontSize: 9, color: "rgba(255,255,255,0.58)", textAlign: "right" }}>{((count/results.length)*100).toFixed(0)}%</div>
              </div>
            );
          }) : <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No findings to display</div>}
        </div>
      </div>

      {/* Source intelligence */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Top Intelligence Sources</div>
        <div style={S.card}>
          {bySrc.length > 0 ? bySrc.map(([src, count], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < bySrc.length-1 ? 10 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,149,0,0.15)", border: "1px solid rgba(255,149,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#ff9500", fontWeight: 800, flexShrink: 0 }}>{i+1}</div>
              <div style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{src}</div>
              <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count/results.length)*100}%`, background: "rgba(255,149,0,0.7)", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: "#ff9500", fontWeight: 700, width: 20, textAlign: "right" }}>{count}</div>
            </div>
          )) : <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No source data</div>}
        </div>
      </div>

      {/* Full findings table */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Full Findings Log — {periodLabel} Period</div>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 110px 130px 1fr 80px", gap: 0, background: "rgba(255,255,255,0.04)", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["SEVERITY","TYPE","SOURCE","FINDING","DETECTED"].map((h,i) => (
              <div key={i} style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em" }}>{h}</div>
            ))}
          </div>
          {results.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>No findings in current period.</div>
          )}
          {results.slice(0, 30).map((r, i) => {
            const sev = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
            const typ = THREAT_TYPES[r.type] || { label: r.type, color: "#ff9500" };
            let content = r.content;
            entities.brands.forEach(b => { content = content.replace(/{BRAND}/g, b).replace(/{BRAND_DOMAIN}/g, b.toLowerCase().replace(/\s/g,"")+ ".com"); });
            if (entities.vips[0])      content = content.replace(/{VIP}/g, entities.vips[0]);
            if (entities.projects[0])  content = content.replace(/{PROJECT}/g, entities.projects[0]);
            if (entities.products[0])  content = content.replace(/{PRODUCT}/g, entities.products[0]);
            if (entities.domains[0])   content = content.replace(/{DOMAIN}/g, entities.domains[0]);
            if (entities.ips[0])       content = content.replace(/{IP_RANGE}/g, entities.ips[0]);
            return (
              <div key={r.uid||i} style={{ display: "grid", gridTemplateColumns: "80px 110px 130px 1fr 80px", gap: 0, padding: "9px 14px", borderBottom: i < results.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i%2===0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: sev.color, letterSpacing: "0.07em", paddingTop: 1 }}>{sev.label}</div>
                <div style={{ fontSize: 9, color: typ.color }}>{typ.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,149,0,0.55)", paddingRight: 8 }}>{r.source}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, paddingRight: 10 }}>{content.length > 100 ? content.slice(0,100)+"…" : content}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>{r.detectedAt ? timeAgo(r.detectedAt) : "—"}</div>
              </div>
            );
          })}
          {results.length > 30 && (
            <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.02)", fontSize: 9, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
              + {results.length - 30} additional findings — export full report for complete log
            </div>
          )}
        </div>
      </div>

      {/* Analyst recommendations */}
      <div style={S.section}>
        <div style={S.sectionTitle}>◈ Analyst Action Items — {periodLabel} Priority Queue</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            critical.length > 0 && { id:"IR-01", priority:"P0", color:"#ff2d55", owner:"IR Team", deadline:"< 1h",    action:"Initiate incident response for critical findings",            detail:`${critical.length} critical signal${critical.length>1?"s require":"requires"} immediate IR engagement. Preserve forensic evidence. Notify legal.` },
            high.length > 0     && { id:"CR-02", priority:"P1", color:"#ff6b35", owner:"SOC L2",  deadline:"< 4h",    action:"Credential exposure sweep and forced resets",                 detail:`Identify all accounts matching exposed credential patterns. Enforce password resets. Review SSO and MFA coverage.` },
            results.some(r=>r.type==="phishing") && { id:"PH-03", priority:"P1", color:"#ff6b35", owner:"SOC L2", deadline:"< 4h", action:"Phishing kit takedown request",           detail:"Submit takedown requests to hosting provider and registrar. Alert customer communications team to issue advisory." },
            results.some(r=>r.type==="data_leak")  && { id:"DL-04", priority:"P1", color:"#ff6b35", owner:"Legal/SOC", deadline:"< 8h", action:"Data leak impact assessment",          detail:"Assess scope of leaked data. Determine if PII is involved. Begin regulatory notification assessment (GDPR 72h clock)." },
            results.some(r=>r.type==="typosquat")  && { id:"TS-05", priority:"P2", color:"#ff9500", owner:"Brand",     deadline:"3 days", action:"Typosquat domain UDRP filing",        detail:"File UDRP takedown for confirmed typosquatted domains. Block domains at DNS/proxy layer pending resolution." },
            medium.length > 0   && { id:"MN-06", priority:"P2", color:"#ff9500", owner:"SOC L1",  deadline:"48h",    action:"Medium findings triage and investigation",                   detail:`${medium.length} medium-severity finding${medium.length>1?"s":""} require analyst triage. Assess potential escalation risk.` },
            { id:"PM-07",        priority:"P3", color:"#30d158", owner:"SOC L1",  deadline:"1 week", action:"Update threat profile with new intelligence",                 detail:"Review newly identified sources and patterns. Update monitoring keywords and exclusion lists based on this period's findings." },
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "11px 14px", background: `${item.color}0a`, border: `1px solid ${item.color}22`, borderLeft: `3px solid ${item.color}`, borderRadius: 6 }}>
              <div style={{ flexShrink: 0, width: 44 }}>
                <div style={{ fontSize: 8, color: item.color, fontWeight: 800, letterSpacing: "0.08em" }}>{item.id}</div>
                <div style={{ fontSize: 8, color: item.color, background: `${item.color}22`, padding: "1px 4px", borderRadius: 2, marginTop: 2, letterSpacing: "0.06em", textAlign: "center" }}>{item.priority}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{item.action}</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{item.detail}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", marginBottom: 2 }}>OWNER</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{item.owner}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>DEADLINE</div>
                <div style={{ fontSize: 9, color: item.color, fontWeight: 700 }}>{item.deadline}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5 }}>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.7 }}>
          RESTRICTED — SECURITY OPERATIONS USE ONLY. This operational report contains detailed threat intelligence findings for {brand || "the monitored organization"}. Data sourced from Darkwatch Intelligence Enterprise continuous monitoring engine. Scan cycles completed: {scanCycle}. Last updated: {lastScanTime || now.toLocaleTimeString()}. Generated: {now.toLocaleString()}.
        </p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Report builder controls */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.15em", marginBottom: 14 }}>◈ REPORT CONFIGURATION</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {/* Report type */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 10 }}>REPORT TYPE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "executive",   icon: "◈", label: "Executive Report",   desc: "Board & C-suite · Risk posture, KPIs, strategic recommendations" },
                { id: "operational", icon: "⚙", label: "Operational Report",  desc: "Security team · Full findings, action items, analyst queue" },
              ].map(opt => (
                <div key={opt.id} onClick={() => { setReportType(opt.id); setGenerated(false); }} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 6, cursor: "pointer", background: reportType===opt.id ? "rgba(255,149,0,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${reportType===opt.id ? "rgba(255,149,0,0.35)" : "rgba(255,255,255,0.06)"}`, transition: "all 0.15s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${reportType===opt.id ? "#ff9500" : "rgba(255,255,255,0.5)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {reportType===opt.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff9500" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: reportType===opt.id ? "#fff" : "rgba(255,255,255,0.5)", marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", lineHeight: 1.4 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report period */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 10 }}>REPORTING PERIOD</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "weekly",    label: "Weekly Report",    range: "Last 7 days",  desc: "Tactical — routine security team review" },
                { id: "monthly",   label: "Monthly Report",   range: "Last 30 days", desc: "Operational — management reporting cycle" },
                { id: "quarterly", label: "Quarterly Report", range: "Last 90 days", desc: "Strategic — board and executive briefing" },
              ].map(opt => (
                <div key={opt.id} onClick={() => { setReportPeriod(opt.id); setGenerated(false); }} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 6, cursor: "pointer", background: reportPeriod===opt.id ? "rgba(255,149,0,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${reportPeriod===opt.id ? "rgba(255,149,0,0.35)" : "rgba(255,255,255,0.06)"}`, transition: "all 0.15s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${reportPeriod===opt.id ? "#ff9500" : "rgba(255,255,255,0.5)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {reportPeriod===opt.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff9500" }} />}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: reportPeriod===opt.id ? "#fff" : "rgba(255,255,255,0.5)" }}>{opt.label}</span>
                      <span style={{ fontSize: 8, color: "rgba(255,149,0,0.5)", background: "rgba(255,149,0,0.08)", padding: "1px 5px", borderRadius: 3 }}>{opt.range}</span>
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data availability warning */}
        {noData && (
          <div style={{ padding: "10px 14px", background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.18)", borderRadius: 6, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#ff9500", fontSize: 14 }}>⚠</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>No threat data available. Activate continuous monitoring from the Scanner tab to populate report findings.</span>
          </div>
        )}

        {/* Generate button */}
        <button onClick={generateReport} style={{ width: "100%", padding: "13px", borderRadius: 7, cursor: "pointer", background: "linear-gradient(135deg, #ff9500, #ff6b35, #ff2d55)", border: "none", color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", transition: "all 0.3s", boxShadow: "0 0 24px rgba(255,149,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {generating ? (
            <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.6)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />GENERATING {periodLabel.toUpperCase()} {reportType.toUpperCase()} REPORT...</>
          ) : (
            `⊕ GENERATE ${periodLabel.toUpperCase()} ${reportType === "executive" ? "EXECUTIVE" : "OPERATIONAL"} REPORT`
          )}
        </button>
      </div>

      {/* Generated report */}
      {generated && !generating && (
        <div>
          {/* Report action bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "rgba(48,209,88,0.07)", border: "1px solid rgba(48,209,88,0.2)", borderRadius: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#30d158", fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                <strong style={{ color: "#fff" }}>{periodLabel} {reportType === "executive" ? "Executive" : "Operational"} Report</strong> generated — {periodRange}
              </span>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => setGenerated(false)} style={{ padding: "5px 12px", borderRadius: 5, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 9 }}>✕ CLOSE</button>
              <button onClick={handlePrint} style={{ padding: "5px 14px", borderRadius: 5, cursor: "pointer", background: "rgba(255,149,0,0.15)", border: "1px solid rgba(255,149,0,0.35)", color: "#ff9500", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}>⊞ PRINT / EXPORT PDF</button>
            </div>
          </div>

          {/* Report content */}
          <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "28px 28px" }}>
            {reportType === "executive" ? <ExecutiveReport /> : <OperationalReport />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contact Screen ───────────────────────────────────────────────────────────
function ContactScreen({ risk }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const regionalNumbers = [
    { region: "United Kingdom", flag: "🇬🇧", number: "+44 1235 635329", primary: true },
    { region: "United States",  flag: "🇺🇸", number: "+1 408 746 1064", primary: true },
    { region: "Australia",      flag: "🇦🇺", number: "+61 2 7208 4454" },
    { region: "Austria",        flag: "🇦🇹", number: "+43 7326 5575520" },
    { region: "Canada",         flag: "🇨🇦", number: "+1 778 589 7255" },
    { region: "France",         flag: "🇫🇷", number: "+33 1 8653 9880" },
    { region: "Germany",        flag: "🇩🇪", number: "+49 6117 1186766" },
    { region: "Italy",          flag: "🇮🇹", number: "+39 02 9475 2897" },
    { region: "Japan",          flag: "🇯🇵", number: "+81 50 4560 2850" },
    { region: "Switzerland",    flag: "🇨🇭", number: "+41 44 515 2286" },
  ];

  const CopyBtn = ({ text, id }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      style={{ background: copiedKey === id ? "rgba(48,209,88,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${copiedKey === id ? "rgba(48,209,88,0.35)" : "rgba(255,255,255,0.1)"}`, color: copiedKey === id ? "#30d158" : "rgba(255,255,255,0.7)", padding: "3px 9px", borderRadius: 4, cursor: "pointer", fontSize: 9, letterSpacing: "0.06em", transition: "all 0.2s", flexShrink: 0 }}
    >
      {copiedKey === id ? "✓ COPIED" : "COPY"}
    </button>
  );

  return (
    <div>
      {/* ── Emergency header banner ── */}
      <div style={{ marginBottom: 24, padding: "20px 22px", background: "linear-gradient(135deg, rgba(255,45,85,0.12), rgba(255,107,53,0.08))", border: "1px solid rgba(255,45,85,0.3)", borderLeft: "4px solid #ff2d55", borderRadius: 10, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", background: "linear-gradient(90deg, transparent 0%, rgba(255,45,85,0.06) 50%, transparent 100%)", animation: "scanLine 4s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff2d55", boxShadow: "0 0 8px #ff2d55", animation: "blink 1s infinite" }} />
              <span style={{ fontSize: 9, color: "rgba(255,45,85,0.8)", letterSpacing: "0.2em", fontWeight: 700 }}>EMERGENCY INCIDENT RESPONSE</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.3px", color: "#fff" }}>Sophos Incident Response</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6, maxWidth: 480 }}>
              Experiencing an active attack or confirmed breach? Contact Sophos Emergency Incident Response immediately. Our 24/7 team of remote incident responders, threat analysts, and threat hunters will begin onboarding within hours.
            </p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0, background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 9, color: "rgba(255,45,85,0.7)", letterSpacing: "0.15em", marginBottom: 4 }}>AVAILABILITY</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#ff2d55", lineHeight: 1 }}>24 / 7</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 3, letterSpacing: "0.08em" }}>365 DAYS</div>
          </div>
        </div>

        {/* Risk-aware alert if currently critical/high */}
        {(risk.level === "CRITICAL" || risk.level === "HIGH") && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: `${risk.color}15`, border: `1px solid ${risk.color}40`, borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: risk.color, animation: "blink 1s infinite" }}>⚠</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
              DARKWATCH has detected a <strong style={{ color: risk.color }}>{risk.level} risk level</strong> for your organisation. If you believe an active incident is underway, call Sophos Incident Response immediately using the numbers below.
            </span>
          </div>
        )}
      </div>

      {/* ── Primary contact methods ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(255,149,0,0.7)", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>◈ PRIMARY CONTACT</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* Web portal */}
          <div style={{ background: "rgba(255,45,85,0.07)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,45,85,0.15)", border: "1px solid rgba(255,45,85,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚨</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Emergency Portal</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>Fastest way to engage</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 12 }}>
              Submit an emergency incident directly through the Sophos portal. An Incident Advisor will respond immediately.
            </div>
            <a href="https://www.sophos.com/en-us/products/incident-response-services/emergency-response" target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "9px 14px", borderRadius: 6, background: "linear-gradient(135deg, #ff2d55, #ff6b35)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textDecoration: "none", textAlign: "center" }}>
              ⚡ GET EMERGENCY HELP →
            </a>
          </div>

          {/* Email */}
          <div style={{ background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.22)", borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✉</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Support Portal</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>For case tracking & follow-up</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 12 }}>
              Log and track your incident case through the Sophos support portal. Recommended for ongoing case management after initial phone contact.
            </div>
            <a href="https://support.sophos.com" target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "9px 14px", borderRadius: 6, background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)", color: "#ff6b35", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textDecoration: "none", textAlign: "center" }}>
              ◎ OPEN SUPPORT PORTAL →
            </a>
          </div>
        </div>
      </div>

      {/* ── Regional phone numbers ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(255,149,0,0.7)", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>◈ REGIONAL EMERGENCY NUMBERS — CALL ANY TIME</div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr auto", gap: 0, padding: "8px 16px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["", "REGION", "PHONE NUMBER", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 8, color: "rgba(255,255,255,0.58)", letterSpacing: "0.12em" }}>{h}</div>
            ))}
          </div>
          {regionalNumbers.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr auto", gap: 0, alignItems: "center", padding: "11px 16px", borderBottom: i < regionalNumbers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: r.primary ? "rgba(255,45,85,0.04)" : (i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)") }}>
              <div style={{ fontSize: 14 }}>{r.flag}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 12, color: r.primary ? "#fff" : "rgba(255,255,255,0.65)", fontWeight: r.primary ? 700 : 400 }}>{r.region}</span>
                {r.primary && <span style={{ fontSize: 8, color: "#ff2d55", background: "rgba(255,45,85,0.15)", border: "1px solid rgba(255,45,85,0.3)", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.08em" }}>PRIMARY</span>}
              </div>
              <a href={`tel:${r.number.replace(/\s/g, "")}`} style={{ fontSize: 12, color: r.primary ? "#ff9500" : "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: r.primary ? 700 : 400, fontFamily: "monospace", letterSpacing: "0.04em" }}>
                {r.number}
              </a>
              <CopyBtn text={r.number} id={`phone-${i}`} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: "rgba(255,255,255,0.52)", paddingLeft: 4 }}>
          Source: sophos.com/en-us/products/incident-response-services · Numbers verified from Sophos official website
        </div>
      </div>

      {/* ── What to have ready ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(255,149,0,0.7)", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>◈ WHAT TO HAVE READY BEFORE YOU CALL</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: "◉", title: "Organisation details",     body: "Company name, size (number of devices/employees), industry sector, and primary contact name and role." },
            { icon: "⚑", title: "Nature of the incident",   body: "Type of attack suspected (ransomware, data breach, phishing, unauthorized access), first signs observed, and estimated time of detection." },
            { icon: "◈", title: "Affected systems",         body: "Which systems, endpoints, or services are affected. Whether containment has begun. Whether backups are available and intact." },
            { icon: "▲", title: "DARKWATCH threat data",     body: "Your current DARKWATCH threat score, active critical findings, and any relevant intelligence from the live feed that may relate to the incident." },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <span style={{ color: "#ff9500", fontSize: 11 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{item.title}</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What Sophos IR provides ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(255,149,0,0.7)", letterSpacing: "0.15em", marginBottom: 12, fontWeight: 700 }}>◈ SOPHOS EMERGENCY IR — WHAT YOU GET</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { icon: "⚡", label: "Rapid onboarding",         desc: "Onboarding begins within hours of first contact. The majority of customers are triaged within 48 hours." },
            { icon: "◉", label: "24/7 remote response",      desc: "A dedicated team of remote incident responders, threat analysts, and threat hunters works around the clock on your case." },
            { icon: "⚑", label: "Active threat elimination", desc: "The team identifies and neutralises active threats — ransomware, malware, unauthorized access, and advanced persistent threats." },
            { icon: "◈", label: "Digital forensics",         desc: "Full forensic investigation including attack vector identification, persistence mechanism discovery, and threat actor behaviour analysis." },
            { icon: "▲", label: "Post-incident monitoring",  desc: "After the immediate threat is neutralised, Sophos monitors for recurrence to ensure the environment remains secure." },
            { icon: "◎", label: "Available to all",          desc: "Sophos Emergency IR is available to both existing Sophos customers and organisations using other security vendors." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
              <span style={{ color: "#ff9500", fontSize: 13, flexShrink: 0, width: 18, textAlign: "center" }}>{item.icon}</span>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{item.label} — </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.7 }}>
          Contact information sourced from sophos.com/en-us/products/incident-response-services. Phone numbers and portal links are provided for emergency use and are subject to change — verify current details at sophos.com before contacting. Darkwatch Intelligence Enterprise is not affiliated with Sophos Ltd. This contact module is provided for customer convenience only.
        </p>
      </div>
    </div>
  );
}

// ─── Doc Screen ───────────────────────────────────────────────────────────────
function DocScreen() {
  const [activeDoc, setActiveDoc] = useState("overview");
  const [search, setSearch] = useState("");
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const doc = DOCS.find(d => d.id === activeDoc);
  const sl = search.toLowerCase();
  const matchesSearch = t => !search || t.toLowerCase().includes(sl);
  const filteredDocs = search ? DOCS.filter(d => d.title.toLowerCase().includes(sl) || d.sections.some(s => (s.heading||"").toLowerCase().includes(sl) || (s.body||"").toLowerCase().includes(sl) || (s.faqs||[]).some(f => f.q.toLowerCase().includes(sl) || f.a.toLowerCase().includes(sl)) || (s.fields||[]).some(f => f.name.toLowerCase().includes(sl)) || (s.threats||[]).some(t => t.type.toLowerCase().includes(sl)) || (s.tips||[]).some(t => t.title.toLowerCase().includes(sl)) || (s.options||[]).some(o => o.name.toLowerCase().includes(sl)))) : DOCS;
  const hl = text => { if (!search) return text; const i = text.toLowerCase().indexOf(sl); if (i === -1) return text; return <>{text.slice(0,i)}<mark style={{background:"rgba(255,149,0,0.3)",color:"#fff",borderRadius:2,padding:"0 2px"}}>{text.slice(i,i+search.length)}</mark>{text.slice(i+search.length)}</>; };
  const toggleFaq = k => setExpandedFaqs(p => ({...p,[k]:!p[k]}));
  const P = ({children,style}) => <p style={{fontSize:13,color:"rgba(255,255,255,0.62)",lineHeight:1.8,margin:"0 0 14px",...style}}>{children}</p>;
  const H2 = ({children}) => <div style={{fontSize:10,color:"#ff9500",letterSpacing:"0.15em",fontWeight:700,margin:"22px 0 10px",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}><span style={{flex:1,height:1,background:"rgba(255,149,0,0.2)"}} />{children}<span style={{flex:3,height:1,background:"rgba(255,149,0,0.2)"}} /></div>;

  const renderSection = (s, si) => (
    <div key={si}>
      {s.heading && <H2>{s.heading}</H2>}
      {s.body && <P>{hl(s.body)}</P>}
      {s.tip && <div style={{background:"rgba(255,149,0,0.07)",border:"1px solid rgba(255,149,0,0.2)",borderLeft:"3px solid #ff9500",borderRadius:5,padding:"9px 13px",marginBottom:14}}><div style={{fontSize:9,color:"#ff9500",letterSpacing:"0.15em",marginBottom:3}}>◈ PRO TIP</div><P style={{margin:0}}>{hl(s.tip)}</P></div>}
      {s.steps && <div style={{marginBottom:14}}>{s.steps.map((st,i) => <div key={i} style={{display:"flex",gap:12,marginBottom:12}}><div style={{width:26,height:26,borderRadius:"50%",background:"rgba(255,149,0,0.15)",border:"1px solid rgba(255,149,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,color:"#ff9500",fontWeight:800}}>{i+1}</div><div><div style={{fontSize:11,color:"#fff",fontWeight:700,marginBottom:3}}>{hl(st.label)}</div><P style={{margin:0}}>{hl(st.desc)}</P></div></div>)}</div>}
      {s.fields && <div style={{marginBottom:14}}>{s.fields.filter(f=>matchesSearch(f.name)||matchesSearch(f.desc)).map((f,i)=><div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:6,padding:"12px 14px",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}><span style={{fontSize:11,color:"#fff",fontWeight:700}}>{hl(f.name)}</span>{f.required&&<span style={{fontSize:8,background:"rgba(255,45,85,0.2)",color:"#ff2d55",border:"1px solid rgba(255,45,85,0.3)",padding:"1px 5px",borderRadius:3}}>REQUIRED</span>}</div><P style={{margin:"0 0 7px"}}>{hl(f.desc)}</P><div style={{fontSize:9,color:"rgba(255,255,255,0.52)",fontFamily:"monospace"}}>Example: <span style={{color:"rgba(255,149,0,0.6)"}}>{f.example}</span></div></div>)}</div>}
      {s.options && <div style={{marginBottom:14}}>{s.options.filter(o=>matchesSearch(o.name)||matchesSearch(o.desc)).map((o,i)=><div key={i} style={{display:"flex",gap:11,marginBottom:9,padding:"11px 13px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:5}}><div style={{width:5,height:5,borderRadius:"50%",background:"#ff9500",marginTop:5,flexShrink:0}} /><div><div style={{fontSize:11,color:"#ff9500",fontWeight:700,marginBottom:3}}>{hl(o.name)}</div><P style={{margin:0}}>{hl(o.desc)}</P></div></div>)}</div>}
      {s.threats && <div style={{marginBottom:14}}>{s.threats.filter(t=>matchesSearch(t.type)||matchesSearch(t.desc)).map((t,i)=><div key={i} style={{background:`${t.color}10`,border:`1px solid ${t.color}33`,borderLeft:`3px solid ${t.color}`,borderRadius:5,padding:"12px 14px",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}><span style={{fontSize:11,fontWeight:700,color:t.color}}>{hl(t.type)}</span><span style={{fontSize:8,color:"rgba(255,255,255,0.6)",background:"rgba(255,255,255,0.05)",padding:"1px 6px",borderRadius:3}}>{t.severity.toUpperCase()}</span></div><P style={{margin:0}}>{hl(t.desc)}</P></div>)}</div>}
      {s.severities && <div style={{marginBottom:14}}>{s.severities.map((sv,i)=><div key={i} style={{background:sv.bg,border:`1px solid ${sv.color}33`,borderLeft:`3px solid ${sv.color}`,borderRadius:6,padding:"14px 16px",marginBottom:9}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}><div style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:12,fontWeight:800,color:sv.color}}>{sv.level}</span><span style={{fontSize:9,color:"rgba(255,255,255,0.6)"}}>Score {sv.score}</span></div><span style={{fontSize:9,color:sv.color,background:`${sv.color}22`,padding:"2px 7px",borderRadius:3}}>Respond: {sv.response}</span></div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{sv.actions.map((a,j)=><span key={j} style={{fontSize:9,color:"rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",padding:"2px 8px",borderRadius:4}}>→ {a}</span>)}</div></div>)}</div>}
      {s.tips && <div style={{marginBottom:14}}>{s.tips.filter(t=>matchesSearch(t.title)||matchesSearch(t.body)).map((t,i)=><div key={i} style={{marginBottom:10,paddingLeft:14,borderLeft:"2px solid rgba(255,149,0,0.25)"}}><div style={{fontSize:11,color:"#fff",fontWeight:700,marginBottom:3}}>{hl(t.title)}</div><P style={{margin:0}}>{hl(t.body)}</P></div>)}</div>}
      {s.faqs && <div style={{marginBottom:14}}>{s.faqs.filter(f=>matchesSearch(f.q)||matchesSearch(f.a)).map((f,i)=>{ const k=`${si}-${i}`; const open=expandedFaqs[k]; return <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:6,marginBottom:5,overflow:"hidden"}}><div onClick={()=>toggleFaq(k)} style={{padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none"}}><span style={{fontSize:12,color:"rgba(255,255,255,0.72)",fontWeight:600,flex:1,paddingRight:10}}>{hl(f.q)}</span><span style={{color:"#ff9500",fontSize:13,transform:open?"rotate(45deg)":"none",transition:"transform 0.2s",flexShrink:0}}>+</span></div>{open&&<div style={{padding:"0 14px 12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}><P style={{margin:"10px 0 0"}}>{hl(f.a)}</P></div>}</div>; })}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 18, minHeight: 400 }}>
      <div style={{ width: 175, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", letterSpacing: "0.18em", marginBottom: 8 }}>DOCUMENTATION</div>
        {filteredDocs.map(d => <div key={d.id} onClick={() => { setActiveDoc(d.id); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 5, marginBottom: 2, cursor: "pointer", background: activeDoc===d.id ? "rgba(255,149,0,0.12)" : "transparent", border: activeDoc===d.id ? "1px solid rgba(255,149,0,0.3)" : "1px solid transparent" }}><span style={{ fontSize: 10, color: activeDoc===d.id ? "#ff9500" : "rgba(255,255,255,0.58)" }}>{d.icon}</span><span style={{ fontSize: 10, color: activeDoc===d.id ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: activeDoc===d.id ? 700 : 400 }}>{d.label}</span></div>)}
        {!search && <div style={{ marginTop: 18, padding: "11px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.12)", borderRadius: 6 }}><div style={{ fontSize: 8, color: "rgba(255,149,0,0.6)", letterSpacing: "0.15em", marginBottom: 7 }}>QUICK LINKS</div>{[{label:"→ Reports guide",id:"reports"},{label:"→ Alert channels",id:"alert-channels"},{label:"→ Risk bar",id:"risk-bar"},{label:"→ Continuous mode",id:"continuous"},{label:"→ Threat types",id:"threat-types"},{label:"→ Severity guide",id:"severity"},{label:"→ Best practices",id:"best-practices"}].map(l=><div key={l.id} onClick={()=>setActiveDoc(l.id)} style={{fontSize:10,color:"rgba(255,255,255,0.68)",padding:"3px 0",cursor:"pointer"}}>{l.label}</div>)}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(255,255,255,0.52)" }}>⌕</span>
          <input style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "9px 12px 9px 30px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} placeholder="Search documentation..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <span onClick={() => setSearch("")} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,0.58)", cursor: "pointer" }}>✕</span>}
        </div>
        {search ? filteredDocs.length > 0 ? filteredDocs.map(d => <div key={d.id} style={{ marginBottom: 28 }}><div style={{ fontSize: 9, color: "#ff9500", letterSpacing: "0.15em", marginBottom: 3 }}>{d.icon} {d.label.toUpperCase()}</div><h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 7px" }}>{hl(d.title)}</h2>{d.sections.map((s,i)=>renderSection(s,i))}<div style={{height:1,background:"rgba(255,255,255,0.05)",margin:"14px 0"}} /></div>) : <div style={{ textAlign: "center", padding: "50px 0", color: "rgba(255,255,255,0.52)", fontSize: 13 }}>No documentation matches your search.</div>
        : doc ? <div><div style={{ fontSize: 9, color: "#ff9500", letterSpacing: "0.15em", marginBottom: 5 }}>{doc.icon} {doc.label.toUpperCase()}</div><h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.4px" }}>{doc.title}</h2><p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.7, margin: "0 0 22px", borderLeft: "2px solid rgba(255,149,0,0.3)", paddingLeft: 12 }}>{doc.intro}</p>{doc.sections.map((s,i)=>renderSection(s,i))}</div> : null}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function IntelFeedsScreen({ intelConfig, updateIntel, paidFeedConfig, updatePaidFeed, intelResults, intelStatus, brand, domains }) {
  const [activeSection, setActiveSection] = useState("free");
  const targetDomain = domains[0] || (brand ? brand.toLowerCase().replace(/\s+/g, "") + ".com" : "—");

  const FREE_SOURCES = [
    { id: "hibp", label: "HaveIBeenPwned", icon: "◈", color: "#ff6b35", description: "Checks your corporate email domain against the HIBP breach database. Returns a list of breached accounts and which data breaches they appeared in.", requiresKey: true, keyLabel: "API KEY", keyPlaceholder: "Get free key at haveibeenpwned.com/API/Key", docsUrl: "https://haveibeenpwned.com/API/Key", limitation: "API key required — free for personal use, paid for commercial use." },
    { id: "phishtank", label: "PhishTank", icon: "◉", color: "#ff2d55", description: "Checks your domain against the PhishTank community phishing database. Returns confirmed phishing site records associated with your domain.", requiresKey: false, keyLabel: "API KEY (OPTIONAL)", keyPlaceholder: "Optional — higher rate limits with key", docsUrl: "https://www.phishtank.com/api_info.php", limitation: "Works without API key — rate limited to 2 requests/min without key." },
    { id: "urlhaus", label: "URLhaus (abuse.ch)", icon: "⚡", color: "#ff9500", description: "Queries the abuse.ch URLhaus database for malicious URLs and malware distribution sites associated with your domain.", requiresKey: false, keyLabel: null, docsUrl: "https://urlhaus-api.abuse.ch", limitation: "No API key required. Completely free and open." },
    { id: "otx", label: "AlienVault OTX", icon: "▲", color: "#4a9eff", description: "Queries AlienVault Open Threat Exchange for threat intelligence pulses, indicators of compromise, and reputation data associated with your domain.", requiresKey: false, keyLabel: "API KEY (OPTIONAL)", keyPlaceholder: "Get free key at otx.alienvault.com", docsUrl: "https://otx.alienvault.com", limitation: "Works without API key for public pulses. Key unlocks private community pulses." },
  ];

  const PAID_SOURCES = [
    { id: "recordedFuture", label: "Recorded Future", color: "#ff2d55", tier: true, description: "Enterprise threat intelligence platform with comprehensive darkweb, paste site, and threat actor monitoring. Industry standard for large enterprise security teams.", fields: [{ key: "apiKey", label: "API KEY", placeholder: "RF API key from portal.recordedfuture.com", type: "password" }], docsUrl: "https://support.recordedfuture.com/hc/en-us/articles/115003793388" },
    { id: "darkOwl", label: "DarkOwl Vision", color: "#ff6b35", description: "Specialist darkweb data provider with the largest commercially available index of darkweb content. Direct .onion source indexing.", fields: [{ key: "apiKey", label: "API KEY", placeholder: "DarkOwl API key" , type: "password" }, { key: "apiSecret", label: "API SECRET", placeholder: "DarkOwl API secret", type: "password" }], docsUrl: "https://docs.darkowl.com" },
    { id: "flare", label: "Flare", color: "#ff9500", description: "Automated darkweb and clear web threat monitoring. Strong credential exposure and ransomware group tracking capabilities.", fields: [{ key: "apiKey", label: "API KEY", placeholder: "Flare API key from app.flare.io", type: "password" }, { key: "tenantId", label: "TENANT ID", placeholder: "Your Flare tenant ID", type: "text" }], docsUrl: "https://docs.flare.io" },
    { id: "intel471", label: "Intel 471", color: "#4a9eff", description: "Cybercriminal intelligence platform with deep coverage of threat actor communities, malware ecosystems, and underground markets.", fields: [{ key: "apiKey", label: "API KEY", placeholder: "Intel 471 API key", type: "password" }, { key: "apiSecret", label: "API SECRET", placeholder: "Intel 471 API secret", type: "password" }], docsUrl: "https://intel471.com/solutions/api" },
    { id: "cybersixgill", label: "Cybersixgill", color: "#30d158", description: "Real-time darkweb intelligence with automated collection from closed threat actor communities, forums, and messaging apps.", fields: [{ key: "clientId", label: "CLIENT ID", placeholder: "Cybersixgill client ID", type: "text" }, { key: "clientSecret", label: "CLIENT SECRET", placeholder: "Cybersixgill client secret", type: "password" }], docsUrl: "https://www.cybersixgill.com/platform/dve-score" },
  ];

  const statusBadge = (id) => {
    const s = intelStatus[id];
    if (s === "fetching") return <span style={{ fontSize: 8, color: "#ff9500", animation: "blink 0.8s infinite" }}>● QUERYING</span>;
    if (s === "ok")       return <span style={{ fontSize: 8, color: "#30d158" }}>● CONNECTED</span>;
    if (s === "error")    return <span style={{ fontSize: 8, color: "#ff2d55" }}>● ERROR</span>;
    if (s === "auth_error") return <span style={{ fontSize: 8, color: "#ff2d55" }}>● AUTH FAILED</span>;
    return <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>● IDLE</span>;
  };

  const realCount = intelResults.length;
  const bySource = intelResults.reduce((acc, r) => { acc[r.feedSource] = (acc[r.feedSource]||0)+1; return acc; }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20, padding: "18px 20px", background: "linear-gradient(135deg, rgba(74,158,255,0.08), rgba(255,149,0,0.06))", border: "1px solid rgba(74,158,255,0.2)", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(74,158,255,0.7)", letterSpacing: "0.2em", marginBottom: 5 }}>THREAT INTELLIGENCE FEEDS</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 6px", color: "#fff" }}>Intel Feed Configuration</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", margin: 0, lineHeight: 1.6, maxWidth: 500 }}>
              Configure open-source and commercial threat intelligence feeds. Free feeds query live APIs during each scan cycle. Paid feed credentials are stored for backend integration.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#30d158" }}>{realCount}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}>LIVE FINDINGS</div>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>Target: {targetDomain}</div>
          </div>
        </div>
        {realCount > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {Object.entries(bySource).map(([src, count]) => (
              <span key={src} style={{ fontSize: 9, color: "#30d158", background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.25)", padding: "2px 9px", borderRadius: 4 }}>◉ {src}: {count} finding{count > 1 ? "s" : ""}</span>
            ))}
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {[{ id: "free", label: "◈ Open Source Feeds" }, { id: "paid", label: "⚑ Commercial Feeds" }].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "7px 16px", borderRadius: 5, cursor: "pointer", border: `1px solid ${activeSection===s.id ? "rgba(255,149,0,0.4)" : "rgba(255,255,255,0.08)"}`, background: activeSection===s.id ? "rgba(255,149,0,0.12)" : "rgba(255,255,255,0.03)", color: activeSection===s.id ? "#ff9500" : "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: activeSection===s.id ? 700 : 400 }}>{s.label}</button>
        ))}
      </div>

      {/* Free sources */}
      {activeSection === "free" && (
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
            These feeds are queried live during each scan cycle using your configured domain. Results appear in the Scanner tab with a <span style={{ color: "#30d158" }}>◉ LIVE</span> badge. No backend required.
          </div>
          {FREE_SOURCES.map(src => {
            const cfg = intelConfig[src.id];
            return (
              <div key={src.id} style={{ marginBottom: 10, border: `1px solid ${cfg.enabled ? src.color+"44" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}>
                {/* Header */}
                <div onClick={() => updateIntel(src.id, "enabled", !cfg.enabled)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", background: cfg.enabled ? `${src.color}09` : "rgba(255,255,255,0.02)", userSelect: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 18, borderRadius: 9, background: cfg.enabled ? src.color : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: cfg.enabled ? 17 : 3, transition: "left 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 11 }}>{src.icon}</span>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.enabled ? "#fff" : "rgba(255,255,255,0.5)" }}>{src.label}</span>
                      {cfg.enabled && <span style={{ fontSize: 8, color: src.color, background: `${src.color}18`, border: `1px solid ${src.color}33`, padding: "1px 5px", borderRadius: 3, marginLeft: 7 }}>ENABLED</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {statusBadge(src.id)}
                    <a href={src.docsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4 }}>Docs ↗</a>
                  </div>
                </div>
                {/* Config */}
                {cfg.enabled && (
                  <div style={{ padding: "14px 16px 10px", borderTop: `1px solid ${src.color}22`, background: "rgba(0,0,0,0.12)" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, margin: "0 0 12px" }}>{src.description}</p>
                    {src.keyLabel && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginBottom: 4 }}>{src.keyLabel}</div>
                        <input
                          type={src.id === "hibp" ? "password" : "text"}
                          placeholder={src.keyPlaceholder}
                          value={cfg.apiKey || ""}
                          onChange={e => updateIntel(src.id, "apiKey", e.target.value)}
                          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "7px 10px", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                        />
                      </div>
                    )}
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>◎ {src.limitation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paid sources */}
      {activeSection === "paid" && (
        <div>
          <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.18)", borderLeft: "3px solid #ff9500", borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: "#ff9500", letterSpacing: "0.12em", marginBottom: 3 }}>◎ BACKEND INTEGRATION REQUIRED</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", margin: 0, lineHeight: 1.6 }}>Commercial feed credentials are stored in the UI configuration and passed to a backend server for secure API calls. Credentials entered here are never sent directly from the browser. Connect a Node.js or Python backend to activate live queries.</p>
          </div>
          {PAID_SOURCES.map(src => {
            const cfg = paidFeedConfig[src.id];
            return (
              <div key={src.id} style={{ marginBottom: 10, border: `1px solid ${cfg.enabled ? src.color+"44" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, overflow: "hidden" }}>
                <div onClick={() => updatePaidFeed(src.id, "enabled", !cfg.enabled)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", background: cfg.enabled ? `${src.color}09` : "rgba(255,255,255,0.02)", userSelect: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 18, borderRadius: 9, background: cfg.enabled ? src.color : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: cfg.enabled ? 17 : 3, transition: "left 0.2s" }} />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.enabled ? "#fff" : "rgba(255,255,255,0.5)" }}>{src.label}</span>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3, marginLeft: 7 }}>COMMERCIAL</span>
                      {cfg.enabled && <span style={{ fontSize: 8, color: src.color, background: `${src.color}18`, border: `1px solid ${src.color}33`, padding: "1px 5px", borderRadius: 3, marginLeft: 5 }}>CONFIGURED</span>}
                    </div>
                  </div>
                  <a href={src.docsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textDecoration: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4 }}>Docs ↗</a>
                </div>
                {cfg.enabled && (
                  <div style={{ padding: "14px 16px 10px", borderTop: `1px solid ${src.color}22`, background: "rgba(0,0,0,0.12)" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, margin: "0 0 12px" }}>{src.description}</p>
                    {src.fields.map(field => (
                      <div key={field.key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginBottom: 4 }}>{field.label}</div>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={cfg[field.key] || ""}
                          onChange={e => updatePaidFeed(src.id, field.key, e.target.value)}
                          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "7px 10px", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                        />
                      </div>
                    ))}
                    <div style={{ padding: "6px 10px", background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.12)", borderRadius: 4 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,149,0,0.65)" }}>◎ Credentials stored for backend use only. Not transmitted from browser.</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab]         = useState("scanner");
  const [screen, setScreen]   = useState("setup");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [scanCycle, setScanCycle]   = useState(0);
  const [scanPhase, setScanPhase]   = useState("");
  const [isSweeping, setIsSweeping] = useState(false); // mid-cycle rescan animation
  const [nextScanIn, setNextScanIn] = useState(RESCAN_INTERVAL_MS / 1000);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [results, setResults]   = useState([]);
  const [newIds, setNewIds]     = useState(new Set());
  const [activeFilter, setActiveFilter] = useState("all");

  // Profile state
  const [brand, setBrand]               = useState("");
  const [industry, setIndustry]         = useState("");
  const [stockTickers, setStockTickers] = useState([]);
  const [legalEntities, setLegalEntities] = useState([]);
  const [domains, setDomains]           = useState([]);
  const [emails, setEmails]             = useState([]);
  const [ips, setIps]                   = useState([]);
  const [asns, setAsns]                 = useState([]);
  const [certs, setCerts]               = useState([]);
  const [vips, setVips]                 = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [contractors, setContractors]   = useState([]);
  const [products, setProducts]         = useState([]);
  const [projects, setProjects]         = useState([]);
  const [trademarks, setTrademarks]     = useState([]);
  const [sourcePaths, setSourcePaths]   = useState([]);
  const [socials, setSocials]           = useState([]);
  const [appNames, setAppNames]         = useState([]);
  const [suppliers, setSuppliers]       = useState([]);
  const [cloudServices, setCloudServices] = useState([]);
  const [keywords, setKeywords]         = useState([]);
  const [excludeKeywords, setExcludeKeywords] = useState([]);
  const [monitorSources, setMonitorSources] = useState(["forums","paste","markets"]);
  const [alertChannels, setAlertChannels] = useState(["email"]);

  // Notification channel configs
  const [notifConfig, setNotifConfig] = useState({
    email:   { recipients: "", minSeverity: "high", subjectPrefix: "[DARKWATCH]", digest: false },
    slack:   { webhookUrl: "", channel: "#security-alerts", botName: "DARKWATCH", minSeverity: "high" },
    webhook: { url: "", secret: "", method: "POST", minSeverity: "critical" },
    sms:     { numbers: "", provider: "twilio", accountSid: "", authToken: "", minSeverity: "critical" },
  });
  const [testedChannels, setTestedChannels] = useState({});
  const updateNotif = (channel, field, value) => setNotifConfig(p => ({ ...p, [channel]: { ...p[channel], [field]: value } }));
  const testChannel = (channel) => {
    setTestedChannels(p => ({ ...p, [channel]: "testing" }));
    setTimeout(() => setTestedChannels(p => ({ ...p, [channel]: "ok" })), 1800);
    setTimeout(() => setTestedChannels(p => ({ ...p, [channel]: null })), 5000);
  };

  // ── Intel feed config ──────────────────────────────────────────────────────
  const [intelConfig, setIntelConfig] = useState({
    hibp:      { enabled: true,  apiKey: "" },
    urlhaus:   { enabled: true },
    phishtank: { enabled: true,  apiKey: "" },
    otx:       { enabled: true,  apiKey: "" },
  });
  const [paidFeedConfig, setPaidFeedConfig] = useState({
    recordedFuture: { enabled: false, apiKey: "", tier: "essentials" },
    darkOwl:        { enabled: false, apiKey: "", apiSecret: "" },
    flare:          { enabled: false, apiKey: "", tenantId: "" },
    intel471:       { enabled: false, apiKey: "", apiSecret: "" },
    cybersixgill:   { enabled: false, clientId: "", clientSecret: "" },
  });
  const [intelResults, setIntelResults]   = useState([]);
  const [intelStatus, setIntelStatus]     = useState({}); // per-source fetch status
  const updateIntel     = (src, field, val) => setIntelConfig(p => ({ ...p, [src]: { ...p[src], [field]: val } }));
  const updatePaidFeed  = (src, field, val) => setPaidFeedConfig(p => ({ ...p, [src]: { ...p[src], [field]: val } }));

  // ── Real API fetches ───────────────────────────────────────────────────────
  const fetchURLhaus = useCallback(async (domain) => {
    if (!domain) return [];
    try {
      setIntelStatus(p => ({ ...p, urlhaus: "fetching" }));
      const res = await fetch("https://urlhaus-api.abuse.ch/v1/host/", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `host=${encodeURIComponent(domain)}`,
      });
      const data = await res.json();
      setIntelStatus(p => ({ ...p, urlhaus: "ok" }));
      if (data.query_status === "no_results") return [];
      return (data.urls || []).slice(0, 8).map((u, i) => ({
        uid: `urlhaus-${domain}-${i}-${Date.now()}`,
        type: u.tags?.includes("phishing") ? "phishing" : "exploit",
        severity: u.threat === "malware_download" ? "high" : "medium",
        source: "URLhaus (abuse.ch)",
        content: `Malicious URL associated with ${domain} detected. Threat: ${u.threat || "malware"}. URL status: ${u.url_status}. Added: ${u.date_added?.split(" ")[0] || "unknown"}.`,
        tor: u.url?.slice(0, 50) + "…",
        detectedAt: u.date_added ? new Date(u.date_added).getTime() : Date.now(),
        real: true, feedSource: "URLhaus",
        contextUrl: `https://urlhaus.abuse.ch/url/${u.id}/`,
      }));
    } catch { setIntelStatus(p => ({ ...p, urlhaus: "error" })); return []; }
  }, []);

  const fetchPhishTank = useCallback(async (domain) => {
    if (!domain) return [];
    try {
      setIntelStatus(p => ({ ...p, phishtank: "fetching" }));
      // PhishTank's check API — CORS-friendly endpoint
      const apiKey = intelConfig.phishtank.apiKey;
      const body = `url=${encodeURIComponent("http://" + domain)}&format=json${apiKey ? `&app_key=${apiKey}` : ""}`;
      const res = await fetch("https://checkurl.phishtank.com/checkurl/", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "phishtank/DARKWATCH" },
        body,
      });
      const data = await res.json();
      setIntelStatus(p => ({ ...p, phishtank: "ok" }));
      if (!data.results?.in_database) return [];
      if (!data.results.valid) return [];
      return [{
        uid: `phishtank-${domain}-${Date.now()}`,
        type: "phishing", severity: "critical",
        source: "PhishTank",
        content: `Domain ${domain} confirmed as an active phishing site in the PhishTank database. Verified: ${data.results.verified ? "Yes" : "Pending"}. Phish ID: ${data.results.phish_id}.`,
        tor: `phishtank.com/phish/${data.results.phish_id}`,
        detectedAt: data.results.verified_at ? new Date(data.results.verified_at).getTime() : Date.now(),
        real: true, feedSource: "PhishTank",
        contextUrl: data.results.phish_detail_page || "https://www.phishtank.com",
      }];
    } catch { setIntelStatus(p => ({ ...p, phishtank: "error" })); return []; }
  }, [intelConfig.phishtank.apiKey]);

  const fetchOTX = useCallback(async (domain) => {
    if (!domain) return [];
    try {
      setIntelStatus(p => ({ ...p, otx: "fetching" }));
      const apiKey = intelConfig.otx.apiKey;
      const headers = apiKey ? { "X-OTX-API-KEY": apiKey } : {};
      const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(domain)}/general`, { headers });
      const data = await res.json();
      setIntelStatus(p => ({ ...p, otx: "ok" }));
      const findings = [];
      if (data.pulse_info?.count > 0) {
        const pulses = (data.pulse_info?.pulses || []).slice(0, 5);
        pulses.forEach((pulse, i) => {
          findings.push({
            uid: `otx-${domain}-${i}-${Date.now()}`,
            type: pulse.tags?.some(t => ["phishing","malware"].includes(t)) ? "phishing" : "mention",
            severity: data.pulse_info.count > 10 ? "high" : "medium",
            source: "AlienVault OTX",
            content: `Domain ${domain} flagged in OTX pulse: "${pulse.name}". Referenced in ${data.pulse_info.count} threat intelligence pulse${data.pulse_info.count > 1 ? "s" : ""}. Tags: ${(pulse.tags || []).slice(0,4).join(", ") || "none"}.`,
            tor: `otx.alienvault.com/indicator/domain/${domain}`,
            detectedAt: pulse.created ? new Date(pulse.created).getTime() : Date.now(),
            real: true, feedSource: "AlienVault OTX",
            contextUrl: `https://otx.alienvault.com/indicator/domain/${domain}`,
          });
        });
      }
      if (data.validation && data.validation.some(v => v.source === "Google Safe Browsing")) {
        findings.push({
          uid: `otx-gsb-${domain}-${Date.now()}`,
          type: "phishing", severity: "high",
          source: "AlienVault OTX / Google Safe Browsing",
          content: `Domain ${domain} flagged by Google Safe Browsing via OTX validation. Malicious classification confirmed.`,
          tor: `otx.alienvault.com/indicator/domain/${domain}`,
          detectedAt: Date.now(), real: true, feedSource: "AlienVault OTX",
          contextUrl: `https://otx.alienvault.com/indicator/domain/${domain}`,
        });
      }
      return findings;
    } catch { setIntelStatus(p => ({ ...p, otx: "error" })); return []; }
  }, [intelConfig.otx.apiKey]);

  const fetchHIBP = useCallback(async (domain) => {
    if (!domain || !intelConfig.hibp.apiKey) return [];
    try {
      setIntelStatus(p => ({ ...p, hibp: "fetching" }));
      const res = await fetch(`https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`, {
        headers: { "hibp-api-key": intelConfig.hibp.apiKey, "User-Agent": "DARKWATCH-Intelligence-Enterprise" },
      });
      if (res.status === 404) { setIntelStatus(p => ({ ...p, hibp: "ok" })); return []; }
      if (res.status === 401) { setIntelStatus(p => ({ ...p, hibp: "auth_error" })); return []; }
      const data = await res.json();
      setIntelStatus(p => ({ ...p, hibp: "ok" }));
      return Object.entries(data).slice(0, 6).map(([email, breaches], i) => ({
        uid: `hibp-${domain}-${i}-${Date.now()}`,
        type: "credential", severity: breaches.length > 3 ? "critical" : "high",
        source: "HaveIBeenPwned",
        content: `Corporate email ${email} found in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}: ${breaches.slice(0,3).join(", ")}${breaches.length > 3 ? ` +${breaches.length - 3} more` : ""}. Immediate credential reset recommended.`,
        tor: `haveibeenpwned.com/domain/${domain}`,
        detectedAt: Date.now() - i * 60000,
        real: true, feedSource: "HaveIBeenPwned",
        contextUrl: `https://haveibeenpwned.com/DomainSearch`,
      }));
    } catch { setIntelStatus(p => ({ ...p, hibp: "error" })); return []; }
  }, [intelConfig.hibp.apiKey]);

  const runRealIntelFetch = useCallback(async () => {
    const targetDomain = domains[0] || (brand ? brand.toLowerCase().replace(/\s+/g, "") + ".com" : null);
    if (!targetDomain) return [];
    const fetches = [];
    if (intelConfig.urlhaus.enabled)   fetches.push(fetchURLhaus(targetDomain));
    if (intelConfig.phishtank.enabled) fetches.push(fetchPhishTank(targetDomain));
    if (intelConfig.otx.enabled)       fetches.push(fetchOTX(targetDomain));
    if (intelConfig.hibp.enabled)      fetches.push(fetchHIBP(targetDomain));
    const results = await Promise.allSettled(fetches);
    return results.flatMap(r => r.status === "fulfilled" ? r.value : []);
  }, [brand, domains, intelConfig, fetchURLhaus, fetchPhishTank, fetchOTX, fetchHIBP]);

  const cycleTimerRef  = useRef(null);
  const countdownRef   = useRef(null);
  const sweepTimerRef  = useRef(null);
  const resultsRef     = useRef(results);
  resultsRef.current   = results;

  const addTag    = (v, l, s) => { if (!l.includes(v)) s([...l, v]); };
  const removeTag = (v, l, s) => s(l.filter(x => x !== v));
  const toggleArr = (v, l, s) => l.includes(v) ? s(l.filter(x => x !== v)) : s([...l, v]);

  const totalConfigured = (brand?1:0)+(industry?1:0)+domains.length+emails.length+ips.length+asns.length+certs.length+vips.length+employees.length+contractors.length+products.length+projects.length+trademarks.length+sourcePaths.length+socials.length+appNames.length+suppliers.length+cloudServices.length+keywords.length+stockTickers.length+legalEntities.length;

  const entities = { brands:[brand], domains, ips, vips, products, projects, keywords, socials, certs, suppliers };

  // Build eligible pool based on configured fields
  const getEligibleThreats = useCallback(() => {
    return THREAT_POOL.filter(t => {
      if (t.content.includes("{VIP}") && !vips.length) return false;
      if (t.content.includes("{PROJECT}") && !projects.length) return false;
      if (t.content.includes("{PRODUCT}") && !products.length) return false;
      if (t.content.includes("{KEYWORD}") && !keywords.length) return false;
      if (t.content.includes("{SOCIAL_HANDLE}") && !socials.length) return false;
      if (t.content.includes("{DOMAIN}") && !domains.length) return false;
      if (t.content.includes("{IP_RANGE}") && !ips.length) return false;
      if (t.content.includes("{CERT_DOMAIN}") && !certs.length) return false;
      if (t.content.includes("{SUPPLIER}") && !suppliers.length) return false;
      return true;
    });
  }, [vips, projects, products, keywords, socials, domains, ips, certs, suppliers]);

  // Run a sweep: pick random subset of eligible threats, inject new ones
  const runSweep = useCallback(async (isInitial = false) => {
    setIsSweeping(true);
    const eligible = getEligibleThreats();
    const phaseList = isInitial ? [
      "Routing through TOR exit nodes...", "Querying hacker forums...",
      "Sweeping credential dump repositories...", "Scanning paste sites...",
      "Querying URLhaus malware feed...", "Checking PhishTank database...",
      "Fetching AlienVault OTX indicators...", "Querying HIBP breach data...",
      "Cross-referencing stealer logs...", "Aggregating results...",
    ] : SCAN_PHASES;

    // Fire real intel fetches in parallel while phases animate
    const realIntelPromise = runRealIntelFetch();

    let pi = 0;
    const tick = () => {
      if (pi < phaseList.length) {
        setScanPhase(phaseList[pi++]);
        sweepTimerRef.current = setTimeout(tick, isInitial ? 600 : 400);
      } else {
        realIntelPromise.then(realFindings => {
          // Simulated findings
          const count = isInitial ? Math.min(eligible.length, 5 + Math.floor(Math.random() * 4)) : Math.min(eligible.length, 1 + Math.floor(Math.random() * 3));
          const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, count);
          const now = Date.now();
          const simulated = shuffled.map((t, i) => ({ ...t, uid: `sim-${t.id}-${now}-${i}`, detectedAt: now - Math.floor(Math.random() * 3000), real: false, feedSource: "Simulated" }));
          const injected = [...realFindings, ...simulated];

          setIntelResults(realFindings);

          setResults(prev => {
            const existingUids = new Set(prev.map(r => r.uid));
            const fresh = injected.filter(r => !existingUids.has(r.uid));
            if (!fresh.length) return prev;
            setNewIds(ids => { const next = new Set(ids); fresh.forEach(r => next.add(r.uid)); return next; });
            setTimeout(() => setNewIds(ids => { const next = new Set(ids); fresh.forEach(r => next.delete(r.uid)); return next; }), 8000);
            return [...fresh, ...prev].slice(0, 60);
          });

          setScanCycle(c => c + 1);
          setLastScanTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
          setScanPhase("");
          setIsSweeping(false);
          setScreen("results");
        });
      }
    };
    tick();
  }, [getEligibleThreats, runRealIntelFetch]);

  // Countdown timer
  const startCountdown = useCallback(() => {
    setNextScanIn(RESCAN_INTERVAL_MS / 1000);
    countdownRef.current = setInterval(() => {
      setNextScanIn(n => Math.max(0, n - 1));
    }, 1000);
  }, []);

  // Cycle timer
  const scheduleCycle = useCallback(() => {
    cycleTimerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      runSweep(false);
      startCountdown();
      scheduleCycle();
    }, RESCAN_INTERVAL_MS);
  }, [runSweep, startCountdown]);

  const startMonitoring = () => {
    if (!brand.trim()) return;
    setResults([]);
    setNewIds(new Set());
    setIsMonitoring(true);
    setScreen("setup"); // keep setup visible briefly then switch
    runSweep(true);
    startCountdown();
    scheduleCycle();
  };

  const pauseMonitoring = () => {
    setIsMonitoring(false);
    if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (sweepTimerRef.current) clearTimeout(sweepTimerRef.current);
    setIsSweeping(false);
    setScanPhase("");
  };

  const resetAll = () => {
    pauseMonitoring();
    setScreen("setup");
    setResults([]);
    setScanCycle(0);
    setLastScanTime(null);
    setNextScanIn(RESCAN_INTERVAL_MS / 1000);
  };

  useEffect(() => () => { pauseMonitoring(); }, []);

  const risk = calcRisk(results);
  const filtered = activeFilter === "all" ? results : results.filter(r => r.severity === activeFilter || r.type === activeFilter);
  const critical = results.filter(r => r.severity === "critical").length;
  const high     = results.filter(r => r.severity === "high").length;
  const medium   = results.filter(r => r.severity === "medium").length;

  return (
    <div style={{ minHeight: "100vh", background: "#080a0d", backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(255,149,0,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,45,85,0.04) 0%, transparent 50%)", fontFamily: "'Courier New', monospace", color: "#fff", paddingTop: 60 }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,149,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,149,0,0.022) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 0 }} />

      {/* ── Risk Bar (always on top) ── */}
      <RiskBar
        risk={risk}
        isMonitoring={isMonitoring}
        brand={brand}
        lastScanTime={lastScanTime}
        nextScanIn={nextScanIn}
        scanCycle={scanCycle}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "22px 22px 40px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isMonitoring ? "#ff2d55" : "rgba(255,255,255,0.5)", boxShadow: isMonitoring ? "0 0 8px #ff2d55" : "none", animation: isMonitoring ? "blink 1.5s infinite" : "none" }} />
                <span style={{ fontSize: 8, color: isMonitoring ? "rgba(255,45,85,0.8)" : "rgba(255,255,255,0.55)", letterSpacing: "0.2em" }}>{isMonitoring ? "CLASSIFIED — OPERATIONAL" : "MONITORING INACTIVE"}</span>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.4px", background: "linear-gradient(135deg, #ff9500 0%, #ff6b35 50%, #ff2d55 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DARKWATCH INTELLIGENCE ENTERPRISE</h1>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.52)", margin: "2px 0 0", letterSpacing: "0.15em" }}>ADVANCED THREAT INTELLIGENCE PLATFORM</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Monitoring toggle */}
              {isMonitoring ? (
                <button onClick={pauseMonitoring} style={{ padding: "7px 14px", borderRadius: 6, cursor: "pointer", background: "rgba(255,45,85,0.12)", border: "1px solid rgba(255,45,85,0.35)", color: "#ff2d55", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>⏸ PAUSE</button>
              ) : (
                brand.trim() && screen !== "setup" && (
                  <button onClick={startMonitoring} style={{ padding: "7px 14px", borderRadius: 6, cursor: "pointer", background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.35)", color: "#30d158", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>▶ RESUME</button>
                )
              )}
              {/* Tab switcher */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: 3 }}>
                {[{id:"scanner",label:"◉ Scanner"},{id:"intel",label:"◈ Intel Feeds"},{id:"reports",label:"◎ Reports"},{id:"contact",label:"⚑ Emergency"},{id:"docs",label:"◎ Docs"}].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 16px", borderRadius: 5, cursor: "pointer", border: "none", background: tab===t.id ? (t.id==="contact" ? "rgba(255,45,85,0.2)" : "rgba(255,149,0,0.18)") : "transparent", color: tab===t.id ? (t.id==="contact" ? "#ff2d55" : "#ff9500") : "rgba(255,255,255,0.62)", fontSize: 10, fontWeight: tab===t.id ? 700 : 400, letterSpacing: "0.05em", transition: "all 0.2s", fontFamily: "monospace", animation: t.id==="contact" && tab!=="contact" ? "blink 2.5s infinite" : "none" }}>{t.label}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Divider with powered-by badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 20px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,149,0,0.1)" }} />
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "5px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Powered by</span>
              {/* Logo slot — replace the SVG/text below with an <img src="..."> for a real logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {/* Shield icon as placeholder for partner logo */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(255,149,0,0.25)" stroke="rgba(255,149,0,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="rgba(255,149,0,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {/* Partner name — replace this text with your partner's name or swap for <img> */}
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  letterSpacing: "0.06em",
                  background: "linear-gradient(90deg, #e0e0e0, #a0a0a0)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>YOUR PARTNER</span>
              </div>
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,149,0,0.1)" }} />
          </div>
        </div>

        {/* ══ DOCS TAB ══ */}
        {tab === "docs" && <DocScreen />}

        {/* ══ INTEL FEEDS TAB ══ */}
        {tab === "intel" && <IntelFeedsScreen intelConfig={intelConfig} updateIntel={updateIntel} paidFeedConfig={paidFeedConfig} updatePaidFeed={updatePaidFeed} intelResults={intelResults} intelStatus={intelStatus} brand={brand} domains={domains} />}

        {/* ══ REPORTS TAB ══ */}
        {tab === "reports" && <ReportScreen results={results} brand={brand} entities={entities} risk={risk} scanCycle={scanCycle} lastScanTime={lastScanTime} totalConfigured={totalConfigured} />}

        {/* ══ EMERGENCY CONTACT TAB ══ */}
        {tab === "contact" && <ContactScreen risk={risk} />}

        {/* ══ SCANNER TAB ══ */}
        {tab === "scanner" && (
          <>
            {/* ── SETUP ── */}
            {screen === "setup" && (
              <div>
                {/* Profile completeness + docs link */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "9px 13px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.12)", borderRadius: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.62)" }}>PROFILE COMPLETENESS</span>
                    <div style={{ width: 90, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, totalConfigured * 5)}%`, background: "linear-gradient(90deg, #ff9500, #ff2d55)", borderRadius: 2, transition: "width 0.3s" }} /></div>
                    <span style={{ fontSize: 10, color: "#ff9500", fontWeight: 700 }}>{totalConfigured} signals</span>
                  </div>
                  <button onClick={() => setTab("docs")} style={{ fontSize: 9, color: "rgba(255,149,0,0.65)", background: "transparent", border: "1px solid rgba(255,149,0,0.22)", borderRadius: 4, padding: "3px 9px", cursor: "pointer" }}>◎ Docs</button>
                </div>

                <ScanSection title="1 · BRAND IDENTITY" badge={(brand?1:0)+(industry?1:0)+stockTickers.length+legalEntities.length} defaultOpen>
                  <SimpleInput label="PRIMARY BRAND NAME *" sublabel="Main organization name monitored across all sources" placeholder="e.g. Acme Corporation" value={brand} onChange={setBrand} />
                  <SimpleInput label="INDUSTRY / SECTOR" sublabel="Helps correlate sector-specific threat actor activity" placeholder="e.g. Financial Services, Healthcare, SaaS" value={industry} onChange={setIndustry} />
                  <TagInput label="STOCK TICKER SYMBOLS" sublabel="Detect market manipulation & pump-dump schemes" placeholder="e.g. ACME, NYSE:ACM" tags={stockTickers} onAdd={v=>addTag(v,stockTickers,setStockTickers)} onRemove={v=>removeTag(v,stockTickers,setStockTickers)} tagColor="#ff9500" />
                  <TagInput label="LEGAL ENTITY NAMES" sublabel="Subsidiaries, holding companies, registered legal names" placeholder="e.g. Acme Holdings Ltd" tags={legalEntities} onAdd={v=>addTag(v,legalEntities,setLegalEntities)} onRemove={v=>removeTag(v,legalEntities,setLegalEntities)} tagColor="#ff9500" />
                </ScanSection>

                <ScanSection title="2 · DIGITAL INFRASTRUCTURE" badge={domains.length+emails.length+ips.length+asns.length+certs.length} badgeColor="#ff6b35">
                  <TagInput label="DOMAINS & SUBDOMAINS" sublabel="Monitor for typosquatting, phishing kits, unauthorized impersonation" placeholder="e.g. acme.com, api.acme.com" tags={domains} onAdd={v=>addTag(v,domains,setDomains)} onRemove={v=>removeTag(v,domains,setDomains)} tagColor="#ff6b35" />
                  <TagInput label="CORPORATE EMAIL DOMAINS" sublabel="Detect credential leaks matching corporate email domains" placeholder="e.g. @acme.com" tags={emails} onAdd={v=>addTag(v,emails,setEmails)} onRemove={v=>removeTag(v,emails,setEmails)} tagColor="#ff6b35" />
                  <TagInput label="IP RANGES / CIDR BLOCKS" sublabel="Flag exploit listings targeting your infrastructure" placeholder="e.g. 203.0.113.0/24" tags={ips} onAdd={v=>addTag(v,ips,setIps)} onRemove={v=>removeTag(v,ips,setIps)} tagColor="#ff6b35" />
                  <TagInput label="ASN NUMBERS" sublabel="Autonomous System Numbers for network-level monitoring" placeholder="e.g. AS12345" tags={asns} onAdd={v=>addTag(v,asns,setAsns)} onRemove={v=>removeTag(v,asns,setAsns)} tagColor="#ff6b35" />
                  <TagInput label="SSL / TLS CERTIFICATE DOMAINS" sublabel="Detect certificate theft or cloning enabling MITM attacks" placeholder="e.g. *.acme.com" tags={certs} onAdd={v=>addTag(v,certs,setCerts)} onRemove={v=>removeTag(v,certs,setCerts)} tagColor="#ff6b35" />
                </ScanSection>

                <ScanSection title="3 · PEOPLE & PERSONNEL" badge={vips.length+employees.length+contractors.length} badgeColor="#ff2d55">
                  <TagInput label="VIP / EXECUTIVE TARGETS" sublabel="C-suite & board — doxxing, credential & physical threat monitoring" placeholder="e.g. Jane Smith CEO" tags={vips} onAdd={v=>addTag(v,vips,setVips)} onRemove={v=>removeTag(v,vips,setVips)} tagColor="#ff2d55" icon="⚑" />
                  <TagInput label="KEY EMPLOYEE IDENTIFIERS" sublabel="Employees with elevated access — high-value credential targets" placeholder="e.g. j.smith@acme.com" tags={employees} onAdd={v=>addTag(v,employees,setEmployees)} onRemove={v=>removeTag(v,employees,setEmployees)} tagColor="#ff6b35" />
                  <TagInput label="CONTRACTORS & THIRD PARTIES" sublabel="External personnel with system access — insider threat vector" placeholder="e.g. Dev Agency XYZ" tags={contractors} onAdd={v=>addTag(v,contractors,setContractors)} onRemove={v=>removeTag(v,contractors,setContractors)} tagColor="#ff9500" />
                </ScanSection>

                <ScanSection title="4 · PRODUCTS & INTELLECTUAL PROPERTY" badge={products.length+projects.length+trademarks.length+sourcePaths.length} badgeColor="#ff9500">
                  <TagInput label="PRODUCT NAMES" sublabel="Monitor for counterfeiting, piracy, and unauthorized resale" placeholder="e.g. AcmePay, Acme Suite" tags={products} onAdd={v=>addTag(v,products,setProducts)} onRemove={v=>removeTag(v,products,setProducts)} tagColor="#ff9500" />
                  <TagInput label="INTERNAL PROJECT CODENAMES" sublabel="Confidential names that should never appear externally" placeholder="e.g. Project Nighthawk" tags={projects} onAdd={v=>addTag(v,projects,setProjects)} onRemove={v=>removeTag(v,projects,setProjects)} tagColor="#ff9500" />
                  <TagInput label="TRADEMARKS & PATENTS" sublabel="Registered IP identifiers for infringement monitoring" placeholder="e.g. AcmePay™, Patent US10234567" tags={trademarks} onAdd={v=>addTag(v,trademarks,setTrademarks)} onRemove={v=>removeTag(v,trademarks,setTrademarks)} tagColor="#ff9500" />
                  <TagInput label="SOURCE CODE IDENTIFIERS" sublabel="Repo names or code strings to detect source code leaks" placeholder="e.g. acme-internal-sdk" tags={sourcePaths} onAdd={v=>addTag(v,sourcePaths,setSourcePaths)} onRemove={v=>removeTag(v,sourcePaths,setSourcePaths)} tagColor="#ff9500" />
                </ScanSection>

                <ScanSection title="5 · SOCIAL MEDIA & BRAND CHANNELS" badge={socials.length+appNames.length} badgeColor="#ff6b35">
                  <TagInput label="SOCIAL MEDIA HANDLES" sublabel="Detect impersonation, fake accounts, and brand hijacking" placeholder="e.g. @acmecorp" tags={socials} onAdd={v=>addTag(v,socials,setSocials)} onRemove={v=>removeTag(v,socials,setSocials)} tagColor="#ff6b35" />
                  <TagInput label="APP / PRODUCT NAMES" sublabel="Detect cloned or trojanized app versions" placeholder="e.g. Acme Mobile" tags={appNames} onAdd={v=>addTag(v,appNames,setAppNames)} onRemove={v=>removeTag(v,appNames,setAppNames)} tagColor="#ff6b35" />
                </ScanSection>

                <ScanSection title="6 · SUPPLY CHAIN & THIRD-PARTY RISK" badge={suppliers.length+cloudServices.length} badgeColor="#ff9500">
                  <TagInput label="KEY SUPPLIERS & VENDORS" sublabel="Monitor for compromise of partners with system access" placeholder="e.g. Vendor Corp" tags={suppliers} onAdd={v=>addTag(v,suppliers,setSuppliers)} onRemove={v=>removeTag(v,suppliers,setSuppliers)} tagColor="#ff9500" />
                  <TagInput label="CLOUD SERVICES & SaaS PLATFORMS" sublabel="Detect breach disclosures affecting platforms you depend on" placeholder="e.g. AWS org, GitHub org/acme" tags={cloudServices} onAdd={v=>addTag(v,cloudServices,setCloudServices)} onRemove={v=>removeTag(v,cloudServices,setCloudServices)} tagColor="#ff9500" />
                </ScanSection>

                <ScanSection title="7 · CUSTOM KEYWORDS & EXCLUSIONS" badge={keywords.length+excludeKeywords.length} badgeColor="#ff6b35">
                  <TagInput label="MONITOR KEYWORDS" sublabel="Additional terms, internal jargon, or aliases to sweep for" placeholder="e.g. 'acme breach', internal nickname" tags={keywords} onAdd={v=>addTag(v,keywords,setKeywords)} onRemove={v=>removeTag(v,keywords,setKeywords)} tagColor="#ff6b35" />
                  <TagInput label="EXCLUSION KEYWORDS" sublabel="Suppress these terms to reduce false positives" placeholder="e.g. 'acme cartoon'" tags={excludeKeywords} onAdd={v=>addTag(v,excludeKeywords,setExcludeKeywords)} onRemove={v=>removeTag(v,excludeKeywords,setExcludeKeywords)} tagColor="rgba(255,255,255,0.6)" />
                </ScanSection>

                <ScanSection title="8 · SCAN CONFIGURATION" defaultOpen>
                  <ToggleGroup label="SOURCE TYPES TO MONITOR" sublabel="Select which darkweb and threat intelligence sources to include" options={[{value:"forums",label:"Hacker Forums"},{value:"paste",label:"Paste Sites"},{value:"markets",label:"Marketplaces"},{value:"telegram",label:"Telegram"},{value:"irc",label:"IRC"},{value:"combo",label:"Combo Lists"},{value:"stealer",label:"Stealer Logs"},{value:"ransom",label:"Ransomware Blogs"}]} selected={monitorSources} onToggle={v=>toggleArr(v,monitorSources,setMonitorSources)} />

                  {/* ── Notification channels ── */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 3 }}>◈ ALERT CHANNELS</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 10, lineHeight: 1.5 }}>Enable channels and configure each one. Alerts fire when findings meet the minimum severity threshold.</div>

                    {/* Channel cards */}
                    {[
                      { id: "email",   icon: "✉",  label: "Email",   color: "#ff9500" },
                      { id: "slack",   icon: "◈",  label: "Slack",   color: "#4a9eff" },
                      { id: "webhook", icon: "⚡", label: "Webhook", color: "#ff6b35" },
                      { id: "sms",     icon: "◉",  label: "SMS",     color: "#30d158" },
                    ].map(ch => {
                      const active = alertChannels.includes(ch.id);
                      const cfg = notifConfig[ch.id];
                      const tested = testedChannels[ch.id];
                      const NInput = ({ label, field, placeholder, type="text", mono=false }) => (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
                          <input
                            type={type}
                            placeholder={placeholder}
                            value={cfg[field]}
                            onChange={e => updateNotif(ch.id, field, e.target.value)}
                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "7px 10px", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box", fontFamily: mono ? "monospace" : "inherit" }}
                          />
                        </div>
                      );
                      const NSeverity = ({ field }) => (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>MINIMUM SEVERITY TO ALERT</div>
                          <div style={{ display: "flex", gap: 5 }}>
                            {["critical","high","medium","low"].map(s => {
                              const sc = SEVERITY_CONFIG[s];
                              const sel = cfg[field] === s;
                              return (
                                <button key={s} onClick={() => updateNotif(ch.id, field, s)} style={{ flex: 1, padding: "5px 0", borderRadius: 4, cursor: "pointer", fontSize: 9, fontWeight: sel ? 700 : 400, border: `1px solid ${sel ? sc.color : "rgba(255,255,255,0.08)"}`, background: sel ? `${sc.color}20` : "rgba(255,255,255,0.03)", color: sel ? sc.color : "rgba(255,255,255,0.65)", transition: "all 0.15s", letterSpacing: "0.06em" }}>{s.toUpperCase()}</button>
                              );
                            })}
                          </div>
                        </div>
                      );

                      return (
                        <div key={ch.id} style={{ marginBottom: 8, border: `1px solid ${active ? ch.color+"44" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, overflow: "hidden", transition: "border-color 0.2s" }}>
                          {/* Channel header — click to toggle */}
                          <div onClick={() => toggleArr(ch.id, alertChannels, setAlertChannels)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", background: active ? `${ch.color}0d` : "rgba(255,255,255,0.02)", userSelect: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {/* Toggle pill */}
                              <div style={{ width: 32, height: 18, borderRadius: 9, background: active ? ch.color : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: active ? 17 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                              </div>
                              <span style={{ fontSize: 10 }}>{ch.icon}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.7)" }}>{ch.label}</span>
                              {active && <span style={{ fontSize: 8, color: ch.color, background: `${ch.color}18`, border: `1px solid ${ch.color}33`, padding: "1px 6px", borderRadius: 3, letterSpacing: "0.08em" }}>ENABLED</span>}
                            </div>
                            {active && (
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                {tested === "testing" && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", animation: "blink 0.8s infinite" }}>SIMULATING...</span>}
                                {tested === "ok"      && <span style={{ fontSize: 9, color: "#30d158" }}>✓ SIMULATED</span>}
                                <button onClick={e => { e.stopPropagation(); testChannel(ch.id); }} title="Simulation only — no real alert is sent" style={{ padding: "3px 10px", borderRadius: 4, cursor: "pointer", background: `${ch.color}15`, border: `1px solid ${ch.color}33`, color: ch.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>▶ TEST</button>
                              </div>
                            )}
                          </div>

                          {/* Config fields — only shown when active */}
                          {active && (
                            <div style={{ padding: "14px 14px 6px", borderTop: `1px solid ${ch.color}22`, background: "rgba(0,0,0,0.15)" }}>

                              {/* EMAIL */}
                              {ch.id === "email" && <>
                                <NInput label="RECIPIENT EMAIL ADDRESSES (comma-separated)" field="recipients" placeholder="soc@company.com, ciso@company.com" />
                                <NInput label="SUBJECT LINE PREFIX" field="subjectPrefix" placeholder="[DARKWATCH]" mono />
                                <NSeverity field="minSeverity" />
                                <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                                  <div onClick={() => updateNotif("email","digest",!cfg.digest)} style={{ width: 32, height: 18, borderRadius: 9, background: cfg.digest ? "#ff9500" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: cfg.digest ? 17 : 3, transition: "left 0.2s" }} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, color: cfg.digest ? "#ff9500" : "rgba(255,255,255,0.7)", fontWeight: cfg.digest ? 700 : 400 }}>Daily digest mode</div>
                                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.52)" }}>Bundle all alerts into a single daily summary email instead of per-finding alerts</div>
                                  </div>
                                </div>
                              </>}

                              {/* SLACK */}
                              {ch.id === "slack" && <>
                                <NInput label="SLACK WEBHOOK URL" field="webhookUrl" placeholder="https://hooks.slack.com/services/T.../B.../..." mono />
                                <NInput label="CHANNEL" field="channel" placeholder="#security-alerts" mono />
                                <NInput label="BOT DISPLAY NAME" field="botName" placeholder="DARKWATCH" />
                                <NSeverity field="minSeverity" />
                              </>}

                              {/* WEBHOOK */}
                              {ch.id === "webhook" && <>
                                <NInput label="ENDPOINT URL" field="url" placeholder="https://your-siem.company.com/api/alerts" mono />
                                <NInput label="SECRET / BEARER TOKEN" field="secret" placeholder="Bearer sk-..." type="password" mono />
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>HTTP METHOD</div>
                                  <div style={{ display: "flex", gap: 5 }}>
                                    {["POST","PUT"].map(m => (
                                      <button key={m} onClick={() => updateNotif("webhook","method",m)} style={{ padding: "5px 16px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: cfg.method===m ? 700 : 400, border: `1px solid ${cfg.method===m ? "#ff6b35" : "rgba(255,255,255,0.08)"}`, background: cfg.method===m ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.03)", color: cfg.method===m ? "#ff6b35" : "rgba(255,255,255,0.65)" }}>{m}</button>
                                    ))}
                                  </div>
                                </div>
                                <NSeverity field="minSeverity" />
                                <div style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: 5 }}>
                                  <div style={{ fontSize: 9, color: "rgba(255,107,53,0.7)", marginBottom: 3, letterSpacing: "0.1em" }}>PAYLOAD FORMAT</div>
                                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", lineHeight: 1.7 }}>{`{ "severity": "critical", "type": "data_leak", "source": "...", "content": "...", "detectedAt": 1234567890, "brand": "..." }`}</div>
                                </div>
                              </>}

                              {/* SMS */}
                              {ch.id === "sms" && <>
                                <NInput label="RECIPIENT PHONE NUMBERS (comma-separated, E.164 format)" field="numbers" placeholder="+442071234567, +14155552671" mono />
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>SMS PROVIDER</div>
                                  <div style={{ display: "flex", gap: 5 }}>
                                    {["twilio","aws-sns","vonage"].map(p => (
                                      <button key={p} onClick={() => updateNotif("sms","provider",p)} style={{ flex: 1, padding: "5px 0", borderRadius: 4, cursor: "pointer", fontSize: 9, fontWeight: cfg.provider===p ? 700 : 400, border: `1px solid ${cfg.provider===p ? "#30d158" : "rgba(255,255,255,0.08)"}`, background: cfg.provider===p ? "rgba(48,209,88,0.15)" : "rgba(255,255,255,0.03)", color: cfg.provider===p ? "#30d158" : "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{p}</button>
                                    ))}
                                  </div>
                                </div>
                                <NInput label="ACCOUNT SID / API KEY" field="accountSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" mono />
                                <NInput label="AUTH TOKEN / SECRET" field="authToken" placeholder="your_auth_token" type="password" mono />
                                <NSeverity field="minSeverity" />
                                <div style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(48,209,88,0.05)", border: "1px solid rgba(48,209,88,0.15)", borderRadius: 5 }}>
                                  <div style={{ fontSize: 9, color: "rgba(48,209,88,0.7)", marginBottom: 2 }}>⚠ SMS is recommended for CRITICAL findings only due to per-message costs and alert fatigue.</div>
                                </div>
                              </>}

                              {/* Simulation disclaimer */}
                              <div style={{ marginBottom: 10, marginTop: 4, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(255,149,0,0.4)", borderRadius: 4, display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <span style={{ color: "#ff9500", fontSize: 11, flexShrink: 0, marginTop: 1 }}>◎</span>
                                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", margin: 0, lineHeight: 1.6 }}>
                                  <strong style={{ color: "rgba(255,255,255,0.75)" }}>Simulation mode:</strong> The ▶ TEST button simulates delivery only — no real alert is sent. A backend integration is required to enable live notifications. Configuration settings are saved and ready for when a backend is connected.
                                </p>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScanSection>

                <div style={{ height: 16 }} />

                <button onClick={startMonitoring} disabled={!brand.trim()} style={{ width: "100%", padding: "14px", borderRadius: 8, cursor: brand.trim() ? "pointer" : "not-allowed", background: brand.trim() ? "linear-gradient(135deg, #ff9500, #ff6b35, #ff2d55)" : "rgba(255,255,255,0.04)", border: "none", color: brand.trim() ? "#fff" : "rgba(255,255,255,0.48)", fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", transition: "all 0.3s", boxShadow: brand.trim() ? "0 0 28px rgba(255,149,0,0.18)" : "none" }}>
                  ◉ ACTIVATE CONTINUOUS MONITORING — {totalConfigured} SIGNALS
                </button>

                <div style={{ marginTop: 12, padding: "9px 13px", background: "rgba(255,45,85,0.04)", border: "1px solid rgba(255,45,85,0.1)", borderRadius: 5 }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.7 }}>⚠ DISCLAIMER: This platform surfaces intelligence from monitored darkweb sources for defensive security purposes only. All data is handled in accordance with applicable law. Results are for threat awareness and do not constitute legal evidence.</p>
                </div>
              </div>
            )}

            {/* ── LIVE RESULTS DASHBOARD ── */}
            {screen === "results" && (
              <div>
                {/* Sweep banner */}
                {isSweeping && (
                  <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(255,149,0,0.07)", border: "1px solid rgba(255,149,0,0.2)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff9500", animation: "blink 0.6s infinite", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "rgba(255,149,0,0.8)" }}>
                      <TerminalText text={scanPhase} key={scanPhase} speed={15} />
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
                  <StatBox label="Critical" value={critical} color="#ff2d55" sub="ACT NOW" />
                  <StatBox label="High" value={high} color="#ff6b35" sub="INVESTIGATE" />
                  <StatBox label="Medium" value={medium} color="#ff9500" sub="MONITOR" />
                  <StatBox label="Total Signals" value={results.length} color="rgba(255,255,255,0.7)" />
                </div>

                {/* Threat score */}
                <div style={{ background: `${risk.color}10`, border: `1px solid ${risk.color}33`, borderRadius: 7, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 9, color: `${risk.color}cc`, letterSpacing: "0.15em", marginBottom: 2 }}>THREAT SCORE — {brand.toUpperCase()}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Cycle #{scanCycle} · {totalConfigured} signals · Last scan: {lastScanTime || "—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 30, fontWeight: 900, color: risk.color, lineHeight: 1 }}>{risk.score}</div>
                      <div style={{ fontSize: 8, color: `${risk.color}99`, letterSpacing: "0.1em" }}>/ 10 {risk.level}</div>
                    </div>
                    <button onClick={() => setScreen("setup")} style={{ padding: "6px 12px", borderRadius: 5, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 9 }}>⚙ Config</button>
                  </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                  {["all","critical","high","medium","data_leak","credential","mention","phishing","counterfeit","doxxing","exploit"].map(f => (
                    <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "3px 9px", borderRadius: 3, cursor: "pointer", fontSize: 8, letterSpacing: "0.07em", textTransform: "uppercase", background: activeFilter===f ? "rgba(255,149,0,0.2)" : "rgba(255,255,255,0.04)", border: activeFilter===f ? "1px solid rgba(255,149,0,0.5)" : "1px solid rgba(255,255,255,0.07)", color: activeFilter===f ? "#ff9500" : "rgba(255,255,255,0.68)", transition: "all 0.2s" }}>{f.replace(/_/g," ")}</button>
                  ))}
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", alignSelf: "center", marginLeft: 4 }}>{filtered.length} results</span>
                </div>

                {/* Live feed */}
                <div>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>No matching threats in current filter.</div>
                  )}
                  {filtered.map(r => <ThreatCard key={r.uid} result={r} entities={entities} isNew={newIds.has(r.uid)} />)}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button onClick={resetAll} style={{ flex: 1, padding: "10px", borderRadius: 5, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)", fontSize: 9, letterSpacing: "0.1em" }}>← RESET & RECONFIGURE</button>
                  {!isMonitoring && <button onClick={startMonitoring} style={{ flex: 2, padding: "10px", borderRadius: 5, cursor: "pointer", background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.3)", color: "#30d158", fontSize: 9, letterSpacing: "0.1em" }}>▶ RESUME MONITORING</button>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ping { 75%,100%{transform:scale(1.8);opacity:0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes threatPulse { 0%,100%{box-shadow:0 0 0 rgba(255,45,85,0)} 50%{box-shadow:0 0 16px rgba(255,45,85,0.1)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        input:focus { border-color: rgba(255,149,0,0.5) !important; }
        button:hover { opacity: 0.82; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255,149,0,0.28); border-radius: 2px; }
      `}</style>
    </div>
  );
}
