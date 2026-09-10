
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import API_BASE_URL from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Sparkles, Youtube, BookOpen, Brain, Zap, KeyRound, ShieldCheck, Lock, ArrowLeft, Loader2 } from "lucide-react";

// --- Internal Animated Components (Mirrored from Login/Register) ---

interface PupilProps {
    size?: number;
    maxDistance?: number;
    pupilColor?: string;
    forceLookX?: number;
    forceLookY?: number;
}

const Pupil = ({
    size = 22,
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

// --- Main ForgotPassword Component ---

type Step = 'email' | 'otp' | 'password';

const ForgotPassword = () => {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const { toast } = useToast();
    const navigate = useNavigate();

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
        if ((step === 'password' && newPassword.length > 0 && showPassword)) {
            const interval = setInterval(() => {
                setIsPurplePeeking(true);
                setTimeout(() => setIsPurplePeeking(false), 900);
            }, Math.random() * 3000 + 3500);
            return () => clearInterval(interval);
        }
    }, [step, newPassword, showPassword]);

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

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

            setStep('otp');
            toast({ title: "OTP Sent", description: "Please check your email and Teams for the code." });
        } catch (error: any) {
            setError(error.message);
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Invalid OTP');

            setStep('password');
            toast({ title: "Verified", description: "You can now set a new password." });
        } catch (error: any) {
            setError(error.message);
            toast({ variant: "destructive", title: "Verification Failed", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to reset password');

            toast({ title: "Success", description: "Password updated! You can now login." });
            navigate('/login');
        } catch (error: any) {
            setError(error.message);
            toast({ variant: "destructive", title: "Reset Failed", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const isPeekActive = (step === 'password' && newPassword.length > 0 && showPassword);

    return (
        <div className="min-h-screen flex items-stretch bg-[#0F1115] overflow-hidden selection:bg-primary/30">
            <Helmet>
                <title>Reset Password | ScriptMind AI</title>
            </Helmet>

            {/* Characters Illustration - Left Side */}
            <div className="relative hidden lg:flex flex-1 xl:flex-[1.2] flex-col justify-between bg-gradient-to-br from-[#1E2028] via-[#16181D] to-[#0F1115] p-8 xl:p-16 overflow-hidden border-r border-white/5">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <Brain className="absolute top-[10%] left-[10%] w-12 h-12 text-blue-500/20 animate-pulse" />
                    <Zap className="absolute top-[30%] right-[15%] w-8 h-8 text-yellow-500/20 animate-bounce" style={{ animationDuration: '3s' }} />
                    <BookOpen className="absolute bottom-[20%] left-[15%] w-10 h-10 text-emerald-500/20 animate-pulse" style={{ animationDuration: '4s' }} />
                    <Youtube className="absolute bottom-[40%] right-[10%] w-14 h-14 text-red-500/20 animate-pulse" style={{ animationDuration: '5s' }} />
                </div>

                <div className="relative z-20 space-y-8">
                    <div className="flex items-center gap-4 group">
                        <div className="size-12 rounded-2xl overflow-hidden border border-primary/30 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <img src="/logo.png" alt="ScriptMind Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white leading-tight">ScriptMind</h2>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">AI Genius Learning</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-xs animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
                        <h3 className="text-xl font-bold text-white/90">Your knowledge is safe with us.</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We take security seriously. Use our multi-channel verification to
                            securely recover your account and continue your research.
                        </p>
                    </div>
                </div>

                <div className="relative z-20 flex items-end justify-center h-[500px] xl:h-[550px] translate-y-8">
                    <div className="relative scale-75 xl:scale-100 origin-bottom" style={{ width: '550px', height: '450px' }}>
                        {/* Main Character */}
                        <div ref={purpleRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl" style={{
                            left: '70px', width: '180px', zIndex: 1, backgroundColor: 'hsl(var(--primary))', borderRadius: '15px 15px 0 0',
                            height: (isTyping || isPeekActive) ? '460px' : '400px',
                            transformOrigin: 'bottom center',
                            transform: isPeekActive ? 'skewX(0deg)' : (isTyping) ? `skewX(${pPos.skew - 12}deg) translateX(40px)` : `skewX(${pPos.skew}deg)`
                        }}>
                            <div className="absolute top-4 left-4 w-12 h-4 bg-white/10 rounded-full blur-[2px]" />
                            <div className="absolute flex gap-8 transition-all duration-700 ease-in-out" style={{
                                left: isPeekActive ? '30px' : isLookingAtEachOther ? '60px' : `${50 + pPos.x}px`,
                                top: isPeekActive ? '45px' : isLookingAtEachOther ? '75px' : `${50 + pPos.y}px`,
                            }}>
                                <EyeBall size={36} pupilSize={16} maxDistance={8} isBlinking={isPurpleBlinking} forceLookX={isPeekActive ? (isPurplePeeking ? 6 : -6) : isLookingAtEachOther ? 4 : undefined} />
                                <EyeBall size={36} pupilSize={16} maxDistance={8} isBlinking={isPurpleBlinking} forceLookX={isPeekActive ? (isPurplePeeking ? 6 : -6) : isLookingAtEachOther ? 4 : undefined} />
                            </div>
                        </div>

                        <div ref={blackRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl" style={{
                            left: '240px', width: '130px', height: '330px', zIndex: 2, backgroundColor: '#1A1A1A', borderRadius: '12px 12px 0 0',
                            transformOrigin: 'bottom center',
                            transform: isPeekActive ? 'skewX(0deg)' : isLookingAtEachOther ? `skewX(${bPos.skew * 1.5 + 10}deg) translateX(25px)` : `skewX(${bPos.skew * 1.5}deg)`
                        }}>
                            <div className="absolute flex gap-6 transition-all duration-700 ease-in-out" style={{
                                left: isPeekActive ? '15px' : isLookingAtEachOther ? '35px' : `${30 + bPos.x}px`,
                                top: isPeekActive ? '35px' : isLookingAtEachOther ? '20px' : `${40 + bPos.y}px`,
                            }}>
                                <EyeBall size={30} pupilSize={14} maxDistance={6} isBlinking={isBlackBlinking} forceLookX={isPeekActive ? -6 : isLookingAtEachOther ? 0 : undefined} />
                                <EyeBall size={30} pupilSize={14} maxDistance={6} isBlinking={isBlackBlinking} forceLookX={isPeekActive ? -6 : isLookingAtEachOther ? 0 : undefined} />
                            </div>
                        </div>

                        {/* Accent 1 */}
                        <div ref={orangeRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-[-10px_0_20px_rgba(0,0,0,0.1)]" style={{
                            left: '0px', width: '260px', height: '220px', zIndex: 3, backgroundColor: 'hsl(var(--destructive))', borderRadius: '130px 130px 0 0',
                            transformOrigin: 'bottom center', transform: isPeekActive ? 'skewX(0deg)' : `skewX(${oPos.skew}deg)`
                        }}>
                            <div className="absolute flex gap-10 transition-all duration-200" style={{
                                left: isPeekActive ? '60px' : `${90 + oPos.x}px`, top: isPeekActive ? '95px' : `${100 + oPos.y}px`,
                            }}>
                                <Pupil size={22} forceLookX={isPeekActive ? -7 : undefined} />
                                <Pupil size={22} forceLookX={isPeekActive ? -7 : undefined} />
                            </div>
                        </div>

                        {/* Accent 2 */}
                        <div ref={yellowRef} className="absolute bottom-0 transition-all duration-700 ease-in-out shadow-2xl" style={{
                            left: '320px', width: '150px', height: '240px', zIndex: 4, backgroundColor: 'hsl(var(--ring))', borderRadius: '75px 75px 0 0',
                            transformOrigin: 'bottom center', transform: isPeekActive ? 'skewX(0deg)' : `skewX(${yPos.skew}deg)`
                        }}>
                            <div className="absolute flex gap-7" style={{ left: isPeekActive ? '25px' : `${58 + yPos.x}px`, top: isPeekActive ? '40px' : `${45 + yPos.y}px` }}>
                                <Pupil size={22} forceLookX={isPeekActive ? -8 : undefined} />
                                <Pupil size={22} forceLookX={isPeekActive ? -8 : undefined} />
                            </div>
                            <div className="absolute w-24 h-[5px] bg-[#1A1A1A] rounded-full" style={{ left: isPeekActive ? '12px' : `${45 + yPos.x}px`, top: '95px' }} />
                        </div>
                    </div>
                </div>

                <div className="relative z-20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-6">
                        <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                    <p>© 2026 ScriptMind AI Studio</p>
                </div>
            </div>

            {/* Forgot Password Form Section - Right Side */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#0F1115] relative">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

                <div className="w-full max-w-[440px] relative z-10 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                            <KeyRound className="size-3" /> Security
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-white">
                            {step === 'email' && "Reset your password."}
                            {step === 'otp' && "Verify your identity."}
                            {step === 'password' && "Setup new password."}
                        </h1>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            {step === 'email' && "Enter your email to receive a secure 6-digit OTP code."}
                            {step === 'otp' && `We've sent a code to ${email}. Check your Outlook/Teams.`}
                            {step === 'password' && "Set a strong password to protect your ScriptMind account."}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {step === 'email' && (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-3 group">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Email Address</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onFocus={() => setIsTyping(true)}
                                            onBlur={() => setIsTyping(false)}
                                            required
                                            placeholder="name@company.com"
                                            className="h-14 bg-[#16181D] border-white/5 rounded-2xl focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-muted-foreground/30 px-6 transition-all"
                                        />
                                        <Mail className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)]" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Request OTP Code"}
                                </Button>
                            </form>
                        )}

                        {step === 'otp' && (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div className="space-y-3 group">
                                    <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">6-Digit Code</Label>
                                    <div className="relative">
                                        <Input
                                            id="otp"
                                            type="text"
                                            value={otp}
                                            onChange={e => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                            placeholder="000 000"
                                            className="h-14 bg-[#16181D] border-white/5 rounded-2xl focus:border-primary/50 focus:ring-primary/20 text-white text-center text-2xl tracking-[0.5em] font-black transition-all"
                                        />
                                        <ShieldCheck className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)]" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verify Identity"}
                                </Button>
                                <Button variant="ghost" className="w-full text-muted-foreground hover:text-white" onClick={() => setStep('email')}>
                                    Use a different email
                                </Button>
                            </form>
                        )}

                        {step === 'password' && (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-3 group">
                                    <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            onFocus={() => setIsTyping(true)}
                                            onBlur={() => setIsTyping(false)}
                                            placeholder="••••••••••••"
                                            className="h-14 bg-[#16181D] border-white/5 rounded-2xl focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-muted-foreground/30 px-6 transition-all"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors">
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3 group">
                                    <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                            onFocus={() => setIsTyping(true)}
                                            onBlur={() => setIsTyping(false)}
                                            placeholder="••••••••••••"
                                            className="h-14 bg-[#16181D] border-white/5 rounded-2xl focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-muted-foreground/30 px-6 transition-all"
                                        />
                                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-[0_10px_30px_rgba(var(--primary),0.3)]" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Update Password"}
                                </Button>
                            </form>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-shake">
                                <div className="size-1.5 rounded-full bg-red-500 animate-ping" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-white/5 text-center">
                        <Link to="/login" className="inline-flex items-center text-white font-black hover:text-primary hover:underline transition-all gap-2">
                            <ArrowLeft className="size-4" /> Back to Account Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
