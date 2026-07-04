import { useState, useRef, useEffect } from "react";
import { ArrowUp, User, Bot, Loader2, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import API_BASE_URL from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    notes: string;
    videoTitle?: string;
    embedded?: boolean;
    promptToSend?: string | null;
    onPromptSent?: () => void;
}

export function ChatInterface({ notes, videoTitle, embedded = false, promptToSend, onPromptSent }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hi! I've analyzed the video notes for **"${videoTitle || 'this video'}"**. I can help clarify any points or answer questions about the content. What would you like to know?`
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const sendPrompt = async (promptText: string) => {
        if (!promptText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: promptText
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
                    context: notes,
                    videoTitle
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I encountered an error while processing your request. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (promptToSend && promptToSend.trim()) {
            sendPrompt(promptToSend);
            onPromptSent?.();
        }
    }, [promptToSend]);

    const handleSend = async () => {
        await sendPrompt(input);
    };

    return (
        <div className={cn(
            "flex flex-col animate-fade-in overflow-hidden relative bg-card/20",
            embedded ? "h-full" : "h-[650px] mt-6 bg-card rounded-3xl border border-border/40 shadow-sm"
        )}>
            {/* Scroll Container */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 relative z-10 w-full">
                <div className="pb-28 pt-4 space-y-4 px-3 sm:px-6">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "w-full flex",
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div className={cn(
                                "flex gap-2.5 max-w-[92%] sm:max-w-2xl",
                                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            )}>
                                {/* Compact Avatar */}
                                <div className="shrink-0 mt-0.5 hidden sm:block">
                                    {msg.role === 'user' ? (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <User className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col min-w-0">
                                    {/* Role header (clean inline metadata) */}
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-wider mb-1 px-1",
                                        msg.role === 'user' ? 'text-primary self-end' : 'text-muted-foreground'
                                    )}>
                                        {msg.role === 'user' ? 'You' : 'ScriptMind Assistant'}
                                    </span>

                                    {/* Text Box */}
                                    <div className={cn(
                                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed border shadow-sm transition-all duration-150",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground border-transparent rounded-tr-sm"
                                            : "bg-card border-border/50 rounded-tl-sm text-foreground"
                                    )}>
                                        <div className={cn(
                                            "prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/10 dark:prose-pre:bg-white/5 prose-pre:border-none",
                                            msg.role === 'user' && "prose-p:text-primary-foreground text-primary-foreground prose-strong:text-white prose-code:text-white"
                                        )}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loader */}
                    {isLoading && (
                        <div className="w-full flex justify-start">
                            <div className="flex gap-2.5 flex-row max-w-[92%] sm:max-w-2xl">
                                <div className="shrink-0 mt-0.5 hidden sm:block">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <Bot className="w-4 h-4 animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                        Assistant
                                    </span>
                                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-card border border-border/40 rounded-2xl rounded-tl-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Bar */}
            <div className="shrink-0 border-t border-border/40 bg-card/60 backdrop-blur-md p-3 sm:p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="relative flex items-center bg-card border border-border/50 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 rounded-2xl transition-all duration-150 p-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about this video..."
                            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm text-foreground h-10 px-3 placeholder:text-muted-foreground/45"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="h-8 w-8 rounded-full transition-all duration-150 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md mr-1 hover:scale-105 active:scale-95 flex items-center justify-center"
                        >
                            <ArrowUp className="h-4 w-4 stroke-[3px]" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
