import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import {
  Monitor,
  Moon,
  Sun,
  Info,
  ArrowLeft,
  Palette,
  Sparkles,
  Shield,
  ChevronRight,
  Loader2,
  BarChart3,
  KeyRound,
  HelpCircle,
  FileText,
  Keyboard,
  Edit,
  Save,
  X,
  Camera,
  User,
  Crown,
  CheckCircle2,
  Mail,
  MapPin,
  Calendar,
  Phone,
  AtSign,
  Download,
  Lock,
  Globe,
  Trash2,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Pipette,
  Zap,
  GraduationCap,
  MessageSquare,
  Briefcase,
  BookOpen,
  Scale,
} from "lucide-react";
import API_BASE_URL from "@/lib/api";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { ScriptMindLogo } from "@/components/ScriptMindLogo";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaletteCustomizer } from "@/components/PaletteCustomizer";



const SHORTCUTS = [
  { keys: ["Ctrl", "K"], action: "Focus search / URL" },
  { keys: ["Ctrl", "Enter"], action: "Generate notes" },
  { keys: ["Ctrl", "C"], action: "Copy notes" },
  { keys: ["Ctrl", "P"], action: "Print notes" },
];

interface UserPrefs {
  ai_tone?: string;
  ai_detail_level?: string;
  ai_language?: string;
}

const AI_TONES = [
  { value: "educational", label: "Educational", desc: "Clear, structured & instructive", icon: GraduationCap, badge: "Popular" },
  { value: "casual", label: "Casual", desc: "Friendly & conversational tone", icon: MessageSquare, badge: null },
  { value: "formal", label: "Formal", desc: "Professional & structured style", icon: Briefcase, badge: null },
  { value: "concise", label: "Concise", desc: "Short, punchy & direct to points", icon: Zap, badge: "Quick" },
];

const AI_DETAIL_LEVELS = [
  { 
    value: "concise", 
    label: "Concise", 
    desc: "Key bullets & executive highlights only", 
    icon: Zap, 
    levelBadge: "2-Min Read",
    bars: 1
  },
  { 
    value: "balanced", 
    label: "Balanced", 
    desc: "Core takeaways with context & examples", 
    icon: Scale, 
    levelBadge: "Recommended",
    bars: 2
  },
  { 
    value: "detailed", 
    label: "Detailed", 
    desc: "Exhaustive deep dive with full explanations", 
    icon: BookOpen, 
    levelBadge: "In-Depth",
    bars: 3
  },
];

const AI_LANGUAGES = [
  { value: "en", label: "English", native: "English", flag: "🇺🇸" },
  { value: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { value: "mr", label: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { value: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { value: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { value: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
];

const Settings = () => {
  const { clearHistory } = useNotesHistory();
  const { theme, setTheme, variant, setVariant, customColor, setCustomColor } = useTheme();
  const { user, isAuthenticated, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [profile, setProfile] = useState<{
    username?: string;
    email?: string;
    plan?: string;
    avatar_url?: string;
    full_name?: string;
    bio?: string;
    phone?: string;
    location?: string;
    date_of_birth?: string;
    usage_count?: number;
    usage_limit?: number;
    downloads_count?: number;
    total_notes?: number;
    created_at?: string;
  } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ 
    username: "", 
    email: "", 
    avatar_url: "",
    full_name: "",
    bio: "",
    phone: "",
    location: "",
    date_of_birth: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "general";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location.search]);
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("reducedMotion") === "true");
  const [prefs, setPrefs] = useState<UserPrefs>({ ai_tone: "educational", ai_detail_level: "detailed", ai_language: "en" });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(theme);
  const [pendingVariant, setPendingVariant] = useState(variant);
  const [pendingCustomColor, setPendingCustomColor] = useState(customColor || "#ec4899");
  const colorPickerInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex;
          setPendingCustomColor(hex);
          setCustomColor(hex);
          setPendingVariant("custom");
          setVariant("custom");
          toast({
            title: "Color Sampled",
            description: `Applied ${hex.toUpperCase()} from your screen.`,
          });
        }
      } catch {
        // User dismissed eye dropper
      }
    }
  };

  // Keep pending theme/variant synced with active theme
  useEffect(() => {
    setPendingTheme(theme);
  }, [theme]);

  useEffect(() => {
    setPendingVariant(variant);
  }, [variant]);

  useEffect(() => {
    if (customColor) setPendingCustomColor(customColor);
  }, [customColor]);

  useEffect(() => {
    const motion = localStorage.getItem("reducedMotion") === "true";
    document.documentElement.classList.toggle("reduce-motion", motion);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token || !isAuthenticated) {
        setLoadingPrefs(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditedProfile({
            username: data.username || "",
            email: data.email || "",
            avatar_url: data.avatar_url || "",
            full_name: data.full_name || "",
            bio: data.bio || "",
            phone: data.phone || "",
            location: data.location || "",
            date_of_birth: data.date_of_birth || "",
          });
          setPrefs({
            ai_tone: data.ai_tone || "educational",
            ai_detail_level: data.ai_detail_level || "detailed",
            ai_language: data.ai_language || "en",
          });

          // Only adopt server theme if user hasn't explicitly set a local preference on this device
          const localMode = localStorage.getItem("theme-mode");
          const localVariant = localStorage.getItem("theme-variant");

          if (!localMode && data.theme_mode) {
            setTheme(data.theme_mode as "light" | "dark" | "system");
            setPendingTheme(data.theme_mode as "light" | "dark" | "system");
          } else {
            setPendingTheme(theme);
          }

          if (!localVariant && data.theme_variant) {
            setVariant(data.theme_variant as "default" | "forest" | "sunset" | "ocean" | "golden");
            setPendingVariant(data.theme_variant as "default" | "forest" | "sunset" | "ocean" | "golden");
          } else {
            setPendingVariant(variant);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingPrefs(false);
      }
    };
    loadProfile();
  }, [isAuthenticated]);

  const savePref = async (key: keyof UserPrefs, value: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingPrefs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setPrefs((p) => ({ ...p, [key]: value }));
        toast({ title: "Preferences saved" });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to save preferences" });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveAppearance = async () => {
    const targetMode = (pendingTheme || theme || "dark") as "light" | "dark" | "system";
    const targetVariant = (pendingVariant || variant || "default") as "default" | "forest" | "sunset" | "ocean" | "golden" | "custom";

    // 1. Immediately apply and save to device local storage
    setTheme(targetMode);
    if (targetVariant === "custom") {
      setCustomColor(pendingCustomColor);
      localStorage.setItem("theme-custom-color", pendingCustomColor);
    }
    setVariant(targetVariant);
    localStorage.setItem("theme-mode", targetMode);
    localStorage.setItem("theme-variant", targetVariant);

    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) {
      toast({ title: "Saved", description: "Appearance saved to this device." });
      return;
    }

    // 2. Synchronize to user cloud profile
    setSavingAppearance(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme_mode: targetMode, theme_variant: targetVariant }),
      });

      if (res.ok) {
        toast({ title: "Saved & Synced", description: "Appearance preferences saved and applied across devices." });
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          toast({
            title: "Saved Locally",
            description: "Appearance saved to this device. Please log in again to sync across devices."
          });
        } else {
          toast({
            title: "Saved Locally",
            description: data.error ? `Appearance saved to this device (${data.error}).` : "Appearance saved to this device."
          });
        }
      }
    } catch {
      toast({
        title: "Saved Locally",
        description: "Appearance saved to this device. Cloud sync is currently offline."
      });
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleReducedMotion = (checked: boolean) => {
    setReducedMotion(checked);
    localStorage.setItem("reducedMotion", String(checked));
    document.documentElement.classList.toggle("reduce-motion", checked);
    toast({ title: checked ? "Reduced motion enabled" : "Reduced motion disabled" });
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    const currentAvatar = profile?.avatar_url || user?.avatar_url || "";
    setEditedProfile({
      username: profile?.username || user?.username || "",
      email: profile?.email || user?.email || "",
      avatar_url: currentAvatar,
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      date_of_birth: profile?.date_of_birth || "",
    });
    setAvatarPreview(currentAvatar || null);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedProfile({
      username: profile?.username || user?.username || "",
      email: profile?.email || user?.email || "",
      avatar_url: profile?.avatar_url || "",
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      date_of_birth: profile?.date_of_birth || "",
    });
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setEditedProfile({ ...editedProfile, avatar_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editedProfile.username,
          // email is readonly, don't send it for update
          avatar_url: editedProfile.avatar_url,
          full_name: editedProfile.full_name,
          bio: editedProfile.bio,
          phone: editedProfile.phone,
          location: editedProfile.location,
          date_of_birth: editedProfile.date_of_birth,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await res.json();
      setProfile((prev) => ({ ...prev, ...data.user }));
      setIsEditingProfile(false);
      setAvatarPreview(null);
      
      // Update AuthContext user if available
      if (data.user) {
        updateUser({
          username: data.user.username,
          email: data.user.email,
          avatar_url: data.user.avatar_url,
        });
      }

      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      clearHistory();
      setClearDialogOpen(false);
      toast({ title: "History cleared" });
    } finally {
      setClearing(false);
    }
  };

  function hexToHsl(hex: string): string {
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
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexToHue(hex: string): number {
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
    let h = 0;
    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return Math.round(h * 360);
  }

  const paletteOptions = [
    { 
      id: "default", 
      label: "Indigo", 
      subtitle: "Royal Purple",
      color: "bg-[#6366f1]",
      gradient: "from-[#8b5cf6] via-[#6366f1] to-[#4f46e5]",
      glowClass: "shadow-indigo-500/25",
      ringColor: "ring-[#8b5cf6]",
      activeBorder: "border-[#8b5cf6]",
      accentText: "text-[#8b5cf6]",
      hex: "#6366F1",
      badge: "Default"
    },
    { 
      id: "forest", 
      label: "Forest", 
      subtitle: "Emerald Mint",
      color: "bg-[#2e7d32]",
      gradient: "from-[#10b981] via-[#059669] to-[#047857]",
      glowClass: "shadow-emerald-500/25",
      ringColor: "ring-[#10b981]",
      activeBorder: "border-[#10b981]",
      accentText: "text-[#10b981]",
      hex: "#10B981",
      badge: "Organic"
    },
    { 
      id: "sunset", 
      label: "Sunset", 
      subtitle: "Warm Amber",
      color: "bg-[#B45309]",
      gradient: "from-[#f59e0b] via-[#d97706] to-[#b45309]",
      glowClass: "shadow-amber-500/25",
      ringColor: "ring-[#f59e0b]",
      activeBorder: "border-[#f59e0b]",
      accentText: "text-[#f59e0b]",
      hex: "#F59E0B",
      badge: "Warm"
    },
    { 
      id: "ocean", 
      label: "Ocean", 
      subtitle: "Coral Flare",
      color: "bg-[#e05d38]",
      gradient: "from-[#f97316] via-[#e05d38] to-[#c2410c]",
      glowClass: "shadow-orange-500/25",
      ringColor: "ring-[#e05d38]",
      activeBorder: "border-[#e05d38]",
      accentText: "text-[#e05d38]",
      hex: "#E05D38",
      badge: "Vibrant"
    },
    { 
      id: "golden", 
      label: "Golden", 
      subtitle: "Solar Gold",
      color: "bg-[#f59e0b]",
      gradient: "from-[#facc15] via-[#eab308] to-[#ca8a04]",
      glowClass: "shadow-yellow-500/25",
      ringColor: "ring-[#facc15]",
      activeBorder: "border-[#facc15]",
      accentText: "text-[#facc15]",
      hex: "#FACC15",
      badge: "Luxe"
    },
  ];

  return (
    <>
      <Helmet>
        <title>Settings - ScriptMind</title>
      </Helmet>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden font-sans selection:bg-primary/20">
        {/* Top Navbar */}
        <header className="h-16 border-b border-sidebar-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight flex items-center gap-1.5">
                <span className="text-foreground">Settings</span>
                <span className="text-primary/70 font-semibold">&</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">Preferences</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationPanel />
            <PaletteCustomizer />
            <ThemeToggle />
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col md:flex-row min-w-0 h-full overflow-hidden">
          {/* Settings Sidebar Navigation (Pinned to Left on Desktop/Laptop) */}
          <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-sidebar-border/50 bg-card/40 backdrop-blur-xl p-4 sm:p-5 flex-col shrink-0 justify-between z-10 animate-in slide-in-from-left-4 duration-300">
            <div className="space-y-4">
              {/* Navigation Items */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 mb-2">Configuration</p>
                {[
                  { id: "general", icon: User, label: "Account Profile" },
                  { id: "appearance", icon: Palette, label: "Appearance & Theme" },
                  { id: "ai", icon: Sparkles, label: "AI Engine & Notes" },
                  { id: "account", icon: BarChart3, label: "Usage & Limits" },
                  { id: "data", icon: Shield, label: "Security & Data" },
                  { id: "about", icon: Info, label: "About ScriptMind" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 group text-xs font-bold",
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 translate-x-1"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-110", activeTab === item.id && "scale-110")} />
                    <span className="truncate">{item.label}</span>
                    {activeTab === item.id && <ChevronRight className="ml-auto size-3.5 opacity-75 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Upgrade Pill in Sidebar */}
            <div className="pt-4 border-t border-border/40 space-y-2">
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Crown className="size-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-black text-foreground capitalize truncate">{(profile?.plan || user?.plan || "free")} Plan</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-[10px] font-bold text-primary hover:text-primary">
                  <Link to="/pricing">Upgrade</Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Mobile Tab Navigation Strip (Visible on mobile/tablet < md) */}
          <div className="md:hidden border-b border-sidebar-border/50 bg-card/70 backdrop-blur-md px-3 py-2 shrink-0 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            {[
              { id: "general", icon: User, label: "Profile" },
              { id: "appearance", icon: Palette, label: "Theme" },
              { id: "ai", icon: Sparkles, label: "AI Engine" },
              { id: "account", icon: BarChart3, label: "Usage" },
              { id: "data", icon: Shield, label: "Security" },
              { id: "about", icon: Info, label: "About" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Scrollable Content Viewport */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
              
              {/* TAB 1: ACCOUNT PROFILE */}
              <TabsContent value="general" className="space-y-6 outline-none animate-in fade-in duration-300">
                {!isAuthenticated ? (
                  <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl p-12 text-center space-y-4">
                    <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                      <User className="size-8" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Sign in to manage your profile</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Log in to access your personal settings, customize your AI notes experience, and manage subscription limits.
                    </p>
                    <Button asChild className="rounded-xl font-bold">
                      <Link to="/login">Sign In Now</Link>
                    </Button>
                  </Card>
                ) : (() => {
                  const currentPlan = (profile?.plan || user?.plan || "free").toLowerCase();
                  const isProOrExpert = currentPlan === "pro" || currentPlan === "expert" || currentPlan === "organization";
                  
                  return (
                    <div className="space-y-6">
                      {/* Clean Profile Header Card */}
                      <Card className="border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm rounded-2xl sm:rounded-3xl p-6 sm:p-7">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-4 sm:gap-5">
                            {/* Avatar */}
                            <div className="relative group shrink-0">
                              <div className="size-16 sm:size-20 rounded-2xl border border-border/80 bg-secondary/80 flex items-center justify-center text-foreground font-black text-2xl relative overflow-hidden shadow-inner">
                                {avatarPreview || profile?.avatar_url || user?.avatar_url ? (
                                  <img
                                    src={avatarPreview || profile?.avatar_url || user?.avatar_url}
                                    alt="Profile avatar"
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl sm:text-2xl font-black text-foreground">
                                    {(profile?.username || user?.username || "U").charAt(0).toUpperCase()}
                                  </span>
                                )}

                                {/* Camera Upload Overlay */}
                                <label
                                  htmlFor="avatar-upload-main"
                                  className="absolute inset-0 bg-background/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-foreground cursor-pointer transition-all duration-200"
                                  title="Upload photo"
                                >
                                  <Camera className="size-4 mb-0.5 text-muted-foreground" />
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                                  <input
                                    id="avatar-upload-main"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                  />
                                </label>
                              </div>

                              {/* Active Status Dot */}
                              <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-emerald-500 ring-2 ring-card flex items-center justify-center">
                                <span className="size-1.5 rounded-full bg-white" />
                              </span>
                            </div>

                            {/* User Identity Info */}
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-1.5">
                                  {profile?.full_name || profile?.username || user?.username || "Account User"}
                                  <span title="Verified Account" className="inline-flex shrink-0">
                                    <CheckCircle2 className="size-4 text-emerald-500 inline" />
                                  </span>
                                </h2>
                                {user?.role === 'admin' ? (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <Crown className="size-3 text-amber-500" />
                                    {currentPlan} Member
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground/75">
                                  @{profile?.username || user?.username || "user"}
                                </span>

                                <span className="text-border">•</span>

                                <button
                                  onClick={() => {
                                    if (profile?.email || user?.email) {
                                      navigator.clipboard.writeText(profile?.email || user?.email || "");
                                      setCopiedEmail(true);
                                      toast({ title: "Copied!", description: "Email copied to clipboard." });
                                      setTimeout(() => setCopiedEmail(false), 2000);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                                  title="Click to copy email"
                                >
                                  <Mail className="size-3.5 text-muted-foreground" />
                                  <span>{profile?.email || user?.email}</span>
                                  {copiedEmail ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>

                                {profile?.location && (
                                  <>
                                    <span className="text-border">•</span>
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="size-3.5 text-muted-foreground" />
                                      {profile.location}
                                    </span>
                                  </>
                                )}

                                <span className="text-border">•</span>

                                <span className="flex items-center gap-1.5">
                                  <Calendar className="size-3.5 text-muted-foreground" />
                                  Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : "Recently"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                            {!isEditingProfile ? (
                              <>
                                <Button
                                  onClick={handleEditProfile}
                                  variant="outline"
                                  className="h-9 px-4 rounded-xl text-xs font-semibold border-border/80 hover:bg-secondary/60 gap-1.5 flex-1 sm:flex-initial"
                                >
                                  <Edit className="size-3.5" />
                                  <span>Edit Profile</span>
                                </Button>
                                <Button
                                  asChild
                                  className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 flex-1 sm:flex-initial shadow-sm"
                                >
                                  <Link to="/pricing">
                                    <Crown className="size-3.5" />
                                    <span>Upgrade</span>
                                  </Link>
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={savingProfile}
                                  className="h-9 px-4 rounded-xl text-xs font-semibold gap-1.5"
                                >
                                  <X className="size-3.5" />
                                  <span>Cancel</span>
                                </Button>
                                <Button
                                  onClick={handleSaveProfile}
                                  disabled={savingProfile}
                                  className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm gap-1.5"
                                >
                                  {savingProfile ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                                  <span>Save Changes</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      {/* 4 Stat Highlight Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 space-y-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Subscription</span>
                            <Crown className="size-4 text-amber-500" />
                          </div>
                          <p className="text-xl font-black text-foreground capitalize">{currentPlan} Tier</p>
                          <p className="text-[11px] text-muted-foreground">{isProOrExpert ? "Unlimited AI Summaries" : "Standard Limit • 5 Notes"}</p>
                        </Card>

                        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 space-y-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Notes Created</span>
                            <FileText className="size-4 text-blue-500" />
                          </div>
                          <p className="text-xl font-black text-foreground">{profile?.total_notes || profile?.usage_count || 0}</p>
                          <p className="text-[11px] text-muted-foreground">Generated study guides</p>
                        </Card>

                        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 space-y-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Media Downloads</span>
                            <Download className="size-4 text-purple-500" />
                          </div>
                          <p className="text-xl font-black text-foreground">{profile?.downloads_count || 0}</p>
                          <p className="text-[11px] text-muted-foreground">{isProOrExpert ? "1080p & 4K UHD Unlocked" : "720p HD Standard"}</p>
                        </Card>

                        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4 space-y-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Security Status</span>
                            <Shield className="size-4 text-emerald-500" />
                          </div>
                          <p className="text-xl font-black text-emerald-500 flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Verified & Active
                          </p>
                          <p className="text-[11px] text-muted-foreground">Encrypted workspace</p>
                        </Card>
                      </div>

                      {/* Personal Information Card */}
                      <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                <User className="size-4 text-primary" />
                                Personal Details
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground">
                                Your personal identity and contact information
                              </CardDescription>
                            </div>
                            {!isEditingProfile && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEditProfile}
                                className="h-8 px-3.5 rounded-xl text-xs font-semibold border-border/80 hover:bg-secondary/60 gap-1.5"
                              >
                                <Edit className="size-3" />
                                Edit Details
                              </Button>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="p-0">
                          {!isEditingProfile ? (
                            <div className="divide-y divide-border/40">
                              {/* 2-Column Divided Settings Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                                {/* Left Column */}
                                <div className="divide-y divide-border/40">
                                  {/* Full Name */}
                                  <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3.5">
                                      <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <User className="size-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-medium text-muted-foreground">Full Name</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {profile?.full_name || <span className="text-muted-foreground/50 font-normal">Not set</span>}
                                        </p>
                                      </div>
                                    </div>
                                    {!profile?.full_name && (
                                      <button
                                        onClick={handleEditProfile}
                                        className="text-xs font-semibold text-primary hover:underline"
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </div>

                                  {/* Username */}
                                  <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3.5">
                                      <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <AtSign className="size-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-medium text-muted-foreground">Username</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          @{profile?.username || user?.username || "user"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Email Address */}
                                  <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3.5">
                                      <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Mail className="size-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-medium text-muted-foreground">Email Address</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {profile?.email || user?.email}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      Verified
                                    </span>
                                  </div>
                                </div>

                                {/* Right Column */}
                                <div className="divide-y divide-border/40">
                                  {/* Phone Number */}
                                  <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3.5">
                                      <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Phone className="size-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-medium text-muted-foreground">Phone Number</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {profile?.phone || <span className="text-muted-foreground/50 font-normal">Not set</span>}
                                        </p>
                                      </div>
                                    </div>
                                    {!profile?.phone && (
                                      <button
                                        onClick={handleEditProfile}
                                        className="text-xs font-semibold text-primary hover:underline"
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </div>

                                  {/* Location */}
                                  <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3.5">
                                      <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <MapPin className="size-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-medium text-muted-foreground">Location</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {profile?.location || <span className="text-muted-foreground/50 font-normal">Not set</span>}
                                        </p>
                                      </div>
                                    </div>
                                    {!profile?.location && (
                                      <button
                                        onClick={handleEditProfile}
                                        className="text-xs font-semibold text-primary hover:underline"
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </div>

                                  {/* Date of Birth */}
                                  <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-center gap-3.5">
                                      <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0">
                                        <Calendar className="size-3.5" />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-medium text-muted-foreground">Date of Birth</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'PP') : <span className="text-muted-foreground/50 font-normal">Not set</span>}
                                        </p>
                                      </div>
                                    </div>
                                    {!profile?.date_of_birth && (
                                      <button
                                        onClick={handleEditProfile}
                                        className="text-xs font-semibold text-primary hover:underline"
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Bio Row at bottom */}
                              <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-muted/10 transition-colors">
                                <div className="flex items-start gap-3.5 flex-1">
                                  <div className="size-8 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                                    <FileText className="size-3.5" />
                                  </div>
                                  <div className="space-y-0.5 flex-1">
                                    <p className="text-[11px] font-medium text-muted-foreground">Bio / About</p>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      {profile?.bio || <span className="text-muted-foreground/50 font-normal">No personal bio written yet. Introduce yourself to your team or collaborators.</span>}
                                    </p>
                                  </div>
                                </div>
                                {!profile?.bio && (
                                  <button
                                    onClick={handleEditProfile}
                                    className="text-xs font-semibold text-primary hover:underline shrink-0 pt-0.5"
                                  >
                                    + Add Bio
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 space-y-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                  <Label htmlFor="username" className="text-xs font-bold text-muted-foreground">Username</Label>
                                  <Input
                                    id="username"
                                    value={editedProfile.username}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                                    className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                                    placeholder="Username"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="email" className="text-xs font-bold text-muted-foreground">Email (Permanent)</Label>
                                  <Input
                                    id="email"
                                    value={editedProfile.email}
                                    disabled
                                    className="h-10 text-xs rounded-xl bg-muted/40 border-border/40 text-muted-foreground cursor-not-allowed"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="full_name" className="text-xs font-bold text-muted-foreground">Full Name</Label>
                                  <Input
                                    id="full_name"
                                    value={editedProfile.full_name}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                                    className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                                    placeholder="Your full name"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground">Phone Number</Label>
                                  <Input
                                    id="phone"
                                    value={editedProfile.phone}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                    className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                                    placeholder="+1 (555) 000-0000"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="location" className="text-xs font-bold text-muted-foreground">Location</Label>
                                  <Input
                                    id="location"
                                    value={editedProfile.location}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                    className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                                    placeholder="City, Country"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label htmlFor="date_of_birth" className="text-xs font-bold text-muted-foreground">Date of Birth</Label>
                                  <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={editedProfile.date_of_birth}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                                    className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="bio" className="text-xs font-bold text-muted-foreground">Bio / About</Label>
                                <Textarea
                                  id="bio"
                                  value={editedProfile.bio}
                                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                  rows={3}
                                  className="text-xs rounded-xl bg-background/70 border-border/80 resize-none"
                                  placeholder="Write a brief introduction about yourself..."
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
                                <Button variant="outline" onClick={handleCancelEdit} disabled={savingProfile} className="h-9 px-4 rounded-xl text-xs font-bold">
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveProfile} disabled={savingProfile} className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                                  {savingProfile ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
                                  Save Profile
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6 animate-in fade-in duration-300">
                {/* Header Studio Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-card/90 via-card/60 to-primary/5 border border-border/70 backdrop-blur-xl shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-inner shrink-0">
                      <Palette className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                        Appearance & Design Studio
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Personalize your workspace contrast, ambient illumination, and signature brand accents.
                      </p>
                    </div>
                  </div>

                  {/* Active Status Beacon */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border/80 text-xs font-bold text-foreground shrink-0 self-start sm:self-auto shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="capitalize">{pendingTheme || theme} Mode</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="capitalize">{pendingVariant || variant} Palette</span>
                  </div>
                </div>

                {/* Section 1: Theme Atmosphere Modes */}
                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2.5">
                          <Monitor className="size-5 text-primary" />
                          <span>Theme Atmosphere</span>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          Select your ambient interface mode for reading, generating notes, and studying.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        {
                          id: "light",
                          label: "Light Mode",
                          subtitle: "Clean daylight contrast",
                          badge: "Crisp",
                          icon: Sun,
                          accentGradient: "from-amber-500/20 to-orange-500/10",
                          iconColor: "text-amber-500",
                          mockBg: "bg-slate-100 border-slate-300/80 text-slate-800",
                          mockHeader: "bg-white border-slate-200",
                          mockLines: "bg-slate-300",
                          mockAccent: "bg-amber-500",
                        },
                        {
                          id: "dark",
                          label: "Dark Mode",
                          subtitle: "Onyx black & neon glow",
                          badge: "Default",
                          icon: Moon,
                          accentGradient: "from-purple-500/20 to-indigo-500/10",
                          iconColor: "text-purple-400",
                          mockBg: "bg-black border-white/10 text-white",
                          mockHeader: "bg-zinc-900 border-white/10",
                          mockLines: "bg-zinc-700",
                          mockAccent: "bg-primary",
                        },
                        {
                          id: "system",
                          label: "System Sync",
                          subtitle: "Tracks OS daylight schedule",
                          badge: "Adaptive",
                          icon: Monitor,
                          accentGradient: "from-blue-500/20 to-cyan-500/10",
                          iconColor: "text-sky-400",
                          mockBg: "bg-gradient-to-r from-slate-100 via-slate-100/50 to-black border-border/80 text-foreground",
                          mockHeader: "bg-background/80 border-border/60",
                          mockLines: "bg-muted-foreground/30",
                          mockAccent: "bg-primary",
                        },
                      ].map((m) => {
                        const currentMode = pendingTheme || theme;
                        const isSelected = currentMode === m.id;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              const newMode = m.id as "light" | "dark" | "system";
                              setPendingTheme(newMode);
                              setTheme(newMode);
                            }}
                            className={cn(
                              "group relative flex flex-col text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20"
                                : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70"
                            )}
                          >
                            {/* Selected Badge */}
                            <div className="flex items-center justify-between w-full mb-3">
                              <div className={cn(
                                "size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                m.accentGradient,
                                m.iconColor
                              )}>
                                <m.icon className="size-4.5" />
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground"
                                )}>
                                  {m.badge}
                                </span>
                                {isSelected && (
                                  <span className="size-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
                                    <Check className="size-3 stroke-[3]" />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Mini UI Simulation Window */}
                            <div className={cn("w-full h-24 rounded-xl border p-2.5 flex flex-col justify-between mb-3 shadow-inner overflow-hidden", m.mockBg)}>
                              <div className={cn("h-4 rounded-lg px-2 flex items-center justify-between border", m.mockHeader)}>
                                <div className="flex items-center gap-1">
                                  <div className="size-1.5 rounded-full bg-rose-500/80" />
                                  <div className="size-1.5 rounded-full bg-amber-500/80" />
                                  <div className="size-1.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <div className={cn("h-1.5 w-12 rounded-full", m.mockLines)} />
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <div className={cn("h-2 w-16 rounded-full", m.mockAccent)} />
                                  <div className={cn("h-1.5 w-8 rounded-full", m.mockLines)} />
                                </div>
                                <div className={cn("h-1.5 w-full rounded-full opacity-60", m.mockLines)} />
                                <div className={cn("h-1.5 w-4/5 rounded-full opacity-40", m.mockLines)} />
                              </div>
                            </div>

                            {/* Mode Text & Description */}
                            <h3 className={cn(
                              "text-sm font-black transition-colors leading-tight",
                              isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                            )}>
                              {m.label}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {m.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Brand Palette Accents */}
                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 px-4 py-3 sm:px-5 sm:py-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                          <Palette className="size-4 text-primary" />
                          <span>Brand Accent Palette</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Signature hue applied to action buttons, glowing borders, active tabs, and key metrics.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                      {paletteOptions.map((v) => {
                        const currentVar = pendingVariant || variant;
                        const isSelected = currentVar === v.id;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              const newVar = v.id as "default" | "forest" | "sunset" | "ocean" | "golden" | "custom";
                              setPendingVariant(newVar);
                              setVariant(newVar);
                            }}
                            className={cn(
                              "group relative flex flex-col items-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden",
                              isSelected
                                ? cn("border-primary bg-primary/5 shadow-sm shadow-primary/10 ring-2 ring-primary/25 scale-[1.02]")
                                : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70 hover:scale-[1.01]"
                            )}
                          >
                            {/* Color Orb with ambient aura */}
                            <div className="relative mb-2 mt-0.5">
                              <div className={cn(
                                "size-8 sm:size-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105",
                                v.gradient,
                                v.glowClass
                              )}>
                                {isSelected ? (
                                  <Check className="size-4 stroke-[2.5] drop-shadow-xs" />
                                ) : (
                                  <div className="size-1.5 rounded-full bg-white/50" />
                                )}
                              </div>
                            </div>

                            {/* Palette Name */}
                            <h3 className={cn(
                              "text-xs font-bold tracking-tight transition-colors leading-tight text-center",
                              isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                            )}>
                              {v.label}
                            </h3>

                            {/* Subtitle & Hex */}
                            <p className="text-[10px] text-muted-foreground mt-0.5 text-center font-medium leading-tight truncate w-full">
                              {v.subtitle}
                            </p>

                            {/* Mini Action Preview Tag */}
                            <div className={cn(
                              "w-full mt-2 py-0.5 px-1 rounded-md text-[9px] font-bold text-center text-white bg-gradient-to-r shadow-2xs transition-opacity",
                              v.gradient,
                              isSelected ? "opacity-100" : "opacity-75 group-hover:opacity-100"
                            )}>
                              {v.hex}
                            </div>
                          </button>
                        );
                      })}

                      {/* 6th Card: Customizable Color Palette */}
                      {(() => {
                        const isCustom = (pendingVariant || variant) === "custom";

                        return (
                          <div
                            onClick={() => {
                              setPendingVariant("custom");
                              setVariant("custom");
                              setCustomColor(pendingCustomColor);
                            }}
                            className={cn(
                              "group relative flex flex-col items-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden text-center",
                              isCustom
                                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10 ring-2 ring-primary/25 scale-[1.02]"
                                : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70 hover:scale-[1.01]"
                            )}
                          >
                            {/* Color Orb with ambient aura & direct color picker input */}
                            <div className="relative mb-2 mt-0.5">
                              <label
                                onClick={(e) => e.stopPropagation()}
                                className="size-8 sm:size-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105 relative overflow-hidden cursor-pointer"
                                style={{
                                  backgroundColor: pendingCustomColor,
                                  boxShadow: `0 8px 20px -4px ${pendingCustomColor}55`,
                                }}
                                title="Click to choose custom color"
                              >
                                {isCustom ? (
                                  <Check className="size-4 stroke-[2.5] drop-shadow-xs pointer-events-none" />
                                ) : (
                                  <Pipette className="size-3.5 drop-shadow-xs pointer-events-none" />
                                )}
                                <input
                                  type="color"
                                  value={pendingCustomColor}
                                  onChange={(e) => {
                                    const newColor = e.target.value;
                                    setPendingCustomColor(newColor);
                                    setCustomColor(newColor);
                                    setPendingVariant("custom");
                                    setVariant("custom");
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                                />
                              </label>
                            </div>

                            {/* Palette Name */}
                            <h3 className={cn(
                              "text-xs font-bold tracking-tight transition-colors leading-tight",
                              isCustom ? "text-primary" : "text-foreground group-hover:text-primary"
                            )}>
                              Custom
                            </h3>

                            {/* Subtitle */}
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-tight truncate w-full">
                              Pick Any Color
                            </p>

                            {/* Interactive Mini Hex / Picker Trigger Pill */}
                            <label
                              onClick={(e) => e.stopPropagation()}
                              className="w-full mt-2 py-0.5 px-1 rounded-md text-[9px] font-black text-center text-white shadow-2xs uppercase tracking-wider transition-all font-mono truncate cursor-pointer flex items-center justify-center gap-1 hover:brightness-110 active:scale-95"
                              style={{ backgroundColor: pendingCustomColor }}
                            >
                              <Pipette className="size-2.5 shrink-0 pointer-events-none" />
                              <span className="pointer-events-none">{pendingCustomColor.toUpperCase()}</span>
                              <input
                                type="color"
                                value={pendingCustomColor}
                                onChange={(e) => {
                                  const newColor = e.target.value;
                                  setPendingCustomColor(newColor);
                                  setCustomColor(newColor);
                                  setPendingVariant("custom");
                                  setVariant("custom");
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                            </label>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Interactive Custom Color Studio Tuner Bar (appears when Custom is selected) */}
                    {((pendingVariant || variant) === "custom") && (
                      <div className="mt-5 p-5 rounded-2xl bg-card/75 border border-primary/40 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Header with live moving preview button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="size-6 rounded-full shadow-md border-2 border-white/60 shrink-0 transition-transform duration-200"
                              style={{ backgroundColor: pendingCustomColor }}
                            />
                            <div>
                              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                                <span>Custom Color Studio & Rainbow Spectrum</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground shadow-xs">
                                  Live Real-Time
                                </span>
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                Slide across the full rainbow spectrum, launch the color picker, or enter your signature hex code.
                              </p>
                            </div>
                          </div>

                          {/* Moving Interactive Live Preview Button */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="h-10 px-5 rounded-xl text-xs font-black text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                              style={{
                                backgroundColor: pendingCustomColor,
                                boxShadow: `0 10px 25px -4px ${pendingCustomColor}80`,
                              }}
                              title="Interactive Moving Preview Button"
                            >
                              <Sparkles className="size-4" />
                              <span>Live Button Preview</span>
                            </button>
                          </div>
                        </div>

                        {/* Rainbow Spectrum Hue Slider (Drag to move & change color live!) */}
                        <div className="space-y-2 p-3.5 rounded-xl bg-background/80 border border-border/80 shadow-inner">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Palette className="size-3.5 text-primary" />
                              <span>Rainbow Hue Spectrum (Slide to adjust tone)</span>
                            </span>
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md text-foreground bg-secondary">
                              Hue: {hexToHue(pendingCustomColor)}°
                            </span>
                          </div>

                          <div className="relative py-1">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={hexToHue(pendingCustomColor)}
                              onChange={(e) => {
                                const hue = Number(e.target.value);
                                const newHex = hslToHex(hue, 90, 56);
                                setPendingCustomColor(newHex);
                                setCustomColor(newHex);
                                setPendingVariant("custom");
                                setVariant("custom");
                              }}
                              className="w-full h-4 rounded-lg cursor-pointer appearance-none outline-none shadow-sm"
                              style={{
                                background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Primary Color Picker & Manual Controls Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                          {/* 1. Visible Color Picker Button */}
                          <div
                            onClick={() => {
                              colorPickerInputRef.current?.showPicker?.();
                              colorPickerInputRef.current?.click();
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl border-2 border-border/80 bg-card hover:border-primary/60 hover:bg-card shadow-xs cursor-pointer group transition-all"
                          >
                            <div
                              className="size-9 rounded-xl border-2 border-white/40 shadow-sm flex items-center justify-center relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: pendingCustomColor }}
                            >
                              <Pipette className="size-4 text-white drop-shadow pointer-events-none" />
                              <input
                                ref={colorPickerInputRef}
                                type="color"
                                value={pendingCustomColor}
                                onChange={(e) => {
                                  const newColor = e.target.value;
                                  setPendingCustomColor(newColor);
                                  setCustomColor(newColor);
                                  setPendingVariant("custom");
                                  setVariant("custom");
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                                Color Picker
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate">
                                Click to open color wheel
                              </span>
                            </div>
                          </div>

                          {/* 2. Direct Hex Code Input */}
                          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-card shadow-xs">
                            <span className="text-xs font-black text-muted-foreground uppercase">HEX:</span>
                            <input
                              type="text"
                              maxLength={7}
                              value={pendingCustomColor}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingCustomColor(val);
                                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                  setCustomColor(val);
                                  setPendingVariant("custom");
                                  setVariant("custom");
                                }
                              }}
                              className="flex-1 bg-transparent text-sm font-mono font-black uppercase focus:outline-none text-foreground tracking-wider"
                              placeholder="#EC4899"
                            />
                            <div
                              className="size-5 rounded-md border border-white/20 shadow-xs shrink-0"
                              style={{ backgroundColor: pendingCustomColor }}
                            />
                          </div>

                          {/* 3 & 4. Quick Aesthetic Vibes */}
                          <div className="sm:col-span-2 flex items-center gap-2 p-2.5 px-3 rounded-xl border border-border/80 bg-card shadow-xs overflow-x-auto scrollbar-none">
                            <span className="text-[10px] uppercase font-black text-muted-foreground shrink-0 mr-1">Vibes:</span>
                            {[
                              { name: "Neon Rose", hex: "#ec4899" },
                              { name: "Electric Pink", hex: "#f43f5e" },
                              { name: "Cyber Fuchsia", hex: "#d946ef" },
                              { name: "Vivid Purple", hex: "#a855f7" },
                              { name: "Electric Blue", hex: "#3b82f6" },
                              { name: "Neon Cyan", hex: "#06b6d4" },
                              { name: "Emerald Mint", hex: "#10b981" },
                              { name: "Lime Punch", hex: "#84cc16" },
                              { name: "Amber Sun", hex: "#f59e0b" },
                              { name: "Crimson Blaze", hex: "#ef4444" },
                            ].map((swatch) => (
                              <button
                                key={swatch.hex}
                                type="button"
                                title={swatch.name}
                                onClick={() => {
                                  setPendingCustomColor(swatch.hex);
                                  setCustomColor(swatch.hex);
                                  setPendingVariant("custom");
                                  setVariant("custom");
                                }}
                                className={cn(
                                  "size-7 rounded-full transition-transform hover:scale-125 shrink-0 flex items-center justify-center shadow-xs cursor-pointer",
                                  pendingCustomColor.toLowerCase() === swatch.hex.toLowerCase() && "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                                )}
                                style={{ backgroundColor: swatch.hex }}
                              >
                                {pendingCustomColor.toLowerCase() === swatch.hex.toLowerCase() && (
                                  <Check className="size-3.5 text-white stroke-[3]" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 3: Interactive Live Preview Studio */}
                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2.5">
                          <Sparkles className="size-5 text-primary" />
                          <span>Live Studio Preview</span>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          Simulated live rendering of your chosen theme atmosphere and brand colorway.
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Real-time Sync
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Dark Preview Window */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Moon className="size-3.5 text-purple-400" />
                            <span>Dark Atmosphere Preview</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            Pure Onyx
                          </span>
                        </div>

                        <div 
                          className={cn(
                            "dark rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black p-5 text-foreground transition-all duration-300",
                            `theme-${pendingVariant || variant}`
                          )}
                          style={((pendingVariant || variant) === "custom") ? {
                            ['--primary' as any]: hexToHsl(pendingCustomColor),
                            ['--ring' as any]: hexToHsl(pendingCustomColor)
                          } : undefined}
                        >
                          {/* Simulated Mac Dots */}
                          <div className="flex items-center gap-1.5 pb-4 border-b border-white/5">
                            <div className="size-2 rounded-full bg-rose-500/80" />
                            <div className="size-2 rounded-full bg-amber-500/80" />
                            <div className="size-2 rounded-full bg-emerald-500/80" />
                            <span className="text-[10px] font-bold text-zinc-500 ml-2">ScriptMind Studio — Workspace</span>
                          </div>

                          <div className="space-y-3 pt-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-wider">
                              <Sparkles className="size-3" />
                              <span>The Second Brain for YouTube</span>
                            </div>

                            <h3 className="text-base font-black text-white leading-tight">
                              Understand <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">YouTube Videos.</span>
                            </h3>

                            <p className="text-xs text-zinc-400 leading-relaxed">
                              Paste any YouTube playlist or video to generate timestamped structured notes, key takeaways, and flashcards.
                            </p>

                            <div className="rounded-xl bg-zinc-900/90 border border-white/10 p-3 shadow-inner mt-2">
                              <div className="h-8 rounded-lg bg-black/60 text-xs text-zinc-500 flex items-center px-3 border border-white/5">
                                https://youtube.com/watch?v=dQw4w9WgXcQ...
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] shadow-sm">
                                  Generate Notes
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 text-[10px] border border-white/10">
                                  ⚡ 60s Processing
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 text-[10px] border border-white/10">
                                  📄 PDF Export
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Light Preview Window */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Sun className="size-3.5 text-amber-500" />
                            <span>Light Atmosphere Preview</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            High Contrast
                          </span>
                        </div>

                        <div 
                          className={cn(
                            "rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-50 p-5 text-slate-900 transition-all duration-300",
                            `theme-${pendingVariant || variant}`
                          )}
                          style={((pendingVariant || variant) === "custom") ? {
                            ['--primary' as any]: hexToHsl(pendingCustomColor),
                            ['--ring' as any]: hexToHsl(pendingCustomColor)
                          } : undefined}
                        >
                          {/* Simulated Mac Dots */}
                          <div className="flex items-center gap-1.5 pb-4 border-b border-slate-200/80">
                            <div className="size-2 rounded-full bg-rose-400" />
                            <div className="size-2 rounded-full bg-amber-400" />
                            <div className="size-2 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-400 ml-2">ScriptMind Studio — Workspace</span>
                          </div>

                          <div className="space-y-3 pt-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-wider">
                              <Sparkles className="size-3" />
                              <span>The Second Brain for YouTube</span>
                            </div>

                            <h3 className="text-base font-black text-slate-900 leading-tight">
                              Understand <span className="text-primary font-black">YouTube Videos.</span>
                            </h3>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              Paste any YouTube playlist or video to generate timestamped structured notes, key takeaways, and flashcards.
                            </p>

                            <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs mt-2">
                              <div className="h-8 rounded-lg bg-slate-100 text-xs text-slate-500 flex items-center px-3 border border-slate-200">
                                https://youtube.com/watch?v=dQw4w9WgXcQ...
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] shadow-sm">
                                  Generate Notes
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] border border-slate-200">
                                  ⚡ 60s Processing
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] border border-slate-200">
                                  📄 PDF Export
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Save Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-card/60 border border-border/70 backdrop-blur-xl shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Selected theme mode & palette apply immediately on this device.</span>
                  </div>

                  <Button
                    onClick={handleSaveAppearance}
                    disabled={savingAppearance}
                    className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all shrink-0"
                  >
                    {savingAppearance ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span>Save Appearance</span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 p-5 sm:p-6">
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2.5">
                        <div className="size-9 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <span>AI Note Generation</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Customize how AI synthesizes, structures, and generates your study notes.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 sm:p-7 space-y-8">
                    {!isAuthenticated ? (
                      <div className="text-center py-8 space-y-3">
                        <p className="text-sm text-muted-foreground">
                          <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link> to customize and save your AI preferences across devices.
                        </p>
                        <Button asChild className="rounded-xl font-bold">
                          <Link to="/login">Sign In Now</Link>
                        </Button>
                      </div>
                    ) : loadingPrefs ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs font-medium text-muted-foreground">Loading AI engine preferences...</p>
                      </div>
                    ) : (
                      <>
                        {/* 1. TONE SELECTION CARDS */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                              <span className="size-5 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[10px] font-black">1</span>
                              Tone
                            </label>
                            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Select your preferred note-taking voice</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {AI_TONES.map((t) => {
                              const isSelected = (prefs.ai_tone || "educational") === t.value;
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.value}
                                  type="button"
                                  disabled={savingPrefs}
                                  onClick={() => savePref("ai_tone", t.value)}
                                  className={cn(
                                    "relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 group cursor-pointer",
                                    isSelected
                                      ? "bg-primary/[0.08] dark:bg-primary/[0.14] border-primary shadow-md shadow-primary/10 ring-2 ring-primary/20 scale-[1.01]"
                                      : "bg-card/50 border-border/70 hover:border-primary/40 hover:bg-card/90"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className={cn(
                                      "size-9 rounded-xl flex items-center justify-center transition-colors",
                                      isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                                        : "bg-secondary text-muted-foreground group-hover:text-foreground group-hover:bg-secondary/80"
                                    )}>
                                      <Icon className="size-4" />
                                    </div>

                                    {isSelected && (
                                      <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                        <Check className="size-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                      {t.label}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                      {t.desc}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. DETAIL LEVEL CARDS */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                              <span className="size-5 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[10px] font-black">2</span>
                              Detail Level
                            </label>
                            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Set how concise or in-depth the generated notes are</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {AI_DETAIL_LEVELS.map((d) => {
                              const isSelected = (prefs.ai_detail_level || "detailed") === d.value;
                              const Icon = d.icon;
                              return (
                                <button
                                  key={d.value}
                                  type="button"
                                  disabled={savingPrefs}
                                  onClick={() => savePref("ai_detail_level", d.value)}
                                  className={cn(
                                    "relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 group cursor-pointer",
                                    isSelected
                                      ? "bg-primary/[0.08] dark:bg-primary/[0.14] border-primary shadow-md shadow-primary/10 ring-2 ring-primary/20 scale-[1.01]"
                                      : "bg-card/50 border-border/70 hover:border-primary/40 hover:bg-card/90"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className={cn(
                                      "size-9 rounded-xl flex items-center justify-center transition-colors",
                                      isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                                        : "bg-secondary text-muted-foreground group-hover:text-foreground group-hover:bg-secondary/80"
                                    )}>
                                      <Icon className="size-4" />
                                    </div>

                                    {isSelected && (
                                      <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                        <Check className="size-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                      {d.label}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                      {d.desc}
                                    </div>
                                  </div>

                                  {/* Visual Depth Indicators */}
                                  <div className="pt-2 border-t border-border/40 flex items-center gap-1">
                                    {[1, 2, 3].map((step) => (
                                      <div
                                        key={step}
                                        className={cn(
                                          "h-1.5 flex-1 rounded-full transition-colors",
                                          step <= d.bars
                                            ? isSelected
                                              ? "bg-primary"
                                              : "bg-primary/50"
                                            : "bg-secondary/70"
                                        )}
                                      />
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. OUTPUT LANGUAGE TILES */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                              <span className="size-5 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[10px] font-black">3</span>
                              Output Language
                            </label>
                            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">Transcribed & summarized in your preferred language</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                            {AI_LANGUAGES.map((l) => {
                              const isSelected = (prefs.ai_language || "en") === l.value;
                              return (
                                <button
                                  key={l.value}
                                  type="button"
                                  disabled={savingPrefs}
                                  onClick={() => savePref("ai_language", l.value)}
                                  className={cn(
                                    "p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 group relative cursor-pointer",
                                    isSelected
                                      ? "bg-primary/[0.08] dark:bg-primary/[0.14] border-primary shadow-sm shadow-primary/10 ring-2 ring-primary/20"
                                      : "bg-card/50 border-border/70 hover:border-primary/40 hover:bg-card/90"
                                  )}
                                >
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                      <Check className="size-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                  <span className="text-xl sm:text-2xl select-none" role="img" aria-label={l.label}>
                                    {l.flag}
                                  </span>
                                  <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                                    {l.native}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-medium">
                                    {l.label}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. LIVE ACTIVE PRESET SUMMARY */}
                        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 text-muted-foreground">
                            <Sparkles className="size-4 text-primary shrink-0" />
                            <span>
                              Active Note Configuration:{" "}
                              <strong className="text-foreground capitalize">{prefs.ai_tone || "Educational"}</strong> tone •{" "}
                              <strong className="text-foreground capitalize">{prefs.ai_detail_level || "Detailed"}</strong> depth •{" "}
                              <strong className="text-foreground">
                                {AI_LANGUAGES.find((l) => l.value === (prefs.ai_language || "en"))?.native || "English"}
                              </strong>
                            </span>
                          </div>
                          {savingPrefs && (
                            <span className="flex items-center gap-1.5 text-primary text-[11px] font-bold shrink-0">
                              <Loader2 className="size-3 animate-spin" />
                              Saving...
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                {!isAuthenticated ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">Sign in to view your account details and usage.</p>
                      <Button asChild>
                        <Link to="/login">Sign in</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-border/40 bg-muted/10 p-6">
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Usage & Limits
                        </CardTitle>
                        <CardDescription>Your plan usage for this month.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-xl bg-muted/50 p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes generated</p>
                            <p className="text-2xl font-bold mt-1">
                              {profile?.usage_count ?? 0}
                              <span className="text-sm font-normal text-muted-foreground"> / {profile?.usage_limit ?? 5}</span>
                            </p>
                          </div>
                          <div className="rounded-xl bg-muted/50 p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Downloads</p>
                            <p className="text-2xl font-bold mt-1">{profile?.downloads_count ?? 0}</p>
                          </div>
                          <div className="rounded-xl bg-muted/50 p-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total notes</p>
                            <p className="text-2xl font-bold mt-1">{profile?.total_notes ?? 0}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/pricing">
                            Upgrade plan
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-border/40 bg-muted/10 p-6">
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Manage your account and security.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {profile?.created_at && (
                          <p className="text-sm text-muted-foreground">
                            Member since{" "}
                            <span className="font-medium text-foreground">
                              {new Date(profile.created_at).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </p>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/forgot-password">
                            <KeyRound className="h-4 w-4 mr-2" />
                            Change / Reset password
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="data" className="space-y-6">
                <Card className="border-destructive/20">
                  <CardHeader>
                    <CardTitle className="text-destructive">Clear History</CardTitle>
                    <CardDescription>
                      Permanently remove all your generated notes from history. This cannot be undone.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={() => setClearDialogOpen(true)}>
                      Clear All History
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about" className="space-y-6">
                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 p-6 flex flex-row items-center gap-4">
                    <div className="shrink-0">
                      <ScriptMindLogo size={42} showText={false} />
                    </div>
                    <div>
                      <CardTitle>ScriptMind AI</CardTitle>
                      <CardDescription>Version 1.0.0 (Midnight Aurora)</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ScriptMind uses AI to turn educational videos into structured study notes. Built for students and
                      lifelong learners who want to learn faster.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/pricing">
                          View Plans
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 p-6">
                    <CardTitle className="flex items-center gap-2">
                      <Keyboard className="h-5 w-5 text-primary" />
                      Keyboard Shortcuts
                    </CardTitle>
                    <CardDescription>Quick actions available across the app.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm">{s.action}</span>
                          <div className="flex gap-1">
                            {s.keys.map((k) => (
                              <kbd
                                key={k}
                                className="px-2 py-1 text-xs font-mono rounded bg-muted border border-border"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/60 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 p-6">
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Support & Resources
                    </CardTitle>
                    <CardDescription>Help and useful links.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <Link
                      to="/forgot-password"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                    >
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span>Reset password</span>
                      <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                    </Link>
                    <Link
                      to="/pricing"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Pricing & Plans</span>
                      <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>

        <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your notes history. You won't be able to recover it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
              <Button variant="destructive" disabled={clearing} onClick={handleClearHistory}>
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear all"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Settings;
