import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLYPH_HEIGHT, digitsOf, scoreboardLayout } from '../src/layout';

// Móviles y tablets en ambas orientaciones, con y sin zonas seguras (muesca / barra de inicio)
const SCREENS = [
  { name: 'iPhone SE', w: 375, h: 667, insets: { top: 20, bottom: 0, left: 0, right: 0 } },
  { name: 'iPhone 15', w: 393, h: 852, insets: { top: 59, bottom: 34, left: 0, right: 0 } },
  { name: 'iPhone Pro Max', w: 440, h: 956, insets: { top: 62, bottom: 34, left: 0, right: 0 } },
  { name: 'Android pequeño', w: 360, h: 640, insets: { top: 0, bottom: 0, left: 0, right: 0 } },
  { name: 'iPad', w: 768, h: 1024, insets: { top: 24, bottom: 20, left: 0, right: 0 } },
  { name: 'iPad Pro 13', w: 1032, h: 1376, insets: { top: 24, bottom: 20, left: 0, right: 0 } },
];
const ALL = SCREENS.flatMap((s) => [
  { ...s, name: `${s.name} vertical` },
  // En horizontal la muesca queda a un lado
  { ...s, name: `${s.name} horizontal`, w: s.h, h: s.w, insets: { top: 0, bottom: s.insets.bottom ? 21 : 0, left: s.insets.top, right: s.insets.top } },
]);

for (const s of ALL) {
  for (const digits of [2, 3]) {
    test(`${s.name}, ${digits} cifras: número centrado, mismo tamaño y sin pisar cabecera ni controles`, () => {
      const L = scoreboardLayout({ width: s.w, height: s.h, insets: s.insets, showHeader: true, digits });
      assert.ok(L.fontSize > 60, `número demasiado pequeño: ${L.fontSize}`);
      for (const [i, p] of L.panels.entries()) {
        // la cifra visible (0,725 em) va centrada en el espacio libre
        const glyph = L.fontSize * GLYPH_HEIGHT;
        const lineTop = p.area.top + (p.area.height - glyph) / 2;
        const lineBottom = lineTop + glyph;
        assert.ok(lineTop >= p.area.top - 0.5, `panel ${i}: se sale por arriba`);
        assert.ok(lineBottom <= p.area.top + p.area.height + 0.5, `panel ${i}: se sale por abajo`);
        // debajo de la cabecera
        assert.ok(p.area.top >= p.header.top + p.header.height, `panel ${i}: pisa la cabecera`);
        // cabe a lo ancho
        assert.ok(L.fontSize * 0.62 * digits <= p.area.width, `panel ${i}: no cabe a lo ancho`);
        // con los controles debajo, el número termina por encima de ellos
        const controlsTop = p.height - L.controls.bottom - L.controls.height;
        if (L.landscape || i === 1) assert.ok(lineBottom <= controlsTop, `panel ${i}: pisa los controles`);
        // y por encima de los puntos de progreso cuando van debajo del número
        if (!L.landscape) assert.ok(lineBottom <= p.height - p.dotsBottom - p.small * 0.7, `panel ${i}: pisa los puntos`);
        // la cabecera respeta la zona segura de arriba
        if (L.landscape || i === 0) assert.ok(p.header.top >= s.insets.top, `panel ${i}: cabecera bajo la muesca`);
      }
    });
  }
}

test('los controles crecen en tablet y respetan la barra de inicio', () => {
  const phone = scoreboardLayout({ width: 393, height: 852, showHeader: true, digits: 2, insets: { top: 59, bottom: 34, left: 0, right: 0 } });
  const tablet = scoreboardLayout({ width: 1032, height: 1376, showHeader: true, digits: 2 });
  assert.ok(tablet.controls.height > phone.controls.height);
  assert.ok(phone.controls.bottom >= 34);
});

test('sin cabecera, el número aprovecha más alto', () => {
  const con = scoreboardLayout({ width: 390, height: 844, showHeader: true, digits: 2 });
  const sin = scoreboardLayout({ width: 390, height: 844, showHeader: false, digits: 2 });
  assert.ok(sin.panels[0].area.height > con.panels[0].area.height);
});

test('dígitos en pantalla', () => {
  assert.equal(digitsOf(0), 1);
  assert.equal(digitsOf(25), 2);
  assert.equal(digitsOf(-3), 2);
  assert.equal(digitsOf(-12), 3);
});
