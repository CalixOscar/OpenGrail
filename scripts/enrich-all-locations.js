import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

// Comprehensive catalog of historical locations
const HISTORICAL_PLACES = {
  // Near East / Levant
  "jerusalem": { lat: 31.7683, lng: 35.2137, place_name: "Jerusalem, Southern Levant" },
  "nazareth": { lat: 32.7019, lng: 35.2979, place_name: "Nazareth, Galilee, Levant" },
  "capernaum": { lat: 32.8808, lng: 35.5750, place_name: "Capernaum, Sea of Galilee" },
  "bethlehem": { lat: 31.7054, lng: 35.2024, place_name: "Bethlehem, Judean Hills" },
  "hebron": { lat: 31.5298, lng: 35.0938, place_name: "Hebron, Judean Highlands" },
  "qumran": { lat: 31.7411, lng: 35.4594, place_name: "Qumran, Dead Sea, Judea" },
  "masada": { lat: 31.3156, lng: 35.3539, place_name: "Masada, Judean Desert" },
  "yavne": { lat: 31.8653, lng: 34.7431, place_name: "Yavne, Coastal Plain, Judea" },
  "tiberias": { lat: 32.7940, lng: 35.5312, place_name: "Tiberias, Sea of Galilee" },
  "sepphoris": { lat: 32.7533, lng: 35.2792, place_name: "Sepphoris (Tzipori), Galilee" },
  "safed": { lat: 32.9646, lng: 35.4960, place_name: "Safed (Tzfat), Upper Galilee" },
  "mount_gerizim": { lat: 32.1994, lng: 35.2728, place_name: "Mount Gerizim / Nablus, Samaria" },
  "nablus": { lat: 32.2211, lng: 35.2544, place_name: "Shechem (Nablus), Samaria" },
  "antioch": { lat: 36.2021, lng: 36.1606, place_name: "Antioch, Ancient Syria" },
  "damascus": { lat: 33.5138, lng: 36.2765, place_name: "Damascus, Syria" },
  "aleppo": { lat: 36.2021, lng: 37.1343, place_name: "Aleppo, Northern Syria" },
  "edessa": { lat: 37.1674, lng: 38.7955, place_name: "Edessa (Urfa), Upper Mesopotamia" },
  "nisibis": { lat: 37.0700, lng: 41.2167, place_name: "Nisibis (Nusaybin), Upper Mesopotamia" },
  "lalish": { lat: 36.7703, lng: 43.3017, place_name: "Lalish Valley, Nineveh, Iraq" },
  "baghdad": { lat: 33.3152, lng: 44.3661, place_name: "Baghdad, Mesopotamia" },
  "kufa": { lat: 32.0300, lng: 44.4000, place_name: "Kufa, Mesopotamia, Iraq" },
  "basra": { lat: 30.5081, lng: 47.7835, place_name: "Basra, Southern Mesopotamia" },
  "najaf": { lat: 31.9922, lng: 44.3515, place_name: "Najaf, Iraq" },
  "karbala": { lat: 32.6160, lng: 44.0249, place_name: "Karbala, Iraq" },
  "samarra": { lat: 34.1983, lng: 43.8742, place_name: "Samarra, Iraq" },
  "ctesiphon": { lat: 33.0936, lng: 44.5808, place_name: "Ctesiphon, Mesopotamia" },
  "susa": { lat: 32.1892, lng: 48.2436, place_name: "Susa, Khuzestan, Elam" },
  "mecca": { lat: 21.4225, lng: 39.8262, place_name: "Mecca, Hejaz, Arabia" },
  "medina": { lat: 24.5247, lng: 39.5692, place_name: "Medina (Yathrib), Hejaz, Arabia" },
  "diriyah": { lat: 24.7333, lng: 46.5833, place_name: "Diriyah, Najd, Arabia" },
  "sanaa": { lat: 15.3694, lng: 44.1910, place_name: "Sana'a, Yemen Highlands" },
  "marib": { lat: 15.4200, lng: 45.3300, place_name: "Marib, Kingdom of Saba, Yemen" },
  "muscat": { lat: 23.5859, lng: 58.4059, place_name: "Nizwa / Muscat, Oman" },
  "nizwa": { lat: 22.9333, lng: 57.5333, place_name: "Nizwa, Ad Dakhiliyah, Oman" },
  "shiraz": { lat: 29.5918, lng: 52.5837, place_name: "Shiraz, Fars, Iran" },
  "isfahan": { lat: 32.6546, lng: 51.6680, place_name: "Isfahan, Iran" },
  "qom": { lat: 34.6401, lng: 50.8764, place_name: "Qom, Iran" },
  "mashhad": { lat: 36.2972, lng: 59.6067, place_name: "Mashhad, Khorasan, Iran" },
  "tehran": { lat: 35.6892, lng: 51.3890, place_name: "Tehran, Iran" },
  "tabriz": { lat: 38.0800, lng: 46.2919, place_name: "Tabriz, Iranian Azerbaijan" },
  "balkh": { lat: 36.7551, lng: 66.8975, place_name: "Balkh (Bactra), Central Asia" },
  "uruk": { lat: 31.3222, lng: 45.6361, place_name: "Uruk, Sumer, Mesopotamia" },
  "ur": { lat: 30.9619, lng: 46.1031, place_name: "Ur, Sumer, Mesopotamia" },
  "nippur": { lat: 32.1261, lng: 45.2308, place_name: "Nippur, Sumer, Mesopotamia" },
  "eridu": { lat: 30.8158, lng: 45.9961, place_name: "Eridu, Sumer, Mesopotamia" },
  "lagash": { lat: 31.4114, lng: 46.4069, place_name: "Lagash (Girsu), Sumer" },
  "babylon": { lat: 32.5364, lng: 44.4208, place_name: "Babylon, Mesopotamia" },
  "nineveh": { lat: 36.3590, lng: 43.1520, place_name: "Nineveh, Assyria" },
  "ashur": { lat: 35.4567, lng: 43.2611, place_name: "Ashur, Assyria" },
  "hattusa": { lat: 40.0164, lng: 34.6153, place_name: "Hattusa, Anatolia, Turkey" },
  "ugarit": { lat: 35.6014, lng: 35.7828, place_name: "Ugarit (Ras Shamra), Levant" },
  "tyre": { lat: 33.2705, lng: 35.1966, place_name: "Tyre, Phoenicia, Lebanon" },
  "sidon": { lat: 33.5597, lng: 35.3756, place_name: "Sidon, Phoenicia, Lebanon" },
  "byblos": { lat: 34.1230, lng: 35.6519, place_name: "Byblos, Phoenicia, Lebanon" },
  "petra": { lat: 30.3285, lng: 35.4444, place_name: "Petra, Nabataea, Jordan" },
  "palmyra": { lat: 34.5600, lng: 38.2672, place_name: "Palmyra (Tadmor), Syrian Desert" },
  "amman": { lat: 31.9539, lng: 35.9106, place_name: "Rabbah (Amman), Ammon" },
  "dibon": { lat: 31.5000, lng: 35.7800, place_name: "Dibon, Moab, Jordan" },
  "bosra": { lat: 32.5186, lng: 36.4811, place_name: "Bosra, Hauran, Syria" },
  "gaza": { lat: 31.5000, lng: 34.4667, place_name: "Gaza, Philistia" },
  "ashdod": { lat: 31.8000, lng: 34.6500, place_name: "Ashdod, Philistia" },
  
  // Egypt & Africa
  "alexandria": { lat: 31.2001, lng: 29.9187, place_name: "Alexandria, Egypt" },
  "cairo": { lat: 30.0444, lng: 31.2357, place_name: "Cairo (Fustat), Egypt" },
  "memphis": { lat: 29.8499, lng: 31.2542, place_name: "Memphis, Ancient Egypt" },
  "thebes": { lat: 25.7206, lng: 32.6105, place_name: "Thebes (Luxor), Ancient Egypt" },
  "heliopolis": { lat: 30.1444, lng: 31.3167, place_name: "Heliopolis (Iunu), Egypt" },
  "amarna": { lat: 27.6469, lng: 30.9008, place_name: "Akhetaten (Amarna), Egypt" },
  "abydos": { lat: 26.1844, lng: 31.9189, place_name: "Abydos, Upper Egypt" },
  "philae": { lat: 24.0253, lng: 32.8842, place_name: "Philae (Aswan), Egypt" },
  "axum": { lat: 14.1311, lng: 38.7233, place_name: "Axum, Tigray, Ethiopia" },
  "lalibela": { lat: 12.0322, lng: 39.0475, place_name: "Lalibela, Amhara, Ethiopia" },
  "gondar": { lat: 12.6000, lng: 37.4667, place_name: "Gondar, Ethiopia" },
  "carthage": { lat: 36.8529, lng: 10.3217, place_name: "Carthage (Tunis), North Africa" },
  "hippo": { lat: 36.9000, lng: 7.7667, place_name: "Hippo Regius (Annaba), Algeria" },
  "mbanza_kongo": { lat: -6.2675, lng: 14.2411, place_name: "M'banza-Kongo, Kingdom of Kongo" },
  "ile_ife": { lat: 7.4833, lng: 4.5667, place_name: "Ile-Ife, Osun, Nigeria" },
  "oyo": { lat: 7.8430, lng: 3.9310, place_name: "Old Oyo, Yoruba Kingdom, Nigeria" },
  "ouidah": { lat: 6.3631, lng: 2.0851, place_name: "Ouidah, Kingdom of Dahomey, Benin" },
  "abomey": { lat: 7.1829, lng: 1.9912, place_name: "Abomey, Dahomey, Benin" },
  "kumasi": { lat: 6.6885, lng: -1.6244, place_name: "Kumasi, Ashanti Empire, Ghana" },
  "bandiagara": { lat: 14.3500, lng: -3.6167, place_name: "Bandiagara Escarpment, Dogon, Mali" },
  "dakar": { lat: 14.7167, lng: -17.4677, place_name: "Sine-Saloum (Dakar), Senegal" },
  "harare": { lat: -17.8252, lng: 31.0335, place_name: "Great Zimbabwe / Harare, Zimbabwe" },
  "nairobi": { lat: -1.2921, lng: 36.8219, place_name: "Rift Valley (Nairobi), Kenya" },
  "juba": { lat: 4.8594, lng: 31.5713, place_name: "Bahr el Ghazal (Juba), South Sudan" },
  "ulundi": { lat: -28.3352, lng: 31.4161, place_name: "KwaZulu (Ulundi), South Africa" },
  "kalahari": { lat: -23.0000, lng: 22.0000, place_name: "Kalahari Desert, Botswana/Namibia" },
  "antananarivo": { lat: -18.8792, lng: 47.5079, place_name: "Highlands (Antananarivo), Madagascar" },
  "kingston": { lat: 17.9712, lng: -76.7936, place_name: "Kingston, Jamaica" },
  "port_au_prince": { lat: 18.5944, lng: -72.3074, place_name: "Port-au-Prince, Haiti" },
  "havana": { lat: 23.1136, lng: -82.3666, place_name: "Havana, Cuba" },
  "salvador_bahia": { lat: -12.9777, lng: -38.5016, place_name: "Salvador da Bahia, Brazil" },
  "rio_de_janeiro": { lat: -22.9068, lng: -43.1729, place_name: "Rio de Janeiro, Brazil" },
  "port_of_spain": { lat: 10.6549, lng: -61.5019, place_name: "Port of Spain, Trinidad and Tobago" },

  // Europe / Mediterranean
  "athens": { lat: 37.9838, lng: 23.7275, place_name: "Athens, Attica, Greece" },
  "eleusis": { lat: 38.0408, lng: 23.5414, place_name: "Eleusis, Attica, Greece" },
  "delphi": { lat: 38.4824, lng: 22.5010, place_name: "Delphi, Phocis, Greece" },
  "olympia": { lat: 37.6384, lng: 21.6300, place_name: "Olympia, Elis, Greece" },
  "sparta": { lat: 37.0745, lng: 22.4303, place_name: "Sparta, Laconia, Greece" },
  "samothrace": { lat: 40.4833, lng: 25.5333, place_name: "Samothrace Sanctuary, Aegean Sea" },
  "croton": { lat: 39.0807, lng: 17.1272, place_name: "Crotone (Magna Graecia), Italy" },
  "epidaurus": { lat: 37.5960, lng: 23.0792, place_name: "Epidaurus, Argolis, Greece" },
  "pessinus": { lat: 39.3375, lng: 31.5833, place_name: "Pessinus, Galatia, Anatolia" },
  "ephesus": { lat: 37.9497, lng: 27.3639, place_name: "Ephesus, Ionia, Asia Minor" },
  "rome": { lat: 41.9028, lng: 12.4964, place_name: "Rome, Latium, Italy" },
  "constantinople": { lat: 41.0082, lng: 28.9784, place_name: "Constantinople (Istanbul), Turkey" },
  "ravenna": { lat: 44.4184, lng: 12.2035, place_name: "Ravenna, Emilia-Romagna, Italy" },
  "milan": { lat: 45.4642, lng: 9.1900, place_name: "Milan (Mediolanum), Italy" },
  "assisi": { lat: 43.0707, lng: 12.6173, place_name: "Assisi, Umbria, Italy" },
  "florence": { lat: 43.7696, lng: 11.2558, place_name: "Florence, Tuscany, Italy" },
  "venice": { lat: 45.4408, lng: 12.3155, place_name: "Venice, Veneto, Italy" },
  "avignon": { lat: 43.9493, lng: 4.8055, place_name: "Avignon, Provence, France" },
  "paris": { lat: 48.8566, lng: 2.3522, place_name: "Paris, Île-de-France, France" },
  "lyon": { lat: 45.7640, lng: 4.8357, place_name: "Lyon (Lugdunum), France" },
  "clermont": { lat: 45.7772, lng: 3.0870, place_name: "Clermont-Ferrand, Auvergne, France" },
  "toulouse": { lat: 43.6047, lng: 1.4442, place_name: "Toulouse, Languedoc, France" },
  "albi": { lat: 43.9289, lng: 2.1480, place_name: "Albi / Languedoc, France" },
  "montsegur": { lat: 42.8711, lng: 1.8322, place_name: "Montségur, Pyrenees, France" },
  "geneva": { lat: 46.2044, lng: 6.1432, place_name: "Geneva, Switzerland" },
  "zurich": { lat: 47.3769, lng: 8.5417, place_name: "Zurich, Switzerland" },
  "basel": { lat: 47.5596, lng: 7.5886, place_name: "Basel, Switzerland" },
  "dornach": { lat: 47.4851, lng: 7.6186, place_name: "Dornach, Solothurn, Switzerland" },
  "wittenberg": { lat: 51.8667, lng: 12.6500, place_name: "Wittenberg, Saxony, Germany" },
  "erfurt": { lat: 50.9848, lng: 11.0299, place_name: "Erfurt, Thuringia, Germany" },
  "augsburg": { lat: 48.3705, lng: 10.8978, place_name: "Augsburg, Bavaria, Germany" },
  "munster": { lat: 51.9607, lng: 7.6261, place_name: "Münster, Westphalia, Germany" },
  "kassel": { lat: 51.3127, lng: 9.4797, place_name: "Kassel, Hesse, Germany" },
  "herrnhut": { lat: 51.0189, lng: 14.7431, place_name: "Herrnhut, Saxony, Germany" },
  "prague": { lat: 50.0755, lng: 14.4378, place_name: "Prague, Bohemia, Czech Republic" },
  "tabor": { lat: 49.4144, lng: 14.6578, place_name: "Tábor, South Bohemia, Czech Republic" },
  "london": { lat: 51.5074, lng: -0.1278, place_name: "London, England, UK" },
  "oxford": { lat: 51.7520, lng: -1.2577, place_name: "Oxford, Oxfordshire, England, UK" },
  "cambridge": { lat: 52.2053, lng: 0.1218, place_name: "Cambridge, England, UK" },
  "canterbury": { lat: 51.2802, lng: 1.0789, place_name: "Canterbury, Kent, England, UK" },
  "edinburgh": { lat: 55.9533, lng: -3.1883, place_name: "Edinburgh, Midlothian, Scotland, UK" },
  "glasgow": { lat: 55.8642, lng: -4.2518, place_name: "Glasgow, Scotland, UK" },
  "st_andrews": { lat: 56.3398, lng: -2.7967, place_name: "St Andrews, Fife, Scotland, UK" },
  "dublin": { lat: 53.3498, lng: -6.2603, place_name: "Dublin, Leinster, Ireland" },
  "armagh": { lat: 54.3503, lng: -6.6528, place_name: "Armagh, Ulster, Northern Ireland" },
  "plymouth": { lat: 50.3755, lng: -4.1427, place_name: "Plymouth, Devon, England, UK" },
  "new_forest": { lat: 50.8500, lng: -1.5500, place_name: "New Forest, Hampshire, England, UK" },
  "gastonbury": { lat: 51.1464, lng: -2.7160, place_name: "Glastonbury, Somerset, England, UK" },
  "amsterdam": { lat: 52.3676, lng: 4.9041, place_name: "Amsterdam, North Holland, Netherlands" },
  "leiden": { lat: 52.1601, lng: 4.4970, place_name: "Leiden, South Holland, Netherlands" },
  "utrecht": { lat: 52.0907, lng: 5.1214, place_name: "Utrecht, Netherlands" },
  "uppsala": { lat: 59.8586, lng: 17.6389, place_name: "Old Uppsala, Uppland, Sweden" },
  "stockholm": { lat: 59.3293, lng: 18.0686, place_name: "Stockholm, Sweden" },
  "copenhagen": { lat: 55.6761, lng: 12.5683, place_name: "Copenhagen (Jelling), Denmark" },
  "oslo": { lat: 59.9139, lng: 10.7522, place_name: "Oslo (Trondheim), Norway" },
  "reykjavik": { lat: 64.1466, lng: -21.9426, place_name: "Thingvellir (Reykjavik), Iceland" },
  "helsinki": { lat: 60.1699, lng: 24.9384, place_name: "Helsinki (Turku), Finland" },
  "riga": { lat: 56.9496, lng: 24.1052, place_name: "Riga, Vidzeme, Latvia" },
  "vilnius": { lat: 54.6872, lng: 25.2797, place_name: "Vilnius, Lithuania" },
  "warsaw": { lat: 52.2297, lng: 21.0122, place_name: "Warsaw (Gniezno), Poland" },
  "krakow": { lat: 50.0647, lng: 19.9450, place_name: "Kraków, Lesser Poland" },
  "wroclaw": { lat: 51.1079, lng: 17.0385, place_name: "Wrocław (Silesia), Poland" },
  "kiev": { lat: 50.4501, lng: 30.5234, place_name: "Kyiv, Dnipro Region, Ukraine" },
  "lviv": { lat: 49.8397, lng: 24.0297, place_name: "Lviv (Galicia), Ukraine" },
  "odessa": { lat: 46.4825, lng: 30.7233, place_name: "Odesa, Black Sea Coast, Ukraine" },
  "moscow": { lat: 55.7558, lng: 37.6173, place_name: "Moscow, Russia" },
  "novgorod": { lat: 58.5256, lng: 31.2742, place_name: "Veliky Novgorod, Russia" },
  "st_petersburg": { lat: 59.9311, lng: 30.3609, place_name: "St. Petersburg, Russia" },
  "vladimir": { lat: 56.1290, lng: 40.4066, place_name: "Vladimir, Central Russia" },
  "solovki": { lat: 65.0253, lng: 35.7094, place_name: "Solovetsky Islands, White Sea, Russia" },
  "plovdiv": { lat: 42.1354, lng: 24.7453, place_name: "Plovdiv (Philippopolis), Thrace, Bulgaria" },
  "preslav": { lat: 43.1667, lng: 26.8167, place_name: "Veliki Preslav, Bulgaria" },
  "ohrid": { lat: 41.1172, lng: 20.8019, place_name: "Ohrid, North Macedonia" },
  "tbilisi": { lat: 41.7151, lng: 44.8271, place_name: "Mtskheta / Tbilisi, Georgia" },
  "yerevan": { lat: 40.1792, lng: 44.4991, place_name: "Echmiadzin / Yerevan, Armenia" },

  // South Asia / Dharmic
  "varanasi": { lat: 25.3176, lng: 82.9739, place_name: "Varanasi (Kashi), Uttar Pradesh, India" },
  "sarnath": { lat: 25.3811, lng: 83.0214, place_name: "Sarnath, Uttar Pradesh, India" },
  "bodhgaya": { lat: 24.6961, lng: 84.9869, place_name: "Bodh Gaya, Bihar, India" },
  "rajgir": { lat: 25.0300, lng: 85.4200, place_name: "Rajgir (Rajagriha), Bihar, India" },
  "vaishali": { lat: 25.9900, lng: 85.1300, place_name: "Vaishali, Bihar, India" },
  "nalanda": { lat: 25.1357, lng: 85.4439, place_name: "Nalanda, Bihar, India" },
  "patna": { lat: 25.5941, lng: 85.1376, place_name: "Pataliputra (Patna), Bihar, India" },
  "kushinagar": { lat: 26.7410, lng: 83.8890, place_name: "Kushinagar, Uttar Pradesh, India" },
  "lumbini": { lat: 27.4833, lng: 83.2764, place_name: "Lumbini, Rupandehi, Nepal" },
  "kathmandu": { lat: 27.7172, lng: 85.3240, place_name: "Kathmandu Valley, Nepal" },
  "ayodhya": { lat: 26.7922, lng: 82.1998, place_name: "Ayodhya, Uttar Pradesh, India" },
  "mathura": { lat: 27.4924, lng: 77.6737, place_name: "Mathura, Uttar Pradesh, India" },
  "vrindavan": { lat: 27.5806, lng: 77.7006, place_name: "Vrindavan, Braj, Uttar Pradesh, India" },
  "kurukshetra": { lat: 29.9695, lng: 76.8783, place_name: "Kurukshetra, Haryana, India" },
  "haridwar": { lat: 29.9457, lng: 78.1642, place_name: "Haridwar / Rishikesh, Uttarakhand, India" },
  "prayagraj": { lat: 25.4358, lng: 81.8463, place_name: "Prayagraj (Allahabad), Uttar Pradesh, India" },
  "ujjain": { lat: 23.1765, lng: 75.7885, place_name: "Ujjain (Avanti), Madhya Pradesh, India" },
  "puri": { lat: 19.8135, lng: 85.8312, place_name: "Puri (Jagannath), Odisha, India" },
  "bhubaneswar": { lat: 20.2961, lng: 85.8245, place_name: "Bhubaneswar, Odisha, India" },
  "kolkata": { lat: 22.5726, lng: 88.3639, place_name: "Kolkata (Calcutta), Bengal, India" },
  "kamakhya": { lat: 26.1664, lng: 91.7086, place_name: "Kamakhya (Guwahati), Assam, India" },
  "nabadwip": { lat: 23.4067, lng: 88.3667, place_name: "Nabadwip / Mayapur, Bengal, India" },
  "amritsar": { lat: 31.6340, lng: 74.8723, place_name: "Amritsar, Punjab, India" },
  "kartarpur": { lat: 32.0944, lng: 75.0167, place_name: "Kartarpur, Punjab, Pakistan/India" },
  "anandpur": { lat: 31.2389, lng: 76.4989, place_name: "Anandpur Sahib, Punjab, India" },
  "lahore": { lat: 31.5204, lng: 74.3587, place_name: "Nankana Sahib / Lahore, Punjab" },
  "qadian": { lat: 31.8193, lng: 75.3475, place_name: "Qadian, Gurdaspur, Punjab, India" },
  "kanchipuram": { lat: 12.8342, lng: 79.7036, place_name: "Kanchipuram, Tamil Nadu, India" },
  "srirangam": { lat: 10.8624, lng: 78.6908, place_name: "Srirangam (Tiruchirappalli), Tamil Nadu" },
  "madurai": { lat: 9.9252, lng: 78.1198, place_name: "Madurai, Tamil Nadu, India" },
  "chidambaram": { lat: 11.3994, lng: 79.6936, place_name: "Chidambaram, Tamil Nadu, India" },
  "thanjavur": { lat: 10.7870, lng: 79.1378, place_name: "Thanjavur, Tamil Nadu, India" },
  "tirupati": { lat: 13.6288, lng: 79.4192, place_name: "Tirupati (Tirumala), Andhra Pradesh, India" },
  "sringeri": { lat: 13.4197, lng: 75.2575, place_name: "Sringeri, Western Ghats, Karnataka, India" },
  "udupi": { lat: 13.3409, lng: 74.7421, place_name: "Udupi, Karnataka, India" },
  "shravanabelagola": { lat: 12.8580, lng: 76.4842, place_name: "Shravanabelagola, Hassan, Karnataka" },
  "kottayam": { lat: 9.5916, lng: 76.5222, place_name: "Kottayam / Malabar Coast, Kerala, India" },
  "palitana": { lat: 21.5346, lng: 71.8277, place_name: "Palitana (Shatrunjaya), Gujarat, India" },
  "girnar": { lat: 21.5270, lng: 70.5289, place_name: "Girnar (Junagadh), Gujarat, India" },
  "anuradhapura": { lat: 8.3114, lng: 80.4037, place_name: "Anuradhapura, North Central, Sri Lanka" },
  "kandy": { lat: 7.2906, lng: 80.6337, place_name: "Kandy (Temple of the Tooth), Sri Lanka" },
  "bagan": { lat: 21.1717, lng: 94.8585, place_name: "Bagan, Mandalay Region, Myanmar" },
  "yangon": { lat: 16.8661, lng: 96.1951, place_name: "Yangon (Shwedagon), Myanmar" },
  "chiang_mai": { lat: 18.7883, lng: 98.9853, place_name: "Chiang Mai (Lanna), Thailand" },
  "bangkok": { lat: 13.7563, lng: 100.5018, place_name: "Bangkok (Siam), Thailand" },
  "ayutthaya": { lat: 14.3532, lng: 100.5684, place_name: "Ayutthaya, Chao Phraya, Thailand" },
  "luang_prabang": { lat: 19.8893, lng: 102.1345, place_name: "Luang Prabang, Laos" },
  "angkor": { lat: 13.4125, lng: 103.8670, place_name: "Angkor (Siem Reap), Cambodia" },
  "phnom_penh": { lat: 11.5564, lng: 104.9282, place_name: "Phnom Penh, Cambodia" },
  "lhasa": { lat: 29.6525, lng: 91.1721, place_name: "Lhasa (Potala), U-Tsang, Tibet" },
  "samye": { lat: 29.3275, lng: 91.5033, place_name: "Samye Monastery, Yarlung Valley, Tibet" },
  "sakya": { lat: 28.9031, lng: 88.0169, place_name: "Sakya Monastery, Tsang, Tibet" },
  "tsurphu": { lat: 29.7369, lng: 90.5847, place_name: "Tsurphu Monastery, Tolung, Tibet" },
  "derge": { lat: 31.8083, lng: 98.5806, place_name: "Derge, Kham, Eastern Tibet" },
  "tashilhunpo": { lat: 29.2683, lng: 88.8808, place_name: "Tashi Lhunpo (Shigatse), Tsang, Tibet" },
  "thimphu": { lat: 27.4728, lng: 89.6393, place_name: "Punakha / Thimphu, Bhutan" },
  "leh": { lat: 34.1526, lng: 77.5771, place_name: "Leh, Ladakh, Himalayas" },
  "dharamsala": { lat: 32.2190, lng: 76.3234, place_name: "McLeod Ganj (Dharamsala), HP, India" },

  // East Asia
  "qufu": { lat: 35.5960, lng: 116.9856, place_name: "Qufu, Shandong, China" },
  "luoyang": { lat: 34.6197, lng: 112.4540, place_name: "Luoyang, Henan, China" },
  "xian": { lat: 34.3416, lng: 108.9398, place_name: "Chang'an (Xi'an), Shaanxi, China" },
  "mount_tai": { lat: 36.2558, lng: 117.1086, place_name: "Mount Tai, Shandong, China" },
  "mount_wudang": { lat: 32.4000, lng: 111.0000, place_name: "Mount Wudang, Hubei, China" },
  "mount_longhu": { lat: 28.2800, lng: 117.0300, place_name: "Mount Longhu, Jiangxi, China" },
  "mount_qingcheng": { lat: 30.9000, lng: 103.5700, place_name: "Mount Qingcheng, Sichuan, China" },
  "mount_emei": { lat: 29.5200, lng: 103.3300, place_name: "Mount Emei, Sichuan, China" },
  "mount_wutai": { lat: 39.0200, lng: 113.5800, place_name: "Mount Wutai, Shanxi, China" },
  "mount_jiuhua": { lat: 30.4800, lng: 117.8000, place_name: "Mount Jiuhua, Anhui, China" },
  "mount_putuo": { lat: 30.0000, lng: 122.3800, place_name: "Mount Putuo, Zhoushan, Zhejiang, China" },
  "mount_tiantai": { lat: 29.1700, lng: 121.0300, place_name: "Mount Tiantai, Zhejiang, China" },
  "shaolin": { lat: 34.5086, lng: 112.9367, place_name: "Shaolin / Mount Song, Henan, China" },
  "nanjing": { lat: 32.0603, lng: 118.7969, place_name: "Nanjing, Jiangsu, China" },
  "beijing": { lat: 39.9042, lng: 116.4074, place_name: "Beijing (Forbidden City), China" },
  "hangzhou": { lat: 30.2741, lng: 120.1551, place_name: "Hangzhou (Lin'an), Zhejiang, China" },
  "guangzhou": { lat: 23.1291, lng: 113.2644, place_name: "Guangzhou (Canton), Guangdong, China" },
  "fuzhou": { lat: 26.0745, lng: 119.2965, place_name: "Fuzhou, Fujian, China" },
  "ise": { lat: 34.4550, lng: 136.7256, place_name: "Ise Grand Shrine, Mie, Japan" },
  "izumo": { lat: 35.4008, lng: 132.6858, place_name: "Izumo Taisha, Shimane, Japan" },
  "nara": { lat: 34.6851, lng: 135.8048, place_name: "Nara (Heijo-kyo / Todai-ji), Japan" },
  "kyoto": { lat: 35.0116, lng: 135.7681, place_name: "Kyoto (Heian-kyo), Japan" },
  "mount_hiei": { lat: 35.0700, lng: 135.8400, place_name: "Enryaku-ji / Mount Hiei, Shiga/Kyoto" },
  "mount_koya": { lat: 34.2136, lng: 135.5861, place_name: "Koyasan (Mount Koya), Wakayama, Japan" },
  "kizugawa": { lat: 34.7397, lng: 135.8300, place_name: "Kasagi / Kizugawa, Kyoto, Japan" },
  "kamakura": { lat: 35.3192, lng: 139.5467, place_name: "Kamakura, Kanagawa, Japan" },
  "eiheiji": { lat: 36.0547, lng: 136.3556, place_name: "Eihei-ji, Fukui Prefecture, Japan" },
  "tokyo": { lat: 35.6762, lng: 139.6503, place_name: "Tokyo (Edo / Meiji Jingu), Japan" },
  "tenri": { lat: 34.5969, lng: 135.8386, place_name: "Tenri, Nara Prefecture, Japan" },
  "kameoka": { lat: 35.1325, lng: 135.5753, place_name: "Kameoka / Ayabe, Kyoto, Japan" },
  "mount_fuji": { lat: 35.3606, lng: 138.7274, place_name: "Fujinomiya / Mount Fuji, Shizuoka, Japan" },
  "seoul": { lat: 37.5665, lng: 126.9780, place_name: "Seoul (Hanyang), South Korea" },
  "gyeongju": { lat: 35.8562, lng: 129.2247, place_name: "Gyeongju (Silla Capital), South Korea" },
  "kaesong": { lat: 37.9708, lng: 126.5544, place_name: "Kaesong (Goryeo Capital), North Korea" },
  "haeinsa": { lat: 35.8014, lng: 128.0983, place_name: "Haeinsa / Mount Gaya, South Korea" },
  "iksan": { lat: 35.9483, lng: 126.9578, place_name: "Iksan, North Jeolla, South Korea" },
  "jeongeup": { lat: 35.8242, lng: 127.1480, place_name: "Jeongeup / Moaksan, Jeonbuk, South Korea" },
  "hanoi": { lat: 21.0285, lng: 105.8542, place_name: "Hanoi (Thang Long), Vietnam" },
  "hue": { lat: 16.4637, lng: 107.5909, place_name: "Hue (Annam), Central Vietnam" },
  "tay_ninh": { lat: 11.3104, lng: 106.0984, place_name: "Holy See of Tay Ninh, Vietnam" },
  "an_giang": { lat: 10.5333, lng: 105.3333, place_name: "Chau Doc / An Giang, Mekong Delta, Vietnam" },
  "orkhon": { lat: 47.5500, lng: 102.8333, place_name: "Orkhon Valley (Karakorum), Mongolia" },
  "burkhan_khaldun": { lat: 48.7500, lng: 109.0000, place_name: "Burkhan Khaldun, Khentii, Mongolia" },
  "ulan_ude": { lat: 51.8333, lng: 107.6000, place_name: "Lake Baikal (Ulan-Ude), Buryatia, Siberia" },
  "yakutsk": { lat: 62.0355, lng: 129.6755, place_name: "Lena River Basin (Yakutsk), Sakha, Siberia" },
  "sapporo": { lat: 43.0618, lng: 141.3545, place_name: "Hokkaido (Ainu Mosir), Japan" },

  // Americas / Indigenous & NRMs
  "tenochtitlan": { lat: 19.4326, lng: -99.1332, place_name: "Tenochtitlan (Mexico City), Mexico" },
  "teotihuacan": { lat: 19.6925, lng: -98.8438, place_name: "Teotihuacan, Valley of Mexico" },
  "tula": { lat: 20.0633, lng: -99.3400, place_name: "Tollan (Tula), Hidalgo, Mexico" },
  "monte_alban": { lat: 17.0439, lng: -96.7678, place_name: "Monte Albán / Oaxaca Valley, Mexico" },
  "tzintzuntzan": { lat: 19.6272, lng: -101.5772, place_name: "Tzintzuntzan, Lake Pátzcuaro, Michoacán" },
  "tikal": { lat: 17.2220, lng: -89.6237, place_name: "Tikal, Petén Basin, Maya Lowlands" },
  "chichen_itza": { lat: 20.6843, lng: -88.5678, place_name: "Chichén Itzá, Yucatán, Mexico" },
  "palenque": { lat: 17.4838, lng: -92.0464, place_name: "Palenque (Lakamha), Chiapas, Mexico" },
  "copan": { lat: 14.8400, lng: -89.1400, place_name: "Copán, Copán Valley, Honduras" },
  "cuzco": { lat: -13.5319, lng: -71.9675, place_name: "Cuzco, Sacred Valley, Inca Empire, Peru" },
  "tiwanaku": { lat: -16.5547, lng: -68.6733, place_name: "Tiwanaku, Lake Titicaca, Bolivia" },
  "lake_titicaca": { lat: -15.9254, lng: -69.3354, place_name: "Isla del Sol, Lake Titicaca, Bolivia/Peru" },
  "chavin": { lat: -9.5936, lng: -77.1775, place_name: "Chavín de Huántar, Ancash, Peru" },
  "asuncion": { lat: -25.2637, lng: -57.5759, place_name: "Paraná Basin (Asunción), Paraguay" },
  "pucallpa": { lat: -8.3791, lng: -74.5539, place_name: "Ucayali River (Pucallpa), Peruvian Amazon" },
  "paha_sapa": { lat: 43.8791, lng: -103.4591, place_name: "Paha Sapa (Black Hills), SD/WY, USA" },
  "wounded_knee": { lat: 43.1417, lng: -102.3639, place_name: "Wounded Knee / Pine Ridge, SD, USA" },
  "dinetah": { lat: 36.5000, lng: -108.0000, place_name: "Dinétah (Navajo Nation), Four Corners, USA" },
  "oraibi": { lat: 35.8756, lng: -110.6406, place_name: "Old Oraibi, Third Mesa, Hopi Nation, AZ" },
  "onondaga": { lat: 42.9806, lng: -76.1264, place_name: "Onondaga, Haudenosaunee Territory, NY, USA" },
  "sault_ste_marie": { lat: 46.4953, lng: -84.3453, place_name: "Lake Superior (Anishinaabe), MI/ON" },
  "kituwah": { lat: 35.4389, lng: -83.4111, place_name: "Kituwah Mound (Cherokee), NC/TN, USA" },
  "chaco": { lat: 36.0600, lng: -107.9700, place_name: "Chaco Canyon, San Juan Basin, NM, USA" },
  "cahokia": { lat: 38.6551, lng: -90.0618, place_name: "Cahokia Mounds, Mississippi River, IL, USA" },
  "sitka": { lat: 57.0531, lng: -135.3300, place_name: "Sitka (Tlingit Territory), Alaska, USA" },
  "nuuk": { lat: 64.1814, lng: -51.6941, place_name: "Arctic Circle (Nuuk / Thule), Greenland" },
  "palmyra_ny": { lat: 43.0639, lng: -77.2333, place_name: "Palmyra / Sacred Grove, New York, USA" },
  "fayette_ny": { lat: 42.8536, lng: -76.9067, place_name: "Fayette, Seneca County, New York, USA" },
  "kirtland_oh": { lat: 41.6267, lng: -81.3639, place_name: "Kirtland, Lake County, Ohio, USA" },
  "nauvoo_il": { lat: 40.5500, lng: -91.3833, place_name: "Nauvoo, Hancock County, Illinois, USA" },
  "salt_lake_city": { lat: 40.7608, lng: -111.8910, place_name: "Salt Lake City (Temple Square), Utah, USA" },
  "independence_mo": { lat: 39.0911, lng: -94.4155, place_name: "Independence, Jackson County, Missouri, USA" },
  "boston": { lat: 42.3601, lng: -71.0589, place_name: "Boston, Massachusetts, USA" },
  "lowell": { lat: 42.6334, lng: -71.3162, place_name: "Lowell / Merrimack, Massachusetts, USA" },
  "hydesville": { lat: 43.0786, lng: -77.0636, place_name: "Hydesville (Fox Cottage), New York, USA" },
  "new_york_city": { lat: 40.7128, lng: -74.0060, place_name: "New York City, New York, USA" },
  "brooklyn": { lat: 40.6782, lng: -73.9442, place_name: "Brooklyn / Bethel, New York, USA" },
  "philadelphia": { lat: 39.9526, lng: -75.1652, place_name: "Philadelphia, Pennsylvania, USA" },
  "allegheny_pa": { lat: 40.4500, lng: -80.0167, place_name: "Allegheny (Pittsburgh), Pennsylvania, USA" },
  "washington_dc": { lat: 38.9072, lng: -77.0369, place_name: "Washington, District of Columbia, USA" },
  "battle_creek": { lat: 42.3211, lng: -85.1797, place_name: "Battle Creek, Calhoun County, Michigan, USA" },
  "providence": { lat: 41.8240, lng: -71.4128, place_name: "Providence, Rhode Island, USA" },
  "cane_ridge": { lat: 38.2567, lng: -84.1958, place_name: "Cane Ridge, Bourbon County, Kentucky, USA" },
  "dayton_tn": { lat: 35.4928, lng: -85.0125, place_name: "Dayton / Appalachia, Tennessee, USA" },
  "chattanooga": { lat: 35.0456, lng: -85.3097, place_name: "Cleveland / Chattanooga, Tennessee, USA" },
  "los_angeles": { lat: 34.0522, lng: -118.2437, place_name: "Azusa Street / Los Angeles, California, USA" },
  "san_francisco": { lat: 37.7749, lng: -122.4194, place_name: "San Francisco, California, USA" },
  "san_diego": { lat: 32.7157, lng: -117.1611, place_name: "San Diego (El Cajon), California, USA" },
  "sedona": { lat: 34.8697, lng: -111.7610, place_name: "Sedona / Oak Creek Canyon, Arizona, USA" },
  "waco_tx": { lat: 31.5493, lng: -97.1467, place_name: "Mount Carmel (Waco), Texas, USA" },
  "pasadena": { lat: 34.1478, lng: -118.1445, place_name: "Pasadena, Los Angeles County, California, USA" },
  "cleveland_tn": { lat: 35.1595, lng: -84.8766, place_name: "Cleveland, Bradley County, Tennessee, USA" },
  "topeka_ks": { lat: 39.0558, lng: -95.6890, place_name: "Stone's Folly (Topeka), Kansas, USA" },
  "oneida_ny": { lat: 43.0848, lng: -75.6521, place_name: "Oneida Community, Madison County, NY, USA" },
  "mount_lebanon_ny": { lat: 42.4587, lng: -73.3765, place_name: "New Lebanon (Shakers), Columbia County, NY" },

  // Oceania / Australasia
  "rotorua": { lat: -38.1368, lng: 176.2497, place_name: "Rotorua (Te Arawa), Bay of Plenty, NZ" },
  "waitangi": { lat: -35.2667, lng: 174.0833, place_name: "Bay of Islands (Waitangi), Northland, NZ" },
  "parihaka": { lat: -39.2833, lng: 173.8333, place_name: "Parihaka, Taranaki, Aotearoa (NZ)" },
  "honolulu": { lat: 21.3069, lng: -157.8583, place_name: "Oahu (Honolulu / Heiau), Hawaii, USA" },
  "big_island_hi": { lat: 19.5429, lng: -155.6659, place_name: "Kilauea / Mauna Kea, Island of Hawaii" },
  "rapa_nui": { lat: -27.1127, lng: -109.3497, place_name: "Rano Raraku (Rapa Nui / Easter Island)" },
  "apia": { lat: -13.8333, lng: -171.7667, place_name: "Upolu (Apia), Samoa" },
  "nukualofa": { lat: -21.1343, lng: -175.2018, place_name: "Tongatapu (Nuku'alofa), Kingdom of Tonga" },
  "papeete": { lat: -17.5516, lng: -149.5585, place_name: "Tahiti (Marae Taputapuatea), French Polynesia" },
  "suva": { lat: -18.1416, lng: 178.4419, place_name: "Viti Levu (Suva / Bau), Fiji" },
  "tanna": { lat: -19.5333, lng: 169.3333, place_name: "Tanna Island (Mount Yasur), Vanuatu" },
  "port_moresby": { lat: -9.4438, lng: 147.1803, place_name: "Highlands / Port Moresby, Papua New Guinea" },
  "manus_island": { lat: -2.0917, lng: 147.2833, place_name: "Manus Island (Paliau Movement), PNG" },
  "arnhem_land": { lat: -12.8250, lng: 134.5000, place_name: "Yolngu Country, Arnhem Land, NT, Australia" },
  "uluru": { lat: -25.3444, lng: 131.0369, place_name: "Central Desert (Uluru / Kata Tjuta), Australia" },
  "kimberley": { lat: -17.5000, lng: 126.0000, place_name: "Kimberley (Wandjina Country), WA, Australia" },
  "flinders_ranges": { lat: -31.5000, lng: 138.6000, place_name: "Adnyamathanha (Flinders Ranges), SA, Australia" },
  "murray_river": { lat: -34.5000, lng: 141.0000, place_name: "Ngarrindjeri / Murray River, Australia" },
  "yap": { lat: 9.5333, lng: 138.1167, place_name: "Yap Islands (Stone Money), Micronesia" },
  "pohnpei": { lat: 6.8833, lng: 158.2167, place_name: "Nan Madol, Pohnpei, Micronesia" },
  "saipan": { lat: 15.1833, lng: 145.7500, place_name: "Saipan, Northern Mariana Islands" },
};

function parseYear(era) {
  if (!era) return 0;
  const str = era.trim();
  const isBCE = /BCE|BC/i.test(str);
  
  const centMatch = str.match(/(\d+)(?:st|nd|rd|th)?(?:\s*[-–—]\s*(\d+)(?:st|nd|rd|th)?)?\s*centur/i);
  if (centMatch) {
    let c = parseInt(centMatch[1], 10);
    return isBCE ? -(c * 100 - 50) : ((c - 1) * 100 + 50);
  }
  
  const milMatch = str.match(/(\d+)(?:st|nd|rd|th)?\s*millennium/i);
  if (milMatch) {
    let m = parseInt(milMatch[1], 10);
    return isBCE ? -(m * 1000 - 500) : ((m - 1) * 1000 + 500);
  }

  const clean = str.replace(/,/g, "");
  const numMatch = clean.match(/(\d+)(?:s)?/);
  if (numMatch) {
    let y = parseInt(numMatch[1], 10);
    return isBCE ? -y : y;
  }
  return 0;
}

function stableHash(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Extinct year overrides
const EXTINCT_MAP = {
  "atenism": -1336,
  "akkadian-religion": -539,
  "ancient-egyptian-religion": 535,
  "assyrian-religion": -609,
  "babylonian-religion": -100,
  "canaanite-religion": -300,
  "amun-cult-thebes": 390,
  "heliopolitan-theology": 390,
  "memphite-theology": 390,
  "osiris-cult": 535,
  "hittite-religion": -1180,
  "hurrian-religion": -1000,
  "ammonite-religion": -580,
  "ancient-arabian-religions": 630,
  "edomite-religion": -580,
  "moabite-religion": -580,
  "philistine-religion": -600,
  "ugaritic-religion": -1185,
  "ashur-cult": -609,
  "enki-ea-cult": -300,
  "enlil-cult-nippur": -300,
  "inanna-ishtar-cult": 350,
  "marduk-cult": -100,
  "ancient-greek-religion": 395,
  "cult-of-isis": 535,
  "eleusinian-mysteries": 392,
  "hellenistic-religion": 529,
  "mithraism": 400,
  "asclepius-cult": 400,
  "cybele-attis-cult": 395,
  "dionysian-mysteries": 395,
  "samothracian-mysteries": 392,
  "serapis-cult": 391,
  "neoplatonism": 529,
  "orphism": 400,
  "epicureanism": 400,
  "middle-platonism": 250,
  "pythagoreanism": 350,
  "stoicism": 400,
  "roman-imperial-cult": 395,
  "roman-religion": 395,
  "manichaeism": 1600,
  "mazdakism": 530,
  "zurvanism": 900,
  "khurramism": 950,
  "sasanian-zoroastrianism": 651,
  "catharism": 1321,
  "bogomilism": 1450,
  "gnosticism": 450,
  "valentinianism": 400,
  "sethianism": 350,
  "marcionism": 450,
  "montanism": 550,
  "arianism": 381,
  "nestorianism": 1300,
  "paulicianism": 1000,
  "taborites": 1452,
  "anabaptist-munster-rebellion": 1535,
  "shakers": 1900,
  "oneida-community": 1881,
  "aztec-religion": 1521,
  "inca-religion": 1572,
  "maya-religion": 1697,
  "purepecha-religion": 1530,
  "zapotec-religion": 1550,
  "anglo-saxon-heathenry": 750,
  "gaulish-religion": 450,
  "gaelic-polytheism": 600,
  "celtic-religion": 600,
  "norse-religion": 1100,
  "slavic-religion": 1200,
  "baltic-religion": 1400,
  "finnish-religion": 1300,
  "heaven-s-gate": 1997,
  "branch-davidians-waco": 1993,
  "peoples-temple": 1978,
  "order-of-the-solar-temple": 1997,
  "aum-shinrikyo": 2000,
};

// Precise keyword and pattern matcher for every node
function resolveLocation(node, filePath) {
  const id = node.id.toLowerCase();
  const title = (node.title || "").toLowerCase();
  const summary = (node.summary || "").toLowerCase();
  const p = filePath.toLowerCase();

  // Explicit ID match
  if (id.includes("latter-day-saint") || id === "mormonism" || id === "lds-church") return HISTORICAL_PLACES.salt_lake_city;
  if (id.includes("community-of-christ") || id.includes("temple-lot")) return HISTORICAL_PLACES.independence_mo;
  if (id.includes("strangite") || id.includes("bickertonite")) return HISTORICAL_PLACES.kirtland_oh;
  if (id.includes("fldds") || id.includes("apostolic-united-brethren")) return HISTORICAL_PLACES.salt_lake_city;
  if (id.includes("branch-davidian") || id.includes("waco")) return HISTORICAL_PLACES.waco_tx;
  if (id.includes("peoples-temple")) return HISTORICAL_PLACES.san_francisco;
  if (id.includes("heaven-s-gate")) return HISTORICAL_PLACES.san_diego;
  if (id.includes("scientology")) return HISTORICAL_PLACES.los_angeles;
  if (id.includes("christian-science")) return HISTORICAL_PLACES.boston;
  if (id.includes("seventh-day-adventist") || id.includes("millerism")) return HISTORICAL_PLACES.battle_creek;
  if (id.includes("jehovahs-witnesses") || id.includes("bible-students")) return HISTORICAL_PLACES.allegheny_pa;
  if (id.includes("christadelphian")) return HISTORICAL_PLACES.london;
  if (id.includes("shaker")) return HISTORICAL_PLACES.mount_lebanon_ny;
  if (id.includes("oneida")) return HISTORICAL_PLACES.oneida_ny;
  if (id.includes("unitarian-universalism") || id.includes("transcendentalism")) return HISTORICAL_PLACES.boston;
  if (id.includes("theosophy") || id.includes("theosophical")) return HISTORICAL_PLACES.new_york_city;
  if (id.includes("anthroposophy")) return HISTORICAL_PLACES.dornach;
  if (id.includes("thelema") || id.includes("oto") || id.includes("ordo-templi")) return HISTORICAL_PLACES.cairo;
  if (id.includes("wicca") || id.includes("gardnerian") || id.includes("alexandrian-wicca")) return HISTORICAL_PLACES.new_forest;
  if (id.includes("druidry") || id.includes("celtic-reconstructionist")) return HISTORICAL_PLACES.gastonbury;
  if (id.includes("heathenry") || id.includes("asatro") || id.includes("forn-sidr")) return HISTORICAL_PLACES.uppsala;
  if (id.includes("rodnovery") || id.includes("slavic-native")) return HISTORICAL_PLACES.krakow;
  if (id.includes("romuva")) return HISTORICAL_PLACES.vilnius;
  if (id.includes("dievturiba")) return HISTORICAL_PLACES.riga;
  if (id.includes("ukrainian-native")) return HISTORICAL_PLACES.kiev;
  if (id.includes("church-of-satan") || id.includes("laVeyan")) return HISTORICAL_PLACES.san_francisco;
  if (id.includes("satanic-temple")) return HISTORICAL_PLACES.boston;
  if (id.includes("temple-of-set")) return HISTORICAL_PLACES.san_francisco;
  if (id.includes("unification-movement") || id.includes("moonies")) return HISTORICAL_PLACES.seoul;
  if (id.includes("caodai") || id.includes("cao-dai")) return HISTORICAL_PLACES.tay_ninh;
  if (id.includes("hoa-hao")) return HISTORICAL_PLACES.an_giang;
  if (id.includes("tenrikyo")) return HISTORICAL_PLACES.tenri;
  if (id.includes("omoto")) return HISTORICAL_PLACES.kameoka;
  if (id.includes("seicho-no-ie")) return HISTORICAL_PLACES.tokyo;
  if (id.includes("sukyo-mahikari") || id.includes("shinreikyo")) return HISTORICAL_PLACES.tokyo;
  if (id.includes("aum-shinrikyo")) return HISTORICAL_PLACES.tokyo;
  if (id.includes("cheondoism") || id.includes("donghak")) return HISTORICAL_PLACES.seoul;
  if (id.includes("jeungsanism") || id.includes("daesun")) return HISTORICAL_PLACES.jeongeup;
  if (id.includes("won-buddhism")) return HISTORICAL_PLACES.iksan;
  if (id.includes("falun-gong")) return HISTORICAL_PLACES.beijing;
  if (id.includes("yiguandao")) return HISTORICAL_PLACES.nanjing;
  if (id.includes("tengrism") || id.includes("mongolian-shamanism")) return HISTORICAL_PLACES.orkhon;
  if (id.includes("siberian-shamanism")) return HISTORICAL_PLACES.ulan_ude;
  if (id.includes("ainu")) return HISTORICAL_PLACES.sapporo;
  if (id.includes("ghost-dance")) return HISTORICAL_PLACES.wounded_knee;
  if (id.includes("native-american-church") || id.includes("peyote")) return HISTORICAL_PLACES.paha_sapa;
  if (id.includes("haudenosaunee") || id.includes("iroquois") || id.includes("handsome-lake")) return HISTORICAL_PLACES.onondaga;
  if (id.includes("dine") || id.includes("navajo")) return HISTORICAL_PLACES.dinetah;
  if (id.includes("hopi")) return HISTORICAL_PLACES.oraibi;
  if (id.includes("lakota") || id.includes("sioux") || id.includes("sundance")) return HISTORICAL_PLACES.paha_sapa;
  if (id.includes("anishinaabe") || id.includes("ojibwe")) return HISTORICAL_PLACES.sault_ste_marie;
  if (id.includes("cherokee")) return HISTORICAL_PLACES.kituwah;
  if (id.includes("muscogee") || id.includes("creek")) return HISTORICAL_PLACES.cahokia;
  if (id.includes("tlingit") || id.includes("haida")) return HISTORICAL_PLACES.sitka;
  if (id.includes("inuit")) return HISTORICAL_PLACES.nuuk;
  if (id.includes("maya") || id.includes("quiche") || id.includes("popol-wuj")) return HISTORICAL_PLACES.tikal;
  if (id.includes("aztec") || id.includes("mexica") || id.includes("nahua")) return HISTORICAL_PLACES.tenochtitlan;
  if (id.includes("zapotec")) return HISTORICAL_PLACES.monte_alban;
  if (id.includes("purepecha") || id.includes("tarascan")) return HISTORICAL_PLACES.tzintzuntzan;
  if (id.includes("inca") || id.includes("quechua")) return HISTORICAL_PLACES.cuzco;
  if (id.includes("aymara")) return HISTORICAL_PLACES.tiwanaku;
  if (id.includes("guarani")) return HISTORICAL_PLACES.asuncion;
  if (id.includes("shipibo")) return HISTORICAL_PLACES.pucallpa;
  if (id.includes("yoruba") || id.includes("ifa") || id.includes("orisha")) return HISTORICAL_PLACES.ile_ife;
  if (id.includes("vodun") || id.includes("fon")) return HISTORICAL_PLACES.ouidah;
  if (id.includes("akan") || id.includes("ashanti")) return HISTORICAL_PLACES.kumasi;
  if (id.includes("dogon")) return HISTORICAL_PLACES.bandiagara;
  if (id.includes("kongo") || id.includes("bakongo")) return HISTORICAL_PLACES.mbanza_kongo;
  if (id.includes("dinka")) return HISTORICAL_PLACES.juba;
  if (id.includes("maasai")) return HISTORICAL_PLACES.nairobi;
  if (id.includes("zulu")) return HISTORICAL_PLACES.ulundi;
  if (id.includes("shona")) return HISTORICAL_PLACES.harare;
  if (id.includes("san-religious") || id.includes("bushmen")) return HISTORICAL_PLACES.kalahari;
  if (id.includes("malagasy")) return HISTORICAL_PLACES.antananarivo;
  if (id.includes("candomble")) return HISTORICAL_PLACES.salvador_bahia;
  if (id.includes("umbanda") || id.includes("quimbanda")) return HISTORICAL_PLACES.rio_de_janeiro;
  if (id.includes("santeria") || id.includes("lucumi")) return HISTORICAL_PLACES.havana;
  if (id.includes("haitian-vodou")) return HISTORICAL_PLACES.port_au_prince;
  if (id.includes("rastafari")) return HISTORICAL_PLACES.kingston;
  if (id.includes("hoodoo")) return HISTORICAL_PLACES.salvador_bahia;
  if (id.includes("palo")) return HISTORICAL_PLACES.havana;
  if (id.includes("trinidad-orisha")) return HISTORICAL_PLACES.port_of_spain;
  if (id.includes("maori") || id.includes("ratana") || id.includes("ringatu")) return HISTORICAL_PLACES.rotorua;
  if (id.includes("hawaiian")) return HISTORICAL_PLACES.honolulu;
  if (id.includes("samoan")) return HISTORICAL_PLACES.apia;
  if (id.includes("tongan")) return HISTORICAL_PLACES.nukualofa;
  if (id.includes("tahitian")) return HISTORICAL_PLACES.papeete;
  if (id.includes("rapa-nui")) return HISTORICAL_PLACES.rapa_nui;
  if (id.includes("fijian")) return HISTORICAL_PLACES.suva;
  if (id.includes("john-frum") || id.includes("prince-philip") || id.includes("cargo-cult")) return HISTORICAL_PLACES.tanna;
  if (id.includes("aboriginal") || id.includes("yolngu")) return HISTORICAL_PLACES.arnhem_land;
  if (id.includes("central-desert") || id.includes("pitjantjatjara")) return HISTORICAL_PLACES.uluru;

  // Regional paths
  if (p.includes("/protestant/lutheran")) return HISTORICAL_PLACES.wittenberg;
  if (p.includes("/protestant/reformed") || p.includes("calvinism") || p.includes("presbyterian")) return HISTORICAL_PLACES.geneva;
  if (p.includes("/protestant/anabaptist") || p.includes("mennonite") || p.includes("amish") || p.includes("hutterite")) return HISTORICAL_PLACES.zurich;
  if (p.includes("/protestant/anglican") || p.includes("church-of-england") || p.includes("episcopalian")) return HISTORICAL_PLACES.canterbury;
  if (p.includes("/protestant/methodist") || p.includes("wesleyan")) return HISTORICAL_PLACES.oxford;
  if (p.includes("/protestant/baptist")) return HISTORICAL_PLACES.london;
  if (p.includes("/protestant/pentecostal") || p.includes("charismatic") || p.includes("assemblies-of-god")) return HISTORICAL_PLACES.los_angeles;
  if (p.includes("/protestant/hussite") || p.includes("moravian")) return HISTORICAL_PLACES.prague;
  if (p.includes("/catholic/")) return HISTORICAL_PLACES.rome;
  if (p.includes("/eastern-orthodox/russian") || p.includes("/eastern-orthodox/slavic")) return HISTORICAL_PLACES.moscow;
  if (p.includes("/eastern-orthodox/greek") || p.includes("/eastern-orthodox/byzantine")) return HISTORICAL_PLACES.constantinople;
  if (p.includes("/oriental-orthodox/coptic")) return HISTORICAL_PLACES.alexandria;
  if (p.includes("/oriental-orthodox/armenian")) return HISTORICAL_PLACES.yerevan;
  if (p.includes("/oriental-orthodox/syriac")) return HISTORICAL_PLACES.antioch;
  if (p.includes("/oriental-orthodox/ethiopian")) return HISTORICAL_PLACES.axum;
  if (p.includes("/oriental-orthodox/indian") || p.includes("malankara")) return HISTORICAL_PLACES.kottayam;
  if (p.includes("/islam/sunni/hanafi")) return HISTORICAL_PLACES.kufa;
  if (p.includes("/islam/sunni/maliki")) return HISTORICAL_PLACES.medina;
  if (p.includes("/islam/sunni/shafii")) return HISTORICAL_PLACES.cairo;
  if (p.includes("/islam/sunni/hanbali")) return HISTORICAL_PLACES.baghdad;
  if (p.includes("/islam/shia/twelver")) return HISTORICAL_PLACES.qom;
  if (p.includes("/islam/shia/ismail")) return HISTORICAL_PLACES.cairo;
  if (p.includes("/islam/shia/zaidi")) return HISTORICAL_PLACES.sanaa;
  if (p.includes("/islam/ibadi")) return HISTORICAL_PLACES.muscat;
  if (p.includes("/islam/sufi")) return HISTORICAL_PLACES.baghdad;
  if (p.includes("/judaism/hasidic")) return HISTORICAL_PLACES.lviv;
  if (p.includes("/judaism/kabbalah")) return HISTORICAL_PLACES.safed;
  if (p.includes("/judaism/rabbinic")) return HISTORICAL_PLACES.yavne;
  if (p.includes("/judaism/karaite")) return HISTORICAL_PLACES.baghdad;
  if (p.includes("/judaism/samaritan")) return HISTORICAL_PLACES.mount_gerizim;
  if (p.includes("/gnostic/")) return HISTORICAL_PLACES.alexandria;
  if (p.includes("/buddhist/tibetan")) return HISTORICAL_PLACES.lhasa;
  if (p.includes("/buddhist/zen")) return HISTORICAL_PLACES.kyoto;
  if (p.includes("/buddhist/chan")) return HISTORICAL_PLACES.luoyang;
  if (p.includes("/buddhist/pure-land")) return HISTORICAL_PLACES.luoyang;
  if (p.includes("/buddhist/theravada")) return HISTORICAL_PLACES.anuradhapura;
  if (p.includes("/buddhist/nichiren")) return HISTORICAL_PLACES.kamakura;
  if (p.includes("/hindu/vaishnava")) return HISTORICAL_PLACES.vrindavan;
  if (p.includes("/hindu/shaiva")) return HISTORICAL_PLACES.varanasi;
  if (p.includes("/hindu/shakta") || p.includes("/hindu/tantra")) return HISTORICAL_PLACES.kamakhya;
  if (p.includes("/hindu/vedanta")) return HISTORICAL_PLACES.kanchipuram;
  if (p.includes("/jain/")) return HISTORICAL_PLACES.patna;
  if (p.includes("/sikh/")) return HISTORICAL_PLACES.amritsar;
  if (p.includes("/daoist/")) return HISTORICAL_PLACES.luoyang;
  if (p.includes("/confucian/")) return HISTORICAL_PLACES.qufu;
  if (p.includes("/shinto/")) return HISTORICAL_PLACES.ise;
  if (p.includes("/korean/")) return HISTORICAL_PLACES.seoul;
  if (p.includes("/vietnamese/")) return HISTORICAL_PLACES.hanoi;
  if (p.includes("/mesopotamia/")) return HISTORICAL_PLACES.babylon;
  if (p.includes("/egypt/")) return HISTORICAL_PLACES.thebes;
  if (p.includes("/mystery-cults/")) return HISTORICAL_PLACES.eleusis;
  if (p.includes("/philosophical-schools/")) return HISTORICAL_PLACES.athens;
  if (p.includes("/iranian/")) return HISTORICAL_PLACES.isfahan;
  if (p.includes("/oceanic-australasian/")) return HISTORICAL_PLACES.tanna;
  if (p.includes("/inner-asian/")) return HISTORICAL_PLACES.orkhon;

  // Fallbacks by cluster
  if (node.cluster === "Abrahamic") return HISTORICAL_PLACES.jerusalem;
  if (node.cluster === "Dharmic") return HISTORICAL_PLACES.varanasi;
  if (node.cluster === "East Asian") return HISTORICAL_PLACES.qufu;
  if (node.cluster === "Indigenous & Diasporic") return HISTORICAL_PLACES.ile_ife;
  if (node.cluster === "Iranian") return HISTORICAL_PLACES.isfahan;
  if (node.cluster === "Ancient Near East") return HISTORICAL_PLACES.babylon;
  if (node.cluster === "Ancient Mediterranean") return HISTORICAL_PLACES.athens;
  if (node.cluster === "Ancient European") return HISTORICAL_PLACES.uppsala;
  if (node.cluster === "Esoteric & Modern") return HISTORICAL_PLACES.london;
  return HISTORICAL_PLACES.geneva;
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
  console.log(`Processing ${files.length} markdown files...`);

  // Group nodes by base place to apply gentle deterministic spread so each node is distinctly visible
  const parsedRecords = [];
  for (const filePath of files) {
    const raw = await readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    const baseGeo = resolveLocation(data, filePath);
    const originYear = parseYear(data.era_start);
    let extinctYear = EXTINCT_MAP[data.id] ?? null;
    if (extinctYear === null) {
      const p = filePath.toLowerCase();
      if (p.includes("/ancient-near-east/")) extinctYear = -300;
      else if (p.includes("/ancient-mediterranean/mystery-cults/")) extinctYear = 400;
      else if (p.includes("/ancient-mediterranean/philosophical-schools/")) extinctYear = 529;
      else if (p.includes("/european-traditions/historical/")) extinctYear = 1000;
    }

    parsedRecords.push({
      filePath,
      data,
      content,
      baseGeo,
      originYear,
      extinctYear,
    });
  }

  // Count items per base location
  const locationGroups = new Map();
  for (const record of parsedRecords) {
    const key = `${record.baseGeo.lat},${record.baseGeo.lng}`;
    if (!locationGroups.has(key)) locationGroups.set(key, []);
    locationGroups.get(key).push(record);
  }

  console.log(`Resolved across ${locationGroups.size} unique historical centers.`);

  let updatedCount = 0;
  for (const [key, records] of locationGroups.entries()) {
    records.sort((a, b) => a.data.id.localeCompare(b.data.id));

    records.forEach((record, index) => {
      let lat = record.baseGeo.lat;
      let lng = record.baseGeo.lng;

      if (records.length > 1) {
        // Apply deterministic spiral spread (0.15 to 0.8 degrees radius) so every single tradition is distinct on globe
        const angle = index * 2.399963 + (stableHash(record.data.id) % 360) * (Math.PI / 180);
        const radiusDeg = Math.min(0.85, 0.08 + Math.sqrt(index) * 0.11);
        lat = Number((lat + Math.sin(angle) * radiusDeg).toFixed(4));
        lng = Number((lng + (Math.cos(angle) * radiusDeg) / Math.cos((lat * Math.PI) / 180)).toFixed(4));
      }

      record.data.origin_year = record.originYear;
      record.data.origin_geo = {
        lat,
        lng,
        place_name: record.baseGeo.place_name,
      };
      record.data.extinct_year = record.extinctYear;
    });
  }

  for (const record of parsedRecords) {
    const newContent = matter.stringify(record.content, record.data);
    await writeFile(record.filePath, newContent, "utf8");
    updatedCount++;
  }

  console.log(`Updated frontmatter in ${updatedCount} files with distinct geographical positions.`);
}

run().catch(console.error);
