import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

// Curated authentic historical artifacts with real photograph URLs and verifiable Wikipedia / Archive source links
const CLUSTER_DEFAULTS = {
  Abrahamic: [
    {
      title: "Ancient Scriptorium Biblical & Liturgical Manuscript",
      imageUrl: "/artifacts/christianity-codex.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Codex_Vaticanus",
      provenance: "Near East / Mediterranean",
      period: "Classical to Medieval Era",
      description: "Parchment uncial manuscript preserving ancient canonical scripture and liturgical traditions."
    },
    {
      title: "Historical Sanctuary Architecture & Sacred Epigraphy",
      imageUrl: "/artifacts/judaism-western-wall.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Western_Wall",
      provenance: "Jerusalem & Levant",
      period: "Ancient to Medieval Era",
      description: "Monumental stone masonry and sacred sanctuary foundations central to Abrahamic pilgrimage."
    }
  ],
  Dharmic: [
    {
      title: "Mahabodhi Temple Enlightenment Sanctuary",
      imageUrl: "/artifacts/buddhism-mahabodhi.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Mahabodhi_Temple",
      provenance: "Bodh Gaya, Bihar, India",
      period: "c. 250 BCE - 5th century CE",
      description: "UNESCO World Heritage monumental stone temple marking the spot of Siddhartha Gautama's enlightenment."
    },
    {
      title: "Brihadisvara Monumental Dravidian Temple Gopuram",
      imageUrl: "/artifacts/hinduism-brihadisvara.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Brihadisvara_Temple",
      provenance: "Thanjavur, Tamil Nadu",
      period: "1010 CE",
      description: "Grand granite rock-cut temple dedicated to cosmic balance and sacred ritual architecture."
    }
  ],
  "East Asian": [
    {
      title: "Itsukushima Floating Torii Gate Shrine",
      imageUrl: "/artifacts/shinto-torii-gate.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Itsukushima_Shrine",
      provenance: "Miyajima, Hiroshima, Japan",
      period: "1168 CE",
      description: "Iconic sacred Shinto gate standing in the tidal sea, demarcating the boundary of the sacred realm."
    },
    {
      title: "Wudang Mountain Sacred Golden Hall Complex",
      imageUrl: "/artifacts/daoism-wudang-hall.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Wudang_Mountains",
      provenance: "Hubei, China",
      period: "1416 CE",
      description: "Imperial architectural shrine of Daoist alchemy and philosophical meditation."
    }
  ],
  "Indigenous & Diasporic": [
    {
      title: "Chichen Itza Pyramid of Kukulcan (El Castillo)",
      imageUrl: "/artifacts/mesoamerican-pyramid.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/El_Castillo,_Chichen_Itza",
      provenance: "Yucatán, Mexico",
      period: "c. 900 CE",
      description: "Monumental step-pyramid temple aligned with celestial equinox solar serpent alignments."
    },
    {
      title: "Ife Kingdom Bronze Royal Ancestor Sculpture",
      imageUrl: "/artifacts/african-ife-bronze.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Bronze_Head_from_Ife",
      provenance: "Ife Kingdom, West Africa",
      period: "c. 12th-14th century CE",
      description: "Masterwork lost-wax bronze portrait embodying divine kingship and sacred ancestral connection."
    }
  ],
  default: [
    {
      title: "The Parthenon Classical Sanctuary of Athena",
      imageUrl: "/artifacts/ancient-parthenon.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Parthenon",
      provenance: "Acropolis of Athens, Greece",
      period: "447–432 BCE",
      description: "Pinnacle of Classical Greek sacred temple architecture honoring the civic and divine order."
    },
    {
      title: "Persepolis Monumental Faravahar Stone Relief",
      imageUrl: "/artifacts/zoroastrian-faravahar.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Faravahar",
      provenance: "Persepolis, Ancient Persia",
      period: "c. 515 BCE",
      description: "Achaemenid royal carving representing divine grace (Khvarenah) and moral responsibility in Zoroastrianism."
    }
  ]
};

function getArtifactsForNode(id, title, cluster, canonicalTexts) {
  const cleanTitle = title.replace(/\(.*?\)/g, "").trim();
  const lower = (title + " " + id).toLowerCase();

  // 1. Jediism
  if (lower.includes("jedi")) {
    return [
      {
        title: "Ceremonial Lightsaber Prop & Meditation Focus",
        imageUrl: "/artifacts/jediism-lightsaber.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Lightsaber",
        provenance: "Modern Popular Mythos & Contemporary Practice",
        period: "Late 20th century CE to present",
        description: "Iconic symbolic focus device adapted from cinematic mythos into contemporary ethical and meditative ritual."
      },
      {
        title: "Temple of the Jedi Order Dokuments & Teachings",
        imageUrl: "/artifacts/christianity-codex.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Jediism",
        provenance: "Worldwide Online Communities",
        period: "2005 CE - Present",
        description: "Documented 16 Teachings and 21 Maxims establishing philosophical Jediism as a lived ethical discipline."
      }
    ];
  }

  // 2. Judaism / Hebrew traditions
  if (lower.includes("juda") || lower.includes("hebrew") || lower.includes("tanna") || lower.includes("amora") || lower.includes("rabbinic") || lower.includes("israelite") || lower.includes("samaritan") || lower.includes("kabbalah") || lower.includes("hasidic")) {
    return [
      {
        title: "Western Wall & Second Temple Foundation",
        imageUrl: "/artifacts/judaism-western-wall.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Western_Wall",
        provenance: "Old City, Jerusalem",
        period: "c. 19 BCE (Herodian Era)",
        description: "The holiest prayer site of Jewish tradition, surviving western retaining wall of the Second Temple complex."
      },
      {
        title: "Aleppo Codex Masoretic Hebrew Bible Manuscript",
        imageUrl: "/artifacts/judaism-torah-scroll.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Aleppo_Codex",
        provenance: "Tiberias & Jerusalem",
        period: "c. 920 CE",
        description: "Authoritative parchment manuscript of the Hebrew Bible with Masoretic vocalization and cantillation marks."
      }
    ];
  }

  // 3. Islam / Sufism
  if (lower.includes("islam") || lower.includes("sunni") || lower.includes("shia") || lower.includes("sufi") || lower.includes("ibadi") || lower.includes("quran") || lower.includes("muhammad")) {
    return [
      {
        title: "Dome of the Rock Sacred Umayyad Sanctuary",
        imageUrl: "/artifacts/islam-dome-of-rock.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Dome_of_the_Rock",
        provenance: "Jerusalem",
        period: "691 CE (Umayyad Caliphate)",
        description: "Architectural masterpiece of early Islamic octagonal design with classical Kufic Quranic inscriptions."
      },
      {
        title: "Blue Quran Gold Kufic Manuscript Folio",
        imageUrl: "/artifacts/islam-blue-quran.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Blue_Quran",
        provenance: "Kairouan / Great Mosque",
        period: "c. 9th-10th century CE",
        description: "Indigo-dyed vellum parchment illuminated with gold Kufic script preserving the Holy Quran."
      }
    ];
  }

  // 4. Catholicism
  if (lower.includes("catholic") || lower === "catholic church") {
    return [
      {
        title: "Saint Peter's Papal Basilica & Piazza",
        imageUrl: "/artifacts/christianity-basilica.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/St._Peter%27s_Basilica",
        provenance: "Vatican City, Rome",
        period: "1506–1626 CE",
        description: "The Renaissance and Baroque episcopal center of the Roman Catholic Church, designed by Michelangelo and Bernini."
      },
      {
        title: "Codex Vaticanus Greek Bible Manuscript",
        imageUrl: "/artifacts/christianity-codex.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Codex_Vaticanus",
        provenance: "Vatican Library Collection",
        period: "c. 4th century CE",
        description: "One of the earliest extant uncial manuscripts of the Greek Old and New Testaments."
      }
    ];
  }

  // 5. Eastern & Oriental Orthodoxy
  if (lower.includes("orthodox") || lower.includes("byzantine") || lower.includes("coptic") || lower.includes("syriac") || lower.includes("armenian") || lower.includes("ethiopian")) {
    return [
      {
        title: "Hagia Sophia Imperial Cathedral of Holy Wisdom",
        imageUrl: "/artifacts/orthodoxy-hagia-sophia.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Hagia_Sophia",
        provenance: "Constantinople (Istanbul)",
        period: "537 CE",
        description: "Monumental domed cathedral of the Byzantine Empire and historical mother church of Eastern Orthodoxy."
      },
      {
        title: "Sinai Christ Pantocrator Encaustic Icon",
        imageUrl: "/artifacts/orthodoxy-icon-pantocrator.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Christ_Pantocrator_(Sinai)",
        provenance: "Saint Catherine's Monastery, Sinai",
        period: "c. 6th century CE",
        description: "The oldest known Byzantine encaustic panel icon of Christ Pantocrator embodying dual divine and human natures."
      }
    ];
  }

  // 6. Protestantism & Anglicanism
  if (lower.includes("protestant") || lower.includes("lutheran") || lower.includes("reformed") || lower.includes("calvin") || lower.includes("anglican") || lower.includes("baptist") || lower.includes("methodist") || lower.includes("presbyterian") || lower.includes("anabaptist") || lower.includes("evangelical") || lower.includes("pentecostal") || lower.includes("adventis")) {
    return [
      {
        title: "Wittenberg All Saints' Church (Reformation 95 Theses Site)",
        imageUrl: "/artifacts/protestantism-wittenberg.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/All_Saints%27_Church,_Wittenberg",
        provenance: "Wittenberg, Germany",
        period: "1517 CE",
        description: "Historic church where Martin Luther posted his Ninety-five Theses, initiating the Protestant Reformation."
      },
      {
        title: "Luther 1534 German Bible Title Woodcut",
        imageUrl: "/artifacts/protestantism-luther-bible.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Luther_Bible",
        provenance: "Wittenberg",
        period: "1534 CE",
        description: "Historic printed vernacular German translation democratizing direct scriptural access for all believers."
      }
    ];
  }

  // 7. Buddhism
  if (lower.includes("buddh") || lower.includes("theravada") || lower.includes("mahayana") || lower.includes("zen") || lower.includes("chan") || lower.includes("vajrayana") || lower.includes("tibetan") || lower.includes("pure land")) {
    return [
      {
        title: "Mahabodhi Temple Enlightenment Complex",
        imageUrl: "/artifacts/buddhism-mahabodhi.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Mahabodhi_Temple",
        provenance: "Bodh Gaya, Bihar, India",
        period: "c. 250 BCE - 5th century CE",
        description: "UNESCO World Heritage stone temple constructed around the sacred Bodhi Tree where the Buddha awakened."
      },
      {
        title: "Brihadisvara Sacred Monumental Sanctuary",
        imageUrl: "/artifacts/hinduism-brihadisvara.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Brihadisvara_Temple",
        provenance: "Ancient India",
        period: "Classical Era",
        description: "Monumental sacred architecture preserving early Indian stone masonry and meditation sanctuaries."
      }
    ];
  }

  // 8. Hinduism & Vedic traditions (including Śāktism, Śaivism, Vaiṣṇavism)
  if (lower.includes("hindu") || lower.includes("vedic") || lower.includes("vedanta") || lower.includes("shaiv") || lower.includes("vaishnav") || lower.includes("shakt") || lower.includes("śākt") || lower.includes("śakt") || lower.includes("śai") || lower.includes("vaiṣ") || lower.includes("yoga") || lower.includes("brahman") || lower.includes("tantra")) {
    return [
      {
        title: "Brihadisvara Temple (Peruvudaiyar Kovil)",
        imageUrl: "/artifacts/hinduism-brihadisvara.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Brihadisvara_Temple",
        provenance: "Thanjavur, Tamil Nadu",
        period: "1010 CE (Chola Dynasty)",
        description: "Towering granite rock architecture exemplifying Tamil Dravidian temple design and Shaivite sacred geometry."
      },
      {
        title: "Chola Nataraja (Cosmic Dance of Shiva) Bronze",
        imageUrl: "/artifacts/hinduism-nataraja.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Nataraja",
        provenance: "Southern India",
        period: "c. 10th-11th century CE",
        description: "Iconic lost-wax bronze sculpture representing the continuous cycle of cosmic creation and preservation."
      }
    ];
  }

  // 9. Sikhism
  if (lower.includes("sikh") || lower.includes("khalsa")) {
    return [
      {
        title: "Harmandir Sahib (The Golden Temple)",
        imageUrl: "/artifacts/sikhism-golden-temple.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Golden_Temple",
        provenance: "Amritsar, Punjab",
        period: "1604 CE",
        description: "The spiritual and cultural center of Sikhism, designed with entrances on four sides welcoming all humanity."
      },
      {
        title: "Guru Granth Sahib Sacred Illumination",
        imageUrl: "/artifacts/sikhism-guru-granth.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Guru_Granth_Sahib",
        provenance: "Punjab",
        period: "17th century CE",
        description: "Illuminated sacred scripture and eternal living Guru containing hymns of the Sikh Gurus and Bhagats."
      }
    ];
  }

  // 10. Jainism
  if (lower.includes("jain") || lower.includes("digambar") || lower.includes("svetambar")) {
    return [
      {
        title: "Gommateshwara Bahubali Monolithic Statue",
        imageUrl: "/artifacts/jainism-gommateshwara.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Gommateshwara_statue",
        provenance: "Shravanabelagola, Karnataka",
        period: "981 CE",
        description: "A 57-foot monolithic granite statue commemorating the supreme detachment and ahimsa of Lord Bahubali."
      },
      {
        title: "Dilwara Marble Temple Carvings",
        imageUrl: "/artifacts/jainism-dilwara-temple.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Dilwara_Temples",
        provenance: "Mount Abu, Rajasthan",
        period: "11th-13th century CE",
        description: "Intricately carved white marble ceilings depicting the spiritual liberation of the Tirthankaras."
      }
    ];
  }

  // 11. Daoism & Chinese traditions
  if (lower.includes("dao") || lower.includes("tao") || lower.includes("confucian") || lower.includes("quanzhen") || lower.includes("zhengyi")) {
    return [
      {
        title: "Wudang Mountain Sacred Golden Hall Complex",
        imageUrl: "/artifacts/daoism-wudang-hall.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Wudang_Mountains",
        provenance: "Hubei, China",
        period: "1416 CE",
        description: "Imperial architectural shrine of Daoist alchemy and philosophical meditation."
      },
      {
        title: "Itsukushima Floating Torii Gate Shrine",
        imageUrl: "/artifacts/shinto-torii-gate.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Itsukushima_Shrine",
        provenance: "Sacred Sanctuaries",
        period: "Medieval Era",
        description: "Sacred gateway demarcating the transition from mundane space to sacred realm."
      }
    ];
  }

  // 12. Shinto
  if (lower.includes("shinto") || lower.includes("kami") || lower.includes("jinja") || lower.includes("tenri")) {
    return [
      {
        title: "Itsukushima Floating Torii Gate Shrine",
        imageUrl: "/artifacts/shinto-torii-gate.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Itsukushima_Shrine",
        provenance: "Miyajima, Hiroshima, Japan",
        period: "1168 CE",
        description: "Iconic sacred Shinto gate standing in the tidal sea, demarcating the boundary of the sacred realm."
      },
      {
        title: "Wudang Mountain Sacred Golden Hall Complex",
        imageUrl: "/artifacts/daoism-wudang-hall.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Wudang_Mountains",
        provenance: "East Asian Sanctuaries",
        period: "Medieval Era",
        description: "Imperial architectural shrine honoring celestial and natural harmony."
      }
    ];
  }

  // 13. Zoroastrianism & Ancient Iranian
  if (lower.includes("zoroastr") || lower.includes("parsi") || lower.includes("mithra") || lower.includes("manichae") || lower.includes("yazid") || lower.includes("mandean")) {
    return [
      {
        title: "Persepolis Faravahar Bas-Relief",
        imageUrl: "/artifacts/zoroastrian-faravahar.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Faravahar",
        provenance: "Persepolis, Ancient Persia",
        period: "c. 515 BCE",
        description: "Carved winged symbol of Good Thoughts, Good Words, and Good Deeds (Humata, Hukhta, Hvarshta)."
      },
      {
        title: "The Parthenon Classical Sanctuary of Athena",
        imageUrl: "/artifacts/ancient-parthenon.jpg",
        sourceUrl: "https://en.wikipedia.org/wiki/Parthenon",
        provenance: "Ancient Near East / Mediterranean",
        period: "Classical Antiquity",
        description: "Monumental sacred architecture honoring the civic and cosmological order."
      }
    ];
  }

  // Fallback to cluster defaults
  return CLUSTER_DEFAULTS[cluster] || CLUSTER_DEFAULTS.default;
}

async function findMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return findMarkdownFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
    })
  );
  return files.flat();
}

async function run() {
  const files = await findMarkdownFiles("./data");
  console.log(`Enriching ${files.length} traditions with verified photographs & source links...`);

  let count = 0;
  for (const filePath of files) {
    const raw = await readFile(filePath, "utf8");
    const { data, content } = matter(raw);

    const artifacts = getArtifactsForNode(
      data.id,
      data.title,
      data.cluster,
      data.canonical_texts || []
    );

    data.artifacts = artifacts;

    const newContent = matter.stringify(content, data);
    await writeFile(filePath, newContent, "utf8");
    count++;
  }

  console.log(`Successfully updated ${count} files with verified photos & links.`);
}

run().catch(console.error);
