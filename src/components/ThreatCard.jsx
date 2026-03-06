import { useState } from "react";
import { SEVERITY_CONFIG, THREAT_TYPES, THREAT_CONTEXT } from "../data/constants";
import { timeAgo, interpolateContent } from "../utils/helpers";

const SEV_LABELS = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

function ContextModal({ result, entities, onClose }) {
  const sev  = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const type = THREAT_TYPES[result.type] || { label: result.type, color: "#f97316" };
  const ctx  = THREAT_CONTEXT[result.type] || THREAT_CONTEXT.mention;
  const content = interpolateContent(result.content, entities);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", background: "#0d1117", border: `1px solid ${sev.color}30`, borderTop: `3px solid ${sev.color}`, borderRadius: 12, boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${sev.color}15` }}>

        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: sev.color, background: `${sev.color}18`, padding: "2px 9px", borderRadius: 5, border: `1px solid ${sev.color}30` }}>{SEV_LABELS[result.severity] || result.severity}</span>
                <span style={{ fontSize: 12, color: type.color, fontWeight: 600 }}>{type.label}</span>
                <span style={{ fontSize: 12, color: "#475569" }}>·</span>
                <span style={{ fontSize: 12, color: "#475569" }}>{timeAgo(result.detectedAt)}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{type.label} — {result.source}</div>
              <div style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>{result.tor}</div>
            </div>
            <button onClick={onClose} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "20px 22px" }}>

          {/* Finding */}
          <div style={{ marginBottom: 20, padding: "14px 16px", background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Finding Detail</div>
            <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>{content}</p>
          </div>

          {/* Urgency */}
          <div style={{ marginBottom: 20, padding: "12px 16px", background: `${sev.color}0d`, border: `1px solid ${sev.color}25`, borderLeft: `3px solid ${sev.color}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, color: sev.color }}>{ctx.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: sev.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Recommended Urgency</div>
              <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>{ctx.urgency}</div>
            </div>
          </div>

          {/* Context */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Threat Context</div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, margin: 0 }}>{ctx.description}</p>
          </div>

          {/* Actions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Response Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ctx.actions.map((action, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#111827", border: "1px solid #1e293b", borderRadius: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${sev.color}15`, border: `1px solid ${sev.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: sev.color, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicators */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Assessment Indicators</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ctx.indicators.map((ind, i) => (
                <span key={i} style={{ fontSize: 12, color: "#64748b", background: "#111827", border: "1px solid #1e293b", padding: "5px 11px", borderRadius: 6, lineHeight: 1.4 }}>→ {ind}</span>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>External Resources</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {ctx.resources.map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}>
                  <span style={{ fontSize: 13, color: "#f97316", fontWeight: 500 }}>{res.label}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 22px 18px" }}>
          <p style={{ fontSize: 11, color: "#334155", margin: 0, lineHeight: 1.6 }}>⚠ Intelligence provided for defensive awareness only. Do not attempt to access .onion sources or contact threat actors directly.</p>
        </div>
      </div>
    </div>
  );
}

export function ThreatCard({ result, entities, isNew }) {
  const [showContext, setShowContext] = useState(false);
  const sev     = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium;
  const type    = THREAT_TYPES[result.type] || { label: result.type, color: "#f97316" };
  const content = interpolateContent(result.content, entities);

  return (
    <>
      {showContext && <ContextModal result={result} entities={entities} onClose={() => setShowContext(false)} />}
      <div style={{
        background: "#0d1117",
        border: `1px solid ${isNew ? sev.color + "50" : "#1e293b"}`,
        borderLeft: `3px solid ${sev.color}`,
        borderRadius: 8,
        padding: "14px 16px",
        marginBottom: 8,
        position: "relative",
        animation: isNew ? "slideDown 0.35s ease" : result.severity === "critical" ? "threatPulse 4s ease-in-out infinite" : "none",
        transition: "border-color 0.3s",
      }}>

        {/* NEW badge */}
        {isNew && (
          <span style={{ position: "absolute", top: 10, right: 12, fontSize: 10, color: sev.color, background: `${sev.color}18`, padding: "1px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.06em", animation: "blink 1.5s infinite" }}>NEW</span>
        )}

        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: sev.color, background: `${sev.color}15`, padding: "2px 8px", borderRadius: 5, border: `1px solid ${sev.color}28` }}>
            {SEV_LABELS[result.severity] || result.severity}
          </span>
          <span style={{ fontSize: 12, color: type.color, fontWeight: 600 }}>{type.label}</span>
          {result.real
            ? <span style={{ fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", padding: "1px 7px", borderRadius: 4, fontWeight: 600 }}>● Live</span>
            : <span style={{ fontSize: 11, color: "#334155", background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", padding: "1px 7px", borderRadius: 4 }}>Simulated</span>
          }
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569", paddingRight: isNew ? 40 : 0 }}>{timeAgo(result.detectedAt)}</span>
        </div>

        {/* Content */}
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, margin: "0 0 10px" }}>{content}</p>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{result.source}</span>
            {result.feedSource && <span style={{ fontSize: 11, color: "#334155" }}>· {result.feedSource}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#334155", fontFamily: "'JetBrains Mono', monospace", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.tor}</span>
            {result.real && result.contextUrl ? (
              <a href={result.contextUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 11px", borderRadius: 6, background: `${sev.color}10`, border: `1px solid ${sev.color}30`, color: sev.color, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>View Source ↗</a>
            ) : (
              <button onClick={() => setShowContext(true)} style={{ padding: "4px 11px", borderRadius: 6, cursor: "pointer", background: `${sev.color}10`, border: `1px solid ${sev.color}30`, color: sev.color, fontSize: 12, fontWeight: 600 }}>View Details →</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
