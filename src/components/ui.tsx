import type { ReactNode } from 'react';
import { C, F } from '../theme';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

export { C } from '../theme';


export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children?: ReactNode }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label} hint={hint}>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: C.brand, false: C.line }} thumbColor="#fff" {...({ activeThumbColor: "#fff" } as object)} />
    </Row>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View style={s.stepper}>
      <Btn small label="−" onPress={() => onChange(Math.max(min, value - 1))} />
      <Text style={s.stepValue}>{value}</Text>
      <Btn small label="+" onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

/**
 * Número con accesos rápidos (p. ej. 15 / 21 / 25) y ajuste fino con −/+.
 * Va en su propia fila, debajo de la etiqueta, para que quepa en móvil.
 */
export function NumberPicker({ label, hint, value, onChange, presets, min = 1, max = 99 }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void; presets: number[]; min?: number; max?: number;
}) {
  return (
    <View style={s.picker}>
      <Row label={label} hint={hint}>
        <Stepper value={value} onChange={onChange} min={min} max={max} />
      </Row>
      <View style={s.presets}>
        {presets.map((n) => {
          const active = n === value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[s.preset, active && s.presetActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label}: ${n}`}
            >
              <Text style={[s.presetText, active && s.presetTextActive]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Btn({ label, onPress, kind = 'default', small }: { label: string; onPress: () => void; kind?: 'default' | 'primary' | 'danger'; small?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        kind === 'primary' && { backgroundColor: C.brand },
        kind === 'danger' && { backgroundColor: 'transparent', borderColor: C.danger, borderWidth: 1 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={[s.btnText, kind === 'primary' && { color: C.onBrand }, kind === 'danger' && { color: C.danger }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      style={s.input}
    />
  );
}

export { isValidColor } from '../color';
export { ColorPicker } from './ColorPicker';

const s = StyleSheet.create({
  picker: { paddingBottom: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { minWidth: 52, alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  presetActive: { backgroundColor: C.volt, borderColor: C.volt },
  presetText: { color: C.text, fontFamily: F.semibold, fontSize: 15, fontVariant: ['tabular-nums'] },
  presetTextActive: { color: C.onVolt },
  section: { marginBottom: 24 },
  sectionTitle: { color: C.muted, fontSize: 12, fontFamily: F.bold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12, paddingVertical: 6 },
  label: { color: C.text, fontSize: 16, fontFamily: F.regular },
  hint: { color: C.muted, fontSize: 12, marginTop: 2, fontFamily: F.regular },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepValue: { color: C.text, fontSize: 18, fontFamily: F.bold, minWidth: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },
  btn: { backgroundColor: C.line, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  btnSmall: { paddingHorizontal: 0, paddingVertical: 0, width: 36, height: 36, justifyContent: 'center' },
  btnText: { color: C.text, fontSize: 16, fontFamily: F.semibold },
  input: { backgroundColor: C.bg, color: C.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, flex: 1, fontFamily: F.regular },
});
