import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ScoringRule } from '../types';
import { describeRule } from './RuleEditor';
import { C, F } from '../theme';

interface Props {
  visible: boolean;
  rules: ScoringRule[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function RulePicker({ visible, rules, activeId, onSelect, onCreate, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Modo de puntuación</Text>
          {rules.map((r) => {
            const active = r.id === activeId;
            return (
              <Pressable
                key={r.id}
                onPress={() => onSelect(r.id)}
                style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.name, active && { color: C.onVolt }]}>{r.name}</Text>
                <Text style={[styles.desc, active && { color: C.onVolt, opacity: 0.7 }]}>{describeRule(r)}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={onCreate} style={({ pressed }) => [styles.item, styles.create, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.name, { color: C.brandLight }]}>+ Nuevo modo</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,10,18,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 8, width: '100%', maxWidth: 380, gap: 4 },
  title: { color: C.muted, fontSize: 12, fontFamily: F.bold, letterSpacing: 1.5, textTransform: 'uppercase', padding: 10, paddingBottom: 4 },
  create: { borderWidth: 1, borderColor: C.line, borderStyle: 'dashed', marginTop: 4 },
  item: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  itemActive: { backgroundColor: C.volt },
  name: { color: C.text, fontSize: 18, fontFamily: F.displaySemi },
  desc: { color: C.muted, fontSize: 13, marginTop: 2, fontFamily: F.regular },
});
