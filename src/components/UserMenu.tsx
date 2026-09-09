import { LogOut, User as UserIcon, Settings, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";

export const UserMenu = ({ compact = false }: { compact?: boolean }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (!isAuthenticated || !user) {
        if (compact) {
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/login")}
                    title="Login"
                    className="size-9 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                    <UserIcon className="h-4 w-4" />
                </Button>
            );
        }

        return (
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/login")}
                    className="text-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                    Login
                </Button>
                <Button
                    size="sm"
                    onClick={() => navigate("/register")}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md border-0 transition-all"
                >
                    Sign Up
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size={compact ? "icon" : "sm"}
                    className={cn(
                        "hover:bg-white/5 transition-colors",
                        compact ? "size-9 rounded-full p-0" : "flex items-center gap-2"
                    )}
                >
                    <Avatar className="w-8 h-8 border border-primary/20">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {!compact && (
                        <span className="text-foreground font-medium hidden sm:inline">
                            {user.username}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={compact ? "center" : "end"} side={compact ? "right" : "bottom"} className="w-56 bg-card/95 backdrop-blur-xl border-white/10">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[120px]" title={user.username}>{user.username}</p>
                            <div className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${(user.plan || 'free') === 'expert' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' :
                                    (user.plan || 'free') === 'pro' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        'bg-zinc-800 text-zinc-400 border border-white/10'
                                }`}>
                                {user.plan || 'Free'}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={user.email}>{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer focus:bg-white/5"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                    <DropdownMenuItem
                        onClick={() => navigate("/admin")}
                        className="cursor-pointer focus:bg-white/5 text-purple-400"
                    >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
