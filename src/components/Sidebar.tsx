import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Video, Plus, CreditCard, Search, Star, Menu, ExternalLink, Trash2, Bell, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { useTheme } from "@/hooks/useTheme";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNotes } from "@/context/NotesContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onHistorySelect?: (item: any) => void;
    refreshTrigger?: number;
    onNewNote?: () => void;
    onCloseMobile?: () => void;
}

export function Sidebar({ className, onHistorySelect, refreshTrigger, onNewNote, onCloseMobile }: SidebarProps) {
    const {
        history,
        filteredHistory,
        searchQuery,
        setSearchQuery,
        favoritesOnly,
        setFavoritesOnly,
        clearHistory,
        fetchHistory,
        toggleFavorite,
        deleteHistoryItem,
    } = useNotesHistory();
    const { loadHistoryItem, reset } = useNotes();
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger]);

    const handleHistorySelect = (item: any) => {
        onHistorySelect ? onHistorySelect(item) : loadHistoryItem(item);
        if (location.pathname !== '/') {
            navigate('/');
        }
        setOpen(false);
        onCloseMobile?.();
    };

    const isPathActive = (path: string) => location.pathname === path;

    const sidebarContent = (
        <div className="flex h-full flex-col bg-sidebar-background">
            <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50">
                <Link to="/" className="flex items-center gap-3 w-full group">
                    <div className="relative size-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-md group-hover:shadow-primary/30 shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-transparent opacity-60 pointer-events-none" />
                        <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-5 h-5 relative z-10 text-primary transition-transform duration-300 group-hover:scale-110"
                        >
                            <path 
                                d="M17.5 7C17.5 5.067 15.709 3.5 13.5 3.5H9.5C6.73858 3.5 4.5 5.73858 4.5 8.5C4.5 11.2614 6.73858 13.5 9.5 13.5H14.5C17.2614 13.5 19.5 15.7386 19.5 18.5C19.5 21.2614 17.2614 23.5 14.5 23.5H10.5C8.291 23.5 6.5 21.933 6.5 20" 
                                stroke="currentColor" 
                                strokeWidth="2.75" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                            />
                            <circle cx="17.5" cy="7" r="1.5" fill="currentColor" />
                            <circle cx="6.5" cy="20" r="1.5" fill="currentColor" />
                            <path 
                                d="M12 11.5L12 15.5" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                opacity="0.6" 
                            />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-lg tracking-tight text-foreground leading-none flex items-center">
                            Script<span className="text-primary font-black ml-0.5">Mind</span>
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            AI STUDIO
                        </span>
                    </div>
                </Link>
            </div>

            <div className="flex-1 py-4 flex flex-col gap-4 overflow-hidden min-h-0">
                <div className="px-4 shrink-0">
                    <div className="space-y-1">
                        <Button 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-4 text-sm font-medium transition-all",
                                isPathActive("/")
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-sidebar-foreground/80 hover:text-primary hover:bg-primary/5"
                            )} 
                            asChild
                        >
                            <Link to="/" onClick={() => { (onNewNote || reset)(); setOpen(false); onCloseMobile?.(); }}>
                                <Plus className="h-4 w-4" />
                                New Note
                            </Link>
                        </Button>

                        <Button 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-4 text-sm font-medium transition-all",
                                isPathActive("/playlist")
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-sidebar-foreground/80 hover:text-primary hover:bg-primary/5"
                            )} 
                            asChild
                        >
                            <Link to="/playlist" onClick={() => { setOpen(false); onCloseMobile?.(); }}>
                                <Video className="h-4 w-4" />
                                Playlist Downloader
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-4 text-sm font-medium transition-all",
                                isPathActive("/pricing")
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-sidebar-foreground/80 hover:text-primary hover:bg-primary/5"
                            )} 
                            asChild
                        >
                            <Link to="/pricing" onClick={() => { setOpen(false); onCloseMobile?.(); }}>
                                <CreditCard className="h-4 w-4" />
                                Pricing
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-4 text-sm font-medium transition-all",
                                isPathActive("/notifications")
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-sidebar-foreground/80 hover:text-primary hover:bg-primary/5"
                            )} 
                            asChild
                        >
                            <Link to="/notifications" onClick={() => { setOpen(false); onCloseMobile?.(); }}>
                                <Bell className="h-4 w-4" />
                                Notifications
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-4 text-sm font-medium transition-all",
                                isPathActive("/organization")
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-sidebar-foreground/80 hover:text-primary hover:bg-primary/5"
                            )} 
                            asChild
                        >
                            <Link to="/organization" onClick={() => { setOpen(false); onCloseMobile?.(); }}>
                                <Users className="h-4 w-4" />
                                Organization
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* History Section */}
                <div className="px-4 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            History
                        </h2>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">Clear</button>
                        )}
                    </div>

                    {/* History Search */}
                    {history.length > 0 && (
                        <div className="mb-2 shrink-0 relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-8 text-xs bg-secondary/30 border-border/50"
                            />
                        </div>
                    )}

                    {/* All / Favorites Tabs */}
                    {history.length > 0 && (
                        <div className="flex bg-secondary/50 rounded-lg p-0.5 mb-2 shrink-0">
                            <button
                                onClick={() => setFavoritesOnly(false)}
                                className={cn(
                                    "flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all",
                                    !favoritesOnly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFavoritesOnly(true)}
                                className={cn(
                                    "flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center justify-center gap-1",
                                    favoritesOnly ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Star className="w-3 h-3" />
                                Favorites
                            </button>
                        </div>
                    )}

                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-1 pb-4">
                            {filteredHistory.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-6">
                                    {history.length === 0 ? "No notes yet." : "No matching notes."}
                                </div>
                            ) : (
                                filteredHistory.map((item) => (
                                    <ContextMenu key={item.id}>
                                        <ContextMenuTrigger asChild>
                                            <div
                                                className="group flex items-center gap-1 rounded-lg hover:bg-sidebar-accent/50 transition-all"
                                            >
                                                <button
                                                    className="flex-1 flex items-center gap-3 text-left py-2.5 px-3 min-w-0"
                                                    onClick={() => handleHistorySelect(item)}
                                                >
                                                    <div className="relative shrink-0 overflow-hidden rounded-md w-12 h-8 bg-muted">
                                                        <img
                                                            src={item.thumbnail}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                                        <span className="truncate text-xs font-medium text-sidebar-foreground/90 group-hover:text-primary transition-colors">
                                                            {item.title}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/60 truncate">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </button>
                                                <div className="flex items-center shrink-0 pr-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                                                        className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-amber-500 transition-colors"
                                                        title={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
                                                    >
                                                        <Star className={cn("w-3.5 h-3.5", item.is_favorite && "fill-amber-500 text-amber-500")} />
                                                    </button>
                                                </div>
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48">
                                            <ContextMenuItem onClick={() => handleHistorySelect(item)}>
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Open
                                            </ContextMenuItem>
                                            <ContextMenuItem onClick={() => toggleFavorite(item)}>
                                                <Star className={cn("w-4 h-4 mr-2", item.is_favorite && "fill-amber-500 text-amber-500")} />
                                                {item.is_favorite ? "Remove from favourites" : "Like as favourites"}
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                                onClick={() => deleteHistoryItem(item)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="mt-auto px-4 pt-4 border-t border-sidebar-border/50 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <UserMenu />
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "shrink-0 lg:hidden fixed left-4 top-4 z-[60] bg-background/80 backdrop-blur-md border border-border transition-all duration-200",
                            open ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                        )}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    {sidebarContent}
                </SheetContent>
            </Sheet>

            <div className={cn("hidden lg:block w-[280px] fixed inset-y-0 left-0 z-40", className)}>
                <div className="h-full w-full bg-sidebar-background/80 backdrop-blur-xl border-r border-sidebar-border/50 shadow-2xl flex flex-col overflow-hidden">
                    {sidebarContent}
                </div>
            </div>
        </>
    );
}
