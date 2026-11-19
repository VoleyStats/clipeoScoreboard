import type { ScoringRule } from '../types';
import { Field, Row, Stepper, Toggle } from './ui';

export function describeRule(r: ScoringRule): string {
  const plays = r.ralliesRequired === 1 ? '1 jugada' : `${r.ralliesRequired} jugadas${r.consecutive ? ' seguidas' : ''}`;
  const pts = `+${r.pointsAwarded} ${r.pointsAwarded === 1 ? 'punto' : 'puntos'}`;
  const serve = (r.serveAfter ?? 1) > 1 ? ` · saque tras ${r.serveAfter}${r.serveConsecutive ? ' seguidas' : ''}` : '';
  return `${plays} → ${pts}${serve}${r.once ? ' · una vez' : ''}`;
}

interface Props {
  rule: ScoringRule;
  onChange: (patch: Partial<ScoringRule>) => void;
  /** El modo por defecto no tiene la opción "solo una vez" */
  isDefault?: boolean;
}

/** Campos editables de un modo de puntuación. */
export function RuleEditor({ rule, onChange, isDefault }: Props) {
  return (
    <>
      <Row label="Nombre">
        <Field value={rule.name} onChange={(name) => onChange({ name })} />
      </Row>
      <Row label="Jugadas a ganar">
        <Stepper value={rule.ralliesRequired} onChange={(v) => onChange({ ralliesRequired: v })} max={20} />
      </Row>
      <Row label="Puntos que suma">
        <Stepper value={rule.pointsAwarded} onChange={(v) => onChange({ pointsAwarded: v })} max={20} />
      </Row>
      {rule.ralliesRequired > 1 && (
        <Toggle
          label="Seguidas"
          hint="Si el rival gana una jugada, se pierde el progreso"
          value={rule.consecutive}
          onChange={(consecutive) => onChange({ consecutive })}
        />
      )}
      <Row label="Jugadas para recuperar el saque" hint="Las que tiene que ganar quien recibe para pasar a sacar">
        <Stepper value={rule.serveAfter ?? 1} onChange={(v) => onChange({ serveAfter: v })} max={9} />
      </Row>
      {(rule.serveAfter ?? 1) > 1 && (
        <Toggle
          label="Seguidas para el saque"
          hint="Si el equipo que saca gana una jugada, el rival pierde lo acumulado"
          value={!!rule.serveConsecutive}
          onChange={(serveConsecutive) => onChange({ serveConsecutive })}
        />
      )}
      {!isDefault && (
        <Toggle
          label="Solo una vez"
          hint="Tras sumar, vuelve al modo por defecto"
          value={rule.once}
          onChange={(once) => onChange({ once })}
        />
      )}
    </>
  );
}
