import { useCallback, useEffect, useState } from "react";
import { Search, Star, Calendar, StickyNote, Mic, Square, MessagesSquare, Plus, Inbox } from "lucide-react";
import { omi, type Conversation, type Folder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConversationDetail } from "@/components/ConversationDetail";
import { useRecordingStore } from "@/store/useRecordingStore";
import { useTranscriptStore } from "@/store/useTranscriptStore";

type Tab = { key: string; label: string; kind: "all" | "starred" | "folder" };

export function ConversationsPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { recording, start, stop } = useRecordingStore();
  const conversationsVersion = useTranscriptStore((s) => s.conversationsVersion);

  const tabs: Tab[] = [
    { key: "all", label: "All", kind: "all" },
    { key: "starred", label: "Starred", kind: "starred" },
    ...folders.map((f) => ({ key: f.id, label: f.name, kind: "folder" as const })),
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (query.trim()) {
        const r = await omi.searchConversations(query.trim());
        setItems(r.items.filter((c) => !c.discarded));
      } else {
        const opts = tab === "starred" ? { starred: true } : tab === "all" ? {} : { folderId: tab };
        const c = await omi.listConversations(opts);
        setItems(c.filter((x) => !x.discarded));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    omi.listFolders().then(setFolders).catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0); // debounce search
    return () => clearTimeout(t);
  }, [load, query, conversationsVersion]); // reload when a conversation is created

  if (selectedId) {
    return (
      <ConversationDetail
        id={selectedId}
        onBack={() => setSelectedId(null)}
        onDeleted={() => {
          setSelectedId(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pb-4 pt-5">
        <h1 className="text-[22px] font-bold">Conversations</h1>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 rounded-control bg-white/[0.06] px-3.5 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.1]">
            <StickyNote className="h-4 w-4" /> Quick Note
          </button>
          <button
            onClick={() => (recording ? stop() : start())}
            className={cn(
              "flex items-center gap-2 rounded-control px-4 py-2 text-[13px] font-medium transition-colors",
              recording
                ? "bg-omi-error text-white hover:bg-omi-error/90"
                : "bg-white text-black hover:bg-white/90"
            )}
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {recording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Search row */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 rounded-control bg-white/[0.04] px-3.5 py-3">
            <Search className="h-4 w-4 text-omi-text3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
            />
          </div>
          <button
            onClick={() => setTab("starred")}
            className="flex items-center gap-2 rounded-control bg-white/[0.04] px-3.5 py-3 text-[13px] text-omi-text2 hover:bg-white/[0.08]"
          >
            <Star className="h-3.5 w-3.5" /> Starred
          </button>
          <button className="flex items-center gap-2 rounded-control bg-white/[0.04] px-3.5 py-3 text-[13px] text-omi-text2 hover:bg-white/[0.08]">
            <Calendar className="h-3.5 w-3.5" /> Date
          </button>
        </div>

        {/* Folder tabs */}
        <div className="mt-3.5 flex items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setQuery("");
                setTab(t.key);
              }}
              className={cn(
                "flex items-center gap-2 rounded-chip px-3 py-1.5 text-[13px] transition-colors",
                tab === t.key ? "bg-white/[0.08] font-medium text-omi-text" : "text-omi-text3 hover:text-omi-text"
              )}
            >
              {t.kind === "all" && <Inbox className="h-3.5 w-3.5" />}
              {t.kind === "starred" && <Star className="h-3.5 w-3.5" />}
              {t.label}
            </button>
          ))}
          <button className="rounded-chip px-2 py-1.5 text-omi-text3 hover:text-omi-text">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {recording && <LivePanel />}

        {/* List / empty */}
        {!loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-40 text-center">
            <MessagesSquare className="h-12 w-12 text-omi-text3" strokeWidth={1.5} />
            <h3 className="text-[16px] font-bold text-omi-text">No Conversations</h3>
            <p className="text-[13px] text-omi-text3">
              {query ? "No results found" : "Start recording to capture your first conversation"}
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-1.5">
            {items.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="group flex items-start gap-3 rounded-section p-3.5 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] text-lg">
                  {c.structured.emoji || "💬"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-omi-text">
                      {c.structured.title || "Untitled"}
                    </span>
                    {c.starred && <Star className="h-3 w-3 shrink-0 fill-omi-warning text-omi-warning" />}
                  </div>
                  {c.structured.overview && (
                    <div className="mt-0.5 line-clamp-1 text-[13px] text-omi-text3">{c.structured.overview}</div>
                  )}
                  <div className="mt-1 text-[12px] text-omi-text3">
                    {new Date(c.started_at || c.created_at).toLocaleString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LivePanel() {
  const { segments, saving } = useTranscriptStore();
  return (
    <div className="mt-4 rounded-section border border-omi-bubble/30 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-[12px] text-omi-text3">
        {saving ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-omi-warning" /> Saving conversation…
          </>
        ) : (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-omi-error" /> Listening…
          </>
        )}
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {segments.length === 0 ? (
          <p className="text-[13px] text-omi-text3">Waiting for speech…</p>
        ) : (
          segments.map((s, i) => (
            <p key={s.id ?? i} className="text-[13px] text-omi-text2">
              <span className="mr-2 font-medium text-omi-text3">{s.is_user ? "You" : s.speaker ?? "Speaker"}</span>
              {s.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
