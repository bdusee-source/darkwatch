import { useState } from "react";
import { SEVERITY_CONFIG, THREAT_TYPES, THREAT_CONTEXT } from "../data/constants";
import { timeAgo, interpolateContent } from "../utils/helpers";

function ContextModal({ result, entities, onClose }) {
  const sev  = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const type = THREAT_TYPES[result.type] || { label: result.type, color: "#ff9500" };
  const ctx  = THREAT_CONTEXT[result.type] || THREAT_CONTEXT.mention;
  const content = interpolateContent(result.content, entities);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 620, maxHeight: "85vh", overflowY: "auto", background: "#0d0f14", border: `1px solid ${sev.color}44`, borderTop: `3px solid ${sev.color}`, borderRadius: 10, boxShadow: `0 0 60px ${sev.color}22` }}
      >
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
          {/* Finding detail */}
          <div style={{ marginBottom: 18, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7 }}>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 6 }}>◈ FINDING DETAIL</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, margin: 0 }}>{content}</p>
          </div>

          {/* Urgency */}
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

          {/* Response actions */}
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

          {/* Resources */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,149,0,0.7)", letterSpacing: "0.13em", marginBottom: 8 }}>◈ EXTERNAL RESOURCES & REPORTING LINKS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ctx.resources.map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.18)", borderRadius: 5, textDecoration: "none" }}>
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

export function ThreatCard({ result, entities, isNew }) {
  const [showContext, setShowContext] = useState(false);
  const sev     = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const type    = THREAT_TYPES[result.type] || { label: result.type, color: "#ff9500" };
  const content = interpolateContent(result.content, entities);

  return (
    <>
      {showContext && <ContextModal result={result} entities={entities} onClose={() => setShowContext(false)} />}
      <div style={{
        background: sev.bg,
        border: `1px solid ${sev.color}33`,
        borderLeft: `3px solid ${sev.color}`,
        borderRadius: 6,
        padding: "14px 16px",
        marginBottom: 8,
        position: "relative",
        animation: isNew
          ? "slideIn 0.4s ease, threatPulse 3s ease-in-out infinite"
          : result.severity === "critical"
          ? "threatPulse 3s ease-in-out infinite"
          : "none",
      }}>
        {isNew && (
          <span style={{ position: "absolute", top: 8, right: 10, fontSize: 8, color: sev.color, background: `${sev.color}22`, padding: "1px 6px", borderRadius: 3, letterSpacing: "0.1em", animation: "blink 1.5s infinite" }}>NEW</span>
        )}
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
            {result.real && result.contextUrl ? (
              <a href={result.contextUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "3px 10px", borderRadius: 4, background: `${sev.color}15`, border: `1px solid ${sev.color}44`, color: sev.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textDecoration: "none", flexShrink: 0 }}>◎ VIEW SOURCE ↗</a>
            ) : (
              <button onClick={() => setShowContext(true)} style={{ padding: "3px 10px", borderRadius: 4, cursor: "pointer", background: `${sev.color}15`, border: `1px solid ${sev.color}44`, color: sev.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0 }}>◎ VIEW CONTEXT →</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
