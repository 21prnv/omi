import { useEffect, useState } from "react";
import { ChevronLeft, Star, Trash2, Circle, CheckCircle2, MessagesSquare } from "lucide-react";
import { omi, type Conversation, type ConvActionItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ConversationDetail({ id, onBack, onDeleted }: { id: string; onBack: () => void; onDeleted: () => void }) {
  const [conv, setConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [items, setItems] = useState<ConvActionItem[]>([]);

  useEffect(() => {
    setLoading(true);
    omi
      .getConversation(id)
      .then((c) => {
        setConv(c);
        setStarred(!!c.starred);
        setItems((c.structured.action_items ?? []).filter((a) => !a.deleted));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleStar() {
    const next = !starred;
    setStarred(next);
    try {
      await omi.setConversationStarred(id, next);
    } catch {
      setStarred(!next);
    }
  }

  async function del() {
    try {
      await omi.deleteConversation(id);
      onDeleted();
    } catch (e) {
      setError(String(e));
    }
  }

  if (loading) return <Centered>Loading…</Centered>;
  if (error || !conv) return <Centered>{error ?? "Not found"}</Centered>;

  const s = conv.structured;
  const start = conv.started_at || conv.created_at;
  const segments = conv.transcript_segments ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 pb-3 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-[14px] text-omi-text2 hover:text-omi-text">
          <ChevronLeft className="h-4 w-4" /> Conversations
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleStar} className="rounded-[8px] p-2 text-omi-text3 hover:bg-white/[0.06] hover:text-omi-text">
            <Star className={cn("h-4 w-4", starred && "fill-omi-warning text-omi-warning")} />
          </button>
          <button onClick={del} className="rounded-[8px] p-2 text-omi-text3 hover:bg-white/[0.06] hover:text-omi-error">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mx-auto max-w-[760px]">
          {/* Title */}
          <div className="flex items-start gap-3">
            <span className="text-3xl">{s.emoji || "💬"}</span>
            <div className="flex-1">
              <h1 className="text-[22px] font-bold leading-tight text-omi-text">{s.title || "Untitled"}</h1>
              <div className="mt-1 text-[12px] text-omi-text3">
                {new Date(start).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {conv.status && conv.status !== "completed" && (
                  <span className="ml-2 rounded-[6px] bg-omi-warning/15 px-2 py-0.5 text-omi-warning">{conv.status}</span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {conv.source && <Chip>{conv.source}</Chip>}
            {s.category && s.category !== "other" && <Chip>{s.category}</Chip>}
          </div>

          {/* Overview */}
          {s.overview && (
            <div className="mt-5">
              <h2 className="mb-2 text-[13px] font-semibold text-omi-text3">Overview</h2>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-omi-text2">{s.overview}</p>
            </div>
          )}

          {/* Action Items */}
          {items.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-[13px] font-semibold text-omi-text3">Action Items ({items.length})</h2>
              <div className="flex flex-col gap-1">
                {items.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, completed: !x.completed } : x)))}
                    className="flex items-start gap-2.5 rounded-control px-2 py-2 text-left hover:bg-white/[0.03]"
                  >
                    {a.completed ? (
                      <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-omi-purple" />
                    ) : (
                      <Circle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-omi-text3" />
                    )}
                    <span className={cn("text-[14px] text-omi-text", a.completed && "text-omi-text3 line-through")}>
                      {a.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="mt-6">
            <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-omi-text3">
              <MessagesSquare className="h-3.5 w-3.5" /> Transcript ({segments.length})
            </h2>
            {segments.length === 0 ? (
              <p className="text-[13px] text-omi-text3">No transcript available.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {segments.map((seg, i) => (
                  <div key={seg.id ?? i}>
                    <div className="mb-0.5 text-[12px] font-medium text-omi-text3">
                      {seg.is_user ? "You" : seg.speaker ?? "Speaker"}
                      <span className="ml-2 text-omi-text4">{fmtTime(seg.start)}</span>
                    </div>
                    <p className="text-[14px] leading-relaxed text-omi-text2">{seg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[8px] bg-white/[0.06] px-2.5 py-1 text-[12px] capitalize text-omi-text2">{children}</span>
  );
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-[13px] text-omi-text3">{children}</div>;
}
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
