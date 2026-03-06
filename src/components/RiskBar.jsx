import { useState, useEffect } from "react";

const SEGMENTS = [
  { label: "LOW",      color: "#30d158" },
  { label: "MEDIUM",   color: "#ff9500" },
  { label: "HIGH",     color: "#ff6b35" },
  { label: "CRITICAL", color: "#ff2d55" },
];

const LEVEL_INDEX = { NONE: 0, LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export function RiskBar({ risk, isMonitoring, brand, lastScanTime, nextScanIn, scanCycle }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const levelIdx = LEVEL_INDEX[risk.level] ?? 0;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: risk.bg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${risk.color}44` }}>
      {isMonitoring && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", background: `linear-gradient(90deg, transparent 0%, ${risk.color}18 50%, transparent 100%)`, animation: "scanLine 3s ease-in-out infinite", pointerEvents: "none" }} />
      )}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* Status dot + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 10, height: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: isMonitoring ? risk.color : "rgba(255,255,255,0.5)", boxShadow: isMonitoring ? `0 0 8px ${risk.color}` : "none" }} />
              {isMonitoring && risk.pulse && (
                <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${risk.color}`, animation: "ping 1.5s infinite" }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: risk.color, letterSpacing: "0.08em" }}>{risk.label}</div>
              {brand && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>{brand.toUpperCase()}</div>}
            </div>
          </div>

          {/* Colour bar */}
          <div style={{ flex: 1, minWidth: 140, maxWidth: 280 }}>
            <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 4, overflow: "hidden" }}>
              {SEGMENTS.map((seg, i) => (
                <div
                  key={i}
                  style={{ flex: 1, background: i <= levelIdx ? seg.color : `${seg.color}28`, transition: "background 0.6s ease", borderRadius: i === 0 ? "4px 0 0 4px" : i === 3 ? "0 4px 4px 0" : 0 }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              {SEGMENTS.map((seg, i) => (
                <span key={i} style={{ fontSize: 7, color: i <= levelIdx ? seg.color : "rgba(255,255,255,0.5)", letterSpacing: "0.08em", flex: 1, textAlign: "center" }}>{seg.label}</span>
              ))}
            </div>
          </div>

          {/* Monitoring status */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {isMonitoring ? (
              <div>
                <div style={{ fontSize: 9, color: risk.color, letterSpacing: "0.12em", fontWeight: 700 }}>◉ CONTINUOUS MONITORING ACTIVE</div>
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
