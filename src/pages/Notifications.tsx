import React, { useState, useEffect } from 'react';
import API_BASE_URL from "@/lib/api";
import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/Sidebar";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    MoreVertical,
    Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from 'date-fns';

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
        if (p.includes('teams')) return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
        if (p.includes('telegram')) return <Send className="w-3.5 h-3.5 text-sky-500" />;
        if (p.includes('email')) return <Mail className="w-3.5 h-3.5 text-amber-500" />;
        return <Bell className="w-3.5 h-3.5 text-primary" />;
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

            <div className="flex h-screen bg-background overflow-hidden">
                <Sidebar />

                <main className="flex-1 flex flex-col min-w-0 lg:ml-[296px]">
                    {/* Header row — aligned with sidebar logo */}
                    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-16 items-center justify-between px-6">
                            {/* Left: page title */}
                            <div className="flex items-center gap-3">
                                <div className="flex p-2 bg-gradient-to-tr from-primary to-purple-600 rounded-xl text-white shadow-md shadow-primary/20">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-purple-400 bg-clip-text text-transparent">
                                    Notifications
                                </h1>
                                {unreadCount > 0 && (
                                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>

                            {/* Right: controls */}
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <Button
                                        onClick={() => markAsRead()}
                                        variant="outline"
                                        size="sm"
                                        className="hidden sm:flex rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary text-muted-foreground text-xs font-semibold gap-1.5 h-8 px-3 transition-all"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Mark all read
                                    </Button>
                                )}
                                <NotificationPanel />
                                <ThemeToggle />
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors duration-300" />
                                <Input
                                    placeholder="Search notifications..."
                                    className="pl-11 h-11 bg-card/40 border-border/40 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary/50 placeholder:text-muted-foreground/40 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 px-4 rounded-xl border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/10 font-medium text-sm gap-2 transition-all"
                                        >
                                            <Filter className="w-4 h-4 text-muted-foreground" />
                                            {filterPlatform || "All Platforms"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        <DropdownMenuItem onClick={() => setFilterPlatform(null)} className="rounded-lg cursor-pointer">
                                            All Platforms
                                        </DropdownMenuItem>
                                        {platforms.map(p => (
                                            <DropdownMenuItem key={p} onClick={() => setFilterPlatform(p)} className="rounded-lg cursor-pointer">
                                                {p}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 rounded-xl border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/10 transition-all"
                                    onClick={fetchNotifications}
                                    title="Refresh"
                                >
                                    <Clock className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Notifications list section */}
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">System Logs</h2>
                                <Badge className="bg-primary/15 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest px-2.5">
                                    {filteredNotifications.length} Total
                                </Badge>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <Clock className="w-10 h-10 animate-spin opacity-20 mb-4" />
                                    <p className="text-sm">Loading your notifications...</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/40 rounded-2xl text-muted-foreground/50">
                                    <Bell className="w-12 h-12 mb-3 stroke-1" />
                                    <p className="font-medium">No notifications found</p>
                                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredNotifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                "group relative rounded-xl border border-border/30 bg-transparent p-3 flex gap-3 items-start transition-all duration-200 hover:border-border/60 hover:bg-muted/30",
                                                n.status === 'unread' ? "border-primary/20" : ""
                                            )}
                                        >
                                            {/* Unread dot */}
                                            {n.status === 'unread' && (
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
                                            )}

                                            {/* Icon */}
                                            <div className={cn(
                                                "size-8 rounded-lg flex items-center justify-center shrink-0",
                                                n.type === 'success' ? "bg-green-500/10 text-green-500" :
                                                n.type === 'warning' ? "bg-amber-500/10 text-amber-500" :
                                                n.type === 'error' ? "bg-red-500/10 text-red-500" :
                                                "bg-primary/10 text-primary"
                                            )}>
                                                {n.type === 'success' ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0 flex items-center gap-3 flex-wrap">
                                                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                            {n.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">
                                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-lg shrink-0"
                                                            >
                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                            <DropdownMenuItem onClick={() => markAsRead(n.id)} className="rounded-lg cursor-pointer gap-2">
                                                                <Check className="w-4 h-4" />
                                                                Mark as read
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-lg cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Message + tags inline */}
                                                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                                                    {n.message}
                                                </p>

                                                {/* Tags */}
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/40">
                                                        {getPlatformIcon(n.platform)}
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{n.platform || 'system'}</span>
                                                    </div>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] uppercase font-bold tracking-widest rounded-full",
                                                        n.type === 'success' ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" :
                                                        n.type === 'warning' ? "text-amber-500 border-amber-500/30 bg-amber-500/10" :
                                                        n.type === 'error' ? "text-red-500 border-red-500/30 bg-red-500/10" :
                                                        "text-blue-400 border-blue-400/30 bg-blue-400/10"
                                                    )}>
                                                        {n.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Notifications;
