import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { HomePage } from "@/pages/HomePage";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { MemoriesPage } from "@/pages/MemoriesPage";
import { TasksPage } from "@/pages/TasksPage";
import { RewindPage } from "@/pages/RewindPage";
import { AppsPage } from "@/pages/AppsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { FloatingBar } from "@/pages/FloatingBar";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranscriptStore } from "@/store/useTranscriptStore";

export default function App() {
  const location = useLocation();
  if (location.pathname === "/floating") return <FloatingBar />;
  return <MainShell />;
}

function MainShell() {
  const { user, loading } = useAuthStore();
  const initTranscript = useTranscriptStore((s) => s.init);
  const location = useLocation();

  useEffect(() => {
    const unlisten = initTranscript();
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [initTranscript]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-omi-bg text-[13px] text-omi-text3">
        Loading…
      </div>
    );
  }
  if (!user) return <SignedOut />;

  // Settings is a full-screen takeover (matches macOS): its own sidebar + Back,
  // with the main nav hidden.
  if (location.pathname === "/settings") {
    return (
      <div className="h-screen bg-omi-bg text-omi-text">
        <SettingsPage />
      </div>
    );
  }

  // Sidebar on a dark surround; content in a rounded, inset, bordered panel.
  return (
    <div className="flex h-screen bg-[#070707] text-omi-text">
      <Sidebar />
      <div className="m-2.5 min-w-0 flex-1 overflow-hidden rounded-[22px] border border-white/[0.06] bg-omi-bg">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/rewind" element={<RewindPage />} />
          <Route path="/apps" element={<AppsPage />} />
        </Routes>
      </div>
    </div>
  );
}

function SignedOut() {
  const { signIn, error } = useAuthStore();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-omi-bg">
      <img src="/brand/omi-mark.png" alt="omi" className="h-14 w-14" />
      <h1 className="text-2xl font-semibold text-omi-text">Welcome to omi</h1>
      <p className="text-[13px] text-omi-text3">Sign in to sync your conversations.</p>
      <Button onClick={() => signIn()}>Continue with Google</Button>
      {error && <p className="max-w-md text-center text-[11px] text-omi-error">{error}</p>}
    </div>
  );
}
