
import React, { useState, useEffect } from 'react';
import API_BASE_URL from "@/lib/api";
import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/Sidebar";
import { 
    Bell, 
    Check, 
    Trash2, 
    Search, 
    Mail, 
    MessageSquare, 
    Send, 
    Filter,
    Calendar,
    ArrowLeft,
    MoreVertical,
    Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from "react-router-dom";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    platform: string;
    status: 'unread' | 'read';
    created_at: string;
}

const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/alerts`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id?: number) => {
        try {
            if (id) {
                // Individual mark as read logic if backend supports it
                // For now we use the global endpoint
                await fetch(`${API_BASE_URL}/alerts/read`, { method: 'POST' });
            } else {
                await fetch(`${API_BASE_URL}/alerts/read`, { method: 'POST' });
            }
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getPlatformIcon = (platform: string) => {
        const p = (platform || 'system').toLowerCase();
        if (p.includes('teams')) return <MessageSquare className="w-4 h-4 text-blue-500" />;
        if (p.includes('telegram')) return <Send className="w-4 h-4 text-sky-500" />;
        if (p.includes('email')) return <Mail className="w-4 h-4 text-amber-500" />;
        return <Bell className="w-4 h-4 text-primary" />;
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = filterPlatform ? n.platform === filterPlatform : true;
        return matchesSearch && matchesPlatform;
    });

    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    const platforms = Array.from(new Set(notifications.map(n => n.platform || 'system')));

    return (
        <>
            <Helmet>
                <title>Notifications - ScriptMind</title>
            </Helmet>

            <div className="min-h-screen bg-[#0A0B0E] font-sans selection:bg-primary/20 relative overflow-hidden text-slate-200">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
                
                <Sidebar />

                <main className="lg:pl-[280px]">
                    <div className="container py-6 lg:py-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
                        {/* Header */}
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <Link to="/">
                                        <Button variant="ghost" size="icon" className="rounded-2xl shrink-0 border border-white/5 hover:bg-white/10 text-white">
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <div>
                                        <h1 className="text-4xl font-black text-white tracking-tight">Notification <span className="text-primary">Center</span></h1>
                                        <p className="text-muted-foreground mt-1">Stay updated with your latest system alerts and intelligent briefings.</p>
                                    </div>
                                </div>
                                {unreadCount > 0 && (
                                    <Button onClick={() => markAsRead()} variant="outline" className="hidden sm:flex rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white">
                                        <Check className="w-4 h-4 mr-2 text-primary" />
                                        Mark all as read
                                    </Button>
                                )}
                            </div>

                            {/* Search & Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search communications..." 
                                        className="pl-12 h-12 bg-black/40 border-white/5 rounded-2xl focus:border-primary/50 text-white placeholder:text-slate-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/5 bg-black/40 hover:bg-white/10 text-white font-medium">
                                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                                {filterPlatform || "All Platforms"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-[#16181D]">
                                            <DropdownMenuItem onClick={() => setFilterPlatform(null)} className="rounded-xl text-slate-300 focus:bg-white/10 focus:text-white cursor-pointer">
                                                All Platforms
                                            </DropdownMenuItem>
                                            {platforms.map(p => (
                                                <DropdownMenuItem key={p} onClick={() => setFilterPlatform(p)} className="rounded-xl text-slate-300 focus:bg-white/10 focus:text-white cursor-pointer">
                                                    {p}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 bg-black/40 hover:bg-white/10 text-white" onClick={fetchNotifications}>
                                        <Clock className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <Card className="border-0 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl relative z-10 border-white/5">
                            <CardHeader className="border-b border-white/5 pb-4 px-6 md:px-8 pt-8">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-black text-white">System Logs</CardTitle>
                                    <Badge className="bg-primary/20 text-primary border-0 rounded-full font-black px-3 py-1 uppercase tracking-widest text-[10px]">
                                        {filteredNotifications.length} Total
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <Clock className="w-10 h-10 animate-spin opacity-20 mb-4" />
                                        <p>Loading your notifications...</p>
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-50">
                                        <Bell className="w-16 h-16 mb-4 stroke-1" />
                                        <p className="text-lg font-medium">No notifications found</p>
                                        <p className="text-sm">Try adjusting your search or filters.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {filteredNotifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className={cn(
                                                    "px-6 md:px-8 py-6 transition-all hover:bg-white/[0.04] flex gap-6 items-start group relative",
                                                    n.status === 'unread' ? "bg-primary/5" : ""
                                                )}
                                            >
                                                {/* Left: Status Dot */}
                                                {n.status === 'unread' && (
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                                                )}

                                                {/* Icon */}
                                                <div className={cn(
                                                    "size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                                                    n.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                                                )}>
                                                    {n.type === 'success' ? <Check className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{n.title}</h4>
                                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {format(new Date(n.created_at), 'PPP')}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                                    <Clock className="w-3.5 h-3.5 text-primary/70" />
                                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-white rounded-xl">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-white/10 bg-[#16181D]">
                                                                <DropdownMenuItem onClick={() => markAsRead(n.id)} className="rounded-xl text-slate-300 focus:bg-white/10 focus:text-white cursor-pointer font-medium">
                                                                    <Check className="w-4 h-4 mr-2" />
                                                                    Mark as read
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="rounded-xl text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer font-medium">
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm text-slate-300 leading-relaxed shadow-inner">
                                                        {n.message}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-2">
                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                                            {getPlatformIcon(n.platform)}
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{n.platform}</span>
                                                        </div>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px] uppercase font-black tracking-widest bg-black/40 border-white/10",
                                                            n.type === 'success' ? "text-emerald-400 border-emerald-400/20" : 
                                                            n.type === 'warning' ? "text-amber-400 border-amber-400/20" :
                                                            n.type === 'error' ? "text-red-400 border-red-400/20" :
                                                            "text-blue-400 border-blue-400/20"
                                                        )}>
                                                            {n.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Notifications;
