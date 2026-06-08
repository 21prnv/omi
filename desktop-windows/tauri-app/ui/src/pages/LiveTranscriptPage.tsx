import { useEffect, useRef } from "react";
import { useTranscriptStore } from "@/store/useTranscriptStore";
import { useRecordingStore } from "@/store/useRecordingStore";
import { cn } from "@/lib/utils";

// Live transcript — renders segments streamed back from the Omi cloud over the
// Tauri `omi://transcript` event while recording.
export function LiveTranscriptPage() {
  const { segments, status } = useTranscriptStore();
  const recording = useRecordingStore((s) => s.recording);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            recording ? "animate-pulse bg-red-500" : "bg-muted-foreground/40"
          )}
        />
        {recording ? `Listening · ${status}` : "Not recording"}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {segments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {recording ? "Waiting for speech…" : "Hit Record to start a live transcript."}
          </p>
        )}
        {segments.map((s, i) => (
          <div key={s.id ?? i} className="text-sm">
            <span className="mr-2 font-medium text-muted-foreground">
              {s.is_user ? "You" : s.speaker ?? "Speaker"}
            </span>
            <span>{s.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
