import { useEffect, useState } from "react";
import { omi, type Conversation } from "@/lib/api";

// Conversations list — replaces MainWindow/Pages (conversation list). Data comes
// straight from the Omi cloud (/v1/conversations).
export function ConversationsPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    omi
      .listConversations()
      .then((c) => setItems(c.filter((x) => !x.discarded)))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Centered>Loading conversations…</Centered>;
  if (error) return <Centered>{error}</Centered>;
  if (!items.length) return <Centered>No conversations yet. Hit Record to start.</Centered>;

  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-4">
      {items.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{c.structured.emoji ?? "💬"}</span>
            <h3 className="font-medium">{c.structured.title || "Untitled"}</h3>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {c.structured.overview}
          </p>
          <time className="mt-2 block text-xs text-muted-foreground">
            {new Date(c.created_at).toLocaleString()}
          </time>
        </div>
      ))}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
