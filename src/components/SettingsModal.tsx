import { Platform, StyleSheet, Text, View } from 'react-native';
import { DEFAULT_CONFIG, GESTURES, gestureRules, newRuleId, resolveAction } from '../logic';
import type { Config, Gesture, GestureAction, ScoringRule, Team, TeamId } from '../types';
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

const GESTURE_LABELS: Record<Gesture, { label: string; hint: string }> = {
  tap: { label: 'Tocar', hint: 'Un toque corto' },
  longPress: { label: 'Mantener pulsado', hint: 'Medio segundo sin mover el dedo' },
  swipeDown: { label: 'Deslizar hacia abajo', hint: 'Arrastrar el dedo hacia abajo' },
  swipeUp: { label: 'Deslizar hacia arriba', hint: 'Arrastrar el dedo hacia arriba' },
};

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
      </Section>

      <Section title="Final de set">
        <Toggle
          label="Final de set automático"
          hint={config.autoSets ? 'El set se suma solo al llegar a los puntos' : 'Desactivado: los sets se suman a mano'}
          value={config.autoSets}
          onChange={(v) => set('autoSets', v)}
        />
        {config.autoSets && (
          <>
            <NumberPicker
              label="Puntos para ganar el set"
              value={config.pointsPerSet}
              onChange={(v) => set('pointsPerSet', v)}
              presets={[15, 21, 25]}
            />
            <Toggle
              label="Ganar por 2 de diferencia"
              hint={config.winByTwo ? `Con ${config.pointsPerSet - 1} iguales se sigue jugando` : 'Gana quien llegue primero'}
              value={config.winByTwo}
              onChange={(v) => set('winByTwo', v)}
            />
          </>
        )}
      </Section>

      <Section title="Final de partido">
        <Toggle
          label="Final de partido"
          hint={config.matchEnd ? 'Marca el ganador al llegar a los sets' : 'Desactivado: sin límite de sets'}
          value={config.matchEnd}
          onChange={(v) => set('matchEnd', v)}
        />
        {config.matchEnd && (
          <>
            <NumberPicker
              label="Sets para ganar"
              hint={`Al mejor de ${config.setsToWin * 2 - 1} ${config.setsToWin === 1 ? 'set' : 'sets'}`}
              value={config.setsToWin}
              onChange={(v) => set('setsToWin', v)}
              presets={[1, 2, 3]}
              max={9}
            />
            {config.autoSets && config.setsToWin > 1 && (
              <NumberPicker
                label="Puntos del set decisivo"
                hint={`El ${config.setsToWin * 2 - 1}º set`}
                value={config.decidingSetPoints}
                onChange={(v) => set('decidingSetPoints', v)}
                presets={[15, 21, 25]}
              />
            )}
          </>
        )}
      </Section>

      <Section title="Pantalla">
        <Toggle label="Mostrar nombres" value={config.showNames} onChange={(v) => set('showNames', v)} />
        {Platform.OS !== 'web' && (
          <Toggle label="Vibración" value={config.haptics} onChange={(v) => set('haptics', v)} />
        )}
      </Section>

      <Section title="Gestos">
        <Text style={styles.help}>
          Elige qué hace cada gesto sobre el marcador de un equipo. Los modos de 1 jugada se aplican una sola vez
          sin cambiar el modo activo. El círculo de sets siempre suma al tocar y resta al deslizar hacia abajo.
        </Text>
        {GESTURES.map((g) => {
          const resolved = resolveAction(config, config.gestures[g]);
          const current: GestureAction = resolved.kind === 'rule' ? `rule:${resolved.rule.id}` : resolved.kind;
          const options: { value: GestureAction; label: string }[] = [
            { value: 'point', label: 'Sumar' },
            ...gestureRules(config).map((r) => ({ value: `rule:${r.id}` as GestureAction, label: `${r.name} · +${r.pointsAwarded}` })),
            { value: 'minus', label: 'Restar 1' },
            { value: 'undo', label: 'Deshacer' },
            { value: 'none', label: 'Nada' },
          ];
          return (
            <View key={g} style={styles.gesture}>
              <Select
                label={GESTURE_LABELS[g].label}
                hint={GESTURE_LABELS[g].hint}
                value={current}
                options={options}
                onChange={(v) => set('gestures', { ...config.gestures, [g]: v })}
              />
            </View>
          );
        })}
        {!GESTURES.some((g) => ['minus', 'undo'].includes(resolveAction(config, config.gestures[g]).kind)) && (
          <Text style={styles.warn}>Ningún gesto resta puntos. Puedes deshacer desde el menú •••.</Text>
        )}
        {resolveAction(config, config.gestures.tap).kind === 'none' && (
          <Text style={styles.warn}>Tocar no hace nada: el marcador solo responderá a los otros gestos.</Text>
        )}
      </Section>

      <Btn label="Restaurar ajustes por defecto" kind="danger" onPress={() => onChange(DEFAULT_CONFIG)} />
    </Popup>
  );
}

const styles = StyleSheet.create({
  help: { color: C.muted, fontFamily: F.regular, fontSize: 13, lineHeight: 19, paddingVertical: 10 },
  gesture: { borderTopWidth: 1, borderTopColor: C.line },
  warn: { color: C.volt, fontFamily: F.medium, fontSize: 13, lineHeight: 19, paddingBottom: 12 },
  rule: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 6 },
});
