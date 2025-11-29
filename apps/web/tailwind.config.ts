/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        surfaceAlt: "var(--color-surface-alt)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        primarySoft: "var(--color-primary-soft)",
        primaryStrong: "var(--color-primary-strong)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        text: "var(--color-text)",
        textMuted: "var(--color-text-muted)",
        inputBg: "var(--color-input-bg)",
        inputBorder: "var(--color-input-border)",
        navBg: "var(--color-nav-bg)",
        navBorder: "var(--color-nav-border)",
        navActive: "var(--color-nav-active)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        subtle: "var(--shadow-subtle)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
