
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import PricingTable, { Plan } from '@/components/ui/modern-pricing-table';
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";
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

    if (loading) return null;

    return (
        <>
            <Helmet>
                <title>Pricing - ScriptMind</title>
            </Helmet>

            <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0 lg:ml-[296px]">
                    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-16 items-center justify-between px-6">
                            {/* Page title shown in header row on desktop, aligned with sidebar logo */}
                            <div className="flex items-center gap-3 pl-12 lg:pl-0">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-purple-400 bg-clip-text text-transparent">
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

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full pb-12 animate-fade-in space-y-12">
                        
                        {/* Main Category Tabs */}
                        <div className="flex flex-col items-center gap-8">
                            <div className="text-center space-y-4">
                                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Choose Your Plan</h1>
                                <p className="text-muted-foreground text-lg max-w-2xl">Select the perfect subscription for your learning journey.</p>
                            </div>

                            <Tabs value={category} onValueChange={(v) => setCategory(v as any)} className="w-full max-w-[400px]">
                                <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-secondary/50 rounded-2xl">
                                    <TabsTrigger value="individuals" className="rounded-xl font-bold text-base data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">Individuals</TabsTrigger>
                                    <TabsTrigger value="organizations" className="rounded-xl font-bold text-base data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all">Organizations</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Sub Tabs based on category */}
                            <div className="flex items-center gap-4">
                                {category === "individuals" ? (
                                    <Tabs value={individualInterval} onValueChange={(v) => setIndividualInterval(v as any)}>
                                        <TabsList className="h-11 p-1 bg-secondary/30 rounded-xl">
                                            <TabsTrigger value="monthly" className="px-6 rounded-lg font-bold text-sm">Monthly</TabsTrigger>
                                            <TabsTrigger value="yearly" className="px-6 rounded-lg font-bold text-sm flex gap-2">
                                                Yearly
                                                <Badge className="bg-green-500/10 text-green-500 border-0 text-[10px] h-4">Save 20%</Badge>
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                ) : (
                                    <Tabs value={orgInterval} onValueChange={(v) => setOrgInterval(v as any)}>
                                        <TabsList className="h-11 p-1 bg-secondary/30 rounded-xl">
                                            <TabsTrigger value="quarterly" className="px-6 rounded-lg font-bold text-sm">Quarterly</TabsTrigger>
                                            <TabsTrigger value="yearly" className="px-6 rounded-lg font-bold text-sm flex gap-2">
                                                Yearly
                                                <Badge className="bg-green-500/10 text-green-500 border-0 text-[10px] h-4">Best Value</Badge>
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                )}
                            </div>
                        </div>

                        <PricingTable 
                            plans={plans} 
                            interval={category === "individuals" ? individualInterval : orgInterval}
                        />
                    </div>
                </main>
            </div>
        </>
    );
};

export default Pricing;
