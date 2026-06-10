import { create } from "zustand";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// A live transcript segment as emitted by the Rust cloud stream (mirrors the
// backend TranscriptSegment model).
export interface Segment {
  id?: string;
  text: string;
  speaker?: string;
  speaker_id?: number;
  is_user: boolean;
  start: number;
  end: number;
}

interface TranscriptState {
  segments: Segment[];
  status: string;
  /** True while the backend is finalizing a conversation (memory_processing_started). */
  saving: boolean;
  /** Bumped whenever a conversation is created — pages listen to refresh lists. */
  conversationsVersion: number;
  init: () => Promise<UnlistenFn>;
  clear: () => void;
  bumpConversations: () => void;
}

// Merge incoming segments by id, replacing in place (the backend re-sends a
// segment as it's refined) and appending new ones, keeping chronological order.
function merge(existing: Segment[], incoming: Segment[]): Segment[] {
  const byId = new Map(existing.map((s) => [s.id ?? `${s.start}`, s]));
  for (const seg of incoming) byId.set(seg.id ?? `${seg.start}`, seg);
  return [...byId.values()].sort((a, b) => a.start - b.start);
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  segments: [],
  status: "idle",
  saving: false,
  conversationsVersion: 0,
  init: async () => {
    const unTranscript = await listen<Segment[]>("omi://transcript", (e) => {
      set({ segments: merge(get().segments, e.payload) });
    });
    const unStatus = await listen<unknown>("omi://stream-status", (e) => {
      set({ status: typeof e.payload === "string" ? e.payload : "connected" });
    });
    // Conversation lifecycle (mirrors macOS handleListenEvent memory_* cases).
    const unConv = await listen<{ type?: string }>("omi://conversation", (e) => {
      const t = e.payload?.type;
      if (t === "memory_processing_started") {
        set({ saving: true });
      } else if (t === "memory_created" || t === "new_conversation_created") {
        set((s) => ({ saving: false, segments: [], conversationsVersion: s.conversationsVersion + 1 }));
      }
    });
    return () => {
      unTranscript();
      unStatus();
      unConv();
    };
  },
  clear: () => set({ segments: [], saving: false }),
  bumpConversations: () => set((s) => ({ conversationsVersion: s.conversationsVersion + 1 })),
}));
