import { type ComponentRef, type ReactNode, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { t } from '../i18n';
import { C, F } from '../theme';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';

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

const OPTION_H = 44;

/**
 * Desplegable: botón con el valor actual. La lista se abre como capa flotante (overlay)
 * anclada al botón, sin mover el resto de la interfaz; si no cabe debajo, se abre hacia arriba.
 * Va en un Modal transparente para quedar por encima de todo (también de ScrollView y popups)
 * igual en iOS, Android y web.
 */
export function Select<T extends string>({ label, hint, value, options, onChange }: {
  label: string; hint?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const { width: winW, height: winH } = useWindowDimensions();
  const current = options.find((o) => o.value === value) ?? options[0];

  const openMenu = () =>
    anchorRef.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  const close = () => setAnchor(null);

  // Posición de la lista: debajo del botón, alineada a su derecha; arriba si no cabe
  let menu: { left: number; top: number; width: number; maxHeight: number } | null = null;
  if (anchor) {
    const width = Math.min(Math.max(anchor.w, 220), winW - 24);
    const listH = options.length * OPTION_H + 10;
    const below = winH - (anchor.y + anchor.h) - 16;
    const above = anchor.y - 16;
    const openUp = listH > below && above > below;
    const maxHeight = Math.min(listH, openUp ? above : below);
    menu = {
      width,
      maxHeight,
      left: Math.max(12, Math.min(anchor.x + anchor.w - width, winW - width - 12)),
      top: openUp ? anchor.y - maxHeight - 6 : anchor.y + anchor.h + 6,
    };
  }

  return (
    <Row label={label} hint={hint}>
      <Pressable
        ref={anchorRef}
        onPress={openMenu}
        style={({ pressed }) => [s.select, anchor && s.selectOpen, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current.label}`}
        accessibilityState={{ expanded: !!anchor }}
      >
        <Text style={s.selectText} numberOfLines={1}>{current.label}</Text>
        <Ionicons name={anchor ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </Pressable>
      <Modal visible={!!anchor} transparent animationType="none" onRequestClose={close} statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t.closeList} />
        {menu && (
          <Animated.View entering={FadeIn.duration(120)} style={[s.options, menu]} accessibilityRole="radiogroup">
            <ScrollView bounces={false}>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => { onChange(o.value); close(); }}
                    style={({ pressed }) => [s.option, active && s.optionActive, pressed && { backgroundColor: C.line }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${label}: ${o.label}`}
                  >
                    <Text style={[s.optionText, active && s.optionTextActive]} numberOfLines={1}>{o.label}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={C.volt} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </Modal>
    </Row>
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
  select: {
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 210, minWidth: 140,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'space-between',
  },
  selectOpen: { borderColor: C.brand },
  selectText: { color: C.text, fontFamily: F.medium, fontSize: 15, flexShrink: 1 },
  options: {
    position: 'absolute', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  option: { height: OPTION_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 12, borderRadius: 8 },
  optionActive: { backgroundColor: C.raised },
  optionText: { color: C.text, fontFamily: F.regular, fontSize: 15 },
  optionTextActive: { fontFamily: F.semibold },
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
