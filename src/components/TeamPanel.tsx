import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, Keyframe, type SharedValue, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
  ZoomIn, ZoomOut,
} from 'react-native-reanimated';
import { MOTION } from '../motion';
import { useTapSwipe } from '../useTapSwipe';
import { AnimatedNumber } from './AnimatedNumber';
import type { Team } from '../types';
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
  onPoint: () => void;
  onUnpoint: () => void;
  onSet: () => void;
  onUnset: () => void;
  /** Mantener pulsado: jugada especial (p. ej. punto doble). Sin ella, el gesto no hace nada */
  onSpecial?: () => void;
  /** Texto que flota al usar la jugada especial, p. ej. "+2" */
  specialLabel?: string;
  /** Cambio de lado: 0 = posición normal, 1 = intercambiado (animado) */
  swap: SharedValue<number>;
  /** Hacia dónde se desplaza este panel al intercambiar: +1 derecha/abajo, -1 izquierda/arriba */
  swapDir: 1 | -1;
  /** Distancia del desplazamiento (ancho o alto del panel) */
  swapDistance: number;
  horizontal: boolean;
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

  const [bursts, setBursts] = useState<number[]>([]);
  const special = p.onSpecial
    ? () => {
        pulse(0.3);
        p.onSpecial?.();
        const id = Date.now();
        setBursts((b) => [...b, id]);
        setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 950);
      }
    : undefined;

  const pointGestures = useTapSwipe(
    () => { pulse(0.16); p.onPoint(); },
    () => { pulse(0.08); p.onUnpoint(); },
    special,
  );
  const setGestures = useTapSwipe(p.onSet, p.onUnset);

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
  const top = p.showName || p.showSets ? 16 + small * 2.4 : 0;
  const bottom = 56;
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

      {bursts.map((id) => (
        <Animated.Text
          key={id}
          entering={floatUp}
          pointerEvents="none"
          style={[styles.burst, { color: fg, fontSize: small * 2.6, top: p.height * 0.18 }, { opacity: 0 }]}
        >
          {p.specialLabel}
        </Animated.Text>
      ))}

      {p.required > 1 && (
        <View style={styles.dots} pointerEvents="none">
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
  dots: { position: 'absolute', bottom: 60, flexDirection: 'row', gap: 10 },
  dot: { borderWidth: 2, opacity: 0.9, overflow: 'hidden' },
  dotFill: { flex: 1 },
});
