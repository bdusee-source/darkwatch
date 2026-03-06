import { useState, useMemo } from "react";
import { SEVERITY_CONFIG, THREAT_TYPES } from "../data/constants";
import { interpolateContent } from "../utils/helpers";

export function ReportScreen({ results, brand, entities, risk, scanCycle, lastScanTime, totalConfigured }) {
  const [reportType, setReportType]     = useState("executive");
  const [reportPeriod, setReportPeriod] = useState(30);
  const [generated, setGenerated]       = useState(false);

  const criticalCount = results.filter((r) => r.severity === "critical").length;
  const highCount     = results.filter((r) => r.severity === "high").length;
  const mediumCount   = results.filter((r) => r.severity === "medium").length;
  const lowCount      = results.filter((r) => r.severity === "low").length;

  const typeCounts = useMemo(() => {
    return results.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});
  }, [results]);

  const handlePrint = () => window.print();

  const cell = (children, style = {}) => (
    <td style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.75)", verticalAlign: "top", ...style }}>{children}</td>
  );

  return (
    <div>
      {/* Controls */}
      <div className="no-print" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ff9500", letterSpacing: "0.12em", marginBottom: 12 }}>◎ REPORT GENERATION</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {[
            { id: "executive",   label: "Executive Report",   sub: "Board-level summary" },
            { id: "operational", label: "Operational Report", sub: "Analyst detail view"  },
          ].map((t) => (
            <button key={t.id} onClick={() => setReportType(t.id)} style={{ flex: 1, minWidth: 140, padding: "10px 14px", borderRadius: 6, cursor: "pointer", background: reportType === t.id ? "rgba(255,149,0,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${reportType === t.id ? "rgba(255,149,0,0.5)" : "rgba(255,255,255,0.08)"}`, color: reportType === t.id ? "#ff9500" : "rgba(255,255,255,0.65)", textAlign: "left" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>{t.label}</div>
              <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{t.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[{ v: 7, l: "Weekly" }, { v: 30, l: "Monthly" }, { v: 90, l: "Quarterly" }].map((p) => (
            <button key={p.v} onClick={() => setReportPeriod(p.v)} style={{ padding: "5px 14px", borderRadius: 4, cursor: "pointer", fontSize: 9, fontWeight: reportPeriod === p.v ? 700 : 400, background: reportPeriod === p.v ? "rgba(255,149,0,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${reportPeriod === p.v ? "rgba(255,149,0,0.45)" : "rgba(255,255,255,0.07)"}`, color: reportPeriod === p.v ? "#ff9500" : "rgba(255,255,255,0.65)", letterSpacing: "0.06em" }}>{p.l} ({p.v}d)</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setGenerated(true)} style={{ flex: 1, padding: "10px", borderRadius: 6, cursor: "pointer", background: "linear-gradient(135deg, rgba(255,149,0,0.2), rgba(255,107,53,0.2))", border: "1px solid rgba(255,149,0,0.4)", color: "#ff9500", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>◎ GENERATE REPORT</button>
          {generated && <button onClick={handlePrint} style={{ padding: "10px 18px", borderRadius: 6, cursor: "pointer", background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.3)", color: "#30d158", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>⎙ PRINT / EXPORT PDF</button>}
        </div>
      </div>

      {/* Report output */}
      {generated && (
        <div id="report-content" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "24px" }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid rgba(255,149,0,0.2)", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 8, color: "rgba(255,149,0,0.7)", letterSpacing: "0.2em", marginBottom: 4 }}>DARKWATCH INTELLIGENCE ENTERPRISE — {reportType.toUpperCase()} REPORT</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{brand || "Organisation"} — Threat Intelligence Summary</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>
              Generated: {new Date().toLocaleString()} · Period: {reportPeriod} days · Scan cycles: {scanCycle} · Last scan: {lastScanTime || "—"}
            </div>
          </div>

          {/* Risk posture */}
          <div style={{ marginBottom: 20, padding: "14px 16px", background: `${risk.color}10`, border: `1px solid ${risk.color}30`, borderLeft: `4px solid ${risk.color}`, borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: `${risk.color}cc`, letterSpacing: "0.15em", marginBottom: 4 }}>CURRENT RISK POSTURE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: risk.color }}>{risk.score}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{risk.label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{risk.sublabel}</div>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "Critical Findings", value: criticalCount, color: "#ff2d55" },
              { label: "High Findings",     value: highCount,     color: "#ff6b35" },
              { label: "Medium Findings",   value: mediumCount,   color: "#ff9500" },
              { label: "Low Findings",      value: lowCount,      color: "#30d158" },
              { label: "Total Findings",    value: results.length, color: "rgba(255,255,255,0.7)" },
              { label: "Signals Monitored", value: totalConfigured, color: "#4a9eff" },
            ].map((k) => (
              <div key={k.label} style={{ flex: 1, minWidth: 100, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 3, letterSpacing: "0.08em" }}>{k.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Findings table */}
          {reportType === "operational" && results.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 10 }}>◈ FINDINGS LOG ({results.length} total)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,149,0,0.3)" }}>
                    {["Severity", "Type", "Source", "Detail", "Detected"].map((h) => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 8, color: "rgba(255,149,0,0.8)", letterSpacing: "0.1em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 40).map((r) => {
                    const sev  = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
                    const type = THREAT_TYPES[r.type] || { label: r.type };
                    return (
                      <tr key={r.uid}>
                        {cell(<span style={{ color: sev.color, fontWeight: 700, fontSize: 9 }}>{sev.label}</span>)}
                        {cell(type.label, { color: "rgba(255,255,255,0.8)" })}
                        {cell(r.source)}
                        {cell(interpolateContent(r.content, entities).slice(0, 120) + "…")}
                        {cell(new Date(r.detectedAt).toLocaleTimeString())}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Executive recommendations */}
          {reportType === "executive" && (
            <div>
              <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 10 }}>◈ BOARD RECOMMENDATIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {criticalCount > 0 && (
                  <div style={{ padding: "10px 14px", background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.2)", borderLeft: "3px solid #ff2d55", borderRadius: 5 }}>
                    <div style={{ fontSize: 10, color: "#ff2d55", fontWeight: 700, marginBottom: 3 }}>IMMEDIATE ACTION — {criticalCount} Critical Finding{criticalCount > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Engage incident response immediately. Critical threats require escalation within 1 hour of detection.</div>
                  </div>
                )}
                {highCount > 0 && (
                  <div style={{ padding: "10px 14px", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", borderLeft: "3px solid #ff6b35", borderRadius: 5 }}>
                    <div style={{ fontSize: 10, color: "#ff6b35", fontWeight: 700, marginBottom: 3 }}>SAME-DAY RESPONSE — {highCount} High Finding{highCount > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Security team should investigate and assess all High severity findings within 4 hours.</div>
                  </div>
                )}
                {results.length === 0 && (
                  <div style={{ padding: "10px 14px", background: "rgba(48,209,88,0.08)", border: "1px solid rgba(48,209,88,0.2)", borderLeft: "3px solid #30d158", borderRadius: 5 }}>
                    <div style={{ fontSize: 10, color: "#30d158", fontWeight: 700, marginBottom: 3 }}>NO ACTIVE THREATS DETECTED</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Current monitoring cycle returned no threat signals. Continue standard monitoring cadence.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            ⚠ This report is generated for defensive security purposes only. All intelligence is sourced from publicly monitored channels. Results do not constitute legal evidence.
          </div>
        </div>
      )}

      {!generated && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          No findings yet — activate monitoring on the Scanner tab first, then generate a report.
        </div>
      )}
    </div>
  );
}
