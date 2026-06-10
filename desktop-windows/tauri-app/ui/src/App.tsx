import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { HomePage } from "@/pages/HomePage";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { MemoriesPage } from "@/pages/MemoriesPage";
import { TasksPage } from "@/pages/TasksPage";
import { RewindPage } from "@/pages/RewindPage";
import { AppsPage } from "@/pages/AppsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { FloatingBar } from "@/pages/FloatingBar";
import { Onboarding } from "@/pages/Onboarding";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranscriptStore } from "@/store/useTranscriptStore";
import { useOnboardingStore } from "@/store/useOnboardingStore";

export default function App() {
  const location = useLocation();
  if (location.pathname === "/floating") return <FloatingBar />;
  return <MainShell />;
}

function MainShell() {
  const { user, loading } = useAuthStore();
  const initTranscript = useTranscriptStore((s) => s.init);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
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
  // First run after sign-in: the onboarding flow (matches macOS).
  if (!onboardingCompleted) return <Onboarding />;

  // Settings is a full-screen takeover (matches macOS): its own sidebar + Back,
  // with the main nav hidden.
  if (location.pathname === "/settings") {
    return (
      <div className="h-screen bg-omi-bg text-omi-text">
        <SettingsPage />
      </div>
    );
  }

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
    <div className="flex h-screen flex-col items-center bg-black text-omi-text">
      <div className="flex flex-1 flex-col items-center justify-center">
        <img src="/brand/omi-mark.png" alt="omi" className="h-16 w-16" />
        <h1 className="mt-6 text-[44px] font-bold tracking-tight">omi</h1>
        <p className="mt-1 text-[15px] text-omi-text3">Sign in to continue</p>
      </div>
      <div className="mb-24 flex w-[320px] flex-col gap-3">
        <button
          onClick={() => signIn("apple")}
          className="flex items-center justify-center gap-2.5 rounded-[14px] bg-white px-4 py-3 text-[15px] font-medium text-black hover:bg-white/95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
          </svg>
          Sign in with Apple
        </button>
        <button
          onClick={() => signIn("google")}
          className="flex items-center justify-center gap-2.5 rounded-[14px] bg-white px-4 py-3 text-[15px] font-medium text-black hover:bg-white/95"
        >
          <img src="/brand/google.png" alt="" className="h-4 w-4" />
          Sign in with Google
        </button>
        {error && <p className="text-center text-[12px] text-omi-error">{error}</p>}
      </div>
    </div>
  );
}
