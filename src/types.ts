export type TeamId = 'a' | 'b';

export interface Team {
  name: string;
  /** Color de fondo de la mitad del equipo */
  bg: string;
  /** Color del texto (números, nombre) */
  fg: string;
}

/**
 * Regla de puntuación flexible:
 * hay que ganar `ralliesRequired` jugadas para sumar `pointsAwarded` puntos.
 *  - Normal:            1 jugada  -> 1 punto
 *  - Punto doble:       1 jugada  -> 2 puntos
 *  - "3 para 1":        3 jugadas -> 1 punto
 */
export interface ScoringRule {
  id: string;
  name: string;
  ralliesRequired: number;
  pointsAwarded: number;
  /** Las jugadas tienen que ser seguidas: si el rival gana una, el progreso se pierde */
  consecutive: boolean;
  /** Solo se aplica una vez: tras sumar, se vuelve a la regla por defecto */
  once: boolean;
  /**
   * Jugadas que tiene que ganar el equipo que recibe para pasar a sacar (1 = lo normal:
   * quien gana la jugada saca). Los puntos se siguen sumando en cada jugada.
   */
  serveAfter?: number;
  /** Las jugadas para recuperar el saque tienen que ser seguidas */
  serveConsecutive?: boolean;
}

/** Gestos sobre el marcador de un equipo (el círculo de sets tiene los suyos fijos). */
export type Gesture = 'tap' | 'longPress' | 'swipeDown' | 'swipeUp';

/**
 * Acción de un gesto:
 *  - point: suma según el modo activo
 *  - rule:<id>: una jugada del modo indicado (solo modos de 1 jugada), sin cambiar el modo activo
 *  - minus: resta 1 punto (o deshace progreso pendiente)
 *  - undo: deshace el último cambio
 *  - none: nada
 */
export type GestureAction = 'point' | 'minus' | 'undo' | 'none' | `rule:${string}`;

export interface Config {
  teams: Record<TeamId, Team>;
  /** La primera regla es la regla por defecto */
  rules: ScoringRule[];
  /** Qué hace cada gesto sobre el marcador de un equipo */
  gestures: Record<Gesture, GestureAction>;
  showNames: boolean;
  /** Marca qué equipo saca (círculo de sets en negativo) */
  showServe: boolean;
  showSets: boolean;
  haptics: boolean;
  /** Al sumar un set (manual) los puntos vuelven a 0 */
  resetPointsOnSet: boolean;
  /** Final de set automático: suma el set al llegar a pointsPerSet (con winByTwo) */
  autoSets: boolean;
  pointsPerSet: number;
  winByTwo: boolean;
  /** Final de partido: hay ganador al llegar a setsToWin; activa el set decisivo */
  matchEnd: boolean;
  setsToWin: number;
  /** Puntos del set decisivo (solo con final de set automático y final de partido) */
  decidingSetPoints: number;
}

export interface MatchState {
  points: Record<TeamId, number>;
  sets: Record<TeamId, number>;
  /** Jugadas ganadas acumuladas hacia la regla activa */
  progress: Record<TeamId, number>;
  activeRuleId: string;
  /** Equipos intercambiados de lado */
  swapped: boolean;
  /** Equipo que saca (null hasta la primera jugada o hasta que se elija) */
  serving: TeamId | null;
  /** Jugadas ganadas por el equipo que recibe para recuperar el saque */
  serveProgress: number;
}
