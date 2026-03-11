import { useState, useMemo, useCallback, useEffect, useRef } from "react";

import { SEVERITY_CONFIG } from "./data/constants";
import { calcRisk } from "./utils/helpers";
import { useIntelFeeds } from "./hooks/useIntelFeeds";
import { useScanEngine } from "./hooks/useScanEngine";
import { RiskBar } from "./components/RiskBar";
import { ThreatCard } from "./components/ThreatCard";
import { StatBox, TagInput, ScanSection, SimpleInput, ToggleGroup, TerminalText } from "./components/UI";
import { ReportScreen }     from "./screens/ReportScreen";
import { DocScreen }        from "./screens/DocScreen";
import { ContactScreen }    from "./screens/ContactScreen";
import { IntelFeedsScreen } from "./screens/IntelFeedsScreen";

// ─── Constants ───────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', sans-serif; background: #0a0c10; color: #e2e8f0; -webkit-font-smoothing: antialiased; }
  @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes ping        { 75%,100%{transform:scale(2);opacity:0} }
  @keyframes threatPulse { 0%,100%{box-shadow:0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 20px rgba(239,68,68,0.12)} }
  @keyframes slideDown   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scanLine    { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
  @keyframes slideUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  input, textarea, select, button { font-family: 'Inter', sans-serif; }
  input:focus, textarea:focus { outline: none; border-color: #f97316 !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important; }
  button:active { transform: scale(0.98); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); transition: transform 0.25s; }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0 !important; max-width: 100vw !important; padding: 16px !important; }
    .mobile-menu-btn { display: flex !important; }
    .risk-bar-brand { display: none; }
  }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; color: #000 !important; }
    #report-content { color: #000 !important; }
  }
`;

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

const STORAGE_KEY = "darkwatch_config_v1";

// ─── Validation helpers ───────────────────────────────────────────────────────

const VALIDATORS = {
  domain:  (v) => /^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/i.test(v.trim()),
  ip:      (v) => /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v.trim()),
  asn:     (v) => /^AS\d+$/i.test(v.trim()),
  email:   (v) => /^@?[a-z0-9.-]+\.[a-z]{2,}$/i.test(v.trim()),
  phone:   (v) => /^\+\d{7,15}$/.test(v.trim()),
  url:     (v) => { try { new URL(v); return true; } catch { return false; } },
  ticker:  (v) => /^[A-Z]{1,5}$/.test(v.trim()),
  generic: ()  => true,
};

function validate(value, type) {
  const fn = VALIDATORS[type] || VALIDATORS.generic;
  return fn(value);
}

// ─── useMonitoringConfig hook ─────────────────────────────────────────────────

function useMonitoringConfig() {
  const [brand, setBrand]                     = useState("");
  const [industry, setIndustry]               = useState("");
  const [stockTickers, setStockTickers]       = useState([]);
  const [legalEntities, setLegalEntities]     = useState([]);
  const [domains, setDomains]                 = useState([]);
  const [emails, setEmails]                   = useState([]);
  const [ips, setIps]                         = useState([]);
  const [asns, setAsns]                       = useState([]);
  const [certs, setCerts]                     = useState([]);
  const [vips, setVips]                       = useState([]);
  const [employees, setEmployees]             = useState([]);
  const [contractors, setContractors]         = useState([]);
  const [products, setProducts]               = useState([]);
  const [projects, setProjects]               = useState([]);
  const [trademarks, setTrademarks]           = useState([]);
  const [sourcePaths, setSourcePaths]         = useState([]);
  const [socials, setSocials]                 = useState([]);
  const [appNames, setAppNames]               = useState([]);
  const [suppliers, setSuppliers]             = useState([]);
  const [cloudServices, setCloudServices]     = useState([]);
  const [keywords, setKeywords]               = useState([]);
  const [excludeKeywords, setExcludeKeywords] = useState([]);
  const [monitorSources, setMonitorSources]   = useState(["forums", "paste", "markets"]);
  const [loaded, setLoaded]                   = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c.brand)           setBrand(c.brand);
        if (c.industry)        setIndustry(c.industry);
        if (c.stockTickers)    setStockTickers(c.stockTickers);
        if (c.legalEntities)   setLegalEntities(c.legalEntities);
        if (c.domains)         setDomains(c.domains);
        if (c.emails)          setEmails(c.emails);
        if (c.ips)             setIps(c.ips);
        if (c.asns)            setAsns(c.asns);
        if (c.certs)           setCerts(c.certs);
        if (c.vips)            setVips(c.vips);
        if (c.employees)       setEmployees(c.employees);
        if (c.contractors)     setContractors(c.contractors);
        if (c.products)        setProducts(c.products);
        if (c.projects)        setProjects(c.projects);
        if (c.trademarks)      setTrademarks(c.trademarks);
        if (c.sourcePaths)     setSourcePaths(c.sourcePaths);
        if (c.socials)         setSocials(c.socials);
        if (c.appNames)        setAppNames(c.appNames);
        if (c.suppliers)       setSuppliers(c.suppliers);
        if (c.cloudServices)   setCloudServices(c.cloudServices);
        if (c.keywords)        setKeywords(c.keywords);
        if (c.excludeKeywords) setExcludeKeywords(c.excludeKeywords);
        if (c.monitorSources)  setMonitorSources(c.monitorSources);
      }
    } catch (e) { /* ignore */ }
    setLoaded(true);
  }, []);

  // Save to localStorage whenever config changes
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        brand, industry, stockTickers, legalEntities, domains, emails, ips, asns, certs,
        vips, employees, contractors, products, projects, trademarks, sourcePaths,
        socials, appNames, suppliers, cloudServices, keywords, excludeKeywords, monitorSources,
      }));
    } catch (e) { /* ignore */ }
  }, [loaded, brand, industry, stockTickers, legalEntities, domains, emails, ips, asns, certs,
      vips, employees, contractors, products, projects, trademarks, sourcePaths,
      socials, appNames, suppliers, cloudServices, keywords, excludeKeywords, monitorSources]);

  const getConfig = useCallback(() => ({
    brand, industry, stockTickers, legalEntities, domains, emails, ips, asns, certs,
    vips, employees, contractors, products, projects, trademarks, sourcePaths,
    socials, appNames, suppliers, cloudServices, keywords, excludeKeywords, monitorSources,
  }), [brand, industry, stockTickers, legalEntities, domains, emails, ips, asns, certs,
       vips, employees, contractors, products, projects, trademarks, sourcePaths,
       socials, appNames, suppliers, cloudServices, keywords, excludeKeywords, monitorSources]);

  const loadConfig = useCallback((c) => {
    if (c.brand)           setBrand(c.brand);
    if (c.industry)        setIndustry(c.industry);
    if (c.stockTickers)    setStockTickers(c.stockTickers);
    if (c.legalEntities)   setLegalEntities(c.legalEntities);
    if (c.domains)         setDomains(c.domains);
    if (c.emails)          setEmails(c.emails);
    if (c.ips)             setIps(c.ips);
    if (c.asns)            setAsns(c.asns);
    if (c.certs)           setCerts(c.certs);
    if (c.vips)            setVips(c.vips);
    if (c.employees)       setEmployees(c.employees);
    if (c.contractors)     setContractors(c.contractors);
    if (c.products)        setProducts(c.products);
    if (c.projects)        setProjects(c.projects);
    if (c.trademarks)      setTrademarks(c.trademarks);
    if (c.sourcePaths)     setSourcePaths(c.sourcePaths);
    if (c.socials)         setSocials(c.socials);
    if (c.appNames)        setAppNames(c.appNames);
    if (c.suppliers)       setSuppliers(c.suppliers);
    if (c.cloudServices)   setCloudServices(c.cloudServices);
    if (c.keywords)        setKeywords(c.keywords);
    if (c.excludeKeywords) setExcludeKeywords(c.excludeKeywords);
    if (c.monitorSources)  setMonitorSources(c.monitorSources);
  }, []);

  return {
    brand, setBrand, industry, setIndustry,
    stockTickers, setStockTickers, legalEntities, setLegalEntities,
    domains, setDomains, emails, setEmails, ips, setIps, asns, setAsns, certs, setCerts,
    vips, setVips, employees, setEmployees, contractors, setContractors,
    products, setProducts, projects, setProjects, trademarks, setTrademarks,
    sourcePaths, setSourcePaths, socials, setSocials, appNames, setAppNames,
    suppliers, setSuppliers, cloudServices, setCloudServices,
    keywords, setKeywords, excludeKeywords, setExcludeKeywords,
    monitorSources, setMonitorSources,
    getConfig, loadConfig,
  };
}

// ─── useAlertConfig hook ──────────────────────────────────────────────────────

function useAlertConfig() {
  const [alertChannels, setAlertChannels]   = useState(["email"]);
  const [notifConfig, setNotifConfig]       = useState(DEFAULT_NOTIF_CONFIG);
  const [testedChannels, setTestedChannels] = useState({});
  const [intelConfig, setIntelConfig]       = useState(DEFAULT_INTEL_CONFIG);
  const [paidFeedConfig, setPaidFeedConfig] = useState(DEFAULT_PAID_FEED_CONFIG);

  const updateNotif = useCallback((ch, f, v) =>
    setNotifConfig((p) => ({ ...p, [ch]: { ...p[ch], [f]: v } })), []);

  const testChannel = useCallback((ch) => {
    setTestedChannels((p) => ({ ...p, [ch]: "testing" }));
    setTimeout(() => setTestedChannels((p) => ({ ...p, [ch]: "ok" })), 1800);
    setTimeout(() => setTestedChannels((p) => ({ ...p, [ch]: null })), 5000);
  }, []);

  const updateIntel = useCallback((src, f, v) =>
    setIntelConfig((p) => ({ ...p, [src]: { ...p[src], [f]: v } })), []);

  const updatePaidFeed = useCallback((src, f, v) =>
    setPaidFeedConfig((p) => ({ ...p, [src]: { ...p[src], [f]: v } })), []);

  return {
    alertChannels, setAlertChannels, notifConfig, testedChannels,
    intelConfig, paidFeedConfig,
    updateNotif, testChannel, updateIntel, updatePaidFeed,
  };
}

// ─── Validated TagInput ───────────────────────────────────────────────────────

function ValidatedTagInput({ label, sublabel, tags, onAdd, onRemove, placeholder, tagColor, validationType = "generic" }) {
  const [inputVal, setInputVal]     = useState("");
  const [error, setError]           = useState("");
  const [showBulk, setShowBulk]     = useState(false);
  const [bulkText, setBulkText]     = useState("");

  const tryAdd = useCallback((raw) => {
    const v = raw.trim();
    if (!v) return;
    if (!validate(v, validationType)) {
      setError(`Invalid format for ${label.toLowerCase()}`);
      return;
    }
    if (tags.includes(v)) { setError("Already added"); return; }
    setError("");
    onAdd(v);
    setInputVal("");
  }, [tags, onAdd, label, validationType]);

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); tryAdd(inputVal); }
  };

  const handleBulkImport = () => {
    const items = bulkText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    let added = 0;
    items.forEach((v) => {
      if (validate(v, validationType) && !tags.includes(v)) { onAdd(v); added++; }
    });
    setBulkText("");
    setShowBulk(false);
    if (added === 0) setError("No valid items found");
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: sublabel ? 3 : 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{label}</label>
        <button
          onClick={() => setShowBulk((v) => !v)}
          style={{ fontSize: 11, color: "#475569", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4, border: "1px solid #1e293b" }}
          title="Bulk import"
        >⇥ Bulk</button>
      </div>
      {sublabel && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{sublabel}</p>}

      {showBulk && (
        <div style={{ marginBottom: 8, animation: "slideDown 0.15s ease" }}>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Paste multiple ${label.toLowerCase()}, one per line or comma-separated`}
            rows={4}
            style={{ width: "100%", background: "#111827", border: "1px solid #f97316", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={handleBulkImport} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: 12, fontWeight: 600 }}>Import</button>
            <button onClick={() => setShowBulk(false)} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: "#111827", border: "1px solid #1e293b", color: "#64748b", fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setError(""); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ flex: 1, background: "#111827", border: `1px solid ${error ? "#ef4444" : "#1e293b"}`, borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13 }}
          aria-label={label}
        />
        <button
          onClick={() => tryAdd(inputVal)}
          aria-label={`Add ${label}`}
          style={{ padding: "9px 14px", borderRadius: 8, cursor: "pointer", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316", fontSize: 13, fontWeight: 600 }}
        >+</button>
      </div>
      {error && <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0" }}>{error}</p>}

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {tags.map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 10px", background: tagColor ? `${tagColor}15` : "rgba(249,115,22,0.08)", border: `1px solid ${tagColor || "#f97316"}30`, borderRadius: 99, fontSize: 12, color: tagColor || "#fb923c", fontFamily: "'JetBrains Mono', monospace" }}>
              {t}
              <button onClick={() => onRemove(t)} aria-label={`Remove ${t}`} style={{ background: "none", border: "none", cursor: "pointer", color: tagColor || "#f97316", fontSize: 13, padding: 0, lineHeight: 1, opacity: 0.6 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Masked sensitive input ───────────────────────────────────────────────────

function MaskedInput({ label, value, onChange, placeholder, hint, mono }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 5 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{hint}</p>}
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 40px 10px 13px", color: "#f1f5f9", fontSize: 14, fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif" }}
        />
        <button
          onClick={() => setShow((v) => !v)}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 14, padding: 4 }}
          aria-label={show ? "Hide" : "Show"}
        >{show ? "🙈" : "👁"}</button>
      </div>
    </div>
  );
}

// ─── FormInput ────────────────────────────────────────────────────────────────

function FormInput({ label, value, onChange, placeholder, type = "text", hint, mono, sensitive }) {
  if (sensitive) return <MaskedInput label={label} value={value} onChange={onChange} placeholder={placeholder} hint={hint} mono={mono} />;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 5 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{hint}</p>}
      <input
        type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 13px", color: "#f1f5f9", fontSize: 14, fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif" }}
      />
    </div>
  );
}

// ─── Import/Export ────────────────────────────────────────────────────────────

function ImportExportBar({ getConfig, loadConfig }) {
  const fileRef = useRef();
  const [msg, setMsg] = useState("");

  const doExport = () => {
    const data = JSON.stringify({ _darkwatch: true, version: 1, ...getConfig() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "darkwatch-config.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const c = JSON.parse(ev.target.result);
        if (!c._darkwatch) { setMsg("Not a valid DARKWATCH config file"); return; }
        loadConfig(c);
        setMsg("Config imported ✓");
        setTimeout(() => setMsg(""), 3000);
      } catch { setMsg("Failed to parse file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <button onClick={doExport} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: "#0d1117", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
        ↓ Export config
      </button>
      <button onClick={() => fileRef.current.click()} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", background: "#0d1117", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
        ↑ Import config
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={doImport} style={{ display: "none" }} />
      {msg && <span style={{ fontSize: 12, color: msg.includes("✓") ? "#22c55e" : "#ef4444" }}>{msg}</span>}
    </div>
  );
}

// ─── Trend Sparkline ──────────────────────────────────────────────────────────

function TrendSparkline({ history }) {
  if (!history || history.length < 2) return null;
  const W = 120, H = 36, pad = 4;
  const maxV = Math.max(...history, 1);
  const pts = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * (W - pad * 2);
    const y = H - pad - (v / maxV) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const trend = last > prev ? "↑" : last < prev ? "↓" : "→";
  const trendColor = last > prev ? "#ef4444" : last < prev ? "#22c55e" : "#64748b";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <polyline points={pts} fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
        <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill="#f97316" />
      </svg>
      <span style={{ fontSize: 14, color: trendColor, fontWeight: 700 }}>{trend}</span>
    </div>
  );
}

// ─── Threat Detail Modal ──────────────────────────────────────────────────────

function ThreatDetailModal({ result, onClose, onTriage }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!result) return null;
  const sc = SEVERITY_CONFIG[result.severity] || {};
  const statuses = [
    { id: "open",          label: "Open",             color: "#64748b" },
    { id: "investigating", label: "Investigating",    color: "#f59e0b" },
    { id: "false_positive",label: "False Positive",  color: "#22c55e" },
    { id: "resolved",      label: "Resolved",         color: "#3b82f6" },
  ];

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Threat detail"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.15s ease" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#0d1117", border: `1px solid ${sc.color}30`, borderLeft: `3px solid ${sc.color}`, borderRadius: 12, padding: 28, maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto", animation: "slideUp 0.2s ease" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${sc.color}20`, color: sc.color, letterSpacing: "0.08em" }}>{result.severity?.toUpperCase()}</span>
              <span style={{ fontSize: 11, color: "#475569" }}>{result.type}</span>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: 1.3 }}>{result.title || "Untitled Threat"}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>×</button>
        </div>

        {/* Details */}
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 20 }}>
          {result.description || result.raw || "No additional detail available."}
        </div>

        {result.source && (
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
            <strong style={{ color: "#64748b" }}>Source:</strong> {result.source}
          </div>
        )}
        {result.timestamp && (
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
            <strong style={{ color: "#64748b" }}>Detected:</strong> {result.timestamp}
          </div>
        )}

        {/* Triage */}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Triage Status</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {statuses.map((s) => {
              const active = result.triageStatus === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onTriage(result.uid, s.id)}
                  style={{ padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500, border: `1px solid ${active ? s.color : "#1e293b"}`, background: active ? `${s.color}18` : "#111827", color: active ? s.color : "#64748b", transition: "all 0.15s" }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification channel card ────────────────────────────────────────────────

function NotifChannelCard({ ch, active, cfg, onToggle, onUpdate, tested, onTest }) {
  const NInput = ({ label, field, placeholder, type = "text", mono, sensitive }) => (
    <FormInput label={label} value={cfg[field] || ""} onChange={(v) => onUpdate(field, v)} placeholder={placeholder} type={type} mono={mono} sensitive={sensitive} />
  );
  const NSeverity = ({ field }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 8 }}>Minimum severity</label>
      <div style={{ display: "flex", gap: 6 }}>
        {["critical", "high", "medium", "low"].map((s) => {
          const sc = SEVERITY_CONFIG[s]; const sel = cfg[field] === s;
          return (
            <button key={s} onClick={() => onUpdate(field, s)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: sel ? 700 : 500, border: `1px solid ${sel ? sc.color : "#1e293b"}`, background: sel ? `${sc.color}18` : "#111827", color: sel ? sc.color : "#64748b", transition: "all 0.15s" }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 8, border: `1px solid ${active ? "#334155" : "#1e293b"}`, borderRadius: 10, overflow: "hidden", background: active ? "#0f172a" : "#0a0c10", transition: "all 0.2s" }}>
      <div onClick={onToggle} onKeyDown={(e) => e.key === "Enter" && onToggle()} tabIndex={0} role="button" aria-pressed={active} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 20, borderRadius: 10, background: active ? "#f97316" : "#1e293b", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: active ? 19 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: active ? "#f1f5f9" : "#64748b" }}>{ch.label}</div>
            {active && <div style={{ fontSize: 11, color: "#f97316", marginTop: 1 }}>Enabled</div>}
          </div>
        </div>
        {active && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {tested === "testing" && <span style={{ fontSize: 12, color: "#94a3b8" }}>Testing…</span>}
            {tested === "ok"      && <span style={{ fontSize: 12, color: "#22c55e" }}>✓ Sent</span>}
            <button onClick={(e) => { e.stopPropagation(); onTest(); }} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: 12, fontWeight: 600 }}>Test</button>
          </div>
        )}
      </div>
      {active && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e293b" }}>
          <div style={{ height: 16 }} />
          {ch.id === "email" && <>
            <NInput label="Recipients" field="recipients" placeholder="soc@company.com, ciso@company.com" />
            <NInput label="Subject prefix" field="subjectPrefix" placeholder="[DARKWATCH]" mono />
            <NSeverity field="minSeverity" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div onClick={() => onUpdate("digest", !cfg.digest)} style={{ width: 36, height: 20, borderRadius: 10, background: cfg.digest ? "#f97316" : "#1e293b", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: cfg.digest ? 19 : 3, transition: "left 0.2s" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: cfg.digest ? "#f97316" : "#94a3b8" }}>Daily digest mode</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Bundle all alerts into one daily summary</div>
              </div>
            </div>
          </>}
          {ch.id === "slack" && <>
            <NInput label="Webhook URL" field="webhookUrl" placeholder="https://hooks.slack.com/services/..." mono sensitive />
            <NInput label="Channel" field="channel" placeholder="#security-alerts" mono />
            <NInput label="Bot name" field="botName" placeholder="DARKWATCH" />
            <NSeverity field="minSeverity" />
          </>}
          {ch.id === "webhook" && <>
            <NInput label="Endpoint URL" field="url" placeholder="https://your-siem.company.com/api/alerts" mono />
            <NInput label="Bearer token" field="secret" placeholder="Bearer sk-..." sensitive mono />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 8 }}>HTTP method</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["POST", "PUT"].map((m) => (
                  <button key={m} onClick={() => onUpdate("method", m)} style={{ padding: "7px 20px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: cfg.method === m ? 700 : 500, border: `1px solid ${cfg.method === m ? "#f97316" : "#1e293b"}`, background: cfg.method === m ? "rgba(249,115,22,0.12)" : "#111827", color: cfg.method === m ? "#f97316" : "#64748b" }}>{m}</button>
                ))}
              </div>
            </div>
            <NSeverity field="minSeverity" />
          </>}
          {ch.id === "sms" && <>
            <NInput label="Phone numbers (E.164, comma-separated)" field="numbers" placeholder="+442071234567, +14155552671" mono />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 8 }}>Provider</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["twilio", "aws-sns", "vonage"].map((p) => (
                  <button key={p} onClick={() => onUpdate("provider", p)} style={{ flex: 1, padding: "7px 0", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: cfg.provider === p ? 700 : 500, border: `1px solid ${cfg.provider === p ? "#22c55e" : "#1e293b"}`, background: cfg.provider === p ? "rgba(34,197,94,0.1)" : "#111827", color: cfg.provider === p ? "#22c55e" : "#64748b" }}>{p}</button>
                ))}
              </div>
            </div>
            <NInput label="Account SID / API key" field="accountSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" mono sensitive />
            <NInput label="Auth token / secret" field="authToken" placeholder="your_auth_token" sensitive mono />
            <NSeverity field="minSeverity" />
          </>}
          <div style={{ padding: "10px 12px", background: "#111827", border: "1px solid #1e293b", borderLeft: "3px solid #f97316", borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}><strong style={{ color: "#94a3b8" }}>Simulation mode:</strong> Test sends a simulated alert only. A backend integration is required for live delivery.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Triage badge ─────────────────────────────────────────────────────────────

function TriageBadge({ status }) {
  const map = {
    investigating:  { label: "Investigating",   color: "#f59e0b" },
    false_positive: { label: "False Positive",  color: "#22c55e" },
    resolved:       { label: "Resolved",        color: "#3b82f6" },
  };
  if (!status || status === "open") return null;
  const s = map[status];
  return (
    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: `${s.color}18`, border: `1px solid ${s.color}40`, color: s.color, fontWeight: 600, marginLeft: 6 }}>{s.label}</span>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const CHANNEL_DEFS = [
  { id: "email", label: "Email" }, { id: "slack", label: "Slack" },
  { id: "webhook", label: "Webhook" }, { id: "sms", label: "SMS" },
];

const TABS = [
  { id: "scanner",  label: "Scanner",     icon: "⬡" },
  { id: "intel",    label: "Intel Feeds", icon: "◈" },
  { id: "reports",  label: "Reports",     icon: "▦" },
  { id: "contact",  label: "Emergency",   icon: "⚑", alert: true },
  { id: "docs",     label: "Docs",        icon: "≡" },
];

const FILTER_OPTIONS = [
  { id: "all", label: "All" }, { id: "critical", label: "Critical" },
  { id: "high", label: "High" }, { id: "medium", label: "Medium" },
  { id: "data_leak", label: "Data Leak" }, { id: "credential", label: "Credentials" },
  { id: "phishing", label: "Phishing" }, { id: "mention", label: "Mentions" },
  { id: "exploit", label: "Exploits" },
];

export default function App() {
  const [tab, setTab]             = useState("scanner");
  const [screen, setScreen]       = useState("setup");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [sortOrder, setSortOrder]       = useState("newest");
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [triageMap, setTriageMap]       = useState({});
  const [threatHistory, setThreatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  const monitoring = useMonitoringConfig();
  const alerts     = useAlertConfig();

  const {
    brand, setBrand, industry, setIndustry,
    stockTickers, setStockTickers, legalEntities, setLegalEntities,
    domains, setDomains, emails, setEmails, ips, setIps, asns, setAsns, certs, setCerts,
    vips, setVips, employees, setEmployees, contractors, setContractors,
    products, setProducts, projects, setProjects, trademarks, setTrademarks,
    sourcePaths, setSourcePaths, socials, setSocials, appNames, setAppNames,
    suppliers, setSuppliers, cloudServices, setCloudServices,
    keywords, setKeywords, excludeKeywords, setExcludeKeywords,
    monitorSources, setMonitorSources,
    getConfig, loadConfig,
  } = monitoring;

  const {
    alertChannels, setAlertChannels, notifConfig, testedChannels,
    intelConfig, paidFeedConfig,
    updateNotif, testChannel, updateIntel, updatePaidFeed,
  } = alerts;

  const entities = useMemo(() => ({
    brands: [brand], domains, ips, vips, products,
    projects, keywords, socials, certs, suppliers,
  }), [brand, domains, ips, vips, products, projects, keywords, socials, certs, suppliers]);

  const { intelStatus, intelResults, runAllFeeds } = useIntelFeeds(intelConfig, paidFeedConfig, brand, domains, ips, keywords);

  const {
    isMonitoring, scanCycle, scanPhase, isSweeping,
    nextScanIn, lastScanTime, results, newIds,
    startMonitoring: startScan, pauseMonitoring, resetAll: resetScan,
  } = useScanEngine({ entities, runAllFeeds, onSweepComplete: () => setScreen("results") });

  // Track threat count history for sparkline
  useEffect(() => {
    if (results.length > 0) {
      setThreatHistory((h) => [...h.slice(-19), results.length]);
    }
  }, [scanCycle, results.length]);

  const risk = useMemo(() => calcRisk(results), [results]);

  const totalConfigured = useMemo(() =>
    (brand ? 1 : 0) + (industry ? 1 : 0) +
    domains.length + emails.length + ips.length + asns.length + certs.length +
    vips.length + employees.length + contractors.length +
    products.length + projects.length + trademarks.length + sourcePaths.length +
    socials.length + appNames.length + suppliers.length + cloudServices.length +
    keywords.length + stockTickers.length + legalEntities.length,
  [brand, industry, domains, emails, ips, asns, certs, vips, employees, contractors,
   products, projects, trademarks, sourcePaths, socials, appNames, suppliers, cloudServices,
   keywords, stockTickers, legalEntities]);

  // Results with triage status merged in
  const resultsWithTriage = useMemo(() =>
    results.map((r) => ({ ...r, triageStatus: triageMap[r.uid] || "open" })),
  [results, triageMap]);

  // Filtered + searched + sorted
  const filtered = useMemo(() => {
    let list = activeFilter === "all"
      ? resultsWithTriage
      : resultsWithTriage.filter((r) => r.severity === activeFilter || r.type === activeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.type || "").toLowerCase().includes(q) ||
        (r.source || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    }

    if (sortOrder === "severity") {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      list = [...list].sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));
    } else if (sortOrder === "oldest") {
      list = [...list].reverse();
    }
    return list;
  }, [resultsWithTriage, activeFilter, searchQuery, sortOrder]);

  const criticalCount = useMemo(() => results.filter((r) => r.severity === "critical").length, [results]);
  const highCount     = useMemo(() => results.filter((r) => r.severity === "high").length, [results]);
  const mediumCount   = useMemo(() => results.filter((r) => r.severity === "medium").length, [results]);

  const addTag    = useCallback((v, list, set) => { if (!list.includes(v)) set([...list, v]); }, []);
  const removeTag = useCallback((v, list, set) => set(list.filter((x) => x !== v)), []);
  const toggleArr = useCallback((v, list, set) => list.includes(v) ? set(list.filter((x) => x !== v)) : set([...list, v]), []);

  const startMonitoring = useCallback(() => { if (brand.trim()) startScan(); }, [brand, startScan]);
  const resetAll = useCallback(() => { resetScan(); setScreen("setup"); setThreatHistory([]); }, [resetScan]);

  const handleTriage = useCallback((uid, status) => {
    setTriageMap((m) => ({ ...m, [uid]: status }));
  }, []);

  const openThreatDetail = useCallback((result) => setSelectedThreat(result), []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c10" }}>
      <RiskBar risk={risk} isMonitoring={isMonitoring} brand={brand} lastScanTime={lastScanTime} nextScanIn={nextScanIn} scanCycle={scanCycle} />

      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn no-print"
        onClick={() => setSidebarOpen((v) => !v)}
        style={{ display: "none", position: "fixed", top: 60, left: 12, zIndex: 100, padding: "7px 10px", borderRadius: 7, background: "#0d1117", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 16, cursor: "pointer", alignItems: "center" }}
        aria-label="Toggle menu"
      >☰</button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49 }} />
      )}

      <div style={{ display: "flex", minHeight: "100vh", paddingTop: 52 }}>

        {/* ── Sidebar ── */}
        <nav className={`sidebar no-print${sidebarOpen ? " open" : ""}`} style={{ position: "fixed", top: 52, left: 0, bottom: 0, width: 216, background: "#0d1117", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", zIndex: 50 }}>
          <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#f97316", letterSpacing: "0.12em" }}>DARKWATCH</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Intelligence Platform</div>
          </div>

          <div style={{ padding: "10px 10px", flex: 1, overflowY: "auto" }}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 7, cursor: "pointer", border: "none", textAlign: "left", marginBottom: 2, background: active ? (t.alert ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.1)") : "transparent", color: active ? (t.alert ? "#f87171" : "#fb923c") : (t.alert ? "#f87171" : "#64748b"), fontWeight: active ? 600 : 400, fontSize: 14, transition: "all 0.15s" }}
                  aria-current={active ? "page" : undefined}
                >
                  <span style={{ fontSize: 13, width: 16, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
                  {t.label}
                  {t.alert && !active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "blink 2s infinite" }} />}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "14px 14px", borderTop: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMonitoring ? 8 : 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isMonitoring ? "#22c55e" : "#334155", boxShadow: isMonitoring ? "0 0 6px #22c55e88" : "none", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: isMonitoring ? "#86efac" : "#475569", fontWeight: 500 }}>
                {isMonitoring ? `Active · ${nextScanIn}s` : "Inactive"}
              </span>
            </div>
            {isMonitoring ? (
              <button onClick={pauseMonitoring} style={{ width: "100%", padding: "7px", borderRadius: 7, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 600 }}>⏸ Pause</button>
            ) : brand.trim() && screen !== "setup" ? (
              <button onClick={startMonitoring} style={{ width: "100%", padding: "7px", borderRadius: 7, cursor: "pointer", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 12, fontWeight: 600 }}>▶ Resume</button>
            ) : null}
          </div>
        </nav>

        {/* ── Content ── */}
        <main className="main-content" style={{ marginLeft: 216, flex: 1, padding: "28px 36px 60px", maxWidth: "calc(100vw - 216px)" }}>

          {tab === "docs"    && <DocScreen />}
          {tab === "intel"   && <IntelFeedsScreen intelConfig={intelConfig} updateIntel={updateIntel} paidFeedConfig={paidFeedConfig} updatePaidFeed={updatePaidFeed} intelResults={intelResults} intelStatus={intelStatus} brand={brand} domains={domains} />}
          {tab === "reports" && <ReportScreen results={results} brand={brand} entities={entities} risk={risk} scanCycle={scanCycle} lastScanTime={lastScanTime} totalConfigured={totalConfigured} />}
          {tab === "contact" && <ContactScreen risk={risk} />}

          {tab === "scanner" && (
            <>
              {/* SETUP */}
              {screen === "setup" && (
                <div style={{ maxWidth: 700 }}>
                  <div style={{ marginBottom: 28, position: "relative" }}>
                    <div style={{ position: "absolute", top: -20, left: -40, width: 300, height: 120, background: "radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 10px #f97316, 0 0 20px #f9731640", animation: "blink 2.5s infinite" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f9731680", letterSpacing: "0.2em", textTransform: "uppercase" }}>Surveillance Configuration</span>
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                      Define Your{" "}
                      <span style={{ background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Attack Surface
                      </span>
                    </h1>
                    <p style={{ fontSize: 14, color: "#475569", margin: "0 0 20px", lineHeight: 1.6 }}>
                      Every signal you add sharpens detection. Start with your brand name, then layer in infrastructure, personnel, and keywords.
                    </p>

                    {/* Coverage bar */}
                    <div style={{ padding: "14px 16px", background: "linear-gradient(135deg, #080c14, #0a0f1a)", border: "1px solid #1a2538", borderRadius: 10, position: "relative", overflow: "hidden" }}>
                      {totalConfigured > 0 && (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.04), transparent)", animation: "scanLine 3s ease-in-out infinite", pointerEvents: "none" }} />
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#3d4f63", letterSpacing: "0.1em", textTransform: "uppercase" }}>Signal Coverage</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: totalConfigured > 0 ? "#f97316" : "#334155" }}>{totalConfigured}</span>
                          <span style={{ fontSize: 11, color: "#3d4f63" }}>signals configured</span>
                          <button onClick={() => setTab("docs")} style={{ padding: "3px 10px", borderRadius: 5, cursor: "pointer", background: "transparent", border: "1px solid #1e293b", color: "#475569", fontSize: 11 }}>Docs</button>
                        </div>
                      </div>
                      <div style={{ height: 3, background: "#0f1927", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, totalConfigured * 5)}%`, background: "linear-gradient(90deg, #f97316, #ef4444)", borderRadius: 99, transition: "width 0.5s ease", boxShadow: totalConfigured > 0 ? "0 0 8px rgba(249,115,22,0.5)" : "none" }} />
                      </div>
                      {totalConfigured === 0 && (
                        <p style={{ fontSize: 11, color: "#2d3748", margin: "8px 0 0", fontStyle: "italic" }}>Enter your brand name below to begin →</p>
                      )}
                    </div>
                  </div>

                  {/* Import/Export */}
                  <ImportExportBar getConfig={getConfig} loadConfig={loadConfig} />

                  <ScanSection title="Brand Identity" badge={(brand ? 1 : 0) + (industry ? 1 : 0) + stockTickers.length + legalEntities.length} defaultOpen>
                    <SimpleInput label="Primary brand name *" sublabel="Main organisation name — the core search term across all monitored sources" placeholder="e.g. Acme Corporation" value={brand} onChange={setBrand} />
                    <SimpleInput label="Industry / sector" sublabel="Improves correlation with sector-specific threat actor activity" placeholder="e.g. Financial Services, Healthcare, SaaS" value={industry} onChange={setIndustry} />
                    <ValidatedTagInput label="Stock ticker symbols" tags={stockTickers} onAdd={(v) => addTag(v, stockTickers, setStockTickers)} onRemove={(v) => removeTag(v, stockTickers, setStockTickers)} placeholder="e.g. ACME" validationType="ticker" />
                    <ValidatedTagInput label="Legal entity names" tags={legalEntities} onAdd={(v) => addTag(v, legalEntities, setLegalEntities)} onRemove={(v) => removeTag(v, legalEntities, setLegalEntities)} placeholder="e.g. Acme Holdings Ltd" />
                  </ScanSection>

                  <ScanSection title="Digital Infrastructure" badge={domains.length + emails.length + ips.length + asns.length + certs.length}>
                    <ValidatedTagInput label="Domains & subdomains" sublabel="Typosquatting, phishing kits, impersonation" placeholder="e.g. acme.com" tags={domains} onAdd={(v) => addTag(v, domains, setDomains)} onRemove={(v) => removeTag(v, domains, setDomains)} validationType="domain" />
                    <ValidatedTagInput label="Corporate email domains" sublabel="Credential leaks matching your email pattern" placeholder="e.g. @acme.com" tags={emails} onAdd={(v) => addTag(v, emails, setEmails)} onRemove={(v) => removeTag(v, emails, setEmails)} validationType="email" />
                    <ValidatedTagInput label="IP ranges / CIDR" placeholder="e.g. 203.0.113.0/24" tags={ips} onAdd={(v) => addTag(v, ips, setIps)} onRemove={(v) => removeTag(v, ips, setIps)} validationType="ip" />
                    <ValidatedTagInput label="ASN numbers" placeholder="e.g. AS12345" tags={asns} onAdd={(v) => addTag(v, asns, setAsns)} onRemove={(v) => removeTag(v, asns, setAsns)} validationType="asn" />
                    <ValidatedTagInput label="SSL certificate domains" placeholder="e.g. *.acme.com" tags={certs} onAdd={(v) => addTag(v, certs, setCerts)} onRemove={(v) => removeTag(v, certs, setCerts)} validationType="domain" />
                  </ScanSection>

                  <ScanSection title="People & Personnel" badge={vips.length + employees.length + contractors.length}>
                    <ValidatedTagInput label="Executives & VIPs" sublabel="Doxxing, credential, and physical threat monitoring" placeholder="e.g. Jane Smith, CEO" tags={vips} onAdd={(v) => addTag(v, vips, setVips)} onRemove={(v) => removeTag(v, vips, setVips)} tagColor="#ef4444" />
                    <ValidatedTagInput label="Key employees" placeholder="e.g. j.smith@acme.com" tags={employees} onAdd={(v) => addTag(v, employees, setEmployees)} onRemove={(v) => removeTag(v, employees, setEmployees)} />
                    <ValidatedTagInput label="Contractors & third parties" placeholder="e.g. Dev Agency XYZ" tags={contractors} onAdd={(v) => addTag(v, contractors, setContractors)} onRemove={(v) => removeTag(v, contractors, setContractors)} />
                  </ScanSection>

                  <ScanSection title="Products & Intellectual Property" badge={products.length + projects.length + trademarks.length + sourcePaths.length}>
                    <ValidatedTagInput label="Product names" placeholder="e.g. AcmePay" tags={products} onAdd={(v) => addTag(v, products, setProducts)} onRemove={(v) => removeTag(v, products, setProducts)} />
                    <ValidatedTagInput label="Internal project codenames" sublabel="Confidential names that should never appear externally" placeholder="e.g. Project Nighthawk" tags={projects} onAdd={(v) => addTag(v, projects, setProjects)} onRemove={(v) => removeTag(v, projects, setProjects)} />
                    <ValidatedTagInput label="Trademarks & patents" placeholder="e.g. AcmePay™" tags={trademarks} onAdd={(v) => addTag(v, trademarks, setTrademarks)} onRemove={(v) => removeTag(v, trademarks, setTrademarks)} />
                    <ValidatedTagInput label="Source code identifiers" placeholder="e.g. acme-internal-sdk" tags={sourcePaths} onAdd={(v) => addTag(v, sourcePaths, setSourcePaths)} onRemove={(v) => removeTag(v, sourcePaths, setSourcePaths)} />
                  </ScanSection>

                  <ScanSection title="Social Media & Brand Channels" badge={socials.length + appNames.length}>
                    <ValidatedTagInput label="Social media handles" placeholder="e.g. @acmecorp" tags={socials} onAdd={(v) => addTag(v, socials, setSocials)} onRemove={(v) => removeTag(v, socials, setSocials)} />
                    <ValidatedTagInput label="App & product names" placeholder="e.g. Acme Mobile" tags={appNames} onAdd={(v) => addTag(v, appNames, setAppNames)} onRemove={(v) => removeTag(v, appNames, setAppNames)} />
                  </ScanSection>

                  <ScanSection title="Supply Chain & Third-Party Risk" badge={suppliers.length + cloudServices.length}>
                    <ValidatedTagInput label="Key suppliers & vendors" placeholder="e.g. Vendor Corp" tags={suppliers} onAdd={(v) => addTag(v, suppliers, setSuppliers)} onRemove={(v) => removeTag(v, suppliers, setSuppliers)} />
                    <ValidatedTagInput label="Cloud services & SaaS" placeholder="e.g. GitHub org/acme" tags={cloudServices} onAdd={(v) => addTag(v, cloudServices, setCloudServices)} onRemove={(v) => removeTag(v, cloudServices, setCloudServices)} />
                  </ScanSection>

                  <ScanSection title="Keywords & Exclusions" badge={keywords.length + excludeKeywords.length}>
                    <ValidatedTagInput label="Monitor keywords" placeholder='"acme breach"' tags={keywords} onAdd={(v) => addTag(v, keywords, setKeywords)} onRemove={(v) => removeTag(v, keywords, setKeywords)} />
                    <ValidatedTagInput label="Exclusion keywords" sublabel="Suppress these terms to reduce false positives" placeholder='"acme cartoon"' tags={excludeKeywords} onAdd={(v) => addTag(v, excludeKeywords, setExcludeKeywords)} onRemove={(v) => removeTag(v, excludeKeywords, setExcludeKeywords)} tagColor="#64748b" />
                  </ScanSection>

                  <ScanSection title="Scan Configuration" defaultOpen>
                    <ToggleGroup
                      label="Source types to monitor"
                      sublabel="Select which darkweb and threat intelligence sources to include"
                      options={[
                        { value: "forums",   label: "Hacker Forums"    },
                        { value: "paste",    label: "Paste Sites"      },
                        { value: "markets",  label: "Marketplaces"     },
                        { value: "telegram", label: "Telegram"         },
                        { value: "irc",      label: "IRC"              },
                        { value: "combo",    label: "Combo Lists"      },
                        { value: "stealer",  label: "Stealer Logs"     },
                        { value: "ransom",   label: "Ransomware Blogs" },
                      ]}
                      selected={monitorSources}
                      onToggle={(v) => toggleArr(v, monitorSources, setMonitorSources)}
                    />
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>Alert channels</label>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>Enable channels to receive notifications when findings meet the minimum severity threshold.</p>
                      {CHANNEL_DEFS.map((ch) => (
                        <NotifChannelCard key={ch.id} ch={ch} active={alertChannels.includes(ch.id)} cfg={notifConfig[ch.id]} onToggle={() => toggleArr(ch.id, alertChannels, setAlertChannels)} onUpdate={(f, v) => updateNotif(ch.id, f, v)} tested={testedChannels[ch.id]} onTest={() => testChannel(ch.id)} />
                      ))}
                    </div>
                  </ScanSection>

                  <div style={{ height: 28 }} />

                  {/* Activate button */}
                  <div style={{ position: "relative" }}>
                    {brand.trim() && (
                      <div style={{ position: "absolute", inset: -2, borderRadius: 12, background: "linear-gradient(135deg, #f97316, #ef4444)", filter: "blur(18px)", opacity: 0.3, animation: "threatPulse 2.5s ease-in-out infinite", pointerEvents: "none" }} />
                    )}
                    <button
                      onClick={startMonitoring}
                      disabled={!brand.trim()}
                      aria-disabled={!brand.trim()}
                      style={{ position: "relative", width: "100%", padding: "17px 20px", borderRadius: 10, cursor: brand.trim() ? "pointer" : "not-allowed", background: brand.trim() ? "linear-gradient(135deg, #f97316 0%, #dc2626 100%)" : "#080c14", border: brand.trim() ? "1px solid rgba(249,115,22,0.4)" : "1px solid #141c28", color: brand.trim() ? "#fff" : "#2d3748", fontSize: 15, fontWeight: 800, letterSpacing: "0.02em", transition: "all 0.25s", boxShadow: brand.trim() ? "0 8px 32px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.12)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                    >
                      {brand.trim() ? (
                        <>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.85)", boxShadow: "0 0 8px #fff", animation: "blink 1.5s infinite", flexShrink: 0 }} />
                          Activate Monitoring — {totalConfigured} signal{totalConfigured !== 1 ? "s" : ""} configured
                        </>
                      ) : (
                        "Enter a brand name to begin"
                      )}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#1e2d3d", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                    Intelligence gathered for defensive purposes only · Results do not constitute legal evidence
                  </p>
                </div>
              )}

              {/* RESULTS */}
              {screen === "results" && (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.3px" }}>{brand || "Live Threat Feed"}</h1>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Cycle #{scanCycle} · {totalConfigured} signals · Last scan: {lastScanTime || "—"}</p>
                        <TrendSparkline history={threatHistory} />
                      </div>
                    </div>
                    <button onClick={() => setScreen("setup")} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", background: "#0d1117", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>⚙ Configure</button>
                  </div>

                  {isSweeping && (
                    <div style={{ marginBottom: 16, padding: "11px 16px", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "blink 0.6s infinite", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#fb923c", fontFamily: "'JetBrains Mono', monospace" }}>
                        <TerminalText text={scanPhase} key={scanPhase} speed={18} />
                      </span>
                    </div>
                  )}

                  {/* Risk card */}
                  <div style={{ padding: "20px 22px", background: `linear-gradient(135deg, ${risk.color}0c, ${risk.color}05)`, border: `1px solid ${risk.color}20`, borderLeft: `4px solid ${risk.color}`, borderRadius: 10, marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 38, fontWeight: 900, color: risk.color, lineHeight: 1, letterSpacing: "-1.5px" }}>{risk.score}</div>
                        <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.05em" }}>/ 10</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{risk.label}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{risk.sublabel}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[{ n: criticalCount, l: "Critical", c: "#ef4444" }, { n: highCount, l: "High", c: "#f97316" }, { n: mediumCount, l: "Medium", c: "#f59e0b" }].map((s) => (
                        <div key={s.l} style={{ textAlign: "center", padding: "8px 14px", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid #1e293b" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.n}</div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search + Sort + Filters */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      {/* Search */}
                      <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13, pointerEvents: "none" }}>⌕</span>
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search threats…"
                          aria-label="Search threats"
                          style={{ width: "100%", background: "#0d1117", border: "1px solid #1e293b", borderRadius: 7, padding: "7px 10px 7px 28px", color: "#f1f5f9", fontSize: 13 }}
                        />
                      </div>
                      {/* Sort */}
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        aria-label="Sort order"
                        style={{ padding: "7px 12px", borderRadius: 7, background: "#0d1117", border: "1px solid #1e293b", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="severity">Severity</option>
                      </select>
                    </div>
                    {/* Filters */}
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {FILTER_OPTIONS.map((f) => (
                        <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: activeFilter === f.id ? 600 : 400, background: activeFilter === f.id ? "rgba(249,115,22,0.12)" : "#0d1117", border: `1px solid ${activeFilter === f.id ? "rgba(249,115,22,0.35)" : "#1e293b"}`, color: activeFilter === f.id ? "#f97316" : "#64748b", transition: "all 0.15s" }}>
                          {f.label}{f.id === "all" && <span style={{ marginLeft: 5, fontSize: 11, color: "#334155" }}>{results.length}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feed */}
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>◎</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No threats in this filter</div>
                      <div style={{ fontSize: 13 }}>Try "All" or wait for the next scan cycle.</div>
                    </div>
                  ) : (
                    filtered.map((r) => (
                      <div key={r.uid} onClick={() => openThreatDetail(r)} style={{ cursor: "pointer" }}>
                        <ThreatCard result={r} entities={entities} isNew={newIds.has(r.uid)} />
                        {r.triageStatus && r.triageStatus !== "open" && (
                          <div style={{ marginTop: -10, marginBottom: 8, paddingLeft: 12 }}>
                            <TriageBadge status={r.triageStatus} />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
                    <button onClick={resetAll} style={{ flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", background: "#0d1117", border: "1px solid #1e293b", color: "#64748b", fontSize: 13, fontWeight: 500 }}>← Reset & reconfigure</button>
                    {!isMonitoring && <button onClick={startMonitoring} style={{ flex: 2, padding: "10px", borderRadius: 8, cursor: "pointer", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 13, fontWeight: 600 }}>▶ Resume monitoring</button>}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Threat detail modal */}
      {selectedThreat && (
        <ThreatDetailModal
          result={selectedThreat}
          onClose={() => setSelectedThreat(null)}
          onTriage={(uid, status) => {
            handleTriage(uid, status);
            setSelectedThreat((t) => t ? { ...t, triageStatus: status } : null);
          }}
        />
      )}

      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}
