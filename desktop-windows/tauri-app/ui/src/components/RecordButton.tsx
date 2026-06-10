import { Mic, Square } from "lucide-react";
import { useRecordingStore } from "@/store/useRecordingStore";

// Pill record toggle (matches the "Start Recording" affordance in Conversations).
export function RecordButton() {
  const { recording, start, stop, error } = useRecordingStore();
  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[11px] text-omi-error">{error}</span>}
      <button
        onClick={() => (recording ? stop() : start())}
        className={
          recording
            ? "flex items-center gap-2 rounded-control bg-omi-error px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-omi-error/90"
            : "flex items-center gap-2 rounded-control bg-omi-purple px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-omi-purple/90"
        }
      >
        {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        {recording ? "Stop" : "Start Recording"}
      </button>
    </div>
  );
}
