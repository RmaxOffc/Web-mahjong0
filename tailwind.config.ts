import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lacquer: "#1B0F12",      // deep red-black background, like lacquered wood
        lacquer2: "#2A1418",
        jade: "#0E5C4A",
        jade2: "#158066",
        gold: "#D4AF37",
        gold2: "#F2D675",
        ember: "#B3231C",
        ember2: "#E0392F",
        ivory: "#F4EBDC",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(212,175,55,0.55), 0 0 6px rgba(212,175,55,0.8)",
        emberglow: "0 0 24px rgba(224,57,47,0.6)",
      },
      keyframes: {
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        flip: "flip 0.6s ease-in-out",
        rise: "rise 0.5s ease-out",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
