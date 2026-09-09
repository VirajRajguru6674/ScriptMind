
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import PricingTable, { Plan } from '@/components/ui/modern-pricing-table';
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import API_BASE_URL from "@/lib/api";

// Sample pricing data
const Pricing = () => {
    const [prices, setPrices] = useState({
        pro_monthly: 999,
        pro_quarterly: 2799,
        pro_yearly: 9999,
        pro_features: "AI Notes, Flashcards, Priority Support",
        expert_monthly: 2499,
        expert_quarterly: 6999,
        expert_yearly: 24999,
        expert_features: "Everything in Pro, Custom Diagrams, Team Collab",
        org_monthly: 14999,
        org_yearly: 149999,
        org_features: "School-wide access, Admin Dashboard, LMS Integration"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/settings/pricing`)
            .then(res => res.json())
            .then(data => {
                setPrices(prev => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load pricing", err);
                setLoading(false);
            });
    }, []);

    const { user } = useAuth();

    const getButtonText = (planName: string, defaultText: string, planType: 'individual' | 'org', interval: 'monthly' | 'quarterly' | 'yearly') => {
        if (!user) return defaultText;
        
        const currentPlan = (user.plan || 'free').toLowerCase();
        const thisPlan = planName.toLowerCase();
        const userHasOrg = !!user.org_id;
        const userCycle = (user.billing_cycle || 'monthly').toLowerCase();

        // If user has org, they only match org plans
        if (userHasOrg && planType === 'individual') return defaultText;
        // If user has no org, they only match individual plans
        if (!userHasOrg && planType === 'org') return defaultText;

        if (currentPlan === thisPlan && userCycle === interval) return "Current Plan";
        return defaultText;
    };

    const isCurrentPlan = (planName: string, planType: 'individual' | 'org', interval: 'monthly' | 'quarterly' | 'yearly') => {
        if (!user) return false;
        
        const currentPlan = (user.plan || 'free').toLowerCase();
        const thisPlan = planName.toLowerCase();
        const userHasOrg = !!user.org_id;
        const userCycle = (user.billing_cycle || 'monthly').toLowerCase();

        if (userHasOrg && planType === 'individual') return false;
        if (!userHasOrg && planType === 'org') return false;

        return currentPlan === thisPlan && userCycle === interval;
    };

    const [category, setCategory] = useState<"individuals" | "organizations">("individuals");
    const [individualInterval, setIndividualInterval] = useState<"monthly" | "yearly">("monthly");
    const [orgInterval, setOrgInterval] = useState<"quarterly" | "yearly">("quarterly");

    const plans: Plan[] = category === "individuals" ? [
        {
            title: "Free",
            price: { monthly: 0, yearly: 0, quarterly: 0 },
            description: "Essential tools for casual learners",
            features: [
                "5 AI-powered notes/mo",
                "Standard GPT-3.5 Summaries",
                "720p Video downloads",
                "PDF Exports with watermarks",
                "Public community access"
            ],
            ctaText: getButtonText("Free", "Start Learning", 'individual', 'monthly'),
            ctaHref: "/checkout?plan=Free&price=0&interval=month",
            isFeatured: false,
            disabled: isCurrentPlan("Free", 'individual', 'monthly')
        },
        {
            title: "Pro",
            price: {
                monthly: prices.pro_monthly,
                yearly: prices.pro_yearly,
                quarterly: 0
            },
            description: "Enhanced learning for power students",
            features: [
                "100 AI-powered notes/mo",
                "Advanced GPT-4/Gemini Pro",
                "Interactive Flashcards",
                "1080p Full HD downloads",
                "Priority note processing",
                "No PDF watermarks"
            ],
            ctaText: getButtonText("Pro", "Go Pro", 'individual', individualInterval),
            ctaHref: `/checkout?plan=Pro&price=${individualInterval === 'monthly' ? prices.pro_monthly : prices.pro_yearly}&interval=${individualInterval === 'monthly' ? 'month' : 'year'}`,
            isFeatured: true,
            disabled: isCurrentPlan("Pro", 'individual', individualInterval)
        },
        {
            title: "Expert",
            price: {
                monthly: prices.expert_monthly,
                yearly: prices.expert_yearly,
                quarterly: 0
            },
            description: "Ultimate suite for researchers & creators",
            features: [
                "500 AI-powered notes/mo",
                "Custom Mindmaps & Diagrams",
                "4K Ultra HD downloads",
                "Full Playlist Downloader",
                "Custom AI Tone & Detail",
                "24/7 Dedicated support"
            ],
            ctaText: getButtonText("Expert", "Buy Expert", 'individual', individualInterval),
            ctaHref: `/checkout?plan=Expert&price=${individualInterval === 'monthly' ? prices.expert_monthly : prices.expert_yearly}&interval=${individualInterval === 'monthly' ? 'month' : 'year'}`,
            isFeatured: false,
            disabled: isCurrentPlan("Expert", 'individual', individualInterval)
        }
    ] : [
        {
            title: "Pro School",
            price: {
                monthly: prices.pro_monthly,
                quarterly: prices.pro_quarterly,
                yearly: prices.pro_yearly
            },
            description: "Advanced tools for small departments",
            features: [
                "Team-wide AI Notes",
                "Admin Analytics Dashboard",
                "Shared Class Folders",
                "Standard API Access",
                "Priority Support"
            ],
            ctaText: getButtonText("Pro", "Get Started", 'org', orgInterval),
            ctaHref: `/checkout?plan=Pro&price=${orgInterval === 'quarterly' ? prices.pro_quarterly : prices.pro_yearly}&interval=${orgInterval === 'quarterly' ? 'quarter' : 'year'}&type=org`,
            isFeatured: false,
            disabled: isCurrentPlan("Pro", 'org', orgInterval)
        },
        {
            title: "Expert School",
            price: {
                monthly: prices.expert_monthly,
                quarterly: prices.expert_quarterly,
                yearly: prices.expert_yearly
            },
            description: "Full research suite for universities",
            features: [
                "All Expert Plan features",
                "LMS Integration (Canvas/Moodle)",
                "Bulk Student Onboarding",
                "Advanced Security SSO",
                "Dedicated Account Manager"
            ],
            ctaText: getButtonText("Expert", "Get Started", 'org', orgInterval),
            ctaHref: `/checkout?plan=Expert&price=${orgInterval === 'quarterly' ? prices.expert_quarterly : prices.expert_yearly}&interval=${orgInterval === 'quarterly' ? 'quarter' : 'year'}&type=org`,
            isFeatured: true,
            disabled: isCurrentPlan("Expert", 'org', orgInterval)
        }
    ];

    return (
        <>
            <Helmet>
                <title>Pricing Plans - ScriptMind</title>
            </Helmet>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <header className="sticky top-0 z-50 w-full border-b border-sidebar-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-16 items-center justify-between px-6">
                        {/* Page title shown in header row on desktop, aligned with sidebar logo */}
                        <div className="flex items-center gap-3 pl-12 lg:pl-0">
                            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                                Pricing Plans
                            </h1>
                        </div>
                        {/* Right side controls */}
                        <div className="flex items-center gap-2">
                            <NotificationPanel />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 max-w-6xl mx-auto w-full pb-10 space-y-6">
                    
                    {/* Compact Category & Interval Header */}
                    <div className="flex flex-col items-center gap-3.5 text-center">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Choose Your Plan</h1>
                            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">Select the perfect subscription for your learning journey.</p>
                        </div>

                        {/* Controls: Category Switcher + Interval Switcher in a neat, balanced row */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5">
                            {/* Category toggle: Individuals / Organizations */}
                            <div className="flex bg-secondary/70 border border-border/40 p-1 rounded-xl shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setCategory("individuals")}
                                    className={cn(
                                        "px-4 py-1.5 text-center rounded-lg font-bold text-xs sm:text-sm transition-all duration-200",
                                        category === "individuals"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Individuals
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCategory("organizations")}
                                    className={cn(
                                        "px-4 py-1.5 text-center rounded-lg font-bold text-xs sm:text-sm transition-all duration-200",
                                        category === "organizations"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Organizations
                                </button>
                            </div>

                            {/* Interval toggle: Monthly / Yearly or Quarterly / Yearly */}
                            {category === "individuals" ? (
                                <div className="flex bg-secondary/50 border border-border/30 p-1 rounded-xl shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setIndividualInterval("monthly")}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all",
                                            individualInterval === "monthly"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIndividualInterval("yearly")}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all",
                                            individualInterval === "yearly"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Yearly
                                        <Badge className="bg-emerald-500/15 text-emerald-500 border-0 text-[10px] h-4 px-1.5 font-bold">Save 20%</Badge>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex bg-secondary/50 border border-border/30 p-1 rounded-xl shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setOrgInterval("quarterly")}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all",
                                            orgInterval === "quarterly"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Quarterly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrgInterval("yearly")}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all",
                                            orgInterval === "yearly"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Yearly
                                        <Badge className="bg-emerald-500/15 text-emerald-500 border-0 text-[10px] h-4 px-1.5 font-bold">Best Value</Badge>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <PricingTable 
                        plans={plans} 
                        interval={category === "individuals" ? individualInterval : orgInterval}
                    />
                </div>
            </div>
        </>
    );
};

export default Pricing;
