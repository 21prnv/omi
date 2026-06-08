// Firebase auth — the Omi cloud APIs authenticate with a Firebase ID token, so
// the Windows app signs in with Firebase exactly like the Mac/mobile apps and
// attaches `Authorization: Bearer <idToken>` to every request.
//
// Config values come from Vite env (.env.local). Use the SAME Firebase project
// as production Omi so tokens are accepted by api.omi.me.
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";
import { invoke } from "@tauri-apps/api/core";
// Rust-proxied fetch (api.omi.me has no CORS headers; a webview fetch is blocked).
import { fetch } from "@tauri-apps/plugin-http";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

/** Desktop Google sign-in via the system-browser loopback flow.
 *  Rust opens the browser to Omi's backend OAuth broker and returns the auth
 *  code; we exchange it for a Firebase custom token (same broker the Mac app
 *  uses), then sign in. Avoids the embedded-webview popup block entirely. */
export async function signInWithGoogle(): Promise<void> {
  const { code, redirect_uri } = await invoke<{ code: string; redirect_uri: string }>(
    "google_oauth_listen"
  );
  const base = await invoke<string>("get_api_base_url");
  const res = await fetch(`${base}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      use_custom_token: "true",
    }).toString(),
  });
  if (!res.ok) throw new Error(`token exchange ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.custom_token) throw new Error("no custom_token in response");
  await signInWithCustomToken(auth, data.custom_token);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

/** Current user's fresh ID token, or null if signed out. */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}
