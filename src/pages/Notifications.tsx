import React, { useState, useEffect } from 'react';
import API_BASE_URL from "@/lib/api";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaletteCustomizer } from "@/components/PaletteCustomizer";
import {
    Bell,
    Check,
    Trash2,
    Search,
    Mail,
    MessageSquare,
    Send,
    Filter,
    MoreVertical,
    Clock,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    FileText,
    Copy,
    ArrowRight,
    RefreshCw,
    Inbox,
    Layers,
    Youtube,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

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
    const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'notes'>('all');
    const { toast } = useToast();

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
            await fetch(`${API_BASE_URL}/alerts/read`, { method: 'POST' });
            toast({ title: "Marked as read" });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const clearAll = async () => {
        try {
            await fetch(`${API_BASE_URL}/alerts`, { method: 'DELETE' });
            toast({ title: "All notifications cleared" });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const getPlatformIcon = (platform: string) => {
        const p = (platform || 'system').toLowerCase();
        if (p.includes('teams')) return <MessageSquare className="size-3 text-blue-400" />;
        if (p.includes('telegram')) return <Send className="size-3 text-sky-400" />;
        if (p.includes('email')) return <Mail className="size-3 text-amber-400" />;
        if (p.includes('youtube')) return <Youtube className="size-3 text-red-500" />;
        return <Sparkles className="size-3 text-primary" />;
    };

    const notesCount = notifications.filter(n =>
        n.message.toLowerCase().includes('notes') || n.title.toLowerCase().includes('notes')
    ).length;

    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    const platforms = Array.from(new Set(notifications.map(n => n.platform || 'system')));

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = filterPlatform ? n.platform === filterPlatform : true;
        const isNoteGen = n.message.toLowerCase().includes('notes') || n.title.toLowerCase().includes('notes');
        const matchesStatus =
            statusFilter === 'unread' ? n.status === 'unread' :
            statusFilter === 'notes' ? isNoteGen :
            true;
        return matchesSearch && matchesPlatform && matchesStatus;
    });

    return (
        <>
            <Helmet>
                <title>Notifications - ScriptMind</title>
            </Helmet>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <header className="sticky top-0 z-50 w-full border-b border-sidebar-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-16 items-center justify-between px-3 sm:px-6">
                        <div className="flex items-center gap-2 pl-11 sm:pl-12 lg:pl-0 min-w-0">
                            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight flex items-center gap-1.5">
                                <span className="text-foreground">Notifications</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">Center</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {unreadCount > 0 && (
                                <Button
                                    onClick={() => markAsRead()}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-border hover:border-primary/40 hover:bg-primary/10 hover:text-primary text-muted-foreground text-xs font-semibold gap-1.5 h-8 px-2 sm:px-3 transition-all"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Mark all read</span>
                                </Button>
                            )}
                            <PaletteCustomizer />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {/* Page content — Full screen width */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 w-full">
                    <div className="w-full space-y-4 pb-16">
                        
                        {/* Search, Filter & Quick Action Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                                <Input
                                    placeholder="Search notifications, video titles, or notes..."
                                    className="pl-10 h-10 bg-card/60 border-border/80 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary text-xs sm:text-sm placeholder:text-muted-foreground/50 transition-all shadow-sm w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Platform Dropdown Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-10 px-3 rounded-xl border-border/80 bg-card/60 hover:bg-secondary text-xs font-semibold gap-1.5 transition-all shadow-sm"
                                        >
                                            <Filter className="size-3.5 text-muted-foreground" />
                                            <span>{filterPlatform || "All Platforms"}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/80 p-1.5 shadow-xl">
                                        <DropdownMenuItem onClick={() => setFilterPlatform(null)} className="rounded-xl cursor-pointer text-xs font-semibold py-1.5">
                                            All Platforms
                                        </DropdownMenuItem>
                                        {platforms.map(p => (
                                            <DropdownMenuItem key={p} onClick={() => setFilterPlatform(p)} className="rounded-xl cursor-pointer text-xs font-semibold py-1.5 capitalize">
                                                {p}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Refresh Button */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl border-border/80 bg-card/60 hover:bg-secondary transition-all shrink-0 shadow-sm"
                                    onClick={fetchNotifications}
                                    title="Refresh activity"
                                >
                                    <RefreshCw className={cn("size-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
                                </Button>

                                {/* Clear All Button */}
                                {notifications.length > 0 && (
                                    <Button
                                        onClick={clearAll}
                                        variant="outline"
                                        className="h-10 px-3 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-semibold gap-1.5 transition-all shrink-0 shadow-sm"
                                    >
                                        <Trash2 className="size-3.5" />
                                        <span className="hidden sm:inline">Clear all</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Quick Filter Tabs Strip */}
                        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={cn(
                                    "px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 shadow-xs",
                                    statusFilter === 'all'
                                        ? "bg-primary text-primary-foreground shadow-primary/20"
                                        : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <Layers className="size-4" />
                                <span>All</span>
                                <span className={cn(
                                    "ml-0.5 px-2 py-0.5 rounded-md text-xs font-bold",
                                    statusFilter === 'all' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
                                )}>
                                    {notifications.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter('unread')}
                                className={cn(
                                    "px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 shadow-xs",
                                    statusFilter === 'unread'
                                        ? "bg-primary text-primary-foreground shadow-primary/20"
                                        : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <Inbox className="size-4" />
                                <span>Unread</span>
                                {unreadCount > 0 && (
                                    <span className="ml-0.5 px-2 py-0.5 rounded-md text-xs bg-rose-500 text-white font-black">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter('notes')}
                                className={cn(
                                    "px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 shadow-xs",
                                    statusFilter === 'notes'
                                        ? "bg-primary text-primary-foreground shadow-primary/20"
                                        : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                            >
                                <Sparkles className="size-4" />
                                <span>Notes</span>
                                <span className={cn(
                                    "ml-0.5 px-2 py-0.5 rounded-md text-xs font-bold",
                                    statusFilter === 'notes' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
                                )}>
                                    {notesCount}
                                </span>
                            </button>
                        </div>

                        {/* Stream Header */}
                        <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xs sm:text-sm font-black tracking-tight text-foreground uppercase">Activity Stream</h2>
                                <span className="text-xs text-muted-foreground font-semibold">({filteredNotifications.length})</span>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => markAsRead()}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List — Compact Cards */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
                                <RefreshCw className="size-6 animate-spin text-primary opacity-60" />
                                <p className="text-xs font-medium">Loading activity updates...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/60 bg-card/20 rounded-2xl text-center space-y-2 p-6">
                                <div className="size-11 rounded-xl bg-secondary/80 flex items-center justify-center text-muted-foreground mx-auto">
                                    <Bell className="size-5 stroke-1" />
                                </div>
                                <h3 className="font-bold text-sm text-foreground">No notifications found</h3>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    {searchQuery ? "No alerts match your search query." : "You're all caught up! Activity updates will appear here."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredNotifications.map((n) => {
                                    const isUnread = n.status === 'unread';
                                    const isNoteGen = n.message.toLowerCase().includes('notes') || n.title.toLowerCase().includes('notes');

                                    return (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                "group relative flex items-center gap-3.5 sm:gap-4 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl transition-all duration-150 w-full",
                                                isUnread
                                                    ? "bg-card/90 shadow-sm hover:bg-card"
                                                    : "bg-card/45 hover:bg-card/75"
                                            )}
                                        >
                                            {/* Visual Status Icon */}
                                            <div className={cn(
                                                "size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105",
                                                n.type === 'success' 
                                                    ? "bg-emerald-500/10 text-emerald-500" 
                                                    : n.type === 'warning' 
                                                        ? "bg-amber-500/10 text-amber-500" 
                                                        : n.type === 'error' 
                                                            ? "bg-rose-500/10 text-rose-500" 
                                                            : "bg-primary/10 text-primary"
                                            )}>
                                                {isNoteGen ? (
                                                    <Sparkles className="size-4 sm:size-4.5" />
                                                ) : n.type === 'success' ? (
                                                    <CheckCircle2 className="size-4 sm:size-4.5" />
                                                ) : n.type === 'warning' ? (
                                                    <AlertTriangle className="size-4 sm:size-4.5" />
                                                ) : n.type === 'error' ? (
                                                    <AlertCircle className="size-4 sm:size-4.5" />
                                                ) : (
                                                    <Bell className="size-4 sm:size-4.5" />
                                                )}
                                            </div>

                                            {/* Content Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-secondary text-foreground/85 shrink-0">
                                                        {getPlatformIcon(n.platform)}
                                                        <span>{n.platform || 'System'}</span>
                                                    </span>

                                                    <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                                                        {n.title}
                                                    </h3>

                                                    {isUnread && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary shrink-0">
                                                            New
                                                        </span>
                                                    )}

                                                    <span className="text-xs text-muted-foreground/70 font-medium ml-auto shrink-0 flex items-center gap-1">
                                                        <Clock className="size-3.5 opacity-60" />
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
                                                    <p className="truncate line-clamp-1 flex-1 text-xs sm:text-sm">
                                                        {n.message}
                                                    </p>

                                                    {isNoteGen && (
                                                        <Link
                                                            to="/"
                                                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0 ml-2"
                                                        >
                                                            <span>Open Notes</span>
                                                            <ArrowRight className="size-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Controls */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {isUnread && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => markAsRead(n.id)}
                                                        title="Mark as read"
                                                        className="size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Check className="size-4" />
                                                    </Button>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                                        >
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/80 p-1 shadow-xl">
                                                        {isUnread && (
                                                            <DropdownMenuItem onClick={() => markAsRead(n.id)} className="rounded-lg cursor-pointer gap-2 text-xs font-semibold py-1.5">
                                                                <Check className="size-3.5 text-emerald-500" />
                                                                Mark as read
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(`${n.title}\n${n.message}`);
                                                                toast({ title: "Copied to clipboard" });
                                                            }} 
                                                            className="rounded-xl cursor-pointer gap-2 text-xs font-semibold py-1.5"
                                                        >
                                                            <Copy className="size-3.5 text-muted-foreground" />
                                                            Copy details
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Notifications;
