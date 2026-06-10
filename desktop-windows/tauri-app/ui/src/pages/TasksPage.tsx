import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ListFilter,
  Plus,
  Settings,
  Sun,
  Sunrise,
  Calendar,
  Inbox,
  Circle,
  CheckCircle2,
  Trash2,
  Check,
} from "lucide-react";
import { omi, type ActionItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const GROUPS = [
  { key: "Today", icon: Sun, color: "text-omi-warning" },
  { key: "Tomorrow", icon: Sunrise, color: "text-omi-text2" },
  { key: "Later", icon: Calendar, color: "text-omi-text2" },
  { key: "No Deadline", icon: Inbox, color: "text-omi-text3" },
] as const;

type Status = "todo" | "done" | "all";
const STATUSES: { key: Status; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];
const PRIORITIES = ["high", "medium", "low"];

function groupOf(item: ActionItem): string {
  if (!item.due_at) return "No Deadline";
  const due = new Date(item.due_at);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start.getTime() + 86400000);
  const dayAfter = new Date(start.getTime() + 2 * 86400000);
  if (due < tomorrow) return "Today";
  if (due < dayAfter) return "Tomorrow";
  return "Later";
}

export function TasksPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActionItem[]>([]);
  const [query, setQuery] = useState("");
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState<Status>("todo");
  const [priorities, setPriorities] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const quickAddRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    const fetcher =
      status === "todo"
        ? omi.listActionItems(false)
        : status === "done"
          ? omi.listActionItems(true)
          : omi.listActionItems();
    fetcher
      .then((r) => setItems(r.action_items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, [status]);

  const availableCategories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean) as string[])],
    [items]
  );

  const grouped = useMemo(() => {
    const filtered = items
      .filter((i) => i.description.toLowerCase().includes(query.toLowerCase()))
      .filter((i) => priorities.size === 0 || (i.priority && priorities.has(i.priority)))
      .filter((i) => categories.size === 0 || (i.category && categories.has(i.category)));
    const map: Record<string, ActionItem[]> = {};
    for (const g of GROUPS) map[g.key] = [];
    for (const it of filtered) map[groupOf(it)].push(it);
    return map;
  }, [items, query, priorities, categories]);

  const hasActiveFilters = status !== "todo" || priorities.size > 0 || categories.size > 0;

  async function add() {
    const text = newTask.trim();
    if (!text) {
      quickAddRef.current?.focus();
      return;
    }
    setNewTask("");
    const optimistic: ActionItem = {
      id: `local-${Date.now()}`,
      description: text,
      completed: false,
      created_at: new Date().toISOString(),
      due_at: null,
    };
    setItems((arr) => [optimistic, ...arr]);
    try {
      const created = await omi.createActionItem(text);
      setItems((arr) => arr.map((x) => (x.id === optimistic.id ? created : x)));
    } catch {
      setItems((arr) => arr.filter((x) => x.id !== optimistic.id));
    }
  }

  async function toggle(t: ActionItem) {
    const next = !t.completed;
    if (status === "all") {
      setItems((arr) => arr.map((x) => (x.id === t.id ? { ...x, completed: next } : x)));
    } else {
      setItems((arr) => arr.filter((x) => x.id !== t.id)); // no longer matches the status filter
    }
    try {
      await omi.toggleActionItem(t.id, next);
    } catch {
      load();
    }
  }

  async function del(t: ActionItem) {
    setItems((arr) => arr.filter((x) => x.id !== t.id));
    try {
      await omi.deleteActionItem(t.id);
    } catch {
      setItems((arr) => [t, ...arr]);
    }
  }

  async function saveEdit(t: ActionItem) {
    setEditingId(null);
    const text = editText.trim();
    if (!text || text === t.description) return;
    setItems((arr) => arr.map((x) => (x.id === t.id ? { ...x, description: text } : x)));
    try {
      await omi.updateActionItem(t.id, { description: text });
    } catch {
      /* keep optimistic */
    }
  }

  function toggleSet(set: Set<string>, val: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  }

  const empty = !loading && Object.values(grouped).every((g) => g.length === 0);

  return (
    <div className="flex h-full flex-col">
      {/* Search row */}
      <div className="flex items-center gap-3 px-5 pb-2 pt-4">
        <div className="flex flex-1 items-center gap-2.5">
          <Search className="h-4 w-4 text-omi-text3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-[14px] text-omi-text outline-none placeholder:text-omi-text3"
          />
        </div>
        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              "flex h-8 w-9 items-center justify-center rounded-[10px] border text-omi-text2 hover:bg-white/[0.05]",
              hasActiveFilters ? "border-omi-purple/50 text-omi-text" : "border-white/10"
            )}
          >
            <ListFilter className="h-4 w-4" />
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-control border border-white/[0.08] bg-omi-bg2 p-2 shadow-omi-panel">
                <FilterGroup label="Status">
                  {STATUSES.map((s) => (
                    <FilterRow key={s.key} active={status === s.key} onClick={() => setStatus(s.key)} radio>
                      {s.label}
                    </FilterRow>
                  ))}
                </FilterGroup>
                {availableCategories.length > 0 && (
                  <FilterGroup label="Category">
                    {availableCategories.map((c) => (
                      <FilterRow
                        key={c}
                        active={categories.has(c)}
                        onClick={() => toggleSet(categories, c, setCategories)}
                      >
                        <span className="capitalize">{c}</span>
                      </FilterRow>
                    ))}
                  </FilterGroup>
                )}
                <FilterGroup label="Priority">
                  {PRIORITIES.map((p) => (
                    <FilterRow key={p} active={priorities.has(p)} onClick={() => toggleSet(priorities, p, setPriorities)}>
                      <span className="capitalize">{p}</span>
                    </FilterRow>
                  ))}
                </FilterGroup>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setStatus("todo");
                      setPriorities(new Set());
                      setCategories(new Set());
                    }}
                    className="mt-1 w-full rounded-[8px] px-3 py-1.5 text-left text-[12px] text-omi-text3 hover:bg-white/[0.04]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => quickAddRef.current?.focus()}
          title="Add task"
          className="flex h-8 w-8 items-center justify-center rounded-[10px] text-omi-text3 hover:bg-white/[0.05] hover:text-omi-text"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate("/settings")}
          title="Task settings"
          className="flex h-8 w-8 items-center justify-center rounded-[10px] text-omi-text3 hover:bg-white/[0.05] hover:text-omi-text"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Quick add */}
        <div className="flex items-center gap-3.5 px-2 py-2.5">
          <Circle className="h-[22px] w-[22px] shrink-0 text-omi-text4" strokeWidth={1.4} />
          <input
            ref={quickAddRef}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task…"
            className="flex-1 bg-transparent text-[14px] text-omi-text outline-none placeholder:text-omi-text3"
          />
        </div>

        {empty ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-omi-text3">
            <CheckCircle2 className="h-6 w-6" />
            <p className="text-[13px]">{hasActiveFilters ? "No tasks match these filters." : "No tasks yet. Add one above."}</p>
          </div>
        ) : (
          GROUPS.map(({ key, icon: Icon, color }) => {
            const group = grouped[key];
            if (!group || group.length === 0) return null;
            return (
              <div key={key} className="mt-2">
                <div className="flex items-center gap-2 py-2">
                  <Icon className={cn("h-4 w-4", color)} />
                  <h2 className="text-[15px] font-bold text-omi-text">{key}</h2>
                  <span className="text-[12px] text-omi-text3">{group.length}</span>
                </div>
                <div className="flex flex-col">
                  {group.map((t) => (
                    <div
                      key={t.id}
                      className="group flex items-start gap-3.5 rounded-control px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
                    >
                      <button onClick={() => toggle(t)} className="mt-0.5 shrink-0">
                        {t.completed ? (
                          <CheckCircle2 className="h-[22px] w-[22px] text-omi-purple" />
                        ) : (
                          <Circle className="h-[22px] w-[22px] text-omi-text3 hover:text-omi-purple" strokeWidth={1.4} />
                        )}
                      </button>
                      <div className="flex-1">
                        {editingId === t.id ? (
                          <input
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={() => saveEdit(t)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit(t)}
                            className="w-full bg-transparent text-[14px] text-omi-text outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => {
                              setEditingId(t.id);
                              setEditText(t.description);
                            }}
                            className={cn("cursor-text text-[14px] text-omi-text", t.completed && "text-omi-text3 line-through")}
                          >
                            {t.description}
                          </div>
                        )}
                        {t.due_at && (
                          <div className="mt-0.5 text-[11px] text-omi-text3">
                            {new Date(t.due_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => del(t)}
                        className="mt-0.5 text-omi-text4 opacity-0 transition-opacity hover:text-omi-error group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Shortcuts bar */}
      <div className="flex justify-center pb-4">
        <div className="flex items-center gap-5 rounded-full bg-white/[0.04] px-5 py-2 text-[11px] text-omi-text3">
          <Shortcut keys="↑↓" label="Navigate" />
          <Shortcut keys="⌘N" label="New" />
          <Shortcut keys="⌘D" label="Delete" />
          <Shortcut keys="⇥" label="Indent" />
          <Shortcut keys="⇧⇥" label="Outdent" />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-omi-text3">{label}</div>
      {children}
    </div>
  );
}
function FilterRow({
  active,
  radio,
  onClick,
  children,
}: {
  active: boolean;
  radio?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[8px] px-3 py-1.5 text-[13px] text-omi-text2 hover:bg-white/[0.04]"
    >
      {children}
      {active && <Check className={cn("h-3.5 w-3.5", radio ? "text-omi-text" : "text-omi-purple")} />}
    </button>
  );
}
function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 font-sans text-[11px] text-omi-text2">{keys}</kbd>
      {label}
    </span>
  );
}
