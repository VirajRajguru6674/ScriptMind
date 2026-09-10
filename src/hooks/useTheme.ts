import { useTheme as useThemeContext, ThemeMode, ThemeVariant } from "@/context/ThemeContext";
import API_BASE_URL from "@/lib/api";

export function useTheme() {
  const { mode, setMode, variant, setVariant, customColor, setCustomColor } = useThemeContext();

  const syncBackend = (newMode: ThemeMode, newVariant: ThemeVariant) => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/user/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme_mode: newMode, theme_variant: newVariant }),
      }).catch(() => {});
    }
  };

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    syncBackend(newMode, variant);
  };

  const handleSetVariant = (newVariant: ThemeVariant) => {
    setVariant(newVariant);
    syncBackend(mode, newVariant);
  };

  const handleSetCustomColor = (newColor: string) => {
    setCustomColor(newColor);
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/user/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme_mode: mode, theme_variant: "custom", custom_color: newColor }),
      }).catch(() => {});
    }
  };

  const handleToggleTheme = () => {
    const nextMode: ThemeMode = mode === "light" ? "dark" : "light";
    handleSetMode(nextMode);
  };

  return {
    theme: mode,
    setTheme: handleSetMode,
    variant,
    setVariant: handleSetVariant,
    customColor,
    setCustomColor: handleSetCustomColor,
    toggleTheme: handleToggleTheme
  };
}
