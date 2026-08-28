import { writeFile } from "node:fs/promises";
import { createWriteStream, existsSync, statSync } from "node:fs";
import https from "node:https";

function download(url, dest) {
  return new Promise(res => {
    https.get(url, { headers: { "User-Agent": "OpenGrailAtlasScholar/10.0 (calix@calmdownoscar.com)" } }, r => {
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
  const images = [
    ["maros-sulawesi-cave-art-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Leang-Leang_pig_deer.jpg/960px-Leang-Leang_pig_deer.jpg"],
    ["maros-sulawesi-cave-art-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Leang_Timpuseng_hand_stencil.jpg/960px-Leang_Timpuseng_hand_stencil.jpg"],
    ["balinese-hinduism-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pura_Besakih_Mother_Temple_Bali.jpg/960px-Pura_Besakih_Mother_Temple_Bali.jpg"],
    ["balinese-hinduism-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Pura_Ulun_Danu_Bratan_Bedugul_Bali_Indonesia.jpg/960px-Pura_Ulun_Danu_Bratan_Bedugul_Bali_Indonesia.jpg"],
    ["anitism-philippine-religion-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Manunggul_Jar_National_Museum_Manila.jpg/960px-Manunggul_Jar_National_Museum_Manila.jpg"],
    ["anitism-philippine-religion-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ifugao_Bulul_Wood_Statues.jpg/960px-Ifugao_Bulul_Wood_Statues.jpg"],
    ["kejawen-javanese-mysticism-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Prambanan_Temple_Yogyakarta.jpg/960px-Prambanan_Temple_Yogyakarta.jpg"],
    ["kejawen-javanese-mysticism-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Wayang_Kulit_Shadow_Puppet_Java.jpg/960px-Wayang_Kulit_Shadow_Puppet_Java.jpg"],
    ["aluk-todolo-toraja-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Kete_Kesu_Toraja_Tongkonan_Sulawesi.jpg/960px-Kete_Kesu_Toraja_Tongkonan_Sulawesi.jpg"],
    ["aluk-todolo-toraja-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Toraja_Tau_Tau_Cliff_Effigies.jpg/960px-Toraja_Tau_Tau_Cliff_Effigies.jpg"],
    ["ifugao-bulul-traditions-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Batad_rice_terraces_in_Ifugao_Philippines.jpg/960px-Batad_rice_terraces_in_Ifugao_Philippines.jpg"],
    ["ifugao-bulul-traditions-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Bulul_guardian_figure_Philippines.jpg/960px-Bulul_guardian_figure_Philippines.jpg"]
  ];

  for (const [name, url] of images) {
    await download(url, `public/artifacts/${name}`);
  }

  const nodes = [
    {
      file: "data/oceanic-australasian/maros-sulawesi-cave-art.md",
      content: `---
id: maros-sulawesi-cave-art
title: Sulawesi & Maros-Pangkep Paleolithic Sanctuaries
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 45,500 BCE
epistemic_tier: academic_consensus
summary: >-
  The world's oldest known figurative parietal art and hunting narrative scenes,
  created by Pleistocene hunter-gatherers in South Sulawesi.
canonical_texts:
  - Parietal archaeological galleries (Leang Tedongnge, Leang Bulu' Sipong 4, Leang Timpuseng)
  - Uranium-series dated Pleistocene ochre pigment corpora
relations:
  - target: upper-paleolithic-shamanism
    type: parallel_concept
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: australian-aboriginal-religions
    type: parallel_concept
    certainty: academic_consensus
origin_year: -45500
origin_geo:
  lat: -4.9819
  lng: 119.6469
  place_name: 'Maros-Pangkep Karst, South Sulawesi, Indonesia'
extinct_year: -8000
key_tenets:
  - >-
    Foundational Doctrine: Earliest recorded depiction of therianthropic beings (part-human, part-animal figures) engaged in hunting endemic warty pigs and dwarf buffaloes (anoa), evidencing shamanic metamorphosis and religious mythmaking.
  - >-
    Distinctive Practice: Hand stenciling with pulverized red ochre in limestone karst shelters and painting large narrative compositions in elevated, inaccessible cliff chambers.
  - >-
    Core Orientation: Maritime Southeast Asian Pleistocene shamanism and the world's oldest figurative art.
sources:
  - title: 'Nature: "Earliest hunting scene in prehistoric art discovered in Sulawesi"'
    url: 'https://www.nature.com/articles/s41586-019-1806-y'
  - title: 'Griffith University Archaeology: Sulawesi Cave Discoveries'
    url: 'https://www.griffith.edu.au/'
artifacts:
  - title: Leang Tedongnge Warty Pig & Therianthrope Mural
    imageUrl: /artifacts/maros-sulawesi-cave-art-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Rock_art_of_South_Sulawesi
    provenance: Maros-Pangkep Karst, South Sulawesi, Indonesia
    period: c. 45,500 BCE (Uranium-series dated)
    description: The world's oldest known figurative painting of an animal, depicting a Sulawesi warty pig rendered in red ochre with anatomical precision.
  - title: Leang Timpuseng Sacred Hand Stencils
    imageUrl: /artifacts/maros-sulawesi-cave-art-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Rock_art_of_South_Sulawesi
    provenance: Leang Timpuseng Cave, South Sulawesi, Indonesia
    period: c. 39,900 BCE
    description: Prehistoric hand stencils created by blowing pulverized ochre over human hands against limestone walls, marking ritual presence in the sanctuary.
---

# Sulawesi & Maros-Pangkep Paleolithic Sanctuaries

## Historical context
Dating back at least 45,500 years in the limestone karst hills of Maros-Pangkep, South Sulawesi, Indonesian rock art predates European cave art and demonstrates that complex narrative religious storytelling and therianthropic shamanism emerged simultaneously in Wallacea and Sundaland.
`
    },
    {
      file: "data/oceanic-australasian/balinese-hinduism.md",
      content: `---
id: balinese-hinduism
title: Balinese Hinduism (Agama Hindu Dharma)
cluster: Dharmic
color: '#ff8a3d'
era_start: c. 8th century CE
epistemic_tier: academic_consensus
summary: >-
  Distinctive syncretic Indonesian Hindu tradition blending Vedic-Shaivite cosmology,
  Buddhist philosophy, Tri Hita Karana harmony, and indigenous ancestral water sanctuaries.
canonical_texts:
  - Sanghyang Kamahayanikan
  - Kakawin Sutasoma
  - Lontar palm-leaf manuscripts (Usana Bali, Babad Buleleng)
relations:
  - target: hinduism
    type: branch_of
    certainty: academic_consensus
  - target: animist-frameworks
    type: influenced_by
    certainty: academic_consensus
  - target: shaivism
    type: branch_of
    certainty: academic_consensus
origin_year: 750
origin_geo:
  lat: -8.3739
  lng: 115.4509
  place_name: 'Pura Besakih, Mount Agung, Bali, Indonesia'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Acintya (Sang Hyang Widhi Wasa) as the supreme transcendent nondual Godhead, manifest through the Trimurti and sacred ancestral spirits (Pitara).
  - >-
    Distinctive Practice: Tri Hita Karana (harmony between humans, nature, and the divine), Subak communal water irrigation temple networks (Tirtha), Galungan and Kuningan festivals celebrating the triumph of Dharma over Adharma, and elaborate cremation rites (Ngaben).
  - >-
    Core Orientation: Holy water liturgy (Agama Tirtha), multi-tiered pagoda shrines (Meru), and sacred ancestral temple geography.
sources:
  - title: 'Encyclopaedia Britannica: "Balinese Hinduism"'
    url: 'https://www.britannica.com/topic/Balinese-religion'
  - title: 'UNESCO World Heritage: Cultural Landscape of Bali Province: the Subak System'
    url: 'https://whc.unesco.org/en/list/1194/'
artifacts:
  - title: Pura Besakih (The Mother Temple of Bali) on Mount Agung
    imageUrl: /artifacts/balinese-hinduism-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Pura_Besakih
    provenance: Mount Agung, Karangasem, Bali, Indonesia
    period: c. 10th century CE to Present
    description: The grandest and holiest sanctuary complex in Bali, built across terraced slopes with multi-tiered thatched Meru shrines dedicated to Shiva, Vishnu, and Brahma.
  - title: Pura Ulun Danu Bratan Water Temple Sanctuary
    imageUrl: /artifacts/balinese-hinduism-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Pura_Ulun_Danu_Bratan
    provenance: Lake Bratan, Bedugul, Bali, Indonesia
    period: c. 1633 CE
    description: Sacred lakeside water temple dedicated to Dewi Danu, goddess of rivers and lakes, central to Bali's ancient Subak agricultural irrigation network.
---

# Balinese Hinduism (Agama Hindu Dharma)

## Historical context
Following the arrival of Indian maritime traders, scholars, and Brahmins in the first millennium CE, Indonesian kingdoms synthesized Shaivite Hinduism and Mahayana Buddhism with indigenous Austronesian ancestor veneration. Following the fall of the Majapahit Empire in Java in the 16th century, priests, royals, and artisans relocated to Bali, preserving and cultivating this unique tradition.
`
    },
    {
      file: "data/oceanic-australasian/anitism-philippine-religion.md",
      content: `---
id: anitism-philippine-religion
title: Anitism & Philippine Indigenous Traditions
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 1000 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  The overarching ancestral religion of pre-colonial Philippine ethnic groups, centered
  on Bathala, nature deities, ancestor spirits (Anito), and female shamanic leadership (Babaylan).
canonical_texts:
  - Oral epics (Biag ni Lam-ang, Hinilawod, Darangen)
  - Pre-colonial Tagalog, Visayan, and Bikol mythological corpora
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
  - target: ifugao-bulul-traditions
    type: parallel_concept
    certainty: academic_consensus
origin_year: -1000
origin_geo:
  lat: 14.5995
  lng: 120.9842
  place_name: 'Manila & Central Luzon, Philippines'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Bathala (or Maykapal / Gugurang / Kan-Laon) as the supreme celestial creator, governing a cosmos inhabited by ancestral guardian spirits (*Anito* / *Diwata*) and elemental nature powers.
  - >-
    Distinctive Practice: Ritual intercession by female spiritual leaders (*Babaylan* or *Katalonan*), Pag-anito spirit offering feasts, carving of wooden sacred guardian effigies (*Likha* or *Taotao*), and secondary jar burials.
  - >-
    Core Orientation: Communal reciprocity with ancestor spirits and environmental guardianship across the Philippine archipelago.
sources:
  - title: 'National Museum of the Philippines: Archaeology & Ethnology'
    url: 'https://www.nationalmuseum.gov.ph/'
  - title: 'F. Landa Jocano: "Philippine Prehistory and Mythology"'
    url: 'https://en.wikipedia.org/wiki/Indigenous_Philippine_folk_religions'
artifacts:
  - title: Manunggul Secondary Burial Jar (Spirit Boat to Afterlife)
    imageUrl: /artifacts/anitism-philippine-religion-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Manunggul_Jar
    provenance: Manunggul Cave, Palawan, Philippines (National Museum Manila)
    period: c. 890–710 BCE (Neolithic)
    description: Masterpiece Neolithic secondary burial jar whose lid features two carved boatmen navigating a spirit canoe with carved prow to the ancestral afterlife.
  - title: Carved Wooden Bulul & Likha Ancestor Effigies
    imageUrl: /artifacts/anitism-philippine-religion-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Bulul
    provenance: Northern Luzon, Philippines
    period: Traditional Pre-Colonial Horizon
    description: Sacred carved wooden anthropomorphic figures representing guardian ancestors and rice deities, anointed with sacred oil during communal rituals.
---

# Anitism & Philippine Indigenous Traditions

## Historical context
Prior to Spanish colonization in the 16th century and Islamic contact in the 14th century, the hundreds of ethnolinguistic groups across the Philippine archipelago practiced Anitism—a cohesive yet decentralized tradition honoring ancestral spirits (Anito) and celestial balance under the spiritual guidance of Babaylan shamans.
`
    },
    {
      file: "data/oceanic-australasian/kejawen-javanese-mysticism.md",
      content: `---
id: kejawen-javanese-mysticism
title: Kejawen & Javanese Mystical Philosophy (Kebatinan)
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 14th century CE to Present
epistemic_tier: academic_consensus
summary: >-
  The indigenous mystical, cosmological, and moral worldview of Java, integrating
  Austronesian ancestral beliefs, Hindu-Buddhist metaphysics, and Sufi Islamic mysticism.
canonical_texts:
  - Serat Centhini
  - Serat Wedhatama by Mangkunegara IV
  - Babad Tanah Jawi
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: sufi-orders
    type: influenced_by
    certainty: academic_consensus
  - target: balinese-hinduism
    type: parallel_concept
    certainty: academic_consensus
origin_year: 1400
origin_geo:
  lat: -7.7971
  lng: 110.3705
  place_name: 'Kraton Ngayogyakarta Hadiningrat, Yogyakarta, Java, Indonesia'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Sangkan Paraning Dumadi ("The origin and destination of all creation") and Manunggaling Kawula Gusti ("The mystical unity of servant and God").
  - >-
    Distinctive Practice: Tapa brata (ascetic meditation), Slametan communal sacred feasts of harmony, Wayang Kulit shadow puppet allegories of spiritual struggle, and reverence for Nyai Roro Kidul (Queen of the Southern Sea).
  - >-
    Core Orientation: Inner spiritual cultivation (Batin), cosmic equilibrium, and refined moral etiquette (Budi Pekerti).
sources:
  - title: 'Clifford Geertz: "The Religion of Java"'
    url: 'https://en.wikipedia.org/wiki/The_Religion_of_Java'
  - title: 'Niels Mulder: "Mysticism and Everyday Life in Contemporary Java"'
    url: 'https://brill.com/'
artifacts:
  - title: Prambanan Shiva-Trimurti Temple Complex
    imageUrl: /artifacts/kejawen-javanese-mysticism-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Prambanan
    provenance: Special Region of Yogyakarta, Java, Indonesia
    period: c. 850 CE (Mataram Kingdom)
    description: 9th-century monumental Hindu temple compound dedicated to the Trimurti, illustrating the classical Javanese cosmological synthesis that informed Kejawen philosophy.
  - title: Wayang Kulit Sacred Shadow Puppetry & Gunungan (Tree of Life)
    imageUrl: /artifacts/kejawen-javanese-mysticism-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Wayang
    provenance: Surakarta & Yogyakarta Sultanate Courts, Java, Indonesia
    period: Classical Horizon (UNESCO Intangible Cultural Heritage)
    description: Masterpiece buffalo-hide shadow puppet representing the Gunungan (Cosmic Mountain / Tree of Life) used by Dalang puppeteers to open and close philosophical epics.
---

# Kejawen & Javanese Mystical Philosophy (Kebatinan)

## Historical context
Kejawen represents the enduring spiritual essence of Java. Rather than being displaced by incoming world religions, Javanese thought absorbed and transmuted Hinduism, Buddhism, and Sufi Islam into a unified mystical tradition practiced in royal palaces (kraton) and rural villages alike.
`
    },
    {
      file: "data/oceanic-australasian/aluk-todolo-toraja.md",
      content: `---
id: aluk-todolo-toraja
title: Aluk Todolo & Torajan Mortuary Religion
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 500 CE to Present
epistemic_tier: academic_consensus
summary: >-
  The ancestral religion of the Toraja people in Sulawesi, world-renowned for elaborate
  multi-day mortuary rituals, megalithic cliff tombs, and boat-roofed Tongkonan houses.
canonical_texts:
  - Oral priesthood chants (Tominaa liturgy)
  - Singgi' ancestral genealogical verses
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: ancestor-veneration
    type: branch_of
    certainty: academic_consensus
origin_year: 500
origin_geo:
  lat: -3.0533
  lng: 119.8631
  place_name: 'Kete Kesu, Rantepao, Tana Toraja, South Sulawesi, Indonesia'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Puang Matua as the supreme creator deity, presiding over three interconnected realms: the Upper Sky Realm, the Earth, and the Underworld (Puya).
  - >-
    Distinctive Practice: Rambu Solo (grand mortuary feasts where water buffaloes are sacrificed to carry souls to Puya), placing coffins in limestone cliff tombs (Loko'), carving wooden life-sized ancestor effigies (*Tau-tau*), and maintaining sacred kinship houses (*Tongkonan*).
  - >-
    Core Orientation: Strict ancestral mortuary ritual protocol, buffalo cosmology, and cliffside tomb sanctuaries.
sources:
  - title: 'UNESCO Tentative List: Tana Toraja Traditional Settlement'
    url: 'https://whc.unesco.org/en/tentativelists/5462/'
  - title: 'Kathleen Adams: "Art as Politics: Re-crafting Identities, Tourism, and Power in Tana Toraja"'
    url: 'https://en.wikipedia.org/wiki/Toraja'
artifacts:
  - title: Kete Kesu Tongkonan Ancestral Clan Houses & Grain Sanctuaries
    imageUrl: /artifacts/aluk-todolo-toraja-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Kete_Kesu
    provenance: Tana Toraja, South Sulawesi, Indonesia
    period: Classical Horizon
    description: Sacred ancestral Tongkonan clan houses featuring sweeping boat-shaped saddleback roofs adorned with buffalo horns representing nobility and spiritual rank.
  - title: Tau-Tau Ancestral Wooden Effigies on Cliff Balconies
    imageUrl: /artifacts/aluk-todolo-toraja-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Tau_tau
    provenance: Londa & Kete Kesu Rock Cliffs, Tana Toraja, Indonesia
    period: Traditional Mortuary Horizon
    description: Carved wooden effigies of deceased elders dressed in traditional ceremonial attire, gazing out from cliffside rock balconies to protect living descendants.
---

# Aluk Todolo & Torajan Mortuary Religion

## Historical context
Maintained by the Toraja highlanders in the rugged mountains of South Sulawesi, Aluk Todolo ("the way of the ancestors") preserves one of the most intact Austronesian megalithic mortuary traditions in the world.
`
    },
    {
      file: "data/oceanic-australasian/ifugao-bulul-traditions.md",
      content: `---
id: ifugao-bulul-traditions
title: Ifugao Bulul Traditions & Hudhud Chants
cluster: Indigenous & Diasporic
color: '#b48655'
era_start: c. 500 BCE to Present
epistemic_tier: academic_consensus
summary: >-
  Highland Philippine agricultural religion centered on carved wooden granary guardian
  figures (Bulul), ancestral rice terrace rituals, and UNESCO-inscribed Hudhud oral epics.
canonical_texts:
  - Hudhud ni Aliguyon oral epic chants
  - Alim ritual chants
relations:
  - target: anitism-philippine-religion
    type: branch_of
    certainty: academic_consensus
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
origin_year: -500
origin_geo:
  lat: 16.9208
  lng: 121.0583
  place_name: 'Banaue & Batad Rice Terraces, Ifugao, Luzon, Philippines'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Veneration of rice spirits (*Inuparda*) and ancestral terrace guardians through carved sacred wooden deities (*Bulul*) representing the harmonious fertility of human labor and mountain water.
  - >-
    Distinctive Practice: Recitation of epic *Hudhud* chants by elder women during harvest and funerary vigils; consecration of Bulul figures by Mumbaki priests through pig blood offerings; maintenance of 2,000-year-old stone-walled rice terraces.
  - >-
    Core Orientation: Sacred agro-ecological mountain terrace stewardship and oral epic memory.
sources:
  - title: 'UNESCO Intangible Cultural Heritage: Hudhud chants of the Ifugao'
    url: 'https://ich.unesco.org/en/RL/hudhud-chants-of-the-ifugao-00015'
  - title: 'UNESCO World Heritage: Rice Terraces of the Philippine Cordilleras'
    url: 'https://whc.unesco.org/en/list/722/'
artifacts:
  - title: Batad & Banaue Ancient Rice Terraces Sanctuary Landscape
    imageUrl: /artifacts/ifugao-bulul-traditions-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Rice_Terraces_of_the_Philippine_Cordilleras
    provenance: Banaue & Batad, Ifugao, Luzon, Philippines
    period: c. 500 BCE to Present (UNESCO World Heritage)
    description: 2,000-year-old mountain terrace engineering following the natural contours of the Cordillera Central, constructed as a living sacred landscape under the guardianship of rice deities.
  - title: Seated Bulul Rice Guardian Deity Carving
    imageUrl: /artifacts/ifugao-bulul-traditions-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Bulul
    provenance: Cordillera Central, Northern Luzon, Philippines
    period: Traditional Horizon
    description: Carved wooden granary guardian figure bathed in sacred offering oils, seated in a protective meditative posture to safeguard rice crops from spiritual and physical decay.
---

# Ifugao Bulul Traditions & Hudhud Chants

## Historical context
Constructed in the rugged Cordillera mountain range of northern Luzon over two millennia, the Ifugao rice terrace culture maintained absolute independence from foreign colonial rule, preserving its sacred agricultural rites, Mumbaki priesthood, and epic Hudhud poetry intact.
`
    }
  ];

  for (const node of nodes) {
    await writeFile(node.file, node.content, "utf8");
    console.log(`✅ Created Maritime Southeast Asia tradition: ${node.file}`);
  }

  console.log("🎉 Complete Maritime Southeast Asia population!");
}

run().catch(console.error);
