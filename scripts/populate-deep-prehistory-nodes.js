import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createWriteStream, existsSync, statSync } from "node:fs";
import matter from "gray-matter";
import https from "node:https";

function download(url, dest) {
  return new Promise(res => {
    https.get(url, { headers: { "User-Agent": "OpenGrailDeepPrehistory/9.0 (calix@calmdownoscar.com)" } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return download(r.headers.location, dest).then(res);
      }
      if (r.statusCode !== 200) return res(false);
      const s = createWriteStream(dest);
      r.pipe(s);
      s.on("finish", () => {
        s.close();
        res(existsSync(dest) && statSync(dest).size > 1000);
      });
      s.on("error", () => res(false));
    }).on("error", () => res(false));
  });
}

async function run() {
  await mkdir("data/prehistoric-traditions", { recursive: true });
  await mkdir("public/artifacts", { recursive: true });

  // 1. Download verified archaeological artifacts
  const images = [
    ["paleolithic-mortuary-cult-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Qafzeh_burial.jpg/960px-Qafzeh_burial.jpg"],
    ["paleolithic-mortuary-cult-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Shanidar_Cave_2016.jpg/960px-Shanidar_Cave_2016.jpg"],
    ["upper-paleolithic-shamanism-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lion_man_photo.jpg/960px-Lion_man_photo.jpg"],
    ["upper-paleolithic-shamanism-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Chauvet_Cave_Replica_01.jpg/960px-Chauvet_Cave_Replica_01.jpg"],
    ["venus-mother-cults-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Venus_of_Willendorf_frontview.jpg/960px-Venus_of_Willendorf_frontview.jpg"],
    ["venus-mother-cults-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Venus_von_Hohle_Fels_Ansichten.jpg/960px-Venus_von_Hohle_Fels_Ansichten.jpg"],
    ["gobekli-tepe-sanctuary-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/G%C3%B6bekli_Tepe%2C_Urfa.jpg/960px-G%C3%B6bekli_Tepe%2C_Urfa.jpg"],
    ["gobekli-tepe-sanctuary-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/G%C3%B6bekli_Tepe_monolith_pillar_relief.jpg/960px-G%C3%B6bekli_Tepe_monolith_pillar_relief.jpg"],
    ["catalhoyuk-cult-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Museum_of_Anatolian_Civilizations_084.jpg/960px-Museum_of_Anatolian_Civilizations_084.jpg"],
    ["catalhoyuk-cult-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/%C3%87atalh%C3%B6y%C3%BCk_restoration.jpg/960px-%C3%87atalh%C3%B6y%C3%BCk_restoration.jpg"],
    ["neolithic-megalithic-religions-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Newgrange_entrance_roofbox.jpg/960px-Newgrange_entrance_roofbox.jpg"],
    ["neolithic-megalithic-religions-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Carnac_alignements_Kermario.jpg/960px-Carnac_alignements_Kermario.jpg"]
  ];

  for (const [name, url] of images) {
    await download(url, `public/artifacts/${name}`);
  }

  // 2. Create prehistoric markdown nodes
  const nodes = [
    {
      file: "data/prehistoric-traditions/paleolithic-mortuary-cult.md",
      content: `---
id: paleolithic-mortuary-cult
title: Paleolithic Mortuary Cult & Ritual Burials
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 100,000 BCE
epistemic_tier: academic_consensus
summary: >-
  The earliest archaeological evidence of intentional human ceremonial burial,
  grave goods, and red ochre ritual coloration.
canonical_texts:
  - Archaeological mortuary record (Qafzeh, Skhul, Shanidar, La Chapelle)
  - Paleolithic osteological and grave-good corpora
relations:
  - target: animist-frameworks
    type: influenced_by
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
  - target: upper-paleolithic-shamanism
    type: parallel_concept
    certainty: academic_consensus
origin_year: -100000
origin_geo:
  lat: 32.6996
  lng: 35.3035
  place_name: 'Qafzeh Cave, Lower Galilee, Levant'
extinct_year: -10000
key_tenets:
  - >-
    Foundational Doctrine: Intentional placement of deceased hominins (Homo sapiens and Neanderthals) with ritual body positioning, grave goods (antlers, shells, bead ornaments), and red ochre pigment indicates early conceptions of an afterlife, spirit continuity, or ceremonial grief.
  - >-
    Distinctive Practice: Inhumation in deep cave chambers, association of floral offerings (Shanidar), and deliberate funerary caching established the foundation for all subsequent mortuary religion.
  - >-
    Core Orientation: The earliest archaeological evidence of intentional human ceremonial burial and spirit veneration.
sources:
  - title: 'Nature: "Early human burials in the Levant and Eurasian Middle Paleolithic"'
    url: 'https://www.nature.com/articles/d41586-021-01200-8'
  - title: 'Oxford Handbook of the Archaeology of Death and Burial'
    url: 'https://www.oxfordhandbooks.com/view/10.1093/oxfordhb/9780199569069.001.0001/oxfordhb-9780199569069'
artifacts:
  - title: Qafzeh Cave Ceremonial Inhumation with Red Ochre & Deer Antler
    imageUrl: /artifacts/paleolithic-mortuary-cult-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Qafzeh_cave
    provenance: Qafzeh Cave, Lower Galilee, Levant
    period: c. 100,000–90,000 BCE
    description: Intentionally placed Middle Paleolithic Homo sapiens burial with associated fallow deer antler across the chest and abundant red ochre pigment, demonstrating ritual mortuary behavior.
  - title: Shanidar Cave Neanderthal Funerary Chamber & Floral Remains
    imageUrl: /artifacts/paleolithic-mortuary-cult-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Shanidar_Cave
    provenance: Zagros Mountains, Kurdistan, Iraq
    period: c. 65,000–45,000 BCE
    description: Deep cave sanctuary in the Zagros mountains where multiple Neanderthal burials were discovered with clustered pollen grains and stone markers.
---

# Paleolithic Mortuary Cult & Ritual Burials

## Historical context
Dating back over 100,000 years, intentional human burials at Qafzeh and Skhul in the Levant, followed by Neanderthal burials at Shanidar in Iraq and La Chapelle-aux-Saints in France, constitute the earliest definitive archaeological evidence of religious and metaphysical thinking in hominin history.

## Distinctives and comparative notes
The systematic presence of personal ornaments, pierced marine shells, animal bones, and ochre demonstrates that death was treated not merely as a biological cessation, but as a liminal transition requiring ritual care, laying the groundwork for ancestor veneration and animism across all human cultures.
`
    },
    {
      file: "data/prehistoric-traditions/upper-paleolithic-shamanism.md",
      content: `---
id: upper-paleolithic-shamanism
title: Upper Paleolithic Shamanism & Therianthropism
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 40,000 BCE
epistemic_tier: academic_consensus
summary: >-
  Deep-cave parietal art, therianthropic visionary sculptures, and ecstatic animal-spirit
  communion of the European and Eurasian Upper Paleolithic.
canonical_texts:
  - Parietal cave sanctuaries (Chauvet, Lascaux, Altamira, El Castillo)
  - Aurignacian and Gravettian portable sacred sculpture
relations:
  - target: paleolithic-mortuary-cult
    type: influenced_by
    certainty: academic_consensus
  - target: shamanic-traditions
    type: branch_of
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: venus-mother-cults
    type: parallel_concept
    certainty: academic_consensus
origin_year: -40000
origin_geo:
  lat: 48.5583
  lng: 10.1558
  place_name: 'Hohlenstein-Stadel, Swabian Jura, Germany'
extinct_year: -10000
key_tenets:
  - >-
    Foundational Doctrine: Visionary transformation between human and animal realms, mediated by therianthropic spirits, ecstatic trance states, and deep underworld descent into dark subterranean caverns.
  - >-
    Distinctive Practice: Carving of ivory therianthropes (half-human, half-lion), hand stenciling with charcoal and red ochre, and ritual creation of monumental cave galleries in the deepest, acoustic chambers of karst caves.
  - >-
    Core Orientation: Subterranean cave sanctuaries and ecstatic spirit communion across Ice Age Eurasia.
sources:
  - title: 'Jean Clottes: "Cave Art and the Shamanic Journey"'
    url: 'https://www.bradshawfoundation.com/clottes/'
  - title: 'British Museum: The Löwenmensch (Lion-Man) Ivory Figurine'
    url: 'https://www.britishmuseum.org/collection/object/H_2003-0901-1'
artifacts:
  - title: Löwenmensch (Lion-Man of Hohlenstein-Stadel) Mammoth Ivory Carving
    imageUrl: /artifacts/upper-paleolithic-shamanism-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Lion-man
    provenance: Stadel Cave, Swabian Jura, Germany
    period: c. 40,000–35,000 BCE (Aurignacian)
    description: The oldest known therianthropic sculpture in the world, carved from mammoth ivory with a human body and cave lion head, symbolizing supernatural metamorphosis and shamanic power.
  - title: Chauvet Cave Deep Parietal Sanctuary & Lion Panel
    imageUrl: /artifacts/upper-paleolithic-shamanism-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Chauvet_Cave
    provenance: Ardèche Gorges, Southern France
    period: c. 36,000 BCE
    description: Spectacular Upper Paleolithic cave sanctuary featuring dynamic ochre and charcoal depictions of predatory beasts, cave bears, and ritual hand stencils deep in the dark zone.
---

# Upper Paleolithic Shamanism & Therianthropism

## Historical context
During the Aurignacian period around 40,000 BCE, human hunter-gatherers developed sophisticated artistic and ritual cultures centered on the spiritual powers of apex predators (cave lions, cave bears, mammoths, bison) and subterranean sanctuaries.

## Distinctives and comparative notes
The creation of therianthropic figures like the *Lion-Man* and the execution of sacred parietal paintings in total subterranean darkness required controlled trance states, complex mythologies, and community ritual participation that prefigure all recorded shamanic traditions.
`
    },
    {
      file: "data/prehistoric-traditions/venus-mother-cults.md",
      content: `---
id: venus-mother-cults
title: Paleolithic Mother Goddess & Fertility Cults
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 30,000 BCE
epistemic_tier: academic_consensus
summary: >-
  Widespread Eurasian symbolic traditions celebrating cosmic fecundity, sacred femininity,
  and ancestral maternal lineage through portable stone and ivory figurines.
canonical_texts:
  - Gravettian and Magdalenian Venus figurine archaeological corpus
  - Ceramic and limestone sacred portable sculpture
relations:
  - target: upper-paleolithic-shamanism
    type: parallel_concept
    certainty: academic_consensus
  - target: catalhoyuk-cult
    type: influenced_by
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -30000
origin_geo:
  lat: 48.3228
  lng: 15.4042
  place_name: 'Willendorf in der Wachau, Lower Austria'
extinct_year: -12000
key_tenets:
  - >-
    Foundational Doctrine: Exaltation of cosmic generation, biological abundance, maternal continuity, and the life-giving powers of the earth through stylized anatomical representations.
  - >-
    Distinctive Practice: Carving and ritual deposition of faceless, voluptuous female figurines in limestone, ivory, and fired ceramic across vast geographic networks from the Pyrenees to Siberia.
  - >-
    Core Orientation: Portable sacred feminine iconography and fertility cults of Ice Age Eurasia.
sources:
  - title: 'Natural History Museum Vienna: The Venus of Willendorf'
    url: 'https://www.nhm-wien.ac.at/en/prehistory/venus_of_willendorf'
  - title: 'Marija Gimbutas: "The Language of the Goddess"'
    url: 'https://en.wikipedia.org/wiki/Marija_Gimbutas'
artifacts:
  - title: Venus of Willendorf Oolitic Limestone Sacred Figurine
    imageUrl: /artifacts/venus-mother-cults-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Venus_of_Willendorf
    provenance: Willendorf, Lower Austria (Natural History Museum Vienna)
    period: c. 30,000–25,000 BCE (Gravettian)
    description: 11-cm carved oolitic limestone figurine tinted with red ochre, emphasizing maternal fecundity, abdominal fullness, and intricate braided head covering, embodying Paleolithic fertility cosmology.
  - title: Venus of Hohle Fels Mammoth Ivory Figurine
    imageUrl: /artifacts/venus-mother-cults-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Venus_of_Hohle_Fels
    provenance: Hohle Fels Cave, Schelklingen, Germany
    period: c. 40,000–35,000 BCE
    description: The oldest undisputed depiction of a human female figure, carved from mammoth ivory with an upper perforation worn as an amuletic talisman.
---

# Paleolithic Mother Goddess & Fertility Cults

## Historical context
Between 40,000 and 20,000 BCE across Europe, Siberia, and Western Asia, human communities created hundreds of small portable female figurines with exaggerated reproductive attributes and tinted with sacred red ochre.

## Distinctives and comparative notes
These figures represent the earliest unified trans-continental sacred iconographic tradition in human history, linking maternal lineage, seasonal regeneration, and spiritual protection.
`
    },
    {
      file: "data/prehistoric-traditions/gobekli-tepe-sanctuary.md",
      content: `---
id: gobekli-tepe-sanctuary
title: Göbekli Tepe Megalithic Sanctuary Tradition
cluster: Ancient Near East
color: '#b08968'
era_start: c. 9,500 BCE
epistemic_tier: academic_consensus
summary: >-
  The world's oldest known monumental megalithic sanctuary complex, built by pre-pottery
  hunter-gatherers in Upper Mesopotamia.
canonical_texts:
  - Epigraphic reliefs of predatory beasts, serpents, and celestial symbols on T-pillars
  - Architectural enclosures A through H at Göbekli Tepe and Karahan Tepe
relations:
  - target: upper-paleolithic-shamanism
    type: influenced_by
    certainty: academic_consensus
  - target: catalhoyuk-cult
    type: influenced_by
    certainty: academic_consensus
  - target: sumerian-religion
    type: influenced_by
    certainty: minority_scholarly
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -9500
origin_geo:
  lat: 37.2231
  lng: 38.9225
  place_name: 'Göbekli Tepe, Şanlıurfa Province, Southeastern Anatolia, Turkey'
extinct_year: -8000
key_tenets:
  - >-
    Foundational Doctrine: Communal gathering at artificial sacred mounds (tepes) to construct megalithic stone enclosures honoring cosmic ancestors, celestial orientations, and dangerous totemic animal guardians.
  - >-
    Distinctive Practice: Quarrying, shaping, and erecting multi-ton T-shaped limestone monoliths with high-relief carvings of lions, foxes, vultures, wild boars, and snakes; ritual feasts; intentional ceremonial backfilling of completed temple enclosures.
  - >-
    Core Orientation: Monumental pre-agricultural temple architecture and communal celestial-totemic religion.
sources:
  - title: 'Klaus Schmidt: "Göbekli Tepe: A Stone Age Sanctuary in South-Eastern Anatolia"'
    url: 'https://www.dainst.org/project/gobekli-tepe'
  - title: 'UNESCO World Heritage Centre: Göbekli Tepe'
    url: 'https://whc.unesco.org/en/list/1572/'
artifacts:
  - title: Göbekli Tepe Enclosure C Megalithic T-Pillar Sanctuary
    imageUrl: /artifacts/gobekli-tepe-sanctuary-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/G%C3%B6bekli_Tepe
    provenance: Şanlıurfa, Southeastern Anatolia, Turkey
    period: c. 9,500–8,000 BCE (Pre-Pottery Neolithic A/B)
    description: Circular monumental sanctuary enclosure featuring central monolithic T-pillars up to 5.5 meters tall, representing stylized anthropomorphic beings surrounded by animal guardian reliefs.
  - title: High-Relief Monolith Carving of Predator and Vulture
    imageUrl: /artifacts/gobekli-tepe-sanctuary-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/G%C3%B6bekli_Tepe
    provenance: Göbekli Tepe Pillar 43 ("Vulture Stone")
    period: c. 9,000 BCE
    description: Intricate low- and high-relief carving depicting a vulture balancing a sphere (symbol of the soul or cosmos) above snakes and predatory beasts, reflecting Neolithic mortuary cosmology.
---

# Göbekli Tepe Megalithic Sanctuary Tradition

## Historical context
Excavated by Klaus Schmidt and the German Archaeological Institute, Göbekli Tepe predates Stonehenge by over 6,000 years and agriculture itself, demonstrating that monumental religious architecture drove the emergence of settled civilization rather than the other way around.

## Distinctives and comparative notes
The site features concentric circular enclosures of massive T-shaped pillars representing stylized human forms with carved belts and loincloths, surrounded by ferocious animals, functioning as a pan-regional pilgrimage sanctuary for Upper Mesopotamian hunter-gatherer bands.
`
    },
    {
      file: "data/prehistoric-traditions/catalhoyuk-cult.md",
      content: `---
id: catalhoyuk-cult
title: Çatalhöyük Neolithic Sanctuary & Bucrania Cult
cluster: Ancient Near East
color: '#b08968'
era_start: c. 7,500 BCE
epistemic_tier: academic_consensus
summary: >-
  Anatolia's massive proto-urban Neolithic settlement centered on domestic shrines,
  bull-skull (bucrania) altars, and wall murals of raptors and maternal deities.
canonical_texts:
  - Archaeological shrine installations and intramural sub-floor burials
  - Clay and stone statuettes (Seated Woman of Çatalhöyük)
relations:
  - target: gobekli-tepe-sanctuary
    type: influenced_by
    certainty: academic_consensus
  - target: venus-mother-cults
    type: influenced_by
    certainty: academic_consensus
  - target: minoan-religion
    type: influenced_by
    certainty: minority_scholarly
  - target: mesopotamian-religion
    type: parallel_concept
    certainty: academic_consensus
origin_year: -7500
origin_geo:
  lat: 37.6667
  lng: 32.8275
  place_name: 'Çatalhöyük, Konya Plain, Anatolia, Turkey'
extinct_year: -5700
key_tenets:
  - >-
    Foundational Doctrine: Integration of sacred life, ancestral burial, and cosmic regeneration within the domestic architecture of tightly packed mudbrick dwellings entered through roof ladders.
  - >-
    Distinctive Practice: Mounting of wild bull skulls (bucrania) on plastered walls, creating wall murals of headless corpses excarnated by vultures, burying ancestors beneath sleeping platforms, and depositing female figurines in grain bins.
  - >-
    Core Orientation: Proto-urban ancestral veneration, bucrania altars, and maternal fertility shrines.
sources:
  - title: 'Ian Hodder: "The Leopard’s Tale: Revealing the Mysteries of Çatalhöyük"'
    url: 'https://www.catalhoyuk.com/'
  - title: 'UNESCO World Heritage: Neolithic Site of Çatalhöyük'
    url: 'https://whc.unesco.org/en/list/1405/'
artifacts:
  - title: Seated Woman of Çatalhöyük Flanked by Felines
    imageUrl: /artifacts/catalhoyuk-cult-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Seated_Woman_of_%C3%87atalh%C3%B6y%C3%BCk
    provenance: Çatalhöyük, Konya Plain, Turkey (Museum of Anatolian Civilizations)
    period: c. 6,000 BCE (Neolithic)
    description: Baked clay statuette of an enthroned maternal figure resting her hands on two leopard armrests, symbolizing mastery over predatory nature and agricultural life-giving authority.
  - title: Çatalhöyük Domestic Shrine Reconstruction with Bucrania Altars
    imageUrl: /artifacts/catalhoyuk-cult-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/%C3%87atalh%C3%B6y%C3%BCk
    provenance: Çatalhöyük Archaeological Park, Turkey
    period: c. 7,000–6,000 BCE
    description: Reconstructed Neolithic sanctuary interior showing plaster-coated bull horns (bucrania) emerging from the walls and platforms above ancestral grave chambers.
---

# Çatalhöyük Neolithic Sanctuary & Bucrania Cult

## Historical context
Occupied by up to 10,000 people for over a millennium, Çatalhöyük in central Anatolia represents the largest and best-preserved Neolithic settlement in the Near East, bridging prehistoric foraging beliefs with early agricultural theologies.

## Distinctives and comparative notes
The sacred was embedded directly within daily life: every home was a sanctuary where deceased ancestors rested under the floor, bull horns guarded hearths, and female figurines protected stored harvest grain.
`
    },
    {
      file: "data/prehistoric-traditions/neolithic-megalithic-religions.md",
      content: `---
id: neolithic-megalithic-religions
title: Atlantic & European Megalithic Traditions
cluster: Ancient European
color: '#7f8ee8'
era_start: c. 4,500 BCE
epistemic_tier: academic_consensus
summary: >-
  Monumental passage tombs, stone circles, and astronomical solar alignments of
  Neolithic Atlantic Europe.
canonical_texts:
  - Astronomical solar alignments (Newgrange winter solstice, Stonehenge summer solstice)
  - Megalithic passage tomb rock-art spirals and cup-and-ring petroglyphs
relations:
  - target: gobekli-tepe-sanctuary
    type: parallel_concept
    certainty: academic_consensus
  - target: celtic-polytheism
    type: influenced_by
    certainty: academic_consensus
  - target: norse-religion
    type: influenced_by
    certainty: minority_scholarly
origin_year: -4500
origin_geo:
  lat: 53.6947
  lng: -6.4754
  place_name: 'Brú na Bóinne (Newgrange), County Meath, Ireland'
extinct_year: -1500
key_tenets:
  - >-
    Foundational Doctrine: Alignment of ancestral bone depositories with precise solar solstices and lunar standstills, conceptualizing death as a cosmic rebirth through the penetration of solar light into dark passage tombs.
  - >-
    Distinctive Practice: Transporting and raising massive megaliths (menhirs, dolmens, cromlechs), carving triskele and concentric spiral rock art, and constructing stone alignments (Carnac) across coastlines.
  - >-
    Core Orientation: Monumental stone circles, passage tombs, and solar-cosmic alignments.
sources:
  - title: 'Brú na Bóinne UNESCO World Heritage Site'
    url: 'https://whc.unesco.org/en/list/659/'
  - title: 'Aubrey Burl: "A Guide to the Stone Circles of Britain, Ireland and Brittany"'
    url: 'https://yalebooks.yale.edu/'
artifacts:
  - title: Newgrange Passage Tomb Entrance & Winter Solstice Roofbox
    imageUrl: /artifacts/neolithic-megalithic-religions-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Newgrange
    provenance: Boyne Valley, County Meath, Ireland
    period: c. 3,200 BCE (Pre-dating Stonehenge and Giza Pyramids)
    description: Monumental megalithic passage tomb engineered with a precision roofbox allowing the rising winter solstice sun to illuminate the inner burial chamber for 17 minutes.
  - title: Kermario Megalithic Alignments at Carnac
    imageUrl: /artifacts/neolithic-megalithic-religions-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Carnac_stones
    provenance: Carnac, Brittany, France
    period: c. 4,500–3,300 BCE
    description: Thousands of Neolithic standing stones (menhirs) arranged in precise kilometer-long parallel avenues across the Breton landscape.
---

# Atlantic & European Megalithic Traditions

## Historical context
Beginning around 4,500 BCE in Atlantic Western Europe, farming communities erected tens of thousands of standing stones, dolmens, and passage tombs across Brittany, Ireland, Britain, and the Iberian peninsula.

## Distinctives and comparative notes
These sites served as ancestral mausoleums, territorial monuments, and astronomical observatories celebrating the cycles of the sun and stars, laying cultural foundations that later influenced Celtic and European pagan traditions.
`
    }
  ];

  for (const node of nodes) {
    await writeFile(node.file, node.content, "utf8");
    console.log(`✅ Created prehistoric node: ${node.file}`);
  }

  // 3. Update existing comparative frameworks to reflect deep chronological roots
  const frameworks = [
    {
      file: "data/comparative-frameworks/animist-frameworks.md",
      origin_year: -100000,
      era_start: "c. 100,000 BCE to present",
      relations: [
        { target: "paleolithic-mortuary-cult", type: "branch_of", certainty: "academic_consensus" },
        { target: "ancestor-veneration", type: "parallel_concept", certainty: "academic_consensus" },
        { target: "shamanic-traditions", type: "parallel_concept", certainty: "academic_consensus" },
        { target: "australian-aboriginal-religions", type: "parallel_concept", certainty: "academic_consensus" }
      ]
    },
    {
      file: "data/comparative-frameworks/shamanic-traditions.md",
      origin_year: -40000,
      era_start: "c. 40,000 BCE to present",
      relations: [
        { target: "upper-paleolithic-shamanism", type: "branch_of", certainty: "academic_consensus" },
        { target: "animist-frameworks", type: "parallel_concept", certainty: "academic_consensus" },
        { target: "paleolithic-mortuary-cult", type: "influenced_by", certainty: "academic_consensus" }
      ]
    },
    {
      file: "data/comparative-frameworks/ancestor-veneration.md",
      origin_year: -100000,
      era_start: "c. 100,000 BCE to present",
      relations: [
        { target: "paleolithic-mortuary-cult", type: "branch_of", certainty: "academic_consensus" },
        { target: "animist-frameworks", type: "parallel_concept", certainty: "academic_consensus" },
        { target: "catalhoyuk-cult", type: "influenced_by", certainty: "academic_consensus" }
      ]
    },
    {
      file: "data/oceanic-australasian/australian-aboriginal-religions.md",
      origin_year: -65000,
      era_start: "c. 65,000 BCE to present",
      relations: [
        { target: "animist-frameworks", type: "parallel_concept", certainty: "academic_consensus" },
        { target: "ancestor-veneration", type: "parallel_concept", certainty: "academic_consensus" },
        { target: "paleolithic-mortuary-cult", type: "parallel_concept", certainty: "academic_consensus" }
      ]
    },
    {
      file: "data/ancient-near-east/sumerian-religion.md",
      extraRelations: [
        { target: "gobekli-tepe-sanctuary", type: "influenced_by", certainty: "minority_scholarly" },
        { target: "catalhoyuk-cult", type: "influenced_by", certainty: "minority_scholarly" }
      ]
    }
  ];

  for (const item of frameworks) {
    if (!existsSync(item.file)) continue;
    const raw = await readFile(item.file, "utf8");
    const { data, content } = matter(raw);
    if (item.origin_year !== undefined) data.origin_year = item.origin_year;
    if (item.era_start !== undefined) data.era_start = item.era_start;
    if (item.relations) data.relations = item.relations;
    if (item.extraRelations) {
      data.relations = data.relations || [];
      for (const rel of item.extraRelations) {
        if (!data.relations.some(r => r.target === rel.target)) {
          data.relations.push(rel);
        }
      }
    }
    await writeFile(item.file, matter.stringify(content, data), "utf8");
    console.log(`✅ Updated chronological relations for: ${item.file}`);
  }

  console.log("🎉 Deep Prehistoric node integration complete!");
}

run().catch(console.error);
