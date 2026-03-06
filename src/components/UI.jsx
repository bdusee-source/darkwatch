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
  const [focused, setFocused] = useState(false);
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) { onAdd(t); setVal(""); }
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: tagColor, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
        {tags.length > 0 && (
          <span style={{ fontSize: 10, color: tagColor, background: `${tagColor}15`, border: `1px solid ${tagColor}30`, padding: "0 6px", borderRadius: 99, fontWeight: 700 }}>{tags.length}</span>
        )}
      </div>
      {sublabel && <p style={{ fontSize: 12, color: "#475569", margin: "0 0 8px", lineHeight: 1.5 }}>{sublabel}</p>}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <div style={{
          flex: 1,
          background: focused ? "#0b1120" : "#0d1117",
          border: `1px solid ${focused ? tagColor + "55" : "#1e293b"}`,
          borderRadius: 8,
          boxShadow: focused ? `0 0 0 3px ${tagColor}14, 0 0 20px ${tagColor}0e` : "none",
          transition: "all 0.2s",
        }}>
          <input
            style={{ width: "100%", background: "transparent", border: "none", padding: "10px 13px", color: "#f1f5f9", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            placeholder={placeholder}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <button onClick={add} style={{ background: `${tagColor}15`, border: `1px solid ${tagColor}35`, color: tagColor, padding: "0 15px", borderRadius: 8, cursor: "pointer", fontSize: 20, fontWeight: 700, flexShrink: 0, lineHeight: 1, boxShadow: `0 0 10px ${tagColor}18`, transition: "all 0.15s" }}>+</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {tags.map((t) => (
          <span key={t} style={{ background: `${tagColor}0e`, border: `1px solid ${tagColor}25`, color: tagColor, padding: "3px 10px", borderRadius: 5, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            {t}
            <span onClick={() => onRemove(t)} style={{ cursor: "pointer", opacity: 0.4, fontSize: 11, lineHeight: 1 }}>✕</span>
          </span>
        ))}
        {!tags.length && <span style={{ fontSize: 12, color: "#2d3748", fontStyle: "italic" }}>No entries yet</span>}
      </div>
    </div>
  );
}

const SECTION_ICONS = {
  "Brand Identity": "◈", "Digital Infrastructure": "⬡",
  "People & Personnel": "⚑", "Products & Intellectual Property": "◎",
  "Social Media & Brand Channels": "◉", "Supply Chain & Third-Party Risk": "▲",
  "Keywords & Exclusions": "≡", "Scan Configuration": "⚙",
};

export function ScanSection({ title, badge, badgeColor = "#f97316", children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const icon = SECTION_ICONS[title] || "◈";
  return (
    <div style={{
      marginBottom: 5,
      border: `1px solid ${open ? "#2a3545" : "#141c28"}`,
      borderLeft: `2px solid ${open ? badgeColor + "70" : "#1a2332"}`,
      borderRadius: "0 8px 8px 0",
      overflow: "hidden",
      background: open ? "#090d14" : "#070a10",
      boxShadow: open ? `0 0 30px rgba(0,0,0,0.5), -3px 0 16px ${badgeColor}0a` : "none",
      transition: "all 0.25s ease",
    }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: open ? badgeColor : "#2d3748", transition: "color 0.2s", flexShrink: 0 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: open ? "#e2e8f0" : "#4a5568", transition: "color 0.2s", letterSpacing: "0.01em" }}>{title}</span>
          {badge > 0 && (
            <span style={{ fontSize: 10, background: `${badgeColor}14`, color: badgeColor, padding: "1px 7px", borderRadius: 99, fontWeight: 700, border: `1px solid ${badgeColor}25`, boxShadow: `0 0 6px ${badgeColor}18` }}>{badge}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {!open && badge > 0 && (
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: Math.min(badge, 5) }).map((_, i) => (
                <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: `${badgeColor}50` }} />
              ))}
            </div>
          )}
          <span style={{ color: open ? `${badgeColor}70` : "#1e293b", fontSize: 10, transform: open ? "rotate(90deg)" : "none", transition: "all 0.2s" }}>▶</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "14px 18px 6px", borderTop: `1px solid ${badgeColor}12` }}>{children}</div>
      )}
    </div>
  );
}

export function SimpleInput({ label, sublabel, placeholder, value, onChange, required }) {
  const [focused, setFocused] = useState(false);
  const accent = required ? "#f97316" : "#3b82f6";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: focused ? accent : (value ? "#94a3b8" : "#475569"), letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.2s" }}>{label}</label>
        {required && !value && <span style={{ fontSize: 10, color: "#ef444488", fontWeight: 700 }}>required</span>}
        {value && <span style={{ fontSize: 11, color: "#22c55e" }}>✓</span>}
      </div>
      {sublabel && <p style={{ fontSize: 12, color: "#475569", margin: "0 0 8px", lineHeight: 1.5 }}>{sublabel}</p>}
      <div style={{
        background: focused ? "#0b1120" : "#0d1117",
        border: `1px solid ${focused ? accent + "60" : (value ? "#2d3748" : "#1e293b")}`,
        borderRadius: 8,
        boxShadow: focused ? `0 0 0 3px ${accent}14, 0 0 22px ${accent}10` : "none",
        transition: "all 0.2s",
      }}>
        <input
          style={{ width: "100%", background: "transparent", border: "none", padding: "11px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  );
}

export function ToggleGroup({ label, sublabel, options, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
      {sublabel && <p style={{ fontSize: 12, color: "#475569", margin: "0 0 10px", lineHeight: 1.5 }}>{sublabel}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => onToggle(opt.value)} style={{ padding: "6px 13px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400, border: `1px solid ${active ? "rgba(249,115,22,0.45)" : "#1a2332"}`, background: active ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.015)", color: active ? "#f97316" : "#3d4f63", boxShadow: active ? "0 0 10px rgba(249,115,22,0.12)" : "none", transition: "all 0.15s" }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
