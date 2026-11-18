/**
 * Genera las capturas y gráficos para las tiendas a partir de la web exportada, en español e inglés.
 *
 *   npm run build:web && node scripts/store-assets.cjs
 *
 * Requiere Playwright con Chromium (`npm i --no-save playwright && npx playwright install chromium`).
 * La app se abre con el idioma de cada ficha (el navegador le pasa el locale), así que la interfaz
 * de las capturas sale en el idioma correspondiente.
 * Resultado (<idioma> = es | en):
 *   store/screenshots/<idioma>/<dispositivo>/     capturas en secuencia (historia continua) para subir a la tienda
 *   store/screenshots/raw/<idioma>/<dispositivo>/ capturas sueltas de la app (material de las anteriores)
 *   store/graphics/<idioma>/                      imagen destacada de Google Play, header y search result del App Store
 *   store/graphics/play-icon-512.png              icono de Google Play (sin texto, común a los dos idiomas)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'store');

// Tamaños oficiales: viewport CSS × escala = píxeles finales
const DEVICES = [
  { dir: 'ios-6.9', land: [956, 440], scale: 3 },     // 2868×1320 / 1320×2868
  { dir: 'ios-6.3', land: [874, 402], scale: 3 },     // 2622×1206 / 1206×2622 (iPhone 6,3")
  { dir: 'ipad-13', land: [1376, 1032], scale: 2 },   // 2752×2064 / 2064×2752
  { dir: 'android-phone', land: [960, 540], scale: 2 }, // 1920×1080 / 1080×1920
];

// Colores del logo (assets/brand): oscuro, gris claro y azul
const LOGO = { dark: '#111919', light: '#E1E1E1', blue: '#619EE8' };

// ---------------------------------------------------------------------------
// Textos de cada idioma. `ui` son textos de la app que se usan para pulsar botones: tienen que
// coincidir con src/strings.ts. Los nombres de los modos salen de la propia app (idioma del navegador).
// ---------------------------------------------------------------------------
const LANGS = {
  es: {
    locale: 'es-ES',
    teams: ['Halcones', 'Tritones'],
    ui: { scoringMode: 'Modo de puntuación', menu: 'Menú', settings: 'Ajustes', colorPicker: 'Selector de color', swipeUp: 'Deslizar hacia arriba' },
    story: [
      { eyebrow: 'Marcador de voleibol', title: 'Todo el resultado, a pantalla completa',
        sub: 'Números enormes que se leen desde cualquier punto de la pista.' },
      { eyebrow: 'Un solo dedo', title: 'Toca para sumar. Desliza para corregir.',
        sub: 'Sin botones pequeños en mitad del rally.' },
      { eyebrow: 'Modos de puntuación', title: 'Tus propios modos de puntuación',
        sub: 'Punto doble, 3 seguidas = 1… crea las variantes de tus entrenamientos y cámbialas con un toque.' },
      { eyebrow: 'Gestos', title: 'Cada gesto hace lo que tú elijas',
        sub: 'Mantén pulsado para un punto doble o desliza hacia arriba para deshacer.' },
      { eyebrow: 'A tu manera', title: 'Tus equipos, tus colores',
        sub: 'Nombres, cualquier color y final de set y de partido automáticos.' },
      { title: 'Clipeo Scoreboard', sub: 'El marcador de voleibol que se maneja con un dedo.',
        chips: ['Gratis', 'Sin cuentas', 'Sin anuncios'] },
    ],
    feature: 'Toca para sumar. Desliza para restar.',
    search: { title: 'Marcador de voleibol', sub: 'Toca para sumar. Desliza para corregir.' },
  },
  en: {
    locale: 'en-US',
    teams: ['Hawks', 'Tritons'],
    ui: { scoringMode: 'Scoring mode', menu: 'Menu', settings: 'Settings', colorPicker: 'Color picker', swipeUp: 'Swipe up' },
    story: [
      { eyebrow: 'Volleyball scoreboard', title: 'The whole score, full screen',
        sub: 'Huge numbers you can read from anywhere on the court.' },
      { eyebrow: 'One finger', title: 'Tap to score. Swipe to correct.',
        sub: 'No tiny buttons in the middle of a rally.' },
      { eyebrow: 'Scoring modes', title: 'Your own scoring modes',
        sub: 'Double point, 3 in a row = 1… create the variations you use in practice and switch with one tap.' },
      { eyebrow: 'Gestures', title: 'Every gesture does what you choose',
        sub: 'Long press for a double point or swipe up to undo.' },
      { eyebrow: 'Your way', title: 'Your teams, your colors',
        sub: 'Names, any color, and automatic set and match end.' },
      { title: 'Clipeo Scoreboard', sub: 'The volleyball scoreboard you run with one finger.',
        chips: ['Free', 'No accounts', 'No ads'] },
    ],
    feature: 'Tap to score. Swipe to subtract.',
    search: { title: 'Volleyball scoreboard', sub: 'Tap to score. Swipe to correct.' },
  },
};

// Datos de ejemplo (equipos ficticios) con los colores del logo
const baseConfig = (L) => ({
  teams: {
    a: { name: L.teams[0], bg: LOGO.dark, fg: LOGO.light },
    b: { name: L.teams[1], bg: LOGO.blue, fg: LOGO.dark },
  },
  autoSets: true, pointsPerSet: 25, winByTwo: true, matchEnd: true, setsToWin: 3, decidingSetPoints: 15,
});
const match = (over) => ({
  points: { a: 22, b: 19 }, sets: { a: 1, b: 1 }, progress: { a: 0, b: 0 },
  activeRuleId: 'normal', swapped: false, ...over,
});

const SHOTS = [
  { name: '1-marcador', state: match() },
  { name: '1b-toque', state: match({ points: { a: 23, b: 19 } }) },
  { name: '2-modos', state: match({ points: { a: 14, b: 12 }, sets: { a: 2, b: 1 }, activeRuleId: 'three-for-one', progress: { a: 2, b: 0 } }) },
  { name: '3-selector-modo', state: match({ points: { a: 8, b: 9 } }), action: async (p, ui) => { await p.getByLabel(ui.scoringMode).click(); } },
  { name: '4-menu', state: match({ points: { a: 25, b: 23 } }), action: async (p, ui) => { await p.getByLabel(ui.menu).click(); } },
  {
    name: '5-gestos', state: match(),
    action: async (p, ui) => {
      await p.getByLabel(ui.menu).click(); await p.waitForTimeout(400);
      await p.getByLabel(ui.settings).click(); await p.waitForTimeout(500);
      await p.getByText(ui.swipeUp, { exact: true }).scrollIntoViewIfNeeded();
    },
  },
  {
    name: '6-colores', state: match({ points: { a: 3, b: 5 } }),
    config: (L) => ({ teams: { a: { name: L.teams[0], bg: '#2A9D8F', fg: '#FFFFFF' }, b: { name: L.teams[1], bg: LOGO.blue, fg: LOGO.dark } } }),
    action: async (p, ui) => {
      await p.getByLabel(ui.menu).click(); await p.waitForTimeout(400);
      await p.getByLabel(ui.settings).click(); await p.waitForTimeout(500);
      await p.getByLabel(ui.colorPicker).first().click();
    },
  },
];

function serve(dir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    let file = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dir, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, () => ok(server)));
}

async function shot(browser, base, lang, device, orientation, s) {
  const L = LANGS[lang];
  const [w, h] = orientation === 'land' ? device.land : [device.land[1], device.land[0]];
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: device.scale, colorScheme: 'dark', locale: L.locale,
  });
  // Los datos de ejemplo se cargan antes de que arranque la app (si no, esta guarda los suyos encima)
  await ctx.addInitScript(({ config, state }) => {
    localStorage.setItem('clipeo.config.v1', JSON.stringify(config));
    localStorage.setItem('clipeo.state.v1', JSON.stringify(state));
  }, { config: { ...baseConfig(L), ...(s.config ? s.config(L) : {}) }, state: s.state });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForTimeout(1200);
  if (s.action) { await s.action(p, L.ui); await p.waitForTimeout(700); }
  const dir = path.join(OUT, 'screenshots', 'raw', lang, device.dir);
  fs.mkdirSync(dir, { recursive: true });
  await p.screenshot({ path: path.join(dir, `${s.name}-${orientation === 'land' ? 'horizontal' : 'vertical'}.png`) });
  await ctx.close();
}

const font = (f) => 'data:font/ttf;base64,' + fs.readFileSync(require.resolve(`@expo-google-fonts/${f}`)).toString('base64');
const FONTS = () => `
    @font-face { font-family: SG; src: url(${font('space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf')}); }
    @font-face { font-family: Inter; src: url(${font('inter/500Medium/Inter_500Medium.ttf')}); }`;

async function graphics(browser, lang) {
  const L = LANGS[lang];
  const dir = path.join(OUT, 'graphics', lang);
  fs.mkdirSync(dir, { recursive: true });
  const icon = fs.readFileSync(path.join(ROOT, 'assets/brand/icon-dark.svg'), 'utf8').replace('width="1024" height="1024"', 'width="150" height="150"');
  const html = `<html><head><style>
    @font-face { font-family: SG; src: url(${font('space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf')}); }
    @font-face { font-family: Inter; src: url(${font('inter/500Medium/Inter_500Medium.ttf')}); }
    body { margin: 0; width: 1024px; height: 500px; background: #111919; display: flex; align-items: center; overflow: hidden; font-family: Inter; }
    .text { padding-left: 64px; width: 560px; }
    h1 { font: 700 54px/1 SG; color: #E1E1E1; margin: 20px 0 14px; letter-spacing: -1px; white-space: nowrap; }
    p { color: #94A3B8; font-size: 24px; margin: 0; }
    .icon svg { border-radius: 42px; display: block; }
    .board { width: 300px; height: 200px; margin-left: auto; outline: 2px solid rgba(225,225,225,.14); outline-offset: -1px; display: flex; border-radius: 22px; overflow: hidden; margin-right: 64px; transform: rotate(-4deg); box-shadow: 0 30px 60px -20px #000; }
    .board div { flex: 1; display: grid; place-items: center; font: 700 108px/1 SG; color: #fff; }
  </style></head><body>
    <div class="text"><div class="icon">${icon}</div><h1>Clipeo Scoreboard</h1><p>${L.feature}</p></div>
    <div class="board"><div style="background:#0B1111;color:${LOGO.light}">22</div><div style="background:${LOGO.blue};color:${LOGO.dark}">19</div></div>
  </body></html>`;
  const p = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(dir, 'play-feature-graphic-1024x500.png') });
  await p.close();
}

async function playIcon(browser) {
  const dir = path.join(OUT, 'graphics');
  const p = await browser.newPage();
  const svg = fs.readFileSync(path.join(ROOT, 'assets/brand/icon-light.svg'), 'utf8').replace('width="1024" height="1024"', 'width="512" height="512"');
  await p.setViewportSize({ width: 512, height: 512 });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await p.screenshot({ path: path.join(dir, 'play-icon-512.png') });
  await p.close();
}

// ---------------------------------------------------------------------------
// Capturas en secuencia: un único lienzo de N pantallas que se recorta en N capturas.
// Una línea azul continua (el zigzag de la referencia de VoleyStats) une los móviles,
// que quedan a caballo entre pantallas para que la secuencia se lea como una sola.
// ---------------------------------------------------------------------------
// Pantallas de la secuencia; los textos de cada una están en LANGS[idioma].story (mismo orden)
const STORY_SHOTS = [
  { shot: '1-marcador' },
  { shot: '1b-toque', gestures: true },
  { shot: '3-selector-modo' },
  { shot: '5-gestos' },
  { shot: '6-colores' },
  { closing: true },
];

// Indicadores de gesto sobre la captura: toque con «+1» y flecha de deslizar hacia abajo
const gestureOverlay = (u) => ({
  css: `
    .tap { position: absolute; width: ${11 * u}px; height: ${11 * u}px; margin: ${-5.5 * u}px 0 0 ${-5.5 * u}px; border-radius: 50%;
      border: ${0.6 * u}px solid rgba(225,225,225,.9); box-shadow: 0 0 0 ${2.2 * u}px rgba(225,225,225,.18); }
    .tap span { position: absolute; left: 100%; bottom: 100%; margin-left: ${0.5 * u}px; padding: ${0.5 * u}px ${1.4 * u}px; border-radius: 999px;
      background: ${LOGO.blue}; color: ${LOGO.dark}; font: 700 ${3 * u}px/1 SG; }
    .swipe { position: absolute; transform: translateX(-50%); }`,
  html: `
      <div class="tap" style="left:25%;top:55%"><span>+1</span></div>
      <svg class="swipe" viewBox="0 0 40 100" style="left:75%;top:26%;height:46%">
        <path d="M20 6 L20 88 M8 74 L20 90 L32 74" fill="none" stroke="#111919" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
      </svg>`,
});

async function story(browser, lang, device) {
  const L = LANGS[lang];
  const STORY = STORY_SHOTS.map((st, i) => ({ ...st, ...L.story[i] }));
  const FW = device.land[0] * device.scale;
  const FH = device.land[1] * device.scale;
  const N = STORY.length;
  const u = FH / 100; // unidad: 1% del alto
  const rawDir = path.join(OUT, 'screenshots', 'raw', lang, device.dir);
  const img = (name) => 'data:image/png;base64,' + fs.readFileSync(path.join(rawDir, `${name}-horizontal.png`)).toString('base64');
  const overlayU = gestureOverlay(u);
  const logo = fs.readFileSync(path.join(ROOT, 'assets/brand/icon-light.svg'), 'utf8')
    .replace('width="1024" height="1024"', `width="${30 * u}" height="${30 * u}"`);

  // Móvil: ancho según la proporción de la captura. En pantallas poco apaisadas (iPad) los
  // titulares ocupan más líneas, así que el móvil es más bajo para no taparlos.
  const ratio = device.land[0] / device.land[1];
  const wide = ratio > 1.6;
  const PH = (wide ? 66 : 64) * u, BZ = 1.2 * u, TOP = FH - PH - 4 * u;
  const PW = (PH - 2 * BZ) * ratio + 2 * BZ;
  // Cada móvil dentro de su pantalla, algo desplazado a la derecha; la línea cruza por las uniones
  const centers = STORY.filter((st) => !st.closing).map((_, i) => i + 0.57);

  const phones = STORY.map((st, i) => {
    if (st.closing) return '';
    const left = centers[i] * FW - PW / 2;
    const overlay = st.gestures ? overlayU.html : '';
    return `<div class="phone" style="left:${left}px;top:${TOP}px;width:${PW}px;height:${PH}px">
      <div class="screen"><img src="${img(st.shot)}">${overlay}</div></div>`;
  }).join('');

  const texts = STORY.map((st, i) => st.closing ? `
    <div class="closing" style="left:${i * FW}px;width:${FW}px">
      <div class="logo">${logo}</div>
      <h1 class="ctitle">${st.title}</h1><p class="sub">${st.sub}</p>
      <div class="chips">${st.chips.map((c) => `<span>${c}</span>`).join('')}</div>
    </div>` : `
    <div class="copy" style="left:${i * FW + 7 * u}px">
      <div class="eyebrow">${st.eyebrow}</div><h1>${st.title}</h1><p class="sub">${st.sub}</p>
    </div>`).join('');

  // Línea continua: pasa por detrás de cada móvil y baja en zigzag entre ellos hasta el logo
  // (empieza en el borde izquierdo, baja en cada unión entre pantallas y termina bajo el cierre)
  const mid = TOP + PH * 0.55;
  const pts = [[0, mid - 6 * u]];
  centers.forEach((c, i) => {
    pts.push([c * FW, mid]);
    pts.push([(i + 1) * FW, 97 * u]);
  });
  pts.push([5.5 * FW, 88 * u]); // termina centrada bajo el cierre
  const line = `<svg class="line" width="${N * FW}" height="${FH}"><polyline points="${pts.map((p) => p.join(',')).join(' ')}"
    fill="none" stroke="${LOGO.blue}" stroke-width="${2.2 * u}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const html = `<html><head><style>${FONTS()}
    body { margin: 0; width: ${N * FW}px; height: ${FH}px; background: ${LOGO.dark}; position: relative; overflow: hidden; }
    .line { position: absolute; left: 0; top: 0; }
    .phone { position: absolute; box-sizing: border-box; padding: ${BZ}px; border-radius: ${5.5 * u}px; background: #050808;
      box-shadow: 0 ${3 * u}px ${9 * u}px rgba(0,0,0,.55), inset 0 0 0 ${0.25 * u}px #2C3636; }
    .screen { position: relative; width: 100%; height: 100%; border-radius: ${4.4 * u}px; overflow: hidden; }
    .screen img { display: block; width: 100%; height: 100%; }
    ${overlayU.css}
    .copy { position: absolute; top: ${6 * u}px; width: ${Math.min(FW - 14 * u, 150 * u)}px; }
    .eyebrow { font: 500 ${2.5 * u}px/1 Inter; letter-spacing: .14em; text-transform: uppercase; color: ${LOGO.blue}; margin-bottom: ${1.6 * u}px; }
    h1 { font: 700 ${(wide ? 7.6 : 6.6) * u}px/1.04 SG; color: ${LOGO.light}; margin: 0; letter-spacing: -0.015em; }
    .sub { font: 500 ${(wide ? 3.1 : 2.8) * u}px/1.35 Inter; color: #94A3B8; margin: ${1.6 * u}px 0 0; max-width: ${110 * u}px; }
    .closing { position: absolute; top: 0; height: ${FH}px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .closing .logo svg { border-radius: ${6.8 * u}px; display: block; box-shadow: 0 ${3 * u}px ${9 * u}px rgba(0,0,0,.5); position: relative; }
    .closing .logo { position: relative; z-index: 1; }
    .ctitle { margin-top: ${4 * u}px; font-size: ${7 * u}px; }
    .chips { display: flex; gap: ${1.4 * u}px; margin-top: ${4 * u}px; }
    .chips span { font: 500 ${2.6 * u}px/1 Inter; color: ${LOGO.light}; border: ${0.25 * u}px solid rgba(225,225,225,.25);
      border-radius: 999px; padding: ${1.2 * u}px ${2.4 * u}px; background: ${LOGO.dark}; }
  </style></head><body>${line}${phones}${texts}</body></html>`;

  const p = await browser.newPage({ viewport: { width: N * FW, height: FH } });
  await p.setContent(html);
  await p.waitForTimeout(500);
  const dir = path.join(OUT, 'screenshots', lang, device.dir);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < N; i++) {
    await p.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`), clip: { x: i * FW, y: 0, width: FW, height: FH } });
  }
  await p.screenshot({ path: path.join(dir, 'panorama.png') }); // vista previa de toda la secuencia
  await p.close();
}

// ---------------------------------------------------------------------------
// App Store: header de la ficha y search result (iOS / iPadOS 27).
// Medidas y zonas seguras de «Creative assets specifications» (App Store Connect Help):
//   header         3840×1646 (21:9), zona segura 1646×661 en (1097, 493)
//   search result  3840×2560 (3:2),  zona segura 2168×1030 en (836, 765)
// Lo importante (números, textos, móvil) va dentro de la zona segura; el resto del lienzo es fondo,
// porque Apple lo recorta según el dispositivo y la orientación. PNG sin transparencia.
// Con SAFE_AREA=1 se dibuja la zona segura para revisarla (no subir esas imágenes).
// ---------------------------------------------------------------------------
const APPLE = {
  header: { w: 3840, h: 1646, safe: { x: 1097, y: 493, w: 1646, h: 661 }, file: 'app-store-header-3840x1646.png' },
  search: { w: 3840, h: 2560, safe: { x: 836, y: 765, w: 2168, h: 1030 }, file: 'app-store-search-3840x2560.png' },
};
const safeGuide = (s) => (process.env.SAFE_AREA
  ? `<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;outline:6px dashed #ff3b30;z-index:9"></div>`
  : '');

async function render(browser, w, h, html, file) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.waitForTimeout(400);
  await p.screenshot({ path: file });
  await p.close();
}

/** Header: el propio marcador partido en dos (como el icono), con los números en la zona segura. */
async function appleHeader(browser, lang) {
  const L = LANGS[lang];
  const { w, h, safe, file } = APPLE.header;
  const half = safe.w / 2;
  const team = (name, sets, points, fg, left, tap) => `
    <div class="team" style="left:${left}px;color:${fg}">
      <div class="head"><span class="name">${name}</span><span class="sets" style="border-color:${fg}">${sets}</span></div>
      <div class="num">${points}${tap ? '<div class="tap"><span>+1</span></div>' : ''}</div>
    </div>`;
  const html = `<html><head><style>${FONTS()}
    body { margin: 0; width: ${w}px; height: ${h}px; position: relative; overflow: hidden; display: flex; }
    .half { flex: 1; }
    .team { position: absolute; top: ${safe.y}px; width: ${half}px; height: ${safe.h}px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
    .head { display: flex; align-items: center; gap: 28px; }
    .name { font: 500 60px/1 Inter; letter-spacing: .02em; }
    .sets { min-width: 112px; height: 112px; box-sizing: border-box; border: 6px solid; border-radius: 56px;
      display: grid; place-items: center; font: 700 70px/1 SG; }
    .num { position: relative; font: 700 470px/.8 SG; letter-spacing: -0.02em; }
    .tap { position: absolute; right: -30px; bottom: -40px; width: 150px; height: 150px; border-radius: 50%;
      border: 8px solid rgba(17,25,25,.85); box-shadow: 0 0 0 26px rgba(17,25,25,.14); }
    .tap span { position: absolute; left: 100%; bottom: 100%; padding: 8px 22px; border-radius: 999px;
      background: ${LOGO.dark}; color: ${LOGO.blue}; font: 700 46px/1 SG; letter-spacing: 0; }
  </style></head><body>
    <div class="half" style="background:${LOGO.dark}"></div><div class="half" style="background:${LOGO.blue}"></div>
    ${team(L.teams[0], 2, 22, LOGO.light, safe.x, false)}
    ${team(L.teams[1], 1, 19, LOGO.dark, safe.x + half, true)}
    ${safeGuide(safe)}
  </body></html>`;
  await render(browser, w, h, html, path.join(OUT, 'graphics', lang, file));
}

/** Search result: qué es la app de un vistazo (texto corto) y la app en uso (móvil con el gesto). */
async function appleSearch(browser, lang) {
  const L = LANGS[lang];
  const { w, h, safe, file } = APPLE.search;
  const device = DEVICES[0]; // captura de iPhone en horizontal
  const ratio = device.land[0] / device.land[1];
  const shotPng = fs.readFileSync(path.join(OUT, 'screenshots', 'raw', lang, device.dir, '1b-toque-horizontal.png')).toString('base64');
  const textW = 900, gap = 90;
  const PW = safe.w - textW - gap;
  const BZ = 14;
  const PH = Math.round((PW - 2 * BZ) / ratio + 2 * BZ);
  const PX = safe.x + textW + gap, PY = Math.round(safe.y + (safe.h - PH) / 2);
  const u = PH / 66; // misma escala relativa que los móviles de la secuencia
  const ov = gestureOverlay(u);
  // Línea de fondo: entra por debajo del texto, pasa por detrás del móvil y sale en zigzag
  const line = [[0, 2150], [PX + PW * 0.2, PY + PH * 0.8], [PX + PW * 0.75, 2330], [w, 1380]];
  const html = `<html><head><style>${FONTS()}
    body { margin: 0; width: ${w}px; height: ${h}px; position: relative; overflow: hidden; background: ${LOGO.dark}; }
    .line { position: absolute; left: 0; top: 0; }
    .copy { position: absolute; left: ${safe.x}px; top: ${safe.y}px; width: ${textW}px; height: ${safe.h}px;
      display: flex; flex-direction: column; justify-content: center; }
    h1 { font: 700 132px/1.02 SG; color: ${LOGO.light}; margin: 0; letter-spacing: -0.015em; }
    p { font: 500 60px/1.3 Inter; color: #94A3B8; margin: 40px 0 0; }
    .phone { position: absolute; left: ${PX}px; top: ${PY}px; width: ${PW}px; height: ${PH}px; box-sizing: border-box;
      padding: ${BZ}px; border-radius: ${5.5 * u}px; background: #050808;
      box-shadow: 0 ${3 * u}px ${9 * u}px rgba(0,0,0,.55), inset 0 0 0 ${0.25 * u}px #2C3636; }
    .screen { position: relative; width: 100%; height: 100%; border-radius: ${4.4 * u}px; overflow: hidden; }
    .screen img { display: block; width: 100%; height: 100%; }
    ${ov.css}
  </style></head><body>
    <svg class="line" width="${w}" height="${h}"><polyline points="${line.map((q) => q.join(',')).join(' ')}"
      fill="none" stroke="${LOGO.blue}" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="copy"><h1>${L.search.title}</h1><p>${L.search.sub}</p></div>
    <div class="phone"><div class="screen"><img src="data:image/png;base64,${shotPng}">${ov.html}</div></div>
    ${safeGuide(safe)}
  </body></html>`;
  await render(browser, w, h, html, path.join(OUT, 'graphics', lang, file));
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Falta dist/: ejecuta antes `npm run build:web`');
  const server = await serve(DIST);
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  for (const lang of Object.keys(LANGS)) {
    for (const d of DEVICES) {
      for (const s of SHOTS) await shot(browser, base, lang, d, 'land', s);
      await shot(browser, base, lang, d, 'port', SHOTS[0]);
      await shot(browser, base, lang, d, 'port', SHOTS[2]);
      await story(browser, lang, d);
    }
    await graphics(browser, lang);
    await appleHeader(browser, lang);
    await appleSearch(browser, lang);
  }
  await playIcon(browser);
  await browser.close();
  server.close();
  console.log('Listo: store/screenshots y store/graphics');
})().catch((e) => { console.error(e); process.exit(1); });
