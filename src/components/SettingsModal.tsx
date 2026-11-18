import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { DEFAULTS, lang, t } from '../i18n';
import { GESTURES, gestureRules, newRuleId, resolveAction } from '../logic';
import type { Config, GestureAction, ScoringRule, Team, TeamId } from '../types';
import { F } from '../theme';
import { Popup } from './Popup';
import { RuleEditor, describeRule } from './RuleEditor';
import { Btn, C, ColorPicker, Field, NumberPicker, Row, Section, Select, Toggle } from './ui';

interface Props {
  visible: boolean;
  config: Config;
  onChange: (c: Config) => void;
  onClose: () => void;
}

/** Política de privacidad publicada con la web (vercel.json), en el idioma de la app. */
export const PRIVACY_URL = `https://scoreboard.clipeostats.com/privacy?lang=${lang}`;

export function SettingsModal({ visible, config, onChange, onClose }: Props) {
  const set = <K extends keyof Config>(k: K, v: Config[K]) => onChange({ ...config, [k]: v });
  const setTeam = (id: TeamId, patch: Partial<Team>) =>
    set('teams', { ...config.teams, [id]: { ...config.teams[id], ...patch } });
  const setRule = (id: string, patch: Partial<ScoringRule>) =>
    set('rules', config.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRule = () =>
    set('rules', [
      ...config.rules,
      { id: newRuleId(), name: t.newRule, ralliesRequired: 1, pointsAwarded: 2, consecutive: false, once: true },
    ]);
  const removeRule = (id: string) => set('rules', config.rules.filter((r) => r.id !== id));

  return (
    <Popup
      visible={visible}
      title={t.settings}
      onClose={onClose}
      footer={<Btn label={t.done} kind="primary" onPress={onClose} />}
    >
      {(['a', 'b'] as TeamId[]).map((id) => (
        <Section key={id} title={t.team(id === 'a' ? 1 : 2)}>
          <Row label={t.name}>
            <Field value={config.teams[id].name} onChange={(name) => setTeam(id, { name })} />
          </Row>
          <ColorPicker label={t.background} value={config.teams[id].bg} onChange={(bg) => setTeam(id, { bg })} />
          <ColorPicker label={t.text} value={config.teams[id].fg} onChange={(fg) => setTeam(id, { fg })} />
        </Section>
      ))}

      <Section title={t.scoringModes}>
        <Text style={styles.help}>{t.scoringModesHelp}</Text>
        {config.rules.map((r, i) => (
          <View key={r.id} style={styles.rule}>
            <Row label={i === 0 ? t.defaultRule : t.ruleN(i + 1)} hint={describeRule(r)}>
              {i > 0 && <Btn small label="✕" kind="danger" onPress={() => removeRule(r.id)} />}
            </Row>
            <RuleEditor rule={r} isDefault={i === 0} onChange={(p) => setRule(r.id, p)} />
          </View>
        ))}
        <View style={{ paddingVertical: 10 }}>
          <Btn label={t.createRule} onPress={addRule} />
        </View>
      </Section>

      <Section title={t.sets}>
        <Toggle label={t.showSets} value={config.showSets} onChange={(v) => set('showSets', v)} />
        <Toggle
          label={t.resetPointsOnSet}
          value={config.resetPointsOnSet}
          onChange={(v) => set('resetPointsOnSet', v)}
        />
      </Section>

      <Section title={t.setEnd}>
        <Toggle
          label={t.autoSets}
          hint={config.autoSets ? t.autoSetsOn : t.autoSetsOff}
          value={config.autoSets}
          onChange={(v) => set('autoSets', v)}
        />
        {config.autoSets && (
          <>
            <NumberPicker
              label={t.pointsPerSet}
              value={config.pointsPerSet}
              onChange={(v) => set('pointsPerSet', v)}
              presets={[15, 21, 25]}
            />
            <Toggle
              label={t.winByTwo}
              hint={config.winByTwo ? t.winByTwoOn(config.pointsPerSet - 1) : t.winByTwoOff}
              value={config.winByTwo}
              onChange={(v) => set('winByTwo', v)}
            />
          </>
        )}
      </Section>

      <Section title={t.matchEnd}>
        <Toggle
          label={t.matchEnd}
          hint={config.matchEnd ? t.matchEndOn : t.matchEndOff}
          value={config.matchEnd}
          onChange={(v) => set('matchEnd', v)}
        />
        {config.matchEnd && (
          <>
            <NumberPicker
              label={t.setsToWin}
              hint={t.bestOf(config.setsToWin * 2 - 1)}
              value={config.setsToWin}
              onChange={(v) => set('setsToWin', v)}
              presets={[1, 2, 3]}
              max={9}
            />
            {config.autoSets && config.setsToWin > 1 && (
              <NumberPicker
                label={t.decidingSetPoints}
                hint={t.nthSet(config.setsToWin * 2 - 1)}
                value={config.decidingSetPoints}
                onChange={(v) => set('decidingSetPoints', v)}
                presets={[15, 21, 25]}
              />
            )}
          </>
        )}
      </Section>

      <Section title={t.display}>
        <Toggle label={t.showNames} value={config.showNames} onChange={(v) => set('showNames', v)} />
        {Platform.OS !== 'web' && (
          <Toggle label={t.haptics} value={config.haptics} onChange={(v) => set('haptics', v)} />
        )}
      </Section>

      <Section title={t.gestures}>
        <Text style={styles.help}>{t.gesturesHelp}</Text>
        {GESTURES.map((g) => {
          const resolved = resolveAction(config, config.gestures[g]);
          const current: GestureAction = resolved.kind === 'rule' ? `rule:${resolved.rule.id}` : resolved.kind;
          const options: { value: GestureAction; label: string }[] = [
            { value: 'point', label: t.actionPoint },
            ...gestureRules(config).map((r) => ({ value: `rule:${r.id}` as GestureAction, label: r.name })),
            { value: 'minus', label: t.actionMinus },
            { value: 'undo', label: t.actionUndo },
            { value: 'none', label: t.actionNone },
          ];
          return (
            <View key={g} style={styles.gesture}>
              <Select
                label={t.gesture[g].label}
                hint={t.gesture[g].hint}
                value={current}
                options={options}
                onChange={(v) => set('gestures', { ...config.gestures, [g]: v })}
              />
            </View>
          );
        })}
        {!GESTURES.some((g) => ['minus', 'undo'].includes(resolveAction(config, config.gestures[g]).kind)) && (
          <Text style={styles.warn}>{t.warnNoMinus}</Text>
        )}
        {resolveAction(config, config.gestures.tap).kind === 'none' && (
          <Text style={styles.warn}>{t.warnTapNone}</Text>
        )}
      </Section>

      <Btn label={t.restoreDefaults} kind="danger" onPress={() => onChange(DEFAULTS)} />

      <Text
        style={styles.link}
        accessibilityRole="link"
        onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
      >
        {t.privacy}
      </Text>
    </Popup>
  );
}

const styles = StyleSheet.create({
  help: { color: C.muted, fontFamily: F.regular, fontSize: 13, lineHeight: 19, paddingVertical: 10 },
  link: { color: C.muted, fontFamily: F.regular, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline', marginTop: 18 },
  gesture: { borderTopWidth: 1, borderTopColor: C.line },
  warn: { color: C.volt, fontFamily: F.medium, fontSize: 13, lineHeight: 19, paddingBottom: 12 },
  rule: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 6 },
});
