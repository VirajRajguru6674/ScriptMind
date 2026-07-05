
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle, Youtube, Search, FileText, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
    { id: 1, label: 'Connecting to YouTube', icon: Youtube },
    { id: 2, label: 'Fetching Video Metadata', icon: Search },
    { id: 3, label: 'Extracting Transcript', icon: FileText },
    { id: 4, label: 'AI Content Analysis', icon: BrainCircuit },
    { id: 5, label: 'Generating Study Notes', icon: Sparkles },
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

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto animate-in fade-in duration-700">
            <div className="relative mb-12">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150"></div>
                <div className="relative bg-primary/10 p-6 rounded-full">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </div>

            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-2">Creating your Study Suite</h2>
                <p className="text-muted-foreground text-sm">Please wait while our AI processes the video content...</p>
            </div>

            <div className="w-full space-y-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                                isActive ? "bg-primary/5 border-primary/20 scale-105 shadow-sm" : "bg-transparent border-transparent opacity-50"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500",
                                isCompleted ? "bg-green-500/10 text-green-500" :
                                    isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>

                            <div className="flex-1">
                                <p className={cn(
                                    "font-semibold text-sm transition-colors duration-500",
                                    isActive ? "text-foreground" : isCompleted ? "text-foreground/70" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </p>
                                {isActive && (
                                    <div className="h-1 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-primary animate-progress-indefinite" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
