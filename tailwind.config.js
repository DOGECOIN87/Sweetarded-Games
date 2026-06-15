/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        'magic-dark': '#000000',
        'magic-card': '#080808',
        'magic-hover': '#111111',
        'magic-pink': '#ff00ff',
        'magic-purple': '#9945ff',
        'magic-blue': '#00d4ff',
        'magic-red': '#ff2222',
        'magic-text': '#666666',
        // Sweetardios NFT collection palette — brand colors for the redesign.
        // Usage: bg-sweetardios-oxford, text-sweetardios-cerise, border-sweetardios-cyan, ...
        sweetardios: {
          oxford: '#070F34', // Oxford Blue — base background / darkest layer
          zaffre: '#0313A6', // Zaffre — panels, cards, reel frames
          violet: '#9201CB', // Dark Violet — primary brand / structure
          cerise: '#F715AB', // Hollywood Cerise — CTAs, wins, highlights
          cyan: '#34EDF3',   // Fluorescent Cyan — neon glow, interactive accents
        },
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        marquee: 'marquee 60s linear infinite',
        'marquee-fast': 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 50s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [],
};
