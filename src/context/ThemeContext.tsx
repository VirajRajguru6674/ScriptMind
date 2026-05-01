
import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "default" | "forest" | "sunset" | "ocean" | "golden";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
    variant: ThemeVariant;
    setVariant: (variant: ThemeVariant) => void;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [variant, setVariant] = useState<ThemeVariant>(() => {
        return (localStorage.getItem("theme-variant") as ThemeVariant) || "default";
    });

    const [mode, setMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem("theme-mode") as ThemeMode) || "system";
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove all theme classes
        root.classList.remove("theme-forest", "theme-sunset", "theme-ocean", "theme-golden", "light", "dark");

        // Apply Mode
        let resolvedMode = mode;
        if (mode === "system") {
            resolvedMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        root.classList.add(resolvedMode);

        // Apply Variant
        if (variant !== "default") {
            root.classList.add(`theme-${variant}`);
        }

        localStorage.setItem("theme-variant", variant);
        localStorage.setItem("theme-mode", mode);
    }, [variant, mode]);

    return (
        <ThemeContext.Provider value={{ variant, setVariant, mode, setMode }}>
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
