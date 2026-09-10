import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { FileText, Sparkles, Youtube, ExternalLink, PlayCircle, Loader2, Clock, RefreshCw, ArrowRight, ChevronUp, ChevronDown, Edit3 } from "lucide-react";
import { UrlInput } from "@/components/UrlInput";
import { VideoPreview } from "@/components/VideoPreview";
import { NotesDisplay, type NotesDisplayHandle } from "@/components/NotesDisplay";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { useToast } from "@/hooks/use-toast";
import { useHomeContent } from "@/hooks/useHomeContent";
import API_BASE_URL from "@/lib/api";
import { ScriptMindLogo } from "@/components/ScriptMindLogo";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaletteCustomizer } from "@/components/PaletteCustomizer";

import { StudyTimer } from "@/components/StudyTimer";
import { SessionStats } from "@/components/SessionStats";

interface Recommendation {
  title: string;
  thumbnail: string;
  channel?: string;
  videoId?: string;
  query: string;
}

const Index = () => {
  const {
    videoInfo,
    notes,
    isLoadingVideo,
    isLoadingNotes,
    processVideo,
    reset,
    loadHistoryItem
  } = useNotes();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [showMobileRecs, setShowMobileRecs] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const notesDisplayRef = useRef<NotesDisplayHandle>(null);
  const { isAuthenticated, user } = useAuth();
  const { config: homeConfig } = useHomeContent();
  const navigate = useNavigate();
  const { toast } = useToast();

  const wordCount = notes ? notes.split(/\s+/).length : 0;

  const fetchRecs = useCallback(async () => {
    if (!videoInfo?.title && !notes) return;

    setIsLoadingRecs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: videoInfo?.title || 'Study Session',
          notes: notes
        })
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load recommendations",
      });
    } finally {
      setIsLoadingRecs(false);
    }
  }, [videoInfo?.title, notes, toast]);

  useEffect(() => {
    if (notes) {
      fetchRecs();
    }
  }, [notes, fetchRecs]);

  const handleSubmit = async (url: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    await processVideo(url);
    setHistoryTrigger(prev => prev + 1);
  };

  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const scrollUp = () => relatedScrollRef.current?.scrollBy({ top: -200, behavior: 'smooth' });
  const scrollDown = () => relatedScrollRef.current?.scrollBy({ top: 200, behavior: 'smooth' });

  return (
    <>
      <Helmet>
        <title>ScriptMind - AI Video Intelligence</title>
        <meta
          name="description"
          content="Transform YouTube videos into beginner-friendly study notes with AI."
        />
      </Helmet>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto font-sans selection:bg-primary/20 relative text-foreground transition-colors duration-300">
          {/* Mobile Top Brand Bar (Screens < lg) */}
          <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between px-4 border-b border-sidebar-border/40 bg-background/90 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-2 pl-14">
              <Link to="/" className="flex items-center">
                <ScriptMindLogo size={24} showText={true} />
              </Link>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationPanel />
              <PaletteCustomizer />
              <ThemeToggle />
            </div>
          </div>

          {(!videoInfo && !notes && !isLoadingVideo && !isLoadingNotes) ? (
            <div className="relative min-h-0 lg:min-h-[calc(100vh-3.5rem)] flex flex-col justify-start lg:justify-center items-center px-4 pt-6 pb-12 sm:px-6 sm:py-12 lg:px-12">
              {/* Aurora Background */}
              {homeConfig.showAuroraGlow && (
                <>
                  <div className="absolute top-[-20%] right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
                  <div className="absolute bottom-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
                </>
              )}

              {/* Admin Quick Access Bar */}
              {user?.role === "admin" && (
                <div className="relative z-30 w-full max-w-7xl mx-auto mb-3 flex justify-end">
                  <Link
                    to="/admin/homepage"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs font-semibold text-primary transition-all shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Customize Home Page (CMS)</span>
                  </Link>
                </div>
              )}

              <div className="relative z-10 w-full max-w-7xl mx-auto">
                <div className={`grid ${homeConfig.showFloatingCards ? "lg:grid-cols-2" : "grid-cols-1 max-w-2xl mx-auto"} gap-8 lg:gap-20 items-center`}>

                  {/* Left Column: Content */}
                  <div className="flex flex-col items-start text-left space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in relative z-20">
                    {homeConfig.heroBadgeText && (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary tracking-wide">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{homeConfig.heroBadgeText}</span>
                      </div>
                    )}

                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground">
                      {homeConfig.heroTitlePrefix}{" "}
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 drop-shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
                        {homeConfig.heroTitleHighlight}
                      </span>
                    </h1>

                    <p className="text-sm sm:text-base lg:text-xl text-muted-foreground leading-relaxed max-w-lg font-medium">
                      {homeConfig.heroDescription}
                    </p>

                    <div className="w-full max-w-lg">
                      <UrlInput
                        onSubmit={handleSubmit}
                        isLoading={isLoadingVideo || isLoadingNotes}
                        placeholder={homeConfig.inputPlaceholder}
                        buttonText={homeConfig.generateButtonText}
                        helperText={homeConfig.helperText}
                        manualLinkText={homeConfig.manualLinkText}
                      />

                      {/* How it works simple steps */}
                      <div className="mt-6 pt-5 border-t border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                          {homeConfig.stepsHeading}
                        </p>
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 border border-primary/20">1</div>
                            <span className="text-sm text-foreground/80 font-medium">{homeConfig.step1}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 border border-primary/20">2</div>
                            <span className="text-sm text-foreground/80 font-medium">{homeConfig.step2}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-black shrink-0 border border-primary/30">3</div>
                            <span className="text-sm text-foreground/80 font-medium">{homeConfig.step3}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Visuals */}
                  {homeConfig.showFloatingCards && (
                    <>
                      {/* === MOBILE: 2-col image grid === */}
                      <div className="grid grid-cols-2 gap-3 lg:hidden pointer-events-none">

                        {/* Card 1: Video Player */}
                        <div className="col-span-2 bg-card border border-border rounded-2xl p-2.5 shadow-lg">
                          <div className="w-full aspect-video bg-black/70 rounded-xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-primary/25 to-transparent z-10" />
                            <div className="absolute inset-0 bg-purple-950/40 mix-blend-color z-10" />
                            <img
                              src={homeConfig.videoImageUrl}
                              alt="Study Video"
                              className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[11px] border-l-white border-b-[7px] border-b-transparent ml-1" />
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-3 right-3 z-20 space-y-1">
                              <div className="h-2 w-2/3 bg-white/30 rounded-full" />
                              <div className="h-1.5 w-1/2 bg-white/20 rounded-full" />
                            </div>
                          </div>
                        </div>

                        {/* Card 2: AI Notes */}
                        <div className="bg-card border border-border rounded-2xl p-3 shadow-lg space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <FileText className="w-3 h-3 text-primary" />
                              </div>
                              <div className="h-2 w-14 bg-foreground/15 rounded-full" />
                            </div>
                            <div className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[8px] font-black uppercase border border-emerald-500/20">{homeConfig.notesBadge}</div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 w-1/3 bg-foreground/20 rounded-full" />
                            <div className="h-1.5 w-full bg-foreground/5 rounded-full" />
                            <div className="h-1.5 w-[90%] bg-foreground/5 rounded-full" />
                            <div className="h-1.5 w-[85%] bg-foreground/5 rounded-full" />
                            <div className="h-1.5 w-[70%] bg-foreground/5 rounded-full" />
                          </div>
                        </div>

                        {/* Card 3: AI Chat Bubble */}
                        <div className="bg-card border border-border rounded-2xl p-3 shadow-lg">
                          <div className="flex gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shrink-0">
                              <img src="/logo.png" className="w-3.5 h-3.5 rounded-sm" alt="" />
                            </div>
                            <div className="bg-secondary border border-border/50 rounded-xl rounded-tl-none p-2 text-[10px] text-foreground leading-relaxed flex-1">
                              {homeConfig.assistantMessage}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <div className="px-2 py-1 rounded-full bg-primary/20 border border-primary/30 text-[8px] font-black uppercase text-primary">{homeConfig.assistantBtn1}</div>
                            <div className="px-2 py-1 rounded-full bg-muted border border-border/50 text-[8px] font-black uppercase text-muted-foreground">{homeConfig.assistantBtn2}</div>
                          </div>
                        </div>

                        {/* Card 4: Study image */}
                        <div className="col-span-2 rounded-2xl overflow-hidden relative h-[110px] border border-border shadow-lg">
                          <img
                            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop"
                            alt="Study Session"
                            className="w-full h-full object-cover opacity-50"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent flex items-center px-4 gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/10">
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-foreground">AI-Powered Notes</p>
                              <p className="text-[10px] text-muted-foreground">Instant summaries from any video</p>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* === DESKTOP: 3D floating cards === */}
                      <div className="relative hidden lg:block h-[650px] perspective-[2000px] pointer-events-none">

                         {/* Floating Card 1: The Video Player */}
                         <div className="absolute top-[5%] right-[10%] w-[340px] bg-card/65 backdrop-blur-3xl border border-border p-3 rounded-3xl shadow-xl transform rotate-[-4deg] translate-z-[50px] animate-float-slow z-10">
                           <div className="w-full aspect-video bg-black/80 rounded-2xl mb-4 overflow-hidden relative ring-1 ring-border/5">
                             <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-primary/20 to-transparent mix-blend-overlay z-10" />
                             <div className="absolute inset-0 bg-purple-950/40 mix-blend-color z-10" />
                             <img src={homeConfig.videoImageUrl} alt="Study Video" className="w-full h-full object-cover opacity-60" />
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                 <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                               </div>
                             </div>
                           </div>
                           <div className="px-3 pb-3 space-y-2">
                             <div className="h-3 w-3/4 bg-foreground/15 rounded-full" />
                             <div className="h-2 w-1/2 bg-foreground/10 rounded-full" />
                           </div>
                         </div>

                         {/* Floating Card 2: The Generated Notes */}
                         <div className="absolute top-[25%] left-[0%] w-[420px] bg-card/85 backdrop-blur-3xl border border-border p-6 rounded-[2rem] shadow-2xl transform rotate-[2deg] translate-z-[120px] animate-float-delayed z-20">
                           <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                 <FileText className="w-5 h-5 text-primary" />
                               </div>
                               <div>
                                 <div className="h-3 w-32 bg-foreground/20 rounded-full mb-2" />
                                 <div className="h-2 w-16 bg-foreground/10 rounded-full" />
                               </div>
                             </div>
                             <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">{homeConfig.notesBadge}</div>
                           </div>
                           <div className="space-y-4">
                             <div className="h-4 w-1/3 bg-foreground/20 rounded-full" />
                             <div className="space-y-2">
                               <div className="h-2.5 w-full bg-foreground/5 rounded-full" />
                               <div className="h-2.5 w-[90%] bg-foreground/5 rounded-full" />
                               <div className="h-2.5 w-[95%] bg-foreground/5 rounded-full" />
                             </div>
                             <div className="grid grid-cols-2 gap-3 mt-6">
                               <div className="h-28 bg-muted/30 rounded-2xl border border-border/50 p-4 space-y-3 shadow-inner">
                                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div className="h-2 w-20 bg-foreground/20 rounded-full" />
                                  <div className="h-1.5 w-full bg-foreground/10 rounded-full" />
                               </div>
                               <div className="h-28 bg-muted/30 rounded-2xl border border-border/50 p-4 space-y-3 shadow-inner">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="h-2 w-16 bg-foreground/20 rounded-full" />
                                  <div className="h-1.5 w-full bg-foreground/10 rounded-full" />
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Floating Card 3: AI Assistant */}
                         <div className="absolute bottom-[5%] right-[5%] w-[320px] bg-card/85 backdrop-blur-3xl border border-border p-5 rounded-3xl shadow-xl transform rotate-[-2deg] translate-z-[180px] animate-float z-30">
                           <div className="flex gap-4">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shrink-0">
                               <img src="/logo.png" className="w-5 h-5 rounded-sm" alt="" />
                             </div>
                             <div className="flex-1 space-y-2">
                               <div className="bg-secondary border border-border/50 rounded-2xl rounded-tl-none p-4 text-sm text-foreground shadow-inner leading-relaxed">
                                 {homeConfig.assistantMessage}
                               </div>
                               <div className="flex gap-2">
                                 <div className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase text-primary">{homeConfig.assistantBtn1}</div>
                                 <div className="px-3 py-1.5 rounded-full bg-muted border border-border/50 text-[10px] font-black uppercase text-muted-foreground">{homeConfig.assistantBtn2}</div>
                               </div>
                             </div>
                           </div>
                         </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen lg:h-screen p-3 sm:p-4 lg:p-6 overflow-y-auto lg:overflow-hidden flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[360px_1fr] 2xl:grid-cols-[400px_1fr] gap-4 lg:gap-6 lg:h-full max-w-[1920px] mx-auto w-full">
                {/* Left Column: Context & Tools */}
                <div className="flex flex-col gap-4 lg:gap-6 lg:h-full lg:min-h-0 lg:overflow-hidden">

                  {/* Video Reference Card */}
                  <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm shrink-0 w-full">
                    <VideoPreview video={videoInfo} isLoading={isLoadingVideo} />
                    <div className="p-4 space-y-3 bg-card/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50">
                          <Clock className="w-3.5 h-3.5" />
                          Study Session
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      </div>
                      <h3 className="font-bold text-sm line-clamp-2 leading-relaxed tracking-tight">
                        {videoInfo?.title}
                      </h3>
                      {videoInfo?.url && (
                        <div className="pt-2 border-t border-border/30">
                          <a
                            href={videoInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
                          >
                            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            <span className="truncate font-mono">{videoInfo.url}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Up Next - Mobile Collapsible Accordion (Hidden on Desktop/Laptop) */}
                  {recommendations.length > 0 && (
                    <div className="lg:hidden rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowMobileRecs(prev => !prev)}
                        className="w-full p-3.5 flex items-center justify-between bg-card/70 hover:bg-secondary/40 transition-colors text-left"
                      >
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-primary" />
                          Up Next ({recommendations.length})
                        </span>
                        {showMobileRecs ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      {showMobileRecs && (
                        <div className="p-3 border-t border-border/40 space-y-2 max-h-72 overflow-y-auto">
                          {recommendations.map((rec, i) => (
                            <button
                              key={i}
                              onClick={() => rec.videoId ? handleSubmit(`https://youtube.com/watch?v=${rec.videoId}`) : window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.query)}`, '_blank')}
                              className="w-full text-left group flex gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-all border border-transparent hover:border-border/50"
                            >
                              <div className="w-20 h-12 rounded-lg bg-secondary overflow-hidden relative shrink-0 shadow-sm">
                                {rec.thumbnail ? (
                                  <img src={rec.thumbnail} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-4 h-4 opacity-40" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                                <h4 className="text-xs font-semibold leading-snug line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
                                  {rec.title || rec.query}
                                </h4>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {rec.channel || 'Topic'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}



                  {/* Related Content (Curriculum View) - Hidden on Mobile */}
                  <div className="hidden lg:flex flex-col rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden flex-1 min-h-0">
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50 backdrop-blur-sm shrink-0">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-primary" />
                        Up Next
                      </h3>
                      {recommendations.length > 0 && (
                        <button onClick={fetchRecs} disabled={isLoadingRecs} className="p-1.5 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground">
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecs ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>

                    <div className="relative flex-1 min-h-0 flex flex-col">
                      {/* Up arrow - top of card */}
                      <button
                        type="button"
                        onClick={scrollUp}
                        className="shrink-0 flex items-center justify-center py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        aria-label="Scroll up"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>

                      <div
                        ref={relatedScrollRef}
                        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-2 scroll-smooth scrollbar-hide"
                      >
                        {isLoadingRecs ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin opacity-30" />
                            <span className="text-xs font-medium opacity-50">Curating...</span>
                          </div>
                        ) : recommendations.length > 0 ? (
                          recommendations.map((rec, i) => (
                            <button key={i} onClick={() => rec.videoId ? handleSubmit(`https://youtube.com/watch?v=${rec.videoId}`) : window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.query)}`, '_blank')}
                              className="w-full text-left group flex gap-3 p-2.5 rounded-xl hover:bg-secondary/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-border/50"
                            >
                              <div className="w-28 h-16 rounded-lg bg-secondary overflow-hidden relative shrink-0 shadow-sm group-hover:shadow-md transition-all">
                                {rec.thumbnail ? (
                                  <img src={rec.thumbnail} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><PlayCircle className="w-5 h-5 opacity-40" /></div>
                                )}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                {rec.videoId && (
                                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-bold text-white tabular-nums">
                                    VIDEO
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                                <h4 className="text-xs font-semibold leading-snug line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors mb-1.5">
                                  {rec.title || rec.query}
                                </h4>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 opacity-70">
                                  {rec.channel ? (
                                    <span className="truncate">{rec.channel}</span>
                                  ) : (
                                    <span className="italic">Topic</span>
                                  )}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                            <Youtube className="w-8 h-8 stroke-1" />
                            <p className="text-xs">No recommendations yet</p>
                          </div>
                        )}
                      </div>

                      {/* Down arrow - bottom of card */}
                      <button
                        type="button"
                        onClick={scrollDown}
                        className="shrink-0 flex items-center justify-center py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        aria-label="Scroll down"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Key Content */}
                <div className="lg:h-full lg:min-h-0 flex flex-col min-h-[500px]">
                  <div className="h-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-card relative flex flex-col transition-all duration-500 hover:shadow-primary/5">
                    {notes ? (
                      <NotesDisplay
                        ref={notesDisplayRef}
                        notes={notes}
                        isLoading={isLoadingNotes}
                        videoTitle={videoInfo?.title}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-card/50">
                        <NotesDisplay notes="" isLoading={true} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default Index;
