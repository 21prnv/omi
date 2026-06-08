import { useEffect, useState } from "react";
import { omi, type Memory } from "@/lib/api";

// Memories list — replaces MainWindow/Pages/MemoriesPage.swift. Data from
// /v3/memories on the Omi cloud.
export function MemoriesPage() {
  const [items, setItems] = useState<Memory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    omi
      .listMemories()
      .then(setItems)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="p-4 text-sm text-muted-foreground">Loading memories…</div>;
  if (error) return <div className="p-4 text-sm text-red-400">{error}</div>;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-4">
      {items.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm">{m.content}</p>
          <span className="mt-1 inline-block rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {m.category}
          </span>
        </div>
      ))}
    </div>
  );
}
