import type { Config, MatchState, ScoringRule, TeamId } from './types';

export const other = (t: TeamId): TeamId => (t === 'a' ? 'b' : 'a');

export const DEFAULT_RULES: ScoringRule[] = [
  { id: 'normal', name: 'Normal', ralliesRequired: 1, pointsAwarded: 1, consecutive: false, once: false },
  { id: 'double', name: 'Punto doble', ralliesRequired: 1, pointsAwarded: 2, consecutive: false, once: true },
  { id: 'three-for-one', name: '3 seguidas = 1', ralliesRequired: 3, pointsAwarded: 1, consecutive: true, once: false },
];

export const DEFAULT_CONFIG: Config = {
  teams: {
    a: { name: 'Local', bg: '#0F1524', fg: '#E1E1E1' },
    b: { name: 'Visitante', bg: '#3D6BFF', fg: '#FFFFFF' },
  },
  rules: DEFAULT_RULES,
  showNames: true,
  showSets: true,
  haptics: true,
  resetPointsOnSet: true,
  autoSets: false,
  pointsPerSet: 25,
  decidingSetPoints: 15,
  setsToWin: 3,
  winByTwo: true,
};

export const initialState = (config: Config): MatchState => ({
  points: { a: 0, b: 0 },
  sets: { a: 0, b: 0 },
  progress: { a: 0, b: 0 },
  activeRuleId: config.rules[0].id,
  swapped: false,
});

export function activeRule(state: MatchState, config: Config): ScoringRule {
  return config.rules.find((r) => r.id === state.activeRuleId) ?? config.rules[0];
}

export function isDecidingSet(state: MatchState, config: Config): boolean {
  const last = config.setsToWin - 1;
  return config.setsToWin > 1 && state.sets.a === last && state.sets.b === last;
}

export function setTarget(state: MatchState, config: Config): number {
  return isDecidingSet(state, config) ? config.decidingSetPoints : config.pointsPerSet;
}

export function matchWinner(state: MatchState, config: Config): TeamId | null {
  if (state.sets.a >= config.setsToWin) return 'a';
  if (state.sets.b >= config.setsToWin) return 'b';
  return null;
}

/** Comprueba si algún equipo ha cerrado el set (solo con autoSets). */
function checkSetWon(state: MatchState, config: Config): MatchState {
  if (!config.autoSets || matchWinner(state, config)) return state;
  const target = setTarget(state, config);
  for (const t of ['a', 'b'] as TeamId[]) {
    const lead = state.points[t] - state.points[other(t)];
    if (state.points[t] >= target && (!config.winByTwo || lead >= 2)) {
      return {
        ...state,
        sets: { ...state.sets, [t]: state.sets[t] + 1 },
        points: { a: 0, b: 0 },
        progress: { a: 0, b: 0 },
      };
    }
  }
  return state;
}

/** Un equipo gana una jugada (tap). Se aplica la regla activa. */
export function winRally(state: MatchState, config: Config, team: TeamId): MatchState {
  const rule = activeRule(state, config);
  const progress = { ...state.progress };
  if (rule.consecutive) progress[other(team)] = 0;
  progress[team] += 1;

  if (progress[team] < Math.max(1, rule.ralliesRequired)) {
    return { ...state, progress };
  }

  progress[team] = 0;
  let next: MatchState = {
    ...state,
    progress,
    points: { ...state.points, [team]: state.points[team] + rule.pointsAwarded },
  };
  const defaultId = config.rules[0].id;
  if (rule.once && rule.id !== defaultId) {
    next = { ...next, activeRuleId: defaultId, progress: { a: 0, b: 0 } };
  }
  return checkSetWon(next, config);
}

/** Swipe down en el marcador: deshace progreso pendiente o resta un punto. */
export function removePoint(state: MatchState, team: TeamId): MatchState {
  if (state.progress[team] > 0) {
    return { ...state, progress: { ...state.progress, [team]: state.progress[team] - 1 } };
  }
  return { ...state, points: { ...state.points, [team]: Math.max(0, state.points[team] - 1) } };
}

export function addSet(state: MatchState, config: Config, team: TeamId): MatchState {
  const next = { ...state, sets: { ...state.sets, [team]: state.sets[team] + 1 } };
  if (!config.resetPointsOnSet) return next;
  return { ...next, points: { a: 0, b: 0 }, progress: { a: 0, b: 0 } };
}

export function removeSet(state: MatchState, team: TeamId): MatchState {
  return { ...state, sets: { ...state.sets, [team]: Math.max(0, state.sets[team] - 1) } };
}

export function selectRule(state: MatchState, ruleId: string): MatchState {
  if (ruleId === state.activeRuleId) return state;
  return { ...state, activeRuleId: ruleId, progress: { a: 0, b: 0 } };
}

export function resetPoints(state: MatchState): MatchState {
  return { ...state, points: { a: 0, b: 0 }, progress: { a: 0, b: 0 } };
}

/** Cierra el set: suma 1 set al equipo con más puntos (si no hay empate) y reinicia los puntos. */
export function closeSet(state: MatchState): MatchState {
  const { a, b } = state.points;
  const leader: TeamId | null = a > b ? 'a' : b > a ? 'b' : null;
  const sets = leader ? { ...state.sets, [leader]: state.sets[leader] + 1 } : state.sets;
  return { ...resetPoints(state), sets };
}

export function resetMatch(state: MatchState, config: Config): MatchState {
  return { ...initialState(config), swapped: state.swapped };
}

/** Asegura que el estado sigue siendo válido tras cambiar la configuración. */
export function reconcile(state: MatchState, config: Config): MatchState {
  if (config.rules.some((r) => r.id === state.activeRuleId)) return state;
  return { ...state, activeRuleId: config.rules[0].id, progress: { a: 0, b: 0 } };
}

export const newRuleId = () => `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
