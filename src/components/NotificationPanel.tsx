import React, { useState, useEffect } from 'react';
import { Bell, Check, Mail, MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import API_BASE_URL from "@/lib/api";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    platform: string;
    status: 'unread' | 'read';
    created_at: string;
}

export function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/alerts`);
            const data = await response.json();
            if (!Array.isArray(data)) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => n.status === 'unread').length);
        } catch {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async () => {
        try {
            await fetch(`${API_BASE_URL}/alerts/read`, { method: 'POST' });
            fetchNotifications();
        } catch { /* silent */ }
    };

    const getPlatformIcon = (platform: string) => {
        const p = (platform || 'system').toLowerCase();
        if (p.includes('teams')) return <MessageSquare className="w-3 h-3 text-blue-400" />;
        if (p.includes('telegram')) return <Send className="w-3 h-3 text-sky-400" />;
        if (p.includes('email')) return <Mail className="w-3 h-3 text-amber-400" />;
        return <Bell className="w-3 h-3 text-muted-foreground/50" />;
    };

    return (
        <Popover onOpenChange={(open) => open && markAsRead()}>
            <PopoverTrigger asChild>
                <button className="relative h-10 w-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[440px] p-0 rounded-2xl shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl"
                align="end"
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        <span className="font-bold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAsRead} className="text-[11px] h-7 px-2 text-muted-foreground">
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* List */}
                <ScrollArea className="h-[380px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
                            <Bell className="w-10 h-10 mb-3 stroke-1" />
                            <p className="text-xs">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className="flex gap-3 items-start px-4 py-3 hover:bg-muted/20 transition-colors"
                                >
                                    {/* Small icon */}
                                    <div className={cn(
                                        "mt-1 size-6 rounded-md flex items-center justify-center shrink-0",
                                        n.type === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                                        n.type === 'warning' ? "bg-amber-500/10 text-amber-400" :
                                        n.type === 'error'   ? "bg-red-500/10 text-red-400" :
                                        "bg-muted text-muted-foreground/50"
                                    )}>
                                        {n.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Title + time row */}
                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                            <p className="font-semibold text-[13px] text-foreground leading-snug line-clamp-2 flex-1">
                                                {n.status === 'unread' && (
                                                    <span className="inline-block size-1.5 rounded-full bg-primary mr-1.5 mb-[1px] align-middle shrink-0" />
                                                )}
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap shrink-0 pt-0.5">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        <p className="text-[11px] text-muted-foreground/55 line-clamp-1 leading-relaxed">
                                            {n.message}
                                        </p>

                                        {/* Platform */}
                                        <div className="mt-1 flex items-center gap-1">
                                            {getPlatformIcon(n.platform)}
                                            <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/40">
                                                {n.platform || 'system'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border/40">
                    <Link to="/notifications">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
                            View all notifications →
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
