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
  return <span>{d}<span style={{ animation: "blink 1s infinite" }}>█</span></span>;
}

export function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export function TagInput({ label, sublabel, placeholder, tags, onAdd, onRemove, tagColor = "#f97316" }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) { onAdd(t); setVal(""); }
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>{label}</label>
      {sublabel && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>{sublabel}</p>}
      <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
        <input
          style={{ flex: 1, background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 14, outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit" }}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add} style={{ background: `${tagColor}15`, border: `1px solid ${tagColor}35`, color: tagColor, padding: "0 14px", borderRadius: 8, cursor: "pointer", fontSize: 20, fontWeight: 700, flexShrink: 0, lineHeight: 1 }}>+</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tags.map((t) => (
          <span key={t} style={{ background: `${tagColor}10`, border: `1px solid ${tagColor}28`, color: tagColor, padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            {t}
            <span onClick={() => onRemove(t)} style={{ cursor: "pointer", opacity: 0.45, fontSize: 11, lineHeight: 1 }}>✕</span>
          </span>
        ))}
        {!tags.length && <span style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>None added</span>}
      </div>
    </div>
  );
}

export function ScanSection({ title, badge, badgeColor = "#f97316", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8, border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", background: open ? "#0d1117" : "#0a0c10", userSelect: "none", transition: "background 0.15s" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: open ? "#e2e8f0" : "#94a3b8" }}>{title}</span>
          {badge !== undefined && badge > 0 && (
            <span style={{ fontSize: 11, background: `${badgeColor}14`, color: badgeColor, padding: "1px 8px", borderRadius: 99, fontWeight: 600, border: `1px solid ${badgeColor}28` }}>{badge}</span>
          )}
        </div>
        <span style={{ color: "#475569", fontSize: 11, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>▶</span>
      </div>
      {open && <div style={{ padding: "16px 16px 4px", borderTop: "1px solid #1e293b", background: "#0a0c10" }}>{children}</div>}
    </div>
  );
}

export function SimpleInput({ label, sublabel, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>{label}</label>
      {sublabel && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>{sublabel}</p>}
      <input
        style={{ width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 13px", color: "#f1f5f9", fontSize: 14, outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit" }}
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
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 4 }}>{label}</label>
      {sublabel && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>{sublabel}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              style={{ padding: "6px 13px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400, border: `1px solid ${active ? "rgba(249,115,22,0.4)" : "#1e293b"}`, background: active ? "rgba(249,115,22,0.1)" : "#0d1117", color: active ? "#f97316" : "#64748b", transition: "all 0.15s" }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
