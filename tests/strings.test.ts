import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, pickLang } from '../src/strings';
import { defaultConfig } from '../src/logic';

test('idioma: el primero soportado de la lista; si no hay ninguno, inglés', () => {
  assert.equal(pickLang(['es']), 'es');
  assert.equal(pickLang(['es-ES']), 'es');
  assert.equal(pickLang(['en_US']), 'en');
  assert.equal(pickLang(['fr', 'es', 'en']), 'es');
  assert.equal(pickLang(['fr', null]), 'en');
  assert.equal(pickLang([]), 'en');
});

test('los dos idiomas tienen los mismos textos', () => {
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.es).sort());
  assert.deepEqual(Object.keys(STRINGS.en.gesture).sort(), Object.keys(STRINGS.es.gesture).sort());
});

test('la configuración por defecto usa el idioma, pero los ids de los modos no cambian', () => {
  const es = defaultConfig('es');
  const en = defaultConfig('en');
  assert.equal(en.teams.a.name, 'Home');
  assert.equal(en.rules[1].name, 'Double point');
  assert.equal(es.rules[1].name, 'Punto doble');
  assert.deepEqual(en.rules.map((r) => r.id), es.rules.map((r) => r.id));
  assert.deepEqual(en.gestures, es.gestures);
});

test('descripción de un modo', () => {
  assert.equal(STRINGS.es.describeRule(3, 1, true, false), '3 jugadas seguidas → +1 punto');
  assert.equal(STRINGS.en.describeRule(1, 2, false, true), '1 rally → +2 points · once');
});
