/**
 * /api/otx.js — AlienVault OTX proxy
 *
 * Query params:
 *   ?type=domain&value=example.com
 *   ?type=ip&value=1.2.3.4
 *   ?type=hostname&value=evil.example.com
 *   ?type=search&q=acme+breach&limit=20
 *
 * Required env var: OTX_API_KEY
 */

const BASE = "https://otx.alienvault.com/api/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey = process.env.OTX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OTX_API_KEY not configured" });

  const { type, value, q, limit = 20 } = req.query;
  let url;

  if (type === "domain" && value)   url = `${BASE}/indicators/domain/${encodeURIComponent(value)}/general`;
  else if (type === "ip" && value)  url = `${BASE}/indicators/IPv4/${encodeURIComponent(value)}/general`;
  else if (type === "hostname" && value) url = `${BASE}/indicators/hostname/${encodeURIComponent(value)}/general`;
  else if (type === "search" && q)  url = `${BASE}/search/pulses?q=${encodeURIComponent(q)}&limit=${limit}`;
  else return res.status(400).json({ error: "Invalid query params. Use type=domain|ip|hostname|search" });

  try {
    const upstream = await fetch(url, {
      headers: {
        "X-OTX-API-KEY": apiKey,
        "User-Agent": "DARKWATCH/2.0",
      },
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: `OTX returned ${upstream.status}` });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[otx proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
