import type { Step } from '@buditel/schema';
import { CauseEffect } from './CauseEffect';
import { MultipleChoice, TrueFalse } from './ChoiceSteps';
import { FillIn } from './FillIn';
import { Matching } from './Matching';
import { Ordering, Timeline } from './OrderSteps';
import type { StepProps } from './shared';

type Common = Omit<StepProps<Step>, 'step'>;

/** Renders one step. Unknown step types render nothing rather than crashing. */
export function StepView({ step, ...common }: { step: Step } & Common) {
  switch (step.type) {
    case 'story':
      return <p className="text-lg leading-relaxed whitespace-pre-line">{step.text}</p>;
    case 'multiple_choice':
      return <MultipleChoice step={step} {...common} />;
    case 'true_false':
      return <TrueFalse step={step} {...common} />;
    case 'matching':
      return <Matching step={step} {...common} />;
    case 'ordering':
      return <Ordering step={step} {...common} />;
    case 'fill_in':
      return <FillIn step={step} {...common} />;
    case 'timeline':
      return <Timeline step={step} {...common} />;
    case 'cause_effect':
      return <CauseEffect step={step} {...common} />;
    default:
      return null;
  }
}
