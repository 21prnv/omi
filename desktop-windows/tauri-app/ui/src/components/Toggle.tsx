import { cn } from "@/lib/utils";

// macOS-style pill toggle. Off = dark track, knob left; on = purple track, knob right.
export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      className={cn(
        "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
        on ? "bg-omi-purple" : "bg-omi-bg4"
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all",
          on ? "left-[19px]" : "left-[3px]"
        )}
      />
    </button>
  );
}
