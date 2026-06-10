import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Settings as Gear,
  Clock,
  AudioLines,
  Bell,
  Shield,
  UserCircle,
  CreditCard,
  Sparkles,
  Keyboard,
  SlidersHorizontal,
  Info,
  ScreenShare,
  Mic,
  RotateCcw,
  HardDrive,
  EyeOff,
  BatteryCharging,
  XCircle,
  Plus,
  RotateCw,
  ChevronsUpDown,
  Globe,
  BookText,
  Check,
  ClipboardList,
  Cloud,
  List,
  Hand,
  CheckCircle2,
  ChevronDown,
  Key,
  ArrowRight,
  Cpu,
  Folder,
  Hammer,
  Eye,
  Target,
  MessagesSquare,
  Power,
  MessageSquare,
  FlaskConical,
  LayoutGrid,
  Brain,
  Wrench,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/Toggle";
import { useAuthStore } from "@/store/useAuthStore";

const sections = [
  { key: "General", icon: Gear },
  { key: "Rewind", icon: Clock },
  { key: "Transcription", icon: AudioLines },
  { key: "Notifications", icon: Bell },
  { key: "Privacy", icon: Shield },
  { key: "Account", icon: UserCircle },
  { key: "Plan and Usage", icon: CreditCard },
  { key: "Floating Bar", icon: Sparkles },
  { key: "Shortcuts", icon: Keyboard },
  { key: "Advanced", icon: SlidersHorizontal },
  { key: "About", icon: Info },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("General");
  const [screen, setScreen] = useState(false);
  const [audio, setAudio] = useState(false);

  return (
    <div className="flex h-full">
      {/* Settings sidebar */}
      <div className="flex w-[250px] shrink-0 flex-col px-3 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-2 py-1.5 text-[14px] text-omi-text hover:text-omi-text2"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="px-2 pb-3 pt-2 text-[22px] font-bold">Settings</h1>
        <div className="mb-2 flex items-center gap-2 rounded-control border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-omi-text3" />
          <input
            placeholder="Search settings..."
            className="flex-1 bg-transparent text-[12px] text-omi-text outline-none placeholder:text-omi-text3"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          {sections.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                "flex items-center gap-3 rounded-chip px-3 py-2 text-[13px] transition-colors",
                active === key
                  ? "bg-white/[0.07] font-medium text-omi-text"
                  : "text-omi-text2 hover:bg-white/[0.04] hover:text-omi-text"
              )}
            >
              <Icon className="h-[18px] w-[18px] text-omi-text3" strokeWidth={1.8} /> {key}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <h2 className="mb-6 text-[26px] font-bold">{active}</h2>
        {active === "General" ? (
          <div className="flex flex-col gap-3">
            <Card icon={<ScreenShare className="h-5 w-5 text-omi-purple" />} title="Screen Capture" subtitle="Screen capture is paused">
              <Toggle on={screen} onChange={setScreen} />
            </Card>
            <Card icon={<Mic className="h-5 w-5 text-omi-purple" />} title="Audio Recording" subtitle="Audio recording is paused">
              <Toggle on={audio} onChange={setAudio} />
            </Card>
            <Card title="Notifications" subtitle="Notifications are disabled">
              <button className="rounded-control bg-omi-purple px-4 py-1.5 text-[13px] font-medium text-white hover:bg-omi-purple/90">
                Enable
              </button>
            </Card>

            {/* Font Size */}
            <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-omi-purple">Aa</span>
                <div>
                  <div className="text-[14px] font-bold text-omi-text">Font Size</div>
                  <div className="text-[12px] text-omi-text3">Scale: 100%</div>
                </div>
              </div>
              {/* Ruler slider */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[13px] text-omi-text3">A</span>
                <div className="relative h-6 flex-1">
                  <div
                    className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg,#3A3940 0 1px,transparent 1px 11px)",
                    }}
                  />
                  <div className="absolute left-1/2 top-1/2 h-5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-white" />
                </div>
                <span className="text-[20px] text-omi-text3">A</span>
              </div>
              <p className="mt-3 text-[14px] text-omi-text">The quick brown fox jumps over the lazy dog</p>
              <div className="mt-4 flex flex-col gap-2 text-[13px]">
                <ShortcutRow label="Increase font size" keys="⌘+" />
                <ShortcutRow label="Decrease font size" keys="⌘−" />
                <ShortcutRow label="Reset font size" keys="⌘0" />
              </div>
              <div className="mt-4 flex justify-end">
                <button className="flex items-center gap-2 rounded-control border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.08]">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Window Size
                </button>
              </div>
            </div>
          </div>
        ) : active === "Rewind" ? (
          <RewindSettings />
        ) : active === "Transcription" ? (
          <TranscriptionSettings />
        ) : active === "Notifications" ? (
          <NotificationsSettings />
        ) : active === "Privacy" ? (
          <PrivacySettings />
        ) : active === "Account" ? (
          <AccountSettings />
        ) : active === "Plan and Usage" ? (
          <PlanUsageSettings />
        ) : active === "Floating Bar" ? (
          <FloatingBarSettings />
        ) : active === "Shortcuts" ? (
          <ShortcutsSettings />
        ) : active === "Advanced" ? (
          <AdvancedSettings />
        ) : active === "About" ? (
          <AboutSettings />
        ) : (
          <p className="text-[13px] text-omi-text3">{active} settings.</p>
        )}
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
      <span className="h-2 w-2 shrink-0 rounded-full bg-white/20" />
      {icon}
      <div className="flex-1">
        <div className="text-[14px] font-bold text-omi-text">{title}</div>
        <div className="text-[12px] text-omi-text3">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-omi-text2">{label}</span>
      <kbd className="rounded-[5px] bg-white/[0.06] px-1.5 py-0.5 text-[12px] text-omi-text3">{keys}</kbd>
    </div>
  );
}

const EXCLUDED = [
  "1Password", "1Password 7", "Bitwarden", "Dashlane", "Enpass", "KeePassXC", "Keeper",
  "Keychain Access", "LastPass", "Omi Beta", "Omi Computer", "Omi Dev", "Passwords", "omi",
];
const RUNNING = [
  "Accessibility", "AirPlay Screen Mirroring", "AppSSODaemon", "Apple Account",
  "BackgroundTaskManagementAgent", "Brave Browser", "Brave Browser Helper",
];

function RewindSettings() {
  const [retention, setRetention] = useState("7 days");
  const [battery, setBattery] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      {/* Storage */}
      <div className="flex items-center gap-3.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
        <HardDrive className="h-5 w-5 text-omi-purple" />
        <div>
          <div className="text-[14px] font-bold text-omi-text">Storage</div>
          <div className="text-[12px] text-omi-text3">8 frames • Zero KB</div>
        </div>
      </div>

      {/* Excluded Apps */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-start gap-3.5">
          <EyeOff className="mt-0.5 h-5 w-5 text-omi-purple" />
          <div className="flex-1">
            <div className="text-[14px] font-bold text-omi-text">Excluded Apps</div>
            <div className="text-[12px] text-omi-text3">
              Screen capture is paused when these apps are active
            </div>
          </div>
          <button className="rounded-[8px] bg-white/[0.06] px-2.5 py-1 text-[12px] text-omi-text2 hover:bg-white/[0.1]">
            Reset to Defaults
          </button>
        </div>

        <div className="mt-4 flex flex-col">
          {EXCLUDED.map((app) => (
            <div key={app} className="group flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-white/[0.03]">
              <div className="h-6 w-6 shrink-0 rounded-[6px] bg-white/15" />
              <span className="flex-1 text-[14px] text-omi-text">{app}</span>
              <XCircle className="h-4 w-4 text-omi-text4 hover:text-omi-text3" />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="text-[13px] font-semibold text-omi-text">Add App to Exclusion List</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              placeholder="App name (e.g., Passwords)"
              className="flex-1 rounded-control border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
            />
            <button className="rounded-control bg-white/[0.06] px-4 py-2 text-[13px] text-omi-text3">Add</button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-omi-text">Currently Running Apps</div>
            <RotateCw className="h-3.5 w-3.5 text-omi-text3" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {RUNNING.map((app) => (
              <button
                key={app}
                className="flex items-center gap-1.5 rounded-control bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-omi-text2 hover:bg-white/[0.08]"
              >
                <span className="h-3.5 w-3.5 rounded-[4px] bg-white/20" />
                {app}
                <Plus className="h-3 w-3 text-omi-text3" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Battery Optimization */}
      <div className="flex items-center gap-3.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
        <BatteryCharging className="h-5 w-5 text-omi-purple" />
        <div className="flex-1">
          <div className="text-[14px] font-bold text-omi-text">Battery Optimization</div>
          <div className="text-[12px] text-omi-text3">
            Pause text recognition on battery to save energy. OCR runs automatically when plugged back in.
          </div>
        </div>
        <button
          onClick={() => setBattery((v) => !v)}
          className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${battery ? "bg-omi-purple" : "bg-omi-bg4"}`}
        >
          <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${battery ? "left-[19px]" : "left-[3px]"}`} />
        </button>
      </div>

      {/* Data Retention */}
      <div className="flex items-center gap-3.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
        <Clock className="h-5 w-5 text-omi-purple" />
        <div className="flex-1">
          <div className="text-[14px] font-bold text-omi-text">Data Retention</div>
          <div className="text-[12px] text-omi-text3">How long to keep screen recordings</div>
        </div>
        <div className="relative">
          <select
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
            className="appearance-none rounded-control bg-white/[0.06] py-1.5 pl-3 pr-7 text-[13px] text-omi-text outline-none"
          >
            {["1 day", "7 days", "30 days", "Forever"].map((o) => (
              <option key={o} className="bg-omi-bg2">{o}</option>
            ))}
          </select>
          <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-omi-text3" />
        </div>
      </div>
    </div>
  );
}

function TranscriptionSettings() {
  const [mode, setMode] = useState<"auto" | "single">("auto");
  const [vad, setVad] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {/* Language Mode */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <Globe className="h-[18px] w-[18px] text-omi-purple" />
          <span className="text-[14px] font-bold text-omi-text">Language Mode</span>
        </div>

        <button
          onClick={() => setMode("auto")}
          className={cn(
            "flex w-full items-start gap-3 rounded-[12px] border p-4 text-left transition-colors",
            mode === "auto" ? "border-omi-purple/40 bg-omi-purple/10" : "border-white/[0.06] hover:bg-white/[0.03]"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              mode === "auto" ? "bg-omi-purple" : "border border-omi-text3"
            )}
          >
            {mode === "auto" && <Check className="h-3 w-3 text-white" />}
          </span>
          <div>
            <div className="text-[14px] font-bold text-omi-text">Auto-Detect (Multi-Language)</div>
            <div className="text-[12px] text-omi-text3">Automatically detects and transcribes:</div>
            <div className="mt-0.5 text-[12px] text-omi-text3">
              English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, Dutch
            </div>
          </div>
        </button>

        <button
          onClick={() => setMode("single")}
          className={cn(
            "mt-2 flex w-full items-start gap-3 rounded-[12px] border p-4 text-left transition-colors",
            mode === "single" ? "border-omi-purple/40 bg-omi-purple/10" : "border-white/[0.06] hover:bg-white/[0.03]"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              mode === "single" ? "bg-omi-purple" : "border border-omi-text3"
            )}
          >
            {mode === "single" && <Check className="h-3 w-3 text-white" />}
          </span>
          <div>
            <div className="text-[14px] font-bold text-omi-text">Single Language (Better Accuracy)</div>
            <div className="text-[12px] text-omi-text3">Best for speaking in one specific language</div>
          </div>
        </button>

        <div className="mt-3 flex items-center gap-2 text-[12px] text-omi-text3">
          <Info className="h-3.5 w-3.5" />
          Single language mode supports 42 languages including Ukrainian, Russian, and more.
        </div>
      </div>

      {/* Custom Vocabulary */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <BookText className="mt-0.5 h-[18px] w-[18px] text-omi-purple" />
          <div>
            <div className="text-[14px] font-bold text-omi-text">Custom Vocabulary</div>
            <div className="text-[12px] text-omi-text3">Improve recognition of names, brands, and technical terms</div>
          </div>
        </div>
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-2">
            <input
              placeholder="Add a word..."
              className="flex-1 rounded-control border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
            />
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-omi-text3 hover:bg-white/[0.1]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[12px] text-omi-text3">
            Press Enter or click + to add • Click × to remove
          </p>
        </div>
      </div>

      {/* Local VAD Gate */}
      <div className="flex items-center gap-3.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
        <AudioLines className="h-5 w-5 text-omi-purple" />
        <div className="flex-1">
          <div className="text-[14px] font-bold text-omi-text">Local VAD Gate</div>
          <div className="text-[12px] text-omi-text3">
            Uses on-device voice activity detection to skip silence, reducing Deepgram API usage. May save ~40% on transcription costs.
          </div>
        </div>
        <Toggle on={vad} onChange={setVad} />
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  on,
  onChange,
}: {
  title: string;
  subtitle: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <div className="text-[14px] font-medium text-omi-text">{title}</div>
        <div className="text-[12px] text-omi-text3">{subtitle}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function NotificationsSettings() {
  const [master, setMaster] = useState(true);
  const [focus, setFocus] = useState(true);
  const [task, setTask] = useState(false);
  const [insight, setInsight] = useState(true);
  const [memory, setMemory] = useState(false);
  const [summary, setSummary] = useState(true);
  const [summaryTime, setSummaryTime] = useState("10:00 PM");

  return (
    <div className="flex flex-col gap-3">
      {/* Notifications */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2.5">
          <Bell className="h-[18px] w-[18px] text-omi-purple" />
          <span className="flex-1 text-[14px] font-bold text-omi-text">Notifications</span>
          <Toggle on={master} onChange={setMaster} />
        </div>
        <div className="mt-1.5 text-[12px] text-omi-text3">Control how often you receive notifications</div>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          {/* Frequency */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[14px] font-medium text-omi-text">Frequency</div>
              <div className="text-[12px] text-omi-text3">How often to receive notifications</div>
            </div>
            <span className="rounded-[6px] bg-omi-purple/15 px-2 py-0.5 text-[12px] font-medium text-omi-purple">
              Off
            </span>
          </div>
          <div className="relative mt-3 h-4">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
            {[0, 25, 50, 75, 100].map((p) => (
              <div
                key={p}
                className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/20"
                style={{ left: `calc(${p}% - 3px)` }}
              />
            ))}
            <div className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow" />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-omi-text3">
            <span>Off</span>
            <span>Maximum</span>
          </div>

          <div className="mt-3 flex flex-col divide-y divide-white/[0.04]">
            <ToggleRow title="Focus Notifications" subtitle="Show notification on focus changes" on={focus} onChange={setFocus} />
            <ToggleRow title="Task Notifications" subtitle="Show notification when a task is extracted" on={task} onChange={setTask} />
            <ToggleRow title="Insight Notifications" subtitle="Show notification when an insight is generated" on={insight} onChange={setInsight} />
            <ToggleRow title="Memory Notifications" subtitle="Show notification when a memory is extracted" on={memory} onChange={setMemory} />
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="h-[18px] w-[18px] text-omi-purple" />
          <span className="flex-1 text-[14px] font-bold text-omi-text">Daily Summary</span>
          <Toggle on={summary} onChange={setSummary} />
        </div>
        <div className="mt-1.5 text-[12px] text-omi-text3">
          Receive a daily summary of your conversations and activities
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div>
            <div className="text-[14px] font-medium text-omi-text">Summary Time</div>
            <div className="text-[12px] text-omi-text3">When to send your daily summary</div>
          </div>
          <div className="relative">
            <select
              value={summaryTime}
              onChange={(e) => setSummaryTime(e.target.value)}
              className="appearance-none rounded-control bg-white/[0.06] py-1.5 pl-3 pr-7 text-[13px] text-omi-text outline-none"
            >
              {["8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"].map((o) => (
                <option key={o} className="bg-omi-bg2">{o}</option>
              ))}
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-omi-text3" />
          </div>
        </div>
      </div>
    </div>
  );
}

const TRACKED = [
  "Onboarding steps completed", "Settings changes", "App installations and usage",
  "Device connection status", "Transcript processing events", "Conversation creation and updates",
  "Memory extraction events", "Chat interactions", "Speech profile creation",
  "Focus session events", "App open/close events",
];
const GUARANTEES = [
  "Anonymous tracking with randomly generated IDs",
  "No personal info stored in analytics",
  "Data is never sold or shared with third parties",
  "Opt out of tracking at any time",
];

function AboutSettings() {
  const [auto, setAuto] = useState(true);
  const [autoInstall, setAutoInstall] = useState(true);
  const [channel, setChannel] = useState("Stable");
  const links = [
    { label: "Visit Website", external: true },
    { label: "Help Center", external: true },
    { label: "Privacy Policy", external: false },
    { label: "Terms of Service", external: true },
  ];
  return (
    <div className="flex flex-col gap-3">
      {/* App info */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center gap-3.5 pb-1">
          <img src="/brand/omi-mark.png" alt="omi" className="h-9 w-9" />
          <div>
            <div className="text-[15px] font-bold text-omi-text">omi</div>
            <div className="text-[12px] text-omi-text3">Version 0.1.0 (1)</div>
          </div>
        </div>
        <div className="mt-2 flex flex-col border-t border-white/[0.06] pt-2">
          {links.map((l) => (
            <button
              key={l.label}
              className="flex items-center justify-between rounded-[8px] px-2 py-2.5 text-[14px] text-omi-text hover:bg-white/[0.03]"
            >
              {l.label}
              {l.external ? (
                <ArrowUpRight className="h-4 w-4 text-omi-text3" />
              ) : (
                <ArrowRight className="h-4 w-4 text-omi-text3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Software Updates */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-[18px] w-[18px] text-omi-purple" />
          <span className="flex-1 text-[14px] font-bold text-omi-text">Software Updates</span>
          <button className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">Check Now</button>
        </div>
        <div className="mt-1.5 text-[12px] text-omi-text3">Last checked: 11 min, 11 secs ago</div>

        <div className="mt-3 border-t border-white/[0.06] pt-2">
          <ToggleRow title="Automatic Updates" subtitle="Check for updates automatically in the background" on={auto} onChange={setAuto} />
          <ToggleRow title="Auto-Install Updates" subtitle="Automatically download and install updates when available" on={autoInstall} onChange={setAutoInstall} />
          <p className="py-2 text-[13px] text-omi-text3">
            Release builds always auto-check and auto-install updates in the background.
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
            <div>
              <div className="text-[14px] font-medium text-omi-text">Update Channel</div>
              <div className="text-[12px] text-omi-text3">Recommended for most users</div>
            </div>
            <Dropdown value={channel} options={["Stable", "Beta", "Nightly"]} onChange={setChannel} />
          </div>
        </div>
      </div>

      {/* Report an Issue */}
      <IconCard
        icon={<MessageSquare className="h-5 w-5 text-omi-purple" />}
        title="Report an Issue"
        subtitle="Help us improve omi"
        control={<button className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">Report</button>}
      />
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 mt-2 flex items-center gap-2.5">
      {icon}
      <span className="text-[16px] font-bold text-omi-text">{title}</span>
    </div>
  );
}

function IconCard({
  icon,
  title,
  subtitle,
  control,
  below,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  control?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="text-omi-text3">{icon}</span>
        <div className="flex-1">
          <div className="text-[14px] font-bold text-omi-text">{title}</div>
          {subtitle && <div className="text-[12px] text-omi-text3">{subtitle}</div>}
        </div>
        {control}
      </div>
      {below}
    </div>
  );
}

function KeyCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
      <div className="text-[14px] font-bold text-omi-text">{title}</div>
      <div className="text-[12px] text-omi-text3">{subtitle}</div>
      <input
        placeholder="Leave blank for default"
        className="mt-3 w-full rounded-control border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
      />
    </div>
  );
}

const SMALL = "h-[18px] w-[18px]";
const purpleIcon = "h-[18px] w-[18px] text-omi-purple";

function AdvancedSettings() {
  const [browserExt, setBrowserExt] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const [autoGoals, setAutoGoals] = useState(false);
  const [multiChat, setMultiChat] = useState(false);
  const [launch, setLaunch] = useState(true);
  const [provider, setProvider] = useState("Omi AI");

  return (
    <div className="flex flex-col gap-6">
      {/* AI Setup */}
      <div>
        <SectionHeader icon={<LayoutGrid className={purpleIcon} />} title="AI Setup" />
        <div className="flex flex-col gap-3">
          <IconCard
            icon={<Cpu className={SMALL} />}
            title="AI Provider"
            subtitle="Built-in AI assistant (built with pi.dev)"
            control={<Dropdown value={provider} options={["Omi AI", "OpenAI", "Anthropic", "Gemini"]} onChange={setProvider} />}
          />
          <IconCard
            icon={<Folder className={SMALL} />}
            title="Workspace"
            subtitle="No workspace set. Choose a project directory for desktop chat context."
            control={<button className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">Browse…</button>}
          />
          <IconCard
            icon={<Globe className={SMALL} />}
            title="Browser Extension"
            subtitle="Lets the AI use your Chrome browser with all your logged-in sessions."
            control={<Toggle on={browserExt} onChange={setBrowserExt} />}
            below={
              <button className="mt-3 flex items-center gap-2 rounded-[8px] bg-omi-purple px-3 py-1.5 text-[13px] font-medium text-white hover:bg-omi-purple/90">
                <Sparkles className="h-3.5 w-3.5" /> Set Up
              </button>
            }
          />
          <IconCard
            icon={<Hammer className={SMALL} />}
            title="Dev Mode"
            subtitle="Let the AI modify the app's source code, rebuild it, and add custom features."
            control={<Toggle on={devMode} onChange={setDevMode} />}
          />
        </div>
      </div>

      {/* Profile & Stats */}
      <div>
        <SectionHeader icon={<Brain className={purpleIcon} />} title="Profile & Stats" />
        <IconCard
          icon={<Eye className={SMALL} />}
          title="Profile and Stats"
          subtitle="Keep the generated profile and usage stats hidden until you need them."
          control={<button className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">Show</button>}
        />
      </div>

      {/* Reset Onboarding */}
      <div>
        <SectionHeader icon={<RotateCcw className={purpleIcon} />} title="Reset Onboarding" />
        <IconCard
          icon={<RotateCcw className={SMALL} />}
          title="Reset Onboarding"
          subtitle="Restart setup wizard for this app build only"
          control={<button className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">Reset</button>}
        />
      </div>

      {/* Goals */}
      <div>
        <SectionHeader icon={<Target className={purpleIcon} />} title="Goals" />
        <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2.5">
            <Target className={purpleIcon} />
            <span className="text-[14px] font-bold text-omi-text">Goals</span>
          </div>
          <div className="mt-1.5 text-[12px] text-omi-text3">
            Track personal goals with AI-powered progress detection from your conversations
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <div>
              <div className="text-[14px] font-medium text-omi-text">Auto-Generate Goals</div>
              <div className="text-[12px] text-omi-text3">Automatically suggest new goals daily based on your conversations and tasks</div>
            </div>
            <Toggle on={autoGoals} onChange={setAutoGoals} />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div>
        <SectionHeader icon={<SlidersHorizontal className={purpleIcon} />} title="Preferences" />
        <div className="flex flex-col gap-3">
          <IconCard icon={<MessagesSquare className={SMALL} />} title="Multiple Chat Sessions" subtitle="Single chat synced with mobile app" control={<Toggle on={multiChat} onChange={setMultiChat} />} />
          <IconCard icon={<Power className={SMALL} />} title="Launch at Login" subtitle="App will start when you log in" control={<Toggle on={launch} onChange={setLaunch} />} />
        </div>
      </div>

      {/* Troubleshooting */}
      <div>
        <SectionHeader icon={<Wrench className={purpleIcon} />} title="Troubleshooting" />
        <div className="flex flex-col gap-3">
          <IconCard icon={<MessageSquare className={SMALL} />} title="Report Issue" subtitle="Send app logs and report a problem" control={<button className="rounded-[8px] bg-omi-purple px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-omi-purple/90">Report</button>} />
          <IconCard icon={<Folder className={SMALL} />} title="Rescan Files" subtitle="Re-index your files and update your AI profile" control={<button className="rounded-[8px] bg-omi-purple px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-omi-purple/90">Rescan</button>} />
        </div>
      </div>

      {/* Developer API Keys */}
      <div>
        <SectionHeader icon={<Key className={purpleIcon} />} title="Developer API Keys" />
        <div className="flex flex-col gap-3">
          <IconCard
            icon={<Key className={SMALL} />}
            title="Use Omi free forever"
            subtitle="Provide all four keys (OpenAI, Anthropic, Gemini, Deepgram) to switch to the free plan. Keys stay on this PC — we never store them on our servers."
          />
          <KeyCard title="OpenAI API Key" subtitle="For GPT calls." />
          <KeyCard title="Anthropic API Key" subtitle="For chat (Claude)." />
          <KeyCard title="Gemini API Key" subtitle="For proactive AI (memory, tasks, insights, focus)." />
          <KeyCard title="Deepgram API Key" subtitle="For live transcription." />
        </div>
      </div>

      {/* Dev Tools */}
      <div>
        <SectionHeader icon={<Hammer className={purpleIcon} />} title="Dev Tools" />
        <IconCard
          icon={<FlaskConical className={SMALL} />}
          title="Chat Prompt Lab"
          subtitle="Iterate on chat system prompts with real questions, AI grading, and production ratings"
          control={<button className="rounded-[8px] bg-omi-purple px-4 py-1.5 text-[13px] font-medium text-white hover:bg-omi-purple/90">Open</button>}
        />
      </div>
    </div>
  );
}

function Segmented({ options, selected, onSelect }: { options: string[]; selected: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            "rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-colors",
            selected === i
              ? "border border-omi-purple bg-omi-purple/25 text-omi-text"
              : "bg-white/[0.04] text-omi-text2 hover:bg-white/[0.08]"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ShortcutsSettings() {
  const [ask, setAsk] = useState(0);
  const [ptt, setPtt] = useState(0);
  const [locked, setLocked] = useState(true);
  const [sounds, setSounds] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="text-[14px] font-bold text-omi-text">Ask omi Shortcut</div>
        <div className="mb-3 text-[12px] text-omi-text3">Global shortcut to open Ask omi from anywhere.</div>
        <Segmented
          options={["⌘ ↵", "⇧ ⌘ ↵", "⌘ J", "⌘ O", "Custom", "Disable"]}
          selected={ask}
          onSelect={setAsk}
        />
      </div>

      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="text-[14px] font-bold text-omi-text">Push to Talk</div>
        <div className="mb-3 text-[12px] text-omi-text3">Hold the key to speak, release to send your question to AI.</div>
        <Segmented
          options={["⌥", "Right ⌘", "fn", "^", "Custom", "Disable"]}
          selected={ptt}
          onSelect={setPtt}
        />
      </div>

      <RowCard title="Double-tap for Locked Mode" subtitle="Double-tap the push-to-talk key to keep listening hands-free. Tap again to send.">
        <Toggle on={locked} onChange={setLocked} />
      </RowCard>
      <RowCard title="Push-to-Talk Sounds" subtitle="Play audio feedback when starting and ending voice input.">
        <Toggle on={sounds} onChange={setSounds} />
      </RowCard>
    </div>
  );
}

// Plain card row: title + subtitle on the left, control on the right.
function RowCard({
  title,
  subtitle,
  dot,
  children,
}: {
  title: string;
  subtitle?: string;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
      {dot && <span className="h-2 w-2 shrink-0 rounded-full bg-white/20" />}
      <div className="flex-1">
        <div className="text-[14px] font-bold text-omi-text">{title}</div>
        {subtitle && <div className="text-[12px] text-omi-text3">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-control bg-white/[0.06] py-1.5 pl-3 pr-7 text-[13px] text-omi-text outline-none"
      >
        {options.map((o) => (
          <option key={o} className="bg-omi-bg2">{o}</option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-omi-text3" />
    </div>
  );
}

function FloatingBarSettings() {
  const [show, setShow] = useState(false);
  const [solid, setSolid] = useState(false);
  const [drag, setDrag] = useState(false);
  const [voiceQ, setVoiceQ] = useState(true);
  const [typedQ, setTypedQ] = useState(false);
  const [voice, setVoice] = useState("Shimmer");
  const [speed, setSpeed] = useState(80);

  return (
    <div className="flex flex-col gap-3">
      <RowCard title="Show floating bar" dot>
        <Toggle on={show} onChange={setShow} />
      </RowCard>

      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="mb-3 text-[15px] font-bold text-omi-text">Background Style</div>
        <div className="flex items-center gap-3">
          <span className={cn("text-[13px] font-bold", solid ? "text-omi-text3" : "text-omi-text")}>Transparent</span>
          <Toggle on={solid} onChange={setSolid} />
          <span className={cn("text-[13px]", solid ? "text-omi-text" : "text-omi-text3")}>Solid Dark</span>
        </div>
      </div>

      <RowCard title="Draggable Floating Bar" subtitle="Allow repositioning the floating bar by dragging it.">
        <Toggle on={drag} onChange={setDrag} />
      </RowCard>
      <RowCard title="Voice Questions" subtitle="Speak answers aloud when you ask with push to talk.">
        <Toggle on={voiceQ} onChange={setVoiceQ} />
      </RowCard>
      <RowCard title="Typed Questions" subtitle="Speak answers aloud when you submit a typed question from the floating bar.">
        <Toggle on={typedQ} onChange={setTypedQ} />
      </RowCard>
      <RowCard title="Voice" subtitle="OpenAI, warm human, cheap">
        <Dropdown value={voice} options={["Shimmer", "Alloy", "Echo", "Nova"]} onChange={setVoice} />
      </RowCard>

      {/* Faster (speed slider) */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[14px] font-bold text-omi-text">Faster</div>
            <div className="text-[12px] text-omi-text3">Voice playback speed</div>
          </div>
          <span className="rounded-[8px] bg-omi-purple/15 px-2.5 py-1.5 text-[15px] font-bold text-omi-purple">
            {(0.5 + (speed / 100) * 1.5).toFixed(1)}×
          </span>
        </div>
        <div className="relative mt-4 h-5">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
          <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-omi-purple" style={{ width: `${speed}%` }} />
          {[0, 25, 50, 75, 100].map((p) => (
            <div key={p} className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-omi-purple/60" style={{ left: `calc(${p}% - 3px)` }} />
          ))}
          <input
            type="range"
            min={0}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          />
          <div className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${speed}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-omi-text3">
          <span>Slow</span>
          <span>Max</span>
        </div>
      </div>
    </div>
  );
}

function PlanCheck({ children, color }: { children: string; color: "green" | "purple" }) {
  return (
    <li className="flex items-center gap-2.5 text-[13px] text-omi-text">
      <Check className={cn("h-4 w-4", color === "green" ? "text-omi-success" : "text-omi-purple")} />
      {children}
    </li>
  );
}

function PlanUsageSettings() {
  return (
    <div className="flex flex-col gap-3">
      {/* Premium Trial Active */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-omi-success/20">
            <Clock className="h-4 w-4 text-omi-success" />
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-bold text-omi-text">Premium Trial Active</div>
            <div className="text-[12px] text-omi-success">1d 17h remaining</div>
          </div>
          <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1f1f25" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="70 100" strokeLinecap="round" />
          </svg>
        </div>
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <div className="mb-2 text-[12px] font-semibold text-omi-text3">Included in your trial</div>
          <ul className="flex flex-col gap-1.5">
            {["Unlimited listening & transcription", "Unlimited memories & insights", "Chat questions"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[13px] font-medium text-omi-text">
                <Check className="h-4 w-4 text-omi-purple" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Free tier */}
      <div className="flex items-center gap-3.5 rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-4 py-4">
        <CreditCard className="h-5 w-5 text-omi-purple" />
        <div className="flex-1">
          <div className="text-[14px] font-bold text-omi-text">Free</div>
          <div className="text-[12px] text-omi-text3">You are currently on the free tier.</div>
        </div>
        <button className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">
          Refresh
        </button>
      </div>

      {/* Choose a plan */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="text-[15px] font-bold text-omi-text">Choose a plan</div>
        <div className="mb-4 text-[12px] text-omi-text3">
          Pick one plan first. Billing options appear only after the card is selected.
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Operator */}
          <div className="flex flex-col rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-omi-success">MOST POPULAR</div>
                <div className="mt-0.5 text-[18px] font-bold text-omi-text">Operator</div>
                <div className="text-[12px] text-omi-text3">500 questions per month</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-omi-text">$49.00/month</div>
                <div className="text-[11px] text-omi-text3">starting price</div>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-omi-text2">500 chat questions per month. Shared with mobile and web.</p>
            <ul className="mt-3 flex flex-col gap-2">
              <PlanCheck color="green">500 chat questions per month</PlanCheck>
              <PlanCheck color="green">Unlimited listening and transcription</PlanCheck>
              <PlanCheck color="green">Unlimited memories and insights</PlanCheck>
              <PlanCheck color="green">Available on Mac, mobile, and web</PlanCheck>
            </ul>
            <button className="mt-4 flex items-center justify-between rounded-control bg-omi-success px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-omi-success/90">
              Select Operator <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Architect */}
          <div className="flex flex-col rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-omi-purple">AUTOMATION + CODING</div>
                <div className="mt-0.5 text-[18px] font-bold text-omi-text">Architect</div>
                <div className="text-[12px] text-omi-text3">Power-user AI — thousands of chats + agentic automations</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-omi-text">$199.00/month</div>
                <div className="text-[11px] text-omi-text3">starting price</div>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-omi-text2">Power-user AI for heavy agentic workflows and vibe coding.</p>
            <ul className="mt-3 flex flex-col gap-2">
              <PlanCheck color="purple">Automations and vibe coding</PlanCheck>
              <PlanCheck color="purple">Unlimited listening, memories, and insights</PlanCheck>
              <PlanCheck color="purple">Priority desktop AI features</PlanCheck>
              <PlanCheck color="purple">~$400 of monthly AI compute included</PlanCheck>
            </ul>
            <button className="mt-4 flex items-center justify-between rounded-control bg-omi-purple px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-omi-purple/90">
              Select Architect <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Usage this month */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-omi-text">Usage this month</span>
          <span className="text-[13px] font-semibold text-omi-purple">0 / 30</span>
        </div>
        <div className="mt-2.5 h-1.5 w-full rounded-full bg-white/10">
          <div className="h-1.5 w-1 rounded-full bg-omi-purple" />
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-omi-text3">
          <span>Chat questions on Free plan</span>
          <span>Resets in 21 days</span>
        </div>
      </div>

      {/* Use Omi free forever */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-start gap-3.5">
          <Key className="mt-0.5 h-5 w-5 text-omi-purple" />
          <div>
            <div className="text-[14px] font-bold text-omi-text">Use Omi free forever</div>
            <div className="text-[12px] text-omi-text3">
              Provide your own OpenAI, Anthropic, Gemini, and Deepgram keys to skip the subscription entirely.
            </div>
          </div>
        </div>
        <button className="mt-3 rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.1]">
          Switch to your own keys
        </button>
      </div>
    </div>
  );
}

function AccountSettings() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const name = user?.displayName || user?.email?.split("@")[0] || "You";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3.5 py-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-omi-bg3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] font-semibold text-omi-text2">{initials}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-omi-text">{name}</div>
          <div className="text-[13px] text-omi-text3">{user?.email}</div>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-[8px] bg-white/[0.1] px-3 py-1.5 text-[13px] text-omi-text hover:bg-white/[0.15]"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <div>
          <div className="text-[14px] font-bold text-omi-error">Delete Account &amp; Data</div>
          <div className="text-[12px] text-omi-text3">
            Permanently deletes server data, clears local data for this account, resets onboarding, and signs you out.
          </div>
        </div>
        <button className="rounded-[8px] bg-omi-error px-4 py-1.5 text-[13px] font-medium text-white hover:bg-omi-error/90">
          Delete
        </button>
      </div>
    </div>
  );
}

function PrivacySettings() {
  const [store, setStore] = useState(false);
  const [sync, setSync] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      {/* Data Controls */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="mb-2 text-[15px] font-bold text-omi-text">Data Controls</div>
        <div className="flex items-center gap-3.5 py-2.5">
          <Mic className="h-5 w-5 text-omi-purple" />
          <div className="flex-1">
            <div className="text-[14px] font-bold text-omi-text">Store Recordings</div>
            <div className="text-[12px] text-omi-text3">Allow omi to store audio recordings of your conversations</div>
          </div>
          <Toggle on={store} onChange={setStore} />
        </div>
        <div className="flex items-center gap-3.5 py-2.5">
          <Cloud className="h-5 w-5 text-omi-purple" />
          <div className="flex-1">
            <div className="text-[14px] font-bold text-omi-text">Private Cloud Sync</div>
            <div className="text-[12px] text-omi-text3">Sync your data securely to your private cloud storage</div>
          </div>
          <Toggle on={sync} onChange={setSync} />
        </div>
      </div>

      {/* Encryption */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center gap-2.5">
          <Shield className="h-[18px] w-[18px] text-omi-purple" />
          <span className="text-[14px] font-bold text-omi-text">Encryption</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-omi-success" />
          <span className="text-[13px] text-omi-text">Server-side encryption</span>
          <span className="rounded-[6px] bg-omi-success/15 px-2 py-0.5 text-[11px] font-medium text-omi-success">
            Active
          </span>
        </div>
        <p className="mt-2 text-[13px] text-omi-text3">
          Your data is encrypted and stored securely with Google Cloud infrastructure.
        </p>
      </div>

      {/* What We Track */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <List className="h-[18px] w-[18px] text-omi-purple" />
          <span className="flex-1 text-[14px] font-bold text-omi-text">What We Track</span>
          <ChevronDown className="h-4 w-4 text-omi-text3" />
        </div>
        <ul className="flex flex-col gap-1.5 pl-1">
          {TRACKED.map((t) => (
            <li key={t} className="flex items-center gap-2 text-[13px] text-omi-text3">
              <span className="h-1 w-1 rounded-full bg-omi-text3" /> {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Privacy Guarantees */}
      <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <Hand className="h-[18px] w-[18px] text-omi-purple" />
          <span className="text-[14px] font-bold text-omi-text">Privacy Guarantees</span>
        </div>
        <ul className="flex flex-col gap-2">
          {GUARANTEES.map((g) => (
            <li key={g} className="flex items-center gap-2.5 text-[13px] text-omi-text2">
              <Check className="h-4 w-4 text-omi-success" /> {g}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
