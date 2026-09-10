import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHomeContent, HomePageConfig } from "@/hooks/useHomeContent";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  LayoutTemplate,
  Save,
  RotateCcw,
  Eye,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Type,
  MousePointerClick,
  ListOrdered,
  Layers,
  Sliders,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  Laptop,
  Smartphone,
  Check,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminHomePage() {
  const { user, isAuthenticated } = useAuth();
  const { config, saveConfig, resetDefaults, isSaving, DEFAULT_HOME_CONFIG } = useHomeContent();
  const { toast } = useToast();

  // Local draft state for editing before saving
  const [draft, setDraft] = useState<HomePageConfig>(config);
  const [activeTab, setActiveTab] = useState("hero");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Sync draft when remote config loads
  React.useEffect(() => {
    setDraft(config);
  }, [config]);

  const isAdmin = isAuthenticated && user?.role === "admin";

  const handleFieldChange = <K extends keyof HomePageConfig>(key: K, value: HomePageConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const success = await saveConfig(draft);
    if (success) {
      toast({
        title: "Home Page Saved",
        description: "All content changes have been applied live to the Home Page.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save changes. Please try again.",
      });
    }
  };

  const handleReset = async () => {
    setDraft(DEFAULT_HOME_CONFIG);
    await resetDefaults();
    setIsResetDialogOpen(false);
    toast({
      title: "Content Reset",
      description: "Home Page content has been restored to factory defaults.",
    });
  };

  // Quick Preset Handlers
  const applyPreset = (type: "youtube" | "executive" | "academic") => {
    let preset: Partial<HomePageConfig> = {};
    if (type === "youtube") {
      preset = {
        heroBadgeText: "The Second Brain for YouTube",
        heroTitlePrefix: "Understand ",
        heroTitleHighlight: "YouTube Videos.",
        heroDescription: "Don't waste time watching long videos. Paste a YouTube link below and get easy-to-read notes instantly.",
        inputPlaceholder: "Paste YouTube link here...",
        generateButtonText: "Generate Notes",
        assistantMessage: "I've extracted 3 key concepts from the lecture. Would you like a quick quiz?",
      };
    } else if (type === "executive") {
      preset = {
        heroBadgeText: "Executive Briefings & Intelligence",
        heroTitlePrefix: "Accelerate ",
        heroTitleHighlight: "Strategic Learning.",
        heroDescription: "Transform 60-minute webinars, keynotes, and industry talks into crisp executive memos and actionable takeaways in seconds.",
        inputPlaceholder: "Enter lecture or conference URL...",
        generateButtonText: "Summarize Talk",
        assistantMessage: "Briefing prepared: 5 strategic decisions identified from the summit video.",
      };
    } else if (type === "academic") {
      preset = {
        heroBadgeText: "AI Study Assistant for Students & Researchers",
        heroTitlePrefix: "Master Every ",
        heroTitleHighlight: "University Lecture.",
        heroDescription: "Turn recorded classroom lectures and tutorials into textbook-grade structured study notes, flashcards, and practice quiz sets.",
        inputPlaceholder: "Paste lecture URL or playlist...",
        generateButtonText: "Create Study Guide",
        assistantMessage: "Exam prep ready: Generated 12 practice flashcards and formula summaries.",
      };
    }
    setDraft((prev) => ({ ...prev, ...preset }));
    toast({
      title: "Preset Applied",
      description: `Loaded "${type.charAt(0).toUpperCase() + type.slice(1)}" template into draft. Click Save to publish.`,
    });
  };

  // ACCESS DENIED SCREEN
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh] text-center">
        <Helmet>
          <title>Access Denied - Admin Privileges Required | ScriptMind</title>
        </Helmet>
        <Card className="max-w-md w-full border-border/80 bg-card/80 backdrop-blur-2xl p-8 rounded-3xl space-y-5 shadow-2xl">
          <div className="size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto shadow-inner">
            <ShieldAlert className="size-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground">Restricted Access</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This Home Page Content CMS is reserved exclusively for System Administrators. Your account does not currently possess admin authorization.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Button asChild variant="outline" className="rounded-xl font-bold text-xs">
              <Link to="/">
                <ArrowLeft className="size-3.5 mr-1.5" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild className="rounded-xl font-bold text-xs bg-primary text-primary-foreground">
              <Link to="/settings">Account Profile</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Home Page CMS & Content Studio | ScriptMind Admin</title>
      </Helmet>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden font-sans selection:bg-primary/20">
        {/* Top Navbar */}
        <header className="h-16 border-b border-sidebar-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 truncate">
              <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <LayoutTemplate className="size-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                  <span>Home Page CMS</span>
                  <span className="text-primary font-semibold">&</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                    Content Editor
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3 rounded-xl border-border/80 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 hidden md:flex"
            >
              <Link to="/" target="_blank" rel="noopener noreferrer">
                <Eye className="size-3.5 text-primary" />
                <span>Live Home</span>
                <ExternalLink className="size-3 opacity-60" />
              </Link>
            </Button>

            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-border/80 text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive/40 gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-border/80 bg-card/95 backdrop-blur-2xl p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-lg">Reset Home Page Content?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground">
                    This will discard your custom changes and restore all titles, text descriptions, buttons, and steps to their original factory defaults.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2">
                  <AlertDialogCancel className="rounded-xl font-bold text-xs">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="rounded-xl font-bold text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Reset Defaults
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 sm:px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 gap-1.5"
            >
              {isSaving ? (
                <RotateCcw className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Publish Live</span>
            </Button>
          </div>
        </header>

        {/* Studio Viewport (Split: Editor Controls on Left, Real-Time Preview on Right) */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 h-full overflow-hidden">
          
          {/* LEFT: Configuration Editor Panel */}
          <div className="w-full lg:w-[480px] xl:w-[540px] border-r border-sidebar-border/50 bg-card/30 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
            
            {/* Template Presets Pill Row */}
            <div className="p-4 border-b border-border/40 bg-muted/15 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0">
                Quick Presets:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => applyPreset("youtube")}
                  className="px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-[11px] font-bold text-foreground transition-colors"
                >
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("executive")}
                  className="px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-[11px] font-bold text-foreground transition-colors"
                >
                  Executive
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("academic")}
                  className="px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-[11px] font-bold text-foreground transition-colors"
                >
                  Academic
                </button>
              </div>
            </div>

            {/* Editor Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 pt-3 pb-1 border-b border-border/40 shrink-0">
                <TabsList className="w-full bg-secondary/40 p-1 rounded-xl grid grid-cols-5 h-9">
                  <TabsTrigger value="hero" className="rounded-lg text-[11px] font-bold gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <Type className="size-3 shrink-0" />
                    <span className="truncate">Hero</span>
                  </TabsTrigger>
                  <TabsTrigger value="action" className="rounded-lg text-[11px] font-bold gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <MousePointerClick className="size-3 shrink-0" />
                    <span className="truncate">Action</span>
                  </TabsTrigger>
                  <TabsTrigger value="steps" className="rounded-lg text-[11px] font-bold gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <ListOrdered className="size-3 shrink-0" />
                    <span className="truncate">Steps</span>
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="rounded-lg text-[11px] font-bold gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <Layers className="size-3 shrink-0" />
                    <span className="truncate">Cards</span>
                  </TabsTrigger>
                  <TabsTrigger value="options" className="rounded-lg text-[11px] font-bold gap-1 data-[state=active]:bg-background data-[state=active]:shadow-xs">
                    <Sliders className="size-3 shrink-0" />
                    <span className="truncate">Toggles</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                
                {/* TAB 1: HERO & HEADING */}
                <TabsContent value="hero" className="space-y-4 m-0 outline-none">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Hero Typography</h3>
                    <p className="text-[11px] text-muted-foreground">Configure the main brand headline and introductory summary.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="heroBadgeText" className="text-xs font-bold text-foreground">Top Pill Badge</Label>
                    <Input
                      id="heroBadgeText"
                      value={draft.heroBadgeText}
                      onChange={(e) => handleFieldChange("heroBadgeText", e.target.value)}
                      placeholder="e.g. The Second Brain for YouTube"
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="heroTitlePrefix" className="text-xs font-bold text-foreground">Title Prefix</Label>
                      <Input
                        id="heroTitlePrefix"
                        value={draft.heroTitlePrefix}
                        onChange={(e) => handleFieldChange("heroTitlePrefix", e.target.value)}
                        placeholder="e.g. Understand "
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="heroTitleHighlight" className="text-xs font-bold text-foreground">Gradient Highlight</Label>
                      <Input
                        id="heroTitleHighlight"
                        value={draft.heroTitleHighlight}
                        onChange={(e) => handleFieldChange("heroTitleHighlight", e.target.value)}
                        placeholder="e.g. YouTube Videos."
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80 font-bold text-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="heroDescription" className="text-xs font-bold text-foreground">Lead Description Subtitle</Label>
                    <Textarea
                      id="heroDescription"
                      rows={3}
                      value={draft.heroDescription}
                      onChange={(e) => handleFieldChange("heroDescription", e.target.value)}
                      placeholder="Enter the main paragraph explaining the product value..."
                      className="text-xs rounded-xl bg-background/70 border-border/80 resize-none leading-relaxed"
                    />
                  </div>
                </TabsContent>

                {/* TAB 2: ACTION & URL INPUT */}
                <TabsContent value="action" className="space-y-4 m-0 outline-none">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Input & CTA Buttons</h3>
                    <p className="text-[11px] text-muted-foreground">Adjust the video input placeholder and action button labels.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inputPlaceholder" className="text-xs font-bold text-foreground">URL Input Placeholder</Label>
                    <Input
                      id="inputPlaceholder"
                      value={draft.inputPlaceholder}
                      onChange={(e) => handleFieldChange("inputPlaceholder", e.target.value)}
                      placeholder="e.g. Paste YouTube link here..."
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="generateButtonText" className="text-xs font-bold text-foreground">Primary Action Button Text</Label>
                    <Input
                      id="generateButtonText"
                      value={draft.generateButtonText}
                      onChange={(e) => handleFieldChange("generateButtonText", e.target.value)}
                      placeholder="e.g. Generate"
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="helperText" className="text-xs font-bold text-foreground">Helper Question</Label>
                      <Input
                        id="helperText"
                        value={draft.helperText}
                        onChange={(e) => handleFieldChange("helperText", e.target.value)}
                        placeholder="e.g. Auto-fetch not working?"
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="manualLinkText" className="text-xs font-bold text-foreground">Manual Transcript CTA</Label>
                      <Input
                        id="manualLinkText"
                        value={draft.manualLinkText}
                        onChange={(e) => handleFieldChange("manualLinkText", e.target.value)}
                        placeholder="e.g. Paste transcript manually"
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80 text-primary"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: HOW IT WORKS STEPS */}
                <TabsContent value="steps" className="space-y-4 m-0 outline-none">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">How It Works (3 Steps)</h3>
                    <p className="text-[11px] text-muted-foreground">Customize the onboarding steps listed under the URL input.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stepsHeading" className="text-xs font-bold text-foreground">Section Heading</Label>
                    <Input
                      id="stepsHeading"
                      value={draft.stepsHeading}
                      onChange={(e) => handleFieldChange("stepsHeading", e.target.value)}
                      placeholder="e.g. HOW IT WORKS:"
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="step1" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="size-4 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center">1</span>
                      <span>Step 1 Instruction</span>
                    </Label>
                    <Input
                      id="step1"
                      value={draft.step1}
                      onChange={(e) => handleFieldChange("step1", e.target.value)}
                      placeholder="e.g. Copy any YouTube video link."
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="step2" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="size-4 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center">2</span>
                      <span>Step 2 Instruction</span>
                    </Label>
                    <Input
                      id="step2"
                      value={draft.step2}
                      onChange={(e) => handleFieldChange("step2", e.target.value)}
                      placeholder="e.g. Paste it in the box above."
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="step3" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="size-4 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center">3</span>
                      <span>Step 3 Instruction</span>
                    </Label>
                    <Input
                      id="step3"
                      value={draft.step3}
                      onChange={(e) => handleFieldChange("step3", e.target.value)}
                      placeholder="e.g. Read your AI-generated notes!"
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                    />
                  </div>
                </TabsContent>

                {/* TAB 4: 3D VISUAL MOCKUP CARDS */}
                <TabsContent value="cards" className="space-y-4 m-0 outline-none">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Floating Visual Mockups</h3>
                    <p className="text-[11px] text-muted-foreground">Adjust images, badge labels, and the AI assistant bubble message.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="videoImageUrl" className="text-xs font-bold text-foreground">Video Thumbnail Image URL</Label>
                    <Input
                      id="videoImageUrl"
                      value={draft.videoImageUrl}
                      onChange={(e) => handleFieldChange("videoImageUrl", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="h-10 text-xs rounded-xl bg-background/70 border-border/80 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="videoBadge" className="text-xs font-bold text-foreground">Video Card Badge</Label>
                      <Input
                        id="videoBadge"
                        value={draft.videoBadge}
                        onChange={(e) => handleFieldChange("videoBadge", e.target.value)}
                        placeholder="e.g. Study Video"
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="notesBadge" className="text-xs font-bold text-foreground">Notes Done Badge</Label>
                      <Input
                        id="notesBadge"
                        value={draft.notesBadge}
                        onChange={(e) => handleFieldChange("notesBadge", e.target.value)}
                        placeholder="e.g. Done"
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80 font-bold text-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="assistantMessage" className="text-xs font-bold text-foreground">AI Chat Bubble Message</Label>
                    <Textarea
                      id="assistantMessage"
                      rows={3}
                      value={draft.assistantMessage}
                      onChange={(e) => handleFieldChange("assistantMessage", e.target.value)}
                      placeholder="e.g. I've extracted 3 key concepts from the lecture..."
                      className="text-xs rounded-xl bg-background/70 border-border/80 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="assistantBtn1" className="text-xs font-bold text-foreground">Quiz Button 1 Label</Label>
                      <Input
                        id="assistantBtn1"
                        value={draft.assistantBtn1}
                        onChange={(e) => handleFieldChange("assistantBtn1", e.target.value)}
                        placeholder="e.g. Yes, Quiz me"
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80 text-primary font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="assistantBtn2" className="text-xs font-bold text-foreground">Quiz Button 2 Label</Label>
                      <Input
                        id="assistantBtn2"
                        value={draft.assistantBtn2}
                        onChange={(e) => handleFieldChange("assistantBtn2", e.target.value)}
                        placeholder="e.g. Summarize it"
                        className="h-10 text-xs rounded-xl bg-background/70 border-border/80 text-muted-foreground"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 5: DISPLAY OPTIONS & TOGGLES */}
                <TabsContent value="options" className="space-y-4 m-0 outline-none">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-primary">Display Options</h3>
                    <p className="text-[11px] text-muted-foreground">Toggle optional decorative features and effects on the Home Page.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-background/70">
                      <div className="space-y-0.5">
                        <Label htmlFor="showFloatingCards" className="text-xs font-bold text-foreground cursor-pointer">
                          Show 3D Floating Mockup Cards
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Displays the floating interactive video and AI note cards in the right hero column.
                        </p>
                      </div>
                      <Switch
                        id="showFloatingCards"
                        checked={draft.showFloatingCards}
                        onCheckedChange={(checked) => handleFieldChange("showFloatingCards", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-background/70">
                      <div className="space-y-0.5">
                        <Label htmlFor="showAuroraGlow" className="text-xs font-bold text-foreground cursor-pointer">
                          Ambient Aurora Glow Effect
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Renders ambient radial light orbs behind the hero banner.
                        </p>
                      </div>
                      <Switch
                        id="showAuroraGlow"
                        checked={draft.showAuroraGlow}
                        onCheckedChange={(checked) => handleFieldChange("showAuroraGlow", checked)}
                      />
                    </div>
                  </div>
                </TabsContent>

              </div>
            </Tabs>
          </div>

          {/* RIGHT: Live Interactive Real-Time Preview Panel */}
          <div className="flex-1 flex flex-col min-w-0 bg-background/50 overflow-hidden">
            {/* Preview Device Switcher Bar */}
            <div className="h-12 border-b border-border/40 px-4 sm:px-6 flex items-center justify-between bg-card/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground">Live Interactive Canvas Preview</span>
                <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/80 font-mono hidden sm:inline">
                  Updates in Real-Time
                </span>
              </div>

              <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  title="Desktop Preview"
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
                    previewDevice === "desktop" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Laptop className="size-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  title="Mobile View"
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
                    previewDevice === "mobile" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smartphone className="size-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
              <div
                className={cn(
                  "w-full transition-all duration-300 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-2xl shadow-2xl overflow-hidden relative",
                  previewDevice === "mobile" ? "max-w-[390px] min-h-[640px] p-6" : "max-w-5xl p-8 lg:p-12"
                )}
              >
                {/* Aurora Glow simulation */}
                {draft.showAuroraGlow && (
                  <>
                    <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
                  </>
                )}

                <div className={cn("grid gap-8 items-center relative z-10", previewDevice === "desktop" ? "lg:grid-cols-2 lg:gap-12" : "grid-cols-1")}>
                  
                  {/* Left Column (Hero copy & input bar) */}
                  <div className="space-y-6 text-left">
                    {/* Badge */}
                    {draft.heroBadgeText && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-wider shadow-xs">
                        <Sparkles className="size-3" />
                        <span>{draft.heroBadgeText}</span>
                      </div>
                    )}

                    {/* Headline */}
                    <h2 className={cn(
                      "font-black tracking-tight leading-[1.1] text-foreground",
                      previewDevice === "mobile" ? "text-2xl" : "text-3xl sm:text-4xl lg:text-5xl"
                    )}>
                      {draft.heroTitlePrefix}{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                        {draft.heroTitleHighlight}
                      </span>
                    </h2>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                      {draft.heroDescription}
                    </p>

                    {/* Mock Input Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-background/90 border border-border/80 shadow-md">
                        <div className="flex-1 px-3 text-xs text-muted-foreground/60 truncate font-sans">
                          {draft.inputPlaceholder}
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs shrink-0 flex items-center gap-1.5">
                          <Sparkles className="size-3" />
                          <span>{draft.generateButtonText}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                        <span>{draft.helperText}</span>
                        <span className="text-primary font-bold hover:underline cursor-pointer">{draft.manualLinkText}</span>
                      </div>
                    </div>

                    {/* How It Works Steps */}
                    <div className="pt-4 border-t border-border/50 space-y-2.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {draft.stepsHeading}
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="size-5 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                          <span className="text-foreground/85 font-medium">{draft.step1}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="size-5 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                          <span className="text-foreground/85 font-medium">{draft.step2}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="size-5 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                          <span className="text-foreground/85 font-medium">{draft.step3}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Floating Cards Mockup) */}
                  {draft.showFloatingCards && (
                    <div className="relative space-y-4">
                      {/* Video Player Mockup Card */}
                      <div className="rounded-2xl border border-border/80 bg-card/85 p-3 shadow-xl space-y-2">
                        <div className="w-full aspect-video rounded-xl overflow-hidden relative bg-black/80">
                          <img
                            src={draft.videoImageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-70"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-bold text-white uppercase border border-white/10">
                            {draft.videoBadge}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[9px] border-l-white border-b-[6px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Assistant Chat Bubble */}
                      <div className="rounded-2xl border border-border/80 bg-card/90 p-3.5 shadow-xl space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shrink-0 shadow-xs">
                            AI
                          </div>
                          <p className="text-xs text-foreground leading-relaxed flex-1">
                            {draft.assistantMessage}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 pl-9">
                          <span className="px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-[9px] font-black text-primary uppercase">
                            {draft.assistantBtn1}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-secondary border border-border text-[9px] font-black text-muted-foreground uppercase">
                            {draft.assistantBtn2}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
