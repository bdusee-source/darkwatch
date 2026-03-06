import { useState, useMemo, useCallback } from "react";

// Data & utilities
import { SEVERITY_CONFIG, THREAT_TYPES } from "./data/constants";
import { calcRisk } from "./utils/helpers";

// Hooks
import { useIntelFeeds } from "./hooks/useIntelFeeds";
import { useScanEngine } from "./hooks/useScanEngine";

// Components
import { RiskBar } from "./components/RiskBar";
import { ThreatCard } from "./components/ThreatCard";
import { StatBox, TagInput, ScanSection, SimpleInput, ToggleGroup, TerminalText } from "./components/UI";

// Screen-level components (kept inline as they depend heavily on local state)
import { ReportScreen }    from "./screens/ReportScreen";
import { DocScreen }       from "./screens/DocScreen";
import { ContactScreen }   from "./screens/ContactScreen";
import { IntelFeedsScreen } from "./screens/IntelFeedsScreen";

const GLOBAL_STYLES = `
  @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes ping       { 75%,100%{transform:scale(1.8);opacity:0} }
  @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes threatPulse{ 0%,100%{box-shadow:0 0 0 rgba(255,45,85,0)} 50%{box-shadow:0 0 16px rgba(255,45,85,0.1)} }
  @keyframes slideIn    { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanLine   { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  input:focus { border-color: rgba(255,149,0,0.5) !important; }
  button:hover { opacity: 0.82; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  ::-webkit-scrollbar-thumb { background: rgba(255,149,0,0.28); border-radius: 2px; }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; color: #000 !important; }
    #report-content { color: #000 !important; }
  }
`;

// ─── Default notification config ─────────────────────────────────────────────
const DEFAULT_NOTIF_CONFIG = {
  email:   { recipients: "", minSeverity: "high", subjectPrefix: "[DARKWATCH]", digest: false },
  slack:   { webhookUrl: "", channel: "#security-alerts", botName: "DARKWATCH", minSeverity: "high" },
  webhook: { url: "", secret: "", method: "POST", minSeverity: "critical" },
  sms:     { numbers: "", provider: "twilio", accountSid: "", authToken: "", minSeverity: "critical" },
};

const DEFAULT_INTEL_CONFIG = {
  hibp:      { enabled: true,  apiKey: "" },
  urlhaus:   { enabled: true },
  phishtank: { enabled: true,  apiKey: "" },
  otx:       { enabled: true,  apiKey: "" },
};

const DEFAULT_PAID_FEED_CONFIG = {
  recordedFuture: { enabled: false, apiKey: "" },
  darkOwl:        { enabled: false, apiKey: "", apiSecret: "" },
  flare:          { enabled: false, apiKey: "", tenantId: "" },
  intel471:       { enabled: false, apiKey: "", apiSecret: "" },
  cybersixgill:   { enabled: false, clientId: "", clientSecret: "" },
};

// ─── Notification channel config sub-component ───────────────────────────────
function NotifChannelCard({ ch, active, cfg, onToggle, onUpdate, tested, onTest }) {
  const NInput = ({ label, field, placeholder, type = "text", mono = false }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={cfg[field]}
        onChange={(e) => onUpdate(field, e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "7px 10px", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box", fontFamily: mono ? "monospace" : "inherit" }}
      />
    </div>
  );

  const NSeverity = ({ field }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>MINIMUM SEVERITY TO ALERT</div>
      <div style={{ display: "flex", gap: 5 }}>
        {["critical", "high", "medium", "low"].map((s) => {
          const sc = SEVERITY_CONFIG[s];
          const sel = cfg[field] === s;
          return (
            <button key={s} onClick={() => onUpdate(field, s)} style={{ flex: 1, padding: "5px 0", borderRadius: 4, cursor: "pointer", fontSize: 9, fontWeight: sel ? 700 : 400, border: `1px solid ${sel ? sc.color : "rgba(255,255,255,0.08)"}`, background: sel ? `${sc.color}20` : "rgba(255,255,255,0.03)", color: sel ? sc.color : "rgba(255,255,255,0.65)", transition: "all 0.15s", letterSpacing: "0.06em" }}>
              {s.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 8, border: `1px solid ${active ? ch.color + "44" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, overflow: "hidden", transition: "border-color 0.2s" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", background: active ? `${ch.color}0d` : "rgba(255,255,255,0.02)", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <button onClick={(e) => { e.stopPropagation(); onTest(); }} style={{ padding: "3px 10px", borderRadius: 4, cursor: "pointer", background: `${ch.color}15`, border: `1px solid ${ch.color}33`, color: ch.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>▶ TEST</button>
          </div>
        )}
      </div>

      {active && (
        <div style={{ padding: "14px 14px 6px", borderTop: `1px solid ${ch.color}22`, background: "rgba(0,0,0,0.15)" }}>
          {ch.id === "email" && <>
            <NInput label="RECIPIENT EMAIL ADDRESSES (comma-separated)" field="recipients" placeholder="soc@company.com, ciso@company.com" />
            <NInput label="SUBJECT LINE PREFIX" field="subjectPrefix" placeholder="[DARKWATCH]" mono />
            <NSeverity field="minSeverity" />
            <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div onClick={() => onUpdate("digest", !cfg.digest)} style={{ width: 32, height: 18, borderRadius: 9, background: cfg.digest ? "#ff9500" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: cfg.digest ? 17 : 3, transition: "left 0.2s" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: cfg.digest ? "#ff9500" : "rgba(255,255,255,0.7)", fontWeight: cfg.digest ? 700 : 400 }}>Daily digest mode</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.52)" }}>Bundle all alerts into a single daily summary email</div>
              </div>
            </div>
          </>}
          {ch.id === "slack" && <>
            <NInput label="SLACK WEBHOOK URL" field="webhookUrl" placeholder="https://hooks.slack.com/services/..." mono />
            <NInput label="CHANNEL" field="channel" placeholder="#security-alerts" mono />
            <NInput label="BOT DISPLAY NAME" field="botName" placeholder="DARKWATCH" />
            <NSeverity field="minSeverity" />
          </>}
          {ch.id === "webhook" && <>
            <NInput label="ENDPOINT URL" field="url" placeholder="https://your-siem.company.com/api/alerts" mono />
            <NInput label="SECRET / BEARER TOKEN" field="secret" placeholder="Bearer sk-..." type="password" mono />
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>HTTP METHOD</div>
              <div style={{ display: "flex", gap: 5 }}>
                {["POST", "PUT"].map((m) => (
                  <button key={m} onClick={() => onUpdate("method", m)} style={{ padding: "5px 16px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: cfg.method === m ? 700 : 400, border: `1px solid ${cfg.method === m ? "#ff6b35" : "rgba(255,255,255,0.08)"}`, background: cfg.method === m ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.03)", color: cfg.method === m ? "#ff6b35" : "rgba(255,255,255,0.65)" }}>{m}</button>
                ))}
              </div>
            </div>
            <NSeverity field="minSeverity" />
            <div style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: 5 }}>
              <div style={{ fontSize: 9, color: "rgba(255,107,53,0.7)", marginBottom: 3, letterSpacing: "0.1em" }}>PAYLOAD FORMAT</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", lineHeight: 1.7 }}>{`{ "severity": "critical", "type": "data_leak", "source": "...", "content": "...", "detectedAt": 1234567890, "brand": "..." }`}</div>
            </div>
          </>}
          {ch.id === "sms" && <>
            <NInput label="RECIPIENT PHONE NUMBERS (comma-separated, E.164 format)" field="numbers" placeholder="+442071234567, +14155552671" mono />
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginBottom: 3 }}>SMS PROVIDER</div>
              <div style={{ display: "flex", gap: 5 }}>
                {["twilio", "aws-sns", "vonage"].map((p) => (
                  <button key={p} onClick={() => onUpdate("provider", p)} style={{ flex: 1, padding: "5px 0", borderRadius: 4, cursor: "pointer", fontSize: 9, fontWeight: cfg.provider === p ? 700 : 400, border: `1px solid ${cfg.provider === p ? "#30d158" : "rgba(255,255,255,0.08)"}`, background: cfg.provider === p ? "rgba(48,209,88,0.15)" : "rgba(255,255,255,0.03)", color: cfg.provider === p ? "#30d158" : "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{p}</button>
                ))}
              </div>
            </div>
            <NInput label="ACCOUNT SID / API KEY" field="accountSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" mono />
            <NInput label="AUTH TOKEN / SECRET" field="authToken" placeholder="your_auth_token" type="password" mono />
            <NSeverity field="minSeverity" />
            <div style={{ marginBottom: 10, padding: "8px 10px", background: "rgba(48,209,88,0.05)", border: "1px solid rgba(48,209,88,0.15)", borderRadius: 5 }}>
              <div style={{ fontSize: 9, color: "rgba(48,209,88,0.7)" }}>⚠ SMS recommended for CRITICAL findings only due to per-message costs.</div>
            </div>
          </>}

          <div style={{ marginBottom: 10, marginTop: 4, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(255,149,0,0.4)", borderRadius: 4, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: "#ff9500", fontSize: 11, flexShrink: 0, marginTop: 1 }}>◎</span>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.58)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "rgba(255,255,255,0.75)" }}>Simulation mode:</strong> The ▶ TEST button simulates delivery only — no real alert is sent. A backend integration is required for live notifications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]       = useState("scanner");
  const [screen, setScreen] = useState("setup");

  // ── Profile state ──────────────────────────────────────────────────────────
  const [brand, setBrand]                       = useState("");
  const [industry, setIndustry]                 = useState("");
  const [stockTickers, setStockTickers]         = useState([]);
  const [legalEntities, setLegalEntities]       = useState([]);
  const [domains, setDomains]                   = useState([]);
  const [emails, setEmails]                     = useState([]);
  const [ips, setIps]                           = useState([]);
  const [asns, setAsns]                         = useState([]);
  const [certs, setCerts]                       = useState([]);
  const [vips, setVips]                         = useState([]);
  const [employees, setEmployees]               = useState([]);
  const [contractors, setContractors]           = useState([]);
  const [products, setProducts]                 = useState([]);
  const [projects, setProjects]                 = useState([]);
  const [trademarks, setTrademarks]             = useState([]);
  const [sourcePaths, setSourcePaths]           = useState([]);
  const [socials, setSocials]                   = useState([]);
  const [appNames, setAppNames]                 = useState([]);
  const [suppliers, setSuppliers]               = useState([]);
  const [cloudServices, setCloudServices]       = useState([]);
  const [keywords, setKeywords]                 = useState([]);
  const [excludeKeywords, setExcludeKeywords]   = useState([]);
  const [monitorSources, setMonitorSources]     = useState(["forums", "paste", "markets"]);
  const [alertChannels, setAlertChannels]       = useState(["email"]);
  const [notifConfig, setNotifConfig]           = useState(DEFAULT_NOTIF_CONFIG);
  const [testedChannels, setTestedChannels]     = useState({});
  const [intelConfig, setIntelConfig]           = useState(DEFAULT_INTEL_CONFIG);
  const [paidFeedConfig, setPaidFeedConfig]     = useState(DEFAULT_PAID_FEED_CONFIG);
  const [activeFilter, setActiveFilter]         = useState("all");

  // ── Memoised entities object — avoids recreating on every render ──────────
  const entities = useMemo(() => ({
    brands: [brand],
    domains,
    ips,
    vips,
    products,
    projects,
    keywords,
    socials,
    certs,
    suppliers,
  }), [brand, domains, ips, vips, products, projects, keywords, socials, certs, suppliers]);

  // ── Intel feeds hook ───────────────────────────────────────────────────────
  const { intelStatus, intelResults, runAllFeeds } = useIntelFeeds(intelConfig, brand, domains);

  // ── Scan engine hook ───────────────────────────────────────────────────────
  const {
    isMonitoring,
    scanCycle,
    scanPhase,
    isSweeping,
    nextScanIn,
    lastScanTime,
    results,
    newIds,
    startMonitoring: startScan,
    pauseMonitoring,
    resetAll: resetScan,
  } = useScanEngine({
    entities,
    runAllFeeds,
    onSweepComplete: () => setScreen("results"),
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const risk = useMemo(() => calcRisk(results), [results]);

  const totalConfigured = useMemo(() =>
    (brand ? 1 : 0) + (industry ? 1 : 0) +
    domains.length + emails.length + ips.length + asns.length + certs.length +
    vips.length + employees.length + contractors.length +
    products.length + projects.length + trademarks.length + sourcePaths.length +
    socials.length + appNames.length + suppliers.length + cloudServices.length +
    keywords.length + stockTickers.length + legalEntities.length,
  [brand, industry, domains, emails, ips, asns, certs, vips, employees, contractors, products, projects, trademarks, sourcePaths, socials, appNames, suppliers, cloudServices, keywords, stockTickers, legalEntities]);

  const filtered = useMemo(() =>
    activeFilter === "all"
      ? results
      : results.filter((r) => r.severity === activeFilter || r.type === activeFilter),
  [results, activeFilter]);

  const criticalCount = useMemo(() => results.filter((r) => r.severity === "critical").length, [results]);
  const highCount     = useMemo(() => results.filter((r) => r.severity === "high").length, [results]);
  const mediumCount   = useMemo(() => results.filter((r) => r.severity === "medium").length, [results]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addTag    = (v, list, set) => { if (!list.includes(v)) set([...list, v]); };
  const removeTag = (v, list, set) => set(list.filter((x) => x !== v));
  const toggleArr = (v, list, set) => list.includes(v) ? set(list.filter((x) => x !== v)) : set([...list, v]);

  const updateNotif = useCallback((channel, field, value) =>
    setNotifConfig((p) => ({ ...p, [channel]: { ...p[channel], [field]: value } })), []);

  const testChannel = useCallback((channel) => {
    setTestedChannels((p) => ({ ...p, [channel]: "testing" }));
    setTimeout(() => setTestedChannels((p) => ({ ...p, [channel]: "ok" })), 1800);
    setTimeout(() => setTestedChannels((p) => ({ ...p, [channel]: null })), 5000);
  }, []);

  const startMonitoring = useCallback(() => {
    if (!brand.trim()) return;
    startScan();
  }, [brand, startScan]);

  const resetAll = useCallback(() => {
    resetScan();
    setScreen("setup");
  }, [resetScan]);

  const CHANNEL_DEFS = [
    { id: "email",   icon: "✉",  label: "Email",   color: "#ff9500" },
    { id: "slack",   icon: "◈",  label: "Slack",   color: "#4a9eff" },
    { id: "webhook", icon: "⚡", label: "Webhook", color: "#ff6b35" },
    { id: "sms",     icon: "◉",  label: "SMS",     color: "#30d158" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080a0d", backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(255,149,0,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,45,85,0.04) 0%, transparent 50%)", fontFamily: "'Courier New', monospace", color: "#fff", paddingTop: 60 }}>
      {/* Grid background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,149,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,149,0,0.022) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 0 }} />

      <RiskBar risk={risk} isMonitoring={isMonitoring} brand={brand} lastScanTime={lastScanTime} nextScanIn={nextScanIn} scanCycle={scanCycle} />

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
              {isMonitoring ? (
                <button onClick={pauseMonitoring} className="no-print" style={{ padding: "7px 14px", borderRadius: 6, cursor: "pointer", background: "rgba(255,45,85,0.12)", border: "1px solid rgba(255,45,85,0.35)", color: "#ff2d55", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>⏸ PAUSE</button>
              ) : (
                brand.trim() && screen !== "setup" && (
                  <button onClick={startMonitoring} className="no-print" style={{ padding: "7px 14px", borderRadius: 6, cursor: "pointer", background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.35)", color: "#30d158", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>▶ RESUME</button>
                )
              )}
              <div className="no-print" style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: 3 }}>
                {[
                  { id: "scanner",  label: "◉ Scanner"  },
                  { id: "intel",    label: "◈ Intel Feeds" },
                  { id: "reports",  label: "◎ Reports"  },
                  { id: "contact",  label: "⚑ Emergency" },
                  { id: "docs",     label: "◎ Docs"     },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{ padding: "7px 16px", borderRadius: 5, cursor: "pointer", border: "none", background: tab === t.id ? (t.id === "contact" ? "rgba(255,45,85,0.2)" : "rgba(255,149,0,0.18)") : "transparent", color: tab === t.id ? (t.id === "contact" ? "#ff2d55" : "#ff9500") : "rgba(255,255,255,0.62)", fontSize: 10, fontWeight: tab === t.id ? 700 : 400, letterSpacing: "0.05em", transition: "all 0.2s", fontFamily: "monospace", animation: t.id === "contact" && tab !== "contact" ? "blink 2.5s infinite" : "none" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 20px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,149,0,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, flexShrink: 0 }}>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Powered by</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(255,149,0,0.25)" stroke="rgba(255,149,0,0.6)" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="rgba(255,149,0,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", background: "linear-gradient(90deg, #e0e0e0, #a0a0a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>YOUR PARTNER</span>
              </div>
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,149,0,0.1)" }} />
          </div>
        </div>

        {/* ══ TAB CONTENT ══ */}
        {tab === "docs"    && <DocScreen />}
        {tab === "intel"   && <IntelFeedsScreen intelConfig={intelConfig} updateIntel={(src, f, v) => setIntelConfig((p) => ({ ...p, [src]: { ...p[src], [f]: v } }))} paidFeedConfig={paidFeedConfig} updatePaidFeed={(src, f, v) => setPaidFeedConfig((p) => ({ ...p, [src]: { ...p[src], [f]: v } }))} intelResults={intelResults} intelStatus={intelStatus} brand={brand} domains={domains} />}
        {tab === "reports" && <ReportScreen results={results} brand={brand} entities={entities} risk={risk} scanCycle={scanCycle} lastScanTime={lastScanTime} totalConfigured={totalConfigured} />}
        {tab === "contact" && <ContactScreen risk={risk} />}

        {/* ══ SCANNER TAB ══ */}
        {tab === "scanner" && (
          <>
            {/* ── SETUP SCREEN ── */}
            {screen === "setup" && (
              <div>
                {/* Profile completeness bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "9px 13px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.12)", borderRadius: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.62)" }}>PROFILE COMPLETENESS</span>
                    <div style={{ width: 90, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, totalConfigured * 5)}%`, background: "linear-gradient(90deg, #ff9500, #ff2d55)", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#ff9500", fontWeight: 700 }}>{totalConfigured} signals</span>
                  </div>
                  <button onClick={() => setTab("docs")} style={{ fontSize: 9, color: "rgba(255,149,0,0.65)", background: "transparent", border: "1px solid rgba(255,149,0,0.22)", borderRadius: 4, padding: "3px 9px", cursor: "pointer" }}>◎ Docs</button>
                </div>

                <ScanSection title="1 · BRAND IDENTITY" badge={(brand ? 1 : 0) + (industry ? 1 : 0) + stockTickers.length + legalEntities.length} defaultOpen>
                  <SimpleInput label="PRIMARY BRAND NAME *" sublabel="Main organization name monitored across all sources" placeholder="e.g. Acme Corporation" value={brand} onChange={setBrand} />
                  <SimpleInput label="INDUSTRY / SECTOR" sublabel="Helps correlate sector-specific threat actor activity" placeholder="e.g. Financial Services, Healthcare, SaaS" value={industry} onChange={setIndustry} />
                  <TagInput label="STOCK TICKER SYMBOLS" sublabel="Detect market manipulation & pump-dump schemes" placeholder="e.g. ACME, NYSE:ACM" tags={stockTickers} onAdd={(v) => addTag(v, stockTickers, setStockTickers)} onRemove={(v) => removeTag(v, stockTickers, setStockTickers)} />
                  <TagInput label="LEGAL ENTITY NAMES" sublabel="Subsidiaries, holding companies, registered legal names" placeholder="e.g. Acme Holdings Ltd" tags={legalEntities} onAdd={(v) => addTag(v, legalEntities, setLegalEntities)} onRemove={(v) => removeTag(v, legalEntities, setLegalEntities)} />
                </ScanSection>

                <ScanSection title="2 · DIGITAL INFRASTRUCTURE" badge={domains.length + emails.length + ips.length + asns.length + certs.length} badgeColor="#ff6b35">
                  <TagInput label="DOMAINS & SUBDOMAINS" sublabel="Monitor for typosquatting, phishing kits, unauthorized impersonation" placeholder="e.g. acme.com, api.acme.com" tags={domains} onAdd={(v) => addTag(v, domains, setDomains)} onRemove={(v) => removeTag(v, domains, setDomains)} tagColor="#ff6b35" />
                  <TagInput label="CORPORATE EMAIL DOMAINS" sublabel="Detect credential leaks matching corporate email domains" placeholder="e.g. @acme.com" tags={emails} onAdd={(v) => addTag(v, emails, setEmails)} onRemove={(v) => removeTag(v, emails, setEmails)} tagColor="#ff6b35" />
                  <TagInput label="IP RANGES / CIDR BLOCKS" sublabel="Flag exploit listings targeting your infrastructure" placeholder="e.g. 203.0.113.0/24" tags={ips} onAdd={(v) => addTag(v, ips, setIps)} onRemove={(v) => removeTag(v, ips, setIps)} tagColor="#ff6b35" />
                  <TagInput label="ASN NUMBERS" sublabel="Autonomous System Numbers for network-level monitoring" placeholder="e.g. AS12345" tags={asns} onAdd={(v) => addTag(v, asns, setAsns)} onRemove={(v) => removeTag(v, asns, setAsns)} tagColor="#ff6b35" />
                  <TagInput label="SSL / TLS CERTIFICATE DOMAINS" sublabel="Detect certificate theft enabling MITM attacks" placeholder="e.g. *.acme.com" tags={certs} onAdd={(v) => addTag(v, certs, setCerts)} onRemove={(v) => removeTag(v, certs, setCerts)} tagColor="#ff6b35" />
                </ScanSection>

                <ScanSection title="3 · PEOPLE & PERSONNEL" badge={vips.length + employees.length + contractors.length} badgeColor="#ff2d55">
                  <TagInput label="VIP / EXECUTIVE TARGETS" sublabel="C-suite & board — doxxing, credential & physical threat monitoring" placeholder="e.g. Jane Smith CEO" tags={vips} onAdd={(v) => addTag(v, vips, setVips)} onRemove={(v) => removeTag(v, vips, setVips)} tagColor="#ff2d55" icon="⚑" />
                  <TagInput label="KEY EMPLOYEE IDENTIFIERS" sublabel="Employees with elevated access — high-value credential targets" placeholder="e.g. j.smith@acme.com" tags={employees} onAdd={(v) => addTag(v, employees, setEmployees)} onRemove={(v) => removeTag(v, employees, setEmployees)} tagColor="#ff6b35" />
                  <TagInput label="CONTRACTORS & THIRD PARTIES" sublabel="External personnel with system access — insider threat vector" placeholder="e.g. Dev Agency XYZ" tags={contractors} onAdd={(v) => addTag(v, contractors, setContractors)} onRemove={(v) => removeTag(v, contractors, setContractors)} tagColor="#ff9500" />
                </ScanSection>

                <ScanSection title="4 · PRODUCTS & INTELLECTUAL PROPERTY" badge={products.length + projects.length + trademarks.length + sourcePaths.length} badgeColor="#ff9500">
                  <TagInput label="PRODUCT NAMES" sublabel="Monitor for counterfeiting, piracy, unauthorized resale" placeholder="e.g. AcmePay, Acme Suite" tags={products} onAdd={(v) => addTag(v, products, setProducts)} onRemove={(v) => removeTag(v, products, setProducts)} />
                  <TagInput label="INTERNAL PROJECT CODENAMES" sublabel="Confidential names that should never appear externally" placeholder="e.g. Project Nighthawk" tags={projects} onAdd={(v) => addTag(v, projects, setProjects)} onRemove={(v) => removeTag(v, projects, setProjects)} />
                  <TagInput label="TRADEMARKS & PATENTS" sublabel="Registered IP identifiers for infringement monitoring" placeholder="e.g. AcmePay™" tags={trademarks} onAdd={(v) => addTag(v, trademarks, setTrademarks)} onRemove={(v) => removeTag(v, trademarks, setTrademarks)} />
                  <TagInput label="SOURCE CODE IDENTIFIERS" sublabel="Repo names or code strings to detect source code leaks" placeholder="e.g. acme-internal-sdk" tags={sourcePaths} onAdd={(v) => addTag(v, sourcePaths, setSourcePaths)} onRemove={(v) => removeTag(v, sourcePaths, setSourcePaths)} />
                </ScanSection>

                <ScanSection title="5 · SOCIAL MEDIA & BRAND CHANNELS" badge={socials.length + appNames.length} badgeColor="#ff6b35">
                  <TagInput label="SOCIAL MEDIA HANDLES" sublabel="Detect impersonation, fake accounts, brand hijacking" placeholder="e.g. @acmecorp" tags={socials} onAdd={(v) => addTag(v, socials, setSocials)} onRemove={(v) => removeTag(v, socials, setSocials)} tagColor="#ff6b35" />
                  <TagInput label="APP / PRODUCT NAMES" sublabel="Detect cloned or trojanized app versions" placeholder="e.g. Acme Mobile" tags={appNames} onAdd={(v) => addTag(v, appNames, setAppNames)} onRemove={(v) => removeTag(v, appNames, setAppNames)} tagColor="#ff6b35" />
                </ScanSection>

                <ScanSection title="6 · SUPPLY CHAIN & THIRD-PARTY RISK" badge={suppliers.length + cloudServices.length} badgeColor="#ff9500">
                  <TagInput label="KEY SUPPLIERS & VENDORS" sublabel="Monitor for compromise of partners with system access" placeholder="e.g. Vendor Corp" tags={suppliers} onAdd={(v) => addTag(v, suppliers, setSuppliers)} onRemove={(v) => removeTag(v, suppliers, setSuppliers)} />
                  <TagInput label="CLOUD SERVICES & SaaS PLATFORMS" sublabel="Detect breach disclosures affecting platforms you depend on" placeholder="e.g. AWS org, GitHub org/acme" tags={cloudServices} onAdd={(v) => addTag(v, cloudServices, setCloudServices)} onRemove={(v) => removeTag(v, cloudServices, setCloudServices)} />
                </ScanSection>

                <ScanSection title="7 · CUSTOM KEYWORDS & EXCLUSIONS" badge={keywords.length + excludeKeywords.length} badgeColor="#ff6b35">
                  <TagInput label="MONITOR KEYWORDS" sublabel="Additional terms, internal jargon, or aliases to sweep for" placeholder="e.g. 'acme breach'" tags={keywords} onAdd={(v) => addTag(v, keywords, setKeywords)} onRemove={(v) => removeTag(v, keywords, setKeywords)} tagColor="#ff6b35" />
                  <TagInput label="EXCLUSION KEYWORDS" sublabel="Suppress these terms to reduce false positives" placeholder="e.g. 'acme cartoon'" tags={excludeKeywords} onAdd={(v) => addTag(v, excludeKeywords, setExcludeKeywords)} onRemove={(v) => removeTag(v, excludeKeywords, setExcludeKeywords)} tagColor="rgba(255,255,255,0.6)" />
                </ScanSection>

                <ScanSection title="8 · SCAN CONFIGURATION" defaultOpen>
                  <ToggleGroup
                    label="SOURCE TYPES TO MONITOR"
                    sublabel="Select which darkweb and threat intelligence sources to include"
                    options={[
                      { value: "forums",   label: "Hacker Forums"   },
                      { value: "paste",    label: "Paste Sites"     },
                      { value: "markets",  label: "Marketplaces"    },
                      { value: "telegram", label: "Telegram"        },
                      { value: "irc",      label: "IRC"             },
                      { value: "combo",    label: "Combo Lists"     },
                      { value: "stealer",  label: "Stealer Logs"    },
                      { value: "ransom",   label: "Ransomware Blogs"},
                    ]}
                    selected={monitorSources}
                    onToggle={(v) => toggleArr(v, monitorSources, setMonitorSources)}
                  />

                  {/* Alert channels */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 3 }}>◈ ALERT CHANNELS</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 10, lineHeight: 1.5 }}>Enable channels and configure each one. Alerts fire when findings meet the minimum severity threshold.</div>
                    {CHANNEL_DEFS.map((ch) => (
                      <NotifChannelCard
                        key={ch.id}
                        ch={ch}
                        active={alertChannels.includes(ch.id)}
                        cfg={notifConfig[ch.id]}
                        onToggle={() => toggleArr(ch.id, alertChannels, setAlertChannels)}
                        onUpdate={(field, value) => updateNotif(ch.id, field, value)}
                        tested={testedChannels[ch.id]}
                        onTest={() => testChannel(ch.id)}
                      />
                    ))}
                  </div>
                </ScanSection>

                <div style={{ height: 16 }} />

                <button
                  onClick={startMonitoring}
                  disabled={!brand.trim()}
                  aria-label="Activate continuous monitoring"
                  style={{ width: "100%", padding: "14px", borderRadius: 8, cursor: brand.trim() ? "pointer" : "not-allowed", background: brand.trim() ? "linear-gradient(135deg, #ff9500, #ff6b35, #ff2d55)" : "rgba(255,255,255,0.04)", border: "none", color: brand.trim() ? "#fff" : "rgba(255,255,255,0.48)", fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", transition: "all 0.3s", boxShadow: brand.trim() ? "0 0 28px rgba(255,149,0,0.18)" : "none" }}
                >
                  ◉ ACTIVATE CONTINUOUS MONITORING — {totalConfigured} SIGNALS
                </button>

                <div style={{ marginTop: 12, padding: "9px 13px", background: "rgba(255,45,85,0.04)", border: "1px solid rgba(255,45,85,0.1)", borderRadius: 5 }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.7 }}>⚠ DISCLAIMER: This platform surfaces intelligence from monitored darkweb sources for defensive security purposes only. All data is handled in accordance with applicable law. Results are for threat awareness and do not constitute legal evidence.</p>
                </div>
              </div>
            )}

            {/* ── RESULTS SCREEN ── */}
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

                {/* Stats row */}
                <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
                  <StatBox label="Critical" value={criticalCount} color="#ff2d55" sub="ACT NOW"     />
                  <StatBox label="High"     value={highCount}     color="#ff6b35" sub="INVESTIGATE" />
                  <StatBox label="Medium"   value={mediumCount}   color="#ff9500" sub="MONITOR"     />
                  <StatBox label="Total"    value={results.length} color="rgba(255,255,255,0.7)"    />
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
                  {["all", "critical", "high", "medium", "data_leak", "credential", "mention", "phishing", "counterfeit", "doxxing", "exploit"].map((f) => (
                    <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "3px 9px", borderRadius: 3, cursor: "pointer", fontSize: 8, letterSpacing: "0.07em", textTransform: "uppercase", background: activeFilter === f ? "rgba(255,149,0,0.2)" : "rgba(255,255,255,0.04)", border: activeFilter === f ? "1px solid rgba(255,149,0,0.5)" : "1px solid rgba(255,255,255,0.07)", color: activeFilter === f ? "#ff9500" : "rgba(255,255,255,0.68)", transition: "all 0.2s" }}>{f.replace(/_/g, " ")}</button>
                  ))}
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", alignSelf: "center", marginLeft: 4 }}>{filtered.length} results</span>
                </div>

                {/* Live feed */}
                <div>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>No matching threats in current filter.</div>
                  )}
                  {filtered.map((r) => (
                    <ThreatCard key={r.uid} result={r} entities={entities} isNew={newIds.has(r.uid)} />
                  ))}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button onClick={resetAll} style={{ flex: 1, padding: "10px", borderRadius: 5, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)", fontSize: 9, letterSpacing: "0.1em" }}>← RESET & RECONFIGURE</button>
                  {!isMonitoring && (
                    <button onClick={startMonitoring} style={{ flex: 2, padding: "10px", borderRadius: 5, cursor: "pointer", background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.3)", color: "#30d158", fontSize: 9, letterSpacing: "0.1em" }}>▶ RESUME MONITORING</button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}
