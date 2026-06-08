import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { omi, type ChatMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Chat — replaces MainWindow/Pages/ChatPage.swift. Uses the Omi cloud chat
// endpoints (/v2/messages) directly; no local LLM proxy.
export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    omi.listMessages().then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      const reply = await omi.sendMessage(text);
      setMessages((m) => [...m, reply]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
              m.sender === "human"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Omi…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <Button size="icon" onClick={send} disabled={sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
