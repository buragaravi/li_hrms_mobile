/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#10B981", // Emerald 500
                    dark: "#059669",    // Emerald 600
                    light: "#34D399",   // Emerald 400
                    50: "#ECFDF5",
                    100: "#D1FAE5",
                },
                secondary: {
                    DEFAULT: "#F59E0B",
                    dark: "#D97706",
                    light: "#FBBF24",
                },
                accent: {
                    DEFAULT: "#8B5CF6", // purple
                    dark: "#7C3AED",
                    light: "#A78BFA",
                },
                neutral: {
                    50: "#F8FAFC",
                    100: "#F1F5F9",
                    200: "#E2E8F0",
                    300: "#CBD5E1",
                    400: "#94A6B8",
                    500: "#64748B",
                    600: "#475569",
                    700: "#334155",
                    800: "#1E293B",
                    900: "#0F172A",
                },
                success: "#10B981",
                warning: "#F59E0B",
                danger: "#EF4444",
                info: "#3B82F6",
            },
            borderRadius: {
                '2xl': '20px',
                '3xl': '24px',
                '4xl': '32px',
            },
        },
    },
    plugins: [],
};
