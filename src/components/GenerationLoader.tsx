import React, { useState, useEffect } from 'react';
import { CheckCircle2, Youtube, Search, FileText, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
    { id: 1, label: 'Connecting to YouTube', icon: Youtube, desc: 'Verifying playlist availability and checking stream endpoint...' },
    { id: 2, label: 'Fetching Video Metadata', icon: Search, desc: 'Downloading high-resolution thumbnails and video details...' },
    { id: 3, label: 'Extracting Transcript', icon: FileText, desc: 'Retrieving closed captions, timestamps, and audio records...' },
    { id: 4, label: 'AI Content Analysis', icon: BrainCircuit, desc: 'Processing natural language structure and key topics...' },
    { id: 5, label: 'Generating Study Notes', icon: Sparkles, desc: 'Structuring chapters, summary points, and takeaways...' },
];

export function GenerationLoader() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < steps.length - 1) return prev + 1;
                return prev;
            });
        }, 3000); // Progress every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const ActiveIcon = steps[currentStep].icon;

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto animate-in fade-in duration-700">
            {/* Custom Embedded Scoped Styles for CSS Keyframes */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin-cw {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes spin-ccw {
                    0% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes orbit-pulse {
                    0%, 100% { opacity: 0.35; transform: scale(1); }
                    50% { opacity: 0.65; transform: scale(1.05); }
                }
                .animate-spin-cw {
                    animation: spin-cw 12s linear infinite;
                }
                .animate-spin-ccw {
                    animation: spin-ccw 10s linear infinite;
                }
                .animate-orbit-pulse {
                    animation: orbit-pulse 4s ease-in-out infinite;
                }
            `}} />

            {/* --- COSMIC ORBIT SECTION --- */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                {/* Background Ambient Radial Glow */}
                <div className="absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent blur-2xl rounded-full scale-125 animate-orbit-pulse" />

                {/* Outer Ring 1 - Dashed Clockwise */}
                <div className="absolute w-52 h-52 rounded-full border border-dashed border-primary/20 animate-spin-cw" />

                {/* Outer Ring 2 - Dotted Counter-Clockwise */}
                <div className="absolute w-44 h-44 rounded-full border border-dotted border-purple-500/25 animate-spin-ccw" />

                {/* Inner Ring 3 - Solid Clockwise */}
                <div className="absolute w-36 h-36 rounded-full border border-primary/30 border-t-transparent animate-spin-cw" />

                {/* Central AI Nucleus */}
                <div className="relative w-24 h-24 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.25)] overflow-hidden">
                    {/* Pulsing ring layer */}
                    <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping scale-110 opacity-75" />
                    
                    {/* Shifting Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-purple-600/10 to-indigo-500/20 opacity-80" />
                    
                    {/* Dynamic Active Step Icon */}
                    <div className="relative z-10 text-primary transition-all duration-500 transform scale-100">
                        <ActiveIcon className="h-10 w-10 text-primary drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] animate-pulse" />
                    </div>
                </div>
            </div>

            {/* --- TEXT TITLES --- */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.15)] uppercase mb-2">
                    Creating your Study Suite
                </h2>
                <p className="text-muted-foreground text-xs font-medium">Please wait while our AI processes the video content...</p>
            </div>

            {/* --- STEPPERS SECTION --- */}
            <div className="relative w-full max-w-sm space-y-6">
                {/* Dynamic Flowing Gradient Connector Line */}
                <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-white/5 rounded-full pointer-events-none overflow-hidden">
                    <div 
                        className="w-full bg-gradient-to-b from-primary via-purple-500 to-indigo-600 transition-all duration-1000 ease-in-out shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                        style={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-start gap-4 p-3.5 rounded-2xl border transition-all duration-500 relative z-10",
                                isActive 
                                    ? "bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.06)] scale-[1.03] backdrop-blur-sm" 
                                    : "bg-transparent border-transparent opacity-40"
                            )}
                        >
                            {/* Step Node */}
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                isCompleted 
                                    ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]" 
                                    : isActive 
                                        ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]" 
                                        : "bg-white/5 text-muted-foreground/30 border-white/5"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>

                            {/* Label & Details */}
                            <div className="flex-1 space-y-1 text-left min-w-0">
                                <p className={cn(
                                    "font-bold text-sm transition-colors duration-500 tracking-wide",
                                    isActive ? "text-white" : isCompleted ? "text-white/70" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </p>
                                
                                {isActive && (
                                    <p className="text-[11px] text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-500 leading-normal">
                                        {step.desc}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
