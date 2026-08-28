import { writeFile, mkdir } from "node:fs/promises";
import { createWriteStream, existsSync, statSync } from "node:fs";
import https from "node:https";

function download(url, dest) {
  return new Promise(res => {
    https.get(url, { headers: { "User-Agent": "OpenGrailGlobalAtlas/11.0 (calix@calmdownoscar.com)" } }, r => {
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
  await mkdir("data/ancient-americas", { recursive: true });
  await mkdir("data/african-traditions", { recursive: true });
  await mkdir("data/central-asian-siberian", { recursive: true });
  await mkdir("data/southeast-asian-mainland", { recursive: true });
  await mkdir("public/artifacts", { recursive: true });

  const images = [
    // Ancient Americas
    ["inca-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/960px-Machu_Picchu%2C_Peru.jpg"],
    ["inca-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Qorikancha_Cusco_Peru.jpg/960px-Qorikancha_Cusco_Peru.jpg"],
    ["aztec-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sun_Stone_in_National_Museum_of_Anthropology_Mexico_City.jpg/960px-Sun_Stone_in_National_Museum_of_Anthropology_Mexico_City.jpg"],
    ["aztec-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Templo_Mayor_Ruins_Mexico_City.jpg/960px-Templo_Mayor_Ruins_Mexico_City.jpg"],
    ["olmec-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Olmec_Head_No._1_at_Xalapa.jpg/960px-Olmec_Head_No._1_at_Xalapa.jpg"],
    ["olmec-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/La_Venta_Altar_4.jpg/960px-La_Venta_Altar_4.jpg"],
    ["chavin-culture-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Lanzon_de_Chavin.jpg/960px-Lanzon_de_Chavin.jpg"],
    ["chavin-culture-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Chavin_de_Huantar_Tenon_Head.jpg/960px-Chavin_de_Huantar_Tenon_Head.jpg"],
    ["caral-supe-civilization-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Piramide_Mayor_Caral.jpg/960px-Piramide_Mayor_Caral.jpg"],
    ["caral-supe-civilization-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Plaza_Circular_Hundida_Caral.jpg/960px-Plaza_Circular_Hundida_Caral.jpg"],
    ["mississippian-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Monks_Mound_in_July.jpg/960px-Monks_Mound_in_July.jpg"],
    ["mississippian-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Rogan_plate_1.jpg/960px-Rogan_plate_1.jpg"],
    ["ancestral-puebloan-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cliff_Palace_Mesa_Verde.jpg/960px-Cliff_Palace_Mesa_Verde.jpg"],
    ["ancestral-puebloan-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Chetro_Ketl_Great_Kiva.jpg/960px-Chetro_Ketl_Great_Kiva.jpg"],
    ["haida-totemic-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/SGang_Gwaay_totem_poles.jpg/960px-SGang_Gwaay_totem_poles.jpg"],
    ["haida-totemic-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Haida_Gwaii_Totem_Pole.jpg/960px-Haida_Gwaii_Totem_Pole.jpg"],

    // Africa & Sahara
    ["kushite-nubian-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Pyramids_of_Meroe_Sudan.jpg/960px-Pyramids_of_Meroe_Sudan.jpg"],
    ["kushite-nubian-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Naqa_Lion_Temple_Apedemak.jpg/960px-Naqa_Lion_Temple_Apedemak.jpg"],
    ["amazigh-berber-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Mzora_Cromlech_Morocco.jpg/960px-Mzora_Cromlech_Morocco.jpg"],
    ["amazigh-berber-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Tassili_n%27Ajjer_Rock_Art.jpg/960px-Tassili_n%27Ajjer_Rock_Art.jpg"],
    ["ethiopian-orthodox-tewahedo-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bete_Giyorgis_Lalibela_Ethiopia.jpg/960px-Bete_Giyorgis_Lalibela_Ethiopia.jpg"],
    ["ethiopian-orthodox-tewahedo-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Axum_Obelisk_Ethiopia.jpg/960px-Axum_Obelisk_Ethiopia.jpg"],
    ["san-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Tsodilo_Hills_Rock_Art_Botswana.jpg/960px-Tsodilo_Hills_Rock_Art_Botswana.jpg"],
    ["san-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Drakensberg_Bushman_Rock_Art.jpg/960px-Drakensberg_Bushman_Rock_Art.jpg"],

    // Central Asia, Siberia & Tibet
    ["bon-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Mount_Kailash_Tibet.jpg/960px-Mount_Kailash_Tibet.jpg"],
    ["bon-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Tonpa_Shenrab_Miwoche_Thangka.jpg/960px-Tonpa_Shenrab_Miwoche_Thangka.jpg"],
    ["sami-shamanism-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Sami_shaman_drum.jpg/960px-Sami_shaman_drum.jpg"],
    ["sami-shamanism-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Sieidi_Sacred_Stone_Sami.jpg/960px-Sieidi_Sacred_Stone_Sami.jpg"],
    ["scythian-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Scythian_Golden_Pectoral_from_Tovsta_Mohyla.jpg/960px-Scythian_Golden_Pectoral_from_Tovsta_Mohyla.jpg"],
    ["scythian-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Pazyryk_Horseman_Carpet.jpg/960px-Pazyryk_Horseman_Carpet.jpg"],

    // Mainland Southeast Asia
    ["khmer-devaraja-cult-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat_Aerial_View.jpg/960px-Angkor_Wat_Aerial_View.jpg"],
    ["khmer-devaraja-cult-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bayon_Temple_Faces_Angkor.jpg/960px-Bayon_Temple_Faces_Angkor.jpg"],
    ["tai-folk-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/San_Phra_Phum_Spirit_House_Thailand.jpg/960px-San_Phra_Phum_Spirit_House_Thailand.jpg"],
    ["tai-folk-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Wat_Xieng_Thong_Luang_Prabang.jpg/960px-Wat_Xieng_Thong_Luang_Prabang.jpg"],
    ["dao-mau-vietnam-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Len_Dong_Mother_Goddess_Ritual_Vietnam.jpg/960px-Len_Dong_Mother_Goddess_Ritual_Vietnam.jpg"],
    ["dao-mau-vietnam-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Phu_Tay_Ho_Temple_Hanoi.jpg/960px-Phu_Tay_Ho_Temple_Hanoi.jpg"],
    ["burmese-nat-worship-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Mount_Popa_Monastery_Myanmar.jpg/960px-Mount_Popa_Monastery_Myanmar.jpg"],
    ["burmese-nat-worship-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/37_Nats_Shrine_Bagan.jpg/960px-37_Nats_Shrine_Bagan.jpg"]
  ];

  for (const [name, url] of images) {
    await download(url, `public/artifacts/${name}`);
  }

  const nodes = [
    // 1. Inca Imperial Religion
    {
      file: "data/ancient-americas/inca-religion.md",
      content: `---
id: inca-religion
title: Inca Imperial Religion & Pachamama Cult
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1438 CE
epistemic_tier: academic_consensus
summary: >-
  The state theology and cosmological system of the Inca Empire (Tawantinsuyu),
  centered on the Sun God Inti, sacred landscape huacas, and Mother Earth (Pachamama).
canonical_texts:
  - Ceque system cosmological alignments and ritual calendars
  - Quipu administration and Garcilaso de la Vega chronicles
relations:
  - target: chavin-culture
    type: influenced_by
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
origin_year: 1438
origin_geo:
  lat: -13.5167
  lng: -71.9789
  place_name: 'Qorikancha (Temple of the Sun), Cusco, Peru'
extinct_year: 1572
key_tenets:
  - >-
    Foundational Doctrine: Inti (the Sun) as divine progenitor of the Sapa Inca dynasty; Viracocha as the primordial creator of the cosmos; Pachamama (Mother Earth) as the sustainer of agricultural and biological life.
  - >-
    Distinctive Practice: Veneration of *huacas* (sacred mountain peaks, springs, rock outcrops) along the 42 radial *Ceque* lines radiating from Cusco; Inti Raymi winter solstice festivals; Capacocha ceremonial summit offerings.
  - >-
    Core Orientation: Sacred imperial landscape geometry, solar communion, and reciprocity with Mother Earth.
sources:
  - title: 'Brian S. Bauer: "The Sacred Landscape of the Inca: The Cusco Ceque System"'
    url: 'https://utpress.utexas.edu/'
  - title: 'UNESCO World Heritage: City of Cuzco'
    url: 'https://whc.unesco.org/en/list/273/'
artifacts:
  - title: Machu Picchu Sacred Intihuatana Solar Alignment Sanctuary
    imageUrl: /artifacts/inca-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Machu_Picchu
    provenance: Urubamba Province, Cusco Region, Peru
    period: c. 1450 CE
    description: Masterpiece Inca royal estate and sanctuary featuring the Intihuatana ritual hitching post of the sun, engineered to align with sacred mountain peaks (Apus) and solstices.
  - title: Qorikancha (Golden Temple of the Sun) Curved Ashlar Masonry
    imageUrl: /artifacts/inca-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Qorikancha
    provenance: Cusco, Peru
    period: c. 1438 CE (Reign of Pachacuti)
    description: The focal sanctuary of the entire Inca Empire, whose walls were once sheeted in solid gold plates, acting as the navel of the Ceque ritual radial line system.
---

# Inca Imperial Religion & Pachamama Cult

## Historical context
Under Emperor Pachacuti in the 15th century, the Inca transformed the ancestral Andean cosmology into a continental state religion that integrated hundreds of ethnic deities into a unified solar and agricultural network across the Andes.
`
    },

    // 2. Aztec / Mexica Religion
    {
      file: "data/ancient-americas/aztec-religion.md",
      content: `---
id: aztec-religion
title: Aztec & Mexica Nahua Religion
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1325 CE
epistemic_tier: academic_consensus
summary: >-
  The monumental cosmological and ritual theology of the Mexica Empire, centered on
  the Five Suns creation myth, solar cosmic nourishment, and the twin temples of Tlaloc and Huitzilopochtli.
canonical_texts:
  - Florentine Codex (Historia General de las Cosas de Nueva España)
  - Codex Borgia and Codex Fejérváry-Mayer
relations:
  - target: olmec-religion
    type: influenced_by
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: 1325
origin_geo:
  lat: 19.4349
  lng: -99.1313
  place_name: 'Templo Mayor, Tenochtitlan (Mexico City), Mexico'
extinct_year: 1521
key_tenets:
  - >-
    Foundational Doctrine: Ometeotl as the primordial dual cosmic principle (male and female); the present world as the Fifth Sun (Nahui-Ollin, Sun of Movement), requiring human sacred reciprocity to prevent universal collapse.
  - >-
    Distinctive Practice: The 260-day sacred calendar (*Tonalpohualli*) and 365-day solar cycle (*Xiuhpohualli*); New Fire Ceremony (*Toxiuhmolpilia*) held every 52 years; ritual bloodletting and offerings atop the Templo Mayor pyramid.
  - >-
    Core Orientation: Cosmological dualism, cosmic motion, and the harmony of rain (Tlaloc) and solar fire (Huitzilopochtli).
sources:
  - title: 'Eduardo Matos Moctezuma: "The Great Temple of the Aztecs"'
    url: 'https://www.thamesandhudson.com/'
  - title: 'Davíd Carrasco: "City of Sacrifice: The Aztec Empire and the Role of Violence in Civilization"'
    url: 'https://www.beacon.org/'
artifacts:
  - title: Aztec Sun Stone (Piedra del Sol / Calendar Stone)
    imageUrl: /artifacts/aztec-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Aztec_sun_stone
    provenance: Tenochtitlan, Mexico City (National Museum of Anthropology)
    period: c. 1502–1520 CE
    description: Monumental 24-ton carved basalt disk depicting the central face of the Sun God Tonatiuh framed by the four previous cosmic eras (Suns) and 20 day-signs of the sacred calendar.
  - title: Templo Mayor Archaeological Sanctuary Ruins
    imageUrl: /artifacts/aztec-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Templo_Mayor
    provenance: Historic Center of Mexico City, Mexico
    period: c. 1325–1521 CE
    description: Sacred focal pyramid of Tenochtitlan featuring dual staircases ascending to twin shrines of Tlaloc (God of Rain/Agriculture) and Huitzilopochtli (God of War/Sun).
---

# Aztec & Mexica Nahua Religion

## Historical context
Founding their capital on an island in Lake Texcoco in 1325, the Mexica synthesized centuries of Toltec and Mesoamerican philosophical traditions into a dynamic state religion centered on cosmic maintenance and sacred poetry (*In xochitl, in cuicatl* - flower and song).
`
    },

    // 3. Olmec Religion
    {
      file: "data/ancient-americas/olmec-religion.md",
      content: `---
id: olmec-religion
title: Olmec Sacred Horizon & Were-Jaguar Cult
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1400 BCE
epistemic_tier: academic_consensus
summary: >-
  The foundational "mother culture" of Mesoamerica, characterized by colossal basalt portrait
  heads, were-jaguar shamanic transformations, and the earliest ceremonial pyramid mounds.
canonical_texts:
  - Monumental stone stelae and altars of San Lorenzo and La Venta
  - Jadeite votive axes and celts corpus
relations:
  - target: upper-paleolithic-shamanism
    type: influenced_by
    certainty: academic_consensus
  - target: aztec-religion
    type: parallel_concept
    certainty: academic_consensus
origin_year: -1400
origin_geo:
  lat: 18.1039
  lng: -94.0417
  place_name: 'La Venta & San Lorenzo, Tabasco/Veracruz, Mexico'
extinct_year: -400
key_tenets:
  - >-
    Foundational Doctrine: Shamanic therianthropic transformation between rulers and apex feline predators (the Were-Jaguar); the underworld as a watery cave womb of creation.
  - >-
    Distinctive Practice: Quarrying and transporting multi-ton basalt boulders over 60 miles to carve colossal portrait heads; burying massive underground jade mosaic pavements as sacred subterranean offerings.
  - >-
    Core Orientation: Monumental earthen sacred mounds, feline shamanism, and cosmic axis mundi architecture.
sources:
  - title: 'Michael D. Coe: "The Olmec World: Ritual and Rulership"'
    url: 'https://press.princeton.edu/'
  - title: 'National Geographic: "The Olmecs and the Origins of Mesoamerican Civilization"'
    url: 'https://www.nationalgeographic.com/'
artifacts:
  - title: Colossal Basalt Reruler Head No. 1 (El Rey)
    imageUrl: /artifacts/olmec-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Olmec_colossal_heads
    provenance: San Lorenzo Tenochtitlán, Veracruz, Mexico (Xalapa Anthropology Museum)
    period: c. 1200–900 BCE
    description: 2.9-meter-tall monolithic carved basalt head wearing a ceremonial jaguar-pelt helmet, representing a sacred ruler endowed with supernatural shamanic authority.
  - title: La Venta Altar 4 (Shaman Ruler Emerging from Underworld Cave)
    imageUrl: /artifacts/olmec-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/La_Venta
    provenance: La Venta, Tabasco, Mexico
    period: c. 800 BCE
    description: Monumental carved throne depicting a seated ruler emerging from the stylized maw of the earth monster/jaguar cave, holding a rope connected to ancestral lineage captives.
---

# Olmec Sacred Horizon & Were-Jaguar Cult

## Historical context
Emerging along Mexico's Gulf Coast around 1400 BCE, the Olmecs established the prototype for all subsequent Mesoamerican religions—including the sacred ballgame, jade veneration, feather-serpent symbolism, and directional cosmology.
`
    },

    // 4. Chavín Culture
    {
      file: "data/ancient-americas/chavin-culture.md",
      content: `---
id: chavin-culture
title: Chavín Cult & Andean Shamanic Horizon
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1200 BCE
epistemic_tier: academic_consensus
summary: >-
  The pan-Andean pilgrimage sanctuary civilization centered on subterranean labyrinthine
  temples, psychoactive San Pedro cactus rites, and the fanged Lanzón deity.
canonical_texts:
  - Architectural acoustic galleries and Lanzón Monolith at Chavín de Huántar
  - Raimondi Stela and Tello Obelisk epigraphy
relations:
  - target: caral-supe-civilization
    type: influenced_by
    certainty: academic_consensus
  - target: inca-religion
    type: parallel_concept
    certainty: academic_consensus
origin_year: -1200
origin_geo:
  lat: -9.5936
  lng: -77.1775
  place_name: 'Chavín de Huántar, Ancash Andes, Peru'
extinct_year: -200
key_tenets:
  - >-
    Foundational Doctrine: Visionary metamorphosis of human priests into composite harpy eagles, caymans, and fanged jaguars mediated by visionary plants (San Pedro cactus / Huachuma and Vilca snuff).
  - >-
    Distinctive Practice: Pilgrim initiation through pitch-black subterranean stone galleries engineered with acoustic water flutes (Pututu conch shells); projecting carved stone tenon heads (*Cabezas Clavas*) showing stages of shamanic transformation.
  - >-
    Core Orientation: Subterranean oracle chambers, fanged feline-serpent pantheism, and pan-Andean ceremonial unity.
sources:
  - title: 'John W. Rick: "The Nature of Ritual Space at Chavín de Huántar"'
    url: 'https://web.stanford.edu/dept/archaeology/chavin/'
  - title: 'UNESCO World Heritage: Chavin (Archaeological Site)'
    url: 'https://whc.unesco.org/en/list/330/'
artifacts:
  - title: The Great Lanzón (Smiling God) Carved Granite Oracle Monolith
    imageUrl: /artifacts/chavin-culture-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Chav%C3%ADn_de_Hu%C3%A1ntar
    provenance: Central Gallery, Old Temple of Chavín de Huántar, Peru
    period: c. 900 BCE
    description: 4.5-meter-tall carved granite lance permanently locked in the subterranean core of the temple, depicting a fanged supreme deity with hair of writhing serpents.
  - title: Tenon Head (Cabeza Clava) Shamanic Metamorphosis Sculpture
    imageUrl: /artifacts/chavin-culture-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Chav%C3%ADn_culture
    provenance: Exterior Temple Walls, Chavín de Huántar, Peru
    period: c. 800 BCE
    description: Expressive stone sculpture projecting from the temple wall depicting a priest undergoing ecstatic transformation, with dilated eyes and serpentine features.
---

# Chavín Cult & Andean Shamanic Horizon

## Historical context
Located at the convergence of mountain and Amazonian ecological zones in Peru's High Andes, Chavín de Huántar functioned for over a millennium as the supreme pilgrimage center of South America, unifying disparate coastal and highland religious traditions.
`
    },

    // 5. Caral-Supe Civilization
    {
      file: "data/ancient-americas/caral-supe-civilization.md",
      content: `---
id: caral-supe-civilization
title: Caral-Supe Sacred Urban Complex
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 3000 BCE
epistemic_tier: academic_consensus
summary: >-
  The oldest known civilization in the Americas, contemporaneous with the Egyptian pyramids,
  distinguished by monumental platform mounds, sunken circular plazas, and sacred fire hearths.
canonical_texts:
  - Sacred architectural monuments of the Supe Valley (Caral, Áspero, Vichama)
  - Quipu knotted string recording artifacts and condor bone flutes
relations:
  - target: chavin-culture
    type: parallel_concept
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -3000
origin_geo:
  lat: -10.8931
  lng: -77.5203
  place_name: 'Sacred City of Caral-Supe, Barranca Province, Peru'
extinct_year: -1800
key_tenets:
  - >-
    Foundational Doctrine: Peaceful harmonic urban organization governed by sacred astronomical alignments, maritime-agricultural barter reciprocity, and perpetual sacred temple hearth fires.
  - >-
    Distinctive Practice: Communal construction of colossal stone platform pyramids using *shicra* woven reed bags filled with river boulders; playing 32 carved pelican and condor bone flutes in sunken circular plazas.
  - >-
    Core Orientation: Monumental pre-ceramic pyramid architecture, celestial observation, and sacred fire sanctuaries.
sources:
  - title: 'Ruth Shady Solís: "Caral: The Oldest Civilization in the Americas"'
    url: 'https://www.zonacaral.gob.pe/'
  - title: 'UNESCO World Heritage: Sacred City of Caral-Supe'
    url: 'https://whc.unesco.org/en/list/1269/'
artifacts:
  - title: Pirámide Mayor (Main Pyramid Complex) of Caral
    imageUrl: /artifacts/caral-supe-civilization-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Caral
    provenance: Supe Valley, Central Coast, Peru
    period: c. 3000–2600 BCE (Contemporary with Giza Pyramids)
    description: Colossal terraced stone platform pyramid measuring over 150 meters long and 30 meters high, serving as the civic and spiritual nexus of the Americas' oldest metropolis.
  - title: Sunken Circular Amphitheater Plaza
    imageUrl: /artifacts/caral-supe-civilization-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Caral
    provenance: Sacred City of Caral, Peru
    period: c. 2800 BCE
    description: Circular subterranean ceremonial courtyard designed with acoustic resonance where dozens of carved condor-bone flutes and deer-bone horns were discovered.
---

# Caral-Supe Sacred Urban Complex

## Historical context
Radiocarbon-dated to 3000 BCE by Peruvian archaeologist Ruth Shady, Caral-Supe proves that monumental religious architecture and complex urban society emerged in the Americas thousands of years earlier than previously believed, completely independent of Old World contact.
`
    },

    // 6. Mississippian Mound Builders
    {
      file: "data/ancient-americas/mississippian-religion.md",
      content: `---
id: mississippian-religion
title: Mississippian Mound Builders & Southeastern Ceremonial Complex
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1050 CE
epistemic_tier: academic_consensus
summary: >-
  The monumental earthen pyramid cities and falcon-shaman cosmology of the North American
  Midwest and Southeast, centered on the ancient metropolis of Cahokia.
canonical_texts:
  - Mississippian Iconographic Workshop corpora (Rogan plates, Shell gorgets, Chunkey stones)
  - Cahokia Woodhenge solar astronomical calendar
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
origin_year: 1050
origin_geo:
  lat: 38.6551
  lng: -90.0617
  place_name: 'Cahokia Mounds, Collinsville, Illinois, USA'
extinct_year: 1450
key_tenets:
  - >-
    Foundational Doctrine: Multi-tiered cosmos comprising the Above World (governed by Thunderbirds and celestial order), the This World (earthly human society), and the Beneath World (watery realm of the Underwater Panther).
  - >-
    Distinctive Practice: Construction of enormous earthen platform mounds for priest-chief temples; playing the sacred disc-and-spear game *Chunkey*; engraving marine shell gorgets and copper repoussé plates with the Birdman / Falcon dancer.
  - >-
    Core Orientation: Monumental earth pyramids, solar woodhenge observatories, and celestial falcon shamanism.
sources:
  - title: 'Timothy R. Pauketat: "Cahokia: Ancient America’s Great City on the Mississippi"'
    url: 'https://www.penguinrandomhouse.com/'
  - title: 'UNESCO World Heritage: Cahokia Mounds State Historic Site'
    url: 'https://whc.unesco.org/en/list/198/'
artifacts:
  - title: Monks Mound (The Colossal Earthen Pyramid of Cahokia)
    imageUrl: /artifacts/mississippian-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Cahokia
    provenance: Cahokia Mounds, Illinois, USA
    period: c. 1050–1200 CE
    description: The largest pre-Columbian earthen structure in the Americas north of Mexico, rising 100 feet in four terraced stages and covering 14 acres at the urban center of Cahokia.
  - title: Rogan Copper Repoussé Plate of the Winged Falcon Dancer (Birdman)
    imageUrl: /artifacts/mississippian-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Mississippian_culture
    provenance: Etowah Mounds, Georgia, USA (Smithsonian National Museum of the American Indian)
    period: c. 1250 CE
    description: Masterpiece native copper repoussé plate depicting a supernatural avian-human dancer wielding a ceremonial flint biface blade and wearing a raptor headdress.
---

# Mississippian Mound Builders & Southeastern Ceremonial Complex

## Historical context
Between 1050 and 1350 CE, Cahokia on the Mississippi River grew to become the largest urban civilization north of the Rio Grande, housing up to 30,000 residents and radiating religious, political, and artistic influence across the entire North American continent.
`
    },

    // 7. Ancestral Puebloan Religion
    {
      file: "data/ancient-americas/ancestral-puebloan-religion.md",
      content: `---
id: ancestral-puebloan-religion
title: Ancestral Puebloan & Chacoan Kiva Traditions
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 850 CE
epistemic_tier: academic_consensus
summary: >-
  The monumental stone great-house canyon cities, subterranean circular kiva sanctuaries,
  and solar petroglyphs of the American Southwest.
canonical_texts:
  - Chaco Canyon Great Kiva architectural alignments (Chetro Ketl, Pueblo Bonito)
  - Sun Dagger solstice calendar on Fajada Butte
relations:
  - target: hopi-religion
    type: branch_of
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: 850
origin_geo:
  lat: 36.0601
  lng: -107.9625
  place_name: 'Chaco Culture National Historical Park, New Mexico, USA'
extinct_year: 1300
key_tenets:
  - >-
    Foundational Doctrine: The Sipapu (sacred subterranean floor orifice) as the portal of cosmic emergence through which primordial ancestors climbed from the underworld into the present Fourth World.
  - >-
    Distinctive Practice: Gathering in Great Kivas (subterranean circular masonry sanctuaries with bench seating and fire vaults); engineering multi-story stone Great Houses aligned with 18.6-year lunar standstill cycles; carving astronomical spiral petroglyphs (Fajada Butte Sun Dagger).
  - >-
    Core Orientation: Subterranean kiva architecture, solar-lunar precision alignments, and sacred clan migration memory.
sources:
  - title: 'Stephen H. Lekson: "The Chaco Meridian: Centers of Political and Sacred Power in the American Southwest"'
    url: 'https://rowman.com/'
  - title: 'UNESCO World Heritage: Chaco Culture'
    url: 'https://whc.unesco.org/en/list/353/'
artifacts:
  - title: Cliff Palace Monumental Masonry Sanctuary at Mesa Verde
    imageUrl: /artifacts/ancestral-puebloan-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Mesa_Verde_National_Park
    provenance: Montezuma County, Colorado, USA
    period: c. 1190–1260 CE
    description: Spectacular multi-story stone cliff dwelling sheltering over 150 rooms and 23 circular subterranean kivas constructed beneath a towering sandstone alcove.
  - title: Chetro Ketl Great Kiva Subterranean Stone Sanctuary
    imageUrl: /artifacts/ancestral-puebloan-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Chaco_Culture_National_Historical_Park
    provenance: Chaco Canyon, New Mexico, USA
    period: c. 1000–1120 CE
    description: Monumental circular subterranean sanctuary featuring a central firebox, masonry seating benches, and sealed turquoise crypts where regional clans conducted sacred kachina rituals.
---

# Ancestral Puebloan & Chacoan Kiva Traditions

## Historical context
Flourishing across the Four Corners region of New Mexico, Colorado, Utah, and Arizona, the Ancestral Puebloans created architectural and astronomical marvels that form the direct ancestral foundation for contemporary Hopi, Zuni, and Rio Grande Pueblo religions.
`
    },

    // 8. Haida Totemic Religion
    {
      file: "data/ancient-americas/haida-totemic-religion.md",
      content: `---
id: haida-totemic-religion
title: Haida & Pacific Northwest Totemic Traditions
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1000 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The monumental cedar totem pole heritage, matrilineal Raven and Eagle clan crests,
  and Potlatch sacred gift-giving feasts of Haida Gwaii.
canonical_texts:
  - Oral mythological corpora (Raven creation cycle, Nang Kilslaas)
  - Master cedar crest poles of SGang Gwaay
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
origin_year: -1000
origin_geo:
  lat: 52.0967
  lng: -131.2222
  place_name: 'SGang Gwaay (Anthony Island), Haida Gwaii, British Columbia, Canada'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Raven (Yáahl / Nang Kilslaas) as the shape-shifting trickster-creator who released the sun, moon, and stars into the world and brought the first humans out of a giant clamshell.
  - >-
    Distinctive Practice: Carving monumental red cedar mortuary and crest totem poles displaying clan heraldry (Killer Whale, Bear, Eagle, Raven); holding the sacred Potlatch (Waahlal) feast of communal distribution, name-giving, and spirit validation.
  - >-
    Core Orientation: Ancient rainforest cedar craft, clan crest totemism, and Potlatch wealth-distribution ceremonies.
sources:
  - title: 'UNESCO World Heritage: SGang Gwaay (Ninstints)'
    url: 'https://whc.unesco.org/en/list/157/'
  - title: 'Bill Reid & Robert Bringhurst: "The Raven Steals the Light"'
    url: 'https://www.douglas-mcintyre.com/'
artifacts:
  - title: SGang Gwaay Ancient Red Cedar Mortuary Totem Poles
    imageUrl: /artifacts/haida-totemic-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/SGang_Gwaay
    provenance: Haida Gwaii archipelago, British Columbia, Canada
    period: Traditional Horizon (UNESCO World Heritage Site)
    description: Weathered 19th-century carved red cedar mortuary poles standing amidst the Pacific rainforest, preserving clan crests in their original coastal village setting.
  - title: Monumental Haida Gwaii Clan Crest Totem Pole
    imageUrl: /artifacts/haida-totemic-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Totem_pole
    provenance: Haida Heritage Centre, Kay Llnagaay, British Columbia
    period: Classical & Contemporary Horizon
    description: Masterpiece towering cedar crest pole intricately sculpted with stacked ancestral beings—Eagle, Bear Mother, and Raven—commemorating clan lineage and sovereign territory.
---

# Haida & Pacific Northwest Totemic Traditions

## Historical context
Inhabiting the misty archipelago of Haida Gwaii for over 10,000 years, the Haida developed one of the most sophisticated maritime totemic artistic and spiritual systems in the world, renowned for red cedar monumental sculpture and deep ecological kinship with the ocean.
`
    },

    // 9. Kingdom of Kush / Nubian Religion
    {
      file: "data/african-traditions/kushite-nubian-religion.md",
      content: `---
id: kushite-nubian-religion
title: Kingdom of Kush & Nubian Religion
cluster: Ancient Near East
color: '#b08968'
era_start: c. 1000 BCE
epistemic_tier: academic_consensus
summary: >-
  The monumental Nilotic royal religion of Nubia (Kerma, Napata, and Meroë), combining
  veneration of the indigenous Lion God Apedemak, Amun of Jebel Barkal, and steep-sided royal pyramids.
canonical_texts:
  - Meroitic cursive and hieroglyphic inscriptions at Naqa and Musawwarat es-Sufra
  - Royal stelae of Piye, Taharqo, and Queen Amanirenas
relations:
  - target: ancient-egyptian-religion
    type: parallel_concept
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -1000
origin_geo:
  lat: 16.9389
  lng: 33.7497
  place_name: 'Royal City of Meroë & Jebel Barkal, Nile Valley, Sudan'
extinct_year: 350
key_tenets:
  - >-
    Foundational Doctrine: Divine authority of the Kandake (ruling Queen Mothers) and Kings under the patronage of Apedemak, the multi-armed indigenous lion-headed deity of war and fertility, and Amun-Re of Jebel Barkal.
  - >-
    Distinctive Practice: Inhumation beneath steep-sided sandstone royal pyramids with decorated mortuary chapels; pouring milk and wine libations on carved offering tables; venerating sacred ram and lion avatars.
  - >-
    Core Orientation: Nubian pyramid tombs, indigenous lion theologies, and sacred royal matriarchal succession.
sources:
  - title: 'Derek A. Welsby: "The Kingdom of Kush: The Napatan and Meroitic Empires"'
    url: 'https://www.britishmuseum.org/'
  - title: 'UNESCO World Heritage: Archaeological Sites of the Island of Meroe'
    url: 'https://whc.unesco.org/en/list/1336/'
artifacts:
  - title: Steep-Sided Royal Pyramids of the Meroë Necropolis
    imageUrl: /artifacts/kushite-nubian-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Mero%C3%AB
    provenance: Meroë, River Nile State, Sudan
    period: c. 300 BCE – 350 CE (Kingdom of Kush)
    description: Spectacular desert necropolis of over 200 steep-angled sandstone pyramids with integrated mortuary temple chapels dedicated to Kushite royal ancestors.
  - title: Relief of Lion God Apedemak at the Sun Temple of Naqa
    imageUrl: /artifacts/kushite-nubian-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Naqa
    provenance: Naqa, Butana region, Sudan
    period: c. 1st century CE
    description: High-relief temple wall carving depicting the three-headed, four-armed Lion God Apedemak bestowing divine life and royal sceptres upon the King and Kandake (Queen).
---

# Kingdom of Kush & Nubian Religion

## Historical context
Dominating the Middle Nile for over a millennium, the Kingdom of Kush conquered Egypt during the 25th Dynasty and later developed a distinct indigenous religious civilization centered at Meroë, using its own written Meroitic script and lion-god theologies.
`
    },

    // 10. Amazigh / Berber Religion
    {
      file: "data/african-traditions/amazigh-berber-religion.md",
      content: `---
id: amazigh-berber-religion
title: Amazigh & Berber Indigenous Traditions
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 3000 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The indigenous North African religion of the Amazigh peoples, centered on megalithic cromlechs,
  solar and mountain sanctuaries, rain rituals (Anzar), and ancestral guardian spirits.
canonical_texts:
  - Saharan rock art corpora (Tassili n'Ajjer, Acacus, Atlas petroglyphs)
  - Oral Amazigh customary lore and poetry (*Tefsit*)
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
origin_year: -3000
origin_geo:
  lat: 35.5136
  lng: -5.9408
  place_name: 'Mzora Megalithic Cromlech & Atlas Mountains, North Africa'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Anzar as the primordial rain deity who fertilizes the earth; sacredness of elevated mountain peaks (Toubkal, Aurès) and natural springs as dwellings of divine powers.
  - >-
    Distinctive Practice: The *Tislit n Unzar* (Bride of Anzar) communal rain-making processions; burial in stone tumuli (*Bazinas*) and megalithic stone circles (Mzora); applying protective geometric Tifinagh symbols and henna talismans against spiritual harm (*Tit* / Evil Eye).
  - >-
    Core Orientation: Megalithic stone rings, ancestral mountain springs, and indigenous Saharan seasonal renewal rites.
sources:
  - title: 'Gabriel Camps: "Les Berbères: Mémoire et Identité"'
    url: 'https://www.editions-errance.com/'
  - title: 'UNESCO World Heritage: Tassili n’Ajjer Rock Art'
    url: 'https://whc.unesco.org/en/list/179/'
artifacts:
  - title: Mzora Megalithic Cromlech & Tumulus Monument
    imageUrl: /artifacts/amazigh-berber-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Msoura
    provenance: Larache Province, Northern Morocco
    period: c. 3rd–2nd millennium BCE
    description: Monumental megalithic stone ring of 168 standing menhirs enclosing a central royal tumulus mound, the largest ancient stone circle in North Africa.
  - title: Tassili n'Ajjer Neolithic Round Head Sacred Parietal Art
    imageUrl: /artifacts/amazigh-berber-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Tassili_n%27Ajjer
    provenance: Tassili n'Ajjer National Park, Sahara Desert, Algeria
    period: c. 6000–3000 BCE
    description: Remarkable Saharan rock painting depicting masked supernatural ceremonial figures floating in sacred ritual dance, reflecting early North African spiritual horizons.
---

# Amazigh & Berber Indigenous Traditions

## Historical context
The indigenous inhabitants of North Africa from Egypt's Siwa Oasis to the Atlantic Ocean, the Amazigh ("free people") developed deep megalithic and astronomical traditions that influenced ancient Egyptian and Mediterranean pantheons and persist in folk rituals today.
`
    },

    // 11. Ethiopian Orthodox Tewahedo
    {
      file: "data/african-traditions/ethiopian-orthodox-tewahedo.md",
      content: `---
id: ethiopian-orthodox-tewahedo
title: Ethiopian Orthodox Tewahedo & Lalibela Monasticism
cluster: Abrahamic
color: '#7f8ee8'
era_start: c. 330 CE to Present
epistemic_tier: academic_consensus
summary: >-
  Ancient Oriental Orthodox national church of Ethiopia, renowned for rock-hewn subterranean
  monolithic churches, Ge'ez liturgical chants (Zema), and veneration of the Ark of the Covenant (Tabot).
canonical_texts:
  - Kebra Nagast (The Glory of Kings)
  - Book of Enoch (preserved in its entirety solely in Ge'ez)
  - Deggwa liturgical hymnary by Saint Yared
relations:
  - target: oriental-orthodoxy
    type: branch_of
    certainty: academic_consensus
  - target: early-christianity
    type: branch_of
    certainty: academic_consensus
origin_year: 330
origin_geo:
  lat: 12.0322
  lng: 39.0433
  place_name: 'Bete Giyorgis (Church of Saint George), Lalibela, Amhara, Ethiopia'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: *Tewahedo* (unified nature of the Divine Word incarnate); preserving the Ark of the Covenant (*Tabot*) at the Cathedral of St. Mary of Zion in Axum; biblical lineage of the Solomonic dynasty via Menelik I.
  - >-
    Distinctive Practice: The celebration of *Timkat* (Epiphany) where Tabots are processed in white robes with velvet umbrellas; playing the *Sistrum* (Sanasel) and *Kebero* drums during Saint Yared's sacred polyphonic chants; excavating monolithic cross-shaped churches straight out of solid basalt rock.
  - >-
    Core Orientation: Subterranean monolithic cross architecture, ancient Ge'ez biblical preservation, and Tabot ark veneration.
sources:
  - title: 'UNESCO World Heritage: Rock-Hewn Churches, Lalibela'
    url: 'https://whc.unesco.org/en/list/18/'
  - title: 'Donald N. Levine: "Wax and Gold: Tradition and Innovation in Ethiopian Culture"'
    url: 'https://press.uchicago.edu/'
artifacts:
  - title: Bete Giyorgis (Church of St. George) Monolithic Rock Cross
    imageUrl: /artifacts/ethiopian-orthodox-tewahedo-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Church_of_Saint_George,_Lalibela
    provenance: Lalibela, Amhara Region, Ethiopia
    period: c. 12th–13th century CE (Reign of King Lalibela)
    description: World-famous Greek-cross shaped church carved downward 30 feet directly into solid red volcanic tuff, engineered as an earthly New Jerusalem.
  - title: Monumental Stela of King Ezana at Axum
    imageUrl: /artifacts/ethiopian-orthodox-tewahedo-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Kingdom_of_Aksum
    provenance: Axum, Tigray Region, Ethiopia
    period: c. 4th century CE
    description: 24-meter-tall granite monolithic obelisk carved to represent a multi-story palace, marking the capital where Christianity was adopted as state religion under King Ezana in 330 CE.
---

# Ethiopian Orthodox Tewahedo & Lalibela Monasticism

## Historical context
One of the oldest Christian churches in existence, the Ethiopian Orthodox Tewahedo Church developed in the Kingdom of Axum in the 4th century CE and preserved ancient canonical texts, unique monastic lifestyles, and monolithic rock architecture completely unbroken through millennia.
`
    },

    // 12. San Religion & Trance Dance
    {
      file: "data/african-traditions/san-religion.md",
      content: `---
id: san-religion
title: San Bushmen Shamanism & Python Cave Sanctuaries
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 70,000 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The world's oldest continuous human ritual tradition, centered on ecstatic trance dances (!Kia),
  supernatural boiling potency (Num), and ancient rock art galleries across Southern Africa.
canonical_texts:
  - Tsodilo Hills archaeological ritual caves and Drakensberg rock art corpora
  - Bleek and Lloyd |Xam oral narratives and mythological transcripts
relations:
  - target: paleolithic-mortuary-cult
    type: parallel_concept
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -70000
origin_geo:
  lat: -18.7500
  lng: 21.7500
  place_name: 'Tsodilo Hills (The Mountains of the Gods), Kalahari Desert, Botswana'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: /Kaggen (the Praying Mantis / Trickster Creator) and the sacred Eland antelope as the primary embodiment of divine life; *N/um* as invisible spiritual heat residing in the stomach.
  - >-
    Distinctive Practice: The All-Night Trance Healing Dance where women clap complex polyrhythms while male and female shamans enter *!Kia* (altered consciousness) to pull sickness out of the community; painting elands with red ochre and eland blood on sandstone shelters.
  - >-
    Core Orientation: Ecstatic spiritual heating (N/um), non-hierarchical community healing, and deep 70,000-year cave ritual continuity.
sources:
  - title: 'Sheila Coulson (University of Oslo): "World’s oldest ritual discovered in Python Cave, Botswana"'
    url: 'https://www.apollon.uio.no/'
  - title: 'David Lewis-Williams: "The Mind in the Cave: Consciousness and the Origins of Art"'
    url: 'https://www.thamesandhudson.com/'
artifacts:
  - title: Tsodilo Hills Sacred Python Cave Rock Sculptures
    imageUrl: /artifacts/san-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Tsodilo
    provenance: Tsodilo Hills, Kalahari Desert, Botswana
    period: c. 70,000 BCE (Middle Stone Age)
    description: 6-meter-long natural rock boulder carved with hundreds of artificial indented grooves to resemble serpent scales, identified as the oldest evidence of ritual behavior in the world.
  - title: Drakensberg Polychrome Eland & Shamanic Rock Art
    imageUrl: /artifacts/san-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/uKhahlamba_/_Drakensberg_Park
    provenance: Drakensberg Mountains, KwaZulu-Natal, South Africa
    period: Traditional Horizon (UNESCO World Heritage Site)
    description: Masterpiece polychrome rock art depicting sacred Elands and therianthropic shamans collapsing in ecstatic trance states while releasing healing spiritual energy.
---

# San Bushmen Shamanism & Python Cave Sanctuaries

## Historical context
Representing the most ancient genetic lineage of modern humanity, the San hunter-gatherers of Southern Africa established ritual traditions at sites like the Tsodilo Hills that date back over 70,000 years, providing the primary anthropological window into the origin of human spiritual consciousness.
`
    },

    // 13. Bon Religion
    {
      file: "data/central-asian-siberian/bon-religion.md",
      content: `---
id: bon-religion
title: Yungdrung Bon & Indigenous Tibetan Religion
cluster: East Asian
color: '#e05353'
era_start: c. 11th century BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The indigenous pre-Buddhist spiritual and cosmological tradition of Tibet, centered on
  Founder Tönpa Shenrab Miwoche, the indestructible Yungdrung (Swastika/Eternity), and Dzogchen.
canonical_texts:
  - Bonpo Kanjur and Katen (178 volumes of canonical scriptures)
  - Zhang Zhung Nyan Gyud (Oral Lineage of Great Perfection)
relations:
  - target: tibetan-buddhism
    type: syncretized_with
    certainty: academic_consensus
  - target: shamanic-traditions
    type: branch_of
    certainty: academic_consensus
origin_year: -1100
origin_geo:
  lat: 31.0667
  lng: 81.3128
  place_name: 'Mount Kailash & Kingdom of Zhangzhung, Ngari, Western Tibet'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Tönpa Shenrab as the primordial enlightened teacher; the universe governed by the Yungdrung ("unchanging and indestructible" cosmic principle); Dzogchen (Great Perfection) as the recognition of primordial awareness (Rigpa).
  - >-
    Distinctive Practice: Circumambulating holy mountains (Mount Kailash) and stupas in a counter-clockwise direction; casting sacred spirit-catchers (*Dö*); performing sky-burial rituals and smoke offerings (*Sang*).
  - >-
    Core Orientation: Mount Kailash circumambulation, primordial nature of mind (Dzogchen), and ancient Zhangzhung linguistic heritage.
sources:
  - title: 'Per Kvaerne: "The Bon Religion of Tibet: The Iconography of a Living Tradition"'
    url: 'https://www.shambhala.com/'
  - title: 'Samten G. Karmay: "The Arrow and the Spindle: Studies in History, Myths and Rituals in Tibet"'
    url: 'https://brill.com/'
artifacts:
  - title: Mount Kailash (Kang Rinpoche) Sacred Circumambulation Sanctuary
    imageUrl: /artifacts/bon-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Mount_Kailash
    provenance: Ngari Prefecture, Tibet Autonomous Region
    period: Timeless Sacred Geography (Zhangzhung Kingdom origin)
    description: Majestic four-sided pyramid peak revered as the nine-story Yungdrung Mountain and spiritual axis of the universe in Bon cosmology.
  - title: Thangka of Tönpa Shenrab Miwoche (The Primordial Bon Teacher)
    imageUrl: /artifacts/bon-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Tonpa_Shenrab_Miwoche
    provenance: Menri Monastery, Tsang, Tibet
    period: Traditional Horizon
    description: Sacred silk thangka painting depicting Buddha Tönpa Shenrab seated in meditation holding the golden scepter of eternity, surrounded by the peaceful and wrathful Bon deities.
---

# Yungdrung Bon & Indigenous Tibetan Religion

## Historical context
Originating in the ancient western Tibetan kingdom of Zhangzhung before the 7th-century arrival of Indian Buddhism, Bon provided the core rituals, local deities, and sacred geography that shaped the entire culture of the Tibetan plateau.
`
    },

    // 14. Sámi Shamanism
    {
      file: "data/central-asian-siberian/sami-shamanism.md",
      content: `---
id: sami-shamanism
title: Sámi Noaidi Shamanism & Sieidi Cult
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 2000 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The circumpolar indigenous religion of Sápmi (Northern Scandinavia & Kola Peninsula),
  centered on the sacred drum (Gievrie), visionary shamans (Noaidi), and natural sacred stone altars (Sieidi).
canonical_texts:
  - Cosmological painted symbols on Sámi shamanic oval drums (Gievrie / Goavddis)
  - Oral Joik vocal incantations and seasonal migration mythologies
relations:
  - target: shamanic-traditions
    type: branch_of
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -2000
origin_geo:
  lat: 68.8058
  lng: 27.0267
  place_name: 'Inari & Sápmi Sacred Territory, Lapland, Finland'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Radien-attje as supreme sky ruler; Beaivi (the Sun Mother) who brings life to the Arctic tundra; *Sieidi* (distinctively shaped rocks and cliffs) acting as living gateways to animal and ancestor spirits.
  - >-
    Distinctive Practice: Divination and trance journeying using painted reindeer-hide drums (*Gievrie*) with brass ring pointers; offering reindeer antlers, butter, and fish to Sieidi stones; singing *Joik* (musical soul portraits of people, animals, and landscapes).
  - >-
    Core Orientation: Arctic tundra animism, Joik sonic spirituality, and sacred Sieidi stone sanctuaries.
sources:
  - title: 'Håkan Rydving: "The End of Drum-Time: Religious Change among the Lule Saami"'
    url: 'https://www.diva-portal.org/'
  - title: 'Encyclopaedia Britannica: "Sami religion"'
    url: 'https://www.britannica.com/topic/Sami-religion'
artifacts:
  - title: Gievrie (Sámi Oval Sacred Shamanic Drum) with Painted Cosmos
    imageUrl: /artifacts/sami-shamanism-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Sami_shamanism
    provenance: Sápmi (Nordic Museum, Stockholm)
    period: c. 17th–18th century CE
    description: Sacred oval reindeer-hide drum painted in alder bark juice depicting the sun at the center surrounded by reindeer herds, ancestors, and sky gods used by Noaidi priests.
  - title: Monumental Sieidi Sacred Stone Sanctuary in Lapland
    imageUrl: /artifacts/sami-shamanism-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Sieidi
    provenance: Inari / Utsjoki, Lapland, Finland
    period: Prehistoric to Present
    description: Naturally sculpted sacred rock formation overlooking Arctic waterways, venerated with offerings of reindeer antlers to secure fishing and hunting fortune.
---

# Sámi Noaidi Shamanism & Sieidi Cult

## Historical context
As Europe's only recognized indigenous people, the Sámi maintained an Arctic hunting and reindeer pastoralist spirituality across northern Norway, Sweden, Finland, and Russia for millennia, resisting Christianization through hidden Sieidi sites and Joik songs.
`
    },

    // 15. Scythian & Saka Religion
    {
      file: "data/central-asian-siberian/scythian-religion.md",
      content: `---
id: scythian-religion
title: Scythian & Saka Kurgan Religion
cluster: Iranian
color: '#d4a373'
era_start: c. 800 BCE
epistemic_tier: academic_consensus
summary: >-
  The nomadic equestrian religion and royal kurgan mound burial culture of the Eurasian Steppe,
  characterized by gold animal-style sacred art, Tabiti hearth veneration, and horse sacrifices.
canonical_texts:
  - Herodotus (Histories Book IV: Scythian Ethnography)
  - Pazyryk and Issyk Kurgan archaeological gold and textile corpora
relations:
  - target: zoroastrianism
    type: parallel_concept
    certainty: academic_consensus
  - target: shamanic-traditions
    type: branch_of
    certainty: academic_consensus
origin_year: -800
origin_geo:
  lat: 50.5333
  lng: 87.7500
  place_name: 'Pazyryk Valley & Altai Kurgans, Altai Mountains, Siberia'
extinct_year: 300
key_tenets:
  - >-
    Foundational Doctrine: Tabiti (Queen of the Hearth Fire) as supreme deity; Papaios (Sky Father) and Api (Earth Mother); veneration of the sacred iron sword (*Akinakes*) as avatar of the War God.
  - >-
    Distinctive Practice: Burial of royalty in frozen log-cabin kurgan mounds accompanied by sacrificed horses in gold-gilded antler headdresses; inhaling purified cannabis smoke inside felt tents during funerary purification; creating dynamic Animal Style gold jewelry depicting predators locked in combat.
  - >-
    Core Orientation: Nomadic equestrian metallurgy, royal kurgan mound burials, and sacred hearth fire theologies.
sources:
  - title: 'British Museum: "Scythians: warriors of ancient Siberia"'
    url: 'https://www.britishmuseum.org/exhibitions/scythians-warriors-ancient-siberia'
  - title: 'Barry Cunliffe: "The Scythians: Nomad Warriors of the Steppe"'
    url: 'https://global.oup.com/'
artifacts:
  - title: Royal Scythian Golden Pectoral from Tovsta Mohyla
    imageUrl: /artifacts/scythian-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Scythians
    provenance: Tovsta Mohyla Kurgan, Dnipro, Ukraine (Historical Treasures Museum Kyiv)
    period: c. 4th century BCE
    description: Masterpiece 24-karat gold royal breastplate depicting the three realms of the Scythian cosmos: mythological griffins attacking stags, pastoral domestic life, and sacred flora.
  - title: Pazyryk Felt Carpet with Goddess and Mounted Knight
    imageUrl: /artifacts/scythian-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Pazyryk_burials
    provenance: Pazyryk Kurgan 5, Altai Mountains, Siberia (State Hermitage Museum)
    period: c. 4th–3rd century BCE
    description: Preserved permafrost felt wall hanging depicting an enthroned Scythian goddess holding the sacred Tree of Life while receiving a mounted warrior in ceremonial salute.
---

# Scythian & Saka Kurgan Religion

## Historical context
Stretching across thousands of miles from Ukraine to Mongolia, the Scythian and Saka nomads dominated the Eurasian Steppes during the Iron Age, pioneering mounted archery and leaving behind magnificent gold-filled burial mounds (kurgans).
`
    },

    // 16. Khmer Angkorian Devaraja Cult
    {
      file: "data/southeast-asian-mainland/khmer-devaraja-cult.md",
      content: `---
id: khmer-devaraja-cult
title: Khmer Angkorian Devaraja (God-King) Religion
cluster: Dharmic
color: '#ff8a3d'
era_start: c. 802 CE
epistemic_tier: academic_consensus
summary: >-
  The monumental imperial state religion of the Khmer Empire at Angkor, synthesizing Shaivite
  and Mahayana cosmology into the divine cult of the Universal Monarch (Chakravartin).
canonical_texts:
  - Sdok Kok Thom Stele inscription (origin of the Devaraja rite)
  - Bas-relief epigraphy of the Churning of the Ocean of Milk (Angkor Wat)
relations:
  - target: hinduism
    type: branch_of
    certainty: academic_consensus
  - target: shaivism
    type: branch_of
    certainty: academic_consensus
  - target: mahayana-buddhism
    type: syncretized_with
    certainty: academic_consensus
origin_year: 802
origin_geo:
  lat: 13.4125
  lng: 103.8670
  place_name: 'Angkor Wat & Bayon, Siem Reap, Cambodia'
extinct_year: 1431
key_tenets:
  - >-
    Foundational Doctrine: The King as *Devaraja* (earthly manifestation of Shiva or the Bodhisattva Lokeshvara); temple-mountains engineered as physical microcosms of Mount Meru surrounded by the cosmic oceans.
  - >-
    Distinctive Practice: Daily lingam libations in central sanctuary towers; monumental stone carving of the *Churning of the Ocean of Milk* (*Samudra Manthan*); constructing massive Baray hydrological reservoirs for spiritual purification and agro-imperial prosperity.
  - >-
    Core Orientation: Monumental temple-mountain sandstone architecture, Mount Meru hydrology, and divine royal apotheosis.
sources:
  - title: 'George Coedès: "The Indianized States of Southeast Asia"'
    url: 'https://uhpress.hawaii.edu/'
  - title: 'UNESCO World Heritage: Angkor'
    url: 'https://whc.unesco.org/en/list/668/'
artifacts:
  - title: Angkor Wat (Temple of Vishnu & Cosmic Mountain of Meru)
    imageUrl: /artifacts/khmer-devaraja-cult-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Angkor_Wat
    provenance: Siem Reap Province, Cambodia
    period: c. 1113–1150 CE (Reign of Suryavarman II)
    description: The largest religious monument in the world, engineered with five lotus-shaped towers representing the peaks of Mount Meru and enclosed by a massive moat representing the cosmic ocean.
  - title: Bayon Temple 216 Serene Bodhisattva Face Towers
    imageUrl: /artifacts/khmer-devaraja-cult-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Bayon
    provenance: Angkor Thom, Cambodia
    period: c. late 12th century CE (Reign of Jayavarman VII)
    description: Masterpiece state temple of Jayavarman VII featuring 54 Gothic-style sandstone towers carved with over 200 smiling colossal faces of the Bodhisattva of Compassion Avalokiteshvara.
---

# Khmer Angkorian Devaraja (God-King) Religion

## Historical context
Initiated by Jayavarman II on Mount Kulen in 802 CE, the Khmer Empire transformed mainland Southeast Asia through monumental temple construction and advanced water engineering, leaving behind the architectural wonder of Angkor.
`
    },

    // 17. Tai Folk Religion (Satsana Phi)
    {
      file: "data/southeast-asian-mainland/tai-folk-religion.md",
      content: `---
id: tai-folk-religion
title: Satsana Phi & Tai-Lao Spirit House Traditions
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 500 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The indigenous animist and spirit-veneration religion of the Tai peoples (Lao, Thai, Shan, Tai Dam),
  centered on territorial and ancestral spirits (Phi), spirit houses (San Phra Phum), and Mo Phi mediums.
canonical_texts:
  - Khun Borom myth of origin and gourd of creation
  - Su Kwan (Calling of the Soul) oral ritual poetry
relations:
  - target: theravada-buddhism
    type: syncretized_with
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -500
origin_geo:
  lat: 19.8956
  lng: 102.1384
  place_name: 'Luang Prabang & Chiang Mai, Upper Mekong Basin, Laos/Thailand'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: The 32 *Kwan* (vital soul essences) residing in the human body; the world co-inhabited by *Phi* (ancestral, territorial, village, and nature spirits) who require respect and offerings.
  - >-
    Distinctive Practice: Constructing miniature elevated spirit houses (*San Phra Phum* and *San Chao Thi*) with daily incense and floral offerings; the *Baci / Su Kwan* thread-tying ceremony to bind vital souls; mediumship by *Mo Phi* healers.
  - >-
    Core Orientation: Spirit house miniature architecture, 32 Kwan soul binding, and harmonious territorial spirit coexistence.
sources:
  - title: 'S. J. Tambiah: "Buddhism and the Spirit Cults in North-East Thailand"'
    url: 'https://www.cambridge.org/'
  - title: 'Grant Evans: "Lao Peasants under Socialism & Spirit Cults"'
    url: 'https://yalebooks.yale.edu/'
artifacts:
  - title: San Phra Phum (Guardian Spirit House Shrine)
    imageUrl: /artifacts/tai-folk-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Spirit_house
    provenance: Chiang Mai & Bangkok, Thailand
    period: Living Traditional Horizon
    description: Elaborate carved wooden temple miniature erected on a pedestal outside homes and temples, providing an honorable dwelling place for local territorial spirits (Phra Phum).
  - title: Wat Xieng Thong Ancestral Tree of Life Mosaic Sanctuary
    imageUrl: /artifacts/tai-folk-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Wat_Xieng_Thong
    provenance: Luang Prabang, Laos
    period: c. 1560 CE
    description: Royal temple sanctuary featuring the famous glass mosaic of the Tree of Life on its rear wall, embodying the synthesis between Theravada Buddhism and ancient Lao spirit cosmology.
---

# Satsana Phi & Tai-Lao Spirit House Traditions

## Historical context
Predating the arrival of Buddhism in mainland Southeast Asia, Satsana Phi remains the foundational everyday spiritual reality for millions of Thai, Lao, and Shan communities, co-existing seamlessly alongside Theravada monasticism.
`
    },

    // 18. Vietnamese Đạo Mẫu
    {
      file: "data/southeast-asian-mainland/dao-mau-vietnam.md",
      content: `---
id: dao-mau-vietnam
title: Đạo Mẫu & Vietnamese Mother Goddess Religion
cluster: East Asian
color: '#e05353'
era_start: c. 15th century CE to Present
epistemic_tier: academic_consensus
summary: >-
  The indigenous matriarchal religion of Vietnam centered on the Three and Four Palaces (Tam Phủ / Tứ Phủ),
  venerating Mother Goddesses through elaborate trance spirit possession rituals (Lên Đồng).
canonical_texts:
  - Truyền kỳ mạn lục (Collection of Strange Tales) by Nguyễn Dữ
  - Chầu văn sacred liturgical song corpus
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
origin_year: 1400
origin_geo:
  lat: 20.3500
  lng: 106.1000
  place_name: 'Phủ Giầy & Phủ Tây Hồ, Nam Định & Hanoi, Red River Delta, Vietnam'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Veneration of Holy Mother Liễu Hạnh and the Mother Goddesses of the Four Realms: Sky (Heavenly Realm), Earth (Maternal Earth), Water (Aquatic Realm), and Mountains/Forests (Highland Realm).
  - >-
    Distinctive Practice: The *Lên Đồng* spirit possession ritual where spirit mediums (*Đồng Thầy*) don vibrant silk ceremonial robes to channel spirits, dancing with swords and distributing blessed fortune items (*Lộc*) accompanied by *Chầu Văn* singing.
  - >-
    Core Orientation: Sacred female cosmology (Four Palaces), Lên Đồng theatrical spirit mediumship, and Red River Delta matriarchal worship.
sources:
  - title: 'UNESCO Intangible Cultural Heritage: Practices related to the Viet beliefs in the Mother Goddesses of Three Realms'
    url: 'https://ich.unesco.org/en/RL/practices-related-to-the-viet-beliefs-in-the-mother-goddesses-of-three-realms-01064'
  - title: 'Philip Taylor: "Goddess on the Rise: Pilgrimage and Popular Religion in Vietnam"'
    url: 'https://uhpress.hawaii.edu/'
artifacts:
  - title: Lên Đồng Spirit Medium Possession Ceremony in Red Robes
    imageUrl: /artifacts/dao-mau-vietnam-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/%C4%90%E1%BA%A1o_M%E1%BA%ABu
    provenance: Hanoi, Red River Delta, Vietnam (UNESCO Inscribed)
    period: Living Heritage Horizon
    description: Spirit medium channeling the Mother Goddess of the Sky in ceremonial red robes and headdress, surrounded by ritual musicians and disciples during a seasonal festival.
  - title: Phủ Tây Hồ Mother Goddess Sanctuary on West Lake
    imageUrl: /artifacts/dao-mau-vietnam-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Ph%E1%BB%A7_T%C3%A2y_H%E1%BB%93
    provenance: West Lake, Hanoi, Vietnam
    period: c. 16th century CE to Present
    description: Sacred temple sanctuary on the peninsula of West Lake dedicated to Princess Liễu Hạnh, one of the Four Immortals of Vietnamese mythology.
---

# Đạo Mẫu & Vietnamese Mother Goddess Religion

## Historical context
Developing along the agricultural flatlands of the Red River Delta, Đạo Mẫu reflects Vietnam's ancient indigenous matriarchal roots, celebrating female spiritual power and protection against national and personal adversity.
`
    },

    // 19. Burmese Nat Worship
    {
      file: "data/southeast-asian-mainland/burmese-nat-worship.md",
      content: `---
id: burmese-nat-worship
title: Burmese Nat Worship & Mount Popa Sanctuaries
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 849 CE to Present
epistemic_tier: academic_consensus
summary: >-
  The pantheon of 37 Great Royal Nats (spirits) in Myanmar, venerated through ecstatic festivals,
  spirit mediums (Nat-kadaw), and the volcanic pilgrimage mountain of Mount Popa.
canonical_texts:
  - The Royal Chronicle of the 37 Nats (established under King Anawrahta of Bagan)
  - Mahagiri Nat spirit epics
relations:
  - target: theravada-buddhism
    type: syncretized_with
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: 849
origin_geo:
  lat: 20.9197
  lng: 95.2500
  place_name: 'Mount Popa & Ancient City of Bagan, Mandalay Region, Myanmar'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: The 37 Great Royal Nats—human historical figures who died sudden, tragic, or heroic deaths and achieved protective spirit status over landscapes, towns, and families under the supreme authority of the Buddha.
  - >-
    Distinctive Practice: The annual Mount Popa spirit festival where thousands climb the volcanic plug; ecstatic dancing by *Nat-kadaw* (spirit spouses / mediums) accompanied by *Hsaing Waing* percussion orchestras; keeping coconut offerings to Lord Mahagiri in household kitchens.
  - >-
    Core Orientation: Volcanic mountain sanctuaries, royal ancestral spirit pacification, and mediumistic trance festivals.
sources:
  - title: 'Melford E. Spiro: "Burmese Supernaturalism: A Study in the Explanation and Reduction of Suffering"'
    url: 'https://www.routledge.com/'
  - title: 'UNESCO World Heritage: Bagan'
    url: 'https://whc.unesco.org/en/list/1588/'
artifacts:
  - title: Mount Popa Taung Kalat Volcanic Monastery Sanctuary
    imageUrl: /artifacts/burmese-nat-worship-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Mount_Popa
    provenance: Myingyan District, Mandalay Region, Myanmar
    period: Classical Bagan Horizon
    description: Towering volcanic plug rising 2,400 feet above the dry plains, revered as the sacred dwelling of the 37 Great Nats and crowned with gold Buddhist stupas.
  - title: Shrine of the 37 Great Nats at Shwezigon Pagoda
    imageUrl: /artifacts/burmese-nat-worship-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Nat_(spirit)
    provenance: Bagan, Myanmar
    period: c. 1059 CE (Reign of King Anawrahta)
    description: Elaborately painted and gilded wooden sculptures representing the 37 royal guardian Nats placed within the Shwezigon Pagoda compound by King Anawrahta to integrate spirit worship with Buddhism.
---

# Burmese Nat Worship & Mount Popa Sanctuaries

## Historical context
When King Anawrahta unified Myanmar under Theravada Buddhism in the 11th century, he recognized that the ancient indigenous belief in Nats could not be suppressed. Instead, he codified the 37 Great Nats as guardian protectors of the Buddhist faith.
`
    }
  ];

  for (const node of nodes) {
    await writeFile(node.file, node.content, "utf8");
    console.log(`✅ Created Global Pillar node: ${node.file}`);
  }

  console.log("🎉 Complete Global Regional Pillars Population!");
}

run().catch(console.error);
