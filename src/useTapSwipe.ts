import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';

const SWIPE_MIN = 40;
const TAP_SLOP = 12;
const LONG_PRESS_MS = 450;

interface Handlers {
  onTap: () => void;
  onSwipeDown: () => void;
  /** Opcional: mantener pulsado sin mover el dedo */
  onLongPress?: () => void;
}

/**
 * Tap -> onTap, deslizar hacia abajo -> onSwipeDown, mantener pulsado -> onLongPress.
 * Usa PanResponder para funcionar igual en iOS, Android y Web.
 */
export function useTapSwipe(onTap: () => void, onSwipeDown: () => void, onLongPress?: () => void) {
  const handlers = useRef<Handlers>({ onTap, onSwipeDown, onLongPress });
  useEffect(() => {
    handlers.current = { onTap, onSwipeDown, onLongPress };
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
        if (handlers.current.onLongPress) {
          timer = setTimeout(() => {
            timer = null;
            longPressed = true;
            handlers.current.onLongPress?.();
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
        if (g.dy > SWIPE_MIN && Math.abs(g.dy) > Math.abs(g.dx)) {
          handlers.current.onSwipeDown();
        } else if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) {
          handlers.current.onTap();
        }
      },
    });
  });
  return responder.panHandlers;
}
