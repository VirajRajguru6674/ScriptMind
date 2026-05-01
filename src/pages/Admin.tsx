
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
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
    DialogTrigger
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
import { Badge } from "@/components/ui/badge";
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
    User as UserIcon,
    TrendingUp,
    MoreHorizontal,
    ExternalLink,
    Mail,
    RefreshCcw,
    AlertCircle,
    BellRing,
    LayoutDashboard,
    Users,
    ClipboardList,
    DollarSign,
    Terminal,
    Eye,
    Clock,
    History,
    Globe,
    Cpu,
    Crown,
    Calendar as CalendarIcon
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
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

const Admin = () => {
    const { user, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [logs, setLogs] = useState<LogData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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
        if (isAuthenticated && user?.role === 'admin') {
            fetchData();
        }
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
            const headers = { 'Authorization': `Bearer ${token}` };

            const [usersRes, logsRes, pricingRes] = await Promise.all([
                fetch('http://localhost:3001/api/admin/users', { headers }),
                fetch('http://localhost:3001/api/admin/audit-logs', { headers }),
                fetch('http://localhost:3001/api/settings/pricing')
            ]);

            if (!pricingRes.ok) console.error("Failed to fetch pricing");
            else setPricing(await pricingRes.json());

            if (!usersRes.ok || !logsRes.ok) throw new Error("Failed to fetch data");

            setUsers(await usersRes.json());
            setLogs(await logsRes.json());
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Could not load admin data'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (userId: number, field: 'plan' | 'role', value: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [field]: value })
            });
            if (!res.ok) throw new Error("Update failed");

            setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
            toast({ title: "Success", description: `User ${field} updated.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user' });
        }
    };

    const handlePricingUpdate = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/admin/settings/pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(pricing)
            });
            if (!res.ok) throw new Error("Failed to update pricing");
            toast({ title: "Success", description: "Pricing updated successfully" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: "Update failed" });
        }
    };

    const handleSuspend = async () => {
        if (!selectedUser) return;
        const token = localStorage.getItem('token');
        const suspendedUntil = suspendDate ? new Date(suspendDate).toISOString().slice(0, 19).replace('T', ' ') : null;

        try {
            const res = await fetch(`http://localhost:3001/api/admin/users/${selectedUser.id}/suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ suspendedUntil })
            });

            if (!res.ok) throw new Error("Suspension failed");

            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, suspended_until: suspendedUntil } : u));
            toast({ title: "Success", description: suspendedUntil ? "User suspended" : "User activated" });
            setSuspendDate("");
            setIsSuspendDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Action failed' });
        }
    };

    const sendAnnouncement = () => {
        if (!announcement.title || !announcement.message) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all fields.' });
            return;
        }
        toast({ title: "Announcement Transmitted", description: "Global notification broadcast complete." });
        setAnnouncement({ title: "", message: "", type: "info" });
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (!userDateRange?.from) return matchesSearch;

        const joinDate = new Date(u.created_at);
        const start = startOfDay(userDateRange.from);
        const end = userDateRange.to ? endOfDay(userDateRange.to) : endOfDay(userDateRange.from);

        return matchesSearch && isWithinInterval(joinDate, { start, end });
    });

    const filteredLogs = logs.filter(log => {
        const matchesSearch = (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.action || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!logDateRange?.from) return matchesSearch;

        const logDate = new Date(log.created_at);
        const start = startOfDay(logDateRange.from);
        const end = logDateRange.to ? endOfDay(logDateRange.to) : endOfDay(logDateRange.from);

        return matchesSearch && isWithinInterval(logDate, { start, end });
    });

    // Stats Calculation
    const proCount = users.filter(u => u.plan === 'pro' && !u.org_id).length;
    const expertCount = users.filter(u => u.plan === 'expert' && !u.org_id).length;
    const orgCount = users.filter(u => u.org_id || u.plan === 'organization').length;
    const premiumUsersCount = proCount + expertCount + orgCount;
    const activeUsers = users.filter(u => !u.suspended_until).length;
    const calculateUserRevenue = (u: UserData) => {
        const plan = (u.plan || 'free').toLowerCase();
        const cycle = (u.billing_cycle || 'monthly').toLowerCase();
        
        if (u.org_id) {
            // For org members, the owner pays. We should only count revenue once per org.
            // But for simplicity in this dashboard, we'll attribute revenue to the plan type.
            // In a real system, we'd only sum the subscriptions table.
            if (plan === 'pro') return pricing.pro_monthly;
            if (plan === 'expert') return pricing.expert_monthly;
            return pricing.org_monthly;
        }

        if (plan === 'pro') {
            if (cycle === 'yearly') return pricing.pro_yearly / 12;
            if (cycle === 'quarterly') return pricing.pro_quarterly / 3;
            return pricing.pro_monthly;
        }
        if (plan === 'expert') {
            if (cycle === 'yearly') return pricing.expert_yearly / 12;
            if (cycle === 'quarterly') return pricing.expert_quarterly / 3;
            return pricing.expert_monthly;
        }
        return 0;
    };

    const totalRevenue = users.reduce((acc, u) => acc + calculateUserRevenue(u), 0);
    const totalNotes = users.reduce((acc, u) => acc + (u.total_notes || 0), 0);
    const totalDownloads = users.reduce((acc, u) => acc + (u.downloads_count || 0), 0);

    const userLogs = selectedUser ? logs.filter(l => l.user_id === selectedUser.id) : [];

    if (!isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="size-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto border border-destructive/20 shadow-[0_0_50px_rgba(var(--destructive),0.1)]">
                        <Shield className="w-12 h-12 text-destructive animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Access Denied</h1>
                        <p className="text-muted-foreground mt-2">You do not have the required permissions to view this page.</p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.href = '/'} className="rounded-xl">Return Home</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet><title>Admin Terminal | ScriptMind</title></Helmet>
            <div className="min-h-screen bg-[#0A0B0E] font-sans selection:bg-primary/20 relative overflow-hidden text-slate-200">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

                <Sidebar />
                <main className="lg:pl-[280px] relative z-10">
                    <div className="container py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Elegant Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tight">Admin <span className="text-primary">Dashboard</span></h1>
                                <p className="text-muted-foreground mt-1">Manage users, view stats, and monitor system activity.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white">
                                    <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                                    Sync Data
                                </Button>
                                <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Report
                                </Button>
                            </div>
                        </div>

                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Total Users", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+12% this month" },
                                { label: "Notes Created", value: totalNotes, icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10", trend: "3.2k this week" },
                                { label: "Estimated Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "MRR Growth: 8%" },
                                { label: "Premium Users", value: premiumUsersCount, icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", trend: `${users.length > 0 ? Math.round((premiumUsersCount / users.length) * 100) : 0}% of user base` },
                            ].map((stat, i) => (
                                <Card key={i} className="border-white/5 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] transition-all group overflow-hidden relative border-0">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <stat.icon className="size-24 -mr-8 -mt-8" />
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                <TrendingUp className="size-3 text-emerald-500" /> {stat.trend}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Main Interaction Area */}
                        <Tabs defaultValue="users" className="w-full space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] p-2 rounded-2xl border border-white/5">
                                <TabsList className="bg-transparent h-auto p-0 gap-2">
                                    {[
                                        { value: "users", label: "Users", icon: Users },
                                        { value: "logs", label: "Activity Logs", icon: ClipboardList },
                                        { value: "pricing", label: "Pricing", icon: DollarSign },
                                        { value: "announcements", label: "Notifications", icon: BellRing },
                                    ].map(tab => (
                                        <TabsTrigger
                                            key={tab.value}
                                            value={tab.value}
                                            className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all gap-2 text-slate-400"
                                        >
                                            <tab.icon className="size-4" />
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="relative group px-2">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search entities..."
                                        className="pl-11 h-11 bg-black/20 border-white/5 rounded-xl w-full md:w-[300px] focus:border-primary/50 focus:ring-primary/20 transition-all text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="px-2 flex items-center gap-2">
                                    <DatePickerWithRange date={userDateRange} setDate={setUserDateRange} className="w-[240px]" />
                                    {userDateRange && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setUserDateRange(undefined)}
                                            className="rounded-xl size-9 hover:bg-white/10 text-muted-foreground"
                                        >
                                            <RefreshCcw className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden border-0">
                                    <Table>
                                        <TableHeader className="bg-white/[0.02]">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cycle</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                                <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={6} className="text-center h-64 text-muted-foreground font-medium italic">Scanning network entities...</TableCell></TableRow>
                                            ) : filteredUsers.length === 0 ? (
                                                <TableRow><TableCell colSpan={6} className="text-center h-64 text-muted-foreground">No entities found matching search criteria.</TableCell></TableRow>
                                            ) : (
                                                filteredUsers.map((u) => (
                                                    <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-lg">
                                                                    {u.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white group-hover:text-primary transition-colors">{u.username}</div>
                                                                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                                                        {u.email}
                                                                        {u.org_name && (
                                                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-tighter border border-blue-500/20">
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
                                                                <SelectTrigger className="w-28 h-9 rounded-xl bg-white/5 border-white/10 hover:border-primary/50 transition-all font-bold text-white">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-white/10 bg-[#16181D]">
                                                                    <SelectItem value="free" className="font-bold">Free</SelectItem>
                                                                    <SelectItem value="pro" className="font-bold text-amber-500">Pro</SelectItem>
                                                                    <SelectItem value="expert" className="font-bold text-purple-500">Expert</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`rounded-lg font-bold uppercase tracking-wider text-[9px] ${
                                                                    u.billing_cycle === 'yearly' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                                    u.billing_cycle === 'quarterly' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                                }`}
                                                            >
                                                                {u.billing_cycle || 'monthly'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select defaultValue={u.role} onValueChange={(v) => handleUpdate(u.id, 'role', v)}>
                                                                <SelectTrigger className="w-28 h-9 rounded-xl bg-white/5 border-white/10 hover:border-primary/50 transition-all font-bold text-white">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-white/10 bg-[#16181D]">
                                                                    <SelectItem value="user" className="font-bold">User</SelectItem>
                                                                    <SelectItem value="admin" className="font-bold text-red-500">Admin</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                                                    <span>Usage</span>
                                                                    <span>{u.total_notes} notes</span>
                                                                </div>
                                                                <Progress value={Math.min(100, (u.total_notes / 100) * 100)} className="h-1.5 bg-white/5 rounded-full" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {u.suspended_until && new Date(u.suspended_until) > new Date() ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                                                    <Ban className="size-3" />
                                                                    <span className="text-[10px] font-black uppercase">Suspended</span>
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                                    <CheckCircle className="size-3" />
                                                                    <span className="text-[10px] font-black uppercase">Active</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 text-white">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/10 bg-[#16181D]">
                                                                    <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">User Actions</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                                    <DropdownMenuItem
                                                                        className="rounded-xl gap-2 font-bold focus:bg-primary/10 focus:text-primary cursor-pointer text-slate-300"
                                                                        onSelect={() => {
                                                                            setSelectedUser(u);
                                                                            setDetailTab("overview");
                                                                            setIsDetailDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Eye className="size-4" /> View Full Profile
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="rounded-xl gap-2 font-bold focus:bg-primary/10 focus:text-primary cursor-pointer text-slate-300"
                                                                        onSelect={() => {
                                                                            setSelectedUser(u);
                                                                            setDetailTab("activity");
                                                                            setIsDetailDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Activity className="size-4" /> Activity Timeline
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="rounded-xl gap-2 font-bold focus:bg-primary/10 focus:text-primary cursor-pointer text-slate-300"
                                                                        onSelect={() => {
                                                                            window.location.href = `mailto:${u.email}`;
                                                                        }}
                                                                    >
                                                                        <Mail className="size-4" /> Direct Message
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                                    <DropdownMenuItem
                                                                        className="rounded-xl gap-2 font-bold text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
                                                                        onSelect={() => {
                                                                            setSelectedUser(u);
                                                                            setSuspendDate(u.suspended_until ? new Date(u.suspended_until).toISOString().split('T')[0] : "");
                                                                            setIsSuspendDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Ban className="size-4" />
                                                                        {u.suspended_until ? "Manage Suspension" : "Suspend Entity"}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden border-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-white/5">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Activity Logs</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium">Recent system and user activity</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <DatePickerWithRange date={logDateRange} setDate={setLogDateRange} />
                                            {logDateRange && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setLogDateRange(undefined)}
                                                    className="text-[10px] font-black uppercase text-muted-foreground hover:text-white"
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-white/[0.02]">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</TableHead>
                                                <TableHead className="py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Link</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLogs.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} className="text-center h-64 text-muted-foreground font-medium italic">No audit trail detected matching current range.</TableCell></TableRow>
                                            ) : (
                                                filteredLogs.map((log) => (
                                                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Clock className="size-3 text-muted-foreground" />
                                                                <span className="text-[11px] font-bold text-muted-foreground font-mono">
                                                                    {new Date(log.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{log.username || 'System Agent'}</div>
                                                            <div className="text-[10px] text-muted-foreground font-medium font-mono">{log.email}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="rounded-lg bg-secondary/50 text-[9px] font-black tracking-widest border-white/10 uppercase">
                                                                {log.action}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="max-w-[300px]">
                                                            <div className="p-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-muted-foreground truncate hover:whitespace-normal hover:overflow-visible hover:relative hover:z-50 hover:bg-black transition-all cursor-help">
                                                                {JSON.stringify(log.details)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="rounded-xl size-8 hover:bg-white/10 text-muted-foreground">
                                                                <ExternalLink className="size-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </TabsContent>

                            <TabsContent value="announcements" className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 space-y-6 border-0">
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-white tracking-tight">Send Notification</h3>
                                            <p className="text-sm text-muted-foreground font-medium">Send a message to all users.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
                                                <Input
                                                    placeholder="e.g. System Maintenance"
                                                    className="bg-black/40 border-white/5 rounded-2xl h-12 focus:border-primary/50 text-white"
                                                    value={announcement.title}
                                                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</label>
                                                <textarea
                                                    placeholder="Type your message here..."
                                                    className="w-full min-h-[150px] bg-black/40 border-white/5 rounded-2xl p-4 focus:border-primary/50 focus:ring-primary/20 transition-all text-sm resize-none text-white"
                                                    value={announcement.message}
                                                    onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['info', 'warning', 'success'].map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setAnnouncement({ ...announcement, type: t })}
                                                        className={cn(
                                                            "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                            announcement.type === t
                                                                ? "bg-primary/20 border-primary text-primary"
                                                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                                        )}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                            <Button onClick={sendAnnouncement} className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 group">
                                                Send Notification <BellRing className="ml-2 group-hover:rotate-12 transition-transform" />
                                            </Button>
                                        </div>
                                    </Card>

                                    <div className="space-y-8">
                                        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border-0">
                                            <h3 className="text-xl font-black text-white mb-6">Preview</h3>
                                            <div className="p-6 rounded-2xl border border-white/10 bg-black shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                                </div>
                                                <div className="flex gap-4 items-start relative z-10">
                                                    <div className={cn(
                                                        "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                                                        announcement.type === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                                            announcement.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                                                "bg-primary/10 border-primary/20 text-primary"
                                                    )}>
                                                        <BellRing className="size-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-black text-white uppercase tracking-tight">{announcement.title || "Headline Placeholder"}</h4>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {announcement.message || "Your broadcasted message will appear here for all users in real-time."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest mt-6">This is how users will see it.</p>
                                        </Card>

                                        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border-dashed flex flex-col items-center justify-center text-center py-12 border-0">
                                            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <Shield className="size-8 text-muted-foreground opacity-50" />
                                            </div>
                                            <h4 className="font-bold text-white mb-2">Secure Notifications</h4>
                                            <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
                                                All notifications are logged securely for accountability.
                                            </p>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="pricing" className="animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                                <Card className="max-w-4xl mx-auto border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden border-0">
                                    <CardHeader className="border-b border-white/5 p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                                <DollarSign className="size-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-black text-white">Subscription Plans</CardTitle>
                                                <CardDescription>Configure pricing for Pro and Expert tiers.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-white/[0.01]">
                                                <TableRow className="border-white/5 hover:bg-transparent">
                                                    <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Tier</TableHead>
                                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly (₹)</TableHead>
                                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Quarterly (₹)</TableHead>
                                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Yearly (₹)</TableHead>
                                                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Benefits & Conditions</TableHead>
                                                    <TableHead className="py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Active Users</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {/* Pro Plan */}
                                                <TableRow className="border-white/5 hover:bg-white/[0.01]">
                                                    <TableCell className="py-6 pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                                <TrendingUp className="size-5 text-amber-500" />
                                                            </div>
                                                            <div className="font-bold text-white text-lg">Professional</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={pricing.pro_monthly}
                                                            onChange={(e) => setPricing({ ...pricing, pro_monthly: parseInt(e.target.value) })}
                                                            className="w-24 bg-black/40 border-white/10 rounded-xl h-11 text-base font-bold text-white focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={pricing.pro_quarterly}
                                                            onChange={(e) => setPricing({ ...pricing, pro_quarterly: parseInt(e.target.value) })}
                                                            className="w-24 bg-black/40 border-white/10 rounded-xl h-11 text-base font-bold text-white focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={pricing.pro_yearly}
                                                            onChange={(e) => setPricing({ ...pricing, pro_yearly: parseInt(e.target.value) })}
                                                            className="w-24 bg-black/40 border-white/10 rounded-xl h-11 text-base font-bold text-white focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={pricing.pro_features}
                                                            onChange={(e) => setPricing({ ...pricing, pro_features: e.target.value })}
                                                            placeholder="Comma separated benefits..."
                                                            className="min-w-[200px] bg-black/40 border-white/10 rounded-xl h-11 text-sm text-slate-300 focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="rounded-lg bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">
                                                            {proCount} Users
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expert Plan */}
                                                <TableRow className="border-white/5 hover:bg-white/[0.01]">
                                                    <TableCell className="py-6 pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                                <Shield className="size-5 text-purple-500" />
                                                            </div>
                                                            <div className="font-bold text-white text-lg">Expert</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={pricing.expert_monthly}
                                                            onChange={(e) => setPricing({ ...pricing, expert_monthly: parseInt(e.target.value) })}
                                                            className="w-24 bg-black/40 border-white/10 rounded-xl h-11 text-base font-bold text-white focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={pricing.expert_quarterly}
                                                            onChange={(e) => setPricing({ ...pricing, expert_quarterly: parseInt(e.target.value) })}
                                                            className="w-24 bg-black/40 border-white/10 rounded-xl h-11 text-base font-bold text-white focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={pricing.expert_yearly}
                                                            onChange={(e) => setPricing({ ...pricing, expert_yearly: parseInt(e.target.value) })}
                                                            className="w-24 bg-black/40 border-white/10 rounded-xl h-11 text-base font-bold text-white focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={pricing.expert_features}
                                                            onChange={(e) => setPricing({ ...pricing, expert_features: e.target.value })}
                                                            placeholder="Comma separated benefits..."
                                                            className="min-w-[200px] bg-black/40 border-white/10 rounded-xl h-11 text-sm text-slate-300 focus:border-primary/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="rounded-lg bg-purple-500/10 text-purple-500 border-purple-500/20 font-bold">
                                                            {expertCount} Users
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                        
                                        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                                            <Button 
                                                onClick={handlePricingUpdate} 
                                                className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex gap-2"
                                            >
                                                <CheckCircle className="size-4" />
                                                Save Pricing Configuration
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            {/* Global Suspension Dialog */}
            <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
                <DialogContent className="rounded-3xl border-white/10 bg-[#16181D] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-white">Modify Authority</DialogTitle>
                        <DialogDescription className="font-medium text-slate-400">Managing access levels for <span className="text-primary">{selectedUser?.username}</span>.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Revoke Access Until</label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSuspensionPreset('1d')}
                                    className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase"
                                >
                                    1 Day
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSuspensionPreset('3m')}
                                    className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase"
                                >
                                    3 Months
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSuspensionPreset('1y')}
                                    className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase"
                                >
                                    1 Year
                                </Button>
                            </div>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={suspendDate}
                                    onChange={(e) => setSuspendDate(e.target.value)}
                                    className="bg-black/40 border-white/10 rounded-2xl h-12 focus:border-primary/50 text-white pl-4"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                    <CalendarIcon className="size-4" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                            <AlertCircle className="size-5 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-500 font-medium leading-relaxed">
                                Suspending an entity will immediately terminate all active sessions and block API access until the specified date.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setSuspendDate(""); handleSuspend(); }} className="rounded-2xl border-white/10 hover:bg-white/5 flex-1 text-white">Clear Restrictions</Button>
                        <Button variant="destructive" onClick={handleSuspend} className="rounded-2xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 flex-1">Apply Suspension</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Detail Intelligence Panel */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-3xl rounded-[40px] border-white/10 bg-[#121418] p-0 overflow-hidden text-white border-0 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="size-24 rounded-3xl bg-primary/20 backdrop-blur-xl border-4 border-[#121418] flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                                {selectedUser?.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pt-16 pb-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-white">{selectedUser?.username}</h2>
                                <p className="text-muted-foreground font-medium">{selectedUser?.email}</p>
                            </div>
                            <Badge className="bg-primary text-white px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-widest">
                                {selectedUser?.plan} Intelligence
                            </Badge>
                        </div>

                        <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
                            <TabsList className="bg-white/5 rounded-xl p-1 gap-2 border border-white/5">
                                <TabsTrigger value="overview" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-primary">Overview</TabsTrigger>
                                <TabsTrigger value="activity" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-primary">Activity</TabsTrigger>
                                <TabsTrigger value="security" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-primary">Security</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: "Notes", value: selectedUser?.total_notes, icon: FileText, color: "text-blue-400" },
                                        { label: "Downloads", value: selectedUser?.downloads_count, icon: Download, color: "text-emerald-400" },
                                        { label: "Level", value: selectedUser?.role.toUpperCase(), icon: Shield, color: "text-purple-400" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <stat.icon className={cn("size-4 mb-2", stat.color)} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                            <p className="text-xl font-black text-white">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                        <CalendarIcon className="size-4 text-primary" />
                                        Joined: {selectedUser?.created_at && format(new Date(selectedUser.created_at), 'PPP')}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                        <Globe className="size-4 text-primary" />
                                        Location: Unknown / Dynamic
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                        <Cpu className="size-4 text-primary" />
                                        Processing Limit: {selectedUser?.plan === 'free' ? 'Standard' : 'Priority'}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {userLogs.length === 0 ? (
                                    <div className="text-center py-10 opacity-50 italic text-sm">No activity records found for this entity.</div>
                                ) : (
                                    userLogs.map((log) => (
                                        <div key={log.id} className="flex gap-4 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <History className="size-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-tight">{log.action}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(log.created_at), 'PPp')}</p>
                                                <p className="text-[10px] font-mono text-primary/60 mt-1 truncate max-w-[400px]">{JSON.stringify(log.details)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="security" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-3">
                                    <h4 className="text-sm font-black text-destructive uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="size-4" /> Termination Protocol
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                        Deleting this intelligence entity is irreversible. All generated notes, preferences, and activity logs associated with this account will be purged from the central database.
                                    </p>
                                    <Button variant="destructive" className="w-full rounded-xl font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-destructive/20">
                                        Purge Entity Data
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Internal ScriptMind Logo Component for Admin UI
const ScriptMindLogo = ({ className }: { className?: string }) => (
    <div className={cn("relative flex items-center justify-center", className)}>
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <img src="/logo.png" alt="ScriptMind" className="relative z-10 w-full h-full object-contain" />
    </div>
);

export default Admin;
