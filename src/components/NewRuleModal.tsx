import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { newRuleId } from '../logic';
import type { ScoringRule } from '../types';
import { Popup } from './Popup';
import { RuleEditor, describeRule } from './RuleEditor';
import { Btn, C } from './ui';

const blank = (): ScoringRule => ({
  id: newRuleId(), name: 'Nuevo modo', ralliesRequired: 1, pointsAwarded: 2, consecutive: false, once: true,
});

interface Props {
  visible: boolean;
  onCreate: (rule: ScoringRule) => void;
  onClose: () => void;
}

export function NewRuleModal({ visible, onCreate: create, onClose: close }: Props) {
  const [rule, setRule] = useState(blank);
  // Se deja un modo en blanco listo para la próxima vez
  const onClose = () => { setRule(blank()); close(); };
  const onCreate = (r: ScoringRule) => { setRule(blank()); create(r); };

  return (
    <Popup
      visible={visible}
      title="Nuevo modo"
      onClose={onClose}
      maxWidth={440}
      footer={
        <>
          <Btn label="Cancelar" onPress={onClose} />
          <Btn label="Crear y usar" kind="primary" onPress={() => onCreate({ ...rule, name: rule.name.trim() || 'Nuevo modo' })} />
        </>
      }
    >
      <View style={styles.card}>
        <RuleEditor rule={rule} onChange={(p) => setRule((r) => ({ ...r, ...p }))} />
      </View>
      <Text style={styles.summary}>{describeRule(rule)}</Text>
    </Popup>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  summary: { color: C.accent, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 14 },
});
