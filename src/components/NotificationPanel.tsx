
import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, Mail, MessageSquare, Send } from 'lucide-react';
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
            const response = await fetch('http://localhost:3001/api/notifications');
            const data = await response.json();

            if (!Array.isArray(data)) {
                console.error('Unexpected notifications response shape:', data);
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => n.status === 'unread').length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async () => {
        try {
            await fetch('http://localhost:3001/api/notifications/read', { method: 'POST' });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getPlatformIcon = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('teams')) return <MessageSquare className="w-3 h-3 text-blue-500" />;
        if (p.includes('telegram')) return <Send className="w-3 h-3 text-sky-500" />;
        if (p.includes('email')) return <Mail className="w-3 h-3 text-amber-500" />;
        return <Bell className="w-3 h-3 text-primary" />;
    };

    return (
        <Popover onOpenChange={(open) => open && markAsRead()}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 rounded-2xl shadow-2xl border-border/50 backdrop-blur-xl bg-card/95" align="end">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAsRead} className="text-xs h-7 px-2">
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground opacity-50">
                            <Bell className="w-12 h-12 mb-4 stroke-1" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-4 transition-colors hover:bg-secondary/20 group",
                                        n.status === 'unread' ? "bg-primary/5" : "bg-transparent"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                            n.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                                        )}>
                                            {n.type === 'success' ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-sm truncate pr-2">{n.title}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50">
                                                    {getPlatformIcon(n.platform)}
                                                    <span className="text-[10px] font-medium text-foreground/70">{n.platform}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-3 border-t border-border/50 text-center">
                    <Link to="/notifications">
                        <Button variant="link" size="sm" className="text-xs text-muted-foreground">
                            View all history
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
