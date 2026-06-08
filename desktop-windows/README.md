# Omi for Windows

Native Windows desktop client for Omi, built as a **thin client** over Omi's
existing cloud APIs. The backend is **not** rebuilt or ported — the UI talks
directly to `api.omi.me` with a Firebase ID token, exactly like the mobile apps.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Desktop shell | Tauri v2 (WebView2) |
| Native OS code | Rust (`crates/omi-native`) |
| Backend | **Existing Omi cloud** (`api.omi.me`) — unchanged |

```
React UI (WebView2) ──fetch──► api.omi.me  (existing Omi cloud, untouched)
       │
       └─invoke()─► Tauri/Rust ─► omi-native: WASAPI audio, WGC screen, tray, global shortcut
```

## Layout

```
desktop-windows/
├── crates/omi-native/        # Windows-native integrations (replaces the macOS Swift layer)
│   └── src/
│       ├── audio/            # mic (cpal, cross-platform) + system_audio (WASAPI loopback)
│       ├── screen/           # Windows.Graphics.Capture + foreground-window monitor
│       ├── rewind/           # Media Foundation encode + Windows.Media.Ocr
│       └── transcription/    # offline whisper fallback
└── tauri-app/
    ├── src-tauri/            # Tauri shell: tray, global-shortcut floating bar, commands
    └── ui/                   # React + TS + Tailwind + shadcn + Zustand
```

## What's verified vs. pending

- ✅ `omi-native` compiles on macOS/Linux (mic path + cross-platform abstractions).
- ✅ Frontend type-checks and builds.
- ⏳ `#[cfg(windows)]` code (WASAPI loopback, WGC, OCR) and the full Tauri bundle
  compile **only on Windows** — verified by `.github/workflows/windows.yml`
  (`windows-latest`), since the dev machine is macOS.

## Develop

```bash
# Frontend deps
cd tauri-app/ui && npm install && cp .env.example .env.local   # fill in Firebase config

# Run the app (on Windows, with Tauri CLI installed)
cd tauri-app/src-tauri && cargo tauri dev
```

The mic capture path and React UI run on any OS for development; the Windows-only
native features require a Windows host.
