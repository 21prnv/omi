import { NavLink } from "react-router-dom";
import { MessagesSquare, Brain, MessageCircle, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

// Left nav — mirrors the Mac app's primary tabs.
const links = [
  { to: "/", label: "Conversations", icon: MessagesSquare, end: true },
  { to: "/live", label: "Live", icon: AudioLines },
  { to: "/memories", label: "Memories", icon: Brain },
  { to: "/chat", label: "Chat", icon: MessageCircle },
];

export function Sidebar() {
  return (
    <nav className="flex h-full w-56 shrink-0 flex-col gap-1 border-r border-border bg-card/40 p-3">
      <div className="px-2 pb-4 pt-2 text-lg font-semibold tracking-tight">Omi</div>
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              isActive && "bg-secondary text-foreground"
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
