import { StyleSheet, Text, View } from 'react-native';
import { useTapSwipe } from '../useTapSwipe';
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
}

export function TeamPanel(p: Props) {
  const pointGestures = useTapSwipe(p.onPoint, p.onUnpoint);
  const setGestures = useTapSwipe(p.onSet, p.onUnset);

  const digits = Math.max(2, String(p.points).length);
  const small = Math.max(14, Math.min(28, Math.floor(Math.min(p.width, p.height) * 0.06)));
  // Espacio reservado arriba (nombre + sets) y abajo (progreso / controles)
  const top = p.showName || p.showSets ? 16 + small * 2.4 : 0;
  const bottom = 56;
  const fontSize = Math.floor(Math.min((p.height - top - bottom) * 1.05, (p.width * 0.9) / (digits * 0.62)));
  const fg = p.team.fg;

  return (
    <View
      {...pointGestures}
      style={[styles.panel, { backgroundColor: p.team.bg, width: p.width, height: p.height }, styles.noSelect]}
    >
      <View style={styles.header} pointerEvents="box-none">
        {p.showName && (
          <Text numberOfLines={1} style={[styles.name, { color: fg, fontSize: small }]}>
            {p.winner ? '🏆 ' : ''}
            {p.team.name}
          </Text>
        )}
        {p.showSets && (
          <View
            {...setGestures}
            hitSlop={16}
            style={[styles.sets, { borderColor: fg, minWidth: small * 2.4, height: small * 2.4, borderRadius: small * 1.2 }]}
          >
            <Text style={[styles.setsText, { color: fg, fontSize: small * 1.3 }]}>{p.sets}</Text>
          </View>
        )}
      </View>

      <View style={{ paddingTop: top, paddingBottom: bottom, flex: 1, justifyContent: 'center' }} pointerEvents="none">
      <Text
        style={[styles.points, { color: fg, fontSize, lineHeight: fontSize * 1.05 }]}
        allowFontScaling={false}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {p.points}
      </Text>
      </View>

      {p.required > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {Array.from({ length: p.required }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { borderColor: fg, width: small * 0.7, height: small * 0.7, borderRadius: small },
                i < p.progress && { backgroundColor: fg },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
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
  dot: { borderWidth: 2, opacity: 0.9 },
});
