import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import type { Gesture } from './types';

const SWIPE_MIN = 40;
const TAP_SLOP = 12;
const LONG_PRESS_MS = 450;

export type GestureHandlers = Partial<Record<Gesture, () => void>>;

/**
 * Reconoce tocar, mantener pulsado y deslizar arriba/abajo.
 * Usa PanResponder para funcionar igual en iOS, Android y Web.
 * Mantener pulsado solo se activa si hay manejador, y se cancela al mover el dedo.
 */
export function useGestures(handlers: GestureHandlers) {
  const ref = useRef<GestureHandlers>(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  // El ref solo se lee dentro de los callbacks de gesto (eventos), nunca durante el render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let longPressed = false;
    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        longPressed = false;
        cancel();
        if (ref.current.longPress) {
          timer = setTimeout(() => {
            timer = null;
            longPressed = true;
            ref.current.longPress?.();
          }, LONG_PRESS_MS);
        }
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > TAP_SLOP || Math.abs(g.dy) > TAP_SLOP) cancel();
      },
      onPanResponderTerminate: cancel,
      onPanResponderRelease: (_, g) => {
        cancel();
        if (longPressed) return;
        const vertical = Math.abs(g.dy) > Math.abs(g.dx);
        if (vertical && g.dy > SWIPE_MIN) ref.current.swipeDown?.();
        else if (vertical && g.dy < -SWIPE_MIN) ref.current.swipeUp?.();
        else if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) ref.current.tap?.();
      },
    });
  });
  return responder.panHandlers;
}
