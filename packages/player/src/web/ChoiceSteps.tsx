import { useState } from 'react';
import type { StepOf } from '@buditel/schema';
import { Prompt, type StepProps, optionClass } from './shared';

function Choices<V extends string>({
  name,
  options,
  value,
  locked,
  onChange,
}: {
  name: string;
  options: { value: V; label: string }[];
  value: V | null;
  locked: boolean;
  onChange: (value: V) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-3">
      {options.map((option) => (
        <label key={option.value} className={optionClass(value === option.value)}>
          <input
            type="radio"
            name={name}
            className="size-4 accent-amber-600"
            checked={value === option.value}
            disabled={locked}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function MultipleChoice({ step, locked, onAnswer }: StepProps<StepOf<'multiple_choice'>>) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <Prompt>{step.prompt}</Prompt>
      <Choices
        name={step.id}
        locked={locked}
        value={value}
        options={step.options.map((o) => ({ value: o.id, label: o.text }))}
        onChange={(optionId) => {
          setValue(optionId);
          onAnswer({ type: 'multiple_choice', optionId });
        }}
      />
    </div>
  );
}

export function TrueFalse({ step, locked, labels, onAnswer }: StepProps<StepOf<'true_false'>>) {
  const [value, setValue] = useState<'true' | 'false' | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <Prompt>{step.prompt}</Prompt>
      <Choices
        name={step.id}
        locked={locked}
        value={value}
        options={[
          { value: 'true', label: labels.trueOption },
          { value: 'false', label: labels.falseOption },
        ]}
        onChange={(next) => {
          setValue(next);
          onAnswer({ type: 'true_false', value: next === 'true' });
        }}
      />
    </div>
  );
}
