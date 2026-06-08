import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RecordButton } from "@/components/RecordButton";
import { Button } from "@/components/ui/button";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { LiveTranscriptPage } from "@/pages/LiveTranscriptPage";
import { MemoriesPage } from "@/pages/MemoriesPage";
import { ChatPage } from "@/pages/ChatPage";
import { FloatingBar } from "@/pages/FloatingBar";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranscriptStore } from "@/store/useTranscriptStore";

export default function App() {
  const location = useLocation();

  // The floating bar is its own borderless window rendering the same bundle at
  // /floating — render it bare, without the main chrome.
  if (location.pathname === "/floating") return <FloatingBar />;

  return <MainShell />;
}

function MainShell() {
  const { user, loading } = useAuthStore();
  const initTranscript = useTranscriptStore((s) => s.init);

  // Subscribe to the Rust cloud-stream events once, for the app's lifetime.
  useEffect(() => {
    const unlisten = initTranscript();
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [initTranscript]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );

  if (!user) return <SignedOut />;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-end border-b border-border px-4">
          <RecordButton />
        </header>
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ConversationsPage />} />
            <Route path="/live" element={<LiveTranscriptPage />} />
            <Route path="/memories" element={<MemoriesPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function SignedOut() {
  const { signIn, error } = useAuthStore();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Welcome to Omi</h1>
      <p className="text-sm text-muted-foreground">Sign in to sync your conversations.</p>
      <Button onClick={() => signIn()}>Continue with Google</Button>
      {error && <p className="max-w-md text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
