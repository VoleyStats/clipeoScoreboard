import { useMemo, useState } from 'react';
import { StyleSheet, type TextStyle, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { MOTION } from '../motion';

interface Props {
  value: number;
  style: TextStyle;
  /** Alto de la línea: la distancia del desplazamiento depende de él */
  lineHeight: number;
}

interface Shown {
  value: number;
  prev: number | null;
  dir: 1 | -1;
  /** Cambia en cada actualización para volver a montar (y animar) los textos */
  seq: number;
}

/**
 * Número que "rueda": al subir, el nuevo entra desde abajo y el anterior sale por arriba;
 * al bajar, al revés (como el gesto de deslizar hacia abajo).
 * El número saliente se pinta como una copia con su propia animación, porque Reanimated
 * fija la animación de salida antes de saber hacia dónde irá el siguiente cambio.
 */
export function AnimatedNumber({ value, style, lineHeight }: Props) {
  const [shown, setShown] = useState<Shown>({ value, prev: null, dir: 1, seq: 0 });
  if (value !== shown.value) {
    setShown({ value, prev: shown.value, dir: value > shown.value ? 1 : -1, seq: shown.seq + 1 });
  }

  const d = Math.round(lineHeight * 0.45);
  const { enterUp, enterDown, exitUp, exitDown } = useMemo(() => {
    const ease = Easing.out(Easing.cubic);
    const make = (from: number, to: number, o0: number, o1: number, s0: number, s1: number) =>
      new Keyframe({
        0: { opacity: o0, transform: [{ translateY: from }, { scale: s0 }] },
        100: { opacity: o1, transform: [{ translateY: to }, { scale: s1 }], easing: ease },
      }).duration(MOTION.number);
    return {
      enterUp: make(d, 0, 0, 1, 0.92, 1),
      enterDown: make(-d, 0, 0, 1, 0.92, 1),
      exitUp: make(0, -d, 1, 0, 1, 0.92),
      exitDown: make(0, d, 1, 0, 1, 0.92),
    };
  }, [d]);

  const animate = shown.seq > 0;
  return (
    <View style={{ height: lineHeight, alignSelf: 'stretch' }}>
      {animate && shown.prev !== null && (
        <Animated.Text
          key={`out-${shown.seq}`}
          entering={shown.dir > 0 ? exitUp : exitDown}
          style={[style, styles.layer, { opacity: 0 }]}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          allowFontScaling={false}
          numberOfLines={1}
        >
          {shown.prev}
        </Animated.Text>
      )}
      <Animated.Text
        key={`in-${shown.seq}`}
        entering={animate ? (shown.dir > 0 ? enterUp : enterDown) : undefined}
        style={[style, styles.layer]}
        allowFontScaling={false}
        numberOfLines={1}
      >
        {shown.value}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, top: 0 },
});
