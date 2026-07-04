
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Building2, Trash2, Shield, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Zap, Edit2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import API_BASE_URL from "@/lib/api";

interface OrganizationData {
    id: number;
    name: string;
    owner_id: number;
    owner_name: string;
    max_members: number;
}

interface Member {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    role: string;
    plan: string;
}

const Organization = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [org, setOrg] = useState<OrganizationData | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [selectedPlan, setSelectedPlan] = useState<"pro" | "expert">("pro");
    const [orgName, setOrgName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrgData();
    }, []);

    const fetchOrgData = async () => {
        try {
            const token = localStorage.getItem('token');
            const orgRes = await fetch(`${API_BASE_URL}/organization`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (orgRes.ok) {
                const data = await orgRes.json();
                setOrg(data);
                
                const membersRes = await fetch(`${API_BASE_URL}/organization/members`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (membersRes.ok) {
                    setMembers(await membersRes.json());
                }
            }
        } catch (error) {
            console.error("Failed to fetch organization data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrg = async () => {
        if (!orgName.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/organization`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: orgName })
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Success", description: "Organization created successfully!" });
                fetchOrgData();
            } else {
                toast({ variant: "destructive", title: "Error", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to create organization" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberEmail.trim()) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/organization/members`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    email: newMemberEmail,
                    plan: selectedPlan 
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast({ title: "Success", description: "Member added successfully!" });
                setNewMemberEmail("");
                fetchOrgData();
            } else {
                toast({ variant: "destructive", title: "Error", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to add member" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: number) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/organization/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: "Removed", description: "Member has been removed from organization." });
                fetchOrgData();
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove member" });
        }
    };
    
    const handleUpdateMemberPlan = async (memberId: number, plan: "pro" | "expert") => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/organization/members/${memberId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ plan })
            });
            if (res.ok) {
                toast({ title: "Updated", description: `Member upgraded to ${plan} successfully.` });
                fetchOrgData();
            } else {
                const data = await res.json();
                toast({ variant: "destructive", title: "Error", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update member plan" });
        }
    };

    const isOwner = org && user && org.owner_id === user.id;

    if (loading) return null;

    return (
        <>
            <Helmet>
                <title>Organization - ScriptMind</title>
            </Helmet>

            <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20 text-foreground">
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0 lg:ml-[296px]">
                    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex h-16 items-center justify-between px-6">
                            {/* Page title shown in header row on desktop, aligned with sidebar logo */}
                            <div className="flex items-center gap-3 pl-12 lg:pl-0">
                                <Building2 className="w-5 h-5 text-primary" />
                                <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                                    Organization
                                </h1>
                            </div>
                            {/* Right side controls */}
                            <div className="flex items-center gap-2">
                                <NotificationPanel />
                                <ThemeToggle />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full pb-12 animate-in fade-in duration-700 space-y-6">

                        {!org ? (
                            <Card className="border-border bg-card rounded-[32px] overflow-hidden p-12 text-center space-y-8 border shadow-2xl">
                                <div className="size-24 rounded-[32px] bg-primary/5 flex items-center justify-center border border-primary/10 mx-auto">
                                    <Building2 className="size-12 text-primary/50" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-foreground">Setup Your Organization</h2>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Create an organization to add team members and give them full access to ScriptMind AI.
                                    </p>
                                </div>
                                
                                {user?.plan === 'organization' ? (
                                    <div className="max-w-md mx-auto space-y-4">
                                        <Input 
                                            placeholder="Organization Name (e.g. ScriptMind School)" 
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                                        />
                                        <Button 
                                            onClick={handleCreateOrg} 
                                            disabled={actionLoading || !orgName.trim()}
                                            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                                        >
                                            {actionLoading ? <Loader2 className="animate-spin" /> : "Create Organization"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <Badge variant="outline" className="py-2 px-4 rounded-full border-amber-500/20 text-amber-500 bg-amber-500/5 font-bold uppercase tracking-widest text-[10px]">
                                            Subscription Required
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            You need an **Organization Plan** to create and manage teams.
                                        </p>
                                        <Button variant="outline" className="h-12 px-8 rounded-xl border-border hover:bg-muted" asChild>
                                            <a href="/pricing">View Plans</a>
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-8">
                                {/* Org Info Card */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="md:col-span-2 border-border bg-card rounded-3xl border shadow-sm">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                                                {org.name}
                                                <Badge className="bg-primary/20 text-primary border-primary/20">Organization</Badge>
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground font-medium">Owned by {org.owner_name}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-4 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <Users className="size-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Active Members</span>
                                                    </div>
                                                    <div className="text-3xl font-black text-foreground">{members.length} / {org.max_members}</div>
                                                </div>
                                                <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
                                                    <div className="flex items-center gap-2 text-green-500">
                                                        <CheckCircle2 className="size-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Subscription</span>
                                                    </div>
                                                    <div className="text-xl font-black text-foreground">Active (Expert)</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {isOwner && (
                                        <Card className="border-border bg-card rounded-3xl border flex flex-col justify-center p-8 space-y-6">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-foreground">Add Member</h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Invite a user by their email to share organization benefits.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder="user@example.com"
                                                        value={newMemberEmail}
                                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                                        className="h-12 bg-background border-border rounded-xl pl-10 text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Access Tier</span>
                                                    <Select value={selectedPlan} onValueChange={(v: any) => setSelectedPlan(v)}>
                                                        <SelectTrigger className="h-12 bg-background border-border rounded-xl font-bold">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="border-border">
                                                            <SelectItem value="pro" className="font-bold">
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="size-3 text-amber-500" />
                                                                    <span>Pro Tier</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="expert" className="font-bold">
                                                                <div className="flex items-center gap-2">
                                                                    <Sparkles className="size-3 text-purple-500" />
                                                                    <span>Expert Tier</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button 
                                                    onClick={handleAddMember}
                                                    disabled={actionLoading || !newMemberEmail.trim()}
                                                    className="w-full h-12 rounded-xl font-bold flex gap-2"
                                                >
                                                    {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <><UserPlus className="size-4" /> Add Member</>}
                                                </Button>
                                            </div>
                                        </Card>
                                    )}
                                </div>

                                {/* Members Table */}
                                <Card className="border-border bg-card rounded-3xl overflow-hidden border shadow-sm">
                                    <CardHeader className="p-8 border-b border-border/50">
                                        <CardTitle className="text-xl font-black text-foreground">Team Members</CardTitle>
                                    </CardHeader>
                                    <Table>
                                        <TableHeader className="bg-muted/10">
                                            <TableRow className="border-border/50 hover:bg-transparent">
                                                <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</TableHead>
                                                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</TableHead>
                                                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</TableHead>
                                                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {members.map((member) => (
                                                <TableRow key={member.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                                                    <TableCell className="py-5 pl-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-10 rounded-full bg-secondary border border-border overflow-hidden">
                                                                <img src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.username}`} alt="" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-foreground">{member.username}</div>
                                                                <div className="text-xs text-muted-foreground">{member.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`font-black uppercase tracking-tighter text-[9px] border-0 px-2 py-0.5 rounded-md ${
                                                                member.plan === 'expert' ? 'bg-purple-500/10 text-purple-500' : 'bg-amber-500/10 text-amber-500'
                                                            }`}
                                                        >
                                                            {member.plan || 'pro'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {member.id === org.owner_id ? (
                                                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1 w-fit">
                                                                <Shield className="size-3" /> Owner
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-border text-muted-foreground">Member</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8">
                                                        {isOwner && member.id !== user?.id && (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted">
                                                                            <MoreVertical className="size-4 text-muted-foreground" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="border-border w-48">
                                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subscription Plan</DropdownMenuLabel>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleUpdateMemberPlan(member.id, 'pro')}
                                                                            className="flex items-center gap-2 font-bold focus:bg-muted"
                                                                        >
                                                                            <Zap className="size-3 text-amber-500" /> Pro Tier
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleUpdateMemberPlan(member.id, 'expert')}
                                                                            className="flex items-center gap-2 font-bold focus:bg-muted"
                                                                        >
                                                                            <Sparkles className="size-3 text-purple-500" /> Expert Tier
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem 
                                                                            onClick={() => handleRemoveMember(member.id)}
                                                                            className="flex items-center gap-2 font-bold text-destructive focus:bg-destructive/10"
                                                                        >
                                                                            <Trash2 className="size-3" /> Remove Member
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default Organization;
