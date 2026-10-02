// Theme configuration - Dark gradient with neon purple/indigo accents
export const theme = {
    colors: {
        // Background gradients
        background: {
            primary: '#0a0118',
            secondary: '#1a0b2e',
            tertiary: '#2d1b4e',
        },

        // Neon accents
        neon: {
            purple: '#7c3aed',
            indigo: '#6366f1',
            pink: '#ec4899',
            blue: '#3b82f6',
        },

        // UI elements
        card: 'rgba(255, 255, 255, 0.05)',
        cardBorder: 'rgba(124, 58, 237, 0.3)',

        // Text
        text: {
            primary: '#ffffff',
            secondary: '#a78bfa',
            muted: '#94a3b8',
            disabled: '#64748b',
        },

        // Status colors
        status: {
            pending: '#fbbf24',
            approved: '#10b981',
            denied: '#ef4444',
            entered: '#3b82f6',
            exited: '#6b7280',
        },

        // Overlay
        overlay: 'rgba(0, 0, 0, 0.7)',
        backdrop: 'rgba(10, 1, 24, 0.8)',
    },

    // Typography
    typography: {
        fontSize: {
            xs: 12,
            sm: 14,
            base: 16,
            lg: 18,
            xl: 20,
            '2xl': 24,
            '3xl': 30,
            '4xl': 36,
            '5xl': 48,
        },
        fontWeight: {
            regular: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
            extrabold: '800',
        },
    },

    // Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 40,
        '3xl': 48,
    },

    // Border radius
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        full: 9999,
    },

    // Shadows & Glows
    shadows: {
        neon: {
            purple: '0 0 20px rgba(124, 58, 237, 0.5)',
            indigo: '0 0 20px rgba(99, 102, 241, 0.5)',
            pink: '0 0 20px rgba(236, 72, 153, 0.5)',
        },
        card: '0 4px 20px rgba(0, 0, 0, 0.3)',
        elevation: '0 8px 32px rgba(0, 0, 0, 0.4)',
    },

    // Glassmorphism
    glass: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
        blur: 10,
    },
};

// Gradient presets
export const gradients = {
    primary: ['#7c3aed', '#6366f1'],
    secondary: ['#ec4899', '#7c3aed'],
    background: ['#0a0118', '#1a0b2e', '#2d1b4e'],
    card: ['rgba(124, 58, 237, 0.1)', 'rgba(99, 102, 241, 0.05)'],
};

export default theme;
