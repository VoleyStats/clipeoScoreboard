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
}

export interface Config {
  teams: Record<TeamId, Team>;
  /** La primera regla es la regla por defecto */
  rules: ScoringRule[];
  /** Modo que se aplica una vez al mantener pulsado (solo modos de 1 jugada). null = desactivado */
  longPressRuleId: string | null;
  showNames: boolean;
  showSets: boolean;
  haptics: boolean;
  /** Al sumar un set (manual) los puntos vuelven a 0 */
  resetPointsOnSet: boolean;
  /** Detecta automáticamente el fin de set */
  autoSets: boolean;
  pointsPerSet: number;
  decidingSetPoints: number;
  setsToWin: number;
  winByTwo: boolean;
}

export interface MatchState {
  points: Record<TeamId, number>;
  sets: Record<TeamId, number>;
  /** Jugadas ganadas acumuladas hacia la regla activa */
  progress: Record<TeamId, number>;
  activeRuleId: string;
  /** Equipos intercambiados de lado */
  swapped: boolean;
}
