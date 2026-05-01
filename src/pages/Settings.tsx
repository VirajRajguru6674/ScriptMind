import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/Sidebar";
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
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
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

const API_BASE = "http://localhost:3001/api";

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
  { value: "educational", label: "Educational", desc: "Clear, instructive style" },
  { value: "casual", label: "Casual", desc: "Friendly and conversational" },
  { value: "formal", label: "Formal", desc: "Professional and structured" },
  { value: "concise", label: "Concise", desc: "Brief and to the point" },
];

const AI_DETAIL_LEVELS = [
  { value: "concise", label: "Concise", desc: "Key points only" },
  { value: "balanced", label: "Balanced", desc: "Summary with context" },
  { value: "detailed", label: "Detailed", desc: "In-depth explanations" },
];

const AI_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const Settings = () => {
  const { clearHistory } = useNotesHistory();
  const { theme, setTheme, variant, setVariant } = useTheme();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { toast } = useToast();

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
        const res = await fetch(`${API_BASE}/user/me`, { headers: { Authorization: `Bearer ${token}` } });
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
          if (data.theme_mode) {
            setTheme(data.theme_mode as "light" | "dark" | "system");
            setPendingTheme(data.theme_mode as "light" | "dark" | "system");
          }
          if (data.theme_variant) {
            setVariant(data.theme_variant as "default" | "forest" | "sunset" | "ocean" | "golden");
            setPendingVariant(data.theme_variant as "default" | "forest" | "sunset" | "ocean" | "golden");
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
      const res = await fetch(`${API_BASE}/user/preferences`, {
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
    setTheme(pendingTheme);
    setVariant(pendingVariant);

    if (!isAuthenticated) {
      toast({ title: "Saved", description: "Appearance saved to this device." });
      return;
    }
    setSavingAppearance(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/user/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme_mode: pendingTheme, theme_variant: pendingVariant }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "Appearance preferences saved and applied." });
      } else {
        throw new Error("Save failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to save", description: "Could not save appearance preferences." });
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
      const res = await fetch(`${API_BASE}/user/profile`, {
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

  const paletteOptions = [
    { id: "default", label: "Indigo", color: "bg-[#6366f1]" },
    { id: "forest", label: "Forest", color: "bg-[#2e7d32]" },
    { id: "sunset", label: "Sunset", color: "bg-[#B45309]" },
    { id: "ocean", label: "Ocean", color: "bg-[#e05d38]" },
    { id: "golden", label: "Golden", color: "bg-[#f59e0b]" },
  ];

  return (
    <>
      <Helmet>
        <title>Settings - ScriptMind</title>
      </Helmet>

      <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
        <Sidebar />

        <main className="lg:pl-[280px]">
          <div className="container py-6 lg:py-10 max-w-3xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
                  <p className="text-sm text-muted-foreground">Customize your ScriptMind experience</p>
                </div>
              </div>
            </div>

            {/* Tabbed Settings */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 h-auto flex-wrap gap-1 p-1 bg-muted/30">
                <TabsTrigger value="general" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="appearance" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI & Notes
                </TabsTrigger>
                <TabsTrigger value="account" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-2">
                  <Info className="h-4 w-4" />
                  About
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                {/* Profile Section */}
                {isAuthenticated && (() => {
                  const currentPlan = (profile?.plan || user?.plan || "free").toLowerCase();
                  const planStyles = {
                    free: {
                      card: "border-border/50 bg-card/50",
                      header: "bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border-b border-zinc-800/50",
                      badge: "bg-zinc-800 text-zinc-400 border border-white/10",
                      avatarBorder: "border-zinc-700/50",
                      accent: "text-zinc-400"
                    },
                    pro: {
                      card: "border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-card/50 to-amber-900/10 shadow-lg shadow-amber-500/5",
                      header: "bg-gradient-to-r from-amber-900/30 to-amber-800/20 border-b border-amber-500/30",
                      badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
                      avatarBorder: "border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
                      accent: "text-amber-400"
                    },
                    expert: {
                      card: "border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-card/50 to-purple-900/20 shadow-xl shadow-purple-500/10",
                      header: "bg-gradient-to-r from-purple-900/40 to-purple-800/30 border-b border-purple-500/40",
                      badge: "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
                      avatarBorder: "border-purple-500/50 shadow-[0_0_16px_rgba(168,85,247,0.4)]",
                      accent: "text-purple-400"
                    }
                  };
                  const style = planStyles[currentPlan as keyof typeof planStyles] || planStyles.free;
                  
                  return (
                    <Card className={`relative overflow-hidden ${style.card} transition-all duration-300`}>
                      {/* Plan-specific gradient overlay */}
                      {currentPlan === "expert" && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                      )}
                      {currentPlan === "pro" && (
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
                      )}
                      
                      <CardHeader className={`relative ${style.header} pb-4`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-xl bg-primary/10 ${style.accent}`}>
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold">Profile</CardTitle>
                                <CardDescription className="mt-0.5">Manage your profile information and avatar</CardDescription>
                              </div>
                            </div>
                          </div>
                          {!isEditingProfile && (
                            <div className="flex flex-col items-end gap-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleEditProfile}
                                className="bg-background/50 hover:bg-background border-border/50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Badge className={`capitalize font-bold text-xs px-3 py-1 ${style.badge}`}>
                                {currentPlan === "free" ? "Free" : currentPlan === "pro" ? "Pro" : "Expert"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="relative space-y-6 pt-6">
                      {!isEditingProfile ? (
                        <div className="space-y-6">
                          {/* Avatar and Basic Info Section */}
                          <div className="flex items-start gap-6">
                            <div className="relative group">
                              <Avatar className={`h-24 w-24 border-3 ${style.avatarBorder} transition-all duration-300 group-hover:scale-105`}>
                                <AvatarImage src={profile?.avatar_url || user?.avatar_url} className="object-cover" />
                                <AvatarFallback className={`bg-primary/10 ${style.accent} text-2xl font-bold`}>
                                  {(profile?.username || user?.username || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {currentPlan !== "free" && (
                                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${currentPlan === "expert" ? "bg-purple-500" : "bg-amber-500"} border-2 border-background flex items-center justify-center`}>
                                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-4">
                              <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Username</Label>
                                <p className="text-xl font-bold text-foreground">{profile?.username || user?.username}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</Label>
                                <p className="text-sm text-muted-foreground font-medium">{profile?.email || user?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Personal Information Section */}
                          {(profile?.full_name || profile?.bio || profile?.phone || profile?.location || profile?.date_of_birth) && (
                            <div className="pt-4 border-t border-border/50">
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Personal Information</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile?.full_name && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                                    <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
                                  </div>
                                )}
                                {profile?.phone && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                                    <p className="text-sm text-muted-foreground">{profile.phone}</p>
                                  </div>
                                )}
                                {profile?.location && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">Location</Label>
                                    <p className="text-sm text-muted-foreground">{profile.location}</p>
                                  </div>
                                )}
                                {profile?.date_of_birth && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">Date of Birth</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(profile.date_of_birth).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {profile?.bio && (
                                <div className="mt-4 space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Bio</Label>
                                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border/50">
                                    {profile.bio}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Avatar Upload Section */}
                          <div className="flex items-start gap-6">
                            <div className="relative group">
                              <Avatar className={`h-24 w-24 border-3 ${style.avatarBorder} transition-all duration-300`}>
                                <AvatarImage src={avatarPreview || editedProfile.avatar_url || profile?.avatar_url || user?.avatar_url} className="object-cover" />
                                <AvatarFallback className={`bg-primary/10 ${style.accent} text-2xl font-bold`}>
                                  {editedProfile.username.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <label
                                htmlFor="avatar-upload"
                                className={`absolute bottom-0 right-0 p-2 ${currentPlan === "expert" ? "bg-purple-500" : currentPlan === "pro" ? "bg-amber-500" : "bg-primary"} text-white rounded-full cursor-pointer hover:opacity-90 transition-all shadow-lg hover:scale-110`}
                              >
                                <Camera className="h-4 w-4" />
                                <input
                                  id="avatar-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleAvatarChange}
                                />
                              </label>
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Profile Photo</Label>
                              <p className="text-xs text-muted-foreground">Click the camera icon to upload a new photo (max 5MB)</p>
                            </div>
                          </div>

                          {/* Edit Form Section */}
                          <div className="pt-4 border-t border-border/50 space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="username">Username</Label>
                                  <Input
                                    id="username"
                                    value={editedProfile.username}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                                    placeholder="Enter username"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={editedProfile.email}
                                    readOnly
                                    disabled
                                    className="bg-muted cursor-not-allowed opacity-60"
                                    placeholder="Enter email"
                                  />
                                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                  id="full_name"
                                  value={editedProfile.full_name}
                                  onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                                  placeholder="Enter your full name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                  id="bio"
                                  value={editedProfile.bio}
                                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                                  placeholder="Tell us about yourself"
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="phone">Phone</Label>
                                  <Input
                                    id="phone"
                                    type="tel"
                                    value={editedProfile.phone}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                                    placeholder="Enter phone number"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="location">Location</Label>
                                  <Input
                                    id="location"
                                    value={editedProfile.location}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                    placeholder="Enter location"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="date_of_birth">Date of Birth</Label>
                                <Input
                                  id="date_of_birth"
                                  type="date"
                                  value={editedProfile.date_of_birth}
                                  onChange={(e) => setEditedProfile({ ...editedProfile, date_of_birth: e.target.value })}
                                />
                              </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-4 border-t border-border/50">
                            <Button variant="outline" onClick={handleCancelEdit} disabled={savingProfile}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button onClick={handleSaveProfile} disabled={savingProfile}>
                              {savingProfile ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })()}
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />
                      Theme Mode
                    </CardTitle>
                    <CardDescription>Choose light, dark, or follow your system preference.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/30 border">
                      {[
                        { id: "light", icon: Sun, label: "Light" },
                        { id: "dark", icon: Moon, label: "Dark" },
                        { id: "system", icon: Monitor, label: "System" },
                      ].map(({ id, icon: Icon, label }) => (
                        <button
                          key={id}
                          onClick={() => setPendingTheme(id as "light" | "dark" | "system")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                            pendingTheme === id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Brand Palette
                    </CardTitle>
                    <CardDescription>Apply a custom color accent across the app.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {paletteOptions.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setPendingVariant(v.id as "default" | "forest" | "sunset" | "ocean" | "golden")}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                            pendingVariant === v.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/20 hover:bg-muted/30"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full ${v.color}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wider ${pendingVariant === v.id ? "text-primary" : "text-muted-foreground"}`}>
                            {v.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>Preview the Index page in dark and light theme.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dark theme</p>
                        <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg bg-[#0c0c0f] p-4 min-h-[160px]">
                          <div className="space-y-2">
                            <div className="inline-flex px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] text-primary">
                              The Second Brain for YouTube
                            </div>
                            <h2 className="text-sm font-black text-white leading-tight">
                              Learn <span className="text-primary">Faster.</span>
                            </h2>
                            <p className="text-[7px] text-zinc-400 leading-tight">
                              Stop scrubbing through hours of video...
                            </p>
                            <div className="rounded-lg bg-black/30 p-2 border border-white/5 mt-2">
                              <div className="h-5 rounded bg-white/10 text-[7px] text-zinc-500 flex items-center px-2">
                                Paste YouTube URL here
                              </div>
                              <div className="flex gap-1.5 mt-2">
                                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[7px]">60s Processing</span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[7px]">PDF Export</span>
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[7px]">AI Chat</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Light theme</p>
                        <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg bg-[#f8fafc] p-4 min-h-[160px]">
                          <div className="space-y-2">
                            <div className="inline-flex px-2 py-0.5 rounded-full bg-zinc-200/80 border border-zinc-300 text-[8px] text-primary">
                              The Second Brain for YouTube
                            </div>
                            <h2 className="text-sm font-black text-zinc-900 leading-tight">
                              Learn <span className="text-primary">Faster.</span>
                            </h2>
                            <p className="text-[7px] text-zinc-600 leading-tight">
                              Stop scrubbing through hours of video...
                            </p>
                            <div className="rounded-lg bg-white border border-zinc-200 p-2 shadow-sm mt-2">
                              <div className="h-5 rounded bg-zinc-100 text-[7px] text-zinc-500 flex items-center px-2 border border-zinc-200">
                                Paste YouTube URL here
                              </div>
                              <div className="flex gap-1.5 mt-2">
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[7px] border border-primary/20">60s Processing</span>
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[7px] border border-purple-500/20">PDF Export</span>
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 text-[7px] border border-cyan-500/20">AI Chat</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleSaveAppearance} disabled={savingAppearance}>
                    {savingAppearance ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save appearance
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Note Generation
                    </CardTitle>
                    <CardDescription>Customize how AI generates your study notes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!isAuthenticated ? (
                      <p className="text-sm text-muted-foreground py-4">
                        <Link to="/login" className="text-primary hover:underline">Sign in</Link> to save your AI preferences across devices.
                      </p>
                    ) : loadingPrefs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tone</label>
                          <Select
                            value={prefs.ai_tone || "educational"}
                            onValueChange={(v) => savePref("ai_tone", v)}
                            disabled={savingPrefs}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_TONES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label} — {t.desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Detail Level</label>
                          <Select
                            value={prefs.ai_detail_level || "detailed"}
                            onValueChange={(v) => savePref("ai_detail_level", v)}
                            disabled={savingPrefs}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_DETAIL_LEVELS.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                  {d.label} — {d.desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Output Language</label>
                          <Select
                            value={prefs.ai_language || "en"}
                            onValueChange={(v) => savePref("ai_language", v)}
                            disabled={savingPrefs}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_LANGUAGES.map((l) => (
                                <SelectItem key={l.value} value={l.value}>
                                  {l.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Usage & Limits
                        </CardTitle>
                        <CardDescription>Your plan usage for this month.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
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

                    <Card>
                      <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Manage your account and security.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="shrink-0 size-14 rounded-2xl overflow-hidden border border-border shadow-lg">
                      <img src="/logo.png" alt="ScriptMind Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <CardTitle>ScriptMind AI</CardTitle>
                      <CardDescription>Version 1.0.0 (Midnight Aurora)</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Keyboard className="h-5 w-5 text-primary" />
                      Keyboard Shortcuts
                    </CardTitle>
                    <CardDescription>Quick actions available across the app.</CardDescription>
                  </CardHeader>
                  <CardContent>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Support & Resources
                    </CardTitle>
                    <CardDescription>Help and useful links.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
            </Tabs>
          </div>
        </main>
      </div>

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
    </>
  );
};

export default Settings;
