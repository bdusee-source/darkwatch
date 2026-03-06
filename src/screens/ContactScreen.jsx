export function ContactScreen({ risk }) {
  const contacts = [
    { region: "United Kingdom",   phone: "+44 1235 443 500", hours: "24/7",          flag: "🇬🇧" },
    { region: "North America",    phone: "+1 888 767 4671",  hours: "24/7",          flag: "🇺🇸" },
    { region: "EMEA",             phone: "+49 721 255 16 0", hours: "24/7",          flag: "🇪🇺" },
    { region: "Asia Pacific",     phone: "+65 3157 5018",    hours: "24/7",          flag: "🇸🇬" },
    { region: "Australia / NZ",   phone: "+61 2 9409 9100",  hours: "Business hours", flag: "🇦🇺" },
  ];

  return (
    <div>
      {/* Alert banner */}
      {(risk.level === "CRITICAL" || risk.level === "HIGH") && (
        <div style={{ marginBottom: 18, padding: "12px 16px", background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.35)", borderRadius: 7, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff2d55", animation: "blink 0.7s infinite", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#ff2d55", letterSpacing: "0.1em" }}>⚑ {risk.level} RISK DETECTED — CONSIDER ENGAGING INCIDENT RESPONSE</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>Active threat signals warrant immediate escalation to your security team and Sophos IR.</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ff2d55", letterSpacing: "0.12em", marginBottom: 4 }}>⚑ SOPHOS MANAGED DETECTION & RESPONSE</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          If DARKWATCH detects an active breach or critical threat, contact Sophos Incident Response immediately. Available 24/7 globally.
        </div>
      </div>

      {/* Contact cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 22 }}>
        {contacts.map((c) => (
          <div key={c.region} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,45,85,0.05)", border: "1px solid rgba(255,45,85,0.15)", borderRadius: 7, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{c.flag}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{c.region}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{c.hours}</div>
              </div>
            </div>
            <a href={`tel:${c.phone.replace(/\s/g, "")}`} style={{ fontSize: 14, fontWeight: 800, color: "#ff2d55", textDecoration: "none", fontFamily: "monospace", letterSpacing: "0.06em" }}>{c.phone}</a>
          </div>
        ))}
      </div>

      {/* Sophos portal links */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 10 }}>◈ SOPHOS PORTALS & RESOURCES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Sophos Central — Management Console",  url: "https://central.sophos.com",                                                    desc: "Manage endpoints, policies, and threat response" },
            { label: "Sophos Incident Response Services",     url: "https://www.sophos.com/en-us/products/incident-response-services/emergency-response", desc: "24/7 emergency IR engagement" },
            { label: "Sophos X-Ops Threat Intelligence",     url: "https://www.sophos.com/en-us/threat-center",                                    desc: "Latest threat intelligence and advisories" },
            { label: "Sophos Support Portal",                 url: "https://support.sophos.com",                                                    desc: "Technical support and case management" },
          ].map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.15)", borderRadius: 6, textDecoration: "none" }}>
              <div>
                <div style={{ fontSize: 11, color: "#ff9500", fontWeight: 600 }}>{link.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{link.desc}</div>
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,149,0,0.5)", flexShrink: 0 }}>↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* IR checklist */}
      <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7 }}>
        <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 10 }}>◈ INCIDENT RESPONSE CHECKLIST</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            "Preserve all DARKWATCH findings — take screenshots or export the Operational Report",
            "Isolate affected systems immediately — do not power off (preserves forensic evidence)",
            "Notify your CISO and legal counsel before external communication",
            "Do NOT contact or negotiate with threat actors directly",
            "Call Sophos IR using the regional number above",
            "Assess regulatory notification obligations (e.g. GDPR 72-hour window)",
            "Brief your communications team — prepare internal and external messaging",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,45,85,0.15)", border: "1px solid rgba(255,45,85,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#ff2d55", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
