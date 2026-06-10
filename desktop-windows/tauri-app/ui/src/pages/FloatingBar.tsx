import { Mic, Square } from "lucide-react";
import { useRecordingStore } from "@/store/useRecordingStore";

// Transparent always-on-top floating bar (route "/floating"), toggled by the
// global hotkey. Styled to match the Omi dark look.
export function FloatingBar() {
  const { recording, start, stop } = useRecordingStore();
  return (
    <div
      data-tauri-drag-region
      className="flex h-screen w-screen items-center gap-3 rounded-[22px] border border-omi-border/40 bg-omi-bg2/90 px-4 backdrop-blur-md"
    >
      <button
        onClick={() => (recording ? stop() : start())}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-omi-purple text-white"
      >
        {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      <span className="text-[13px] text-omi-text2">{recording ? "Listening…" : "omi is idle"}</span>
    </div>
  );
}
