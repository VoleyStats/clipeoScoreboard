import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { newRuleId } from '../logic';
import type { ScoringRule } from '../types';
import { Popup } from './Popup';
import { RuleEditor, describeRule } from './RuleEditor';
import { Btn, C } from './ui';
import { F } from '../theme';
import { t } from '../i18n';

const blank = (): ScoringRule => ({
  id: newRuleId(), name: t.newRule, ralliesRequired: 1, pointsAwarded: 2, consecutive: false, once: true,
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
      title={t.newRule}
      onClose={onClose}
      maxWidth={440}
      footer={
        <>
          <Btn label={t.cancel} onPress={onClose} />
          <Btn label={t.createAndUse} kind="primary" onPress={() => onCreate({ ...rule, name: rule.name.trim() || t.newRule })} />
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
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 4 },
  summary: { color: C.volt, fontSize: 14, fontFamily: F.bold, textAlign: 'center', marginTop: 14 },
});
