import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG, addSet, initialState, removePoint, removeSet, selectRule, winRally, reconcile, closeSet,
} from '../src/logic';
import type { Config } from '../src/types';

const cfg: Config = DEFAULT_CONFIG;

test('tap normal suma 1', () => {
  const s = winRally(initialState(cfg), cfg, 'a');
  assert.deepEqual(s.points, { a: 1, b: 0 });
});

test('swipe down resta 1 sin bajar de 0', () => {
  let s = winRally(initialState(cfg), cfg, 'a');
  s = removePoint(s, 'a');
  s = removePoint(s, 'a');
  assert.equal(s.points.a, 0);
});

test('punto doble suma 2 y vuelve a la regla normal', () => {
  let s = selectRule(initialState(cfg), 'double');
  s = winRally(s, cfg, 'b');
  assert.equal(s.points.b, 2);
  assert.equal(s.activeRuleId, 'normal');
  s = winRally(s, cfg, 'b');
  assert.equal(s.points.b, 3);
});

test('3 seguidas = 1: el rival rompe la racha', () => {
  let s = selectRule(initialState(cfg), 'three-for-one');
  s = winRally(s, cfg, 'a');
  s = winRally(s, cfg, 'a');
  assert.equal(s.progress.a, 2);
  s = winRally(s, cfg, 'b');
  assert.deepEqual(s.progress, { a: 0, b: 1 });
  s = winRally(winRally(winRally(s, cfg, 'a'), cfg, 'a'), cfg, 'a');
  assert.deepEqual(s.points, { a: 1, b: 0 });
  assert.equal(s.activeRuleId, 'three-for-one');
});

test('acumuladas (no seguidas) conservan el progreso', () => {
  const c: Config = { ...cfg, rules: [...cfg.rules, { id: 'x', name: '2 de 2', ralliesRequired: 2, pointsAwarded: 3, consecutive: false, once: false }] };
  let s = selectRule(initialState(c), 'x');
  s = winRally(s, c, 'a');
  s = winRally(s, c, 'b');
  s = winRally(s, c, 'a');
  assert.deepEqual(s.points, { a: 3, b: 0 });
  assert.deepEqual(s.progress, { a: 0, b: 1 });
});

test('swipe down con progreso pendiente quita progreso primero', () => {
  let s = selectRule({ ...initialState(cfg), points: { a: 5, b: 0 } }, 'three-for-one');
  s = winRally(s, cfg, 'a');
  s = removePoint(s, 'a');
  assert.equal(s.progress.a, 0);
  assert.equal(s.points.a, 5);
});

test('sets: sumar resetea puntos, restar no baja de 0', () => {
  let s = winRally(initialState(cfg), cfg, 'a');
  s = addSet(s, cfg, 'a');
  assert.deepEqual(s.sets, { a: 1, b: 0 });
  assert.deepEqual(s.points, { a: 0, b: 0 });
  s = removeSet(removeSet(s, 'a'), 'a');
  assert.equal(s.sets.a, 0);
});

test('autoSets: gana set a 25 con 2 de ventaja', () => {
  const c = { ...cfg, autoSets: true };
  let s = { ...initialState(c), points: { a: 24, b: 24 } };
  s = winRally(s, c, 'a');
  assert.equal(s.sets.a, 0);
  s = winRally(s, c, 'a');
  assert.deepEqual(s.sets, { a: 1, b: 0 });
  assert.deepEqual(s.points, { a: 0, b: 0 });
});

test('autoSets: el set decisivo va a 15', () => {
  const c = { ...cfg, autoSets: true };
  let s = { ...initialState(c), sets: { a: 2, b: 2 }, points: { a: 14, b: 3 } };
  s = winRally(s, c, 'b');
  assert.equal(s.sets.b, 2);
  s = winRally(s, c, 'a');
  assert.deepEqual(s.sets, { a: 3, b: 2 });
});

test('reconcile vuelve a la regla por defecto si se borra la activa', () => {
  const s = selectRule(initialState(cfg), 'double');
  const c = { ...cfg, rules: [cfg.rules[0]] };
  assert.equal(reconcile(s, c).activeRuleId, 'normal');
});

test('cerrar set: suma set al que va ganando y reinicia puntos', () => {
  const s = closeSet({ ...initialState(cfg), points: { a: 18, b: 25 }, sets: { a: 1, b: 0 } });
  assert.deepEqual(s.sets, { a: 1, b: 1 });
  assert.deepEqual(s.points, { a: 0, b: 0 });
  const tie = closeSet({ ...initialState(cfg), points: { a: 7, b: 7 } });
  assert.deepEqual(tie.sets, { a: 0, b: 0 });
  assert.deepEqual(tie.points, { a: 0, b: 0 });
});
