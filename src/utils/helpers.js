import { SEVERITY_CONFIG } from "../data/constants";

/**
 * Returns a human-readable "time ago" string from a timestamp.
 */
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/**
 * Calculates the overall risk level from an array of threat results.
 */
export function calcRisk(results) {
  if (!results.length)
    return {
      level: "NONE",
      color: "#30d158",
      bg: "rgba(48,209,88,0.08)",
      score: 0,
      label: "NO THREATS DETECTED",
      sublabel: "Monitoring active — no signals found",
      gradient: "#30d158, #30d158",
    };

  const score = Math.min(
    10,
    results.reduce((acc, r) => acc + (SEVERITY_CONFIG[r.severity]?.weight || 0), 0) * 0.4
  );

  if (score >= 7.5)
    return { level: "CRITICAL", color: "#ff2d55", bg: "rgba(255,45,85,0.15)", score: score.toFixed(1), label: "CRITICAL RISK — IMMEDIATE ACTION REQUIRED", sublabel: "Active threats detected. Engage incident response now.", gradient: "#ff0040, #ff2d55, #ff6b35", pulse: true };
  if (score >= 5)
    return { level: "HIGH", color: "#ff6b35", bg: "rgba(255,107,53,0.12)", score: score.toFixed(1), label: "HIGH RISK — INVESTIGATE NOW", sublabel: "Significant threat signals require urgent analyst review.", gradient: "#ff6b35, #ff9500", pulse: false };
  if (score >= 2.5)
    return { level: "MEDIUM", color: "#ff9500", bg: "rgba(255,149,0,0.10)", score: score.toFixed(1), label: "MEDIUM RISK — MONITOR CLOSELY", sublabel: "Threat activity detected. Review and monitor signals.", gradient: "#ff9500, #ffcc00", pulse: false };

  return { level: "LOW", color: "#30d158", bg: "rgba(48,209,88,0.08)", score: score.toFixed(1), label: "LOW RISK — ROUTINE MONITORING", sublabel: "Minimal threat signals. Continue standard monitoring.", gradient: "#30d158, #34c759", pulse: false };
}

/**
 * Replaces entity placeholders in threat content with real values.
 */
export function interpolateContent(content, entities) {
  let out = content;
  entities.brands.forEach((b) => {
    out = out
      .replace(/{BRAND}/g, b)
      .replace(/{BRAND_DOMAIN}/g, b.toLowerCase().replace(/\s/g, "") + ".com");
  });
  if (entities.vips?.[0])      out = out.replace(/{VIP}/g, entities.vips[0]);
  if (entities.projects?.[0])  out = out.replace(/{PROJECT}/g, entities.projects[0]);
  if (entities.products?.[0])  out = out.replace(/{PRODUCT}/g, entities.products[0]);
  if (entities.keywords?.[0])  out = out.replace(/{KEYWORD}/g, entities.keywords[0]);
  if (entities.socials?.[0])   out = out.replace(/{SOCIAL_HANDLE}/g, entities.socials[0]);
  if (entities.domains?.[0])   out = out.replace(/{DOMAIN}/g, entities.domains[0]);
  if (entities.ips?.[0])       out = out.replace(/{IP_RANGE}/g, entities.ips[0]);
  if (entities.certs?.[0])     out = out.replace(/{CERT_DOMAIN}/g, entities.certs[0]);
  if (entities.suppliers?.[0]) out = out.replace(/{SUPPLIER}/g, entities.suppliers[0]);
  return out;
}
