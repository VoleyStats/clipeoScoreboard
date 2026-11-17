import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG, initialState, reconcile } from './logic';
import type { Config, MatchState } from './types';

const CONFIG_KEY = 'clipeo.config.v1';
const STATE_KEY = 'clipeo.state.v1';

export async function load(): Promise<{ config: Config; state: MatchState }> {
  try {
    const [c, s] = await Promise.all([AsyncStorage.getItem(CONFIG_KEY), AsyncStorage.getItem(STATE_KEY)]);
    const parsed = c ? (JSON.parse(c) as Partial<Config>) : {};
    const config: Config = {
      ...DEFAULT_CONFIG,
      ...parsed,
      teams: { ...DEFAULT_CONFIG.teams, ...parsed.teams },
      rules: parsed.rules?.length ? parsed.rules : DEFAULT_CONFIG.rules,
    };
    const state = s ? { ...initialState(config), ...(JSON.parse(s) as Partial<MatchState>) } : initialState(config);
    return { config, state: reconcile(state, config) };
  } catch {
    return { config: DEFAULT_CONFIG, state: initialState(DEFAULT_CONFIG) };
  }
}

export function saveConfig(config: Config) {
  AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config)).catch(() => {});
}

export function saveState(state: MatchState) {
  AsyncStorage.setItem(STATE_KEY, JSON.stringify(state)).catch(() => {});
}
