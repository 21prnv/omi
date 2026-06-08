import { create } from "zustand";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle, logout } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/** Auth store — mirrors AuthService.swift. Firebase is the source of truth; the
 *  store exposes the current user reactively and drives Google sign-in. */
export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, (user) => set({ user, loading: false }));

  return {
    user: null,
    loading: true,
    error: null,
    signIn: async () => {
      try {
        await signInWithGoogle();
        set({ error: null });
      } catch (e) {
        set({ error: String(e) });
      }
    },
    signOut: async () => {
      await logout();
    },
  };
});
