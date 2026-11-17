import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hexToHsl, hslToHex, isValidColor } from '../src/color';

test('hex <-> hsl ida y vuelta', () => {
  for (const c of ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000', '#3D6BFF', '#E63946', '#808080']) {
    assert.equal(hslToHex(hexToHsl(c)), c, c);
  }
});

test('hex corto y validación', () => {
  assert.deepEqual(hexToHsl('#F00'), { h: 0, s: 100, l: 50 });
  assert.ok(isValidColor('#abc'));
  assert.ok(!isValidColor('#abcd'));
  assert.ok(!isValidColor('red'));
});
