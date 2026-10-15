import type { ReactNode } from 'react';
import type { Step } from '@buditel/schema';
import type { Answer } from '../logic';
import type { PlayerLabels } from './labels';

export type StepProps<T extends Step> = {
  step: T;
  locked: boolean;
  labels: PlayerLabels;
  /** Reports the current answer, or null while the answer is incomplete. */
  onAnswer: (answer: Answer | null) => void;
};

export const optionClass = (selected: boolean) =>
  `flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${
    selected ? 'border-amber-600 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-400'
  } has-[:disabled]:cursor-default has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber-600`;

export const smallButton =
  'rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm hover:border-stone-500 disabled:opacity-40';

export function Prompt({ children }: { children: ReactNode }) {
  return <p className="text-xl font-semibold">{children}</p>;
}
