import { useState, useEffect, useCallback } from "react";
import API_BASE_URL from "@/lib/api";

export interface HomePageConfig {
  // Hero Section
  heroBadgeText: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDescription: string;

  // Action Bar / URL Input
  inputPlaceholder: string;
  generateButtonText: string;
  helperText: string;
  manualLinkText: string;

  // How It Works Steps
  stepsHeading: string;
  step1: string;
  step2: string;
  step3: string;

  // Right Visual Mockup Cards
  videoImageUrl: string;
  videoBadge: string;
  notesBadge: string;
  assistantMessage: string;
  assistantBtn1: string;
  assistantBtn2: string;

  // Display Options
  showFloatingCards: boolean;
  showAuroraGlow: boolean;
}

export const DEFAULT_HOME_CONFIG: HomePageConfig = {
  heroBadgeText: "The Second Brain for YouTube",
  heroTitlePrefix: "Understand ",
  heroTitleHighlight: "YouTube Videos.",
  heroDescription: "Don't waste time watching long videos. Paste a YouTube link below and get easy-to-read notes instantly.",
  
  inputPlaceholder: "Paste YouTube link here...",
  generateButtonText: "Generate",
  helperText: "Auto-fetch not working?",
  manualLinkText: "Paste transcript manually",

  stepsHeading: "HOW IT WORKS:",
  step1: "Copy any YouTube video link.",
  step2: "Paste it in the box above.",
  step3: "Read your AI-generated notes!",

  videoImageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
  videoBadge: "Study Video",
  notesBadge: "Done",
  assistantMessage: "I've extracted 3 key concepts from the lecture. Would you like a quick quiz?",
  assistantBtn1: "Yes, Quiz me",
  assistantBtn2: "Summarize it",

  showFloatingCards: true,
  showAuroraGlow: true,
};

const STORAGE_KEY = "scriptmind-homepage-config";
const CONFIG_UPDATE_EVENT = "scriptmind-homepage-config-updated";

export function useHomeContent() {
  const [config, setConfig] = useState<HomePageConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_HOME_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse error
    }
    return DEFAULT_HOME_CONFIG;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync from backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/settings/homepage`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && isMounted) {
            const merged = { ...DEFAULT_HOME_CONFIG, ...data };
            setConfig(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch {
        // Backend endpoint not active, fallback to localStorage
      }
    };

    fetchRemoteConfig();

    // Listen for local updates across components or tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setConfig({ ...DEFAULT_HOME_CONFIG, ...JSON.parse(e.newValue) });
        } catch { /* ignore */ }
      }
    };

    const handleCustomUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setConfig({ ...DEFAULT_HOME_CONFIG, ...JSON.parse(saved) });
        }
      } catch { /* ignore */ }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(CONFIG_UPDATE_EVENT, handleCustomUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(CONFIG_UPDATE_EVENT, handleCustomUpdate);
    };
  }, []);

  // Save new configuration
  const saveConfig = useCallback(async (newConfig: HomePageConfig) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      // Save locally first for instant real-time sync
      setConfig(newConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      window.dispatchEvent(new Event(CONFIG_UPDATE_EVENT));

      // Attempt remote backend persistence
      if (token) {
        await fetch(`${API_BASE_URL}/admin/settings/homepage`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newConfig),
        }).catch(() => {
          // Local storage already has it
        });
      }
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Reset to original defaults
  const resetDefaults = useCallback(async () => {
    return saveConfig(DEFAULT_HOME_CONFIG);
  }, [saveConfig]);

  return {
    config,
    saveConfig,
    resetDefaults,
    isLoading,
    isSaving,
    DEFAULT_HOME_CONFIG,
  };
}
