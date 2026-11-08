import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  endpoint: string;
  collectionKey: 'activities' | 'teams' | 'leaderboard' | 'suggestions';
  emptyMessage: string;
  renderItem: (item: Record<string, unknown>, index: number) => ReactNode;
};

export function CapabilityCard({ title, description, endpoint, collectionKey, emptyMessage, renderItem }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        const data = await response.json();
        const nextItems = Array.isArray(data?.[collectionKey]) ? data[collectionKey] : [];
        if (!ignore) {
          setItems(nextItems);
        }
      } catch (_error) {
        if (!ignore) {
          setError(`Unable to load ${title.toLowerCase()}.`);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [collectionKey, endpoint, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>

        {loading ? (
          <p role="status">Loading...</p>
        ) : error ? (
          <div role="alert">{error}</div>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {items.map((item, index) => (
              <li key={String((item as Record<string, unknown>)._id ?? index)}>{renderItem(item, index)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
