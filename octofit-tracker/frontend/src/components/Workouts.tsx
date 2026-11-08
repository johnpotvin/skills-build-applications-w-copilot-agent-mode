import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint="/api/workouts/suggestions/mona@example.com"
      collectionKey="suggestions"
      emptyMessage="No workout suggestions found."
      renderItem={(workout) => (
        <>
          <span>{String((workout as { title?: string }).title ?? 'Workout')}</span>
          <span className="ms-2">{String((workout as { focus?: string }).focus ?? 'general')}</span>
        </>
      )}
    />
  );
}
