import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      collectionKey="leaderboard"
      emptyMessage="No leaderboard found."
      renderItem={(entry) => (
        <>
          <span>{String((entry as { teamName?: string }).teamName ?? 'Team')}</span>
          <span className="ms-2">{String((entry as { totalPoints?: number }).totalPoints ?? 0)} pts</span>
        </>
      )}
    />
  );
}
