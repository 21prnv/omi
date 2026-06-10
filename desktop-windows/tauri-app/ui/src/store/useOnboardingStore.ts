import { create } from "zustand";

const KEY = "omi_onboarding_completed";

interface OnboardingState {
  completed: boolean;
  // Collected during the flow (used to personalize after).
  name: string;
  language: string;
  goal: string;
  complete: () => void;
  set: (patch: Partial<Pick<OnboardingState, "name" | "language" | "goal">>) => void;
}

// Onboarding completion is tracked locally (the macOS app marks it via a local
// agent tool we don't have on Windows). Shown once after first sign-in.
export const useOnboardingStore = create<OnboardingState>((setState) => ({
  completed: localStorage.getItem(KEY) === "1",
  name: "",
  language: "English",
  goal: "",
  complete: () => {
    localStorage.setItem(KEY, "1");
    setState({ completed: true });
  },
  set: (patch) => setState(patch),
}));
