/**
 * /api/urlhaus.js — URLhaus proxy (no API key required)
 *
 * Query params:
 *   ?type=host&value=example.com
 *   ?type=url&value=https://evil.example.com/malware.exe
 *   ?type=tag&value=acme
 */

const BASE = "https://urlhaus-api.abuse.ch/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { type, value } = req.query;
  if (!type || !value) return res.status(400).json({ error: "Missing type or value param" });

  // URLhaus uses POST with form-encoded body
  const endpointMap = { host: "host", url: "url", tag: "tag" };
  const endpoint = endpointMap[type];
  if (!endpoint) return res.status(400).json({ error: "type must be host|url|tag" });

  try {
    const body = new URLSearchParams({ [endpoint]: value });
    const upstream = await fetch(`${BASE}/${endpoint}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "DARKWATCH/2.0",
      },
      body: body.toString(),
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: `URLhaus returned ${upstream.status}` });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[urlhaus proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
