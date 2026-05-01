
import { Clock, BookOpen, Sparkles } from "lucide-react";

interface SessionStatsProps {
    wordCount: number;
}

export function SessionStats({ wordCount }: SessionStatsProps) {
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-foreground">{wordCount}</div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Words</div>
                </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-xl font-bold text-foreground">{readingTime} <span className="text-xs font-normal text-muted-foreground">min</span></div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Read Time</div>
                </div>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3 md:col-span-2 justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
                        <Sparkles className="w-5 h-5 fill-amber-500" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-foreground">AI Analysis</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</div>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20">
                    Complete
                </div>
            </div>
        </div>
    );
}
