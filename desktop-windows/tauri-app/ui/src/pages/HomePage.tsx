import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Circle, Plus, Paperclip, ThumbsUp, ThumbsDown, Copy, ChevronUp, User } from "lucide-react";
import {
  omi,
  streamMessage,
  type ChatMessage,
  type ActionItem,
  type Goal,
} from "@/lib/api";

export function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    omi.listMessages().then(setMessages).catch(() => {});
    omi.listActionItems(false).then((r) => setTasks(r.action_items)).catch(() => {});
    omi.listGoals().then((g) => setGoals(g.filter((x) => x.is_active))).catch(() => {});
  }, []);
  // Only auto-scroll when the user is already near the bottom (don't yank them
  // down while they're reading older messages).
  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, atBottom]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { id: `local-${m.length}`, text, sender: "human", created_at: new Date().toISOString() }]);
    setStreaming("");
    try {
      await streamMessage(
        text,
        (delta) => setStreaming((s) => (s ?? "") + delta),
        (final) => {
          setMessages((m) => [...m, final]);
          setStreaming(null);
        }
      );
    } catch (e) {
      setStreaming(null);
      setMessages((m) => [...m, { id: `err-${m.length}`, text: `⚠️ ${e}`, sender: "ai", created_at: "" }]);
    } finally {
      setSending(false);
    }
  }

  async function toggleTask(t: ActionItem) {
    setTasks((ts) => ts.filter((x) => x.id !== t.id)); // optimistic: drop from "to do"
    try {
      await omi.toggleActionItem(t.id, !t.completed);
    } catch {
      setTasks((ts) => [t, ...ts]); // revert
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
        {/* Widgets */}
        <div className="grid grid-cols-2 gap-5 px-[30px] pt-8">
          {/* Tasks */}
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-5">
            <h3 className="mb-3 text-[16px] font-bold text-omi-text">Tasks</h3>
            <div className="flex flex-col gap-2">
              {tasks.length === 0 ? (
                <p className="px-1 py-2 text-[13px] text-omi-text3">No tasks yet.</p>
              ) : (
                tasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTask(t)}
                    className="flex items-start gap-3 rounded-[12px] bg-white/[0.04] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <Circle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-omi-text3" strokeWidth={1.6} />
                    <span className="text-[13px] leading-snug text-omi-text">{t.description}</span>
                  </button>
                ))
              )}
            </div>
            {tasks.length > 0 && (
              <div className="pt-3 text-center">
                <button className="text-[13px] font-medium text-omi-text2 hover:text-omi-text">
                  View all tasks ›
                </button>
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-omi-text">Goals</h3>
              <Plus className="h-4 w-4 text-omi-text3" />
            </div>
            {goals.length === 0 ? (
              <p className="text-[13px] text-omi-text3">No active goals.</p>
            ) : (
              <div className="rounded-[12px] bg-white/[0.04] px-3.5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔥</span>
                  <span className="flex-1 truncate text-[13px] font-medium text-omi-text">{goals[0].title}</span>
                  <span className="text-[12px] text-omi-text3">
                    {Math.round(goals[0].current_value)}/{Math.round(goals[0].target_value)}
                  </span>
                </div>
                <div className="relative mt-3 h-1 rounded-full bg-white/10">
                  <div
                    className="absolute left-0 top-0 h-1 rounded-full bg-omi-purple"
                    style={{ width: `${pct(goals[0])}%` }}
                  />
                  <div
                    className="absolute -top-[5px] h-[14px] w-[14px] rounded-full bg-white shadow"
                    style={{ left: `calc(${pct(goals[0])}% - 7px)` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center py-2">
          <ChevronUp className="h-4 w-4 text-omi-text3" />
        </div>

        {/* Chat */}
        <div className="mx-auto max-w-[880px] px-[30px] pb-4">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center gap-3 pt-12 text-center">
              <img src="/brand/omi-mark.png" alt="omi" className="h-12 w-12" />
              <h2 className="text-[18px] font-semibold text-omi-text">Ask omi anything</h2>
            </div>
          )}
          <div className="flex flex-col gap-6">
            {messages.map((m, i) => (
              <Bubble key={m.id ?? i} message={m} />
            ))}
            {streaming !== null && (
              <Bubble message={{ id: "streaming", text: streaming || "…", sender: "ai", created_at: "" }} streaming />
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {!atBottom && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-[84px] left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-omi-bubble text-white shadow-omi-panel"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Input */}
      <div className="px-[30px] pb-5 pt-2">
        <div className="mx-auto flex max-w-[880px] items-center gap-2.5 rounded-[26px] border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
          <Paperclip className="h-[18px] w-[18px] shrink-0 text-omi-text3" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask omi anything"
            className="flex-1 bg-transparent py-1 text-[14px] text-omi-text caret-omi-bubble outline-none placeholder:text-omi-text3"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className={
              input.trim() && !sending
                ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-omi-bubble text-white"
                : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-omi-text3"
            }
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function pct(g: Goal): number {
  if (g.goal_type === "boolean") return g.current_value >= 1 ? 100 : 0;
  const range = g.target_value || 1;
  return Math.min(100, Math.max(0, (g.current_value / range) * 100));
}

function time(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Bubble({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const isUser = message.sender === "human";
  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-start gap-2">
          <div className="rounded-[18px] bg-omi-bubble px-3.5 py-2 text-[14px] text-white">{message.text}</div>
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-omi-bg3">
            <User className="h-3.5 w-3.5 text-omi-text3" />
          </div>
        </div>
        <span className="mr-9 text-[11px] text-omi-text3">{time(message.created_at)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <img src="/brand/omi-mark.png" alt="omi" className="mt-1 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full whitespace-pre-wrap rounded-[18px] bg-omi-bg3/80 px-4 py-3 text-[14px] leading-relaxed text-omi-text2">
          {message.text}
          {streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-omi-text3 align-middle" />}
        </div>
        {!streaming && (
          <div className="mt-2 flex items-center gap-3 text-omi-text3">
            <ThumbsUp className="h-3.5 w-3.5" />
            <ThumbsDown className="h-3.5 w-3.5" />
            <Copy className="h-3.5 w-3.5" />
            <span className="text-[11px]">{time(message.created_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
