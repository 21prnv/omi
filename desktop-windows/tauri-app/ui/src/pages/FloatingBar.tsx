import { Mic, Square } from "lucide-react";
import { useRecordingStore } from "@/store/useRecordingStore";

// The transparent always-on-top floating bar (Tauri window "floating_bar",
// route "/floating"). Replaces FloatingControlBar/*. Toggled by Ctrl+Shift+Space.
export function FloatingBar() {
  const { recording, start, stop } = useRecordingStore();
  return (
    <div
      data-tauri-drag-region
      className="flex h-screen w-screen items-center gap-3 rounded-2xl bg-card/90 px-4 backdrop-blur-md"
    >
      <button
        onClick={() => (recording ? stop() : start())}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      <span className="text-sm text-foreground">
        {recording ? "Listening…" : "Omi is idle"}
      </span>
    </div>
  );
}
