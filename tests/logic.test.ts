import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG, addSet, initialState, removePoint, removeSet, selectRule, winRally, reconcile, closeSet, winSpecialRally, matchWinner, applyGesture, resolveAction, migrateConfig,
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
  const c = { ...cfg, autoSets: true, matchEnd: true };
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

const double = cfg.rules.find((r) => r.id === 'double')!;
const act = (a: Parameters<typeof resolveAction>[1], c = cfg) => resolveAction(c, a);

test('gestos por defecto: tocar suma, mantener = punto doble, abajo resta, arriba nada', () => {
  const s0 = initialState(cfg);
  assert.equal(applyGesture(s0, cfg, 'a', act(cfg.gestures.tap)).points.a, 1);
  assert.equal(applyGesture(s0, cfg, 'a', act(cfg.gestures.longPress)).points.a, 2);
  assert.equal(applyGesture({ ...s0, points: { a: 5, b: 0 } }, cfg, 'a', act(cfg.gestures.swipeDown)).points.a, 4);
  assert.equal(applyGesture(s0, cfg, 'a', act(cfg.gestures.swipeUp)), s0);
});

test('jugada especial: no cambia el modo activo', () => {
  const s = winSpecialRally(initialState(cfg), cfg, 'a', double);
  assert.equal(s.points.a, 2);
  assert.equal(s.activeRuleId, 'normal');
});

test('jugada especial: rompe la racha del rival pero no suma progreso propio', () => {
  let s = selectRule(initialState(cfg), 'three-for-one');
  s = winRally(winRally(s, cfg, 'b'), cfg, 'b');
  s = winRally(s, cfg, 'a');
  s = winSpecialRally(s, cfg, 'a', double);
  assert.deepEqual(s.progress, { a: 1, b: 0 });
  assert.equal(s.points.a, 2);
  assert.equal(s.activeRuleId, 'three-for-one');
});

test('acción con un modo borrado se trata como sumar', () => {
  assert.deepEqual(act('rule:no-existe'), { kind: 'point' });
  assert.equal(act('rule:double').kind, 'rule');
});

test('gesto con un modo de varias jugadas: lo activa y cuenta la jugada', () => {
  let s = applyGesture(initialState(cfg), cfg, 'a', act('rule:three-for-one'));
  assert.equal(s.activeRuleId, 'three-for-one');
  assert.deepEqual(s.progress, { a: 1, b: 0 });
  s = applyGesture(applyGesture(s, cfg, 'a', act('rule:three-for-one')), cfg, 'a', act('rule:three-for-one'));
  assert.deepEqual(s.points, { a: 1, b: 0 });
  assert.equal(s.activeRuleId, 'three-for-one');
});

test('gesto con el modo por defecto suma 1 aunque haya otro modo activo, sin cambiarlo', () => {
  const s = applyGesture(selectRule(initialState(cfg), 'three-for-one'), cfg, 'a', act('rule:normal'));
  assert.equal(s.points.a, 1);
  assert.equal(s.activeRuleId, 'three-for-one');
});

test('gesto con un modo propio de 1 jugada (p. ej. triple)', () => {
  const triple = { id: 'triple', name: 'Triple', ralliesRequired: 1, pointsAwarded: 3, consecutive: false, once: false };
  const c = { ...cfg, rules: [...cfg.rules, triple] };
  assert.equal(applyGesture(initialState(c), c, 'b', act('rule:triple', c)).points.b, 3);
});

test('jugada especial respeta el fin de set automático', () => {
  const c = { ...cfg, autoSets: true };
  const s = winSpecialRally({ ...initialState(c), points: { a: 23, b: 20 } }, c, 'a', double);
  assert.deepEqual(s.sets, { a: 1, b: 0 });
});

test('migración: longPressRuleId de versiones anteriores pasa a gestures', () => {
  assert.equal(migrateConfig({ longPressRuleId: 'double' }).gestures?.longPress, 'rule:double');
  assert.equal(migrateConfig({ longPressRuleId: null }).gestures?.longPress, 'none');
  assert.equal(migrateConfig({ longPressRuleId: null }).gestures?.tap, 'point');
  assert.ok(!('longPressRuleId' in migrateConfig({ longPressRuleId: 'double' })));
  assert.equal(migrateConfig({ gestures: { swipeUp: 'undo' } }).gestures?.swipeDown, 'minus');
});

test('por defecto no hay final de set ni de partido', () => {
  assert.equal(cfg.autoSets, false);
  assert.equal(cfg.matchEnd, false);
  const s = winRally({ ...initialState(cfg), points: { a: 30, b: 2 } }, cfg, 'a');
  assert.deepEqual(s.sets, { a: 0, b: 0 });
  assert.equal(matchWinner({ ...initialState(cfg), sets: { a: 9, b: 0 } }, cfg), null);
});

test('sin final de partido no hay set decisivo: todos los sets a los puntos configurados', () => {
  const c = { ...cfg, autoSets: true, matchEnd: false };
  const s = winRally({ ...initialState(c), sets: { a: 2, b: 2 }, points: { a: 14, b: 3 } }, c, 'a');
  assert.deepEqual(s.sets, { a: 2, b: 2 });
  assert.equal(s.points.a, 15);
});

test('puntos por set configurables y sin ganar por 2', () => {
  const c = { ...cfg, autoSets: true, pointsPerSet: 21, winByTwo: false };
  const s = winRally({ ...initialState(c), points: { a: 20, b: 20 } }, c, 'b');
  assert.deepEqual(s.sets, { a: 0, b: 1 });
});

test('final de partido: ganador y no se suman más sets automáticos', () => {
  const c = { ...cfg, autoSets: true, matchEnd: true, setsToWin: 2 };
  let s = { ...initialState(c), sets: { a: 1, b: 0 }, points: { a: 24, b: 10 } };
  s = winRally(s, c, 'a');
  assert.equal(matchWinner(s, c), 'a');
  s = winRally({ ...s, points: { a: 24, b: 0 } }, c, 'a');
  assert.deepEqual(s.sets, { a: 2, b: 0 });
});
