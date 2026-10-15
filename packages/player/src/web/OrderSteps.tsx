import { useEffect } from 'react';
import type { StepOf } from '@buditel/schema';
import { scramble } from '../logic';
import { SortableList } from './Sortable';
import { Prompt, type StepProps } from './shared';

function useReportInitial(onAnswer: (order: string[]) => void, order: string[]) {
  // An unchanged order is a valid answer, so report it right away.
  useEffect(() => {
    onAnswer(order);
  }, []);
}

function sortedIds(items: { id: string; order: number }[]) {
  return [...items].sort((a, b) => a.order - b.order).map((i) => i.id);
}

export function Ordering({ step, locked, labels, onAnswer }: StepProps<StepOf<'ordering'>>) {
  const initial = scramble(
    step.items.map((i) => i.id),
    sortedIds(step.items),
    step.id,
  );
  const report = (order: string[]) => onAnswer({ type: 'ordering', order });
  useReportInitial(report, initial);
  return (
    <div className="flex flex-col gap-4">
      <Prompt>{step.prompt}</Prompt>
      <SortableList
        id={step.id}
        items={step.items.map((i) => ({ id: i.id, label: i.text ?? i.id }))}
        initialOrder={initial}
        locked={locked}
        labels={labels}
        onChange={report}
      />
    </div>
  );
}

export function Timeline({ step, locked, labels, onAnswer }: StepProps<StepOf<'timeline'>>) {
  const initial = scramble(
    step.events.map((e) => e.id),
    sortedIds(step.events),
    step.id,
  );
  const report = (order: string[]) => onAnswer({ type: 'timeline', order });
  useReportInitial(report, initial);
  return (
    <div className="flex flex-col gap-4">
      {step.prompt && <Prompt>{step.prompt}</Prompt>}
      <SortableList
        id={step.id}
        items={step.events.map((e) => ({ id: e.id, label: e.label }))}
        initialOrder={initial}
        locked={locked}
        labels={labels}
        onChange={report}
      />
    </div>
  );
}
