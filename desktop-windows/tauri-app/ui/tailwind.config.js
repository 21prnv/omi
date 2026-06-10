/** @type {import('tailwindcss').Config} */
// Exact Omi macOS design tokens (from desktop/Desktop/Sources/Theme/OmiColors.swift).
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        omi: {
          // Backgrounds
          bg: "#0F0F0F", // primary window bg
          bg2: "#1A1A1A", // secondary (cards, selected nav)
          bg3: "#252525", // tertiary (hover, controls)
          bg4: "#35343B", // quaternary
          raised: "#1F1F25", // raised/elevated
          // Text
          text: "#FFFFFF",
          text2: "#E5E5E5",
          text3: "#B0B0B0",
          text4: "#888888",
          // Brand
          purple: "#8B5CF6",
          purple2: "#A855F7",
          "purple-dark": "#7C3AED",
          "purple-light": "#D946EF",
          bubble: "#5b4fe8", // user message bubble + accent (matches rendered macOS)
          // Status
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
          // Border
          border: "#3A3940",
        },
      },
      borderRadius: {
        window: "26px",
        card: "24px",
        section: "20px",
        control: "16px",
        chip: "14px",
      },
      boxShadow: {
        "omi-window": "0 14px 26px rgba(0,0,0,0.22)",
        "omi-panel": "0 10px 18px rgba(0,0,0,0.14)",
        "omi-control": "0 4px 8px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
