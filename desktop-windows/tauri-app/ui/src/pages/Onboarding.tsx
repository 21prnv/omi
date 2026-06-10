import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Monitor,
  Mic,
  Sparkles,
  HardDrive,
  Zap,
  RotateCw,
  Search as SearchIcon,
  Move,
  Check,
  ListChecks,
  CircleCheck,
  Circle,
  Calendar,
  Mail,
  FileText,
  StickyNote,
  MessageSquare,
} from "lucide-react";
import { omi, type GraphNode, type GraphEdge } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useOnboardingStore } from "@/store/useOnboardingStore";

const BrainMap = lazy(() => import("@/components/BrainMap"));
const openUrl = (url: string) => invoke("open_url", { url }).catch(() => {});

type Layout = "centered" | "split" | "full";

export function Onboarding() {
  const user = useAuthStore((s) => s.user);
  const userName = user?.displayName || user?.email?.split("@")[0] || "You";
  const ob = useOnboardingStore();
  const [step, setStep] = useState(0);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);

  useEffect(() => {
    if (!ob.name) ob.set({ name: userName });
    omi.getKnowledgeGraph().then(setGraph).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const finish = () => ob.complete();

  const STEPS: { layout: Layout; node: React.ReactNode }[] = [
    { layout: "centered", node: <NameStep next={next} /> },
    { layout: "split", node: <LanguageStep next={next} /> },
    { layout: "split", node: <HearStep next={next} /> },
    { layout: "centered", node: <TrustStep next={next} /> },
    {
      layout: "split",
      node: (
        <PermStep
          eyebrow="Access"
          title="Let Omi scan your work."
          desc="File access lets Omi map your projects and files."
          icon={<HardDrive className="h-5 w-5 text-omi-text2" />}
          permName="Disk Access"
          detail="This lets Omi scan your projects and recent files."
          button="Open Disk Access"
          email={user?.email ?? undefined}
          next={next}
        />
      ),
    },
    { layout: "split", node: <DiscoveryStep next={next} /> },
    {
      layout: "split",
      node: (
        <PermStep
          eyebrow="Permission"
          title="Let Omi act when asked."
          desc="Automation lets Omi take actions for you."
          icon={<Zap className="h-5 w-5 text-omi-text2" />}
          permName="Automation"
          detail="This lets Omi take actions when you ask."
          button="Grant automation access"
          next={next}
        />
      ),
    },
    { layout: "full", node: <ShortcutStep voice={false} next={next} /> },
    { layout: "full", node: <FloatingDemoStep next={next} /> },
    { layout: "full", node: <ShortcutStep voice={true} next={next} /> },
    { layout: "full", node: <VoiceDemoStep next={next} /> },
    { layout: "split", node: <DataSourcesStep next={next} /> },
    { layout: "split", node: <GoalStep next={next} /> },
    { layout: "split", node: <BYOKStep next={next} /> },
    { layout: "full", node: <TasksStep finish={finish} /> },
  ];

  const current = STEPS[step];
  // Dots only on paged (centered/split) steps.
  const pagedIdx = STEPS.slice(0, step + 1).filter((s) => s.layout !== "full").length - 1;
  const pagedTotal = STEPS.filter((s) => s.layout !== "full").length;
  const showDots = current.layout !== "full";
  const skip = current.layout === "full" || step >= 4 ? next : undefined;

  return (
    <div className="flex h-screen flex-col bg-omi-bg text-omi-text">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] px-6 py-3.5">
        <div className="flex items-center gap-2">
          <img src="/brand/omi-mark.png" alt="omi" className="h-5 w-5" />
          <span className="text-[18px] font-bold">omi</span>
        </div>
        {skip && step !== STEPS.length - 1 && (
          <button onClick={skip} className="text-[14px] text-omi-text3 hover:text-omi-text">
            Skip
          </button>
        )}
      </div>

      {current.layout === "split" ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex w-1/2 flex-col px-10 py-10">
            {showDots && <Dots active={pagedIdx} total={pagedTotal} />}
            <div className="mt-12 flex-1">{current.node}</div>
          </div>
          <div className="relative w-1/2 border-l border-white/[0.04]">
            <BrainMapPane graph={graph} userName={ob.name || userName} />
          </div>
        </div>
      ) : current.layout === "centered" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
          {showDots && <Dots active={pagedIdx} total={pagedTotal} />}
          <div className="mt-10 w-full max-w-xl">{current.node}</div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6">{current.node}</div>
      )}
    </div>
  );
}

function Dots({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-white" : "w-1.5 bg-white/20")}
        />
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: string }) {
  return <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-omi-text3">{children}</div>;
}

function BrainMapPane({ graph, userName }: { graph: { nodes: GraphNode[]; edges: GraphEdge[] } | null; userName: string }) {
  return (
    <>
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-control bg-omi-bg2 px-3.5 py-1.5 text-[12px] font-semibold">
        This is your second brain.
      </div>
      <div className="h-full">
        {graph && graph.nodes.length > 0 ? (
          <Suspense fallback={<MapPlaceholder />}>
            <BrainMap nodes={graph.nodes} edges={graph.edges} userName={userName} />
          </Suspense>
        ) : (
          <MapPlaceholder />
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-5 rounded-control border border-white/[0.06] bg-omi-bg2/80 px-5 py-2.5 text-[11px] text-omi-text3 backdrop-blur">
        <span className="flex items-center gap-1.5"><RotateCw className="h-3 w-3" /> Drag to rotate</span>
        <span className="flex items-center gap-1.5"><SearchIcon className="h-3 w-3" /> Scroll to zoom</span>
        <span className="flex items-center gap-1.5"><Move className="h-3 w-3" /> Two-finger to pan</span>
      </div>
    </>
  );
}
function MapPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-[13px] text-omi-text3">Building your brain…</div>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────
function NameStep({ next }: { next: () => void }) {
  const ob = useOnboardingStore();
  const [name, setName] = useState(ob.name);
  return (
    <div className="text-center">
      <Eyebrow>Name</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">What should Omi call you?</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && (ob.set({ name: name.trim() }), next())}
        className="mx-auto mt-8 block w-[320px] rounded-control bg-white/[0.06] px-4 py-3 text-center text-[14px] text-omi-text outline-none"
      />
      <button
        onClick={() => name.trim() && (ob.set({ name: name.trim() }), next())}
        className="mt-6 rounded-control bg-white px-6 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90"
      >
        Continue
      </button>
    </div>
  );
}

function LanguageStep({ next }: { next: () => void }) {
  const ob = useOnboardingStore();
  const [other, setOther] = useState(false);
  const [custom, setCustom] = useState("");
  return (
    <div>
      <Eyebrow>Language</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">Pick your language.</h1>
      <p className="mt-3 text-[15px] text-omi-text3">Omi will use it for prompts and transcripts.</p>
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => {
            ob.set({ language: "English" });
            next();
          }}
          className={cn(
            "rounded-control px-5 py-2 text-[14px] font-medium",
            !other ? "bg-white text-black" : "bg-white/[0.06] text-omi-text2"
          )}
        >
          English
        </button>
        <button
          onClick={() => setOther(true)}
          className={cn(
            "rounded-control px-5 py-2 text-[14px] font-medium",
            other ? "bg-white text-black" : "bg-white/[0.06] text-omi-text2"
          )}
        >
          Other
        </button>
      </div>
      {other && (
        <div className="mt-4 flex items-center gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Language"
            className="rounded-control bg-white/[0.06] px-4 py-2 text-[14px] text-omi-text outline-none"
          />
          <button
            onClick={() => {
              ob.set({ language: custom.trim() || "English" });
              next();
            }}
            className="rounded-control bg-white px-4 py-2 text-[13px] font-medium text-black"
          >
            Save language
          </button>
        </div>
      )}
    </div>
  );
}

const HEAR = ["YouTube", "Product Hunt", "Podcast", "Event", "AI chat", "Colleague", "Search engine", "Article", "Social media", "Other", "Newsletter", "Friend"];
function HearStep({ next }: { next: () => void }) {
  return (
    <div>
      <Eyebrow>Quick question</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">How did you hear about Omi?</h1>
      <div className="mt-6 flex max-w-md flex-wrap gap-2.5">
        {HEAR.map((h) => (
          <button
            key={h}
            onClick={() => setTimeout(next, 200)}
            className="rounded-control bg-white/[0.06] px-4 py-2 text-[14px] text-omi-text2 hover:bg-white/[0.12]"
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrustStep({ next }: { next: () => void }) {
  const rows = [
    { icon: <Monitor className="h-5 w-5 text-omi-text2" />, title: "Screen + files", sub: "Build context from what you're working on." },
    { icon: <Mic className="h-5 w-5 text-omi-text2" />, title: "Microphone", sub: "Capture voice notes and meeting context." },
    { icon: <Sparkles className="h-5 w-5 text-omi-text2" />, title: "Accessibility + automation", sub: "Know the active app and act when you ask." },
  ];
  return (
    <div className="text-center">
      <Eyebrow>Before we continue</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">I'm going to ask for a few permissions.</h1>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-omi-text3">
        Omi is open source and private by design. During setup, we'll ask for these permissions to understand your work and help in the right places:
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.title} className="flex items-center gap-3.5 rounded-section bg-white/[0.03] px-4 py-3.5 text-left">
            {r.icon}
            <div>
              <div className="text-[14px] font-bold">{r.title}</div>
              <div className="text-[13px] text-omi-text3">{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={next} className="rounded-control bg-white px-6 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90">
          Continue
        </button>
        <button onClick={() => openUrl("https://github.com/BasedHardware/omi")} className="text-[14px] text-omi-text3 hover:text-omi-text">
          Read the source code
        </button>
      </div>
    </div>
  );
}

function PermStep(props: {
  eyebrow: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  permName: string;
  detail: string;
  button: string;
  email?: string;
  next: () => void;
}) {
  return (
    <div>
      <Eyebrow>{props.eyebrow}</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">{props.title}</h1>
      <p className="mt-3 text-[15px] text-omi-text3">{props.desc}</p>
      <div className="mt-7 flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">{props.icon}</div>
        <div>
          <div className="text-[16px] font-bold">{props.permName}</div>
          <div className="text-[13px] text-omi-text3">Not granted yet</div>
        </div>
      </div>
      <p className="mt-4 text-[14px] text-omi-text3">{props.detail}</p>
      {props.email && <p className="mt-2 text-[13px] text-omi-text3">{props.email}</p>}
      <button
        onClick={props.next}
        className="mt-5 rounded-control bg-white px-5 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90"
      >
        {props.button}
      </button>
    </div>
  );
}

function DiscoveryStep({ next }: { next: () => void }) {
  const [mapped, setMapped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMapped(true), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div>
      <Eyebrow>Discovery</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">Start building your profile.</h1>
      <p className="mt-3 text-[15px] text-omi-text3">Omi scans projects and recent files.</p>
      <div className="mt-6 flex w-[460px] flex-col items-center gap-4 rounded-section bg-white/[0.03] py-10">
        <div className={cn("h-32 w-32 rounded-full border-2 border-white/30", !mapped && "animate-spin")} style={{ borderTopColor: "white" }} />
        <div className="text-center">
          <div className="text-[16px] font-bold">{mapped ? "Your workspace is mapped." : "Scanning your workspace…"}</div>
          <div className="mt-1 text-[13px] text-omi-text3">{mapped ? "23 files indexed" : "Building your graph…"}</div>
        </div>
      </div>
      {mapped && (
        <button onClick={next} className="mt-5 rounded-control bg-white px-6 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90">
          Continue
        </button>
      )}
    </div>
  );
}

function ShortcutStep({ voice, next }: { voice: boolean; next: () => void }) {
  const presets = voice ? ["⌥", "Right ⌘", "fn", "^", "Custom"] : ["⌘ ↵", "⇧ ⌘ ↵", "⌘ J", "⌘ O", "Custom"];
  const [sel, setSel] = useState(0);
  return (
    <div className="w-full max-w-2xl text-center">
      <h2 className="text-[20px] font-bold leading-relaxed">
        {voice ? "Let's set \"Audio ask a question\" shortcut." : "Let's set \"Ask a question\" shortcut."}
        <br />
        {voice ? "Press and hold to test. Does the button light up?" : "Press this shortcut. Do the buttons light up?"}
      </h2>
      <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 rounded-section bg-white/[0.03] py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {(voice ? ["⌥"] : ["⌘", "↵"]).map((k, i) => (
              <div key={i} className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.04] text-[18px]">
                {k}
              </div>
            ))}
          </div>
          <span className="text-[13px] text-omi-text3">{voice ? "Press and hold to test" : "Press to test"}</span>
        </div>
      </div>
      <div className="mt-7">
        <div className="mb-3 text-[14px] font-medium text-omi-text2">
          {voice ? "Try another shortcut if it doesn't react:" : "Choose a different shortcut:"}
        </div>
        <div className="flex items-center justify-center gap-2">
          {presets.map((p, i) => (
            <button
              key={p}
              onClick={() => setSel(i)}
              className={cn("rounded-control px-3.5 py-2 text-[13px] font-medium", sel === i ? "bg-white text-black" : "bg-white/[0.06] text-omi-text2")}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <button onClick={next} className="mt-8 rounded-control bg-white/[0.08] px-6 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.12]">
        Continue
      </button>
    </div>
  );
}

function FloatingDemoStep({ next }: { next: () => void }) {
  return (
    <div className="max-w-2xl text-center">
      <h2 className="text-[20px] font-bold leading-relaxed">Omi sees your screen and gives you hyper-personalized responses</h2>
      <p className="mt-2 text-[16px] text-omi-text2">Press this shortcut to open Ask Omi.</p>
      <div className="mt-7 flex items-center justify-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/[0.06] text-[18px]">⌘</div>
        <span className="text-omi-text3">+</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/[0.06] text-[18px]">↵</div>
      </div>
      <p className="mt-4 text-[13px] text-omi-text3">Ask Omi opens at the top of your screen.</p>
      <button onClick={next} className="mt-8 rounded-control bg-white/[0.08] px-6 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.12]">
        Continue
      </button>
    </div>
  );
}

function VoiceDemoStep({ next }: { next: () => void }) {
  const [speak, setSpeak] = useState(true);
  return (
    <div className="max-w-2xl text-center">
      <h2 className="text-[24px] font-bold">Hold Option and Ask</h2>
      <p className="mt-2 text-[16px] text-omi-text2">Try asking: What's on my screen?</p>
      <label className="mt-6 flex items-center justify-center gap-2.5 text-[14px] text-omi-text">
        <button
          onClick={() => setSpeak((v) => !v)}
          className={cn("flex h-5 w-5 items-center justify-center rounded-[5px]", speak ? "bg-omi-purple" : "border border-omi-text3")}
        >
          {speak && <Check className="h-3 w-3 text-white" />}
        </button>
        Speak answers aloud for voice questions
      </label>
      <p className="mt-6 text-[13px] text-omi-text3">Hold the shortcut, speak, then release</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/[0.06] text-[18px]">⌥</div>
        <span className="text-[13px] text-omi-text3">hold</span>
      </div>
      <button onClick={next} className="mt-8 rounded-control bg-white/[0.08] px-6 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.12]">
        Continue
      </button>
    </div>
  );
}

function DataSourcesStep({ next }: { next: () => void }) {
  const [on, setOn] = useState<Record<string, boolean>>({ Calendar: true, Email: true, "Local files": true, "Apple Notes": true, ChatGPT: false, Claude: false });
  const rows = [
    { key: "Calendar", icon: <Calendar className="h-5 w-5 text-blue-400" />, sub: "0 events • 0 memories" },
    { key: "Email", icon: <Mail className="h-5 w-5 text-red-400" />, sub: "0 emails • 0 memories" },
    { key: "Local files", icon: <FileText className="h-5 w-5 text-omi-text2" />, sub: "23 files • 9 memories" },
    { key: "Apple Notes", icon: <StickyNote className="h-5 w-5 text-yellow-400" />, sub: "0 notes • 0 memories", extra: "Select Folder" },
    { key: "ChatGPT", icon: <MessageSquare className="h-5 w-5 text-omi-text2" />, sub: "0 memories" },
    { key: "Claude", icon: <Sparkles className="h-5 w-5 text-omi-purple" />, sub: "0 memories" },
  ];
  return (
    <div>
      <h1 className="text-[36px] font-bold leading-tight">Your 2nd brain is live.</h1>
      <p className="mt-2 text-[15px] text-omi-text3">Connect more of your context.</p>
      <div className="mt-6 flex flex-col rounded-section border border-white/[0.06] bg-white/[0.02]">
        {rows.map((r, i) => (
          <div key={r.key} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-white/[0.05]")}>
            {r.icon}
            <div className="flex-1">
              <div className="text-[14px] font-semibold">{r.key}</div>
              <div className="text-[12px] text-omi-text3">{r.sub}</div>
            </div>
            {r.extra && <span className="text-[12px] text-omi-text3">{r.extra}</span>}
            <button
              onClick={() => setOn((m) => ({ ...m, [r.key]: !m[r.key] }))}
              className={cn("relative h-[22px] w-[38px] rounded-full transition-colors", on[r.key] ? "bg-omi-purple" : "bg-omi-bg4")}
            >
              <span className={cn("absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all", on[r.key] ? "left-[19px]" : "left-[3px]")} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={next} className="mt-6 rounded-control bg-white px-6 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90">
        Continue
      </button>
    </div>
  );
}

const GOALS = ["Be more productive and focused every day", "Make meaningful progress on my projects"];
function GoalStep({ next }: { next: () => void }) {
  const ob = useOnboardingStore();
  const [own, setOwn] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  async function pick(goal: string) {
    if (!goal.trim() || saving) return;
    setSaving(true);
    ob.set({ goal });
    try {
      await omi.createGoal(goal);
    } catch {
      /* non-blocking */
    }
    next();
  }
  return (
    <div>
      <Eyebrow>Goal</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">Pick one goal.</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-omi-text3">
        Selecting a correct and detailed goal is very important - Omi will optimize all advice to achieve that goal. Make sure your goal contains a number to measure progress.
      </p>
      <div className="mt-6 grid max-w-lg grid-cols-2 gap-2.5">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => pick(g)}
            className="rounded-control bg-white/[0.06] px-4 py-3 text-left text-[14px] font-medium text-omi-text2 hover:bg-white/[0.1]"
          >
            {g}
          </button>
        ))}
        <button
          onClick={() => setOwn(true)}
          className={cn("col-span-2 rounded-control px-4 py-3 text-[14px] font-medium", own ? "bg-white/[0.1] text-omi-text" : "bg-white/[0.06] text-omi-text2 hover:bg-white/[0.1]")}
        >
          Type my own
        </button>
      </div>
      {own && (
        <div className="mt-3 flex max-w-lg items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pick(text)}
            placeholder="e.g. Ship 3 features this month"
            className="flex-1 rounded-control bg-white/[0.06] px-4 py-2.5 text-[14px] text-omi-text outline-none"
          />
          <button onClick={() => pick(text)} disabled={saving} className="rounded-control bg-white px-4 py-2.5 text-[13px] font-medium text-black">
            Save
          </button>
        </div>
      )}
    </div>
  );
}

const KEYS = [
  { name: "OpenAI", use: "Used for GPT calls." },
  { name: "Anthropic", use: "Used for Claude chat." },
  { name: "Gemini", use: "Used for proactive AI." },
  { name: "Deepgram", use: "Used for transcription." },
];
function BYOKStep({ next }: { next: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const filled = KEYS.every((k) => vals[k.name]?.trim());
  return (
    <div>
      <Eyebrow>Free forever</Eyebrow>
      <h1 className="text-[40px] font-bold leading-tight">Bring your own keys.</h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-omi-text3">
        Paste your own API keys for OpenAI, Anthropic, Gemini, and Deepgram and Omi is free forever. Keys stay on this PC — we never store them on our servers.
      </p>
      <div className="mt-5 flex max-w-lg flex-col gap-3">
        {KEYS.map((k) => (
          <div key={k.name}>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold">{k.name}</span>
              <span className="text-[12px] text-omi-text3">{k.use}</span>
            </div>
            <input
              type="password"
              value={vals[k.name] ?? ""}
              onChange={(e) => setVals((v) => ({ ...v, [k.name]: e.target.value }))}
              placeholder={`Paste ${k.name} API key`}
              className="mt-1.5 w-full rounded-control bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => {
            if (filled) localStorage.setItem("omi_byok", JSON.stringify(vals));
            next();
          }}
          className="rounded-control bg-white px-5 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90"
        >
          Activate free plan
        </button>
        <span className="text-[13px] text-omi-text3">Fill all four to activate.</span>
      </div>
    </div>
  );
}

function TasksStep({ finish }: { finish: () => void }) {
  const tasks = [
    { t: "Task 1", s: "From today's meeting", done: false },
    { t: "Task 2", s: "Mentioned in Slack", done: false },
    { t: "Task 3", s: "Getting started", done: true },
  ];
  return (
    <div className="max-w-md text-center">
      <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06]">
        <ListChecks className="h-7 w-7 text-omi-text2" />
      </div>
      <h2 className="text-[24px] font-bold">Auto-created Tasks</h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-omi-text3">
        omi listens to your conversations and automatically creates tasks, action items, and follow-ups for you.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {tasks.map((t) => (
          <div key={t.t} className="flex items-center gap-3 rounded-control bg-white/[0.03] px-4 py-3 text-left">
            {t.done ? <CircleCheck className="h-5 w-5 text-omi-success" /> : <Circle className="h-5 w-5 text-omi-text3" />}
            <div>
              <div className={cn("text-[14px] font-semibold", t.done && "text-omi-text3 line-through")}>{t.t}</div>
              <div className="text-[12px] text-omi-text3">{t.s}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={finish} className="mt-8 rounded-control bg-white px-8 py-3 text-[14px] font-semibold text-black hover:bg-white/90">
        Take me to my tasks
      </button>
    </div>
  );
}
