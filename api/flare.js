/**
 * /api/flare.js — Flare dark web intelligence proxy
 *
 * Flare API docs: https://docs.flare.io
 *
 * Query params:
 *   ?type=search&q=acme+corporation&from=0&size=20
 *   ?type=alerts&tenant_id=<id>
 *   ?type=leaks&q=acme.com
 *
 * Required env vars:
 *   FLARE_API_KEY
 *   FLARE_TENANT_ID
 */

const BASE = "https://api.flare.io";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey    = process.env.FLARE_API_KEY;
  const tenantId  = process.env.FLARE_TENANT_ID;
  if (!apiKey)   return res.status(500).json({ error: "FLARE_API_KEY not configured" });
  if (!tenantId) return res.status(500).json({ error: "FLARE_TENANT_ID not configured" });

  const { type, q, from = 0, size = 20 } = req.query;
  let url;

  if (type === "search" && q) {
    url = `${BASE}/leaksdb/v2/activities?tenant_id=${tenantId}&query=${encodeURIComponent(q)}&from=${from}&size=${size}`;
  } else if (type === "alerts") {
    url = `${BASE}/intelligence/v2/alerts?tenant_id=${tenantId}&size=${size}`;
  } else if (type === "leaks" && q) {
    url = `${BASE}/leaksdb/v2/credentials?tenant_id=${tenantId}&query=${encodeURIComponent(q)}&size=${size}`;
  } else {
    return res.status(400).json({ error: "Use type=search|alerts|leaks with q param" });
  }

  try {
    // Step 1: Get a short-lived token
    const tokenRes = await fetch(`${BASE}/tokens/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!tokenRes.ok) return res.status(401).json({ error: "Flare token generation failed" });
    const { token } = await tokenRes.json();

    // Step 2: Query the API
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "DARKWATCH/2.0",
      },
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: `Flare returned ${upstream.status}` });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[flare proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
