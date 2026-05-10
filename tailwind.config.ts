import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212f",
        mist: "#eef3f7",
        cloud: "#f6f3ef",
        sage: "#7ca58b",
        steel: "#6f8194",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(24, 39, 75, 0.08)",
        soft: "0 12px 32px rgba(24, 39, 75, 0.06)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 360ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
