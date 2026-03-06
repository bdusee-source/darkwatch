const SEGMENTS = [
  { label: "Low",      color: "#22c55e" },
  { label: "Medium",   color: "#f59e0b" },
  { label: "High",     color: "#f97316" },
  { label: "Critical", color: "#ef4444" },
];
const LEVEL_INDEX = { NONE: 0, LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export function RiskBar({ risk, isMonitoring, brand, lastScanTime, nextScanIn, scanCycle }) {
  const levelIdx = LEVEL_INDEX[risk.level] ?? 0;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 52, background: "#0d1117", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center" }}>
      {/* Active scan shimmer */}
      {isMonitoring && (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 0%, ${risk.color}0a 50%, transparent 100%)`, animation: "scanLine 4s ease-in-out infinite", pointerEvents: "none" }} />
      )}

      <div style={{ width: "100%", maxWidth: "calc(100vw)", padding: "0 20px 0 236px", display: "flex", alignItems: "center", gap: 18 }}>

        {/* Status dot + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ position: "relative", width: 8, height: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isMonitoring ? risk.color : "#334155", boxShadow: isMonitoring ? `0 0 8px ${risk.color}88` : "none" }} />
            {isMonitoring && risk.pulse && (
              <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${risk.color}`, animation: "ping 1.5s infinite" }} />
            )}
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: isMonitoring ? risk.color : "#475569" }}>
              {risk.level === "NONE" ? "No threats" : risk.level}
            </span>
            {brand && <span style={{ fontSize: 12, color: "#475569", marginLeft: 8 }}>{brand}</span>}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#1e293b", flexShrink: 0 }} />

        {/* Colour bar */}
        <div style={{ width: 160, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 2, height: 5, borderRadius: 99, overflow: "hidden", marginBottom: 3 }}>
            {SEGMENTS.map((seg, i) => (
              <div key={i} style={{ flex: 1, background: i <= levelIdx ? seg.color : "#1e293b", transition: "background 0.5s ease" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {SEGMENTS.map((seg, i) => (
              <span key={i} style={{ fontSize: 9, color: i <= levelIdx ? seg.color : "#334155", fontWeight: i <= levelIdx ? 600 : 400, flex: 1, textAlign: "center" }}>{seg.label}</span>
            ))}
          </div>
        </div>

        {/* Risk score */}
        {risk.score > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: "#1e293b", flexShrink: 0 }} />
            <div style={{ flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: risk.color, letterSpacing: "-0.5px" }}>{risk.score}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: 3 }}>/10</span>
            </div>
          </>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Monitoring status */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {isMonitoring ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>● Monitoring active</div>
              <div style={{ fontSize: 11, color: "#475569" }}>
                Cycle #{scanCycle} · Next in {nextScanIn}s
                {lastScanTime && ` · Last: ${lastScanTime}`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>○ Monitoring inactive</div>
          )}
        </div>
      </div>
    </div>
  );
}
