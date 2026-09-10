import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Ban,
    CheckCircle,
    Search,
    Shield,
    Activity,
    Download,
    FileText,
    TrendingUp,
    MoreHorizontal,
    Mail,
    RefreshCcw,
    AlertCircle,
    BellRing,
    Users,
    ClipboardList,
    DollarSign,
    Eye,
    Clock,
    Globe,
    Crown,
    X,
    LayoutTemplate,
    Sparkles,
    ExternalLink,
    ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, addDays, addMonths, addYears, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import API_BASE_URL from "@/lib/api";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaletteCustomizer } from "@/components/PaletteCustomizer";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface UserData {
    id: number;
    username: string;
    email: string;
    plan: string;
    role: string;
    org_id: number | null;
    org_name?: string | null;
    usage_count: number;
    downloads_count: number;
    total_notes: number;
    billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
    created_at: string;
    suspended_until: string | null;
    avatar_url?: string;
}

interface LogData {
    id: number;
    user_id: number;
    username: string;
    email: string;
    action: string;
    details: any;
    created_at: string;
}

const AVATAR_PALETTES = [
    { bg: "bg-gradient-to-tr from-blue-600 to-indigo-600", border: "border-blue-300/40", glow: "shadow-blue-500/25" },
    { bg: "bg-gradient-to-tr from-purple-600 to-pink-600", border: "border-purple-300/40", glow: "shadow-purple-500/25" },
    { bg: "bg-gradient-to-tr from-emerald-500 to-teal-600", border: "border-emerald-300/40", glow: "shadow-emerald-500/25" },
    { bg: "bg-gradient-to-tr from-amber-500 to-orange-600", border: "border-amber-300/40", glow: "shadow-amber-500/25" },
    { bg: "bg-gradient-to-tr from-rose-500 to-red-600", border: "border-rose-300/40", glow: "shadow-rose-500/25" },
    { bg: "bg-gradient-to-tr from-cyan-500 to-blue-600", border: "border-cyan-300/40", glow: "shadow-cyan-500/25" },
    { bg: "bg-gradient-to-tr from-violet-600 to-fuchsia-600", border: "border-violet-300/40", glow: "shadow-violet-500/25" },
    { bg: "bg-gradient-to-tr from-teal-500 to-emerald-700", border: "border-teal-300/40", glow: "shadow-teal-500/25" },
    { bg: "bg-gradient-to-tr from-indigo-600 to-sky-500", border: "border-indigo-300/40", glow: "shadow-indigo-500/25" },
    { bg: "bg-gradient-to-tr from-pink-600 to-rose-600", border: "border-pink-300/40", glow: "shadow-pink-500/25" },
];

function getAvatarPalette(identifier: string | number) {
    const str = String(identifier || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name?: string, email?: string) {
    const raw = (name || email || 'User').trim();
    const parts = raw.split(/[\s_.-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
}

function UserAvatar({
    user,
    size = "md",
    showStatus = true,
}: {
    user?: UserData | null;
    size?: "sm" | "md" | "lg";
    showStatus?: boolean;
}) {
    const [imgError, setImgError] = useState(false);
    const identifier = user?.id ? `${user.id}-${user.username}` : (user?.username || user?.email || 'user');
    const palette = getAvatarPalette(identifier);
    const initials = getInitials(user?.username, user?.email);
    const isSuspended = Boolean(user?.suspended_until && new Date(user.suspended_until) > new Date());

    const sizeClasses = {
        sm: "size-8 text-[11px] rounded-lg",
        md: "size-9 sm:size-10 text-xs rounded-xl",
        lg: "size-14 text-base rounded-2xl",
    }[size];

    return (
        <div className="relative shrink-0">
            <div
                className={cn(
                    sizeClasses,
                    "flex items-center justify-center font-black text-white border shadow-md transition-transform duration-200 group-hover:scale-105 select-none overflow-hidden tracking-wider",
                    palette.bg,
                    palette.border,
                    palette.glow
                )}
            >
                {user?.avatar_url && !imgError ? (
                    <img
                        src={user.avatar_url}
                        alt={user.username || 'User avatar'}
                        onError={() => setImgError(true)}
                        className="size-full object-cover"
                    />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {showStatus && (
                <span
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-background size-2.5",
                        isSuspended ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                    )}
                    title={isSuspended ? "Suspended" : "Active"}
                />
            )}
        </div>
    );
}

export default function Admin() {
    const { user, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [logs, setLogs] = useState<LogData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const { toast } = useToast();

    // Pricing State
    const [pricing, setPricing] = useState({
        pro_monthly: 999,
        pro_quarterly: 2499,
        pro_yearly: 9999,
        pro_features: "100 AI Notes, GPT-4 Models, Flashcards, 1080p Downloads, Priority Support",
        expert_monthly: 2499,
        expert_quarterly: 6999,
        expert_yearly: 24999,
        expert_features: "500 AI Notes, Mindmaps & Diagrams, 4K Downloads, Playlist Access, SSO Integration",
        org_monthly: 14999,
        org_quarterly: 39999,
        org_yearly: 149999,
        org_features: "Unlimited Licenses, LMS Integration, Bulk Onboarding, 99.9% SLA, Custom Branding"
    });

    // Dialog States
    const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [suspendDate, setSuspendDate] = useState("");
    const [detailTab, setDetailTab] = useState("overview");

    // Announcement State
    const [announcement, setAnnouncement] = useState({
        title: "",
        message: "",
        type: "info"
    });

    const [logDateRange, setLogDateRange] = useState<DateRange | undefined>();
    const [userDateRange, setUserDateRange] = useState<DateRange | undefined>();

    useEffect(() => {
        fetchData();
    }, [isAuthenticated, user]);

    const setSuspensionPreset = (type: '1d' | '3m' | '1y') => {
        const now = new Date();
        let targetDate: Date;

        if (type === '1d') targetDate = addDays(now, 1);
        else if (type === '3m') targetDate = addMonths(now, 3);
        else targetDate = addYears(now, 1);

        setSuspendDate(format(targetDate, 'yyyy-MM-dd'));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const [usersRes, logsRes, pricingRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/users`, { headers }),
                fetch(`${API_BASE_URL}/admin/audit-logs`, { headers }),
                fetch(`${API_BASE_URL}/settings/pricing`)
            ]);

            if (pricingRes.ok) {
                const pricingData = await pricingRes.json();
                if (pricingData && typeof pricingData === 'object') {
                    setPricing(prev => ({ ...prev, ...pricingData }));
                }
            }

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                }
            }

            if (logsRes.ok) {
                const logsData = await logsRes.json();
                if (Array.isArray(logsData)) {
                    setLogs(logsData);
                }
            }
        } catch (error) {
            console.error("Admin data fetch error:", error);
            toast({
                variant: 'destructive',
                title: 'Sync Notice',
                description: 'Could not refresh some live statistics. Retrying on next interaction.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (userId: number, field: 'plan' | 'role', value: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [field]: value })
            });
            if (!res.ok) throw new Error("Update failed");

            setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
            toast({ title: "Updated", description: `User ${field} successfully changed to ${value}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user' });
        }
    };

    const handlePricingUpdate = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/settings/pricing`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(pricing)
            });
            if (!res.ok) throw new Error("Failed to update pricing");
            toast({ title: "Pricing Saved", description: "Subscription configurations updated successfully." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: "Update failed" });
        }
    };

    const handleSuspend = async () => {
        if (!selectedUser) return;
        const token = localStorage.getItem('token');
        const suspendedUntil = suspendDate ? new Date(suspendDate).toISOString().slice(0, 19).replace('T', ' ') : null;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.id}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ suspendedUntil })
            });

            if (!res.ok) throw new Error("Suspension update failed");

            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, suspended_until: suspendedUntil } : u));
            toast({ 
                title: "Status Changed", 
                description: suspendedUntil ? `Account suspended until ${format(new Date(suspendedUntil), 'PPP')}` : "User restriction cleared. Account active." 
            });
            setSuspendDate("");
            setIsSuspendDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Suspension action failed' });
        }
    };

    const sendAnnouncement = () => {
        if (!announcement.title.trim() || !announcement.message.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please provide both title and message.' });
            return;
        }
        toast({ title: "Announcement Transmitted", description: "Global notification broadcast to all active users." });
        setAnnouncement({ title: "", message: "", type: "info" });
    };

    const handleExportReport = () => {
        if (users.length === 0) {
            toast({ variant: 'destructive', title: 'Export Failed', description: 'No user records to export.' });
            return;
        }
        const csvContent = "data:text/csv;charset=utf-8," 
            + ["ID,Username,Email,Plan,BillingCycle,Role,UsageCount,TotalNotes,Downloads,Status,JoinedDate"]
            .concat(users.map(u => `${u.id},"${u.username}","${u.email}",${u.plan},${u.billing_cycle || 'monthly'},${u.role},${u.usage_count},${u.total_notes || 0},${u.downloads_count || 0},${u.suspended_until ? 'Suspended' : 'Active'},"${u.created_at}"`))
            .join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `scriptmind_users_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast({ title: "Report Exported", description: `Exported ${users.length} user records to CSV file.` });
    };

    // Filtered Users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch = !query || 
                u.username.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query) ||
                (u.org_name && u.org_name.toLowerCase().includes(query));

            const matchesPlan = planFilter === 'all' || u.plan === planFilter || (planFilter === 'organization' && !!u.org_id);
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            const isSuspended = u.suspended_until && new Date(u.suspended_until) > new Date();
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && !isSuspended) || (statusFilter === 'suspended' && isSuspended);

            let matchesDate = true;
            if (userDateRange?.from) {
                const joinDate = new Date(u.created_at);
                const start = startOfDay(userDateRange.from);
                const end = userDateRange.to ? endOfDay(userDateRange.to) : endOfDay(userDateRange.from);
                matchesDate = isWithinInterval(joinDate, { start, end });
            }

            return matchesSearch && matchesPlan && matchesRole && matchesStatus && matchesDate;
        });
    }, [users, searchTerm, planFilter, roleFilter, statusFilter, userDateRange]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch = !query ||
                (log.username || '').toLowerCase().includes(query) ||
                (log.email || '').toLowerCase().includes(query) ||
                (log.action || '').toLowerCase().includes(query);

            if (!logDateRange?.from) return matchesSearch;

            const logDate = new Date(log.created_at);
            const start = startOfDay(logDateRange.from);
            const end = logDateRange.to ? endOfDay(logDateRange.to) : endOfDay(logDateRange.from);

            return matchesSearch && isWithinInterval(logDate, { start, end });
        });
    }, [logs, searchTerm, logDateRange]);

    // KPI Calculations
    const proCount = users.filter(u => u.plan === 'pro' && !u.org_id).length;
    const expertCount = users.filter(u => u.plan === 'expert' && !u.org_id).length;
    const orgCount = users.filter(u => u.org_id || u.plan === 'organization').length;
    const premiumUsersCount = proCount + expertCount + orgCount;
    const activeUsers = users.filter(u => !u.suspended_until || new Date(u.suspended_until) <= new Date()).length;

    const calculateUserRevenue = (u: UserData) => {
        if (u.org_id) return pricing.org_monthly / 10;
        if (u.plan === 'expert') {
            if (u.billing_cycle === 'yearly') return pricing.expert_yearly / 12;
            if (u.billing_cycle === 'quarterly') return pricing.expert_quarterly / 3;
            return pricing.expert_monthly;
        }
        if (u.plan === 'pro') {
            if (u.billing_cycle === 'yearly') return pricing.pro_yearly / 12;
            if (u.billing_cycle === 'quarterly') return pricing.pro_quarterly / 3;
            return pricing.pro_monthly;
        }
        return 0;
    };

    const totalRevenue = Math.round(users.reduce((acc, u) => acc + calculateUserRevenue(u), 0));
    const totalNotes = users.reduce((acc, u) => acc + (u.total_notes || u.usage_count || 0), 0);

    const userLogs = useMemo(() => {
        if (!selectedUser) return [];
        return logs.filter(l => l.user_id === selectedUser.id);
    }, [logs, selectedUser]);

    return (
        <>
            <Helmet><title>Admin Management Console | ScriptMind</title></Helmet>
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden selection:bg-primary/20">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-40 w-full border-b border-sidebar-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shrink-0">
                        <div className="flex h-16 items-center justify-between px-3 sm:px-8">
                            <div className="flex items-center gap-2 pl-12 lg:pl-0">
                                <h1 className="text-sm sm:text-base md:text-xl font-black tracking-tight flex items-center gap-1.5">
                                    <span className="text-foreground">Admin</span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">Management</span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2.5">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={fetchData} 
                                    className="rounded-xl h-8 sm:h-9 px-2.5 sm:px-3.5 border-border/80 hover:bg-secondary/60 text-xs font-bold gap-1.5"
                                    title="Sync Data"
                                >
                                    <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin text-primary")} />
                                    <span className="hidden sm:inline">Sync Data</span>
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleExportReport}
                                    className="rounded-xl h-8 sm:h-9 px-2.5 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm gap-1.5 transition-all"
                                    title="Export CSV"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Export CSV</span>
                                </Button>
                                <div className="h-4 w-px bg-border/60 mx-0.5 sm:mx-1" />
                                <NotificationPanel />
                                <PaletteCustomizer />
                                <ThemeToggle />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
                        
                        {/* KPI Stat Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            {[
                                { 
                                    label: "Total Registered Users", 
                                    value: users.length, 
                                    icon: Users, 
                                    color: "text-blue-500", 
                                    bg: "bg-blue-500/10 border-blue-500/20", 
                                    trend: `${activeUsers} active accounts`,
                                    highlight: "from-blue-500/5 to-transparent"
                                },
                                { 
                                    label: "Notes Generated", 
                                    value: totalNotes.toLocaleString(), 
                                    icon: FileText, 
                                    color: "text-purple-500", 
                                    bg: "bg-purple-500/10 border-purple-500/20", 
                                    trend: `${users.length > 0 ? (totalNotes / users.length).toFixed(1) : 0} avg per user`,
                                    highlight: "from-purple-500/5 to-transparent"
                                },
                                { 
                                    label: "Estimated Revenue (MRR)", 
                                    value: `₹${totalRevenue.toLocaleString()}`, 
                                    icon: DollarSign, 
                                    color: "text-emerald-500", 
                                    bg: "bg-emerald-500/10 border-emerald-500/20", 
                                    trend: `${premiumUsersCount} paying subscriptions`,
                                    highlight: "from-emerald-500/5 to-transparent"
                                },
                                { 
                                    label: "Premium Members", 
                                    value: premiumUsersCount, 
                                    icon: Crown, 
                                    color: "text-amber-500", 
                                    bg: "bg-amber-500/10 border-amber-500/20", 
                                    trend: `${users.length > 0 ? Math.round((premiumUsersCount / users.length) * 100) : 0}% conversion rate`,
                                    highlight: "from-amber-500/5 to-transparent"
                                },
                            ].map((stat, i) => (
                                <Card key={i} className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 hover:bg-card/90 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md group">
                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", stat.highlight)} />
                                    <CardContent className="p-5 relative z-10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                            <div className={cn("size-9 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110", stat.bg)}>
                                                <stat.icon className={cn("size-4.5", stat.color)} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{loading ? "..." : stat.value}</h3>
                                            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                                <TrendingUp className="size-3 text-emerald-500 shrink-0" />
                                                <span>{stat.trend}</span>
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Main Tabs Navigation */}
                        <Tabs defaultValue="users" className="w-full space-y-5">
                            
                            {/* Segmented Tab Headers */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 p-1.5 rounded-2xl border border-border/80 backdrop-blur-xl">
                                <TabsList className="bg-transparent h-auto p-0 gap-1.5 flex flex-wrap">
                                    {[
                                        { value: "users", label: "Users Directory", icon: Users, count: users.length },
                                        { value: "logs", label: "Activity Logs", icon: ClipboardList, count: logs.length },
                                        { value: "pricing", label: "Pricing Config", icon: DollarSign },
                                        { value: "announcements", label: "Broadcast Alerts", icon: BellRing },
                                        { value: "homepage", label: "Home Page CMS", icon: LayoutTemplate },
                                    ].map(tab => (
                                        <TabsTrigger
                                            key={tab.value}
                                            value={tab.value}
                                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold transition-all gap-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <tab.icon className="size-3.5" />
                                            <span>{tab.label}</span>
                                            {tab.count !== undefined && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/40 font-mono">
                                                    {tab.count}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {/* TAB 1: USERS DIRECTORY */}
                            <TabsContent value="users" className="space-y-4 outline-none animate-in fade-in duration-300">
                                
                                {/* Filters Bar */}
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/60">
                                    <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                            <Input
                                                placeholder="Search by username, email, or org..."
                                                className="pl-9 pr-8 h-9 text-xs rounded-xl bg-background/70 border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Plan Filter */}
                                        <Select value={planFilter} onValueChange={setPlanFilter}>
                                            <SelectTrigger className="h-9 w-full sm:w-[130px] rounded-xl bg-background/70 border-border/80 text-xs font-bold">
                                                <SelectValue placeholder="Plan" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/80 shadow-xl">
                                                <SelectItem value="all" className="text-xs font-semibold">All Plans</SelectItem>
                                                <SelectItem value="free" className="text-xs font-semibold">Free</SelectItem>
                                                <SelectItem value="pro" className="text-xs font-semibold">Pro</SelectItem>
                                                <SelectItem value="expert" className="text-xs font-semibold">Expert</SelectItem>
                                                <SelectItem value="organization" className="text-xs font-semibold">Organization</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Role Filter */}
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger className="h-9 w-full sm:w-[120px] rounded-xl bg-background/70 border-border/80 text-xs font-bold">
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/80 shadow-xl">
                                                <SelectItem value="all" className="text-xs font-semibold">All Roles</SelectItem>
                                                <SelectItem value="user" className="text-xs font-semibold">User</SelectItem>
                                                <SelectItem value="admin" className="text-xs font-semibold">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Status Filter */}
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-9 w-full sm:w-[130px] rounded-xl bg-background/70 border-border/80 text-xs font-bold">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/80 shadow-xl">
                                                <SelectItem value="all" className="text-xs font-semibold">All Status</SelectItem>
                                                <SelectItem value="active" className="text-xs font-semibold">Active</SelectItem>
                                                <SelectItem value="suspended" className="text-xs font-semibold">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <DatePickerWithRange date={userDateRange} setDate={setUserDateRange} className="w-full sm:w-[220px]" />
                                        {(userDateRange || searchTerm || planFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setPlanFilter("all");
                                                    setRoleFilter("all");
                                                    setStatusFilter("all");
                                                    setUserDateRange(undefined);
                                                }}
                                                className="h-9 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                                            >
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                    <span>Showing <strong className="text-foreground font-bold">{filteredUsers.length}</strong> of {users.length} registered accounts</span>
                                </div>

                                {/* Users Table */}
                                <Card className="border border-border/80 bg-card/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-secondary/40 border-b border-border/60">
                                                <TableRow className="border-border/60 hover:bg-transparent">
                                                    <TableHead className="py-3.5 pl-6 text-[11px] font-black uppercase tracking-wider text-muted-foreground">User</TableHead>
                                                    <TableHead className="py-3.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Plan Tier</TableHead>
                                                    <TableHead className="py-3.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Billing Cycle</TableHead>
                                                    <TableHead className="py-3.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">System Role</TableHead>
                                                    <TableHead className="py-3.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Notes Usage</TableHead>
                                                    <TableHead className="py-3.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                                    <TableHead className="py-3.5 pr-6 text-right text-[11px] font-black uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loading ? (
                                                    // Skeleton Loading Rows
                                                    [1, 2, 3, 4, 5].map((s) => (
                                                        <TableRow key={s} className="border-border/40 animate-pulse">
                                                            <TableCell className="py-4 pl-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-9 rounded-xl bg-secondary/80" />
                                                                    <div className="space-y-1.5">
                                                                        <div className="h-3.5 w-24 bg-secondary/80 rounded" />
                                                                        <div className="h-2.5 w-32 bg-secondary/60 rounded" />
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell><div className="h-8 w-24 bg-secondary/60 rounded-xl" /></TableCell>
                                                            <TableCell><div className="h-5 w-16 bg-secondary/60 rounded-md" /></TableCell>
                                                            <TableCell><div className="h-8 w-20 bg-secondary/60 rounded-xl" /></TableCell>
                                                            <TableCell><div className="h-2.5 w-20 bg-secondary/60 rounded" /></TableCell>
                                                            <TableCell><div className="h-5 w-16 bg-secondary/60 rounded-full" /></TableCell>
                                                            <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-secondary/60 rounded-xl ml-auto" /></TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : filteredUsers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                                <div className="size-12 rounded-2xl bg-secondary/60 flex items-center justify-center text-muted-foreground">
                                                                    <Users className="w-6 h-6" />
                                                                </div>
                                                                <p className="font-bold text-sm text-foreground">No accounts found</p>
                                                                <p className="text-xs max-w-sm">No user records matched your search or active filter settings.</p>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={fetchData} 
                                                                    className="mt-2 rounded-xl text-xs font-bold"
                                                                >
                                                                    Refresh Database
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredUsers.map((u) => {
                                                        const isSuspended = u.suspended_until && new Date(u.suspended_until) > new Date();

                                                        return (
                                                            <TableRow key={u.id} className="border-border/50 hover:bg-secondary/30 transition-colors group">
                                                                <TableCell className="py-3.5 pl-6">
                                                                    <div className="flex items-center gap-3.5">
                                                                        <UserAvatar user={u} size="md" />
                                                                        <div>
                                                                            <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                                                {u.username}
                                                                                {u.role === 'admin' && (
                                                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                                                                                        Admin
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                                                                                <span>{u.email}</span>
                                                                                {u.org_name && (
                                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] font-bold border border-blue-500/20">
                                                                                        <Globe className="size-2.5" />
                                                                                        {u.org_name}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                
                                                                <TableCell>
                                                                    <Select defaultValue={u.plan} onValueChange={(v) => handleUpdate(u.id, 'plan', v)}>
                                                                        <SelectTrigger className="w-28 h-8 rounded-xl bg-background/60 border-border/80 text-xs font-bold">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl border-border/80 shadow-xl">
                                                                            <SelectItem value="free" className="text-xs font-semibold">Free</SelectItem>
                                                                            <SelectItem value="pro" className="text-xs font-bold text-amber-500">Pro</SelectItem>
                                                                            <SelectItem value="expert" className="text-xs font-bold text-purple-500">Expert</SelectItem>
                                                                            <SelectItem value="organization" className="text-xs font-bold text-blue-500">Organization</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <span className={cn(
                                                                        "inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider border",
                                                                        u.billing_cycle === 'yearly' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                                        u.billing_cycle === 'quarterly' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                                                        'bg-secondary text-muted-foreground border-border/60'
                                                                    )}>
                                                                        {u.billing_cycle || 'monthly'}
                                                                    </span>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <Select defaultValue={u.role} onValueChange={(v) => handleUpdate(u.id, 'role', v)}>
                                                                        <SelectTrigger className="w-24 h-8 rounded-xl bg-background/60 border-border/80 text-xs font-bold">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl border-border/80 shadow-xl">
                                                                            <SelectItem value="user" className="text-xs font-semibold">User</SelectItem>
                                                                            <SelectItem value="admin" className="text-xs font-bold text-red-500">Admin</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <div className="space-y-1 w-28">
                                                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                                                            <span>{u.total_notes || 0} notes</span>
                                                                            <span>{u.downloads_count || 0} dl</span>
                                                                        </div>
                                                                        <Progress value={Math.min(100, ((u.total_notes || 0) / 50) * 100)} className="h-1.5 bg-secondary rounded-full" />
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell>
                                                                    {isSuspended ? (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-extrabold uppercase">
                                                                            <Ban className="size-2.5" />
                                                                            Suspended
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
                                                                            <CheckCircle className="size-2.5" />
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </TableCell>

                                                                <TableCell className="text-right pr-6">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground">
                                                                                <MoreHorizontal className="w-4 h-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border/80 shadow-2xl p-1">
                                                                            <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-wider px-2 py-1.5">User Management</DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                className="rounded-xl gap-2 font-semibold text-xs py-2 cursor-pointer"
                                                                                onSelect={() => {
                                                                                    setSelectedUser(u);
                                                                                    setDetailTab("overview");
                                                                                    setIsDetailDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <Eye className="size-3.5 text-primary" /> View Full Profile
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="rounded-xl gap-2 font-semibold text-xs py-2 cursor-pointer"
                                                                                onSelect={() => {
                                                                                    setSelectedUser(u);
                                                                                    setDetailTab("activity");
                                                                                    setIsDetailDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <Activity className="size-3.5 text-purple-500" /> Activity History
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="rounded-xl gap-2 font-semibold text-xs py-2 cursor-pointer"
                                                                                onSelect={() => {
                                                                                    window.location.href = `mailto:${u.email}`;
                                                                                }}
                                                                            >
                                                                                <Mail className="size-3.5 text-blue-500" /> Direct Message
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                className="rounded-xl gap-2 font-semibold text-xs py-2 text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                                                                onSelect={() => {
                                                                                    setSelectedUser(u);
                                                                                    setSuspendDate(u.suspended_until ? new Date(u.suspended_until).toISOString().split('T')[0] : "");
                                                                                    setIsSuspendDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <Ban className="size-3.5" />
                                                                                {isSuspended ? "Unsuspend / Reactivate" : "Suspend Account"}
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* TAB 2: ACTIVITY LOGS */}
                            <TabsContent value="logs" className="space-y-4 outline-none animate-in fade-in duration-300">
                                <Card className="border border-border/80 bg-card/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-border/60">
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">System Audit Trail</h3>
                                            <p className="text-xs text-muted-foreground">Historical records of admin updates, user actions, and system events.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DatePickerWithRange date={logDateRange} setDate={setLogDateRange} />
                                            {logDateRange && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setLogDateRange(undefined)}
                                                    className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-secondary/40 border-b border-border/60">
                                                <TableRow className="border-border/60 hover:bg-transparent">
                                                    <TableHead className="py-3 pl-6 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Timestamp</TableHead>
                                                    <TableHead className="py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">User / Agent</TableHead>
                                                    <TableHead className="py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Action Type</TableHead>
                                                    <TableHead className="py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Payload Details</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredLogs.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                                <Clock className="size-8 text-muted-foreground/50" />
                                                                <p className="font-bold text-sm text-foreground">No audit logs recorded</p>
                                                                <p className="text-xs">Audit logs will appear here when user or admin actions take place.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredLogs.map((log) => (
                                                        <TableRow key={log.id} className="border-border/50 hover:bg-secondary/30 transition-colors">
                                                            <TableCell className="py-3 pl-6">
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                                    <Clock className="size-3 text-primary shrink-0" />
                                                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-xs font-bold text-foreground">{log.username || 'System Agent'}</div>
                                                                <div className="text-[10px] text-muted-foreground font-mono">{log.email}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                                                                    {log.action}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="max-w-md">
                                                                <div className="p-1.5 rounded-lg bg-background/80 border border-border/60 font-mono text-[10px] text-muted-foreground truncate hover:whitespace-normal transition-all">
                                                                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '{}')}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* TAB 3: PRICING CONFIGURATION */}
                            <TabsContent value="pricing" className="space-y-4 outline-none animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    
                                    {/* Pro Plan Card */}
                                    <Card className="rounded-2xl border border-amber-500/30 bg-card/70 p-6 space-y-4 shadow-lg shadow-amber-500/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                                    <TrendingUp className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-base text-foreground">Pro Plan</h3>
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase">{proCount} Active Subscribers</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Monthly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.pro_monthly}
                                                    onChange={(e) => setPricing({ ...pricing, pro_monthly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quarterly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.pro_quarterly}
                                                    onChange={(e) => setPricing({ ...pricing, pro_quarterly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Yearly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.pro_yearly}
                                                    onChange={(e) => setPricing({ ...pricing, pro_yearly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Included Features</label>
                                                <textarea
                                                    value={pricing.pro_features}
                                                    onChange={(e) => setPricing({ ...pricing, pro_features: e.target.value })}
                                                    className="w-full h-20 text-xs rounded-xl bg-background/60 p-2.5 border border-border/80 resize-none font-medium text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Expert Plan Card */}
                                    <Card className="rounded-2xl border border-purple-500/30 bg-card/70 p-6 space-y-4 shadow-lg shadow-purple-500/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                                                    <Crown className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-base text-foreground">Expert Tier</h3>
                                                    <p className="text-[10px] font-bold text-purple-500 uppercase">{expertCount} Active Subscribers</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Monthly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.expert_monthly}
                                                    onChange={(e) => setPricing({ ...pricing, expert_monthly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quarterly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.expert_quarterly}
                                                    onChange={(e) => setPricing({ ...pricing, expert_quarterly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Yearly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.expert_yearly}
                                                    onChange={(e) => setPricing({ ...pricing, expert_yearly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Included Features</label>
                                                <textarea
                                                    value={pricing.expert_features}
                                                    onChange={(e) => setPricing({ ...pricing, expert_features: e.target.value })}
                                                    className="w-full h-20 text-xs rounded-xl bg-background/60 p-2.5 border border-border/80 resize-none font-medium text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Org Plan Card */}
                                    <Card className="rounded-2xl border border-blue-500/30 bg-card/70 p-6 space-y-4 shadow-lg shadow-blue-500/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                                    <Globe className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-base text-foreground">Organization</h3>
                                                    <p className="text-[10px] font-bold text-blue-500 uppercase">{orgCount} Teams Enrolled</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Monthly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.org_monthly}
                                                    onChange={(e) => setPricing({ ...pricing, org_monthly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quarterly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.org_quarterly}
                                                    onChange={(e) => setPricing({ ...pricing, org_quarterly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Yearly (₹)</label>
                                                <Input
                                                    type="number"
                                                    value={pricing.org_yearly}
                                                    onChange={(e) => setPricing({ ...pricing, org_yearly: parseInt(e.target.value) || 0 })}
                                                    className="h-10 text-sm font-bold rounded-xl bg-background/60"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Included Features</label>
                                                <textarea
                                                    value={pricing.org_features}
                                                    onChange={(e) => setPricing({ ...pricing, org_features: e.target.value })}
                                                    className="w-full h-20 text-xs rounded-xl bg-background/60 p-2.5 border border-border/80 resize-none font-medium text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </Card>

                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handlePricingUpdate}
                                        className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-sm gap-2 transition-all"
                                    >
                                        <CheckCircle className="size-4" />
                                        Save All Pricing Configurations
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* TAB 4: BROADCAST ANNOUNCEMENTS */}
                            <TabsContent value="announcements" className="space-y-4 outline-none animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    
                                    {/* Composer */}
                                    <Card className="rounded-2xl border border-border/80 bg-card/70 p-6 space-y-4 shadow-sm">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black text-foreground">Compose Global Notification</h3>
                                            <p className="text-xs text-muted-foreground">Send an urgent broadcast banner to all users across ScriptMind.</p>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground">Notification Title</label>
                                                <Input
                                                    placeholder="e.g. Scheduled System Upgrade"
                                                    value={announcement.title}
                                                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                                    className="h-10 text-xs rounded-xl bg-background/60"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground">Message Body</label>
                                                <textarea
                                                    placeholder="Type your message for users..."
                                                    value={announcement.message}
                                                    onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                                                    className="w-full h-28 rounded-xl bg-background/60 p-3 text-xs border border-border/80 resize-none font-medium text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground">Alert Priority</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['info', 'warning', 'success'] as const).map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => setAnnouncement({ ...announcement, type: t })}
                                                            className={cn(
                                                                "py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all",
                                                                announcement.type === t
                                                                    ? t === 'warning' ? 'bg-amber-500/15 border-amber-500 text-amber-500 font-black' :
                                                                      t === 'success' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-black' :
                                                                      'bg-primary/15 border-primary text-primary font-black'
                                                                    : "bg-background/40 border-border/60 text-muted-foreground hover:bg-secondary"
                                                            )}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                onClick={sendAnnouncement}
                                                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-sm gap-2 transition-all"
                                            >
                                                <BellRing className="size-4" />
                                                Broadcast Notification to Users
                                            </Button>
                                        </div>
                                    </Card>

                                    {/* Live Preview */}
                                    <div className="space-y-4">
                                        <Card className="rounded-2xl border border-border/80 bg-card/70 p-6 space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Live User Preview</h4>
                                            
                                            <div className={cn(
                                                "p-4 rounded-2xl border flex items-start gap-3 shadow-md",
                                                announcement.type === 'warning' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                                announcement.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                                                "bg-primary/10 border-primary/30 text-primary"
                                            )}>
                                                <BellRing className="size-5 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <h5 className="font-extrabold text-sm text-foreground">
                                                        {announcement.title || "Notification Title"}
                                                    </h5>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        {announcement.message || "Your message preview will render here in real time."}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-6 flex items-center gap-4">
                                            <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                                <Shield className="size-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h5 className="font-bold text-xs text-foreground">Secure System Dispatch</h5>
                                                <p className="text-[11px] text-muted-foreground">Announcements are broadcast instantly through WebSocket channels to all connected dashboards.</p>
                                            </div>
                                        </Card>
                                    </div>

                                </div>
                            </TabsContent>

                            {/* TAB 5: HOME PAGE CMS */}
                            <TabsContent value="homepage" className="space-y-6 outline-none animate-in fade-in duration-300">
                                <Card className="rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                                        <div className="flex items-center gap-4">
                                            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-inner shrink-0">
                                                <LayoutTemplate className="size-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                                                    <span>Home Page Content CMS</span>
                                                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                                                        Admin Controlled
                                                    </span>
                                                </h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                                    Configure headlines, lead copy, action placeholders, 3-step guides, and 3D visual cards in real-time.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <Button
                                                asChild
                                                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <Link to="/admin/homepage">
                                                    <span>Launch CMS Studio</span>
                                                    <ArrowRight className="size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Features Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl border border-border/60 bg-background/50 space-y-2">
                                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Sparkles className="size-4" />
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground">Hero Headline & Badge</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Customize the main gradient title, secondary subtitle, and floating pill badge with custom wording.
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-border/60 bg-background/50 space-y-2">
                                            <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <FileText className="size-4" />
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground">Input & 3-Step Guide</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Set custom input placeholders, CTA button labels, and configure each numbered instruction.
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl border border-border/60 bg-background/50 space-y-2">
                                            <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                                <Eye className="size-4" />
                                            </div>
                                            <h4 className="font-bold text-sm text-foreground">Live Split Preview</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Test changes in a real-time responsive canvas with desktop and mobile viewport toggles before saving.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/40">
                                        <span>Direct URL: <code className="text-primary font-mono font-bold">/admin/homepage</code></span>
                                        <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold text-primary gap-1">
                                            <Link to="/admin/homepage">
                                                Open Dedicated Editor Page
                                                <ExternalLink className="size-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>

                    </div>
                </div>
            </div>

            {/* Global Suspension Dialog */}
            <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
                <DialogContent className="rounded-3xl border border-border/80 bg-card text-foreground shadow-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-foreground">Manage Account Access</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Set suspension duration for <span className="font-bold text-primary">{selectedUser?.username}</span> ({selectedUser?.email}).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground">Quick Presets</label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSuspensionPreset('1d')}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    1 Day
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSuspensionPreset('3m')}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    3 Months
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSuspensionPreset('1y')}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    1 Year
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground">Custom Date</label>
                            <Input
                                type="date"
                                value={suspendDate}
                                onChange={(e) => setSuspendDate(e.target.value)}
                                className="h-10 text-xs rounded-xl bg-background/70 border-border/80"
                            />
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-2.5">
                            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-500 font-medium leading-relaxed">
                                Suspended users will be restricted from note generation, video downloads, and API access until the restriction expires.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => { setSuspendDate(""); handleSuspend(); }} 
                            className="rounded-xl text-xs font-bold"
                        >
                            Clear Suspension
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleSuspend} 
                            className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700"
                        >
                            Apply Suspension
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Detail Modal */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl text-foreground">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <UserAvatar user={selectedUser} size="lg" showStatus={false} />
                            <div>
                                <DialogTitle className="text-lg font-black text-foreground">{selectedUser?.username}</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">{selectedUser?.email}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full mt-4">
                        <TabsList className="bg-secondary/60 rounded-xl p-1 gap-1 border border-border/60">
                            <TabsTrigger value="overview" className="rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
                            <TabsTrigger value="activity" className="rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Recent Activity</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4 space-y-4 outline-none">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes Count</p>
                                    <p className="text-lg font-black text-foreground">{selectedUser?.total_notes || 0}</p>
                                </div>
                                <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Downloads</p>
                                    <p className="text-lg font-black text-foreground">{selectedUser?.downloads_count || 0}</p>
                                </div>
                                <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Plan</p>
                                    <p className="text-lg font-black text-primary capitalize">{selectedUser?.plan || 'Free'}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/40">
                                <div className="flex justify-between">
                                    <span>Joined Date:</span>
                                    <span className="font-bold text-foreground">{selectedUser?.created_at ? format(new Date(selectedUser.created_at), 'PPP') : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Billing Cycle:</span>
                                    <span className="font-bold text-foreground capitalize">{selectedUser?.billing_cycle || 'Monthly'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Organization:</span>
                                    <span className="font-bold text-foreground">{selectedUser?.org_name || 'Independent Account'}</span>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-4 space-y-2 max-h-[250px] overflow-y-auto outline-none pr-1">
                            {userLogs.length === 0 ? (
                                <div className="text-center py-8 text-xs text-muted-foreground">No recent activity logs recorded for this user.</div>
                            ) : (
                                userLogs.map((log) => (
                                    <div key={log.id} className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-foreground uppercase text-[10px]">{log.action}</span>
                                            <p className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), 'PPp')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
}
