// Omi cloud API client — thin client over the EXISTING Omi backend (api.omi.me).
// All requests carry the Firebase ID token and go through tauri-plugin-http
// (Rust-proxied) because the backend sends no CORS headers.
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { getIdToken } from "./firebase";

let cachedBase: string | null = null;
async function baseUrl(): Promise<string> {
  if (!cachedBase) cachedBase = await invoke<string>("get_api_base_url");
  return cachedBase;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${await baseUrl()}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Omi API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function requestVoid(path: string, init: RequestInit = {}): Promise<void> {
  const res = await fetch(`${await baseUrl()}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Omi API ${res.status}: ${await res.text()}`);
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface TranscriptSegment {
  id?: string;
  text: string;
  speaker?: string;
  is_user: boolean;
  start: number;
  end: number;
}
export interface ConvActionItem {
  description: string;
  completed: boolean;
  deleted?: boolean;
}
export interface Conversation {
  id: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  structured: {
    title: string;
    overview: string;
    emoji?: string;
    category?: string;
    action_items?: ConvActionItem[];
    events?: unknown[];
  };
  transcript_segments?: TranscriptSegment[];
  apps_results?: { app_id: string; content: string }[];
  source?: string;
  status?: string;
  discarded?: boolean;
  starred?: boolean;
  folder_id?: string | null;
}
export interface Folder {
  id: string;
  name: string;
  color?: string;
  conversation_count?: number;
}
export interface App {
  id: string;
  name: string;
  description: string;
  image: string;
  category?: string;
  author?: string;
  capabilities?: string[];
  installs?: number;
  rating_avg?: number | null;
  rating_count?: number;
  is_paid?: boolean;
  price?: number | null;
  enabled?: boolean;
  external_integration?: {
    app_home_url?: string | null;
    auth_steps?: { name: string; url: string }[];
    setup_completed_url?: string | null;
  } | null;
}
export interface AppGroup {
  capability: { id: string; title: string };
  data: App[];
}
export interface AppCategory {
  id: string;
  title: string;
}
export interface Memory {
  id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at?: string;
  visibility?: "public" | "private";
  manually_added?: boolean;
  conversation_id?: string | null;
  source?: string | null;
  confidence?: number | null;
  tags?: string[];
  reasoning?: string | null;
  context_summary?: string | null;
  source_app?: string | null;
}
export interface GraphNode {
  id: string;
  label: string;
  node_type: string;
  memory_ids?: string[];
}
export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  label?: string;
}
export interface ChatMessage {
  id: string;
  text: string;
  sender: "human" | "ai";
  created_at: string;
}
export interface ActionItem {
  id: string;
  description: string;
  completed: boolean;
  created_at: string;
  due_at?: string | null;
  priority?: "high" | "medium" | "low" | null;
  category?: string | null;
}
export interface Goal {
  id: string;
  title: string;
  goal_type: "boolean" | "scale" | "numeric";
  target_value: number;
  current_value: number;
  is_active: boolean;
}

// ── Conversations / Memories ────────────────────────────────────────────────
export const omi = {
  listConversations: (opts: { starred?: boolean; folderId?: string; limit?: number } = {}) => {
    const { starred, folderId, limit = 50 } = opts;
    let q = `/v1/conversations?limit=${limit}&offset=0&include_discarded=false`;
    if (starred) q += `&starred=true`;
    if (folderId) q += `&folder_id=${folderId}`;
    return request<Conversation[]>(q);
  },
  getConversation: (id: string) => request<Conversation>(`/v1/conversations/${id}`),
  searchConversations: (query: string) =>
    request<{ items: Conversation[] }>(`/v1/conversations/search`, {
      method: "POST",
      body: JSON.stringify({ query, page: 1, per_page: 50, include_discarded: false }),
    }),
  setConversationStarred: (id: string, starred: boolean) =>
    requestVoid(`/v1/conversations/${id}/starred?starred=${starred}`, { method: "PATCH" }),
  deleteConversation: (id: string) => requestVoid(`/v1/conversations/${id}`, { method: "DELETE" }),
  listFolders: () => request<Folder[]>(`/v1/folders`),

  listMemories: (limit = 500) => request<Memory[]>(`/v3/memories?limit=${limit}&offset=0`),
  addMemory: (content: string) =>
    request<Memory>(`/v3/memories`, {
      method: "POST",
      body: JSON.stringify({ content, category: "manual", visibility: "private", tags: [] }),
    }),
  updateMemory: (id: string, content: string) =>
    requestVoid(`/v3/memories/${id}`, { method: "PATCH", body: JSON.stringify({ value: content }) }),
  deleteMemory: (id: string) => requestVoid(`/v3/memories/${id}`, { method: "DELETE" }),
  setMemoryVisibility: (id: string, value: "public" | "private") =>
    requestVoid(`/v3/memories/${id}/visibility`, { method: "PATCH", body: JSON.stringify({ value }) }),
  getKnowledgeGraph: () => request<{ nodes: GraphNode[]; edges: GraphEdge[] }>(`/v1/knowledge-graph`),
  rebuildKnowledgeGraph: () =>
    requestVoid(`/v1/knowledge-graph/rebuild`, { method: "POST" }),

  // Apps marketplace
  getApps: () => request<{ groups: AppGroup[] }>(`/v2/apps`),
  searchApps: (opts: { q?: string; category?: string; installed?: boolean }) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.category) p.set("category", opts.category);
    if (opts.installed) p.set("installed_apps", "true");
    p.set("limit", "100");
    return request<{ data: App[] }>(`/v2/apps/search?${p.toString()}`);
  },
  getAppCategories: () => request<AppCategory[]>(`/v1/app-categories`),
  getApp: (id: string) => request<App>(`/v1/apps/${id}`),
  enableApp: (id: string) => requestVoid(`/v1/apps/enable?app_id=${id}`, { method: "POST" }),
  disableApp: (id: string) => requestVoid(`/v1/apps/disable?app_id=${id}`, { method: "POST" }),

  listMessages: () => request<ChatMessage[]>(`/v2/messages`),

  // Tasks (action items) — matches macOS Today's Tasks widget.
  listActionItems: (completed?: boolean, limit = 100) =>
    request<{ action_items: ActionItem[]; has_more: boolean }>(
      `/v1/action-items?limit=${limit}&offset=0${completed !== undefined ? `&completed=${completed}` : ""}`
    ),
  toggleActionItem: (id: string, completed: boolean) =>
    request<ActionItem>(`/v1/action-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),
  createActionItem: (description: string, due_at?: string | null) =>
    request<ActionItem>(`/v1/action-items`, {
      method: "POST",
      body: JSON.stringify({ description, due_at: due_at ?? null, source: "manual", priority: "medium" }),
    }),
  updateActionItem: (id: string, patch: Partial<Pick<ActionItem, "description" | "due_at" | "completed">>) =>
    request<ActionItem>(`/v1/action-items/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteActionItem: (id: string) => requestVoid(`/v1/action-items/${id}`, { method: "DELETE" }),

  // Goals — matches macOS Goals widget.
  listGoals: () => request<Goal[]>(`/v1/goals/all`),
  createGoal: (title: string) => {
    const num = title.match(/[\d,.]+/);
    const target = num ? parseFloat(num[0].replace(/,/g, "")) : 1;
    return request<Goal>(`/v1/goals`, {
      method: "POST",
      body: JSON.stringify({
        title,
        goal_type: num ? "numeric" : "boolean",
        target_value: target,
        current_value: 0,
        source: "onboarding",
      }),
    });
  },
};

// ── Chat streaming ──────────────────────────────────────────────────────────
// POST /v2/messages returns text/event-stream: plain text chunks (newlines as
// __CRLF__, \n\n-delimited) for live typing, then `done: <base64 JSON>` with the
// final persisted AI message. Mirrors the macOS desktop chat contract.
export async function streamMessage(
  text: string,
  onChunk: (delta: string) => void,
  onDone: (final: ChatMessage) => void
): Promise<void> {
  const res = await fetch(`${await baseUrl()}/v2/messages`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`chat ${res.status}: ${await res.text()}`);

  const handle = (raw: string) => {
    if (!raw) return;
    // Final, authoritative message.
    if (raw.startsWith("done:")) {
      try {
        const json = JSON.parse(decodeBase64(raw.slice(5).trim()));
        onDone({ id: json.id, text: json.text, sender: "ai", created_at: json.created_at });
      } catch (e) {
        console.error("parse done chunk", e);
      }
      return;
    }
    // Agent tool-use / reasoning — not shown to the user.
    if (raw.startsWith("think:")) return;
    // Answer tokens are SSE-prefixed with "data: " by the agentic chat backend.
    const text = raw.startsWith("data: ") ? raw.slice(6) : raw.startsWith("data:") ? raw.slice(5) : raw;
    onChunk(text.replace(/__CRLF__/g, "\n"));
  };

  const body = res.body as ReadableStream<Uint8Array> | null;
  if (body && typeof body.getReader === "function") {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf("\n\n")) !== -1) {
        handle(buf.slice(0, i));
        buf = buf.slice(i + 2);
      }
    }
    if (buf) handle(buf);
  } else {
    // Buffered fallback (plugin didn't expose a stream): parse the whole body.
    for (const evt of (await res.text()).split("\n\n")) handle(evt);
  }
}

function decodeBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes); // handle UTF-8 in the payload
}
