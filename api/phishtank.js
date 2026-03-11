/**
 * /api/phishtank.js — PhishTank proxy
 *
 * Query params:
 *   ?url=https://suspicious-site.com
 *
 * Optional env var: PHISHTANK_API_KEY (higher rate limits with key)
 */

const BASE = "https://checkurl.phishtank.com/checkurl/";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url param" });

  try {
    const body = new URLSearchParams({
      url: url,
      format: "json",
      app_key: process.env.PHISHTANK_API_KEY || "",
    });

    const upstream = await fetch(BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "DARKWATCH/2.0 phishtank-api/2.0",
      },
      body: body.toString(),
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: `PhishTank returned ${upstream.status}` });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[phishtank proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
