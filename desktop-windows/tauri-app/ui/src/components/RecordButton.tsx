import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecordingStore } from "@/store/useRecordingStore";

// Top-bar record toggle — drives the native WASAPI capture via Tauri.
export function RecordButton() {
  const { recording, start, stop, error } = useRecordingStore();
  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <Button
        variant={recording ? "destructive" : "default"}
        size="sm"
        onClick={() => (recording ? stop() : start())}
      >
        {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        {recording ? "Stop" : "Record"}
      </Button>
    </div>
  );
}
