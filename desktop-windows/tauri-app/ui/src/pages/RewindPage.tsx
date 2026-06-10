import { useState } from "react";
import { Search, ChevronsUpDown, Settings, History } from "lucide-react";

export function RewindPage() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-omi-text">Rewind</span>
          <kbd className="rounded-[6px] bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-omi-text3">
            ⌘⌥R
          </kbd>
        </div>
        <div className="flex w-[360px] items-center gap-2.5 rounded-[10px] bg-white/[0.05] px-3 py-2">
          <Search className="h-4 w-4 text-omi-text3" />
          <input
            placeholder="Search your screen history..."
            className="flex-1 bg-transparent text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
          />
        </div>
        <button className="flex items-center gap-2 rounded-[10px] bg-white/[0.05] px-3 py-2 text-[13px] text-omi-text2">
          9 Jun 2026 <ChevronsUpDown className="h-3.5 w-3.5 text-omi-text3" />
        </button>
        <div className="flex-1" />
        <Settings className="h-[18px] w-[18px] text-omi-text3" />
        {/* Recording toggle (on = red) */}
        <button
          onClick={() => setOn((v) => !v)}
          className={`relative h-[22px] w-[38px] rounded-full transition-colors ${on ? "bg-omi-error" : "bg-omi-bg4"}`}
        >
          <span
            className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[19px]" : "left-[3px]"}`}
          />
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-omi-purple/15">
          <History className="h-7 w-7 text-omi-purple" />
        </div>
        <h2 className="text-[20px] font-bold text-omi-text">No Screenshots Yet</h2>
        <p className="max-w-sm text-[13px] leading-relaxed text-omi-text3">
          Screenshots will appear here as you use your PC. Rewind captures your screen every second.
        </p>
        <div className="mt-2 rounded-control bg-white/[0.05] px-4 py-2 text-[13px] text-omi-text3">
          💡 Tip: Use search to find anything you've seen on screen
        </div>
      </div>
    </div>
  );
}
