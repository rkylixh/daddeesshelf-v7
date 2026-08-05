/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--background-secondary)',
          card: 'var(--background-card)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          muted: 'var(--foreground-muted)',
          subtle: 'var(--foreground-subtle)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          glow: 'var(--primary-glow)',
          bright: 'var(--primary-bright)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          light: 'var(--accent-light)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
        xl: '20px',
        '2xl': '24px',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        serif: ['Lora', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-warm': 'linear-gradient(135deg, #b8860b, #8b4513)',
        'gradient-card': 'linear-gradient(135deg, var(--background-card), var(--muted))',
        // Legacy alias
        'gradient-celestial': 'linear-gradient(135deg, #b8860b, #8b4513)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'scale-in': 'scaleIn 0.2s ease forwards',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'dust-float': 'dust-float 8s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(24px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { textShadow: '0 0 20px rgba(212,168,67,0.5), 0 0 40px rgba(212,168,67,0.25)' },
          '50%': { textShadow: '0 0 30px rgba(212,168,67,0.7), 0 0 60px rgba(212,168,67,0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.2)' },
        },
        'dust-float': {
          '0%, 100%': { opacity: '0.1', transform: 'translateY(0px) translateX(0px)' },
          '25%': { opacity: '0.4', transform: 'translateY(-12px) translateX(4px)' },
          '50%': { opacity: '0.2', transform: 'translateY(-6px) translateX(-3px)' },
          '75%': { opacity: '0.35', transform: 'translateY(-18px) translateX(6px)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(184,134,11,0.25)',
        'glow': '0 0 30px rgba(184,134,11,0.3)',
        'glow-lg': '0 0 50px rgba(184,134,11,0.35)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 40px rgba(184,134,11,0.2), 0 4px 24px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};