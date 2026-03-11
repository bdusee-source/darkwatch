/**
 * /api/cybersixgill.js — Cybersixgill Darkfeed proxy
 *
 * Cybersixgill API docs: https://developers.cybersixgill.com
 *
 * Query params:
 *   ?type=alerts&limit=20
 *   ?type=search&q=acme+breach&limit=20
 *   ?type=iocs&indicator=acme.com
 *
 * Required env vars:
 *   CYBERSIXGILL_CLIENT_ID
 *   CYBERSIXGILL_CLIENT_SECRET
 */

const BASE     = "https://api.cybersixgill.com";
const TOKEN_URL = `${BASE}/auth/token`;

// Cache the access token for its lifetime to avoid hammering the auth endpoint
let _tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken(clientId, clientSecret) {
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Cybersixgill auth failed: ${res.status}`);
  const { access_token, expires_in } = await res.json();
  _tokenCache = { token: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
  return access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clientId     = process.env.CYBERSIXGILL_CLIENT_ID;
  const clientSecret = process.env.CYBERSIXGILL_CLIENT_SECRET;
  if (!clientId)     return res.status(500).json({ error: "CYBERSIXGILL_CLIENT_ID not configured" });
  if (!clientSecret) return res.status(500).json({ error: "CYBERSIXGILL_CLIENT_SECRET not configured" });

  const { type, q, indicator, limit = 20 } = req.query;
  let url;

  if (type === "alerts") {
    url = `${BASE}/alerts/get_organization_alerts?limit=${limit}`;
  } else if (type === "search" && q) {
    url = `${BASE}/intel/search?query=${encodeURIComponent(q)}&limit=${limit}`;
  } else if (type === "iocs" && indicator) {
    url = `${BASE}/iocs/search?query=${encodeURIComponent(indicator)}&limit=${limit}`;
  } else {
    return res.status(400).json({ error: "Use type=alerts, type=search&q=, or type=iocs&indicator=" });
  }

  try {
    const token    = await getAccessToken(clientId, clientSecret);
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent":  "DARKWATCH/2.0",
        "Content-Type": "application/json",
      },
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: `Cybersixgill returned ${upstream.status}` });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[cybersixgill proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
