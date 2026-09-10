
import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "default" | "forest" | "sunset" | "ocean" | "golden" | "custom";
export type ThemeMode = "light" | "dark" | "system";

function hexToHslComponents(hex: string): { h: number; s: number; l: number } {
    let r = 0, g = 0, b = 0;
    const cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

export function hexToHsl(hex: string): string {
    const { h, s, l } = hexToHslComponents(hex);
    return `${h} ${s}% ${l}%`;
}

interface ThemeContextType {
    variant: ThemeVariant;
    setVariant: (variant: ThemeVariant) => void;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    customColor: string;
    setCustomColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [variant, setVariant] = useState<ThemeVariant>(() => {
        return (localStorage.getItem("theme-variant") as ThemeVariant) || "default";
    });

    const [mode, setMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem("theme-mode") as ThemeMode) || "system";
    });

    const [customColor, setCustomColor] = useState<string>(() => {
        return localStorage.getItem("theme-custom-color") || "#ec4899";
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove all theme preset classes
        root.classList.remove("theme-forest", "theme-sunset", "theme-ocean", "theme-golden", "theme-custom", "light", "dark");

        // Apply Mode
        let resolvedMode = mode;
        if (mode === "system") {
            resolvedMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        root.classList.add(resolvedMode);

        // Apply Variant
        if (variant === "custom") {
            const { h, s, l } = hexToHslComponents(customColor);
            const primaryHsl = `${h} ${s}% ${l}%`;
            const primaryFgHsl = l > 65 ? "0 0% 0%" : "0 0% 100%";

            // Accent: harmonious tint of the custom color hue
            const accentLightness = resolvedMode === "dark" 
                ? Math.min(80, Math.max(35, l + 6)) 
                : Math.max(15, Math.min(60, l - 10));
            const accentHsl = `${h} ${Math.min(95, Math.max(30, s))}% ${accentLightness}%`;
            const accentFgHsl = accentLightness > 65 ? "0 0% 0%" : "0 0% 100%";

            // Sidebar primary & accents
            const sidebarPrimaryHsl = primaryHsl;
            const sidebarPrimaryFgHsl = primaryFgHsl;
            const sidebarAccentHsl = resolvedMode === "dark" 
                ? `${h} 20% 12%` 
                : `${h} 25% 94%`;
            const sidebarAccentFgHsl = resolvedMode === "dark"
                ? `${h} 75% 85%`
                : `${h} 75% 25%`;

            root.style.setProperty("--primary", primaryHsl);
            root.style.setProperty("--primary-foreground", primaryFgHsl);
            root.style.setProperty("--ring", primaryHsl);
            root.style.setProperty("--accent", accentHsl);
            root.style.setProperty("--accent-foreground", accentFgHsl);
            root.style.setProperty("--sidebar-primary", sidebarPrimaryHsl);
            root.style.setProperty("--sidebar-primary-foreground", sidebarPrimaryFgHsl);
            root.style.setProperty("--sidebar-ring", primaryHsl);
            root.style.setProperty("--sidebar-accent", sidebarAccentHsl);
            root.style.setProperty("--sidebar-accent-foreground", sidebarAccentFgHsl);

            root.classList.add("theme-custom");
        } else {
            root.style.removeProperty("--primary");
            root.style.removeProperty("--primary-foreground");
            root.style.removeProperty("--ring");
            root.style.removeProperty("--accent");
            root.style.removeProperty("--accent-foreground");
            root.style.removeProperty("--sidebar-primary");
            root.style.removeProperty("--sidebar-primary-foreground");
            root.style.removeProperty("--sidebar-ring");
            root.style.removeProperty("--sidebar-accent");
            root.style.removeProperty("--sidebar-accent-foreground");

            if (variant !== "default") {
                root.classList.add(`theme-${variant}`);
            }
        }

        localStorage.setItem("theme-variant", variant);
        localStorage.setItem("theme-mode", mode);
        localStorage.setItem("theme-custom-color", customColor);
    }, [variant, mode, customColor]);

    return (
        <ThemeContext.Provider value={{ variant, setVariant, mode, setMode, customColor, setCustomColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
