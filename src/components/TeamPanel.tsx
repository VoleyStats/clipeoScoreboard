import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, Keyframe, type SharedValue, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
  ZoomIn, ZoomOut,
} from 'react-native-reanimated';
import { MOTION } from '../motion';
import type { ResolvedAction } from '../logic';
import { type GestureHandlers, useGestures } from '../useTapSwipe';
import { AnimatedNumber } from './AnimatedNumber';
import type { Gesture, Team } from '../types';
import { F } from '../theme';

interface Props {
  team: Team;
  points: number;
  sets: number;
  /** Progreso hacia la regla activa (solo se muestra si required > 1) */
  progress: number;
  required: number;
  width: number;
  height: number;
  showName: boolean;
  showSets: boolean;
  winner: boolean;
  /** Acción configurada para cada gesto (decide también la respuesta visual) */
  actions: Record<Gesture, ResolvedAction>;
  onGesture: (g: Gesture) => void;
  onSet: () => void;
  onUnset: () => void;
  /** Cambio de lado: 0 = posición normal, 1 = intercambiado (animado) */
  swap: SharedValue<number>;
  /** Hacia dónde se desplaza este panel al intercambiar: +1 derecha/abajo, -1 izquierda/arriba */
  swapDir: 1 | -1;
  /** Distancia del desplazamiento (ancho o alto del panel) */
  swapDistance: number;
  horizontal: boolean;
  /** Si los controles (modo y menú) quedan debajo de este panel: reserva su espacio */
  controlsBelow: boolean;
}

/** "+2" que sube y se desvanece sobre el panel. */
const floatUp = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.7 }] },
  25: { opacity: 1, transform: [{ translateY: -6 }, { scale: 1.08 }], easing: Easing.out(Easing.back(2)) },
  100: { opacity: 0, transform: [{ translateY: -60 }, { scale: 1 }], easing: Easing.in(Easing.quad) },
}).duration(900);

export function TeamPanel(p: Props) {
  // Destello breve sobre la mitad del equipo al tocar o deslizar
  const flash = useSharedValue(0);
  const pulse = (peak: number) =>
    flash.set(withSequence(withTiming(peak, { duration: 50 }), withTiming(0, { duration: 420 })));

  // Texto flotante ("+2", "↶") para las acciones que no son un simple punto
  const [bursts, setBursts] = useState<{ id: number; label: string }[]>([]);
  const burst = (label: string) => {
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, { id, label }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 950);
  };

  const handlers: GestureHandlers = {};
  for (const g of Object.keys(p.actions) as Gesture[]) {
    const a = p.actions[g];
    if (a.kind === 'none') continue; // sin manejador: el gesto no hace nada (ni espera)
    handlers[g] = () => {
      if (a.kind === 'point') pulse(0.16);
      else if (a.kind === 'rule') { pulse(0.3); burst(`+${a.rule.pointsAwarded}`); }
      else if (a.kind === 'minus') pulse(0.08);
      else if (a.kind === 'undo') { pulse(0.08); burst('↶'); }
      p.onGesture(g);
    };
  }
  const pointGestures = useGestures(handlers);
  const setGestures = useGestures({ tap: p.onSet, swipeDown: p.onUnset });

  // Fondo con transición suave al cambiar el color en ajustes
  const bg = useSharedValue(p.team.bg);
  useEffect(() => { bg.set(withTiming(p.team.bg, { duration: MOTION.color })); }, [bg, p.team.bg]);
  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: bg.get() }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));

  // "Latido" del círculo de sets cuando cambia (no al montar)
  const setScale = useSharedValue(1);
  const lastSets = useRef(p.sets);
  useEffect(() => {
    if (lastSets.current === p.sets) return;
    lastSets.current = p.sets;
    setScale.set(withSequence(withTiming(1.28, { duration: 110 }), withSpring(1, MOTION.spring)));
  }, [p.sets, setScale]);
  const setsStyle = useAnimatedStyle(() => ({ transform: [{ scale: setScale.get() }] }));

  // Cambio de lado: las dos mitades se encogen como tarjetas y se cruzan en sentidos opuestos,
  // una por encima de la otra, hasta ocupar el sitio contrario.
  const { swap, swapDir, swapDistance, horizontal } = p;
  const swapStyle = useAnimatedStyle(() => {
    const t = swap.get();
    const lift = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
    const offset = swapDir * swapDistance * t;
    return {
      transform: [
        { translateX: horizontal ? offset : 0 },
        { translateY: horizontal ? 0 : offset },
        { scale: 1 - 0.14 * lift },
      ],
      borderRadius: 28 * lift,
      zIndex: swapDir > 0 ? 2 : 1,
      shadowOpacity: 0.5 * lift,
    };
  });

  const digits = Math.max(2, String(p.points).length);
  const small = Math.max(14, Math.min(28, Math.floor(Math.min(p.width, p.height) * 0.06)));
  // Espacio reservado arriba (nombre + sets) y abajo (progreso / controles)
  // El número se centra en el espacio libre: entre la cabecera (nombre y sets) y lo que haya
  // debajo. Con los controles debajo se reserva su sitio; si no, solo el de los puntos de
  // progreso (fijo, para que el número no cambie de tamaño al cambiar de modo).
  const top = p.showName || p.showSets ? 16 + small * 2.4 : 16;
  const dotsBottom = p.controlsBelow ? 60 : 18;
  const bottom = p.controlsBelow ? 56 : dotsBottom + small * 0.7 + 10;
  const fontSize = Math.floor(Math.min((p.height - top - bottom) * 1.05, (p.width * 0.9) / (digits * 0.62)));
  const fg = p.team.fg;

  return (
    <Animated.View
      {...pointGestures}
      style={[styles.panel, { width: p.width, height: p.height }, styles.noSelect, bgStyle, swapStyle]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fg }, flashStyle]} />
      <View style={styles.header} pointerEvents="box-none">
        {p.showName && (
          <Text numberOfLines={1} style={[styles.name, { color: fg, fontSize: small }]}>
            {p.winner ? '🏆 ' : ''}
            {p.team.name}
          </Text>
        )}
        {p.showSets && (
          <Animated.View
            {...setGestures}
            hitSlop={16}
            style={[styles.sets, { borderColor: fg, minWidth: small * 2.4, height: small * 2.4, borderRadius: small * 1.2 }, setsStyle]}
          >
            <Text style={[styles.setsText, { color: fg, fontSize: small * 1.3 }]}>{p.sets}</Text>
          </Animated.View>
        )}
      </View>

      <View style={{ paddingTop: top, paddingBottom: bottom, flex: 1, justifyContent: 'center', alignSelf: 'stretch' }} pointerEvents="none">
      <AnimatedNumber
        value={p.points}
        lineHeight={fontSize * 1.05}
        style={{ ...styles.points, color: fg, fontSize, lineHeight: fontSize * 1.05 }}
      />
      </View>

      {bursts.map(({ id, label }) => (
        <Animated.Text
          key={id}
          entering={floatUp}
          pointerEvents="none"
          style={[styles.burst, { color: fg, fontSize: small * 2.6, top: p.height * 0.18 }, { opacity: 0 }]}
        >
          {label}
        </Animated.Text>
      ))}

      {p.required > 1 && (
        <View style={[styles.dots, { bottom: dotsBottom }]} pointerEvents="none">
          {Array.from({ length: p.required }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, { borderColor: fg, width: small * 0.7, height: small * 0.7, borderRadius: small }]}
            >
              {i < p.progress && (
                <Animated.View
                  entering={ZoomIn.springify().damping(12).stiffness(280)}
                  exiting={ZoomOut.duration(MOTION.fast)}
                  style={[styles.dotFill, { backgroundColor: fg, borderRadius: small }]}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
  },
  burst: { position: 'absolute', fontFamily: F.display, textAlign: 'center' },
  noSelect: { userSelect: 'none', touchAction: 'none', cursor: 'pointer' } as object,
  header: {
    position: 'absolute', top: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  name: { flexShrink: 1, fontFamily: F.semibold, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 },
  sets: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, opacity: 0.9 },
  setsText: { fontFamily: F.display, fontVariant: ['tabular-nums'] },
  points: {
    fontFamily: F.display, fontVariant: ['tabular-nums'], includeFontPadding: false,
    textAlign: 'center', letterSpacing: -2,
  },
  dots: { position: 'absolute', flexDirection: 'row', gap: 10 },
  dot: { borderWidth: 2, opacity: 0.9, overflow: 'hidden' },
  dotFill: { flex: 1 },
});
