import { t } from '../i18n';
import type { ScoringRule } from '../types';
import { Field, Row, Stepper, Toggle } from './ui';

export function describeRule(r: ScoringRule): string {
  return t.describeRule(r.ralliesRequired, r.pointsAwarded, r.consecutive, r.once);
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
      <Row label={t.name}>
        <Field value={rule.name} onChange={(name) => onChange({ name })} />
      </Row>
      <Row label={t.ralliesToWin}>
        <Stepper value={rule.ralliesRequired} onChange={(v) => onChange({ ralliesRequired: v })} max={20} />
      </Row>
      <Row label={t.pointsAwarded}>
        <Stepper value={rule.pointsAwarded} onChange={(v) => onChange({ pointsAwarded: v })} max={20} />
      </Row>
      {rule.ralliesRequired > 1 && (
        <Toggle
          label={t.consecutive}
          hint={t.consecutiveHint}
          value={rule.consecutive}
          onChange={(consecutive) => onChange({ consecutive })}
        />
      )}
      {!isDefault && (
        <Toggle
          label={t.once}
          hint={t.onceHint}
          value={rule.once}
          onChange={(once) => onChange({ once })}
        />
      )}
    </>
  );
}
