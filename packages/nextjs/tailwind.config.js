/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkMode: "class",
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#C8F5FF",
          "primary-content": "#026262",
          secondary: "#89d7e9",
          "secondary-content": "#088484",
          accent: "#026262",
          "accent-content": "#E9FBFF",
          neutral: "#088484",
          "neutral-content": "#F0FCFF",
          "base-100": "#FFFFFF",
          "base-200": "#F8F9FA",
          "base-300": "#F0F2F5",
          "base-content": "#333333",
          info: "#026262",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
      {
        dark: {
          primary: "#026262",
          "primary-content": "#C8F5FF",
          secondary: "#107575",
          "secondary-content": "#E9FBFF",
          accent: "#C8F5FF",
          "accent-content": "#088484",
          neutral: "#E9FBFF",
          "neutral-content": "#11ACAC",
          "base-100": "#1A1B1E",
          "base-200": "#2C2E33",
          "base-300": "#3D4147",
          "base-content": "#E9FBFF",
          info: "#C8F5FF",
          success: "#34EEB6",
          warning: "#FFCF72",
          error: "#FF8863",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "oklch(var(--p))",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
        },
      },
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        "space-grotesk": ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        'scroll-right': 'scroll-right 30s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'scroll-right': {
          '0%': { transform: 'translateX(-16.67%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
};
