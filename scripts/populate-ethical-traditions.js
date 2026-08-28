import { writeFile, mkdir } from "node:fs/promises";
import { createWriteStream, existsSync, statSync } from "node:fs";
import https from "node:https";

function download(url, dest) {
  return new Promise(res => {
    https.get(url, { headers: { "User-Agent": "OpenGrailEthics/1.0 (peter@calmdownoscar.com)" } }, r => {
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
  await mkdir("data/philosophical-ethical", { recursive: true });
  await mkdir("public/artifacts", { recursive: true });

  const images = [
    ["confucian-ethics-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Confucius_Tang_Dynasty.jpg/960px-Confucius_Tang_Dynasty.jpg"],
    ["confucian-ethics-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Temple_of_Confucius%2C_Qufu_Dacheng_Hall.jpg/960px-Temple_of_Confucius%2C_Qufu_Dacheng_Hall.jpg"],
    ["ahimsa-ethics-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Jain_Prateek_Chihna.svg/960px-Jain_Prateek_Chihna.svg.png"],
    ["ahimsa-ethics-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Ashoka_Lion_Capital.jpg/960px-Ashoka_Lion_Capital.jpg"],
    ["aristotelian-ethics-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/960px-Aristotle_Altemps_Inv8575.jpg"],
    ["aristotelian-ethics-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/960px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg"],
    ["stoic-ethics-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Marcus_Aurelius_Capitoline_Museums_MC1182.jpg/960px-Marcus_Aurelius_Capitoline_Museums_MC1182.jpg"],
    ["stoic-ethics-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Zeno_of_Citium_pushkin.jpg/960px-Zeno_of_Citium_pushkin.jpg"],
    ["egyptian-maat-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Weighing_of_the_heart3.jpg/960px-Weighing_of_the_heart3.jpg"],
    ["egyptian-maat-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Goddess_Maat_winged.jpg/960px-Goddess_Maat_winged.jpg"],
    ["hammurabi-code-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Code_of_Hammurabi_Louvre_Sb8.jpg/960px-Code_of_Hammurabi_Louvre_Sb8.jpg"],
    ["hammurabi-code-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Law_Code_of_Hammurabi_Stele.jpg/960px-Law_Code_of_Hammurabi_Stele.jpg"],
    ["ubuntu-ethics-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Desmond_Tutu_2004.jpg/960px-Desmond_Tutu_2004.jpg"],
    ["ubuntu-ethics-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/960px-Nelson_Mandela_1994.jpg"],
    ["islamic-akhlaq-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Al-Ghazali_Calligraphy.svg/960px-Al-Ghazali_Calligraphy.svg.png"],
    ["islamic-akhlaq-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/House_of_Wisdom_Baghdad.jpg/960px-House_of_Wisdom_Baghdad.jpg"],
    ["kantian-ethics-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Immanuel_Kant_%28painted_portrait%29.jpg/960px-Immanuel_Kant_%28painted_portrait%29.jpg"],
    ["kantian-ethics-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Kant_Monument_Kaliningrad.jpg/960px-Kant_Monument_Kaliningrad.jpg"],
    ["human-rights-1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Eleanor_Roosevelt_UDHR.jpg/960px-Eleanor_Roosevelt_UDHR.jpg"],
    ["human-rights-2.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Universal_Declaration_of_Human_Rights_Preamble.jpg/960px-Universal_Declaration_of_Human_Rights_Preamble.jpg"]
  ];

  for (const [name, url] of images) {
    await download(url, `public/artifacts/${name}`);
  }

  const nodes = [
    // 1. Confucian Virtue Ethics
    {
      file: "data/philosophical-ethical/confucian-virtue-ethics.md",
      content: `---
id: confucian-virtue-ethics
title: Confucian Virtue Ethics (Rén & Lǐ)
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 500 BCE to Present
epistemic_tier: academic_consensus
aliases:
  - Rén and Lǐ
  - Ruist Moral Philosophy
  - The Silver Rule
  - Junzi Character Ethics
summary: >-
  The moral philosophy of Kongzi (Confucius), centered on humaneness (Rén),
  ritual propriety (Lǐ), filial piety (Xiào), and the cultivation of the exemplary person (Jūnzǐ).
canonical_texts:
  - 'Analects of Confucius (Lúnyǔ)'
  - 'Mencius (Mengzi)'
  - 'The Great Learning (Dàxué) and Doctrine of the Mean (Zhōngyōng)'
relations:
  - target: confucianism
    type: branch_of
    certainty: academic_consensus
  - target: aristotelian-virtue-ethics
    type: parallel_concept
    certainty: academic_consensus
origin_year: -500
origin_geo:
  lat: 35.5900
  lng: 116.9800
  place_name: 'Temple of Confucius, Qufu, Shandong, China'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: Rén (仁 - Benevolence / Loving Others) as the supreme virtue of human-heartedness; Lǐ (禮 - Ritual Propriety) as the social grammar giving form and reverence to ethical life; the human person as intrinsically relational rather than an isolated individual.
  - >-
    The Silver Rule of Reciprocity (Shù): "What you do not wish for yourself, do not impose upon others" (*Analects* 15:24).
  - >-
    Core Orientation: Self-cultivation through study and ritual to become a *Jūnzǐ* (Exemplary Moral Person) who harmonizes family, state, and the cosmos (*Tiān*).
sources:
  - title: 'Confucius: "The Analects" (Translated by D. C. Lau)'
    url: 'https://www.penguinrandomhouse.com/'
  - title: 'Stanford Encyclopedia of Philosophy: "Confucian Ethics"'
    url: 'https://plato.stanford.edu/entries/ethics-chinese/'
artifacts:
  - title: Portrait of Confucius (Wu Daozi Tang Dynasty Lineage)
    imageUrl: /artifacts/confucian-ethics-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Confucius
    provenance: Qufu, Shandong, China
    period: Classical Ruist Tradition
    description: >-
      Iconic portrait of Kongzi with joined hands representing humility, ritual propriety (Lǐ), and ethical guidance for governance.
  - title: Dacheng Hall at the Great Temple of Confucius
    imageUrl: /artifacts/confucian-ethics-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Temple_of_Confucius,_Qufu
    provenance: Qufu, Shandong, China (UNESCO World Heritage Site)
    period: c. 478 BCE to Present
    description: >-
      The focal sanctuary where generations of scholars and emperors performed annual rites commemorating Confucius and moral philosophy.
---

# Confucian Virtue Ethics (Rén & Lǐ)

## Historical context
Formulated during the tumultuous Spring and Autumn period in China, Confucius sought to restore social harmony not through legal coercion or military force, but through internal moral transformation, respect for familial bonds, and the cultivation of benevolent character.
`
    },

    // 2. Ahimsa & Dharmic Non-Violence
    {
      file: "data/philosophical-ethical/ahimsa-ethics.md",
      content: `---
id: ahimsa-ethics
title: Ahiṃsā & Dharmic Ethics of Non-Violence
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 600 BCE to Present
epistemic_tier: academic_consensus
aliases:
  - Ahimsa
  - Non-Violence
  - Karuna Compassion
  - Satyagraha Moral Force
summary: >-
  The foundational pan-Dharmic ethical principle of radical non-harm toward all sentient life,
  originating in Jainism, Buddhism, and Hinduism, and transforming global civil rights through Mahatma Gandhi.
canonical_texts:
  - 'Acaranga Sutra (Jain canon)'
  - 'Dhammapada (Buddhist canon)'
  - 'Patanjali Yoga Sutras (Yamas)'
  - 'Tirukkuṟaḷ by Thiruvalluvar'
relations:
  - target: jainism
    type: branch_of
    certainty: academic_consensus
  - target: buddhism
    type: branch_of
    certainty: academic_consensus
  - target: hinduism
    type: branch_of
    certainty: academic_consensus
  - target: utilitarianism-ethics
    type: parallel_concept
    certainty: academic_consensus
origin_year: -600
origin_geo:
  lat: 25.0112
  lng: 85.4214
  place_name: 'Rajgir & Vaishali, Magadha, Bihar, India'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: *Ahiṃsā Paramo Dharmaḥ* ("Non-violence is the highest moral virtue"). Every living being—from microscopic organisms to humans—possesses a soul (*Jīva*) desiring life and fearing pain.
  - >-
    Triple Pure Action: Non-violence in action (*Kāya*), speech (*Vāc*), and mind (*Manas*). Elimination of predatory exploitation, vegetarianism/veganism, and active compassion (*Karuṇā*).
  - >-
    Political Applied Ethics: Transformed into *Satyagraha* ("Soul-Force / Truth-Force") by Mahatma Gandhi and Martin Luther King Jr. as the supreme instrument of non-violent social justice.
sources:
  - title: 'Padmanabh S. Jaini: "The Jaina Path of Purification"'
    url: 'https://www.ucpress.edu/'
  - title: 'Mahatma Gandhi: "The Story of My Experiments with Truth"'
    url: 'https://www.gandhiashramsevagram.org/'
artifacts:
  - title: Jain Prateek Chihna Emblem of Universal Ahimsa
    imageUrl: /artifacts/ahimsa-ethics-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Jain_symbols
    provenance: Pan-Indian Dharmic Tradition
    period: Universal Inscription
    description: >-
      Sacred emblem featuring the open palm of non-violence containing the 24-spoked Wheel of Dharma and the word 'Ahimsa' at its center.
  - title: Lion Capital of Emperor Ashoka at Sarnath
    imageUrl: /artifacts/ahimsa-ethics-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Lion_Capital_of_Ashoka
    provenance: Sarnath Archaeological Museum, Uttar Pradesh, India
    period: c. 250 BCE (Maurya Empire)
    description: >-
      Monumental sandstone capital sculpted after Emperor Ashoka renounced aggressive warfare and embraced Buddhist non-violence (Dharma Vijaya).
---

# Ahiṃsā & Dharmic Ethics of Non-Violence

## Historical context
Emerging from the Shramana movements of the 6th century BCE under Mahavira and Gautama Buddha, Ahiṃsā challenged sacrificial animal slaughter and established the moral equality of all living beings.
`
    },

    // 3. Aristotelian Virtue Ethics
    {
      file: "data/philosophical-ethical/aristotelian-virtue-ethics.md",
      content: `---
id: aristotelian-virtue-ethics
title: Aristotelian & Classical Virtue Ethics
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 335 BCE to Present
epistemic_tier: academic_consensus
aliases:
  - Eudaimonia Virtue Ethics
  - The Golden Mean
  - Phronesis Practical Wisdom
  - Teleological Character Ethics
summary: >-
  The teleological ethics of Aristotle centered on the pursuit of human flourishing (Eudaimonía)
  through the cultivation of character virtues located at the Golden Mean between excess and deficiency.
canonical_texts:
  - 'Nicomachean Ethics by Aristotle'
  - 'Politics by Aristotle'
  - 'Eudemian Ethics'
relations:
  - target: confucian-virtue-ethics
    type: parallel_concept
    certainty: academic_consensus
  - target: stoic-cosmopolitanism
    type: influenced_by
    certainty: academic_consensus
origin_year: -335
origin_geo:
  lat: 37.9715
  lng: 23.7267
  place_name: 'The Lyceum & Academy of Athens, Greece'
extinct_year: null
key_tenets:
  - >-
    Foundational Doctrine: *Eudaimonía* (Human Flourishing / Highest Good) as the ultimate purpose (*Telos*) of human existence, achieved by living in accordance with rational virtue over a complete lifetime.
  - >-
    The Doctrine of the Golden Mean (*Mesotēs*): Every moral virtue is a harmonious midpoint between two vices (e.g., Courage sits between Cowardice and Recklessness; Temperance between Insensibility and Self-Indulgence).
  - >-
    *Phronēsis* (Practical Wisdom): Virtue is not mere theoretical knowledge, but habituated practical discernment developed through exemplary mentorship and civic life.
sources:
  - title: 'Aristotle: "Nicomachean Ethics" (Translated by Terence Irwin)'
    url: 'https://www.hackettpublishing.com/'
  - title: 'Stanford Encyclopedia of Philosophy: "Virtue Ethics"'
    url: 'https://plato.stanford.edu/entries/ethics-virtue/'
artifacts:
  - title: Roman Bust Portrait of Aristotle
    imageUrl: /artifacts/aristotelian-ethics-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Aristotle
    provenance: Roman copy of Greek bronze original (Palazzo Altemps, Rome)
    period: c. 330 BCE Original
    description: >-
      Marble portrait bust of the philosopher Aristotle whose Nicomachean Ethics founded systematic Western character philosophy.
  - title: The School of Athens Fresco by Raphael
    imageUrl: /artifacts/aristotelian-ethics-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/The_School_of_Athens
    provenance: Apostolic Palace, Vatican City
    period: c. 1509–1511 CE
    description: >-
      Renaissance fresco depicting Plato pointing toward the celestial forms while Aristotle gestures horizontally toward empirical earthly ethics.
---

# Aristotelian & Classical Virtue Ethics

## Historical context
Taught at the Lyceum in 4th-century BCE Athens, Aristotle shifted ethical inquiry away from abstract metaphysical rules toward real-world human psychological development, civic friendship (*Philia*), and thriving community life.
`
    },

    // 4. Stoic Cosmopolitanism
    {
      file: "data/philosophical-ethical/stoic-cosmopolitanism.md",
      content: `---
id: stoic-cosmopolitanism
title: Stoic Cosmopolitanism & Universal Natural Law
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 300 BCE to Present
epistemic_tier: academic_consensus
aliases:
  - Stoic Ethics
  - Cosmopolis World Citizenship
  - Dichotomy of Control
  - Logos and Natural Law
summary: >-
  The Hellenistic and Roman philosophy of Zeno, Epictetus, Seneca, and Marcus Aurelius,
  founding universal human rights on shared reason (Logos) and emotional mastery (Apatheia).
canonical_texts:
  - 'Meditations by Marcus Aurelius'
  - 'Discourses and Enchiridion by Epictetus'
  - 'Letters from a Stoic (Epistulae Morales) by Seneca'
relations:
  - target: aristotelian-virtue-ethics
    type: influenced_by
    certainty: academic_consensus
  - target: human-rights-ethics
    type: parallel_concept
    certainty: academic_consensus
  - target: kantian-deontology
    type: parallel_concept
    certainty: academic_consensus
origin_year: -300
origin_geo:
  lat: 41.8902
  lng: 12.4922
  place_name: 'Stoa Poikile, Athens & Forum of Rome, Italy'
extinct_year: null
key_tenets:
  - >-
    Cosmopolitanism (*Kosmopolitēs*): Every human being—regardless of nationality, social station, or slavery—is a citizen of the universal city (*Cosmopolis*) sharing a spark of the divine universal reason (*Logos*).
  - >-
    The Dichotomy of Control: True freedom and moral integrity come from distinguishing what is within our control (our judgments, intentions, and desires) from what is not (external events, wealth, reputation, health).
  - >-
    The Four Cardinal Virtues: Wisdom (*Sophia*), Courage (*Andreia*), Justice (*Dikaiosyne*), and Temperance (*Sophrosyne*).
sources:
  - title: 'Marcus Aurelius: "Meditations" (Translated by Gregory Hays)'
    url: 'https://www.penguinrandomhouse.com/'
  - title: 'A. A. Long: "Stoic Studies"'
    url: 'https://www.cambridge.org/'
artifacts:
  - title: Equestrian Statue of Philosopher-Emperor Marcus Aurelius
    imageUrl: /artifacts/stoic-ethics-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Equestrian_Statue_of_Marcus_Aurelius
    provenance: Capitoline Hill, Rome, Italy
    period: c. 175 CE
    description: >-
      Gilded bronze monument of the Stoic emperor whose private diary (Meditations) became one of the greatest moral documents in human history.
  - title: Bust Portrait of Zeno of Citium (Founder of Stoicism)
    imageUrl: /artifacts/stoic-ethics-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Zeno_of_Citium
    provenance: Athens (Pushkin Museum Collection)
    period: c. 3rd century BCE Original
    description: >-
      Sculpted portrait of Zeno who began teaching ethics on the Painted Stoa (Stoa Poikile) in the Athenian Agora around 300 BCE.
---

# Stoic Cosmopolitanism & Universal Natural Law

## Historical context
Originating in Athens during the Hellenistic breakdown of the city-state, Stoicism expanded across the Roman Empire to provide a universal ethical framework that dismantled tribal chauvinism and inspired modern human rights charters.
`
    },

    // 5. Egyptian Ma'at Moral Order
    {
      file: "data/philosophical-ethical/egyptian-maat-ethics.md",
      content: `---
id: egyptian-maat-ethics
title: Ma'at & Ancient Nilotic Moral Order
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 2400 BCE
epistemic_tier: academic_consensus
summary: >-
  The ancient Egyptian cosmic and ethical principle of Truth, Justice, Balance, and Right Order,
  personified as the goddess Ma'at and evaluated in the Hall of Two Truths.
canonical_texts:
  - 'The Maxims of Ptahhotep (Old Kingdom Wisdom Literature)'
  - 'The Tale of the Eloquent Peasant'
  - 'The Papyrus of Ani (Book of the Dead: Chapter 125 Negative Confessions)'
relations:
  - target: ancient-egyptian-religion
    type: branch_of
    certainty: academic_consensus
  - target: mesopotamian-justice-codes
    type: parallel_concept
    certainty: academic_consensus
origin_year: -2400
origin_geo:
  lat: 29.8713
  lng: 31.2164
  place_name: 'Memphis & Thebes, Nile Valley, Egypt'
extinct_year: -30
key_tenets:
  - >-
    Foundational Doctrine: *Ma'at* as the cosmic fabric of truth, harmony, and cosmic justice created at the dawn of the universe; kings and citizens are morally charged to enact Ma'at and banish *Isfet* (chaos, falsehood, greed).
  - >-
    The Weighing of the Heart (*Psychostasia*): In the Underworld Hall of Two Truths, the deceased person's heart is weighed against the ostrich feather of Ma'at; an ethical life free of deceit, theft, and oppression grants immortality.
  - >-
    The 42 Negative Confessions: Moral declarations asserting that one has not polluted waters, oppressed the weak, caused tears, or cheated with false weights in the marketplace.
sources:
  - title: 'Jan Assmann: "The Mind of Egypt: History and Meaning in the Time of the Pharaohs"'
    url: 'https://www.hup.harvard.edu/'
  - title: 'Miriam Lichtheim: "Ancient Egyptian Literature: The Old and Middle Kingdoms"'
    url: 'https://www.ucpress.edu/'
artifacts:
  - title: The Weighing of the Heart in the Papyrus of Ani
    imageUrl: /artifacts/egyptian-maat-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Papyrus_of_Ani
    provenance: Thebes, Egypt (British Museum)
    period: c. 1250 BCE (19th Dynasty)
    description: >-
      Masterpiece papyrus painting depicting the jackal god Anubis weighing the scribe Ani's heart against the feather of Ma'at before Thoth and Osiris.
  - title: Relief of Winged Goddess Ma'at Bestowing Life
    imageUrl: /artifacts/egyptian-maat-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Maat
    provenance: Tomb of Horemheb, Valley of the Kings, Luxor, Egypt
    period: c. 1320 BCE
    description: >-
      Polychrome wall relief of Ma'at with outspread protective wings and the sacred ostrich plume upon her head.
---

# Ma'at & Ancient Nilotic Moral Order

## Historical context
Serving as the foundation of Egyptian statecraft, law, and funerary theology for over 3,000 years, Ma'at established that social justice and universal cosmic stability were directly dependent upon personal moral integrity.
`
    },

    // 6. Mesopotamian Justice Codes
    {
      file: "data/philosophical-ethical/mesopotamian-justice-codes.md",
      content: `---
id: mesopotamian-justice-codes
title: Mesopotamian Justice Codes & Divine Jurisprudence
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 2100 BCE
epistemic_tier: academic_consensus
summary: >-
  The world's earliest codified legal and moral frameworks (Ur-Nammu and Hammurabi),
  mandating the defense of orphans and widows under the sun god of justice Shamash.
canonical_texts:
  - 'Code of Ur-Nammu (c. 2100 BCE - Sumerian origin)'
  - 'Code of Hammurabi Stele (c. 1750 BCE - Babylonian cuneiform)'
  - 'Edicts of Ammisaduqa'
relations:
  - target: ancient-near-east
    type: branch_of
    certainty: academic_consensus
  - target: egyptian-maat-ethics
    type: parallel_concept
    certainty: academic_consensus
origin_year: -2100
origin_geo:
  lat: 32.5364
  lng: 44.4208
  place_name: 'Royal City of Babylon & Ur, Mesopotamia (Iraq)'
extinct_year: -539
key_tenets:
  - >-
    Foundational Mandate: "That the strong might not oppress the weak, that justice be given to the orphan and the widow" (Hammurabi Stele Prologue).
  - >-
    Divine Investiture of Law: Law as a sacred trust bestowed by Shamash (Sun God of Justice and Light) upon mortal rulers, establishing proportionality in punishment and written contract accountability.
  - >-
    *Misharum* (Royal Debt Clean Slates): Periodic royal decrees forgiving agrarian peasant debts and liberating debt slaves to prevent permanent socio-economic collapse.
sources:
  - title: 'Martha T. Roth: "Law Collections from Mesopotamia and Asia Minor"'
    url: 'https://www.sbl-site.org/'
  - title: 'Louvre Museum: The Stele of the Law Code of Hammurabi'
    url: 'https://www.louvre.fr/'
artifacts:
  - title: Basalt Stele of the Law Code of Hammurabi
    imageUrl: /artifacts/hammurabi-code-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Code_of_Hammurabi
    provenance: Susa / Babylon (Musée du Louvre, Paris)
    period: c. 1754 BCE
    description: >-
      2.25-meter-tall black diorite stele inscribed with 282 legal statutes in cuneiform, crowned with Hammurabi receiving the laws from sun god Shamash.
  - title: Upper Relief: King Hammurabi and Sun God Shamash
    imageUrl: /artifacts/hammurabi-code-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Code_of_Hammurabi
    provenance: Babylon (Louvre Museum)
    period: c. 1750 BCE
    description: >-
      Detailed bas-relief showing Shamash seated on his celestial throne with rays emanating from his shoulders, bestowing the measuring rod of justice upon the king.
---

# Mesopotamian Justice Codes & Divine Jurisprudence

## Historical context
From the Sumerian kings of Ur in 2100 BCE to Hammurabi in 1750 BCE, Mesopotamia invented public statutory law, moving human justice away from arbitrary tribal retribution toward transparent legal standards.
`
    },

    // 7. Ubuntu Ethics
    {
      file: "data/philosophical-ethical/ubuntu-ethics.md",
      content: `---
id: ubuntu-ethics
title: Ubuntu Philosophy & Communal Interdependence
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 1000 BCE to Present
epistemic_tier: academic_consensus
aliases:
  - Ubuntu
  - Umuntu ngumuntu ngabantu
  - African Communal Ethics
  - Restorative Justice
summary: >-
  The Pan-African ethical philosophy grounded in human interconnectedness:
  "A person is a person through other persons" (Umuntu ngumuntu ngabantu).
canonical_texts:
  - Bantu proverbial customary corpus
  - 'Truth and Reconciliation Commission Framework by Archbishop Desmond Tutu'
  - 'No Future Without Forgiveness by Desmond Tutu'
relations:
  - target: animist-frameworks
    type: branch_of
    certainty: academic_consensus
  - target: confucian-virtue-ethics
    type: parallel_concept
    certainty: academic_consensus
origin_year: -1000
origin_geo:
  lat: -28.4793
  lng: 24.6727
  place_name: 'Great Lakes & Southern Africa'
extinct_year: null
key_tenets:
  - >-
    Foundational Maxim: *Umuntu ngumuntu ngabantu* ("I am because we are; since we are, therefore I am"). A human being's humanity is realized only in communion, mutual care, and solidarity with others.
  - >-
    Restorative Justice vs Retributive Justice: When harm occurs, the ethical imperative is not vengeance or isolation, but healing relationships (*Ukwakhisana*), restoring communal balance, and reintegrating offenders.
  - >-
    Radical Hospitality & Generosity: Sharing resources, shielding strangers, and recognizing that diminishing another person's dignity diminishes one's own humanity.
sources:
  - title: 'Desmond Tutu: "No Future Without Forgiveness"'
    url: 'https://www.penguinrandomhouse.com/'
  - title: 'Kwasi Wiredu: "Cultural Universals and Particulars: An African Perspective"'
    url: 'https://iupress.org/'
artifacts:
  - title: Archbishop Desmond Tutu at the Truth and Reconciliation Commission
    imageUrl: /artifacts/ubuntu-ethics-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Desmond_Tutu
    provenance: Cape Town, South Africa
    period: c. 1995–1998 CE
    description: >-
      Nobel Peace laureate Desmond Tutu who pioneered Ubuntu as the constitutional and moral foundation for post-apartheid national reconciliation.
  - title: Nelson Mandela (Embodiment of Ubuntu Statesmanship)
    imageUrl: /artifacts/ubuntu-ethics-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Nelson_Mandela
    provenance: Pretoria, South Africa
    period: c. 1994 CE
    description: >-
      First democratically elected President of South Africa whose leadership exemplified Ubuntu forgiveness and multi-racial constitutional democracy.
---

# Ubuntu Philosophy & Communal Interdependence

## Historical context
Originating in Bantu linguistic communities across sub-Saharan Africa over millennia, Ubuntu provided the ethical architecture for traditional village democracy, peacemaking councils, and modern restorative justice.
`
    },

    // 8. Islamic 'Ilm al-Akhlaq
    {
      file: "data/philosophical-ethical/islamic-akhlaq-ethics.md",
      content: `---
id: islamic-akhlaq-ethics
title: 'Ilm al-Akhlāq & Maqāṣid al-Sharī'ah (Islamic Ethics)
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: c. 800 CE to Present
epistemic_tier: academic_consensus
aliases:
  - Akhlaq
  - Adab Ethical Comportment
  - Maqasid al-Shariah
  - Ihsan Moral Excellence
summary: >-
  The Islamic moral philosophy and higher ethical jurisprudence, integrating Quranic values,
  character purification (Tazkiyat al-Nafs), and the preservation of universal human goods.
canonical_texts:
  - 'Tahdhīb al-Akhlāq (The Refinement of Character) by Ibn Miskawayh'
  - 'Iḥyāʾ ʿUlūm al-Dīn (Revival of the Religious Sciences) by Imam Al-Ghazali'
  - 'Al-Mustasfa by Al-Ghazali (Origins of Maqasid theory)'
relations:
  - target: islam
    type: branch_of
    certainty: academic_consensus
  - target: aristotelian-virtue-ethics
    type: influenced_by
    certainty: academic_consensus
origin_year: 800
origin_geo:
  lat: 33.3152
  lng: 44.3661
  place_name: 'House of Wisdom (Bayt al-Hikma), Baghdad, Iraq'
extinct_year: null
key_tenets:
  - >-
    *Iḥsān* (Moral Beauty & Excellence): "To worship God as if you see Him; and if you do not see Him, know that He sees you." The inward perfection of conscience, compassion, and sincerity.
  - >-
    *Maqāṣid al-Sharīʿah* (The Five Universal Objectives): Every ethical and legal rule exists to protect five universal human rights: (1) Life (*Nafs*), (2) Intellect (*'Aql*), (3) Lineage/Family (*Nasl*), (4) Property (*Māl*), and (5) Faith/Freedom of Conscience (*Dīn*).
  - >-
    *Tazkiyat al-Nafs* (Purification of the Soul): Healing spiritual diseases like arrogance, envy, and greed through virtuous habits, generosity (*Zakāt*), and social justice (*'Adl*).
sources:
  - title: 'Abu Hamid al-Ghazali: "The Book of Knowledge & The Revival of Religious Sciences"'
    url: 'https://fonsvitae.com/'
  - title: 'Jasser Auda: "Maqasid al-Shariah as Philosophy of Islamic Law"'
    url: 'https://iiit.org/'
artifacts:
  - title: Calligraphic Emblem of Imam Al-Ghazali (Master of Ethical Sciences)
    imageUrl: /artifacts/islamic-akhlaq-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Al-Ghazali
    provenance: Baghdad & Nishapur
    period: c. 1100 CE
    description: >-
      Arabic calligraphy commemorating Imam Al-Ghazali whose masterpiece Ihya 'Ulum al-Din harmonized rational philosophy, law, and Sufi character ethics.
  - title: The Grand House of Wisdom (Bayt al-Hikma) of Baghdad
    imageUrl: /artifacts/islamic-akhlaq-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/House_of_Wisdom
    provenance: Abbasid Baghdad, Iraq
    period: c. 8th–13th century CE
    description: >-
      Historic academy where scholars translated Aristotle and Plato into Arabic, synthesizing Greek virtue ethics with Islamic moral revelation.
---

# 'Ilm al-Akhlāq & Maqāṣid al-Sharī'ah (Islamic Ethics)

## Historical context
During the Islamic Golden Age in Baghdad, Cairo, and Córdoba, Muslim philosophers and jurists developed a sophisticated ethical system that married Greek rational virtue theory with the universal humanitarian objectives of Quranic revelation.
`
    },

    // 9. Kantian Deontology
    {
      file: "data/philosophical-ethical/kantian-deontology.md",
      content: `---
id: kantian-deontology
title: Kantian Deontology & The Categorical Imperative
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: 1785 CE to Present
epistemic_tier: academic_consensus
aliases:
  - Categorical Imperative
  - Deontological Ethics
  - Duty-Based Ethics
  - Moral Autonomy
summary: >-
  The Enlightenment moral philosophy of Immanuel Kant, founding ethics on rational duty,
  universal moral law, and treating humanity always as an end and never merely as a means.
canonical_texts:
  - 'Groundwork of the Metaphysics of Morals (1785)'
  - 'Critique of Practical Reason (1788)'
  - 'The Metaphysics of Morals (1797)'
relations:
  - target: stoic-cosmopolitanism
    type: parallel_concept
    certainty: academic_consensus
  - target: human-rights-ethics
    type: influenced_by
    certainty: academic_consensus
origin_year: 1785
origin_geo:
  lat: 54.7104
  lng: 20.5110
  place_name: 'Albertina University, Königsberg, Prussia (Kaliningrad)'
extinct_year: null
key_tenets:
  - >-
    The Universal Law Formulation: "Act only according to that maxim whereby you can at the same time will that it should become a universal law."
  - >-
    The Formula of Humanity as an End in Itself: "Act in such a way that you treat humanity, whether in your own person or in the person of any other, never merely as a means to an end, but always at the same time as an end."
  - >-
    Moral Autonomy & The Kingdom of Ends: True human dignity consists in moral self-governance through reason rather than fear of punishment or desire for reward.
sources:
  - title: 'Immanuel Kant: "Practical Philosophy" (Cambridge Edition of the Works of Immanuel Kant)'
    url: 'https://www.cambridge.org/'
  - title: 'Christine M. Korsgaard: "Creating the Kingdom of Ends"'
    url: 'https://www.cambridge.org/'
artifacts:
  - title: Oil Portrait of Immanuel Kant
    imageUrl: /artifacts/kantian-ethics-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Immanuel_Kant
    provenance: Königsberg, Prussia
    period: c. 1791 CE
    description: >-
      Portrait of Enlightenment philosopher Immanuel Kant whose revolutionary moral works established modern deontological ethics and human dignity.
  - title: Monument to Immanuel Kant in Königsberg
    imageUrl: /artifacts/kantian-ethics-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Immanuel_Kant
    provenance: Kaliningrad, Russia
    period: c. 1864 CE
    description: >-
      Bronze monument commemorating Kant's famous epitaph: 'Two things fill the mind with ever new and increasing admiration: the starry heavens above me and the moral law within me.'
---

# Kantian Deontology & The Categorical Imperative

## Historical context
Published in 1785 amid the European Enlightenment, Kant's moral philosophy severed ethics from monarchical divine right and religious sectarianism, establishing universal human worth grounded entirely in rational moral agency.
`
    },

    // 10. Utilitarianism & Consequentialism
    {
      file: "data/philosophical-ethical/utilitarianism-ethics.md",
      content: `---
id: utilitarianism-ethics
title: Utilitarianism & Consequentialist Ethics
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: 1789 CE to Present
epistemic_tier: academic_consensus
aliases:
  - Greatest Happiness Principle
  - Consequentialism
  - Bentham and Mill Ethics
  - Sentient Animal Welfare
summary: >-
  The normative ethical tradition founded by Jeremy Bentham and John Stuart Mill,
  holding that actions are morally right insofar as they maximize overall happiness and minimize suffering.
canonical_texts:
  - 'An Introduction to the Principles of Morals and Legislation by Jeremy Bentham (1789)'
  - 'Utilitarianism by John Stuart Mill (1861)'
  - 'On Liberty by John Stuart Mill (1859)'
relations:
  - target: ahimsa-ethics
    type: parallel_concept
    certainty: academic_consensus
  - target: human-rights-ethics
    type: parallel_concept
    certainty: academic_consensus
origin_year: 1789
origin_geo:
  lat: 51.5074
  lng: -0.1278
  place_name: 'University College London & Parliament, London, UK'
extinct_year: null
key_tenets:
  - >-
    The Greatest Happiness Principle: The morally right choice in any situation is the one that produces the greatest balance of pleasure and happiness over pain and suffering for all affected sentient beings.
  - >-
    Equal Consideration of Interests: "Each to count for one, and none for more than one" (Bentham). No individual's happiness or social status is inherently superior to another's.
  - >-
    Inclusion of Sentient Non-Human Animals: "The question is not, Can they reason? nor, Can they talk? but, Can they suffer?" (Bentham, founding modern animal ethics).
sources:
  - title: 'John Stuart Mill: "Utilitarianism and On Liberty"'
    url: 'https://www.gutenberg.org/'
  - title: 'Peter Singer: "Practical Ethics"'
    url: 'https://www.cambridge.org/'
artifacts:
  - title: The Auto-Icon of Jeremy Bentham at UCL
    imageUrl: /artifacts/utilitarianism-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Jeremy_Bentham
    provenance: University College London, UK
    period: c. 1832 CE
    description: >-
      Preserved figure of Jeremy Bentham, the social reformer who championed universal suffrage, prison reform, freedom of expression, and animal rights.
  - title: First Edition Title Page of J.S. Mill's Utilitarianism
    imageUrl: /artifacts/utilitarianism-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Utilitarianism_(book)
    provenance: London, UK
    period: c. 1861 CE
    description: >-
      Original publication of Mill's masterpiece distinguishing higher intellectual pleasures from base physical sensations and defending liberty of conscience.
---

# Utilitarianism & Consequentialist Ethics

## Historical context
Arising in 18th-century Britain during the Industrial Revolution, Utilitarianism drove radical democratic, legal, and educational reforms, pioneering anti-slavery legislation, women's suffrage, and modern animal welfare.
`
    },

    // 11. Universal Human Rights
    {
      file: "data/philosophical-ethical/human-rights-ethics.md",
      content: `---
id: human-rights-ethics
title: Universal Human Rights & Global Ethical Horizons
cluster: Philosophical & Ethical Systems
color: '#38bdf8'
era_start: 1948 CE to Present
epistemic_tier: academic_consensus
aliases:
  - UDHR
  - Universal Declaration of Human Rights
  - Global Ethics
  - Inalienable Dignity
summary: >-
  The global secular and cross-cultural ethical consensus codified in the 1948 Universal
  Declaration of Human Rights, proclaiming inherent dignity and equal rights for all humans.
canonical_texts:
  - 'Universal Declaration of Human Rights (UDHR, 1948)'
  - 'International Covenant on Civil and Political Rights (ICCPR, 1966)'
  - 'Declaration Toward a Global Ethic (Parliament of the World’s Religions, 1993)'
relations:
  - target: stoic-cosmopolitanism
    type: influenced_by
    certainty: academic_consensus
  - target: kantian-deontology
    type: influenced_by
    certainty: academic_consensus
  - target: ubuntu-ethics
    type: parallel_concept
    certainty: academic_consensus
origin_year: 1948
origin_geo:
  lat: 48.8619
  lng: 2.2885
  place_name: 'Palais de Chaillot, Paris, France (UN General Assembly)'
extinct_year: null
key_tenets:
  - >-
    Article 1 of the UDHR: "All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood."
  - >-
    Universality & Inalienability: Human rights belong inherently to every person simply by virtue of being human; they cannot be given, taken away, or conditioned on gender, race, religion, language, or nationality.
  - >-
    The Global Ethic (Weltethos): The identification of a shared moral core across all world religions and philosophies: the Golden Rule, protection of life, economic justice, speaking truth, and gender equality.
sources:
  - title: 'United Nations: Universal Declaration of Human Rights'
    url: 'https://www.un.org/en/about-us/universal-declaration-of-human-rights'
  - title: 'Hans Küng: "A Global Ethic for Global Politics and Economics"'
    url: 'https://www.oxfordreference.com/'
artifacts:
  - title: Eleanor Roosevelt Holding the Universal Declaration of Human Rights
    imageUrl: /artifacts/human-rights-1.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights
    provenance: Lake Success / Paris (UN Photo Archive)
    period: November 1949
    description: >-
      Iconic photograph of Eleanor Roosevelt holding the Spanish text of the UDHR, which she described as the 'international Magna Carta of all mankind.'
  - title: Preamble of the Universal Declaration of Human Rights Inscription
    imageUrl: /artifacts/human-rights-2.jpg
    sourceUrl: https://en.wikipedia.org/wiki/Universal_Declaration_of_Human_Rights
    provenance: Palais de Chaillot, Paris, France
    period: Adopted 10 December 1948
    description: >-
      Monumental historical document adopted without dissent by the UN General Assembly in Paris following the catastrophic horrors of World War II.
---

# Universal Human Rights & Global Ethical Horizons

## Historical context
Forged in the ashes of the Holocaust and World War II by a drafting committee led by Eleanor Roosevelt (USA), Peng Chun Chang (China), Charles Malik (Lebanon), René Cassin (France), and John Peters Humphrey (Canada), the UDHR became the most translated document in the world.
`
    }
  ];

  for (const node of nodes) {
    await writeFile(node.file, node.content, "utf8");
    console.log(`✅ Created Ethical Tradition node: ${node.file}`);
  }

  console.log("🎉 Complete Philosophical & Ethical Traditions Population!");
}

run().catch(console.error);
