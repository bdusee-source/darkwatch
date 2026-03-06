import { useState, useEffect } from "react";

export function TerminalText({ text, speed = 22 }) {
  const [d, setD] = useState("");
  useEffect(() => {
    setD("");
    let i = 0;
    const t = setInterval(() => {
      if (i < text.length) setD(text.slice(0, ++i));
      else clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return (
    <span>
      {d}
      <span style={{ animation: "blink 1s infinite" }}>█</span>
    </span>
  );
}

export function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: "-1px" }}>{value}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function TagInput({ label, sublabel, placeholder, tags, onAdd, onRemove, tagColor = "#ff9500", icon = "◈" }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) { onAdd(t); setVal(""); }
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: tagColor, letterSpacing: "0.13em", marginBottom: 3 }}>{icon} {label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 6, lineHeight: 1.5 }}>{sublabel}</div>}
      <div style={{ display: "flex", gap: 7, marginBottom: 6 }}>
        <input
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 11px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add} style={{ background: `${tagColor}22`, border: `1px solid ${tagColor}44`, color: tagColor, padding: "0 12px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>+</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {tags.map((t) => (
          <span key={t} style={{ background: `${tagColor}14`, border: `1px solid ${tagColor}33`, color: tagColor, padding: "2px 8px", borderRadius: 4, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
            {t}
            <span onClick={() => onRemove(t)} style={{ cursor: "pointer", opacity: 0.5 }}>✕</span>
          </span>
        ))}
        {!tags.length && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>None added</span>}
      </div>
    </div>
  );
}

export function ScanSection({ title, badge, badgeColor = "#ff9500", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 7, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, overflow: "hidden" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", cursor: "pointer", background: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", userSelect: "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.07em" }}>{title}</span>
          {badge !== undefined && (
            <span style={{ fontSize: 8, background: badge > 0 ? `${badgeColor}22` : "rgba(255,255,255,0.06)", color: badge > 0 ? badgeColor : "rgba(255,255,255,0.55)", padding: "1px 6px", borderRadius: 9, border: `1px solid ${badge > 0 ? badgeColor + "44" : "rgba(255,255,255,0.07)"}` }}>{badge} added</span>
          )}
        </div>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
      </div>
      {open && <div style={{ padding: "14px 14px 2px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>{children}</div>}
    </div>
  );
}

export function SimpleInput({ label, sublabel, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 3 }}>◈ {label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 6, lineHeight: 1.5 }}>{sublabel}</div>}
      <input
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 11px", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ToggleGroup({ label, sublabel, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: "#ff9500", letterSpacing: "0.13em", marginBottom: 3 }}>◈ {label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", marginBottom: 6, lineHeight: 1.5 }}>{sublabel}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              style={{ padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, border: `1px solid ${active ? "rgba(255,149,0,0.5)" : "rgba(255,255,255,0.1)"}`, background: active ? "rgba(255,149,0,0.15)" : "rgba(255,255,255,0.03)", color: active ? "#ff9500" : "rgba(255,255,255,0.7)", transition: "all 0.15s" }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
