/**
 * Genera las capturas y gráficos para las tiendas a partir de la web exportada.
 *
 *   npm run build:web && node scripts/store-assets.cjs
 *
 * Requiere Playwright con Chromium (`npm i -D playwright && npx playwright install chromium`).
 * Resultado en store/screenshots/ y store/graphics/.
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
  const dir = path.join(OUT, 'screenshots', device.dir);
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

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Falta dist/: ejecuta antes `npm run build:web`');
  const server = await serve(DIST);
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  for (const d of DEVICES) {
    for (const s of SHOTS) await shot(browser, base, d, 'land', s);
    await shot(browser, base, d, 'port', SHOTS[0]);
    await shot(browser, base, d, 'port', SHOTS[1]);
  }
  await graphics(browser);
  await browser.close();
  server.close();
  console.log('Listo: store/screenshots y store/graphics');
})().catch((e) => { console.error(e); process.exit(1); });
