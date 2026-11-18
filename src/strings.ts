/**
 * Textos de la interfaz en español e inglés. Sin dependencias de Expo para poder usarse en los tests;
 * la detección del idioma del dispositivo está en `i18n.ts`.
 */
import type { Gesture } from './types';

export type Lang = 'es' | 'en';
export const LANGS: Lang[] = ['es', 'en'];

const es = {
  // Datos por defecto (se guardan en la configuración: el usuario puede cambiarlos)
  teamA: 'Local',
  teamB: 'Visitante',
  ruleNormal: 'Normal',
  ruleDouble: 'Punto doble',
  ruleThreeForOne: '3 seguidas = 1',
  newRule: 'Nuevo modo',

  // Pantalla principal
  scoringMode: 'Modo de puntuación',
  menu: 'Menú',

  // Menú •••
  undo: 'Deshacer',
  resetPoints: 'Reiniciar puntos (suma 1 set al que va ganando)',
  newMatch: 'Nuevo partido',
  confirmNewMatch: 'Confirmar nuevo partido',
  confirmNewMatchHint: 'Toca otra vez para empezar un partido nuevo',
  switchSides: 'Cambiar lados',
  settings: 'Ajustes',

  // Selector de modo y nuevo modo
  createRule: '+ Nuevo modo',
  cancel: 'Cancelar',
  createAndUse: 'Crear y usar',
  close: 'Cerrar',
  closeList: 'Cerrar lista',

  // Editor de modo
  name: 'Nombre',
  ralliesToWin: 'Jugadas a ganar',
  pointsAwarded: 'Puntos que suma',
  consecutive: 'Seguidas',
  consecutiveHint: 'Si el rival gana una jugada, se pierde el progreso',
  once: 'Solo una vez',
  onceHint: 'Tras sumar, vuelve al modo por defecto',
  describeRule: (rallies: number, points: number, consecutive: boolean, once: boolean) => {
    const plays = rallies === 1 ? '1 jugada' : `${rallies} jugadas${consecutive ? ' seguidas' : ''}`;
    return `${plays} → +${points} ${points === 1 ? 'punto' : 'puntos'}${once ? ' · una vez' : ''}`;
  },

  // Ajustes
  done: 'Listo',
  team: (n: number) => `Equipo ${n}`,
  background: 'Fondo',
  text: 'Texto',
  scoringModes: 'Modos de puntuación',
  scoringModesHelp: 'Cada modo define cuántas jugadas hay que ganar y cuántos puntos suma. El primero es el modo por defecto.',
  defaultRule: 'Por defecto',
  ruleN: (n: number) => `Modo ${n}`,
  sets: 'Sets',
  showSets: 'Mostrar sets',
  resetPointsOnSet: 'Reiniciar puntos al sumar set',
  setEnd: 'Final de set',
  autoSets: 'Final de set automático',
  autoSetsOn: 'El set se suma solo al llegar a los puntos',
  autoSetsOff: 'Desactivado: los sets se suman a mano',
  pointsPerSet: 'Puntos para ganar el set',
  winByTwo: 'Ganar por 2 de diferencia',
  winByTwoOn: (tie: number) => `Con ${tie} iguales se sigue jugando`,
  winByTwoOff: 'Gana quien llegue primero',
  matchEnd: 'Final de partido',
  matchEndOn: 'Marca el ganador al llegar a los sets',
  matchEndOff: 'Desactivado: sin límite de sets',
  setsToWin: 'Sets para ganar',
  bestOf: (n: number) => `Al mejor de ${n} ${n === 1 ? 'set' : 'sets'}`,
  decidingSetPoints: 'Puntos del set decisivo',
  nthSet: (n: number) => `El ${n}º set`,
  display: 'Pantalla',
  showNames: 'Mostrar nombres',
  haptics: 'Vibración',
  gestures: 'Gestos',
  gesturesHelp:
    'Elige qué hace cada gesto sobre el marcador de un equipo. Los modos de 1 jugada se aplican una sola vez ' +
    'sin cambiar el modo activo. El círculo de sets siempre suma al tocar y resta al deslizar hacia abajo.',
  gesture: {
    tap: { label: 'Tocar', hint: 'Un toque corto' },
    longPress: { label: 'Mantener pulsado', hint: 'Medio segundo sin mover el dedo' },
    swipeDown: { label: 'Deslizar hacia abajo', hint: 'Arrastrar el dedo hacia abajo' },
    swipeUp: { label: 'Deslizar hacia arriba', hint: 'Arrastrar el dedo hacia arriba' },
  } as Record<Gesture, { label: string; hint: string }>,
  actionPoint: 'Sumar',
  actionMinus: 'Restar 1',
  actionUndo: 'Deshacer',
  actionNone: 'Nada',
  warnNoMinus: 'Ningún gesto resta puntos. Puedes deshacer desde el menú •••.',
  warnTapNone: 'Tocar no hace nada: el marcador solo responderá a los otros gestos.',
  restoreDefaults: 'Restaurar ajustes por defecto',
  privacy: 'Política de privacidad',

  // Selector de color
  customizeColor: (label: string) => `Personalizar color ${label}`,
  colorPicker: 'Selector de color',
  hue: 'Tono',
  saturation: 'Saturación',
  lightness: 'Luz',
};

export type Strings = typeof es;

const en: Strings = {
  teamA: 'Home',
  teamB: 'Away',
  ruleNormal: 'Normal',
  ruleDouble: 'Double point',
  ruleThreeForOne: '3 in a row = 1',
  newRule: 'New mode',

  scoringMode: 'Scoring mode',
  menu: 'Menu',

  undo: 'Undo',
  resetPoints: 'Reset points (adds 1 set to the leading team)',
  newMatch: 'New match',
  confirmNewMatch: 'Confirm new match',
  confirmNewMatchHint: 'Tap again to start a new match',
  switchSides: 'Switch sides',
  settings: 'Settings',

  createRule: '+ New mode',
  cancel: 'Cancel',
  createAndUse: 'Create and use',
  close: 'Close',
  closeList: 'Close list',

  name: 'Name',
  ralliesToWin: 'Rallies to win',
  pointsAwarded: 'Points awarded',
  consecutive: 'In a row',
  consecutiveHint: 'If the opponent wins a rally, progress is lost',
  once: 'Only once',
  onceHint: 'After scoring, go back to the default mode',
  describeRule: (rallies, points, consecutive, once) => {
    const plays = rallies === 1 ? '1 rally' : `${rallies} rallies${consecutive ? ' in a row' : ''}`;
    return `${plays} → +${points} ${points === 1 ? 'point' : 'points'}${once ? ' · once' : ''}`;
  },

  done: 'Done',
  team: (n) => `Team ${n}`,
  background: 'Background',
  text: 'Text',
  scoringModes: 'Scoring modes',
  scoringModesHelp: 'Each mode sets how many rallies must be won and how many points they award. The first one is the default mode.',
  defaultRule: 'Default',
  ruleN: (n) => `Mode ${n}`,
  sets: 'Sets',
  showSets: 'Show sets',
  resetPointsOnSet: 'Reset points when adding a set',
  setEnd: 'Set end',
  autoSets: 'Automatic set end',
  autoSetsOn: 'The set is added automatically at the target score',
  autoSetsOff: 'Off: sets are added by hand',
  pointsPerSet: 'Points to win the set',
  winByTwo: 'Win by 2',
  winByTwoOn: (tie) => `At ${tie}–${tie} play continues`,
  winByTwoOff: 'First to reach the target wins',
  matchEnd: 'Match end',
  matchEndOn: 'Marks the winner when the sets are reached',
  matchEndOff: 'Off: no set limit',
  setsToWin: 'Sets to win',
  bestOf: (n) => `Best of ${n} ${n === 1 ? 'set' : 'sets'}`,
  decidingSetPoints: 'Deciding set points',
  nthSet: (n) => `Set ${n}`,
  display: 'Display',
  showNames: 'Show names',
  haptics: 'Vibration',
  gestures: 'Gestures',
  gesturesHelp:
    "Choose what each gesture does on a team's score. 1-rally modes are applied once " +
    'without changing the active mode. The set circle always adds on tap and subtracts on swipe down.',
  gesture: {
    tap: { label: 'Tap', hint: 'A short tap' },
    longPress: { label: 'Long press', hint: 'Half a second without moving your finger' },
    swipeDown: { label: 'Swipe down', hint: 'Drag your finger down' },
    swipeUp: { label: 'Swipe up', hint: 'Drag your finger up' },
  },
  actionPoint: 'Add',
  actionMinus: 'Subtract 1',
  actionUndo: 'Undo',
  actionNone: 'Nothing',
  warnNoMinus: 'No gesture subtracts points. You can undo from the ••• menu.',
  warnTapNone: 'Tap does nothing: the scoreboard will only respond to the other gestures.',
  restoreDefaults: 'Restore default settings',
  privacy: 'Privacy policy',

  customizeColor: (label) => `Customize ${label.toLowerCase()} color`,
  colorPicker: 'Color picker',
  hue: 'Hue',
  saturation: 'Saturation',
  lightness: 'Lightness',
};

export const STRINGS: Record<Lang, Strings> = { es, en };

/** Primer idioma soportado en la lista de preferencias del usuario; si no hay ninguno, inglés. */
export function pickLang(codes: (string | null | undefined)[]): Lang {
  for (const c of codes) {
    const code = c?.toLowerCase().split(/[-_]/)[0];
    if (code && (LANGS as string[]).includes(code)) return code as Lang;
  }
  return 'en';
}
