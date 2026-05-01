
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface FlashcardProps {
    id: number;
    front: string;
    back: string;
}

export function Flashcard({ id, front, back }: FlashcardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="group perspective-1000 w-full h-64 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div
                className={cn(
                    "relative w-full h-full transition-all duration-700 transform-style-3d shadow-xl rounded-2xl",
                    isFlipped ? "rotate-y-180" : ""
                )}
            >
                {/* Front */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-secondary/50 to-secondary/10 border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xl font-bold text-foreground leading-relaxed">{front}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-70">
                        <ArrowLeftRight className="w-3 h-3" /> Click to reveal
                    </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar">
                        <p className="text-lg text-foreground leading-relaxed">{back}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-primary uppercase tracking-widest font-medium opacity-70">
                        <RotateCcw className="w-3 h-3" /> Click to flip back
                    </div>
                </div>
            </div>
        </div>
    );
}
