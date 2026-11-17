import { Easing, FadeIn, Keyframe, ZoomIn } from 'react-native-reanimated';

/**
 * Tokens de movimiento compartidos. Duraciones cortas: es un marcador, la animación
 * acompaña al toque pero no debe retrasar la lectura del resultado.
 * Reanimated respeta el ajuste de "reducir movimiento" del sistema por defecto.
 */
export const MOTION = {
  fast: 140,
  base: 220,
  number: 280,
  color: 320,
  spring: { damping: 16, stiffness: 240, mass: 0.7 },
} as const;

const easeOut = Easing.out(Easing.cubic);

/** Ventanas emergentes: aparecen con un ligero escalado desde abajo. */
export const popIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 14 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: easeOut },
}).duration(MOTION.base);

export const backdropIn = FadeIn.duration(MOTION.fast);

/** Elementos de una lista que entran escalonados. */
export const staggerIn = (i: number) => ZoomIn.delay(40 + i * 35).springify().damping(14).stiffness(260);
