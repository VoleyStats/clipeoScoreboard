import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';

const SWIPE_MIN = 40;
const TAP_SLOP = 12;

/**
 * Tap -> onTap, deslizar hacia abajo -> onSwipeDown.
 * Usa PanResponder para funcionar igual en iOS, Android y Web.
 */
export function useTapSwipe(onTap: () => void, onSwipeDown: () => void) {
  const handlers = useRef({ onTap, onSwipeDown });
  handlers.current = { onTap, onSwipeDown };

  return useMemo(
    () =>
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
      }).panHandlers,
    [],
  );
}
