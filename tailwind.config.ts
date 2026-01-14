import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		fontFamily: {
    			sans: [
    				'Plus Jakarta Sans',
    				'ui-sans-serif',
    				'system-ui',
    				'sans-serif',
    				'Apple Color Emoji',
    				'Segoe UI Emoji',
    				'Segoe UI Symbol',
    				'Noto Color Emoji'
    			],
    			display: [
    				'Plus Jakarta Sans"',
    				'Inter',
    				'system-ui',
    				'-apple-system',
    				'sans-serif'
    			],
    			serif: [
    				'ui-serif',
    				'Georgia',
    				'Cambria',
    				'Times New Roman',
    				'Times',
    				'serif'
    			],
    			mono: [
    				'ui-monospace',
    				'SFMono-Regular',
    				'Menlo',
    				'Monaco',
    				'Consolas',
    				'Liberation Mono',
    				'Courier New',
    				'monospace'
    			]
    		},
    		fontSize: {
    			xs: [
    				'0.75rem',
    				{
    					lineHeight: '1rem',
    					letterSpacing: '0.01em'
    				}
    			],
    			sm: [
    				'0.875rem',
    				{
    					lineHeight: '1.25rem',
    					letterSpacing: '0.01em'
    				}
    			],
    			base: [
    				'1rem',
    				{
    					lineHeight: '1.5rem',
    					letterSpacing: '-0.01em'
    				}
    			],
    			lg: [
    				'1.125rem',
    				{
    					lineHeight: '1.75rem',
    					letterSpacing: '-0.01em'
    				}
    			],
    			xl: [
    				'1.25rem',
    				{
    					lineHeight: '1.75rem',
    					letterSpacing: '-0.02em'
    				}
    			],
    			'2xl': [
    				'1.5rem',
    				{
    					lineHeight: '2rem',
    					letterSpacing: '-0.02em'
    				}
    			],
    			'3xl': [
    				'1.875rem',
    				{
    					lineHeight: '2.25rem',
    					letterSpacing: '-0.02em'
    				}
    			],
    			'4xl': [
    				'2.25rem',
    				{
    					lineHeight: '2.5rem',
    					letterSpacing: '-0.03em'
    				}
    			],
    			'5xl': [
    				'3rem',
    				{
    					lineHeight: '1.1',
    					letterSpacing: '-0.03em'
    				}
    			],
    			'6xl': [
    				'3.75rem',
    				{
    					lineHeight: '1',
    					letterSpacing: '-0.03em'
    				}
    			]
    		},
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			success: 'hsl(var(--success))',
    			warning: 'hsl(var(--warning))',
    			info: 'hsl(var(--info))',
    			emerald: 'hsl(var(--emerald))',
    			amber: 'hsl(var(--amber))',
    			rose: 'hsl(var(--rose))',
    			violet: 'hsl(var(--violet))',
    			cyan: 'hsl(var(--cyan))',
    			indigo: 'hsl(var(--indigo))',
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))',
    				muted: 'hsl(var(--sidebar-muted))'
    			}
    		},
    		backgroundImage: {
    			'gradient-primary': 'var(--gradient-primary)',
    			'gradient-secondary': 'var(--gradient-secondary)',
    			'gradient-hero': 'var(--gradient-hero)',
    			'gradient-accent': 'var(--gradient-accent)',
    			'gradient-success': 'var(--gradient-success)',
    			'gradient-warm': 'var(--gradient-warm)',
    			'gradient-mesh': 'var(--gradient-mesh)'
    		},
    		boxShadow: {
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)',
    			primary: 'var(--shadow-primary)',
    			accent: 'var(--shadow-accent)',
    			card: 'var(--shadow-card)',
    			'card-hover': 'var(--shadow-card-hover)',
    			glow: 'var(--shadow-glow)'
    		},
    		borderRadius: {
    			'2xl': 'calc(var(--radius) + 4px)',
    			xl: 'calc(var(--radius) + 2px)',
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0',
    					opacity: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)',
    					opacity: '1'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)',
    					opacity: '1'
    				},
    				to: {
    					height: '0',
    					opacity: '0'
    				}
    			},
    			'fade-in': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(8px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'fade-in-up': {
    				'0%': {
    					opacity: '0',
    					transform: 'translateY(16px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateY(0)'
    				}
    			},
    			'scale-in': {
    				'0%': {
    					transform: 'scale(0.96)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'scale(1)',
    					opacity: '1'
    				}
    			},
    			'slide-in-right': {
    				'0%': {
    					transform: 'translateX(100%)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'translateX(0)',
    					opacity: '1'
    				}
    			},
    			'slide-in-left': {
    				'0%': {
    					transform: 'translateX(-100%)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'translateX(0)',
    					opacity: '1'
    				}
    			},
    			'pulse-soft': {
    				'0%, 100%': {
    					opacity: '1'
    				},
    				'50%': {
    					opacity: '0.7'
    				}
    			},
    			float: {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-6px)'
    				}
    			},
    			shimmer: {
    				'0%': {
    					backgroundPosition: '-200% 0'
    				},
    				'100%': {
    					backgroundPosition: '200% 0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-in': 'fade-in 0.4s ease-out',
    			'fade-in-up': 'fade-in-up 0.5s ease-out',
    			'scale-in': 'scale-in 0.3s ease-out',
    			'slide-in-right': 'slide-in-right 0.4s ease-out',
    			'slide-in-left': 'slide-in-left 0.4s ease-out',
    			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
    			float: 'float 3s ease-in-out infinite',
    			shimmer: 'shimmer 2s linear infinite'
    		},
    		transitionTimingFunction: {
    			smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    			'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    		},
    		spacing: {
    			'18': '4.5rem',
    			'88': '22rem',
    			'128': '32rem'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
