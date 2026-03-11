/**
 * useIntelFeeds.js
 *
 * Calls the Vercel proxy functions for all configured intel feeds and normalises
 * results into the standard DARKWATCH threat object shape:
 *
 * {
 *   uid:         string   — unique ID for deduplication
 *   title:       string   — short human-readable summary
 *   description: string   — full detail
 *   severity:    "critical" | "high" | "medium" | "low"
 *   type:        "credential" | "data_leak" | "phishing" | "mention" | "exploit"
 *   source:      string   — feed name
 *   timestamp:   string   — ISO date string
 *   raw:         object   — original API response object for reference
 * }
 */

import { useState, useCallback, useRef } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix, value) {
  return `${prefix}_${btoa(String(value)).replace(/[^a-z0-9]/gi, "").slice(0, 16)}`;
}

function severityFromScore(score, thresholds = [9, 7, 4]) {
  if (score >= thresholds[0]) return "critical";
  if (score >= thresholds[1]) return "high";
  if (score >= thresholds[2]) return "medium";
  return "low";
}

function now() {
  return new Date().toISOString();
}

async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

// ─── Normalisers ──────────────────────────────────────────────────────────────

/**
 * HIBP breach object → DARKWATCH threat
 */
function normaliseHibpBreach(breach, matchedEmail) {
  const hasPwds   = breach.DataClasses?.includes("Passwords");
  const severity  = breach.IsSensitive || hasPwds ? "critical" : breach.IsVerified ? "high" : "medium";
  return {
    uid:         uid("hibp", breach.Name),
    title:       `Credential breach: ${breach.Name}`,
    description: `${breach.Description?.replace(/<[^>]+>/g, "") || "No description."} Affected data: ${(breach.DataClasses || []).join(", ")}.`,
    severity,
    type:        "credential",
    source:      "Have I Been Pwned",
    timestamp:   breach.BreachDate ? new Date(breach.BreachDate).toISOString() : now(),
    raw:         breach,
    matchedOn:   matchedEmail,
  };
}

/**
 * HIBP paste object → DARKWATCH threat
 */
function normaliseHibpPaste(paste, matchedEmail) {
  return {
    uid:         uid("hibp_paste", paste.Id),
    title:       `Paste site exposure: ${paste.Source || "Unknown source"}`,
    description: `Email ${matchedEmail} appeared in a paste on ${paste.Source}. Title: ${paste.Title || "n/a"}. Estimated ${paste.EmailCount || "unknown"} emails in paste.`,
    severity:    "high",
    type:        "data_leak",
    source:      "Have I Been Pwned",
    timestamp:   paste.Date ? new Date(paste.Date).toISOString() : now(),
    raw:         paste,
    matchedOn:   matchedEmail,
  };
}

/**
 * OTX pulse → DARKWATCH threat
 */
function normaliseOtxPulse(pulse) {
  const indicatorCount = pulse.indicators?.length || 0;
  const severity = severityFromScore(Math.min(10, indicatorCount / 2), [8, 5, 2]);
  return {
    uid:         uid("otx", pulse.id),
    title:       `OTX Pulse: ${pulse.name}`,
    description: `${pulse.description || "No description."} Tags: ${(pulse.tags || []).join(", ") || "none"}. Indicators: ${indicatorCount}.`,
    severity,
    type:        "mention",
    source:      "AlienVault OTX",
    timestamp:   pulse.created ? new Date(pulse.created).toISOString() : now(),
    raw:         pulse,
  };
}

/**
 * OTX domain/IP general indicator → DARKWATCH threat
 */
function normaliseOtxIndicator(data, value) {
  const score    = data.reputation || 0;
  const severity = severityFromScore(Math.abs(score), [8, 5, 2]);
  const pulseCount = data.pulse_info?.count || 0;
  if (pulseCount === 0 && score >= 0) return null; // clean indicator
  return {
    uid:         uid("otx_ind", value),
    title:       `Malicious indicator: ${value}`,
    description: `${value} appears in ${pulseCount} OTX pulse${pulseCount !== 1 ? "s" : ""}. Reputation score: ${score}.`,
    severity,
    type:        "exploit",
    source:      "AlienVault OTX",
    timestamp:   now(),
    raw:         data,
    matchedOn:   value,
  };
}

/**
 * URLhaus URL entry → DARKWATCH threat
 */
function normaliseUrlhaus(entry) {
  const isOnline  = entry.url_status === "online";
  const severity  = isOnline ? "critical" : "high";
  return {
    uid:         uid("urlhaus", entry.id || entry.url),
    title:       `Malicious URL: ${entry.url?.slice(0, 80)}`,
    description: `URLhaus listed this URL as ${entry.url_status}. Threat type: ${entry.threat || "unknown"}. Tags: ${(entry.tags || []).join(", ") || "none"}.`,
    severity,
    type:        "phishing",
    source:      "URLhaus",
    timestamp:   entry.date_added ? new Date(entry.date_added).toISOString() : now(),
    raw:         entry,
  };
}

/**
 * PhishTank result → DARKWATCH threat (only if phishing confirmed)
 */
function normalisePhishtank(data, checkedUrl) {
  if (!data?.results?.in_database) return null;
  if (!data.results.valid) return null;
  return {
    uid:         uid("phish", data.results.phish_id || checkedUrl),
    title:       `Phishing URL confirmed: ${checkedUrl.slice(0, 80)}`,
    description: `PhishTank has verified this URL as a phishing page. Submitted: ${data.results.submission_time || "unknown"}. Verified: ${data.results.verification_time || "unknown"}.`,
    severity:    "critical",
    type:        "phishing",
    source:      "PhishTank",
    timestamp:   data.results.submission_time
      ? new Date(data.results.submission_time).toISOString()
      : now(),
    raw:         data.results,
    matchedOn:   checkedUrl,
  };
}

/**
 * Flare activity → DARKWATCH threat
 */
function normaliseFlare(item) {
  const typeMap = {
    credential:   "credential",
    leak:         "data_leak",
    threat_actor: "mention",
    ransomware:   "exploit",
    phishing:     "phishing",
  };
  const severityMap = {
    critical: "critical",
    high:     "high",
    medium:   "medium",
    low:      "low",
  };
  return {
    uid:         uid("flare", item.id || item.uid || JSON.stringify(item).slice(0, 40)),
    title:       item.title || item.name || "Flare dark web finding",
    description: item.description || item.summary || item.content || "No detail available.",
    severity:    severityMap[item.severity?.toLowerCase()] || "high",
    type:        typeMap[item.type?.toLowerCase()] || "mention",
    source:      `Flare · ${item.source || item.platform || "dark web"}`,
    timestamp:   item.created_at || item.date || now(),
    raw:         item,
  };
}

/**
 * DarkOwl result → DARKWATCH threat
 */
function normaliseDarkowl(item) {
  const scoreMap = { critical: "critical", high: "high", medium: "medium", low: "low" };
  return {
    uid:         uid("darkowl", item.id || item.doc_id || JSON.stringify(item).slice(0, 40)),
    title:       item.title || `Dark web document: ${item.site || "unknown source"}`,
    description: item.content?.slice(0, 400) || item.snippet || "No content preview available.",
    severity:    scoreMap[item.risk_level?.toLowerCase()] || "high",
    type:        item.type === "credential" ? "credential" : item.type === "leak" ? "data_leak" : "mention",
    source:      `DarkOwl · ${item.site || item.network || "dark web"}`,
    timestamp:   item.date || item.created_at || now(),
    raw:         item,
  };
}

/**
 * Cybersixgill alert → DARKWATCH threat
 */
function normaliseCybersixgill(item) {
  const sevMap = { 3: "critical", 2: "high", 1: "medium", 0: "low" };
  return {
    uid:         uid("c6g", item._id || item.id || JSON.stringify(item).slice(0, 40)),
    title:       item.title || item.name || "Cybersixgill alert",
    description: item.content || item.description || item.snippet || "No detail available.",
    severity:    sevMap[item.severity] || "high",
    type:        item.type === "credentials" ? "credential"
               : item.type === "leaked_data"  ? "data_leak"
               : item.type === "phishing"      ? "phishing"
               : "mention",
    source:      `Cybersixgill · ${item.site || item.source || "dark web"}`,
    timestamp:   item.date || item.created || now(),
    raw:         item,
  };
}

// ─── Per-feed query functions ─────────────────────────────────────────────────

async function queryHibp(config, brand, domains, emails) {
  if (!config?.enabled || !config?.apiKey) return [];
  const results = [];

  // Check domain breaches
  for (const domain of domains.slice(0, 5)) {
    try {
      const data = await apiFetch(`/api/hibp?type=domain&domain=${encodeURIComponent(domain)}`);
      if (Array.isArray(data)) {
        data.forEach((b) => results.push(normaliseHibpBreach(b, domain)));
      }
    } catch (e) { console.warn("[hibp domain]", e.message); }
  }

  // Check known email patterns derived from domains
  for (const domain of domains.slice(0, 2)) {
    const sampleEmail = `admin@${domain.replace(/^@/, "")}`;
    try {
      const [breaches, pastes] = await Promise.all([
        apiFetch(`/api/hibp?type=breach&account=${encodeURIComponent(sampleEmail)}`),
        apiFetch(`/api/hibp?type=paste&account=${encodeURIComponent(sampleEmail)}`),
      ]);
      if (Array.isArray(breaches)) breaches.forEach((b) => results.push(normaliseHibpBreach(b, sampleEmail)));
      if (Array.isArray(pastes))   pastes.forEach((p)   => results.push(normaliseHibpPaste(p, sampleEmail)));
    } catch (e) { console.warn("[hibp email]", e.message); }
  }

  return results;
}

async function queryOtx(config, brand, domains, ips) {
  if (!config?.enabled || !config?.apiKey) return [];
  const results = [];

  // Search for brand-related pulses
  try {
    const data = await apiFetch(`/api/otx?type=search&q=${encodeURIComponent(brand)}&limit=15`);
    if (data?.results) data.results.forEach((p) => results.push(normaliseOtxPulse(p)));
  } catch (e) { console.warn("[otx search]", e.message); }

  // Check each domain
  for (const domain of domains.slice(0, 5)) {
    try {
      const data = await apiFetch(`/api/otx?type=domain&value=${encodeURIComponent(domain)}`);
      const threat = normaliseOtxIndicator(data, domain);
      if (threat) results.push(threat);
    } catch (e) { console.warn("[otx domain]", e.message); }
  }

  // Check each IP
  for (const ip of ips.slice(0, 3)) {
    const cleanIp = ip.split("/")[0]; // strip CIDR
    try {
      const data = await apiFetch(`/api/otx?type=ip&value=${encodeURIComponent(cleanIp)}`);
      const threat = normaliseOtxIndicator(data, cleanIp);
      if (threat) results.push(threat);
    } catch (e) { console.warn("[otx ip]", e.message); }
  }

  return results;
}

async function queryUrlhaus(config, domains) {
  if (!config?.enabled) return [];
  const results = [];

  for (const domain of domains.slice(0, 8)) {
    try {
      const data = await apiFetch(`/api/urlhaus?type=host&value=${encodeURIComponent(domain)}`);
      if (data?.query_status === "is_host" && Array.isArray(data.urls)) {
        data.urls
          .filter((u) => u.url_status !== "offline")
          .forEach((u) => results.push(normaliseUrlhaus(u)));
      }
    } catch (e) { console.warn("[urlhaus]", e.message); }
  }

  return results;
}

async function queryPhishtank(config, domains) {
  if (!config?.enabled) return [];
  const results = [];

  for (const domain of domains.slice(0, 5)) {
    const testUrl = `https://${domain.replace(/^\*\./, "")}`;
    try {
      const data  = await apiFetch(`/api/phishtank?url=${encodeURIComponent(testUrl)}`);
      const threat = normalisePhishtank(data, testUrl);
      if (threat) results.push(threat);
    } catch (e) { console.warn("[phishtank]", e.message); }
  }

  return results;
}

async function queryFlare(config, brand, domains, keywords) {
  if (!config?.enabled || !config?.apiKey) return [];
  const results = [];
  const queries = [brand, ...domains.slice(0, 2), ...keywords.slice(0, 2)].filter(Boolean);

  for (const q of queries) {
    try {
      const data = await apiFetch(`/api/flare?type=search&q=${encodeURIComponent(q)}&size=10`);
      const items = data?.items || data?.results || data?.data || [];
      items.forEach((item) => results.push(normaliseFlare(item)));
    } catch (e) { console.warn("[flare search]", e.message); }
  }

  // Also pull latest alerts
  try {
    const alertData = await apiFetch("/api/flare?type=alerts&size=10");
    const alerts = alertData?.items || alertData?.results || alertData?.data || [];
    alerts.forEach((item) => results.push(normaliseFlare(item)));
  } catch (e) { console.warn("[flare alerts]", e.message); }

  return results;
}

async function queryDarkowl(config, brand, domains, keywords) {
  if (!config?.enabled || !config?.apiKey) return [];
  const results = [];
  const queries = [brand, ...domains.slice(0, 2), ...keywords.slice(0, 2)].filter(Boolean);

  for (const q of queries) {
    try {
      const data = await apiFetch(`/api/darkowl?type=search&q=${encodeURIComponent(q)}&limit=10`);
      const items = data?.content || data?.results || data?.documents || [];
      items.forEach((item) => results.push(normaliseDarkowl(item)));
    } catch (e) { console.warn("[darkowl]", e.message); }
  }

  return results;
}

async function queryCybersixgill(config, brand, domains, keywords) {
  if (!config?.enabled || !config?.clientId || !config?.clientSecret) return [];
  const results = [];

  // Fetch org alerts
  try {
    const data  = await apiFetch("/api/cybersixgill?type=alerts&limit=20");
    const items = data?.alerts || data?.results || data?.data || [];
    items.forEach((item) => results.push(normaliseCybersixgill(item)));
  } catch (e) { console.warn("[c6g alerts]", e.message); }

  // Search for brand + key domains
  const queries = [brand, ...domains.slice(0, 2), ...keywords.slice(0, 1)].filter(Boolean);
  for (const q of queries) {
    try {
      const data  = await apiFetch(`/api/cybersixgill?type=search&q=${encodeURIComponent(q)}&limit=10`);
      const items = data?.results || data?.data || data?.items || [];
      items.forEach((item) => results.push(normaliseCybersixgill(item)));
    } catch (e) { console.warn("[c6g search]", e.message); }
  }

  return results;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedup(results) {
  const seen = new Set();
  return results.filter((r) => {
    if (seen.has(r.uid)) return false;
    seen.add(r.uid);
    return true;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntelFeeds(intelConfig, paidFeedConfig, brand, domains = [], ips = [], keywords = []) {
  const [intelResults, setIntelResults] = useState([]);
  const [intelStatus,  setIntelStatus]  = useState({});
  const runningRef = useRef(false);

  const runAllFeeds = useCallback(async () => {
    if (!brand || runningRef.current) return [];
    runningRef.current = true;

    const setStatus = (feed, status) =>
      setIntelStatus((p) => ({ ...p, [feed]: status }));

    // Mark all enabled feeds as running
    const feeds = [
      { id: "hibp",          enabled: intelConfig?.hibp?.enabled },
      { id: "otx",           enabled: intelConfig?.otx?.enabled },
      { id: "urlhaus",       enabled: intelConfig?.urlhaus?.enabled },
      { id: "phishtank",     enabled: intelConfig?.phishtank?.enabled },
      { id: "flare",         enabled: paidFeedConfig?.flare?.enabled },
      { id: "darkowl",       enabled: paidFeedConfig?.darkOwl?.enabled },
      { id: "cybersixgill",  enabled: paidFeedConfig?.cybersixgill?.enabled },
    ];
    feeds.filter((f) => f.enabled).forEach((f) => setStatus(f.id, "running"));

    // Run all feeds in parallel
    const [
      hibpResults,
      otxResults,
      urlhausResults,
      phishtankResults,
      flareResults,
      darkowlResults,
      c6gResults,
    ] = await Promise.allSettled([
      queryHibp(intelConfig?.hibp, brand, domains, []),
      queryOtx(intelConfig?.otx, brand, domains, ips),
      queryUrlhaus(intelConfig?.urlhaus, domains),
      queryPhishtank(intelConfig?.phishtank, domains),
      queryFlare(paidFeedConfig?.flare, brand, domains, keywords),
      queryDarkowl(paidFeedConfig?.darkOwl, brand, domains, keywords),
      queryCybersixgill(paidFeedConfig?.cybersixgill, brand, domains, keywords),
    ]);

    // Collect results and update statuses
    const allResults = [];
    const feedKeys   = ["hibp", "otx", "urlhaus", "phishtank", "flare", "darkowl", "cybersixgill"];
    const settled    = [hibpResults, otxResults, urlhausResults, phishtankResults, flareResults, darkowlResults, c6gResults];

    settled.forEach((result, i) => {
      const key = feedKeys[i];
      if (result.status === "fulfilled") {
        const items = result.value || [];
        allResults.push(...items);
        setStatus(key, `ok:${items.length}`);
      } else {
        console.error(`[useIntelFeeds] ${key} failed:`, result.reason);
        setStatus(key, "error");
      }
    });

    const dedupedResults = dedup(allResults);
    setIntelResults(dedupedResults);
    runningRef.current = false;
    // Return findings so useScanEngine can merge them with simulated results
    return dedupedResults;
  }, [intelConfig, paidFeedConfig, brand, domains, ips, keywords]);

  return { intelResults, intelStatus, runAllFeeds };
}
