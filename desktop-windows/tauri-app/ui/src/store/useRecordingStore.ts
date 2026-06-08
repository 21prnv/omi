import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { getIdToken } from "@/lib/firebase";
import { useTranscriptStore } from "./useTranscriptStore";

interface RecordingState {
  recording: boolean;
  captureSystemAudio: boolean;
  language: string;
  error: string | null;
  setCaptureSystemAudio: (v: boolean) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/** Recording store — drives the native capture + cloud stream (start_capture /
 *  stop_capture in Rust). Passes the Firebase ID token so Rust can authenticate
 *  the WebSocket to api.omi.me. Mirrors the Mac AudioCaptureService controls. */
export const useRecordingStore = create<RecordingState>((set, get) => ({
  recording: false,
  captureSystemAudio: true,
  language: "en",
  error: null,
  setCaptureSystemAudio: (v) => set({ captureSystemAudio: v }),
  start: async () => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not signed in");
      useTranscriptStore.getState().clear();
      await invoke("start_capture", {
        token,
        systemAudio: get().captureSystemAudio,
        language: get().language,
      });
      set({ recording: true, error: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },
  stop: async () => {
    try {
      await invoke("stop_capture");
      set({ recording: false });
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
