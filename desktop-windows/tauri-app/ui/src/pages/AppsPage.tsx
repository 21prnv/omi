import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, ChevronDown, Star, Eye, X, Check } from "lucide-react";
import { omi, type App, type AppGroup, type AppCategory } from "@/lib/api";
import { cn } from "@/lib/utils";

const openUrl = (url: string) => invoke("open_url", { url }).catch(() => {});
const DOCS_URL = "https://docs.omi.me/docs/developer/apps/Introduction";

// Local connectors (top sections). Native connect flows are Windows-specific and
// still pending; export "Open" links work today.
const IMPORTS = [
  { name: "Calendar", sub: "Google Calendar", desc: "Import events and recurring routines.", url: "https://omi.me" },
  { name: "Email", sub: "Gmail", desc: "Import email history and follow-ups.", url: "https://omi.me" },
  { name: "Local files", sub: "This PC", desc: "Index documents, code, and working folders.", url: "https://omi.me" },
  { name: "ChatGPT", sub: "Memory import", desc: "Paste a memory export into Omi.", url: "https://chatgpt.com" },
  { name: "Claude", sub: "Memory import", desc: "Paste a memory export into Omi.", url: "https://claude.ai" },
];
const EXPORTS = [
  { name: "Notion", sub: "Copy-ready page export", desc: "Copy a ready-to-paste page and jump into Notion.", url: "https://notion.so" },
  { name: "Obsidian", sub: "Write to your vault", desc: "Write Omi memories into your Obsidian vault.", url: "https://obsidian.md" },
  { name: "ChatGPT", sub: "Prompt + memory pack", desc: "Copy the prompt and memory pack, then open ChatGPT.", url: "https://chatgpt.com" },
  { name: "Claude", sub: "Prompt + memory pack", desc: "Copy the prompt and memory pack, then open Claude.", url: "https://claude.ai" },
  { name: "Gemini", sub: "Prompt + memory pack", desc: "Copy the prompt and memory pack, then open Gemini.", url: "https://gemini.google.com" },
];

export function AppsPage() {
  const [groups, setGroups] = useState<AppGroup[]>([]);
  const [cats, setCats] = useState<AppCategory[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AppCategory | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [installedOnly, setInstalledOnly] = useState(false);
  const [results, setResults] = useState<App[] | null>(null);
  const [selected, setSelected] = useState<App | null>(null);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    omi.getApps().then((r) => setGroups(r.groups)).catch(() => {}).finally(() => setLoading(false));
    omi.getAppCategories().then(setCats).catch(() => {});
  }, []);

  // Search / category / installed → flat results; otherwise the grouped view.
  const filtering = !!query.trim() || !!category || installedOnly;
  useEffect(() => {
    if (!filtering) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      omi
        .searchApps({ q: query.trim() || undefined, category: category?.id, installed: installedOnly })
        .then((r) => setResults(r.data))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query, category, installedOnly, filtering]);

  const isEnabled = (a: App) => enabledMap[a.id] ?? !!a.enabled;
  async function toggleInstall(a: App) {
    const next = !isEnabled(a);
    setEnabledMap((m) => ({ ...m, [a.id]: next }));
    try {
      next ? await omi.enableApp(a.id) : await omi.disableApp(a.id);
    } catch {
      setEnabledMap((m) => ({ ...m, [a.id]: !next }));
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pb-3 pt-4">
        <div className="flex flex-1 items-center gap-2.5 rounded-control bg-white/[0.04] px-4 py-2.5">
          <Search className="h-4 w-4 text-omi-text3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps..."
            className="flex-1 bg-transparent text-[13px] text-omi-text outline-none placeholder:text-omi-text3"
          />
        </div>
        <button
          onClick={() => setInstalledOnly((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-control px-3.5 py-2.5 text-[13px]",
            installedOnly ? "bg-omi-purple/20 text-omi-text" : "bg-white/[0.04] text-omi-text2 hover:bg-white/[0.08]"
          )}
        >
          <Eye className="h-3.5 w-3.5" /> Installed
        </button>
        <div className="relative">
          <button
            onClick={() => setCatOpen((v) => !v)}
            className="flex items-center gap-2 rounded-control bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-omi-text2 hover:bg-white/[0.08]"
          >
            {category?.title ?? "Category"} <ChevronDown className="h-3.5 w-3.5 text-omi-text3" />
          </button>
          {catOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-control border border-white/[0.08] bg-omi-bg2 p-1.5 shadow-omi-panel">
                <button
                  onClick={() => {
                    setCategory(null);
                    setCatOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.04]"
                >
                  All Categories {!category && <Check className="h-3.5 w-3.5 text-omi-purple" />}
                </button>
                {cats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCategory(c);
                      setCatOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.04]"
                  >
                    {c.title} {category?.id === c.id && <Check className="h-3.5 w-3.5 text-omi-purple" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => openUrl(DOCS_URL)}
          className="rounded-control bg-white px-4 py-2.5 text-[13px] font-medium text-black hover:bg-white/90"
        >
          Create App
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {results !== null ? (
          /* Search / filter results */
          <Section title={installedOnly && !query && !category ? "Installed" : "Results"}>
            {results.length === 0 ? (
              <p className="col-span-full py-8 text-center text-[13px] text-omi-text3">No apps found.</p>
            ) : (
              results.map((a) => (
                <AppCard key={a.id} app={a} enabled={isEnabled(a)} onToggle={() => toggleInstall(a)} onOpen={() => setSelected(a)} />
              ))
            )}
          </Section>
        ) : loading ? (
          <div className="flex h-40 items-center justify-center text-[13px] text-omi-text3">Loading apps…</div>
        ) : (
          <>
            {/* Imports / Exports (local connectors) */}
            <Section title="Imports">
              {IMPORTS.map((c) => (
                <ConnectorCard key={c.name} {...c} action="Connect" onClick={() => openUrl(c.url)} />
              ))}
            </Section>
            <Section title="Exports">
              {EXPORTS.map((c) => (
                <ConnectorCard key={c.name} {...c} action="Open" onClick={() => openUrl(c.url)} />
              ))}
            </Section>
            {/* Marketplace groups */}
            {groups.map((g) => (
              <Section key={g.capability.id} title={g.capability.title}>
                {g.data.map((a) => (
                  <AppCard key={a.id} app={a} enabled={isEnabled(a)} onToggle={() => toggleInstall(a)} onOpen={() => setSelected(a)} />
                ))}
              </Section>
            ))}
          </>
        )}
      </div>

      {selected && (
        <AppDetail
          app={selected}
          enabled={isEnabled(selected)}
          onToggle={() => toggleInstall(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-[16px] font-bold text-omi-text">{title}</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">{children}</div>
    </div>
  );
}

function AppIcon({ src, name }: { src?: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-[14px] font-bold text-omi-text2">
        {name[0]?.toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt="" onError={() => setErr(true)} className="h-9 w-9 shrink-0 rounded-[10px] object-cover" />;
}

function AppCard({ app, enabled, onToggle, onOpen }: { app: App; enabled: boolean; onToggle: () => void; onOpen: () => void }) {
  return (
    <div className="flex flex-col rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-3.5">
      <button onClick={onOpen} className="flex items-start gap-3 text-left">
        <AppIcon src={app.image} name={app.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-omi-text">{app.name}</div>
          <div className="truncate text-[12px] text-omi-text3">{app.author || app.category}</div>
        </div>
      </button>
      <p className="mt-2 line-clamp-2 flex-1 text-[12px] leading-relaxed text-omi-text3">{app.description}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-omi-text3">
          {app.rating_avg != null && app.rating_avg > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-omi-warning text-omi-warning" /> {app.rating_avg.toFixed(1)}
            </span>
          )}
          {!!app.installs && <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {fmtCount(app.installs)}</span>}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            enabled ? openUrl(app.external_integration?.app_home_url || DOCS_URL) : onToggle();
          }}
          className={cn(
            "rounded-[8px] px-3 py-1.5 text-[12px] font-medium",
            enabled ? "bg-white/[0.08] text-omi-text2 hover:bg-white/[0.12]" : "bg-white text-black hover:bg-white/90"
          )}
        >
          {enabled ? "Open" : "Install"}
        </button>
      </div>
    </div>
  );
}

function ConnectorCard({ name, sub, desc, action, onClick }: { name: string; sub: string; desc: string; action: string; onClick: () => void }) {
  return (
    <div className="flex flex-col rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-3.5">
      <div className="flex items-start gap-3">
        <AppIcon name={name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-omi-text">{name}</div>
          <div className="truncate text-[12px] text-omi-text3">{sub}</div>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 flex-1 text-[12px] leading-relaxed text-omi-text3">{desc}</p>
      <div className="mt-2.5 flex justify-end">
        <button
          onClick={onClick}
          className="rounded-[8px] bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-omi-text2 hover:bg-white/[0.12]"
        >
          {action}
        </button>
      </div>
    </div>
  );
}

function AppDetail({ app, enabled, onToggle, onClose }: { app: App; enabled: boolean; onToggle: () => void; onClose: () => void }) {
  const [full, setFull] = useState<App>(app);
  useEffect(() => {
    omi.getApp(app.id).then(setFull).catch(() => {});
  }, [app.id]);
  return (
    <div onClick={onClose} className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-6">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-section border border-white/[0.08] bg-omi-bg2 p-5 shadow-omi-window"
      >
        <div className="flex items-start gap-3.5">
          <AppIcon src={full.image} name={full.name} />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold text-omi-text">{full.name}</div>
            <div className="text-[12px] text-omi-text3">{full.author}</div>
          </div>
          <button onClick={onClose} className="text-omi-text3 hover:text-omi-text">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[12px] text-omi-text3">
          {full.rating_avg != null && full.rating_avg > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-omi-warning text-omi-warning" /> {full.rating_avg.toFixed(1)} ({full.rating_count})
            </span>
          )}
          {!!full.installs && <span>{fmtCount(full.installs)} installs</span>}
          {full.category && <span className="capitalize">{full.category.replace(/-/g, " ")}</span>}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-omi-text2">{full.description}</p>
        <div className="mt-5 flex justify-end gap-2">
          {enabled && (
            <button
              onClick={onToggle}
              className="rounded-control border border-white/10 px-4 py-2 text-[13px] text-omi-text2 hover:bg-white/[0.05]"
            >
              Uninstall
            </button>
          )}
          <button
            onClick={() => (enabled ? openUrl(full.external_integration?.app_home_url || DOCS_URL) : onToggle())}
            className={cn(
              "rounded-control px-5 py-2 text-[13px] font-medium",
              enabled ? "bg-white/[0.1] text-omi-text" : "bg-omi-purple text-white hover:bg-omi-purple/90"
            )}
          >
            {enabled ? "Open" : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}
