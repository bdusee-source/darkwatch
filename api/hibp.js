/**
 * /api/hibp.js — Have I Been Pwned proxy
 *
 * Proxies requests to the HIBP v3 API so the API key never touches the client.
 *
 * Query params:
 *   ?type=breach&account=test@example.com   — breaches for an email
 *   ?type=domain&domain=example.com         — breaches for a domain
 *   ?type=paste&account=test@example.com    — pastes for an email
 *
 * Required env var: HIBP_API_KEY
 */

const BASE = "https://haveibeenpwned.com/api/v3";

export default async function handler(req, res) {
  // CORS — allow your front-end origin in production
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "HIBP_API_KEY not configured" });

  const { type, account, domain } = req.query;
  let url;

  if (type === "breach" && account)  url = `${BASE}/breachedaccount/${encodeURIComponent(account)}?truncateResponse=false`;
  else if (type === "domain" && domain) url = `${BASE}/breaches?domain=${encodeURIComponent(domain)}`;
  else if (type === "paste" && account) url = `${BASE}/pasteaccount/${encodeURIComponent(account)}`;
  else return res.status(400).json({ error: "Invalid query params. Use type=breach|domain|paste" });

  try {
    const upstream = await fetch(url, {
      headers: {
        "hibp-api-key": apiKey,
        "user-agent": "DARKWATCH/2.0",
      },
    });

    // 404 from HIBP means "not found / no breaches" — not an error
    if (upstream.status === 404) return res.status(200).json([]);
    if (!upstream.ok) return res.status(upstream.status).json({ error: `HIBP returned ${upstream.status}` });

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[hibp proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
