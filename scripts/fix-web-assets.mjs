// Vercel (y otros hostings) ignoran cualquier carpeta llamada node_modules al subir.
// Expo exporta las fuentes en dist/assets/node_modules/..., así que las movemos a
// dist/assets/vendor/ y actualizamos las referencias en el bundle.
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const from = join(dist, 'assets', 'node_modules');
if (!existsSync(from)) process.exit(0);
renameSync(from, join(dist, 'assets', 'vendor'));

let files = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|json|css|map)$/.test(name)) {
      const src = readFileSync(p, 'utf8');
      const out = src.replaceAll('/assets/node_modules/', '/assets/vendor/');
      if (out !== src) { writeFileSync(p, out); files++; }
    }
  }
};
walk(dist);
console.log(`fix-web-assets: assets/node_modules -> assets/vendor (${files} ficheros actualizados)`);
