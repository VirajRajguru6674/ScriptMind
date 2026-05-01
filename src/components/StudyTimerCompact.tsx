import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function StudyTimerCompact() {
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            setIsActive(false);
        }

        return () => { if (interval) clearInterval(interval); };
    }, [isActive, time]);

    const toggleTimer = () => setIsActive(!isActive);

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
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-lg ${mode === 'focus' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'}`}>
                                <Timer className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold">Focus Timer</span>
                            <span className="text-xs tabular-nums text-muted-foreground">{formatTime(time)}</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/30 pt-2">
                        <div className="flex bg-secondary/50 rounded-lg p-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); switchMode('focus'); }}
                                className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${mode === 'focus' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Focus
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); switchMode('break'); }}
                                className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${mode === 'break' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Break
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
                            >
                                {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => { e.stopPropagation(); resetTimer(); }}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <div
                            className="h-0.5 bg-primary/30 rounded-full overflow-hidden transition-all duration-500"
                            style={{ width: '100%' }}
                        >
                            <div
                                className="h-full bg-primary transition-all duration-1000 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
