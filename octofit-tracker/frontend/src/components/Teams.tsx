import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      collectionKey="teams"
      emptyMessage="No teams found."
      renderItem={(team) => (
        <>
          <span>{String((team as { name?: string }).name ?? 'Team')}</span>
          <span className="ms-2">({((team as { members?: unknown[] }).members ?? []).length} members)</span>
        </>
      )}
    />
  );
}
