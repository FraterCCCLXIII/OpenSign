/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: [
    require("daisyui"),
    function ({ addUtilities, addVariant }) {
      // ✅ Variants that match html[data-theme="..."] (or any ancestor with data-theme)
      addVariant("opensigncss", '[data-theme="opensigncss"] &');
      addVariant("opensigndark", '[data-theme="opensigndark"] &');

      addUtilities({
        // Prevent iOS long-press popup
        ".touch-callout-none": {
          "-webkit-touch-callout": "none"
        },
        // Disabled button styling aligned with zinc/shadcn neutrals
        ".op-btn-vscode-disabled": {
          "background-color": "#27272a !important",
          color: "#a1a1aa !important",
          "border-color": "#3f3f46 !important",
          cursor: "not-allowed !important",
          opacity: "1 !important",
          "&:hover": {
            "background-color": "#27272a !important",
            color: "#a1a1aa !important",
            "border-color": "#3f3f46 !important",
            transform: "none !important"
          }
        },
        // Dark mode icon improvements using DaisyUI theme detection
        '[data-theme="opensigndark"] .icon-improved': {
          color: "#a1a1aa !important"
        },
        '[data-theme="opensigndark"] .icon-muted': {
          color: "#71717a !important"
        },
        '[data-theme="opensigndark"] .icon-disabled': {
          color: "#52525b !important"
        },
        // Gray text improvements for dark mode
        '[data-theme="opensigndark"] .text-gray-500': {
          color: "#a1a1aa !important"
        },
        '[data-theme="opensigndark"] .text-gray-400': {
          color: "#71717a !important"
        },
        '[data-theme="opensigndark"] .text-gray-600': {
          color: "#a1a1aa !important"
        },
        // CSS variable utilities that work with arbitrary values
        ".icon-themed": {
          color: "var(--icon-color)"
        },
        ".icon-themed-muted": {
          color: "var(--icon-color-muted)"
        },
        ".icon-themed-disabled": {
          color: "var(--icon-color-disabled)"
        },
        ".btn-themed-disabled": {
          "background-color": "var(--btn-disabled-bg)",
          color: "var(--btn-disabled-color)",
          "border-color": "var(--btn-disabled-border)",
          cursor: "not-allowed",
          "&:hover": {
            "background-color": "var(--btn-disabled-bg)",
            color: "var(--btn-disabled-color)",
            "border-color": "var(--btn-disabled-border)",
            transform: "none"
          }
        }
      });
    }
  ],
  daisyui: {
    // themes: true,
    themes: [
      {
        // Dark: shadcn-like zinc palette (replaces VS Code blue theme)
        opensigndark: {
          primary: "#fafafa",
          "primary-content": "#18181b",

          secondary: "#27272a",
          "secondary-content": "#fafafa",

          accent: "#a1a1aa",
          "accent-content": "#18181b",

          neutral: "#27272a",
          "neutral-content": "#fafafa",

          "base-100": "#09090b",
          "base-200": "#18181b",
          "base-300": "#27272a",
          "base-content": "#fafafa",

          info: "#3b82f6",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",

          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.375rem",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",

          "--icon-color": "#a1a1aa",
          "--icon-color-muted": "#71717a",
          "--icon-color-disabled": "#52525b",
          "--btn-disabled-bg": "#27272a",
          "--btn-disabled-color": "#a1a1aa",
          "--btn-disabled-border": "#3f3f46",

          "--navbar-padding": "0.75rem",
          "--border-color": "#27272a",
          "--tooltip-color": "#27272a",

          // shadcn-aligned aliases
          "--background": "#09090b",
          "--foreground": "#fafafa",
          "--border": "#27272a",
          "--ring": "#d4d4d8",
          "--radius": "0.5rem"
        }
      },
      {
        // Light: shadcn-like zinc palette (replaces navy/red brand defaults)
        opensigncss: {
          primary: "#18181b",
          "primary-content": "#fafafa",

          secondary: "#f4f4f5",
          "secondary-content": "#18181b",

          accent: "#71717a",
          "accent-content": "#fafafa",

          neutral: "#e4e4e7",
          "neutral-content": "#18181b",

          "base-100": "#ffffff",
          "base-200": "#f4f4f5",
          "base-300": "#e4e4e7",
          "base-content": "#09090b",

          info: "#3b82f6",
          "info-content": "#f8fafc",
          success: "#16a34a",
          "success-content": "#f8fafc",
          warning: "#ca8a04",
          "warning-content": "#18181b",
          error: "#dc2626",
          "error-content": "#fef2f2",

          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "0.375rem",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",

          "--icon-color": "#71717a",
          "--icon-color-muted": "#a1a1aa",
          "--icon-color-disabled": "#d4d4d8",
          "--btn-disabled-bg": "#f4f4f5",
          "--btn-disabled-color": "#a1a1aa",
          "--btn-disabled-border": "#e4e4e7",

          "--navbar-padding": "0.75rem",
          "--border-color": "#e4e4e7",
          "--tooltip-color": "#18181b",

          "--background": "#ffffff",
          "--foreground": "#09090b",
          "--border": "#e4e4e7",
          "--ring": "#18181b",
          "--radius": "0.5rem"
        }
      }
    ],
    prefix: "op-"
  }
};
