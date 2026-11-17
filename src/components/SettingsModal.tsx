import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_CONFIG, newRuleId } from '../logic';
import type { Config, ScoringRule, Team, TeamId } from '../types';
import { Btn, C, ColorPicker, Field, Row, Section, Stepper, Toggle } from './ui';

interface Props {
  visible: boolean;
  config: Config;
  onChange: (c: Config) => void;
  onClose: () => void;
  onSwap: () => void;
  onResetPoints: () => void;
  onResetMatch: () => void;
}

export function describeRule(r: ScoringRule): string {
  const plays = r.ralliesRequired === 1 ? '1 jugada' : `${r.ralliesRequired} jugadas${r.consecutive ? ' seguidas' : ''}`;
  const pts = `+${r.pointsAwarded} ${r.pointsAwarded === 1 ? 'punto' : 'puntos'}`;
  return `${plays} → ${pts}${r.once ? ' · una vez' : ''}`;
}

export function SettingsModal({ visible, config, onChange, onClose, onSwap, onResetPoints, onResetMatch }: Props) {
  const set = <K extends keyof Config>(k: K, v: Config[K]) => onChange({ ...config, [k]: v });
  const setTeam = (id: TeamId, patch: Partial<Team>) =>
    set('teams', { ...config.teams, [id]: { ...config.teams[id], ...patch } });
  const setRule = (id: string, patch: Partial<ScoringRule>) =>
    set('rules', config.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRule = () =>
    set('rules', [
      ...config.rules,
      { id: newRuleId(), name: 'Nueva jugada', ralliesRequired: 1, pointsAwarded: 2, consecutive: false, once: true },
    ]);
  const removeRule = (id: string) => set('rules', config.rules.filter((r) => r.id !== id));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" supportedOrientations={['portrait', 'landscape']}>
      <SafeAreaView style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Ajustes</Text>
          <Btn label="Listo" kind="primary" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section title="Partido">
            <View style={styles.actions}>
              <Btn label="⇄ Cambiar lados" onPress={onSwap} />
              <Btn label="Reiniciar puntos" onPress={onResetPoints} />
              <Btn label="Nuevo partido" kind="danger" onPress={onResetMatch} />
            </View>
          </Section>

          {(['a', 'b'] as TeamId[]).map((id) => (
            <Section key={id} title={id === 'a' ? 'Equipo 1' : 'Equipo 2'}>
              <Row label="Nombre">
                <Field value={config.teams[id].name} onChange={(name) => setTeam(id, { name })} />
              </Row>
              <ColorPicker label="Fondo" value={config.teams[id].bg} onChange={(bg) => setTeam(id, { bg })} />
              <ColorPicker label="Texto" value={config.teams[id].fg} onChange={(fg) => setTeam(id, { fg })} />
            </Section>
          ))}

          <Section title="Jugadas especiales">
            <Text style={styles.help}>
              Elige la jugada activa con el botón central del marcador. Cada jugada define cuántas jugadas hay que ganar y
              cuántos puntos suma. La primera es la jugada por defecto.
            </Text>
            {config.rules.map((r, i) => (
              <View key={r.id} style={styles.rule}>
                <Row label={i === 0 ? 'Por defecto' : `Jugada ${i + 1}`} hint={describeRule(r)}>
                  {i > 0 && <Btn small label="✕" kind="danger" onPress={() => removeRule(r.id)} />}
                </Row>
                <Row label="Nombre">
                  <Field value={r.name} onChange={(name) => setRule(r.id, { name })} />
                </Row>
                <Row label="Jugadas a ganar">
                  <Stepper value={r.ralliesRequired} onChange={(v) => setRule(r.id, { ralliesRequired: v })} max={20} />
                </Row>
                <Row label="Puntos que suma">
                  <Stepper value={r.pointsAwarded} onChange={(v) => setRule(r.id, { pointsAwarded: v })} max={20} />
                </Row>
                {r.ralliesRequired > 1 && (
                  <Toggle
                    label="Seguidas"
                    hint="Si el rival gana una jugada, se pierde el progreso"
                    value={r.consecutive}
                    onChange={(consecutive) => setRule(r.id, { consecutive })}
                  />
                )}
                {i > 0 && (
                  <Toggle
                    label="Solo una vez"
                    hint="Tras sumar, vuelve a la jugada por defecto"
                    value={r.once}
                    onChange={(once) => setRule(r.id, { once })}
                  />
                )}
              </View>
            ))}
            <View style={{ paddingVertical: 10 }}>
              <Btn label="+ Añadir jugada" onPress={addRule} />
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
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  title: { color: C.text, fontSize: 24, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 60, maxWidth: 640, width: '100%', alignSelf: 'center' },
  actions: { gap: 10, paddingVertical: 10 },
  help: { color: C.muted, fontSize: 13, lineHeight: 19, paddingVertical: 10 },
  rule: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 6 },
});
