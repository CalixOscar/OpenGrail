#!/usr/bin/env node
/**
 * Relabel sources whose URL is a publisher site search so the title says so.
 *
 * The generator wrote titles like "Cambridge History of Religions: Abrahamic
 * Traditions & Quakers" onto URLs that only run a site search. The title names a
 * work that was never consulted; the link cannot substantiate the claim beside it.
 * Rewriting the title to `<Publisher> — search results for "<term>"` keeps the link
 * (still useful for further reading) while dropping the false citation.
 *
 * Handles both single-line titles and folded block scalars (`title: >-`).
 * Idempotent: a second run changes nothing.
 */
import fs from "node:fs";
import path from "node:path";

const SEARCH = ["/search", "?q=", "&q=", "?query=", "search?", "results?"];
const isSearch = (u) => SEARCH.some((m) => u.toLowerCase().includes(m));

const PUBLISHER = {
  "oxfordreference.com": "Oxford Reference",
  "cambridge.org": "Cambridge Core",
  "rep.routledge.com": "Routledge Encyclopedia of Philosophy",
  "routledge.com": "Routledge",
  "brill.com": "Brill",
  "jstor.org": "JSTOR",
  "degruyter.com": "De Gruyter",
  "tandfonline.com": "Taylor & Francis",
  "link.springer.com": "Springer",
  "springer.com": "Springer",
  "sciencedirect.com": "ScienceDirect",
  "academic.oup.com": "Oxford Academic",
  "britannica.com": "Encyclopaedia Britannica",
  "worldcat.org": "WorldCat",
  "archive.org": "Internet Archive",
  "scholar.google.com": "Google Scholar",
  "ich.unesco.org": "UNESCO Intangible Cultural Heritage",
  "unesco.org": "UNESCO",
  "plato.stanford.edu": "Stanford Encyclopedia of Philosophy",
  "utorontopress.com": "University of Toronto Press",
  "cup.columbia.edu": "Columbia University Press",
};

function publisherFor(u) {
  const host = new URL(u).hostname.replace(/^www\./, "");
  for (const [k, v] of Object.entries(PUBLISHER)) if (host === k || host.endsWith("." + k)) return v;
  return host;
}

function termFor(u) {
  const url = new URL(u);
  const q = url.searchParams.get("q") || url.searchParams.get("query") ||
            url.searchParams.get("kw") || url.searchParams.get("keyword") || "";
  return q.trim();
}

const yamlSingle = (s) => `'${s.replace(/'/g, "''")}'`;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".md") && e.name !== "_template.md") out.push(p);
  }
  return out;
}

let files = 0, changed = 0, rewritten = 0, skipped = [];

for (const f of walk("data")) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  const out = [];
  let touched = false;

  for (let i = 0; i < lines.length; i++) {
    const start = lines[i].match(/^(\s*)- title:\s*(.*)$/);
    if (!start) { out.push(lines[i]); continue; }

    // Collect this source item: the title (single-line or folded) then its url line.
    const indent = start[1];
    let j = i;
    const titleIsFolded = /^[>|][-+]?\s*$/.test(start[2].trim());
    if (titleIsFolded) {
      j++;
      while (j < lines.length && !/^\s*url:/.test(lines[j])) j++;
    } else {
      j = i + 1;
    }
    // The url value may itself be a folded block scalar spanning the next lines.
    let url = null, jEnd = j;
    const urlLine = lines[j];
    const um = urlLine && urlLine.match(/^\s*url:\s*(.*)$/);
    if (um) {
      const raw = um[1].trim();
      if (/^[>|][-+]?$/.test(raw)) {
        const parts = [];
        let k = j + 1;
        while (k < lines.length && /^\s+\S/.test(lines[k]) && !/^\s*(url|title|- title):/.test(lines[k])) {
          parts.push(lines[k].trim()); k++;
        }
        url = parts.join(""); jEnd = k - 1;
      } else {
        url = raw.replace(/^(['"])([\s\S]*)\1$/, "$2");
      }
    }

    if (!url || !isSearch(url)) { out.push(lines[i]); continue; }
    const term = termFor(url);
    if (!term) { skipped.push(`${f}: no query term in ${url}`); out.push(lines[i]); continue; }

    const want = `${publisherFor(url)} — search results for "${decodeURIComponent(term.replace(/\+/g, " "))}"`;
    out.push(`${indent}- title: ${yamlSingle(want)}`);
    for (let k = j; k <= jEnd; k++) out.push(lines[k]);
    i = jEnd - (jEnd - j) - 1 + (jEnd - j);
    i = jEnd;
    touched = true;
    rewritten++;
  }

  if (touched) { fs.writeFileSync(f, out.join("\n")); changed++; }
  files++;
}
console.log(`scanned ${files} records; rewrote ${rewritten} search-source titles across ${changed} records; skipped ${skipped.length}`);
for (const s of skipped.slice(0, 5)) console.log("  skipped:", s);
