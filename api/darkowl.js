/**
 * /api/darkowl.js — DarkOwl Vision API proxy
 *
 * DarkOwl API docs: https://docs.darkowl.com
 *
 * Query params:
 *   ?type=search&q=acme+corporation&page=1&limit=20
 *   ?type=entity&value=acme.com&entity_type=domain
 *
 * Required env vars:
 *   DARKOWL_API_KEY
 *   DARKOWL_API_SECRET
 */

import crypto from "crypto";

const BASE = "https://api.darkowl.com/api/v1";

function buildAuthHeader(apiKey, apiSecret, method, path) {
  // DarkOwl uses HMAC-SHA256 request signing
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message   = `${method}\n${path}\n${timestamp}`;
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");
  return {
    "X-DARKOWL-API-KEY": apiKey,
    "X-DARKOWL-TIMESTAMP": timestamp,
    "X-DARKOWL-SIGNATURE": signature,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey    = process.env.DARKOWL_API_KEY;
  const apiSecret = process.env.DARKOWL_API_SECRET;
  if (!apiKey)    return res.status(500).json({ error: "DARKOWL_API_KEY not configured" });
  if (!apiSecret) return res.status(500).json({ error: "DARKOWL_API_SECRET not configured" });

  const { type, q, value, entity_type, page = 1, limit = 20 } = req.query;
  let path;

  if (type === "search" && q) {
    path = `/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${limit}`;
  } else if (type === "entity" && value && entity_type) {
    path = `/entity?value=${encodeURIComponent(value)}&type=${encodeURIComponent(entity_type)}`;
  } else {
    return res.status(400).json({ error: "Use type=search&q= or type=entity&value=&entity_type=" });
  }

  const url = `${BASE}${path}`;
  const authHeaders = buildAuthHeader(apiKey, apiSecret, "GET", path);

  try {
    const upstream = await fetch(url, {
      headers: { ...authHeaders, "User-Agent": "DARKWATCH/2.0" },
    });

    if (!upstream.ok) return res.status(upstream.status).json({ error: `DarkOwl returned ${upstream.status}` });
    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[darkowl proxy]", err);
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
