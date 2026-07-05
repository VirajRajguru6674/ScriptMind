
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Sparkles, Youtube, BookOpen, Brain, Zap, Github, Lock } from "lucide-react";
import { useGoogleLogin } from '@react-oauth/google';

// --- Internal Animated Components ---

interface PupilProps {
    size?: number;
    maxDistance?: number;
    pupilColor?: string;
    forceLookX?: number;
    forceLookY?: number;
}

const Pupil = ({
    size = 12,
    maxDistance = 6,
    pupilColor = "#1A1A1A",
    forceLookX,
    forceLookY
}: PupilProps) => {
    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const pupilRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const calculatePupilPosition = () => {
        if (!pupilRef.current) return { x: 0, y: 0 };
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }
        const pupil = pupilRef.current.getBoundingClientRect();
        const pupilCenterX = pupil.left + pupil.width / 2;
        const pupilCenterY = pupil.top + pupil.height / 2;
        const deltaX = mouseX - pupilCenterX;
        const deltaY = mouseY - pupilCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    };

    const pos = calculatePupilPosition();

    return (
        <div
            ref={pupilRef}
            className="rounded-full shadow-inner"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: pupilColor,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                transition: 'transform 0.15s cubic-bezier(0.33, 1, 0.68, 1)',
            }}
        />
    );
};

interface EyeBallProps {
    size?: number;
    pupilSize?: number;
    maxDistance?: number;
    eyeColor?: string;
    pupilColor?: string;
    isBlinking?: boolean;
    forceLookX?: number;
    forceLookY?: number;
}

const EyeBall = ({
    size = 48,
    pupilSize = 16,
    maxDistance = 12,
    eyeColor = "white",
    pupilColor = "#1A1A1A",
    isBlinking = false,
    forceLookX,
    forceLookY
}: EyeBallProps) => {
    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const eyeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const calculatePupilPosition = () => {
        if (!eyeRef.current) return { x: 0, y: 0 };
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }
        const eye = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = eye.left + eye.width / 2;
        const eyeCenterY = eye.top + eye.height / 2;
        const deltaX = mouseX - eyeCenterX;
        const deltaY = mouseY - eyeCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    };

    const pos = calculatePupilPosition();

    return (
        <div
            ref={eyeRef}
            className="rounded-full flex items-center justify-center transition-all duration-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-black/5"
            style={{
                width: `${size}px`,
                height: isBlinking ? '4px' : `${size}px`,
                backgroundColor: eyeColor,
                overflow: 'hidden',
            }}
        >
            {!isBlinking && (
                <div
                    className="rounded-full shadow-lg"
                    style={{
                        width: `${pupilSize}px`,
                        height: `${pupilSize}px`,
                        backgroundColor: pupilColor,
                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                        transition: 'transform 0.15s cubic-bezier(0.33, 1, 0.68, 1)',
                    }}
                />
            )}
        </div>
    );
};

// --- Main Login Component ---

let lastProcessedGithubCode: string | null = null;

const Login = () => {
    const { login, googleLogin, githubLogin } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
    const [isBlackBlinking, setIsBlackBlinking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
    const [isPurplePeeking, setIsPurplePeeking] = useState(false);

    const purpleRef = useRef<HTMLDivElement>(null);
    const blackRef = useRef<HTMLDivElement>(null);
    const yellowRef = useRef<HTMLDivElement>(null);
    const orangeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Blinking Effects
    useEffect(() => {
        const scheduleBlink = (setBlink: (val: boolean) => void) => {
            const timeout = setTimeout(() => {
                setBlink(true);
                setTimeout(() => {
                    setBlink(false);
                    scheduleBlink(setBlink);
                }, 150);
            }, Math.random() * 4500 + 2500);
            return timeout;
        };
        const pTimeout = scheduleBlink(setIsPurpleBlinking);
        const bTimeout = scheduleBlink(setIsBlackBlinking);
        return () => {
            clearTimeout(pTimeout);
            clearTimeout(bTimeout);
        };
    }, []);

    // Event Animations
    useEffect(() => {
        if (isTyping) {
            setIsLookingAtEachOther(true);
            const timer = setTimeout(() => setIsLookingAtEachOther(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [isTyping]);

    useEffect(() => {
        if (password.length > 0 && showPassword) {
            const interval = setInterval(() => {
                setIsPurplePeeking(true);
                setTimeout(() => setIsPurplePeeking(false), 900);
            }, Math.random() * 3000 + 3500);
            return () => clearInterval(interval);
        }
    }, [password, showPassword]);

    const calculateFacePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return { x: 0, y: 0, skew: 0 };
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        return {
            x: Math.max(-18, Math.min(18, dx / 22)),
            y: Math.max(-12, Math.min(12, dy / 32)),
            skew: Math.max(-8, Math.min(8, -dx / 130))
        };
    };

    const pPos = calculateFacePosition(purpleRef);
    const bPos = calculateFacePosition(blackRef);
    const yPos = calculateFacePosition(yellowRef);
    const oPos = calculateFacePosition(orangeRef);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await login(email, password);
            toast({ title: "Welcome back!", description: `Successfully logged in. Let's study!` });
            navigate("/");
        } catch (err: any) {
            const msg = err?.message || "Invalid credentials. Please try again.";
            setError(msg);
            toast({ title: "Login failed", description: msg, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (tokenResponse: any) => {
        setIsLoading(true);
        try {
            // With useGoogleLogin the token is in access_token if using implicit flow 
            // but we want the ID token usually. However, useGoogleLogin can also 
            // give us the access token to fetch user info.
            // Let's stick to the simplest approach or check how our backend handles it.
            // Actually, the previous GoogleLogin gave us a credential (ID Token).
            // useGoogleLogin with flow: 'implicit' gives access_token.
            // To get ID Token we usually need the standard button or a more complex flow.
            // Alternatively, I'll use a custom button that triggers the standard Google login.

            // For now, let's use the access_token and let backend handle it, 
            // or I'll just use a button that triggers the auth.

            // Re-evaluating: To keep it simple and working with current backend, 
            // I'll style a custom button but let it trigger the same flow.

            // Actually, useGoogleLogin is better for custom UI.
            // I'll update backend to accept access_token if needed, 
            // but usually people want the ID token.

            // Let's try useGoogleLogin's default behavior.
            await googleLogin(tokenResponse.access_token);
            toast({ title: "Welcome back!", description: `Successfully logged in via Google.` });
            navigate("/");
        } catch (err: any) {
            toast({ title: "Google Login failed", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast({ title: "Google Login failed", description: "OAuth error occurred", variant: "destructive" })
    });

    const handleGithubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "Ov23lipHB7a97XIWi8yL";
        const redirectUri = window.location.origin + "/login";
        const scope = "user:email";
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code && lastProcessedGithubCode !== code) {
            lastProcessedGithubCode = code;
            setIsLoading(true);
            const redirectUri = window.location.origin + "/login";
            githubLogin(code, redirectUri).then(() => {
                toast({ title: "Welcome back!", description: "Successfully logged in via GitHub." });
                navigate("/");
            }).catch(err => {
                toast({ title: "GitHub Login failed", description: err.message, variant: "destructive" });
            }).finally(() => {
                setIsLoading(false);
                // Clear the code from URL
                window.history.replaceState({}, document.title, window.location.pathname);
            });
        }
    }, [githubLogin, navigate, toast]);

    return (
        <div className="min-h-screen flex items-stretch bg-[#0F1115] overflow-hidden selection:bg-primary/30">
            <Helmet>
                <title>Login | ScriptMind AI</title>
            </Helmet>

            {/* Characters Illustration - Left Side */}
            <div className="relative hidden lg:flex flex-[1.2] flex-col justify-between bg-gradient-to-br from-[#1E2028] via-[#16181D] to-[#0F1115] p-16 overflow-hidden border-r border-white/5">

                {/* Animated Background Icons */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <Brain className="absolute top-[10%] left-[10%] w-12 h-12 text-blue-500/20 animate-pulse" />
                    <Zap className="absolute top-[30%] right-[15%] w-8 h-8 text-yellow-500/20 animate-bounce" style={{ animationDuration: '3s' }} />
                    <BookOpen className="absolute bottom-[20%] left-[15%] w-10 h-10 text-emerald-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
                    <Youtube className="absolute bottom-[40%] right-[10%] w-14 h-14 text-red-500/20 animate-pulse" style={{ animationDuration: '5s' }} />
                </div>

                {/* Brand Header */}
                <div className="relative z-20 space-y-8">
                    <div className="flex items-center gap-4 group">
                        <div className="size-12 rounded-2xl overflow-hidden border border-primary/30 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                            <img src="/logo.png" alt="ScriptMind Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white leading-tight">ScriptMind</h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">AI Genius Learning</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-xs animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
                        <h3 className="text-xl font-bold text-white/90">Summarize any YouTube video instantly.</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Turn long lectures and tutorials into concise, actionable notes using our advanced AI engine.
                            Master content faster than ever.
                        </p>
                    </div>
                </div>

                {/* Character Stage */}
                <div className="relative z-20 flex items-end justify-center h-[550px] translate-y-8">
                    <div className="relative" style={{ width: '550px', height: '450px' }}>

                        {/* Main Character */}
                        <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl" style={{
                            left: '70px', width: '180px', zIndex: 1, backgroundColor: 'hsl(var(--primary, 250 80% 54%))', borderRadius: '15px 15px 0 0',
                            height: (isTyping || (password.length > 0 && !showPassword)) ? '460px' : '400px',
                            transformOrigin: 'bottom center',
                            transform: (password.length > 0 && showPassword) ? 'skewX(0deg)' : (isTyping || (password.length > 0 && !showPassword)) ? `skewX(${pPos.skew - 12}deg) translateX(40px)` : `skewX(${pPos.skew}deg)`
                        }}>
                            <div className="absolute top-4 left-4 w-12 h-4 bg-white/10 rounded-full blur-[2px]" />
                            <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{
                                left: (password.length > 0 && showPassword) ? '30px' : isLookingAtEachOther ? '60px' : `${50 + pPos.x}px`,
                                top: (password.length > 0 && showPassword) ? '45px' : isLookingAtEachOther ? '75px' : `${50 + pPos.y}px`,
                            }}>
                                <EyeBall size={36} pupilSize={16} maxDistance={8} isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 6 : -6) : isLookingAtEachOther ? 4 : undefined} />
                                <EyeBall size={36} pupilSize={16} maxDistance={8} isBlinking={isPurpleBlinking} forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 6 : -6) : isLookingAtEachOther ? 4 : undefined} />
                            </div>
                            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[80%] h-1 bg-black/10 rounded-full" />
                        </div>

                        {/* Black Character */}
                        <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl" style={{
                            left: '240px', width: '130px', height: '330px', zIndex: 2, backgroundColor: '#1A1A1A', borderRadius: '12px 12px 0 0',
                            transformOrigin: 'bottom center',
                            transform: (password.length > 0 && showPassword) ? 'skewX(0deg)' : isLookingAtEachOther ? `skewX(${bPos.skew * 1.5 + 10}deg) translateX(25px)` : `skewX(${bPos.skew * 1.5}deg)`
                        }}>
                            <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{
                                left: (password.length > 0 && showPassword) ? '15px' : isLookingAtEachOther ? '35px' : `${30 + bPos.x}px`,
                                top: (password.length > 0 && showPassword) ? '35px' : isLookingAtEachOther ? '20px' : `${40 + bPos.y}px`,
                            }}>
                                <EyeBall size={30} pupilSize={14} maxDistance={6} isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -6 : isLookingAtEachOther ? 0 : undefined} />
                                <EyeBall size={30} pupilSize={14} maxDistance={6} isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -6 : isLookingAtEachOther ? 0 : undefined} />
                            </div>
                        </div>

                        {/* Accent 1 */}
                        <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-[-10px_0_20px_rgba(0,0,0,0.1)]" style={{
                            left: '0px', width: '260px', height: '220px', zIndex: 3, backgroundColor: 'hsl(var(--destructive))', borderRadius: '130px 130px 0 0',
                            transformOrigin: 'bottom center', transform: (password.length > 0 && showPassword) ? 'skewX(0deg)' : `skewX(${oPos.skew}deg)`
                        }}>
                            <div className="absolute flex gap-10 transition-all duration-200" style={{
                                left: (password.length > 0 && showPassword) ? '60px' : `${90 + oPos.x}px`, top: (password.length > 0 && showPassword) ? '95px' : `${100 + oPos.y}px`,
                            }}>
                                <Pupil size={22} forceLookX={(password.length > 0 && showPassword) ? -7 : undefined} />
                                <Pupil size={22} forceLookX={(password.length > 0 && showPassword) ? -7 : undefined} />
                            </div>
                            <div className="absolute top-[40%] left-[20%] w-6 h-3 bg-white/20 rounded-full blur-[1px]" />
                        </div>

                        {/* Accent 2 */}
                        <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl" style={{
                            left: '320px', width: '150px', height: '240px', zIndex: 4, backgroundColor: 'hsl(var(--ring))', borderRadius: '75px 75px 0 0',
                            transformOrigin: 'bottom center', transform: (password.length > 0 && showPassword) ? 'skewX(0deg)' : `skewX(${yPos.skew}deg)`
                        }}>
                            <div className="absolute flex gap-7" style={{ left: (password.length > 0 && showPassword) ? '25px' : `${58 + yPos.x}px`, top: (password.length > 0 && showPassword) ? '40px' : `${45 + yPos.y}px` }}>
                                <Pupil size={22} forceLookX={(password.length > 0 && showPassword) ? -8 : undefined} />
                                <Pupil size={22} forceLookX={(password.length > 0 && showPassword) ? -8 : undefined} />
                            </div>
                            <div className="absolute w-24 h-[5px] bg-[#1A1A1A] rounded-full" style={{ left: (password.length > 0 && showPassword) ? '12px' : `${45 + yPos.x}px`, top: '95px' }} />
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="relative z-20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-6">
                        <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                    <p>© 2026 ScriptMind AI Studio</p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(108,63,245,0.08)_0%,transparent_70%)] pointer-events-none" />
            </div>

            {/* Login Form Section - Right Side */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative min-h-screen overflow-y-auto">
                {/* Generated Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-85"
                    style={{ backgroundImage: `url('/login-bg.png')` }}
                />
                {/* Hex/Grid overlay texture for depth */}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px] pointer-events-none" />

                {/* Form Card (Glassmorphism card exactly like mockup) */}
                <div className="w-full max-w-[410px] bg-black/70 backdrop-blur-xl border border-white/10 px-6 py-6 sm:px-8 sm:py-7 rounded-[24px] shadow-2xl relative z-10 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 drop-shadow-[0_0_20px_rgba(168,85,247,0.2)] uppercase">
                            Login
                        </h1>
                        <p className="text-muted-foreground text-xs font-medium">Let's build your <span className="text-primary font-bold">knowledge.</span></p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5 group">
                            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-primary">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground/45 transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                    required
                                    placeholder="admin@scriptmind.com"
                                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 focus:ring-primary/20 text-white text-sm placeholder:text-muted-foreground/30 pl-12 pr-6 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 group">
                            <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-focus-within:text-primary">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground/45 transition-colors group-focus-within:text-primary" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••••••"
                                    className="h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 focus:ring-primary/20 text-white text-sm placeholder:text-muted-foreground/30 pl-12 pr-12 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors">
                                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pb-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" className="rounded-md border-white/10 data-[state=checked]:bg-primary size-4" />
                                <Label htmlFor="remember" className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-white transition-colors">Keep me signed in</Label>
                            </div>
                            <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">Reset Password</Link>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-shake">
                                <div className="size-1.5 rounded-full bg-red-500 animate-ping" />
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 rounded-xl text-sm font-black bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-[0_8px_24px_rgba(168,85,247,0.3)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98] group border-0" disabled={isLoading}>
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 tracking-wider">
                                    Login to ScriptMind <Zap className="size-4 text-yellow-300 group-hover:scale-125 transition-transform" />
                                </div>
                            )}
                        </Button>

                        <div className="relative flex items-center justify-center my-3.5">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10"></span>
                            </div>
                            <span className="relative px-3.5 bg-[#111317] rounded-full border border-white/10 text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest z-10">or login with</span>
                        </div>

                        <div className="flex items-center justify-center gap-4 w-full">
                            <Button
                                type="button"
                                onClick={() => loginWithGoogle()}
                                className="size-12 rounded-full bg-white hover:bg-white/95 flex items-center justify-center transition-all active:scale-95 shadow-md border-0"
                                title="Login with Google"
                            >
                                <svg className="size-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                                </svg>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleGithubLogin}
                                className="size-12 rounded-full bg-[#18191D] hover:bg-[#24292F] text-white border border-white/10 flex items-center justify-center transition-all active:scale-95 shadow-md"
                                title="Login with GitHub"
                            >
                                <Github className="size-5" />
                            </Button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-white/10 text-center">
                        <p className="text-muted-foreground text-sm font-medium">
                            New to the platform? <Link to="/register" className="text-white font-black hover:text-primary hover:underline transition-all">Create free account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
