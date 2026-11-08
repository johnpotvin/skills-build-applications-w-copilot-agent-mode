import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      collectionKey="activities"
      emptyMessage="No activities found."
      renderItem={(activity) => (
        <>
          <span>{String((activity as { type?: string }).type ?? 'Activity')}</span>
          <span className="ms-2">{String((activity as { minutes?: number }).minutes ?? 0)} min</span>
        </>
      )}
    />
  );
}
