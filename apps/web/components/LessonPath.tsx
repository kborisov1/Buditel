import type { CourseUnit } from '@buditel/core';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const nodeStyle = {
  completed: 'border-emerald-600 bg-emerald-600 text-white',
  unlocked: 'border-amber-600 bg-white text-amber-700',
  locked: 'border-stone-300 bg-stone-100 text-stone-400',
} as const;

/** The home screen's vertical path of lessons, grouped by unit. */
export function LessonPath({ course }: { course: CourseUnit[] }) {
  const t = useTranslations('Home');
  const label = {
    completed: t('lessonDone'),
    unlocked: t('lessonNext'),
    locked: t('lessonLocked'),
  };

  return (
    <div className="flex flex-col gap-8">
      {course.map((unit) => (
        <section key={unit.id} aria-labelledby={`unit-${unit.id}`} className="flex flex-col gap-4">
          <h2 id={`unit-${unit.id}`} className="text-xl font-bold">
            {unit.title}
          </h2>
          <ol className="flex flex-col items-center gap-4">
            {unit.lessons.map((lesson, i) => {
              const body = (
                <>
                  <span
                    aria-hidden
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full border-2 font-bold ${nodeStyle[lesson.state]}`}
                  >
                    {lesson.state === 'completed' ? '✓' : i + 1}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium">{lesson.title}</span>
                    <span className="text-sm text-stone-600">{label[lesson.state]}</span>
                  </span>
                </>
              );
              const row =
                'flex w-full items-center gap-4 rounded-xl border border-stone-200 bg-white p-3';
              return (
                <li key={lesson.id} className="w-full">
                  {lesson.state === 'locked' ? (
                    <div className={`${row} opacity-60`}>{body}</div>
                  ) : (
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className={`${row} hover:border-stone-400`}
                    >
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
