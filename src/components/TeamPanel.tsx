import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, interpolateColor, Keyframe, type SharedValue, useAnimatedStyle, useSharedValue, withSequence, withSpring,
  withTiming, ZoomIn, ZoomOut,
} from 'react-native-reanimated';
import type { PanelLayout } from '../layout';
import { MOTION } from '../motion';
import type { ResolvedAction } from '../logic';
import { type GestureHandlers, useGestures } from '../useTapSwipe';
import { AnimatedNumber } from './AnimatedNumber';
import type { Gesture, Team } from '../types';
import { F } from '../theme';
import { t } from '../i18n';

interface Props {
  team: Team;
  points: number;
  sets: number;
  /** Puntos de progreso bajo el número (modo de varias jugadas o recuperar el saque) */
  dots: { count: number; filled: number } | null;
  /** Medidas calculadas para la posición que ocupa en pantalla (src/layout.ts) */
  layout: PanelLayout;
  fontSize: number;
  lineHeight: number;
  /** Este equipo saca */
  serving: boolean;
  showServe: boolean;
  /** Tocar el nombre: elegir que saque este equipo */
  onServe: () => void;
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

  // Saque: el círculo de sets se pinta en negativo (fondo del color del texto, número del color de fondo)
  const fg = p.team.fg;
  const serveOn = p.showServe && p.serving;
  const serve = useSharedValue(serveOn ? 1 : 0);
  useEffect(() => { serve.set(withTiming(serveOn ? 1 : 0, { duration: MOTION.base })); }, [serve, serveOn]);
  const serveFill = useAnimatedStyle(() => ({ opacity: serve.get() }));
  const serveText = useAnimatedStyle(() => ({ color: interpolateColor(serve.get(), [0, 1], [fg, bg.get()]) }));

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

  const L = p.layout;
  const small = L.small;
  const dotSize = small * 0.7;
  // El número se coloca en el centro del espacio libre que calcula layout.ts
  const numberTop = L.area.top + (L.area.height - p.lineHeight) / 2;

  return (
    <Animated.View
      {...pointGestures}
      style={[styles.panel, { width: L.width, height: L.height }, styles.noSelect, bgStyle, swapStyle]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fg }, flashStyle]} />
      <View
        style={[styles.header, { top: L.header.top, left: L.header.left, right: L.header.right, height: L.header.height, gap: small * 0.5 }]}
        pointerEvents="box-none"
      >
        {p.showName && (
          <Pressable
            onPress={p.showServe ? p.onServe : undefined}
            disabled={!p.showServe}
            style={styles.nameWrap}
            hitSlop={12}
            accessibilityRole={p.showServe ? 'button' : 'text'}
            accessibilityLabel={p.showServe ? t.chooseServe(p.team.name) : p.team.name}
            accessibilityState={{ selected: serveOn }}
          >
            {serveOn && !p.showSets && (
              <View style={{ width: small * 0.55, height: small * 0.55, borderRadius: small, backgroundColor: fg }} />
            )}
            <Text numberOfLines={1} style={[styles.name, { color: fg, fontSize: small }]}>
              {p.winner ? '🏆 ' : ''}
              {p.team.name}
            </Text>
          </Pressable>
        )}
        {p.showSets && (
          <Animated.View
            {...setGestures}
            hitSlop={16}
            accessibilityLabel={t.setsLabel(p.sets, serveOn)}
            style={[styles.sets, { borderColor: fg, minWidth: small * 2.4, height: small * 2.4, borderRadius: small * 1.2 }, setsStyle]}
          >
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fg, borderRadius: small * 1.2 }, serveFill]} />
            <Animated.Text style={[styles.setsText, { fontSize: small * 1.3 }, serveText]}>{p.sets}</Animated.Text>
          </Animated.View>
        )}
      </View>

      <View
        pointerEvents="none"
        style={[styles.number, { top: numberTop, left: L.area.left, width: L.area.width, height: p.lineHeight }]}
      >
        <AnimatedNumber
          value={p.points}
          lineHeight={p.lineHeight}
          style={{ ...styles.points, color: fg, fontSize: p.fontSize, lineHeight: p.lineHeight }}
        />
      </View>

      {bursts.map(({ id, label }) => (
        <Animated.Text
          key={id}
          entering={floatUp}
          pointerEvents="none"
          style={[styles.burst, { color: fg, fontSize: small * 2.6, top: L.area.top }, { opacity: 0 }]}
        >
          {label}
        </Animated.Text>
      ))}

      {p.dots && (
        <View
          style={[styles.dots, { bottom: L.dotsBottom, left: L.area.left, width: L.area.width, gap: small * 0.45 }]}
          pointerEvents="none"
        >
          {Array.from({ length: p.dots.count }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, { borderColor: fg, width: dotSize, height: dotSize, borderRadius: small }]}
            >
              {i < p.dots!.filled && (
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
  header: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  number: { position: 'absolute' },
  name: { flexShrink: 1, fontFamily: F.semibold, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 },
  sets: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, overflow: 'hidden' },
  setsText: { fontFamily: F.display, fontVariant: ['tabular-nums'] },
  points: {
    fontFamily: F.display, fontVariant: ['tabular-nums'], includeFontPadding: false,
    textAlign: 'center', letterSpacing: -2,
  },
  dots: { position: 'absolute', flexDirection: 'row', justifyContent: 'center' },
  dot: { borderWidth: 2, opacity: 0.9, overflow: 'hidden' },
  dotFill: { flex: 1 },
});
