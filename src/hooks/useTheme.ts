
import { useTheme as useThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  const { mode, setMode, variant, setVariant } = useThemeContext();

  return {
    theme: mode,
    setTheme: setMode,
    variant,
    setVariant,
    toggleTheme: () => setMode(mode === "light" ? "dark" : "light")
  };
}
