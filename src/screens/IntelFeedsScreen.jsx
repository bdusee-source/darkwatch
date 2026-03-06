const STATUS_COLOR = { fetching: "#ff9500", ok: "#30d158", error: "#ff2d55", auth_error: "#ff2d55" };
const STATUS_LABEL = { fetching: "FETCHING…", ok: "LIVE", error: "ERROR", auth_error: "AUTH ERROR" };

function FeedStatusBadge({ status }) {
  if (!status) return <span style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 3 }}>IDLE</span>;
  const color = STATUS_COLOR[status] || "#ff9500";
  return (
    <span style={{ fontSize: 8, color, background: `${color}18`, border: `1px solid ${color}33`, padding: "1px 7px", borderRadius: 3, letterSpacing: "0.08em", animation: status === "fetching" ? "blink 0.8s infinite" : "none" }}>
      {status === "ok" ? "◉ " : ""}{STATUS_LABEL[status] || status.toUpperCase()}
    </span>
  );
}

function FeedCard({ id, label, description, docsUrl, config, onUpdate, status, children }) {
  const active = config.enabled;
  return (
    <div style={{ marginBottom: 8, border: `1px solid ${active ? "rgba(48,209,88,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, overflow: "hidden", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: active ? "rgba(48,209,88,0.04)" : "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div onClick={() => onUpdate(id, "enabled", !active)} style={{ width: 32, height: 18, borderRadius: 9, background: active ? "#30d158" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: active ? 17 : 3, transition: "left 0.2s" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.7)" }}>{label}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{description}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FeedStatusBadge status={status} />
          {docsUrl && <a href={docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: "rgba(255,149,0,0.6)", textDecoration: "none" }}>Docs ↗</a>}
        </div>
      </div>
      {active && children && (
        <div style={{ padding: "12px 14px 6px", borderTop: "1px solid rgba(48,209,88,0.1)", background: "rgba(0,0,0,0.1)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ApiKeyInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
      <input
        type="password"
        placeholder={placeholder || "Enter API key…"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "7px 10px", color: "#fff", fontSize: 11, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
      />
    </div>
  );
}

export function IntelFeedsScreen({ intelConfig, updateIntel, paidFeedConfig, updatePaidFeed, intelResults, intelStatus, brand, domains }) {
  const liveCount = intelResults.filter((r) => r.real).length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ff9500", letterSpacing: "0.12em", marginBottom: 4 }}>◈ THREAT INTELLIGENCE FEEDS</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          Configure live API integrations. Open-source feeds query live APIs each scan cycle. Commercial feeds require a backend integration.
          {liveCount > 0 && <span style={{ color: "#30d158", marginLeft: 8 }}>◉ {liveCount} live finding{liveCount !== 1 ? "s" : ""} in current session</span>}
        </div>
      </div>

      {/* CORS warning */}
      <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.2)", borderRadius: 6 }}>
        <div style={{ fontSize: 9, color: "#ff9500", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>⚠ BROWSER DEPLOYMENT NOTE</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          URLhaus and OTX work directly in the browser. HIBP and PhishTank require a server-side proxy when deployed to GitHub Pages due to CORS restrictions. See README for proxy setup.
        </div>
      </div>

      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", marginBottom: 8 }}>OPEN SOURCE FEEDS (LIVE API)</div>

      <FeedCard id="urlhaus" label="URLhaus (abuse.ch)" description="Malicious URL & malware distribution feed" docsUrl="https://urlhaus-api.abuse.ch" config={intelConfig.urlhaus} onUpdate={updateIntel} status={intelStatus.urlhaus}>
        <div style={{ fontSize: 10, color: "rgba(48,209,88,0.7)", marginBottom: 8 }}>✓ No API key required — publicly accessible</div>
      </FeedCard>

      <FeedCard id="otx" label="AlienVault OTX" description="Open Threat Exchange — domain & IP indicators" docsUrl="https://otx.alienvault.com/api" config={intelConfig.otx} onUpdate={updateIntel} status={intelStatus.otx}>
        <ApiKeyInput label="OTX API KEY (optional — increases rate limits)" value={intelConfig.otx.apiKey || ""} onChange={(v) => updateIntel("otx", "apiKey", v)} placeholder="Optional — works without key" />
      </FeedCard>

      <FeedCard id="phishtank" label="PhishTank" description="Community-verified phishing URL database" docsUrl="https://www.phishtank.com/developer_info.php" config={intelConfig.phishtank} onUpdate={updateIntel} status={intelStatus.phishtank}>
        <ApiKeyInput label="PHISHTANK APP KEY (optional)" value={intelConfig.phishtank.apiKey || ""} onChange={(v) => updateIntel("phishtank", "apiKey", v)} placeholder="Optional — higher rate limits with key" />
        <div style={{ fontSize: 9, color: "rgba(255,149,0,0.65)", marginBottom: 8 }}>⚠ May be blocked by CORS on GitHub Pages — works in development</div>
      </FeedCard>

      <FeedCard id="hibp" label="HaveIBeenPwned" description="Corporate email breach & stealer log detection" docsUrl="https://haveibeenpwned.com/API/v3" config={intelConfig.hibp} onUpdate={updateIntel} status={intelStatus.hibp}>
        <ApiKeyInput label="HIBP API KEY (required for domain search)" value={intelConfig.hibp.apiKey || ""} onChange={(v) => updateIntel("hibp", "apiKey", v)} placeholder="Paid API key from haveibeenpwned.com" />
        <div style={{ fontSize: 9, color: "rgba(255,149,0,0.65)", marginBottom: 8 }}>⚠ Requires server-side proxy on GitHub Pages — API key must not be exposed in browser</div>
      </FeedCard>

      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", marginBottom: 8, marginTop: 20 }}>COMMERCIAL FEEDS (BACKEND REQUIRED)</div>

      {[
        { id: "recordedFuture", label: "Recorded Future",  desc: "Enterprise threat intelligence platform",    docsUrl: "https://api.recordedfuture.com", fields: [{ key: "apiKey", label: "API KEY" }] },
        { id: "darkOwl",        label: "DarkOwl Vision",   desc: "Darkweb data & darknet monitoring platform",  docsUrl: "https://www.darkowl.com/products/darknet-data-platform", fields: [{ key: "apiKey", label: "API KEY" }, { key: "apiSecret", label: "API SECRET" }] },
        { id: "flare",          label: "Flare",             desc: "Threat exposure management",                  docsUrl: "https://docs.flare.io", fields: [{ key: "apiKey", label: "API KEY" }, { key: "tenantId", label: "TENANT ID" }] },
        { id: "intel471",       label: "Intel 471",         desc: "Cybercriminal intelligence",                  docsUrl: "https://intel471.com/solutions/api", fields: [{ key: "apiKey", label: "API KEY" }, { key: "apiSecret", label: "API SECRET" }] },
        { id: "cybersixgill",   label: "Cybersixgill",      desc: "Darkweb threat intelligence automation",      docsUrl: "https://www.cybersixgill.com/platform/api", fields: [{ key: "clientId", label: "CLIENT ID" }, { key: "clientSecret", label: "CLIENT SECRET" }] },
      ].map((feed) => (
        <FeedCard key={feed.id} id={feed.id} label={feed.label} description={feed.desc} docsUrl={feed.docsUrl} config={paidFeedConfig[feed.id]} onUpdate={updatePaidFeed} status={null}>
          {feed.fields.map((f) => (
            <ApiKeyInput key={f.key} label={f.label} value={paidFeedConfig[feed.id][f.key] || ""} onChange={(v) => updatePaidFeed(feed.id, f.key, v)} />
          ))}
          <div style={{ marginBottom: 8, padding: "7px 10px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.13)", borderRadius: 4 }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)" }}>Credentials stored for backend integration only. A proxy API is required to call this feed.</div>
          </div>
        </FeedCard>
      ))}
    </div>
  );
}
