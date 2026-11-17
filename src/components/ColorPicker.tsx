import { useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type HSL, hexToHsl, hslToHex, isValidColor } from '../color';
import { C, F } from '../theme';

/** Colores rápidos genéricos (no ligados a ninguna marca). */
const SWATCHES = [
  '#111111', '#FFFFFF', '#E63946', '#F77F00', '#FFD23F', '#2A9D8F',
  '#06D6A0', '#118AB2', '#3A0CA3', '#7209B7', '#F72585', '#6C757D',
];
const STEPS = 24;

interface SliderProps {
  value: number;
  max: number;
  /** Color de la barra en la posición t (0..1) */
  colorAt: (t: number) => string;
  onChange: (v: number) => void;
  label: string;
}

function Slider({ value, max, colorAt, onChange, label }: SliderProps) {
  const [width, setWidth] = useState(0);
  const update = (e: GestureResponderEvent) => {
    if (!width) return;
    const x = Math.max(0, Math.min(width, e.nativeEvent.locationX));
    onChange((x / width) * max);
  };
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View
        style={styles.track}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={update}
        onResponderMove={update}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
      >
        <View style={styles.gradient} pointerEvents="none">
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: colorAt((i + 0.5) / STEPS) }} />
          ))}
        </View>
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: (value / max) * width - 12, backgroundColor: colorAt(value / max) }]}
        />
      </View>
    </View>
  );
}

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  // HSL local para no perder el tono al pasar por grises
  const [hsl, setHsl] = useState<HSL>(() => hexToHsl(isValidColor(value) ? value : '#000000'));
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    if (isValidColor(value) && hslToHex(hsl) !== value.toUpperCase()) setHsl(hexToHsl(value));
  }

  const setFromHsl = (patch: Partial<HSL>) => {
    const next = { ...hsl, ...patch };
    const hex = hslToHex(next);
    setHsl(next);
    setSynced(hex);
    onChange(hex);
  };

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={[styles.preview, { backgroundColor: isValidColor(value) ? value : 'transparent' }]}
          accessibilityLabel={`Personalizar color ${label}`}
        />
        <TextInput
          value={value}
          onChangeText={(t) => {
            const v = t.startsWith('#') ? t : `#${t}`;
            if (v.length <= 7) onChange(v.toUpperCase());
          }}
          autoCapitalize="characters"
          style={styles.hex}
        />
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8} style={styles.toggle} accessibilityLabel="Selector de color">
          <Ionicons name={open ? 'chevron-up' : 'color-palette-outline'} size={20} color={C.text} />
        </Pressable>
      </View>
      <View style={styles.swatches}>
        {SWATCHES.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[styles.swatch, { backgroundColor: c }, value.toUpperCase() === c && styles.swatchActive]}
          />
        ))}
      </View>
      {open && (
        <View style={styles.sliders}>
          <Slider label="Tono" value={hsl.h} max={360} colorAt={(t) => hslToHex({ h: t * 360, s: 100, l: 50 })} onChange={(h) => setFromHsl({ h })} />
          <Slider label="Saturación" value={hsl.s} max={100} colorAt={(t) => hslToHex({ ...hsl, s: t * 100 })} onChange={(s) => setFromHsl({ s })} />
          <Slider label="Luz" value={hsl.l} max={100} colorAt={(t) => hslToHex({ ...hsl, l: t * 100 })} onChange={(l) => setFromHsl({ l })} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 10, paddingVertical: 6 },
  label: { color: C.text, fontSize: 16, fontFamily: F.regular, flex: 1 },
  preview: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: C.line },
  hex: {
    backgroundColor: C.bg, color: C.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16, width: 100, fontFamily: F.regular, fontVariant: ['tabular-nums'],
  },
  toggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.line },
  swatchActive: { borderWidth: 3, borderColor: C.volt },
  sliders: { marginTop: 14, gap: 14 },
  sliderRow: { gap: 6 },
  sliderLabel: { color: C.muted, fontSize: 12, fontFamily: F.medium, letterSpacing: 1, textTransform: 'uppercase' },
  track: { height: 28, justifyContent: 'center', cursor: 'pointer', userSelect: 'none', touchAction: 'none' } as object,
  gradient: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  thumb: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },
});
