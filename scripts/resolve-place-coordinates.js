// SPDX-License-Identifier: MIT
//
// Resolve place-name queries to Wikidata QIDs and P625 coordinates.
// Used to produce docs/origin-geo-resolutions.json; see docs/origin-geo-resolutions.md.
//
// Usage: echo '[{"key":"buddhism","query":"Bodh Gaya"}]' | node scripts/resolve-place-coordinates.js
//
// Read-only: never writes to data/.
import { setTimeout as sleep } from "node:timers/promises";

const UA =
  process.env.OPENGRAIL_USER_AGENT ??
  "OpenGrail-geo-research/1.0 (https://github.com/CalixOscar/OpenGrail)";
const input = JSON.parse(await new Promise((res) => {
  let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => res(s));
}));

async function jget(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (r.ok) return await r.json();
    } catch {}
    await sleep(400 * (i + 1));
  }
  return null;
}

async function search(q) {
  const u = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&format=json&limit=6&origin=*`;
  const j = await jget(u);
  return (j?.search ?? []).map((s) => ({ id: s.id, label: s.label, desc: s.description ?? "" }));
}

async function coords(ids) {
  if (!ids.length) return {};
  const u = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=claims|labels&languages=en&format=json&origin=*`;
  const j = await jget(u);
  const out = {};
  for (const [id, ent] of Object.entries(j?.entities ?? {})) {
    const c = ent.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (c) out[id] = { lat: c.latitude, lng: c.longitude, label: ent.labels?.en?.value ?? id };
  }
  return out;
}

const results = [];
for (const item of input) {
  const hits = await search(item.query);
  const withCoords = await coords(hits.map((h) => h.id));
  const enriched = hits.map((h) => ({ ...h, ...(withCoords[h.id] ?? {}) })).filter((h) => h.lat !== undefined);
  results.push({ ...item, candidates: enriched });
  await sleep(120);
}
console.log(JSON.stringify(results, null, 1));
