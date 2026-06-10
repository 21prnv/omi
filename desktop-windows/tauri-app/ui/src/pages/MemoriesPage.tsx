import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Search,
  ListFilter,
  Plus,
  ChevronDown,
  Info,
  RotateCw,
  X,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import { omi, type Memory, type GraphNode, type GraphEdge } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const BrainMap = lazy(() => import("@/components/BrainMap"));

const CATS = [
  { key: "all", label: "All" },
  { key: "manual", label: "Manual" },
  { key: "system", label: "About You" },
  { key: "interesting", label: "Insights" },
  { key: "workflow", label: "Workflow" },
];

export function MemoriesPage() {
  const [items, setItems] = useState<Memory[]>([]);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [catOpen, setCatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [building, setBuilding] = useState(false);
  const user = useAuthStore((s) => s.user);
  const userName = user?.displayName || user?.email?.split("@")[0] || "You";

  function reload() {
    omi.listMemories().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => {
    reload();
    omi.getKnowledgeGraph().then(setGraph).catch(() => setGraph(null));
  }, []);

  // Build the knowledge graph server-side (async) then poll until nodes appear.
  async function rebuildGraph() {
    if (building) return;
    setBuilding(true);
    try {
      await omi.rebuildKnowledgeGraph();
    } catch {
      setBuilding(false);
      return;
    }
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const g = await omi.getKnowledgeGraph();
        if (g.nodes.length > 0) {
          setGraph(g);
          break;
        }
      } catch {
        /* keep polling */
      }
    }
    setBuilding(false);
  }

  const filtered = useMemo(
    () =>
      items
        .filter((m) => cat === "all" || m.category === cat)
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase())),
    [items, cat, query]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Search row */}
      <div className="flex items-center gap-3 px-6 pb-3 pt-5">
        <div className="flex flex-1 items-center gap-2.5 rounded-control bg-white/[0.04] px-4 py-3">
          <Search className="h-4 w-4 text-omi-text3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 bg-transparent text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setCatOpen((v) => !v)}
            className="flex items-center gap-2 rounded-control bg-white/[0.04] px-4 py-3 text-[13px] text-omi-text2 hover:bg-white/[0.08]"
          >
            <ListFilter className="h-4 w-4" /> {CATS.find((c) => c.key === cat)?.label}
            <ChevronDown className="h-3.5 w-3.5 text-omi-text3" />
          </button>
          {catOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-control border border-white/[0.08] bg-omi-bg2 p-1.5 shadow-omi-panel">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setCat(c.key);
                    setCatOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-[13px]",
                    cat === c.key ? "bg-white/[0.06] text-omi-text" : "text-omi-text2 hover:bg-white/[0.04]"
                  )}
                >
                  {c.label}
                  <span className="text-[11px] text-omi-text3">
                    {c.key === "all" ? items.length : items.filter((m) => m.category === c.key).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-control bg-white text-black hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Brain Map */}
        <div className="rounded-section border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-omi-text">Brain Map</h2>
            <button
              onClick={rebuildGraph}
              disabled={building}
              title="Rebuild brain map"
              className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.05] text-omi-text3 hover:bg-white/[0.1] disabled:opacity-50"
            >
              <RotateCw className={cn("h-3.5 w-3.5", building && "animate-spin")} />
            </button>
          </div>
          <div className="flex h-[330px] items-center justify-center">
            {building ? (
              <div className="flex flex-col items-center gap-3 text-omi-text3">
                <RotateCw className="h-6 w-6 animate-spin" />
                <p className="text-[13px]">Building brain map…</p>
              </div>
            ) : graph && graph.nodes.length > 0 ? (
              <Suspense fallback={<p className="text-[13px] text-omi-text3">Loading graph…</p>}>
                <BrainMap nodes={graph.nodes} edges={graph.edges} userName={userName} />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="max-w-xs text-[13px] text-omi-text3">
                  Build a map of the people, places, and topics in your memories.
                </p>
                <button
                  onClick={rebuildGraph}
                  className="rounded-control bg-omi-purple px-4 py-2 text-[13px] font-medium text-white hover:bg-omi-purple/90"
                >
                  Build Brain Map
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Memory cards */}
        <div className="mt-4 flex flex-col gap-2.5">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-[13px] text-omi-text3">Loading memories…</div>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[13px] text-omi-text3">No memories.</div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="group flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-white/[0.025] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-omi-text">{memText(m)}</p>
                  <p className="mt-1.5 text-[12px] text-omi-text3">
                    {new Date(m.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Info className="h-4 w-4 shrink-0 text-omi-text4" />
              </button>
            ))
          )}
        </div>
      </div>

      {adding && (
        <AddMemory
          onClose={() => setAdding(false)}
          onAdded={(m) => {
            setItems((arr) => [m, ...arr]);
            setAdding(false);
          }}
        />
      )}
      {selected && (
        <MemoryDetail
          memory={selected}
          onClose={() => setSelected(null)}
          onChanged={(m) => setItems((arr) => arr.map((x) => (x.id === m.id ? m : x)))}
          onDeleted={(id) => {
            setItems((arr) => arr.filter((x) => x.id !== id));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function memText(m: Memory) {
  if (m.content.startsWith("[Protected") || m.content.startsWith("[Encrypted")) return "[Protected memory]";
  return m.content;
}

// ── Add memory modal ─────────────────────────────────────────────────────────
function AddMemory({ onClose, onAdded }: { onClose: () => void; onAdded: (m: Memory) => void }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      onAdded(await omi.addMemory(text.trim()));
    } catch {
      setSaving(false);
    }
  }
  return (
    <Overlay onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-omi-text">Add Memory</h3>
        <button onClick={onClose} className="text-omi-text3 hover:text-omi-text">
          <X className="h-4 w-4" />
        </button>
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Something to remember about you…"
        rows={4}
        className="w-full resize-none rounded-control border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] text-omi-text outline-none placeholder:text-omi-text3"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-control px-4 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.05]">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!text.trim() || saving}
          className="rounded-control bg-omi-purple px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </Overlay>
  );
}

// ── Memory detail modal ──────────────────────────────────────────────────────
function MemoryDetail({
  memory,
  onClose,
  onChanged,
  onDeleted,
}: {
  memory: Memory;
  onClose: () => void;
  onChanged: (m: Memory) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(memory.content);
  const [vis, setVis] = useState(memory.visibility ?? "private");

  async function saveEdit() {
    setEditing(false);
    if (text === memory.content) return;
    onChanged({ ...memory, content: text });
    try {
      await omi.updateMemory(memory.id, text);
    } catch {
      /* keep optimistic */
    }
  }
  async function toggleVis() {
    const next = vis === "public" ? "private" : "public";
    setVis(next);
    onChanged({ ...memory, visibility: next });
    try {
      await omi.setMemoryVisibility(memory.id, next);
    } catch {
      setVis(vis);
    }
  }
  async function del() {
    onDeleted(memory.id);
    try {
      await omi.deleteMemory(memory.id);
    } catch {
      /* already removed optimistically */
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-[6px] bg-white/[0.06] px-2 py-0.5 text-[11px] capitalize text-omi-text2">
          {memory.category}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleVis} className="rounded-[8px] p-2 text-omi-text3 hover:bg-white/[0.06] hover:text-omi-text">
            {vis === "public" ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </button>
          <button onClick={del} className="rounded-[8px] p-2 text-omi-text3 hover:bg-white/[0.06] hover:text-omi-error">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded-[8px] p-2 text-omi-text3 hover:bg-white/[0.06] hover:text-omi-text">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={saveEdit}
          rows={4}
          className="w-full resize-none rounded-control border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] text-omi-text outline-none"
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="cursor-text rounded-control px-1 py-1 text-[14px] leading-relaxed text-omi-text hover:bg-white/[0.03]"
        >
          {memText(memory)}
        </p>
      )}

      {memory.reasoning && (
        <Section title="Why this?">{memory.reasoning}</Section>
      )}
      {(memory.context_summary || memory.source_app) && (
        <Section title="Context">{memory.context_summary || memory.source_app}</Section>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-omi-text3">
        {memory.confidence != null && <Meta>Confidence {Math.round(memory.confidence * 100)}%</Meta>}
        {memory.source && <Meta>{memory.source}</Meta>}
        <Meta>{new Date(memory.created_at).toLocaleString()}</Meta>
        {memory.tags?.map((t) => <Meta key={t}>#{t}</Meta>)}
      </div>
    </Overlay>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h4 className="mb-1 text-[12px] font-semibold text-omi-text3">{title}</h4>
      <p className="text-[13px] text-omi-text2">{children}</p>
    </div>
  );
}
function Meta({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[6px] bg-white/[0.05] px-2 py-1">{children}</span>;
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-section border border-white/[0.08] bg-omi-bg2 p-5 shadow-omi-window"
      >
        {children}
      </div>
    </div>
  );
}

