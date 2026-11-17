import { Platform, StyleSheet, Text, View } from 'react-native';
import { DEFAULT_CONFIG, newRuleId } from '../logic';
import type { Config, ScoringRule, Team, TeamId } from '../types';
import { F } from '../theme';
import { Popup } from './Popup';
import { RuleEditor, describeRule } from './RuleEditor';
import { Btn, C, ColorPicker, Field, Row, Section, Stepper, Toggle } from './ui';

interface Props {
  visible: boolean;
  config: Config;
  onChange: (c: Config) => void;
  onClose: () => void;
}

export function SettingsModal({ visible, config, onChange, onClose }: Props) {
  const set = <K extends keyof Config>(k: K, v: Config[K]) => onChange({ ...config, [k]: v });
  const setTeam = (id: TeamId, patch: Partial<Team>) =>
    set('teams', { ...config.teams, [id]: { ...config.teams[id], ...patch } });
  const setRule = (id: string, patch: Partial<ScoringRule>) =>
    set('rules', config.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRule = () =>
    set('rules', [
      ...config.rules,
      { id: newRuleId(), name: 'Nuevo modo', ralliesRequired: 1, pointsAwarded: 2, consecutive: false, once: true },
    ]);
  const removeRule = (id: string) => set('rules', config.rules.filter((r) => r.id !== id));

  return (
    <Popup
      visible={visible}
      title="Ajustes"
      onClose={onClose}
      footer={<Btn label="Listo" kind="primary" onPress={onClose} />}
    >
      {(['a', 'b'] as TeamId[]).map((id) => (
        <Section key={id} title={id === 'a' ? 'Equipo 1' : 'Equipo 2'}>
          <Row label="Nombre">
            <Field value={config.teams[id].name} onChange={(name) => setTeam(id, { name })} />
          </Row>
          <ColorPicker label="Fondo" value={config.teams[id].bg} onChange={(bg) => setTeam(id, { bg })} />
          <ColorPicker label="Texto" value={config.teams[id].fg} onChange={(fg) => setTeam(id, { fg })} />
        </Section>
      ))}

      <Section title="Modos de puntuación">
        <Text style={styles.help}>
          Cada modo define cuántas jugadas hay que ganar y cuántos puntos suma. El primero es el modo por defecto.
        </Text>
        {config.rules.map((r, i) => (
          <View key={r.id} style={styles.rule}>
            <Row label={i === 0 ? 'Por defecto' : `Modo ${i + 1}`} hint={describeRule(r)}>
              {i > 0 && <Btn small label="✕" kind="danger" onPress={() => removeRule(r.id)} />}
            </Row>
            <RuleEditor rule={r} isDefault={i === 0} onChange={(p) => setRule(r.id, p)} />
          </View>
        ))}
        <View style={{ paddingVertical: 10 }}>
          <Btn label="+ Nuevo modo" onPress={addRule} />
        </View>
      </Section>

      <Section title="Sets">
        <Toggle label="Mostrar sets" value={config.showSets} onChange={(v) => set('showSets', v)} />
        <Toggle
          label="Reiniciar puntos al sumar set"
          value={config.resetPointsOnSet}
          onChange={(v) => set('resetPointsOnSet', v)}
        />
        <Toggle
          label="Fin de set automático"
          hint="Suma el set al llegar a los puntos objetivo"
          value={config.autoSets}
          onChange={(v) => set('autoSets', v)}
        />
        {config.autoSets && (
          <>
            <Row label="Puntos por set">
              <Stepper value={config.pointsPerSet} onChange={(v) => set('pointsPerSet', v)} />
            </Row>
            <Row label="Puntos set decisivo">
              <Stepper value={config.decidingSetPoints} onChange={(v) => set('decidingSetPoints', v)} />
            </Row>
            <Toggle label="Ganar por 2" value={config.winByTwo} onChange={(v) => set('winByTwo', v)} />
          </>
        )}
        <Row label="Sets para ganar">
          <Stepper value={config.setsToWin} onChange={(v) => set('setsToWin', v)} max={9} />
        </Row>
      </Section>

      <Section title="Pantalla">
        <Toggle label="Mostrar nombres" value={config.showNames} onChange={(v) => set('showNames', v)} />
        {Platform.OS !== 'web' && (
          <Toggle label="Vibración" value={config.haptics} onChange={(v) => set('haptics', v)} />
        )}
      </Section>

      <Section title="Gestos">
        <Text style={styles.help}>
          Toca un marcador para sumar · Desliza hacia abajo para restar.{'\n'}
          Lo mismo sobre el círculo de sets.
        </Text>
      </Section>

      <Btn label="Restaurar ajustes por defecto" kind="danger" onPress={() => onChange(DEFAULT_CONFIG)} />
    </Popup>
  );
}

const styles = StyleSheet.create({
  help: { color: C.muted, fontFamily: F.regular, fontSize: 13, lineHeight: 19, paddingVertical: 10 },
  rule: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 6 },
});
