import { getTranslations } from 'next-intl/server';
import { LessonPath } from '../../components/LessonPath';
import { getCourse, getCurrentUser } from '../../lib/session';

export default async function HomePage() {
  const t = await getTranslations('Home');
  const current = await getCurrentUser();
  if (!current) return null;
  const course = await getCourse();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t('greeting', { name: current.user.name })}</h1>
        <p className="text-stone-600">{t('progress', current.progress)}</p>
      </section>
      {course.length === 0 ? (
        <p className="text-stone-600">{t('empty')}</p>
      ) : (
        <LessonPath course={course} />
      )}
    </div>
  );
}
