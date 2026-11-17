import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RulePicker } from './src/components/RulePicker';
import { SettingsModal } from './src/components/SettingsModal';
import { TeamPanel } from './src/components/TeamPanel';
import { isValidColor } from './src/components/ui';
import {
  DEFAULT_CONFIG, activeRule, addSet, initialState, matchWinner, reconcile, removePoint, removeSet,
  resetMatch, resetPoints, selectRule, winRally,
} from './src/logic';
import { load, saveConfig, saveState } from './src/storage';
import type { Config, MatchState, Team, TeamId } from './src/types';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Evita el "pull to refresh" y el rebote del navegador al deslizar hacia abajo.
  const style = document.createElement('style');
  style.textContent = 'html,body{overscroll-behavior:none;overflow:hidden;background:#000}';
  document.head.appendChild(style);
}

function KeepAwake() {
  useKeepAwake();
  return null;
}

const safeTeam = (t: Team, fallback: Team): Team => ({
  name: t.name,
  bg: isValidColor(t.bg) ? t.bg : fallback.bg,
  fg: isValidColor(t.fg) ? t.fg : fallback.fg,
});

export default function App() {
  const { width, height } = useWindowDimensions();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [state, setState] = useState<MatchState>(() => initialState(DEFAULT_CONFIG));
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    load().then(({ config, state }) => {
      setConfig(config);
      setState(state);
      setReady(true);
    });
  }, []);

  useEffect(() => { if (ready) saveConfig(config); }, [config, ready]);
  useEffect(() => { if (ready) saveState(state); }, [state, ready]);

  const buzz = useCallback(
    (strong = false) => {
      if (!config.haptics || Platform.OS === 'web') return;
      Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [config.haptics],
  );

  const updateConfig = (c: Config) => {
    setConfig(c);
    setState((s) => reconcile(s, c));
  };

  const landscape = width >= height;
  const panelW = landscape ? width / 2 : width;
  const panelH = landscape ? height : height / 2;
  const rule = activeRule(state, config);
  const winner = matchWinner(state, config);
  const order: TeamId[] = state.swapped ? ['b', 'a'] : ['a', 'b'];

  return (
    <SafeAreaProvider>
      <KeepAwake />
      <StatusBar hidden />
      <View style={[styles.root, { flexDirection: landscape ? 'row' : 'column' }]}>
        {order.map((id) => (
          <TeamPanel
            key={id}
            team={safeTeam(config.teams[id], DEFAULT_CONFIG.teams[id])}
            points={state.points[id]}
            sets={state.sets[id]}
            progress={state.progress[id]}
            required={rule.ralliesRequired}
            width={panelW}
            height={panelH}
            showName={config.showNames}
            showSets={config.showSets}
            winner={winner === id}
            onPoint={() => { buzz(); setState((s) => winRally(s, config, id)); }}
            onUnpoint={() => { buzz(true); setState((s) => removePoint(s, id)); }}
            onSet={() => { buzz(); setState((s) => addSet(s, config, id)); }}
            onUnset={() => { buzz(true); setState((s) => removeSet(s, id)); }}
          />
        ))}

        <View style={styles.center} pointerEvents="box-none">
          {config.rules.length > 1 && (
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={[styles.pill, rule.id !== config.rules[0].id && styles.pillActive]}
              hitSlop={8}
            >
              <Text style={[styles.pillText, rule.id !== config.rules[0].id && { color: '#111' }]} numberOfLines={1}>
                {rule.name}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={() => setSettingsOpen(true)} style={styles.gear} hitSlop={12} accessibilityLabel="Ajustes">
            <Text style={styles.gearText}>•••</Text>
          </Pressable>
        </View>
      </View>

      <RulePicker
        visible={pickerOpen}
        rules={config.rules}
        activeId={rule.id}
        onSelect={(rid) => { setState((s) => selectRule(s, rid)); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
      <SettingsModal
        visible={settingsOpen}
        config={config}
        onChange={updateConfig}
        onClose={() => setSettingsOpen(false)}
        onSwap={() => setState((s) => ({ ...s, swapped: !s.swapped }))}
        onResetPoints={() => setState(resetPoints)}
        onResetMatch={() => setState((s) => resetMatch(s, config))}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, maxWidth: 200,
  },
  pillActive: { backgroundColor: '#FFD23F' },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  gear: {
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 999,
    width: 44, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  gearText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, letterSpacing: 2, fontWeight: '900' },
});
