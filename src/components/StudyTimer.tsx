
import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudyTimer() {
    const [time, setTime] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');

    useEffect(() => {
        let interval: any = null;

        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            setIsActive(false);
            // Optional: Play sound here
        }

        return () => clearInterval(interval);
    }, [isActive, time]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTime(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode: 'focus' | 'break') => {
        setMode(newMode);
        setIsActive(false);
        setTime(newMode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'focus'
        ? ((25 * 60 - time) / (25 * 60)) * 100
        : ((5 * 60 - time) / (5 * 60)) * 100;

    return (
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            {/* Progress Bar Background */}
            <div
                className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
            />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${mode === 'focus' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'}`}>
                        <Timer className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Focus Timer</span>
                </div>
                <div className="flex bg-secondary/50 rounded-lg p-0.5">
                    <button
                        onClick={() => switchMode('focus')}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${mode === 'focus' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Focus
                    </button>
                    <button
                        onClick={() => switchMode('break')}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${mode === 'break' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Break
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-3xl font-black tabular-nums tracking-tight text-foreground">
                    {formatTime(time)}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-border/50 hover:bg-secondary hover:text-foreground"
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
