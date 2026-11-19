import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG, addSet, initialState, removePoint, removeSet, selectRule, winRally, reconcile, closeSet, setServing, winSpecialRally, matchWinner, applyGesture, resolveAction, migrateConfig,
} from '../src/logic';
import type { Config } from '../src/types';

const cfg: Config = DEFAULT_CONFIG;

test('tap normal suma 1', () => {
  const s = winRally(initialState(cfg), cfg, 'a');
  assert.deepEqual(s.points, { a: 1, b: 0 });
});

test('restar permite puntos negativos', () => {
  let s = winRally(initialState(cfg), cfg, 'a');
  s = removePoint(s, 'a');
  s = removePoint(s, 'a');
  s = removePoint(s, 'a');
  assert.equal(s.points.a, -2);
  assert.equal(winRally(s, cfg, 'a').points.a, -1);
});

test('los sets no bajan de 0', () => {
  assert.equal(removeSet(initialState(cfg), 'a').sets.a, 0);
});

test('cerrar set con puntos negativos: gana el que tiene más', () => {
  const s = closeSet({ ...initialState(cfg), points: { a: -3, b: -1 } });
  assert.deepEqual(s.sets, { a: 0, b: 1 });
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

test('acción con modo borrado o de varias jugadas se trata como sumar', () => {
  assert.deepEqual(act('rule:no-existe'), { kind: 'point' });
  assert.deepEqual(act('rule:three-for-one'), { kind: 'point' });
  assert.equal(act('rule:double').kind, 'rule');
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

test('saque: quien gana la jugada saca (modo normal)', () => {
  let s = winRally(initialState(cfg), cfg, 'a');
  assert.equal(s.serving, 'a');
  s = winRally(s, cfg, 'b');
  assert.equal(s.serving, 'b');
});

test('saque tras 2: los puntos suben en cada jugada pero el saque cambia a las 2 seguidas', () => {
  let s = selectRule(setServing(initialState(cfg), 'a'), 'serve-two');
  s = winRally(s, cfg, 'b');
  assert.deepEqual(s.points, { a: 0, b: 1 });
  assert.equal(s.serving, 'a');
  assert.equal(s.serveProgress, 1);
  s = winRally(s, cfg, 'a'); // el que saca gana: con "seguidas", el rival pierde lo acumulado
  assert.equal(s.serveProgress, 0);
  s = winRally(winRally(s, cfg, 'b'), cfg, 'b');
  assert.deepEqual(s.points, { a: 1, b: 3 });
  assert.equal(s.serving, 'b');
  assert.equal(s.serveProgress, 0);
});

test('saque tras N acumuladas (no seguidas) conserva el progreso', () => {
  const r = { id: 'acc', name: 'Saque tras 3', ralliesRequired: 1, pointsAwarded: 1, consecutive: false, once: false, serveAfter: 3, serveConsecutive: false };
  const c = { ...cfg, rules: [...cfg.rules, r] };
  let s = selectRule(setServing(initialState(c), 'a'), 'acc');
  s = winRally(winRally(winRally(s, c, 'b'), c, 'a'), c, 'b');
  assert.equal(s.serving, 'a');
  assert.equal(s.serveProgress, 2);
  s = winRally(s, c, 'b');
  assert.equal(s.serving, 'b');
});

test('elegir saque a mano y reiniciar puntos reinician el progreso del saque', () => {
  let s = selectRule(setServing(initialState(cfg), 'a'), 'serve-two');
  s = winRally(s, cfg, 'b');
  assert.equal(setServing(s, 'b').serveProgress, 0);
  assert.equal(closeSet(s).serveProgress, 0);
  assert.equal(closeSet(s).serving, 'a');
});

test('la jugada especial también cuenta para el saque', () => {
  const s = winSpecialRally(setServing(initialState(cfg), 'b'), cfg, 'a', double);
  assert.equal(s.serving, 'a');
});
