import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';

const SWIPE_MIN = 40;
const TAP_SLOP = 12;

/**
 * Tap -> onTap, deslizar hacia abajo -> onSwipeDown.
 * Usa PanResponder para funcionar igual en iOS, Android y Web.
 */
export function useTapSwipe(onTap: () => void, onSwipeDown: () => void) {
  const handlers = useRef({ onTap, onSwipeDown });
  useEffect(() => {
    handlers.current = { onTap, onSwipeDown };
  });

  // El ref solo se lee dentro de los callbacks de gesto (eventos), nunca durante el render.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_MIN && Math.abs(g.dy) > Math.abs(g.dx)) {
          handlers.current.onSwipeDown();
        } else if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) {
          handlers.current.onTap();
        }
      },
    }),
  );
  return responder.panHandlers;
}
