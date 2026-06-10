import { NavLink, useNavigate } from "react-router-dom";
import {
  House,
  MessageSquare,
  Brain,
  ListTodo,
  LayoutGrid,
  PanelLeft,
  ScreenShare,
  Mic,
  MoreHorizontal,
  Gift,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/Toggle";
import { useAuthStore } from "@/store/useAuthStore";
import { useRecordingStore } from "@/store/useRecordingStore";

const navItems = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/memories", label: "Memories", icon: Brain },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/rewind", label: "Rewind", icon: null }, // red dot, special-cased below
  { to: "/apps", label: "Apps", icon: LayoutGrid },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const { recording, start, stop } = useRecordingStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenOn, setScreenOn] = useState(false);

  const name = user?.displayName || user?.email?.split("@")[0] || "You";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav className="flex h-full w-[260px] shrink-0 flex-col px-3 py-3 text-omi-text">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-3 pt-1">
        <div className="flex items-center gap-2.5">
          <img src="/brand/omi-mark.png" alt="omi" className="h-5 w-5" />
          <span className="text-[19px] font-bold tracking-[-0.4px]">omi</span>
        </div>
        <PanelLeft className="h-[17px] w-[17px] text-omi-text3" />
      </div>

      {/* Main nav */}
      <div className="flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-chip px-3 py-[9px] text-[14px] transition-colors",
                isActive
                  ? "bg-white/[0.07] font-medium text-omi-text"
                  : "font-normal text-omi-text3 hover:bg-white/[0.04] hover:text-omi-text"
              )
            }
          >
            {label === "Rewind" ? (
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full bg-omi-error" />
              </span>
            ) : (
              Icon && <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            )}
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="flex-1" />

      {/* Quick controls */}
      <div className="mb-1 flex flex-col gap-0.5 px-1">
        <div className="flex items-center gap-3 px-2 py-2">
          <ScreenShare className="h-[18px] w-[18px] text-omi-text3" strokeWidth={1.8} />
          <span className="flex-1 text-[13px] text-omi-text2">Screen Recording</span>
          <Toggle on={screenOn} onChange={setScreenOn} />
        </div>
        <div className="flex items-center gap-3 px-2 py-2">
          <Mic className="h-[18px] w-[18px] text-omi-text3" strokeWidth={1.8} />
          <span className="flex-1 text-[13px] text-omi-text2">Microphone</span>
          <Toggle on={recording} onChange={(v) => (v ? start() : stop())} />
        </div>
      </div>

      {/* Profile */}
      <div className="relative">
        {menuOpen && (
          <div className="absolute bottom-12 left-0 w-[210px] rounded-control border border-omi-border/40 bg-omi-bg2 p-1.5 shadow-omi-panel">
            {[
              { label: "Refer a Friend", icon: Gift },
              { label: "Discord", icon: MessageCircle },
              { label: "Settings", icon: Settings, onClick: () => navigate("/settings") },
            ].map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={() => {
                  setMenuOpen(false);
                  onClick?.();
                }}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] text-omi-text2 transition-colors hover:bg-white/[0.06]"
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                {label}
              </button>
            ))}
            <div className="my-1 h-px bg-omi-border/40" />
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] text-omi-error transition-colors hover:bg-white/[0.06]"
            >
              Sign out
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-control px-2 py-2 transition-colors hover:bg-white/[0.05]"
        >
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-omi-purple/80">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-[11px] font-semibold text-white">{initials}</span>
            )}
          </div>
          <span className="flex-1 truncate text-left text-[13px] font-medium">{name}</span>
          <MoreHorizontal className="h-[14px] w-[14px] text-omi-text3" />
        </button>
      </div>
    </nav>
  );
}
