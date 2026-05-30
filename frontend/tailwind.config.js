/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        display: ["'Cormorant Garamond'", "Georgia", "serif"],
                        body: ["'DM Sans'", "system-ui", "sans-serif"],
                        arabic: ["'Amiri'", "serif"],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                        xl: '20px',
                        '2xl': '32px',
                        pill: '999px'
                },
                colors: {
                        fyn: {
                                pink: '#E8196A',
                                'pink-light': '#FDEEF5',
                                'pink-dark': '#B5124F',
                                gold: '#C9A07A',
                                'gold-light': '#F5EDE3',
                                plum: '#2D0A1F',
                                'plum-mid': '#5C2040',
                                bg: '#FAF8F6',
                                surface: '#FFFFFF',
                                text: '#1C1C1E',
                                muted: '#6E6E73',
                                border: '#EDE8E3',
                                'border-strong': '#D4C9BF',
                        },
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        float: {
                                '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
                                '33%': { transform: 'translateY(-12px) rotate(1deg)' },
                                '66%': { transform: 'translateY(-6px) rotate(-1deg)' }
                        },
                        sparkle: {
                                '0%,100%': { opacity: '0.3', transform: 'scale(0.8)' },
                                '50%': { opacity: '1', transform: 'scale(1.2)' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        float: 'float 6s ease-in-out infinite',
                        sparkle: 'sparkle 2.4s ease-in-out infinite'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
