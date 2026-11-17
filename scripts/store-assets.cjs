/**
 * Genera las capturas y gráficos para las tiendas a partir de la web exportada.
 *
 *   npm run build:web && node scripts/store-assets.cjs
 *
 * Requiere Playwright con Chromium (`npm i -D playwright && npx playwright install chromium`).
 * Resultado:
 *   store/screenshots/<dispositivo>/   capturas en secuencia (historia continua) para subir a la tienda
 *   store/screenshots/raw/<dispositivo>/ capturas sueltas de la app (material de las anteriores)
 *   store/graphics/                    imagen destacada e icono de Google Play
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
  { dir: 'ipad-13', land: [1376, 1032], scale: 2 },   // 2752×2064 / 2064×2752
  { dir: 'android-phone', land: [960, 540], scale: 2 }, // 1920×1080 / 1080×1920
];

// Colores del logo (assets/brand): oscuro, gris claro y azul
const LOGO = { dark: '#111919', light: '#E1E1E1', blue: '#619EE8' };

// Datos de ejemplo (equipos ficticios) con los colores del logo
const baseConfig = {
  teams: {
    a: { name: 'Halcones', bg: LOGO.dark, fg: LOGO.light },
    b: { name: 'Tritones', bg: LOGO.blue, fg: LOGO.dark },
  },
  autoSets: true, pointsPerSet: 25, winByTwo: true, matchEnd: true, setsToWin: 3, decidingSetPoints: 15,
};
const match = (over) => ({
  points: { a: 22, b: 19 }, sets: { a: 1, b: 1 }, progress: { a: 0, b: 0 },
  activeRuleId: 'normal', swapped: false, ...over,
});

const SHOTS = [
  { name: '1-marcador', state: match() },
  { name: '1b-toque', state: match({ points: { a: 23, b: 19 } }) },
  { name: '2-modos', state: match({ points: { a: 14, b: 12 }, sets: { a: 2, b: 1 }, activeRuleId: 'three-for-one', progress: { a: 2, b: 0 } }) },
  { name: '3-selector-modo', state: match({ points: { a: 8, b: 9 } }), action: async (p) => { await p.getByLabel('Modo de puntuación').click(); } },
  { name: '4-menu', state: match({ points: { a: 25, b: 23 } }), action: async (p) => { await p.getByLabel('Menú').click(); } },
  {
    name: '5-gestos', state: match(),
    action: async (p) => {
      await p.getByLabel('Menú').click(); await p.waitForTimeout(400);
      await p.getByLabel('Ajustes').click(); await p.waitForTimeout(500);
      await p.getByText('Deslizar hacia arriba', { exact: true }).scrollIntoViewIfNeeded();
    },
  },
  {
    name: '6-colores', state: match({ points: { a: 3, b: 5 } }),
    config: { teams: { a: { name: 'Halcones', bg: '#2A9D8F', fg: '#FFFFFF' }, b: { name: 'Tritones', bg: LOGO.blue, fg: LOGO.dark } } },
    action: async (p) => {
      await p.getByLabel('Menú').click(); await p.waitForTimeout(400);
      await p.getByLabel('Ajustes').click(); await p.waitForTimeout(500);
      await p.getByLabel('Selector de color').first().click();
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

async function shot(browser, base, device, orientation, s) {
  const [w, h] = orientation === 'land' ? device.land : [device.land[1], device.land[0]];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: device.scale, colorScheme: 'dark' });
  // Los datos de ejemplo se cargan antes de que arranque la app (si no, esta guarda los suyos encima)
  await ctx.addInitScript(({ config, state }) => {
    localStorage.setItem('clipeo.config.v1', JSON.stringify(config));
    localStorage.setItem('clipeo.state.v1', JSON.stringify(state));
  }, { config: { ...baseConfig, ...(s.config || {}) }, state: s.state });
  const p = await ctx.newPage();
  await p.goto(base);
  await p.waitForTimeout(1200);
  if (s.action) { await s.action(p); await p.waitForTimeout(700); }
  const dir = path.join(OUT, 'screenshots', 'raw', device.dir);
  fs.mkdirSync(dir, { recursive: true });
  await p.screenshot({ path: path.join(dir, `${s.name}-${orientation === 'land' ? 'horizontal' : 'vertical'}.png`) });
  await ctx.close();
}

async function graphics(browser) {
  const dir = path.join(OUT, 'graphics');
  fs.mkdirSync(dir, { recursive: true });
  const font = (f) => 'data:font/ttf;base64,' + fs.readFileSync(require.resolve(`@expo-google-fonts/${f}`)).toString('base64');
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
    <div class="text"><div class="icon">${icon}</div><h1>Clipeo Scoreboard</h1><p>Toca para sumar. Desliza para restar.</p></div>
    <div class="board"><div style="background:#0B1111;color:${LOGO.light}">22</div><div style="background:${LOGO.blue};color:${LOGO.dark}">19</div></div>
  </body></html>`;
  const p = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(dir, 'play-feature-graphic-1024x500.png') });
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
const STORY = [
  { shot: '1-marcador', eyebrow: 'Marcador de voleibol', title: 'Todo el resultado, a pantalla completa',
    sub: 'Números enormes que se leen desde cualquier punto de la pista.' },
  { shot: '1b-toque', eyebrow: 'Un solo dedo', title: 'Toca para sumar. Desliza para corregir.',
    sub: 'Sin botones pequeños en mitad del rally.', gestures: true },
  { shot: '3-selector-modo', eyebrow: 'Modos de puntuación', title: 'Tus propios modos de puntuación',
    sub: 'Punto doble, 3 seguidas = 1… crea las variantes de tus entrenamientos y cámbialas con un toque.' },
  { shot: '5-gestos', eyebrow: 'Gestos', title: 'Cada gesto hace lo que tú elijas',
    sub: 'Mantén pulsado para un punto doble o desliza hacia arriba para deshacer.' },
  { shot: '6-colores', eyebrow: 'A tu manera', title: 'Tus equipos, tus colores',
    sub: 'Nombres, cualquier color y final de set y de partido automáticos.' },
  { closing: true, title: 'Clipeo Scoreboard', sub: 'El marcador de voleibol que se maneja con un dedo.',
    chips: ['Gratis', 'Sin cuentas', 'Sin anuncios'] },
];

async function story(browser, device) {
  const FW = device.land[0] * device.scale;
  const FH = device.land[1] * device.scale;
  const N = STORY.length;
  const u = FH / 100; // unidad: 1% del alto
  const rawDir = path.join(OUT, 'screenshots', 'raw', device.dir);
  const img = (name) => 'data:image/png;base64,' + fs.readFileSync(path.join(rawDir, `${name}-horizontal.png`)).toString('base64');
  const font = (f) => 'data:font/ttf;base64,' + fs.readFileSync(require.resolve(`@expo-google-fonts/${f}`)).toString('base64');
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
    const overlay = st.gestures ? `
      <div class="tap" style="left:25%;top:55%"><span>+1</span></div>
      <svg class="swipe" viewBox="0 0 40 100" style="left:75%;top:26%;height:46%">
        <path d="M20 6 L20 88 M8 74 L20 90 L32 74" fill="none" stroke="#111919" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
      </svg>` : '';
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

  const html = `<html><head><style>
    @font-face { font-family: SG; src: url(${font('space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf')}); }
    @font-face { font-family: Inter; src: url(${font('inter/500Medium/Inter_500Medium.ttf')}); }
    body { margin: 0; width: ${N * FW}px; height: ${FH}px; background: ${LOGO.dark}; position: relative; overflow: hidden; }
    .line { position: absolute; left: 0; top: 0; }
    .phone { position: absolute; box-sizing: border-box; padding: ${BZ}px; border-radius: ${5.5 * u}px; background: #050808;
      box-shadow: 0 ${3 * u}px ${9 * u}px rgba(0,0,0,.55), inset 0 0 0 ${0.25 * u}px #2C3636; }
    .screen { position: relative; width: 100%; height: 100%; border-radius: ${4.4 * u}px; overflow: hidden; }
    .screen img { display: block; width: 100%; height: 100%; }
    .tap { position: absolute; width: ${11 * u}px; height: ${11 * u}px; margin: ${-5.5 * u}px 0 0 ${-5.5 * u}px; border-radius: 50%;
      border: ${0.6 * u}px solid rgba(225,225,225,.9); box-shadow: 0 0 0 ${2.2 * u}px rgba(225,225,225,.18); }
    .tap span { position: absolute; left: 100%; bottom: 100%; margin-left: ${0.5 * u}px; padding: ${0.5 * u}px ${1.4 * u}px; border-radius: 999px;
      background: ${LOGO.blue}; color: ${LOGO.dark}; font: 700 ${3 * u}px/1 SG; }
    .swipe { position: absolute; transform: translateX(-50%); }
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
  const dir = path.join(OUT, 'screenshots', device.dir);
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < N; i++) {
    await p.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`), clip: { x: i * FW, y: 0, width: FW, height: FH } });
  }
  await p.screenshot({ path: path.join(dir, 'panorama.png') }); // vista previa de toda la secuencia
  await p.close();
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Falta dist/: ejecuta antes `npm run build:web`');
  const server = await serve(DIST);
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  for (const d of DEVICES) {
    for (const s of SHOTS) await shot(browser, base, d, 'land', s);
    await shot(browser, base, d, 'port', SHOTS[0]);
    await shot(browser, base, d, 'port', SHOTS[2]);
    await story(browser, d);
  }
  await graphics(browser);
  await browser.close();
  server.close();
  console.log('Listo: store/screenshots y store/graphics');
})().catch((e) => { console.error(e); process.exit(1); });
