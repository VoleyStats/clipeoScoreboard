import { useCallback, useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { FadeInDown, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainMenu } from './src/components/MainMenu';
import { NewRuleModal } from './src/components/NewRuleModal';
import { RulePicker } from './src/components/RulePicker';
import { SettingsModal } from './src/components/SettingsModal';
import { TeamPanel } from './src/components/TeamPanel';
import { isValidColor } from './src/components/ui';
import {
  DEFAULT_CONFIG, activeRule, addSet, closeSet, initialState, matchWinner, reconcile, removePoint, removeSet,
  resetMatch, selectRule, winRally,
} from './src/logic';
import { load, saveConfig, saveState } from './src/storage';
import type { Config, MatchState, Team, TeamId } from './src/types';
import { C, F } from './src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
// Importar cada peso por separado evita empaquetar toda la familia
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';

// La splash nativa se mantiene hasta que cargan las fuentes y el partido guardado.
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH = {
  light: { bg: '#E1E1E1', logo: require('./assets/splash-icon.png') },
  dark: { bg: '#111919', logo: require('./assets/splash-icon-dark.png') },
};

/** En web no hay splash nativa: se muestra el mismo logo mientras carga. */
function LoadingScreen() {
  const s = SPLASH[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <View style={[styles.loading, { backgroundColor: s.bg }]}>
      {Platform.OS === 'web' && <Image source={s.logo} style={styles.loadingLogo} accessibilityLabel="Clipeo Scoreboard" />}
    </View>
  );
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Evita el "pull to refresh" y el rebote del navegador al deslizar hacia abajo.
  const style = document.createElement('style');
  style.textContent = 'html,body{overscroll-behavior:none;overflow:hidden;background:#E1E1E1}@media (prefers-color-scheme:dark){html,body{background:#111919}}';
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
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    ...Ionicons.font,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newRuleOpen, setNewRuleOpen] = useState(false);

  useEffect(() => {
    load().then(({ config, state }) => {
      setConfig(config);
      setState(state);
      setReady(true);
    });
  }, []);

  const loaded = ready && (fontsLoaded || !!fontError);
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

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

  // Si las fuentes fallan se usa la del sistema
  if (!loaded) return <LoadingScreen />;

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
        {/* Clave por posición (no por equipo): al cambiar de lado, cada panel se queda en su sitio
            y anima el color y el número hacia los del otro equipo. */}
        {order.map((id, slot) => (
          <TeamPanel
            key={slot}
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

        <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.center} pointerEvents="box-none">
          <Animated.View layout={LinearTransition.duration(200)}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={[styles.pill, rule.id !== config.rules[0].id && styles.pillActive]}
              hitSlop={8}
              accessibilityLabel="Modo de puntuación"
            >
              <Animated.Text
                key={rule.id}
                entering={ZoomIn.duration(200)}
                style={[styles.pillText, rule.id !== config.rules[0].id && { color: C.onVolt }]}
                numberOfLines={1}
              >
                {rule.name}
              </Animated.Text>
            </Pressable>
          </Animated.View>
          <Pressable onPress={() => setMenuOpen(true)} style={styles.gear} hitSlop={12} accessibilityLabel="Menú">
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </Animated.View>
      </View>

      <RulePicker
        visible={pickerOpen}
        rules={config.rules}
        activeId={rule.id}
        onSelect={(rid) => { setState((s) => selectRule(s, rid)); setPickerOpen(false); }}
        onCreate={() => { setPickerOpen(false); setNewRuleOpen(true); }}
        onClose={() => setPickerOpen(false)}
      />
      <NewRuleModal
        visible={newRuleOpen}
        onClose={() => setNewRuleOpen(false)}
        onCreate={(r) => {
          const c = { ...config, rules: [...config.rules, r] };
          setConfig(c);
          setState((s) => selectRule(reconcile(s, c), r.id));
          setNewRuleOpen(false);
        }}
      />
      <MainMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCloseSet={() => setState(closeSet)}
        onNewMatch={() => setState((s) => resetMatch(s, config))}
        onSwap={() => setState((s) => ({ ...s, swapped: !s.swapped }))}
        onSettings={() => setSettingsOpen(true)}
      />
      <SettingsModal
        visible={settingsOpen}
        config={config}
        onChange={updateConfig}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingLogo: { width: 180, height: 180 },
  center: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  pill: {
    backgroundColor: 'rgba(7,10,18,0.55)', borderRadius: 999,
    paddingHorizontal: 14, height: 32, justifyContent: 'center', maxWidth: 200,
  },
  pillActive: { backgroundColor: C.volt },
  pillText: { color: '#fff', fontSize: 13, fontFamily: F.bold, letterSpacing: 0.5 },
  gear: {
    backgroundColor: 'rgba(7,10,18,0.55)', borderRadius: 999,
    width: 48, height: 32, alignItems: 'center', justifyContent: 'center',
  },
});
