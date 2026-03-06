import { useState, useCallback } from "react";

/**
 * Custom hook encapsulating all live threat intelligence API fetches.
 * Manages per-source status and returns a unified fetch function.
 */
export function useIntelFeeds(intelConfig, brand, domains) {
  const [intelStatus, setIntelStatus] = useState({});
  const [intelResults, setIntelResults] = useState([]);

  const setStatus = (src, status) =>
    setIntelStatus((prev) => ({ ...prev, [src]: status }));

  const fetchURLhaus = useCallback(async (domain) => {
    if (!domain) return [];
    try {
      setStatus("urlhaus", "fetching");
      const res = await fetch("https://urlhaus-api.abuse.ch/v1/host/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `host=${encodeURIComponent(domain)}`,
      });
      const data = await res.json();
      setStatus("urlhaus", "ok");
      if (data.query_status === "no_results") return [];
      return (data.urls || []).slice(0, 8).map((u, i) => ({
        uid: `urlhaus-${domain}-${i}-${Date.now()}`,
        type: u.tags?.includes("phishing") ? "phishing" : "exploit",
        severity: u.threat === "malware_download" ? "high" : "medium",
        source: "URLhaus (abuse.ch)",
        content: `Malicious URL associated with ${domain} detected. Threat: ${u.threat || "malware"}. URL status: ${u.url_status}. Added: ${u.date_added?.split(" ")[0] || "unknown"}.`,
        tor: u.url?.slice(0, 50) + "…",
        detectedAt: u.date_added ? new Date(u.date_added).getTime() : Date.now(),
        real: true,
        feedSource: "URLhaus",
        contextUrl: `https://urlhaus.abuse.ch/url/${u.id}/`,
      }));
    } catch {
      setStatus("urlhaus", "error");
      return [];
    }
  }, []);

  const fetchPhishTank = useCallback(
    async (domain) => {
      if (!domain) return [];
      try {
        setStatus("phishtank", "fetching");
        const apiKey = intelConfig.phishtank.apiKey;
        const body = `url=${encodeURIComponent("http://" + domain)}&format=json${apiKey ? `&app_key=${apiKey}` : ""}`;
        const res = await fetch("https://checkurl.phishtank.com/checkurl/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "phishtank/DARKWATCH",
          },
          body,
        });
        const data = await res.json();
        setStatus("phishtank", "ok");
        if (!data.results?.in_database || !data.results.valid) return [];
        return [
          {
            uid: `phishtank-${domain}-${Date.now()}`,
            type: "phishing",
            severity: "critical",
            source: "PhishTank",
            content: `Domain ${domain} confirmed as an active phishing site in the PhishTank database. Verified: ${data.results.verified ? "Yes" : "Pending"}. Phish ID: ${data.results.phish_id}.`,
            tor: `phishtank.com/phish/${data.results.phish_id}`,
            detectedAt: data.results.verified_at
              ? new Date(data.results.verified_at).getTime()
              : Date.now(),
            real: true,
            feedSource: "PhishTank",
            contextUrl: data.results.phish_detail_page || "https://www.phishtank.com",
          },
        ];
      } catch {
        setStatus("phishtank", "error");
        return [];
      }
    },
    [intelConfig.phishtank.apiKey]
  );

  const fetchOTX = useCallback(
    async (domain) => {
      if (!domain) return [];
      try {
        setStatus("otx", "fetching");
        const apiKey = intelConfig.otx.apiKey;
        const headers = apiKey ? { "X-OTX-API-KEY": apiKey } : {};
        const res = await fetch(
          `https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(domain)}/general`,
          { headers }
        );
        const data = await res.json();
        setStatus("otx", "ok");
        const findings = [];
        if (data.pulse_info?.count > 0) {
          (data.pulse_info?.pulses || []).slice(0, 5).forEach((pulse, i) => {
            findings.push({
              uid: `otx-${domain}-${i}-${Date.now()}`,
              type: pulse.tags?.some((t) => ["phishing", "malware"].includes(t))
                ? "phishing"
                : "mention",
              severity: data.pulse_info.count > 10 ? "high" : "medium",
              source: "AlienVault OTX",
              content: `Domain ${domain} flagged in OTX pulse: "${pulse.name}". Referenced in ${data.pulse_info.count} threat intelligence pulse${data.pulse_info.count > 1 ? "s" : ""}. Tags: ${(pulse.tags || []).slice(0, 4).join(", ") || "none"}.`,
              tor: `otx.alienvault.com/indicator/domain/${domain}`,
              detectedAt: pulse.created ? new Date(pulse.created).getTime() : Date.now(),
              real: true,
              feedSource: "AlienVault OTX",
              contextUrl: `https://otx.alienvault.com/indicator/domain/${domain}`,
            });
          });
        }
        if (data.validation?.some((v) => v.source === "Google Safe Browsing")) {
          findings.push({
            uid: `otx-gsb-${domain}-${Date.now()}`,
            type: "phishing",
            severity: "high",
            source: "AlienVault OTX / Google Safe Browsing",
            content: `Domain ${domain} flagged by Google Safe Browsing via OTX validation.`,
            tor: `otx.alienvault.com/indicator/domain/${domain}`,
            detectedAt: Date.now(),
            real: true,
            feedSource: "AlienVault OTX",
            contextUrl: `https://otx.alienvault.com/indicator/domain/${domain}`,
          });
        }
        return findings;
      } catch {
        setStatus("otx", "error");
        return [];
      }
    },
    [intelConfig.otx.apiKey]
  );

  const fetchHIBP = useCallback(
    async (domain) => {
      if (!domain || !intelConfig.hibp.apiKey) return [];
      try {
        setStatus("hibp", "fetching");
        const res = await fetch(
          `https://haveibeenpwned.com/api/v3/breacheddomain/${encodeURIComponent(domain)}`,
          {
            headers: {
              "hibp-api-key": intelConfig.hibp.apiKey,
              "User-Agent": "DARKWATCH-Intelligence-Enterprise",
            },
          }
        );
        if (res.status === 404) { setStatus("hibp", "ok"); return []; }
        if (res.status === 401) { setStatus("hibp", "auth_error"); return []; }
        const data = await res.json();
        setStatus("hibp", "ok");
        return Object.entries(data)
          .slice(0, 6)
          .map(([email, breaches], i) => ({
            uid: `hibp-${domain}-${i}-${Date.now()}`,
            type: "credential",
            severity: breaches.length > 3 ? "critical" : "high",
            source: "HaveIBeenPwned",
            content: `Corporate email ${email} found in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}: ${breaches.slice(0, 3).join(", ")}${breaches.length > 3 ? ` +${breaches.length - 3} more` : ""}. Immediate credential reset recommended.`,
            tor: `haveibeenpwned.com/domain/${domain}`,
            detectedAt: Date.now() - i * 60000,
            real: true,
            feedSource: "HaveIBeenPwned",
            contextUrl: "https://haveibeenpwned.com/DomainSearch",
          }));
      } catch {
        setStatus("hibp", "error");
        return [];
      }
    },
    [intelConfig.hibp.apiKey]
  );

  const runAllFeeds = useCallback(async () => {
    const targetDomain =
      domains[0] ||
      (brand ? brand.toLowerCase().replace(/\s+/g, "") + ".com" : null);
    if (!targetDomain) return [];

    const fetches = [];
    if (intelConfig.urlhaus.enabled)   fetches.push(fetchURLhaus(targetDomain));
    if (intelConfig.phishtank.enabled) fetches.push(fetchPhishTank(targetDomain));
    if (intelConfig.otx.enabled)       fetches.push(fetchOTX(targetDomain));
    if (intelConfig.hibp.enabled)      fetches.push(fetchHIBP(targetDomain));

    const settled = await Promise.allSettled(fetches);
    const results = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    setIntelResults(results);
    return results;
  }, [brand, domains, intelConfig, fetchURLhaus, fetchPhishTank, fetchOTX, fetchHIBP]);

  return { intelStatus, intelResults, runAllFeeds };
}
