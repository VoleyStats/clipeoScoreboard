import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

export const C = {
  bg: '#0E0E10',
  card: '#1A1A1E',
  line: '#2A2A30',
  text: '#F2F2F4',
  muted: '#8B8B95',
  accent: '#FFD23F',
  danger: '#FF5A5F',
};

export const SWATCHES = [
  '#111111', '#FFFFFF', '#E63946', '#F77F00', '#FFD23F', '#2A9D8F',
  '#06D6A0', '#118AB2', '#3A0CA3', '#7209B7', '#F72585', '#6C757D',
];

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
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.accent, false: C.line }} thumbColor="#fff" />
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

export function Btn({ label, onPress, kind = 'default', small }: { label: string; onPress: () => void; kind?: 'default' | 'primary' | 'danger'; small?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        kind === 'primary' && { backgroundColor: C.accent },
        kind === 'danger' && { backgroundColor: 'transparent', borderColor: C.danger, borderWidth: 1 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={[s.btnText, kind === 'primary' && { color: '#111' }, kind === 'danger' && { color: C.danger }]}>{label}</Text>
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

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.colorBlock}>
      <View style={s.row}>
        <Text style={[s.label, { flex: 1 }]}>{label}</Text>
        <View style={[s.preview, { backgroundColor: HEX.test(value) ? value : 'transparent' }]} />
        <TextInput
          value={value}
          onChangeText={(t) => {
            const v = t.startsWith('#') ? t : `#${t}`;
            if (v.length <= 7) onChange(v.toUpperCase());
          }}
          autoCapitalize="characters"
          style={[s.input, s.hexInput]}
        />
      </View>
      <View style={s.swatches}>
        {SWATCHES.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[s.swatch, { backgroundColor: c }, value.toUpperCase() === c && s.swatchActive]}
          />
        ))}
      </View>
    </View>
  );
}

export const isValidColor = (v: string) => HEX.test(v);

const s = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 12, paddingVertical: 6 },
  label: { color: C.text, fontSize: 16 },
  hint: { color: C.muted, fontSize: 12, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepValue: { color: C.text, fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },
  btn: { backgroundColor: C.line, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  btnSmall: { paddingHorizontal: 0, paddingVertical: 0, width: 36, height: 36, justifyContent: 'center' },
  btnText: { color: C.text, fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: C.bg, color: C.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, flex: 1 },
  hexInput: { flex: 0, width: 100, fontVariant: ['tabular-nums'] },
  colorBlock: { paddingBottom: 10 },
  preview: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.line },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.line },
  swatchActive: { borderWidth: 3, borderColor: C.accent },
});
