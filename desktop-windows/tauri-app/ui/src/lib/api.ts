// Omi cloud API client.
//
// Thin client over the EXISTING Omi backend (api.omi.me) — no local server. Every
// call carries the Firebase ID token. Endpoints below are the real production
// routes (verified against backend/routers/*):
//   GET  /v1/conversations              list conversations
//   GET  /v3/memories                   list memories
//   GET  /v2/messages                   chat history
//   POST /v2/messages                   send a chat message
import { invoke } from "@tauri-apps/api/core";
// Rust-proxied fetch — the Omi backend sends no CORS headers, so a webview fetch
// would be blocked. tauri-plugin-http makes the request from Rust (no CORS).
import { fetch } from "@tauri-apps/plugin-http";
import { getIdToken } from "./firebase";

let cachedBase: string | null = null;

/** Backend base URL — from the Rust side (defaults to https://api.omi.me). */
async function baseUrl(): Promise<string> {
  if (!cachedBase) {
    cachedBase = await invoke<string>("get_api_base_url");
  }
  return cachedBase;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${await baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Omi API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ── Domain types (minimal — matches what the UI renders) ────────────────────
export interface Conversation {
  id: string;
  created_at: string;
  structured: { title: string; overview: string; emoji?: string; category?: string };
  discarded?: boolean;
}

export interface Memory {
  id: string;
  content: string;
  category: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "human" | "ai";
  created_at: string;
}

// ── API surface ─────────────────────────────────────────────────────────────
export const omi = {
  listConversations: (limit = 50, offset = 0) =>
    request<Conversation[]>(`/v1/conversations?limit=${limit}&offset=${offset}`),

  listMemories: (limit = 100, offset = 0) =>
    request<Memory[]>(`/v3/memories?limit=${limit}&offset=${offset}`),

  listMessages: () => request<ChatMessage[]>(`/v2/messages`),

  sendMessage: (text: string) =>
    request<ChatMessage>(`/v2/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};
