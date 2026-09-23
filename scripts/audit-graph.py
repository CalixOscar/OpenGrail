#!/usr/bin/env python3
"""Report data-integrity problems in opengrail/graph.json.

The corpus was generated, and the generator left three classes of artefact that
read as fact but are not: citations that only open a publisher search, origin
pins that are a cluster centroid with jitter, and images matched to a caption by
keyword. Run this before expanding the corpus; every count should be falling.

    python3 scripts/audit-graph.py
"""
import json, re, sys, collections, urllib.parse

GRAPH = "public/graph.json"
SEARCH = ("/search", "?q=", "&q=", "?query=", "search?", "results?")
STOP = set("the a an of and or in on at from for with to by is was were this image "
           "shows selected as defining visual reference file jpg jpeg png svg gif "
           "webp tif tiff commons wikimedia org wiki de la el".split())


def toks(s):
    s = urllib.parse.unquote(s)
    s = re.sub(r'[^A-Za-z0-9À-ɏ]+', ' ', s)
    return {w.lower() for w in s.split() if len(w) > 2 and w.lower() not in STOP}


def main():
    d = json.load(open(GRAPH, encoding="utf-8"))
    nodes = d["nodes"]
    print("nodes=%d links=%d\n" % (len(nodes), len(d["links"])))

    # 1. tenets truncated mid-sentence by the generator's character budget
    t = [x for n in nodes for x in (n.get("keyTenets") or [])]
    trunc = [x for x in t if x.rstrip().endswith(("...", "…"))]
    print("TENETS         %4d truncated of %d" % (len(trunc), len(t)))

    # 2. sources whose URL is a site search rather than the work named in the title
    srcs = [(n["id"], s) for n in nodes for s in (n.get("sources") or [])]
    search = [(i, s) for i, s in srcs if any(m in (s.get("url") or "").lower() for m in SEARCH)]
    unlabelled = [(i, s) for i, s in search if "search" not in (s.get("title") or "").lower()]
    print("SOURCES        %4d search URLs of %d, %d not labelled as a search"
          % (len(search), len(srcs), len(unlabelled)))

    # 3. origin pins shared by many traditions = cluster centroid, not a real origin
    pl = collections.Counter((n.get("originGeo") or {}).get("place_name") for n in nodes)
    pl.pop(None, None)
    shared = [(p, c) for p, c in pl.most_common() if c >= 5]
    print("ORIGIN GEO     %4d distinct places for %d nodes; %d places carry 5+ traditions"
          % (len(pl), len(nodes), len(shared)))
    for p, c in shared[:8]:
        print("                    %-42s %d" % (p[:42], c))

    # 4. artifacts whose caption shares no wording with the file it points at
    arts = [(n["id"], a) for n in nodes for a in (n.get("artifacts") or [])]
    zero = [(i, a) for i, a in arts
            if toks(a.get("title") or "") and
            not (toks(a.get("title") or "") &
                 toks(urllib.parse.unquote((a.get("sourceUrl") or "").rsplit("/", 1)[-1])))]
    print("ARTIFACTS      %4d of %d share no wording with their source filename "
          "(needs eyes, not a script)" % (len(zero), len(arts)))

    if "--list-artifacts" in sys.argv:
        for i, a in zero:
            print("  [%s]\n     titled: %s\n     file  : %s"
                  % (i, a.get("title", "")[:76],
                     urllib.parse.unquote((a.get("sourceUrl") or "").rsplit("/", 1)[-1])[:76]))


if __name__ == "__main__":
    main()
