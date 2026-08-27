import fs from "node:fs";
import path from "node:path";

const dir = "public/artifacts";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function createSvg(name, title, subtitle, iconPath, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <radialGradient id="glow-${name}" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35" />
      <stop offset="60%" stop-color="${accentColor}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="300" fill="url(#bg-${name})" />
  <circle cx="200" cy="130" r="110" fill="url(#glow-${name})" />
  
  <!-- Outer border -->
  <rect x="12" y="12" width="376" height="276" rx="8" fill="none" stroke="${accentColor}" stroke-opacity="0.25" stroke-width="1.5" />
  <rect x="16" y="16" width="368" height="268" rx="6" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" />
  
  <!-- Corner decorative brackets -->
  <path d="M 22 34 L 22 22 L 34 22" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" />
  <path d="M 378 34 L 378 22 L 366 22" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" />
  <path d="M 22 266 L 22 278 L 34 278" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" />
  <path d="M 378 266 L 378 278 L 366 278" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" />
  
  <!-- Central Icon / Illustration -->
  <g transform="translate(200, 130)">
    ${iconPath}
  </g>
  
  <!-- Subtitle Tag -->
  <rect x="200" y="222" width="220" height="22" rx="11" transform="translate(-110, 0)" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="1" />
  <text x="200" y="237" font-family="system-ui, -apple-system, sans-serif" font-size="10.5" font-weight="600" fill="${accentColor}" text-anchor="middle" letter-spacing="0.05em">${subtitle.toUpperCase()}</text>
  
  <!-- Title -->
  <text x="200" y="268" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#f8fafc" text-anchor="middle">${title}</text>
</svg>`;
  fs.writeFileSync(path.join(dir, `${name}.svg`), svg, "utf8");
}

// 1. Western Wall
createSvg("judaism-western-wall", "Western Wall & Second Temple", "Jerusalem · c. 19 BCE", `
  <rect x="-60" y="-45" width="120" height="90" rx="3" fill="#334155" opacity="0.4"/>
  <path d="M -50 -35 H 50 M -50 -15 H 50 M -50 5 H 50 M -50 25 H 50" stroke="#f59e0b" stroke-width="2" opacity="0.8"/>
  <path d="M -25 -35 V -15 M 15 -35 V -15 M -40 -15 V 5 M 0 -15 V 5 M 35 -15 V 5 M -20 5 V 25 M 20 5 V 25" stroke="#f59e0b" stroke-width="2" opacity="0.8"/>
  <circle cx="0" cy="-25" r="5" fill="#fbbf24"/>
`, "#f59e0b");

// 2. Torah Scroll / Aleppo Codex
createSvg("judaism-torah-scroll", "Aleppo Codex Manuscript", "Tiberias · c. 920 CE", `
  <rect x="-45" y="-35" width="90" height="70" rx="4" fill="#334155" opacity="0.5"/>
  <path d="M -55 -45 V 45 M 55 -45 V 45" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
  <path d="M -35 -20 H 35 M -35 -5 H 35 M -35 10 H 35 M -35 25 H 20" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
`, "#f59e0b");

// 3. St. Peter Basilica
createSvg("christianity-basilica", "St. Peter's Papal Basilica", "Vatican City · 1626 CE", `
  <path d="M -60 35 H 60 M -45 35 V -5 H 45 V 35 M -30 -5 C -30 -40 30 -40 30 -5 M 0 -40 V -55 M -6 -48 H 6" stroke="#60a5fa" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="0" cy="-20" r="8" fill="#93c5fd" opacity="0.6"/>
`, "#60a5fa");

// 4. Codex Vaticanus
createSvg("christianity-codex", "Codex Vaticanus Greek Bible", "Rome · c. 4th Cent. CE", `
  <path d="M -50 -35 C -20 -42 0 -35 0 -35 C 0 -35 20 -42 50 -35 V 35 C 20 28 0 35 0 35 C 0 35 -20 28 -50 35 Z" fill="#1e293b" stroke="#60a5fa" stroke-width="2.5"/>
  <line x1="0" y1="-35" x2="0" y2="35" stroke="#93c5fd" stroke-width="2"/>
  <path d="M -40 -20 H -10 M -40 -5 H -10 M -40 10 H -10 M 10 -20 H 40 M 10 -5 H 40 M 10 10 H 40" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round"/>
`, "#60a5fa");

// 5. Hagia Sophia
createSvg("orthodoxy-hagia-sophia", "Hagia Sophia Cathedral", "Constantinople · 537 CE", `
  <path d="M -60 35 H 60 M -40 35 V 5 H 40 V 35 M -35 5 C -35 -35 35 -35 35 5" stroke="#38bdf8" stroke-width="3" fill="none"/>
  <path d="M -55 35 V -25 L -50 -40 L -45 -25 V 35 M 55 35 V -25 L 50 -40 L 45 -25 V 35" stroke="#38bdf8" stroke-width="2" fill="none"/>
  <circle cx="0" cy="-12" r="6" fill="#7dd3fc"/>
`, "#38bdf8");

// 6. Sinai Pantocrator Icon
createSvg("orthodoxy-icon-pantocrator", "Sinai Christ Pantocrator Icon", "Sinai · c. 6th Cent. CE", `
  <rect x="-40" y="-45" width="80" height="90" rx="40" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
  <circle cx="0" cy="-10" r="22" fill="none" stroke="#7dd3fc" stroke-width="2"/>
  <path d="M -22 -10 H 22 M 0 -32 V 12" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="0" cy="-10" r="14" fill="#38bdf8" opacity="0.5"/>
`, "#38bdf8");

// 7. Wittenberg Church
createSvg("protestantism-wittenberg", "Wittenberg Castle Church", "Wittenberg · 1517 CE", `
  <path d="M -45 35 H 45 M -30 35 V -15 L 0 -50 L 30 -15 V 35 M -12 35 V 5 C -12 -5 12 -5 12 5 V 35" stroke="#fb923c" stroke-width="2.8" fill="none"/>
  <circle cx="0" cy="-20" r="6" fill="#fdba74"/>
`, "#fb923c");

// 8. Luther Bible
createSvg("protestantism-luther-bible", "Luther Vernacular Bible", "Wittenberg · 1534 CE", `
  <rect x="-40" y="-40" width="80" height="80" rx="6" fill="#1e293b" stroke="#fb923c" stroke-width="3"/>
  <path d="M 0 -25 V 25 M -18 -8 H 18" stroke="#fdba74" stroke-width="4" stroke-linecap="round"/>
`, "#fb923c");

// 9. Dome of the Rock
createSvg("islam-dome-of-rock", "Dome of the Rock Sanctuary", "Jerusalem · 691 CE", `
  <path d="M -50 35 H 50 M -45 35 L -35 5 H 35 L 45 35 M -28 5 C -28 -35 28 -35 28 5 M 0 -35 V -48 L 4 -44" stroke="#34d399" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="0" cy="-12" r="8" fill="#6ee7b7" opacity="0.6"/>
`, "#34d399");

// 10. Blue Quran Folio
createSvg("islam-blue-quran", "Blue Quran Gold Calligraphy", "Kairouan · c. 9th Cent. CE", `
  <rect x="-50" y="-35" width="100" height="70" rx="4" fill="#1e3a8a" stroke="#34d399" stroke-width="2"/>
  <path d="M -38 -15 Q -15 -30 10 -15 T 38 -15 M -38 5 Q -15 -10 10 5 T 38 5 M -38 22 Q -15 10 10 22 T 38 22" stroke="#fbbf24" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`, "#34d399");

// 11. Mahabodhi Temple
createSvg("buddhism-mahabodhi", "Mahabodhi Enlightenment Temple", "Bodh Gaya · c. 250 BCE", `
  <path d="M -55 35 H 55 M -35 35 L -10 -45 L 10 -45 L 35 35 M -20 15 H 20 M -15 -5 H 15 M -10 -25 H 10" stroke="#eab308" stroke-width="2.5" fill="none"/>
  <circle cx="0" cy="-52" r="5" fill="#fde047"/>
`, "#eab308");

// 12. Sarnath Buddha
createSvg("buddhism-sarnath-buddha", "Sarnath Seated Buddha Statue", "Varanasi · c. 5th Cent. CE", `
  <circle cx="0" cy="-22" r="16" fill="none" stroke="#fde047" stroke-width="2"/>
  <circle cx="0" cy="-22" r="26" fill="none" stroke="#eab308" stroke-dasharray="4,4" stroke-width="1.5"/>
  <path d="M -35 35 C -35 15 -18 5 0 5 C 18 5 35 15 35 35 Z" fill="#eab308" opacity="0.6"/>
  <circle cx="0" cy="18" r="6" fill="#fde047"/>
`, "#eab308");

// 13. Brihadisvara Temple
createSvg("hinduism-brihadisvara", "Brihadisvara Dravidian Temple", "Thanjavur · 1010 CE", `
  <path d="M -60 35 H 60 M -40 35 L -8 -45 L 8 -45 L 40 35 M -30 20 H 30 M -22 5 H 22 M -15 -10 H 15 M -10 -28 H 10" stroke="#f97316" stroke-width="2.5" fill="none"/>
  <circle cx="0" cy="-52" r="7" fill="#fdba74"/>
`, "#f97316");

// 14. Nataraja Shiva
createSvg("hinduism-nataraja", "Chola Nataraja Bronze Statue", "Southern India · 10th Cent. CE", `
  <circle cx="0" cy="-2" r="42" fill="none" stroke="#f97316" stroke-width="3"/>
  <path d="M 0 -25 V 20 M -20 -10 H 20 M -15 20 L 0 5 L 15 20 M -25 -5 L 0 -15 L 25 -5" stroke="#fdba74" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="0" cy="-28" r="6" fill="#fed7aa"/>
`, "#f97316");

// 15. Golden Temple Amritsar
createSvg("sikhism-golden-temple", "Harmandir Sahib Golden Temple", "Amritsar · 1604 CE", `
  <path d="M -50 35 H 50 M -35 35 V 0 H 35 V 35 M -25 0 C -25 -30 25 -30 25 0 M 0 -30 V -42" stroke="#eab308" stroke-width="3" fill="none"/>
  <circle cx="0" cy="-14" r="8" fill="#fde047" opacity="0.7"/>
`, "#eab308");

// 16. Itsukushima Torii
createSvg("shinto-torii-gate", "Itsukushima Floating Torii", "Miyajima · 1168 CE", `
  <path d="M -55 -30 Q 0 -40 55 -30 M -45 -18 H 45 M -30 -30 V 35 M 30 -30 V 35 M -60 35 H 60" stroke="#ef4444" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M -50 42 Q 0 38 50 42" stroke="#f87171" stroke-width="1.5" stroke-dasharray="4,4" fill="none"/>
`, "#ef4444");

// 17. Wudang Golden Hall
createSvg("daoism-wudang-hall", "Wudang Mountain Golden Hall", "Hubei · 1416 CE", `
  <path d="M -60 -15 Q 0 -35 60 -15 M -45 -15 L -35 35 H 35 L 45 -15 M -20 35 V 5 H 20 V 35" stroke="#06b6d4" stroke-width="3" fill="none"/>
  <circle cx="0" cy="-10" r="10" fill="#67e8f9" opacity="0.6"/>
`, "#06b6d4");

// 18. Faravahar Relief
createSvg("zoroastrian-faravahar", "Persepolis Faravahar Relief", "Persepolis · c. 515 BCE", `
  <circle cx="0" cy="0" r="18" fill="none" stroke="#a855f7" stroke-width="2.5"/>
  <path d="M -18 0 C -45 -20 -60 0 -60 0 C -45 15 -18 5 -18 0 M 18 0 C 45 -20 60 0 60 0 C 45 15 18 5 18 0" stroke="#c084fc" stroke-width="2.5" fill="none"/>
  <circle cx="0" cy="-18" r="7" fill="#e9d5ff"/>
`, "#a855f7");

// 19. Parthenon
createSvg("ancient-parthenon", "Parthenon Classical Sanctuary", "Athens · 438 BCE", `
  <path d="M -55 -15 L 0 -42 L 55 -15 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="2.5"/>
  <path d="M -55 35 H 55 M -45 -15 V 35 M -27 -15 V 35 M -9 -15 V 35 M 9 -15 V 35 M 27 -15 V 35 M 45 -15 V 35" stroke="#94a3b8" stroke-width="3"/>
`, "#cbd5e1");

// 20. Pyramid of Kukulcan
createSvg("mesoamerican-pyramid", "Pyramid of Kukulcan", "Chichen Itza · c. 900 CE", `
  <path d="M -60 35 L -20 -25 H 20 L 60 35 Z" fill="#1e293b" stroke="#10b981" stroke-width="2.5"/>
  <path d="M -10 -25 V -40 H 10 V -25 M -12 35 L -4 -25 M 12 35 L 4 -25" stroke="#34d399" stroke-width="2"/>
`, "#10b981");

console.log("Successfully generated all bundled local SVG artifact assets.");
